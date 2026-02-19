import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_SELL_API = "https://api.ebay.com/sell/inventory/v1";

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

    const { limit = 50, offset = 0 } = await req.json();

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
        JSON.stringify({ error: "eBay not connected", listings: [], totalCount: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get valid access token
    const accessToken = await refreshAccessTokenIfNeeded(connection, supabaseAdmin, user.id);

    // Fetch inventory items from eBay
    // Note: The Sell Inventory API gets your inventory items
    const inventoryUrl = `${EBAY_SELL_API}/inventory_item?limit=${limit}&offset=${offset}`;
    
    const inventoryResponse = await fetch(inventoryUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!inventoryResponse.ok) {
      const errorText = await inventoryResponse.text();
      console.error("eBay Inventory API error:", errorText);
      
      // If 403 or 401, the token might be invalid
      if (inventoryResponse.status === 401 || inventoryResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "eBay authorization expired. Please reconnect.", listings: [], totalCount: 0 }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to fetch eBay listings", listings: [], totalCount: 0 }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inventoryData = await inventoryResponse.json();
    const inventoryItems = inventoryData.inventoryItems || [];

    // Also get offers to get pricing info
    // Offers contain the actual listing prices
    const offersUrl = `${EBAY_SELL_API}/offer?limit=${limit}&offset=${offset}`;
    
    let offersMap: Map<string, any> = new Map();
    try {
      const offersResponse = await fetch(offersUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        (offersData.offers || []).forEach((offer: any) => {
          offersMap.set(offer.sku, offer);
        });
      }
    } catch (e) {
      console.warn("Could not fetch offers:", e);
    }

    // Transform to CardLedger format
    const listings = inventoryItems.map((item: any) => {
      const offer = offersMap.get(item.sku);
      const product = item.product || {};
      const imageUrl = product.imageUrls?.[0] || null;
      
      return {
        itemId: item.sku,
        title: product.title || item.sku,
        imageUrl: imageUrl,
        price: offer?.pricingSummary?.price?.value ? parseFloat(offer.pricingSummary.price.value) : 0,
        currency: offer?.pricingSummary?.price?.currency || "USD",
        quantity: item.availability?.shipToLocationAvailability?.quantity || 1,
        quantityAvailable: item.availability?.shipToLocationAvailability?.quantity || 1,
        condition: item.condition || "NEW",
        listingStatus: offer?.status || "ACTIVE",
        createdAt: item.createdDate || new Date().toISOString(),
        categoryId: offer?.categoryId,
      };
    });

    console.log(`eBay listings fetched: ${listings.length} items for user ${user.id}`);

    return new Response(
      JSON.stringify({
        listings,
        totalCount: inventoryData.total || listings.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("eBay get listings error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", listings: [], totalCount: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
