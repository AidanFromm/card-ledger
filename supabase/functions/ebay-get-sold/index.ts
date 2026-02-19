import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_FULFILLMENT_API = "https://api.ebay.com/sell/fulfillment/v1";

/**
 * Refresh access token if needed
 */
async function refreshAccessTokenIfNeeded(
  connection: any,
  supabaseAdmin: any,
  userId: string
): Promise<string> {
  const now = new Date();
  const tokenExpires = new Date(connection.access_token_expires_at);

  // If token is still valid (with 5 min buffer), return it
  if (tokenExpires.getTime() - now.getTime() > 5 * 60 * 1000) {
    return connection.access_token;
  }

  // Need to refresh
  const EBAY_CLIENT_ID = Deno.env.get("EBAY_CLIENT_ID");
  const EBAY_CLIENT_SECRET = Deno.env.get("EBAY_CLIENT_SECRET");
  
  const credentials = btoa(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`);
  
  const response = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const tokenData = await response.json();
  const accessTokenExpires = new Date(now.getTime() + tokenData.expires_in * 1000);

  // Update the stored tokens
  await supabaseAdmin
    .from("ebay_connections")
    .update({
      access_token: tokenData.access_token,
      access_token_expires_at: accessTokenExpires.toISOString(),
      // Refresh token may also be rotated
      ...(tokenData.refresh_token && {
        refresh_token: tokenData.refresh_token,
        refresh_token_expires_at: new Date(
          now.getTime() + tokenData.refresh_token_expires_in * 1000
        ).toISOString(),
      }),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);

  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { daysBack = 30, limit = 50, offset = 0 } = await req.json();

    // Get eBay connection
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: connection, error: connectionError } = await supabaseAdmin
      .from("ebay_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ error: "eBay not connected", soldItems: [], totalCount: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get valid access token
    const accessToken = await refreshAccessTokenIfNeeded(connection, supabaseAdmin, user.id);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    // Format dates for eBay API (ISO 8601)
    const creationDateRange = `[${startDate.toISOString()}..${endDate.toISOString()}]`;

    // Fetch orders from eBay Fulfillment API
    // Filter for orders that have been paid/completed
    const ordersUrl = new URL(`${EBAY_FULFILLMENT_API}/order`);
    ordersUrl.searchParams.set("limit", limit.toString());
    ordersUrl.searchParams.set("offset", offset.toString());
    ordersUrl.searchParams.set("filter", `creationdate:${creationDateRange}`);
    
    const ordersResponse = await fetch(ordersUrl.toString(), {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error("eBay Fulfillment API error:", errorText);
      
      if (ordersResponse.status === 401 || ordersResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "eBay authorization expired. Please reconnect.", soldItems: [], totalCount: 0 }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to fetch eBay orders", soldItems: [], totalCount: 0 }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ordersData = await ordersResponse.json();
    const orders = ordersData.orders || [];

    // Transform orders to sold items
    const soldItems = orders.flatMap((order: any) => {
      const lineItems = order.lineItems || [];
      
      return lineItems.map((item: any) => {
        const imageUrl = item.lineItemFulfillmentInstructions?.image?.imageUrl || null;
        const salePrice = parseFloat(item.lineItemCost?.value || "0");
        const shippingCost = parseFloat(item.deliveryCost?.shippingCost?.value || "0");
        
        return {
          orderId: order.orderId,
          itemId: item.legacyItemId || item.lineItemId,
          title: item.title || "Unknown Item",
          imageUrl: imageUrl,
          salePrice: salePrice,
          shippingCost: shippingCost,
          totalPrice: salePrice + shippingCost,
          currency: item.lineItemCost?.currency || "USD",
          quantity: item.quantity || 1,
          soldDate: order.creationDate || new Date().toISOString(),
          buyerUsername: order.buyer?.username || "Unknown",
          orderStatus: order.orderFulfillmentStatus || "UNKNOWN",
        };
      });
    });

    console.log(`eBay sold items fetched: ${soldItems.length} items for user ${user.id}`);

    return new Response(
      JSON.stringify({
        soldItems,
        totalCount: ordersData.total || soldItems.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("eBay get sold items error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", soldItems: [], totalCount: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
