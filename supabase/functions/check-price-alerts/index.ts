// Supabase Edge Function: check-price-alerts
// This function runs periodically to check if any price alerts should be triggered
// 
// To deploy: supabase functions deploy check-price-alerts
// To set up cron: Use Supabase dashboard or pg_cron to schedule this

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PriceAlert {
  id: string;
  user_id: string;
  card_id: string;
  card_name: string;
  set_name: string | null;
  current_price: number | null;
  target_price: number;
  direction: "above" | "below";
  is_active: boolean;
  triggered_at: string | null;
}

interface PriceCheckResult {
  alertId: string;
  cardName: string;
  triggered: boolean;
  currentPrice: number | null;
  targetPrice: number;
  direction: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active alerts that haven't been triggered
    const { data: alerts, error: fetchError } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("is_active", true)
      .is("triggered_at", null);

    if (fetchError) {
      throw new Error(`Failed to fetch alerts: ${fetchError.message}`);
    }

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No active alerts to check",
          checked: 0,
          triggered: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking ${alerts.length} active alerts...`);

    const results: PriceCheckResult[] = [];
    let triggeredCount = 0;

    // Process each alert
    for (const alert of alerts as PriceAlert[]) {
      try {
        // Get current price for the card
        // This calls the existing scrydex-price function or fetches from products table
        const currentPrice = await getCurrentPrice(supabase, alert);

        if (currentPrice === null) {
          console.log(`Could not get price for ${alert.card_name}`);
          results.push({
            alertId: alert.id,
            cardName: alert.card_name,
            triggered: false,
            currentPrice: null,
            targetPrice: alert.target_price,
            direction: alert.direction,
          });
          continue;
        }

        // Update the current price on the alert record
        await supabase
          .from("price_alerts")
          .update({ current_price: currentPrice })
          .eq("id", alert.id);

        // Check if alert should trigger
        let shouldTrigger = false;
        if (alert.direction === "below" && currentPrice <= alert.target_price) {
          shouldTrigger = true;
        } else if (alert.direction === "above" && currentPrice >= alert.target_price) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          // Mark alert as triggered
          await supabase
            .from("price_alerts")
            .update({ 
              triggered_at: new Date().toISOString(),
              current_price: currentPrice,
            })
            .eq("id", alert.id);

          triggeredCount++;
          console.log(`Alert triggered: ${alert.card_name} is now $${currentPrice} (target: ${alert.direction} $${alert.target_price})`);

          // TODO: Send push notification to user
          // This would integrate with a push notification service
          // await sendPushNotification(alert.user_id, {
          //   title: "Price Alert Triggered!",
          //   body: `${alert.card_name} is now $${currentPrice}`,
          // });
        }

        results.push({
          alertId: alert.id,
          cardName: alert.card_name,
          triggered: shouldTrigger,
          currentPrice,
          targetPrice: alert.target_price,
          direction: alert.direction,
        });

      } catch (err) {
        console.error(`Error processing alert ${alert.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: alerts.length,
        triggered: triggeredCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-price-alerts:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Helper function to get current price for a card
async function getCurrentPrice(supabase: any, alert: PriceAlert): Promise<number | null> {
  try {
    // First try to get from inventory_items if card_id is an inventory item
    const { data: inventoryItem } = await supabase
      .from("inventory_items")
      .select("market_price")
      .eq("id", alert.card_id)
      .single();

    if (inventoryItem?.market_price) {
      return inventoryItem.market_price;
    }

    // Try to get from products table
    const { data: product } = await supabase
      .from("products")
      .select("market_price")
      .eq("id", alert.card_id)
      .single();

    if (product?.market_price) {
      return product.market_price;
    }

    // If we have the card name and set, we could call an external API
    // For now, return the last known current_price from the alert
    return alert.current_price;

  } catch (err) {
    console.error(`Error fetching price for ${alert.card_name}:`, err);
    return alert.current_price;
  }
}
