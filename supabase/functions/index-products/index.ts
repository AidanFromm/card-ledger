import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchJsonWithRetry(url: string, timeoutMs = 40000, retries = 3): Promise<any> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(url, { 
        headers: { Accept: "application/json" }, 
        signal: controller.signal 
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      return await resp.json();
    } catch (e) {
      lastErr = e;
      console.warn(`Fetch attempt ${attempt + 1}/${retries + 1} failed:`, e instanceof Error ? e.message : String(e));
      // Exponential backoff before retry
      if (attempt < retries) {
        const backoffMs = 1000 * Math.pow(2, attempt);
        console.log(`Waiting ${backoffMs}ms before retry...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Request failed after all retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const page = Number(body?.page ?? 1);
    const pageSize = 250; // Max page size for faster import (Pokemon TCG API limit)

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Backend not configured");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    console.log(`Fetching page ${page} with ${pageSize} cards per page`);

    const url = `https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}`;
    let json: any;
    try {
      json = await fetchJsonWithRetry(url, 40000, 3);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
      console.error(`Pokemon TCG API fetch failed after retries: ${errMsg}`);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch from Pokemon TCG API: ${errMsg}`, 
          imported: 0, 
          updated: 0,
          skipped: 0,
          page,
          hasMore: true 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cards: any[] = json?.data || [];
    const totalCount = json?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    console.log(`Processing ${cards.length} cards from page ${page}/${totalPages}`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Process cards in small parallel batches
    const batchSize = 10;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (card) => {
          try {
            const pokemon_tcg_id = card.id as string;
            const name = card.name as string;
            const set_name = (card.set?.name as string) || null;
            const card_number = (card.number as string) || null;
            const image_url = (card.images?.large as string) || (card.images?.small as string) || null;
            const rarity = (card.rarity as string) || null;
            const subtypes = (card.subtypes as string[]) || [];
            const artist = (card.artist as string) || null;

            // Fetch ungraded market price from Scrydex API
            let market_price: number | null = null;
            try {
              const SCRYDEX_API_KEY = Deno.env.get('SCRYDEX_API_KEY');
              const SCRYDEX_TEAM_ID = Deno.env.get('SCRYDEX_TEAM_ID');
              
              if (SCRYDEX_API_KEY && SCRYDEX_TEAM_ID && card_number && set_name) {
                // Construct Scrydex API URL for pricing
                const scrydexUrl = `https://api.scrydex.com/v1/teams/${SCRYDEX_TEAM_ID}/cards/pokemon/${encodeURIComponent(set_name)}/${encodeURIComponent(card_number)}`;
                
                const scrydexResponse = await fetch(scrydexUrl, {
                  headers: {
                    'Authorization': `Bearer ${SCRYDEX_API_KEY}`,
                    'Accept': 'application/json'
                  }
                });
                
                if (scrydexResponse.ok) {
                  const scrydexData = await scrydexResponse.json();
                  // Get market price from Scrydex (ungraded/raw price)
                  if (scrydexData?.market_price) {
                    market_price = scrydexData.market_price;
                    console.log(`Scrydex price for ${name} #${card_number}: $${market_price}`);
                  }
                }
              }
            } catch (priceErr) {
              console.error(`Error fetching Scrydex price for ${name}:`, priceErr);
            }
            
            // Fallback to TCGPlayer data if Scrydex didn't return a price
            if (!market_price) {
              const getPriceFromVariant = (variant: any) => {
                if (!variant) return null;
                return variant.mid || variant.low || variant.market || null;
              };

              market_price = 
                getPriceFromVariant(card.tcgplayer?.prices?.normal) ||
                getPriceFromVariant(card.tcgplayer?.prices?.holofoil) ||
                getPriceFromVariant(card.tcgplayer?.prices?.reverseHolofoil) ||
                getPriceFromVariant(card.tcgplayer?.prices?.['1stEditionHolofoil']) ||
                getPriceFromVariant(card.tcgplayer?.prices?.unlimitedHolofoil) ||
                null;
            }

            // Check if card already exists
            const { data: existing, error: selErr } = await supabase
              .from("products")
              .select("id")
              .eq("pokemon_tcg_id", pokemon_tcg_id)
              .maybeSingle();

            if (selErr) {
              console.error(`Error checking card ${pokemon_tcg_id}:`, selErr);
              skipped++;
              return;
            }

            if (existing?.id) {
              const { error: updErr } = await supabase
                .from("products")
                .update({ 
                  name, 
                  set_name, 
                  card_number, 
                  image_url, 
                  rarity, 
                  subtypes, 
                  artist,
                  market_price,
                  last_price_update: new Date().toISOString(),
                  updated_at: new Date().toISOString() 
                })
                .eq("id", existing.id);
              if (updErr) {
                console.error(`Error updating card ${pokemon_tcg_id}:`, updErr);
                skipped++;
              } else {
                updated++;
              }
            } else {
              const { error: insErr } = await supabase.from("products").insert({
                name,
                set_name,
                card_number,
                image_url,
                rarity,
                subtypes,
                artist,
                pokemon_tcg_id,
                category: "raw",
                market_price,
                last_price_update: new Date().toISOString(),
              });
              if (insErr) {
                console.error(`Error inserting card ${pokemon_tcg_id}:`, insErr);
                skipped++;
              } else {
                imported++;
              }
            }
          } catch (err) {
            console.error("Error processing card:", err);
            skipped++;
          }
        })
      );
    }

    console.log(`Page ${page} complete: ${imported} new, ${updated} updated, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        page,
        totalPages,
        imported,
        updated,
        skipped,
        totalCards: cards.length,
        hasMore: page < totalPages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("index-products error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", imported: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
