import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ connected: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ connected: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get eBay connection (using service role to access the tokens table)
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
        JSON.stringify({ connected: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if tokens are still valid
    const now = new Date();
    const accessTokenValid = new Date(connection.access_token_expires_at) > now;
    const refreshTokenValid = new Date(connection.refresh_token_expires_at) > now;

    // If refresh token is expired, the connection is dead
    if (!refreshTokenValid) {
      // Clean up the dead connection
      await supabaseAdmin
        .from("ebay_connections")
        .delete()
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ connected: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        connected: true,
        username: connection.ebay_username,
        userId: connection.ebay_user_id,
        expiresAt: connection.refresh_token_expires_at,
        tokenValid: accessTokenValid,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("eBay connection status error:", error);
    return new Response(
      JSON.stringify({ connected: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
