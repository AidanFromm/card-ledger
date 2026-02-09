import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchWithRetry(url: string, timeoutMs = 15000, retries = 3): Promise<string> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      return await resp.text();
    } catch (e) {
      lastErr = e;
      console.warn(`Fetch attempt ${attempt + 1}/${retries + 1} failed:`, e instanceof Error ? e.message : String(e));
      if (attempt < retries) {
        const backoffMs = 2000 * Math.pow(2, attempt);
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
    const year = body?.year || 2024;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Backend not configured");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    console.log(`Scraping Pokemon.com product gallery for year ${year}`);

    // Scrape the product gallery page
    const galleryUrl = `https://www.pokemon.com/us/pokemon-tcg/product-gallery/${year}`;
    let html: string;
    
    try {
      html = await fetchWithRetry(galleryUrl, 15000, 3);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
      console.error(`Pokemon.com fetch failed: ${errMsg}`);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch product gallery: ${errMsg}`, 
          imported: 0, 
          updated: 0,
          year 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      console.error('Failed to parse HTML');
      return new Response(
        JSON.stringify({ error: 'Failed to parse product gallery page', imported: 0, updated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract product tiles (li.match elements containing actual products)
    const productTiles = doc.querySelectorAll('li.match');
    console.log(`Found ${productTiles.length} product tiles on page`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Process products in batches
    const batchSize = 5;
    for (let i = 0; i < productTiles.length; i += batchSize) {
      const batch = Array.from(productTiles).slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (tile) => {
          try {
            // Find the link within the tile
            const linkElement = (tile as any).querySelector('a');
            if (!linkElement) {
              skipped++;
              return;
            }

            const href = linkElement.getAttribute('href');
            if (!href || !href.includes('/pokemon-tcg/')) {
              skipped++;
              return;
            }

            // Extract product name from the season-info span
            const seasonInfo = (tile as any).querySelector('.season-info');
            let productName = seasonInfo?.textContent?.trim() || '';
            
            // If no season-info, try to extract from URL
            if (!productName) {
              const urlParts = href.split('/');
              const slug = urlParts[urlParts.length - 1];
              productName = slug.replace(/-/g, ' ').split(' ').map((word: string) => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
            }

            // Clean up HTML entities and tags
            productName = productName.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();

            // Find image within the image-wrapper
            const imgElement = (tile as any).querySelector('.image-wrapper img');
            const imageUrl = imgElement?.getAttribute('src') || imgElement?.getAttribute('data-src');

            if (!imageUrl) {
              console.warn(`No image found for: ${productName}`);
              skipped++;
              return;
            }

            // Determine product type and set name
            let productType = 'Special Box';
            let setName = productName;
            
            if (productName.toLowerCase().includes('ultra premium collection') || productName.toLowerCase().includes('upc')) {
              productType = 'Ultra Premium Collection';
              setName = productName.replace(/Ultra Premium Collection/i, '').replace(/UPC/i, '').trim();
            } else if (productName.toLowerCase().includes('elite trainer box') || productName.toLowerCase().includes('etb')) {
              productType = 'Elite Trainer Box';
              setName = productName.replace(/Elite Trainer Box/i, '').replace(/ETB/i, '').trim();
            } else if (productName.toLowerCase().includes('booster box')) {
              productType = 'Booster Box';
              setName = productName.replace(/Booster Box/i, '').trim();
            } else if (productName.toLowerCase().includes('booster bundle')) {
              productType = 'Booster Bundle';
              setName = productName.replace(/Booster Bundle/i, '').trim();
            } else if (productName.toLowerCase().includes('collection box')) {
              productType = 'Collection Box';
              setName = productName.replace(/Collection Box/i, '').trim();
            } else if (productName.toLowerCase().includes('premium collection')) {
              productType = 'Premium Collection';
              setName = productName.replace(/Premium Collection/i, '').trim();
            } else if (productName.toLowerCase().includes('build & battle')) {
              productType = 'Build & Battle Box';
              setName = productName.replace(/Build & Battle/i, '').trim();
            } else if (productName.toLowerCase().includes('tin')) {
              productType = 'Tin';
              setName = productName.replace(/Tin/i, '').trim();
            }

            // Clean up set name
            setName = setName.replace(/Pokémon TCG:/i, '').trim();
            
            // Create unique ID based on URL slug
            const urlParts = href.split('/');
            const slug = urlParts[urlParts.length - 1];
            const uniqueId = `sealed-pokemon-${slug}`;

            // Check if product already exists
            const { data: existing, error: selErr } = await supabase
              .from("products")
              .select("id")
              .eq("pokemon_tcg_id", uniqueId)
              .maybeSingle();

            if (selErr) {
              console.error(`Error checking product ${uniqueId}:`, selErr);
              skipped++;
              return;
            }

            if (existing?.id) {
              const { error: updErr } = await supabase
                .from("products")
                .update({ 
                  name: productName,
                  set_name: setName,
                  image_url: imageUrl.startsWith('http') ? imageUrl : `https://www.pokemon.com${imageUrl}`,
                  updated_at: new Date().toISOString() 
                })
                .eq("id", existing.id);
              if (updErr) {
                console.error(`Error updating product ${uniqueId}:`, updErr);
                skipped++;
              } else {
                updated++;
              }
            } else {
              const { error: insErr } = await supabase.from("products").insert({
                name: productName,
                set_name: setName,
                image_url: imageUrl.startsWith('http') ? imageUrl : `https://www.pokemon.com${imageUrl}`,
                pokemon_tcg_id: uniqueId,
                category: "sealed",
              });
              if (insErr) {
                console.error(`Error inserting product ${uniqueId}:`, insErr);
                skipped++;
              } else {
                imported++;
              }
            }

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 200));
          } catch (err) {
            console.error("Error processing product:", err);
            skipped++;
          }
        })
      );
    }

    console.log(`Year ${year} complete: ${imported} new, ${updated} updated, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        year,
        imported,
        updated,
        skipped,
        totalProducts: productTiles.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("index-pokemon-sealed error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", imported: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
