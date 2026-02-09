import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchPriceWithRetry(tcgId: string, retries = 3): Promise<number | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards/${tcgId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Use mid/low price for more accurate market representation
      const getPriceFromVariant = (variant: any) => {
        if (!variant) return null;
        return variant.mid || variant.low || variant.market || null;
      };
      
      const marketPrice = 
        getPriceFromVariant(data.data?.tcgplayer?.prices?.normal) ||
        getPriceFromVariant(data.data?.tcgplayer?.prices?.holofoil) ||
        getPriceFromVariant(data.data?.tcgplayer?.prices?.reverseHolofoil) ||
        getPriceFromVariant(data.data?.tcgplayer?.prices?.['1stEditionHolofoil']) ||
        getPriceFromVariant(data.data?.tcgplayer?.prices?.unlimitedHolofoil) ||
        null;
      
      return marketPrice;
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}/${retries} failed for ${tcgId}:`, error);
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // Exponential backoff
      }
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Backend not configured");
    
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    console.log("Starting market price refresh...");

    // Get all products with pokemon_tcg_id but no market_price
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, pokemon_tcg_id, name")
      .not("pokemon_tcg_id", "is", null)
      .is("market_price", null)
      .limit(1000); // Process 1000 at a time

    if (fetchError) throw fetchError;

    console.log(`Found ${products?.length || 0} products needing price updates`);

    let updated = 0;
    let failed = 0;

    // Process in small batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < (products?.length || 0); i += batchSize) {
      const batch = products!.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (product) => {
          try {
            const marketPrice = await fetchPriceWithRetry(product.pokemon_tcg_id!);
            
            if (marketPrice !== null) {
              const { error: updateError } = await supabase
                .from("products")
                .update({ 
                  market_price: marketPrice,
                  last_price_update: new Date().toISOString()
                })
                .eq("id", product.id);
              
              if (updateError) {
                console.error(`Failed to update ${product.name}:`, updateError);
                failed++;
              } else {
                updated++;
                console.log(`Updated ${product.name}: $${marketPrice.toFixed(2)}`);
              }
            } else {
              failed++;
              console.log(`No price found for ${product.name}`);
            }
          } catch (error) {
            console.error(`Error processing ${product.name}:`, error);
            failed++;
          }
        })
      );

      // Small delay between batches
      if (i + batchSize < (products?.length || 0)) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`Price refresh complete: ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        failed,
        total: products?.length || 0,
        hasMore: (products?.length || 0) >= 1000
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("refresh-market-prices error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
