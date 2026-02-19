import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";

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

    const { code } = await req.json();
    if (!code) {
      return new Response(
        JSON.stringify({ error: "Authorization code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const EBAY_CLIENT_ID = Deno.env.get("EBAY_CLIENT_ID");
    const EBAY_CLIENT_SECRET = Deno.env.get("EBAY_CLIENT_SECRET");
    const EBAY_REDIRECT_URI = Deno.env.get("EBAY_REDIRECT_URI");

    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET || !EBAY_REDIRECT_URI) {
      return new Response(
        JSON.stringify({ error: "eBay API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange code for tokens
    const credentials = btoa(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`);
    const tokenResponse = await fetch(EBAY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: EBAY_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("eBay token exchange failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to exchange authorization code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();

    // Calculate expiration times
    const now = new Date();
    const accessTokenExpires = new Date(now.getTime() + tokenData.expires_in * 1000);
    const refreshTokenExpires = new Date(now.getTime() + tokenData.refresh_token_expires_in * 1000);

    // Get eBay user info
    let ebayUsername = null;
    let ebayUserId = null;
    try {
      const userInfoResponse = await fetch(
        "https://apiz.ebay.com/commerce/identity/v1/user/",
        {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        ebayUsername = userInfo.username;
        ebayUserId = userInfo.userId;
      }
    } catch (e) {
      console.warn("Could not fetch eBay user info:", e);
    }

    // Store tokens in Supabase (using service role for secure storage)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert the eBay connection
    const { error: upsertError } = await supabaseAdmin
      .from("ebay_connections")
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        access_token_expires_at: accessTokenExpires.toISOString(),
        refresh_token_expires_at: refreshTokenExpires.toISOString(),
        ebay_username: ebayUsername,
        ebay_user_id: ebayUserId,
        updated_at: now.toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Error storing eBay tokens:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to store eBay connection" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`eBay connected for user ${user.id}, eBay username: ${ebayUsername}`);

    return new Response(
      JSON.stringify({
        success: true,
        username: ebayUsername,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("eBay OAuth exchange error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
