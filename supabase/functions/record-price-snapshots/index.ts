import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  set_name: string | null;
  card_number: string | null;
  grading_company: string | null;
  grade: string | null;
  market_price: number | null;
  lowest_listed: number | null;
  quantity: number;
  category: string;
  pokemon_tcg_id?: string;
}

interface PriceSnapshot {
  inventory_item_id: string;
  item_name: string;
  set_name: string | null;
  grading_company: string | null;
  grade: string | null;
  market_price: number;
  lowest_listed: number | null;
  price_source: string;
}

// Fetch current price from Pokemon TCG API
async function fetchPokemonTcgPrice(
  name: string,
  setName: string | null,
  cardNumber: string | null
): Promise<{ market_price: number | null; lowest_listed: number | null }> {
  try {
    const POKEMON_TCG_API_KEY = Deno.env.get("POKEMON_TCG_API_KEY");

    // Build search query
    let query = `name:"${name}"`;
    if (setName) query += ` set.name:"${setName}"`;
    if (cardNumber) {
      const normalizedNumber = cardNumber.split('/')[0].replace(/^[#\s]+/, '');
      query += ` number:${normalizedNumber}`;
    }

    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=1`;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (POKEMON_TCG_API_KEY) {
      headers['X-Api-Key'] = POKEMON_TCG_API_KEY;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) return { market_price: null, lowest_listed: null };

    const data = await response.json();
    const card = data.data?.[0];
    if (!card?.tcgplayer?.prices) return { market_price: null, lowest_listed: null };

    // Get prices from available variants
    const prices = card.tcgplayer.prices;
    const getPriceFromVariant = (variant: any) => {
      if (!variant) return null;
      return variant.market || variant.mid || variant.low || null;
    };

    const marketPrice =
      getPriceFromVariant(prices.holofoil) ||
      getPriceFromVariant(prices.normal) ||
      getPriceFromVariant(prices.reverseHolofoil) ||
      getPriceFromVariant(prices['1stEditionHolofoil']) ||
      getPriceFromVariant(prices.unlimitedHolofoil) ||
      null;

    const lowestPrice =
      prices.holofoil?.low ||
      prices.normal?.low ||
      prices.reverseHolofoil?.low ||
      null;

    return { market_price: marketPrice, lowest_listed: lowestPrice };
  } catch (error) {
    console.error(`Pokemon TCG API error for ${name}:`, error);
    return { market_price: null, lowest_listed: null };
  }
}

// Fetch current price from Scrydex API (for sealed products)
async function fetchScrydexPrice(
  name: string
): Promise<{ market_price: number | null; lowest_listed: number | null }> {
  try {
    const SCRYDEX_API_KEY = Deno.env.get("SCRYDEX_API_KEY");
    const SCRYDEX_TEAM_ID = Deno.env.get("SCRYDEX_TEAM_ID");

    if (!SCRYDEX_API_KEY || !SCRYDEX_TEAM_ID) {
      return { market_price: null, lowest_listed: null };
    }

    const url = `https://api.scrydex.com/products/search?q=${encodeURIComponent(name)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SCRYDEX_API_KEY}`,
        'X-Team-Id': SCRYDEX_TEAM_ID,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return { market_price: null, lowest_listed: null };

    const data = await response.json();
    const product = data.products?.[0];

    if (!product) return { market_price: null, lowest_listed: null };

    return {
      market_price: product.market_price || product.price || null,
      lowest_listed: product.lowest_price || null,
    };
  } catch (error) {
    console.error(`Scrydex API error for ${name}:`, error);
    return { market_price: null, lowest_listed: null };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Backend not configured");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    console.log("Starting price snapshot recording...");

    // Get all inventory items with market_price that haven't been sold
    const { data: items, error: fetchError } = await supabase
      .from("inventory_items")
      .select("id, user_id, name, set_name, card_number, grading_company, grade, market_price, lowest_listed, quantity, category")
      .gt("quantity", 0)
      .is("sale_date", null)
      .not("market_price", "is", null)
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${items?.length || 0} items to snapshot`);

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          recorded: 0,
          refreshed: 0,
          message: "No items to snapshot",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const snapshots: PriceSnapshot[] = [];
    let refreshed = 0;
    let useExisting = 0;

    // Process items in batches of 10 to avoid rate limiting
    const batchSize = 10;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (item: InventoryItem) => {
          let marketPrice = item.market_price;
          let lowestListed = item.lowest_listed;
          let priceSource = "existing";

          // Optionally refresh prices from external APIs
          // Only refresh ~10% of items per run to stay within rate limits
          const shouldRefresh = Math.random() < 0.1;

          if (shouldRefresh) {
            try {
              // Try Pokemon TCG API for cards, Scrydex for sealed
              if (item.category === "sealed") {
                const scrydexResult = await fetchScrydexPrice(item.name);
                if (scrydexResult.market_price) {
                  marketPrice = scrydexResult.market_price;
                  lowestListed = scrydexResult.lowest_listed;
                  priceSource = "scrydex";
                  refreshed++;
                }
              } else {
                const tcgResult = await fetchPokemonTcgPrice(
                  item.name,
                  item.set_name,
                  item.card_number
                );
                if (tcgResult.market_price) {
                  marketPrice = tcgResult.market_price;
                  lowestListed = tcgResult.lowest_listed;
                  priceSource = "pokemon_tcg_api";
                  refreshed++;

                  // Update the inventory item with fresh price
                  await supabase
                    .from("inventory_items")
                    .update({
                      market_price: marketPrice,
                      lowest_listed: lowestListed,
                    })
                    .eq("id", item.id);
                }
              }
            } catch (error) {
              console.error(`Error refreshing price for ${item.name}:`, error);
            }
          } else {
            useExisting++;
          }

          // Only record snapshot if we have a valid price
          if (marketPrice !== null && marketPrice > 0) {
            snapshots.push({
              inventory_item_id: item.id,
              item_name: item.name,
              set_name: item.set_name,
              grading_company: item.grading_company,
              grade: item.grade,
              market_price: marketPrice,
              lowest_listed: lowestListed,
              price_source: priceSource,
            });
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < items.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    // Batch insert all snapshots
    if (snapshots.length > 0) {
      const { error: insertError } = await supabase
        .from("price_history")
        .insert(snapshots);

      if (insertError) {
        console.error("Error inserting snapshots:", insertError);
        throw insertError;
      }
    }

    console.log(`Price snapshot complete: ${snapshots.length} recorded, ${refreshed} refreshed, ${useExisting} used existing`);

    // Run cleanup for old records (once per day)
    try {
      const { data: cleanupResult } = await supabase.rpc("cleanup_price_history");
      if (cleanupResult) {
        console.log(`Cleaned up ${cleanupResult} old price history records`);
      }
    } catch (cleanupError) {
      console.warn("Cleanup skipped:", cleanupError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        recorded: snapshots.length,
        refreshed,
        useExisting,
        total: items.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("record-price-snapshots error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
