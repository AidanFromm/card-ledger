import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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
      if (attempt < retries) {
        const backoffMs = 1000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Request failed after all retries");
}

async function scrapeTCGPlayerData(setName: string, productType: string): Promise<{ imageUrl: string | null; marketPrice: number | null }> {
  try {
    // Construct search query for TCGPlayer
    const searchTerm = `${setName} ${productType}`.replace(/\s+/g, ' ').trim();
    const searchUrl = `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(searchTerm)}&view=grid`;
    
    console.log(`Scraping TCGPlayer for: ${searchTerm}`);
    
    // Fetch the search results page with retry
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    
    if (!response.ok) {
      console.warn(`TCGPlayer returned status ${response.status} for: ${searchTerm}`);
      return { imageUrl: null, marketPrice: null };
    }
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      console.warn('Failed to parse HTML for:', searchTerm);
      return { imageUrl: null, marketPrice: null };
    }
    
    let imageUrl: string | null = null;
    let marketPrice: number | null = null;
    
    // Try multiple selectors to find product images
    const imageSelectors = [
      'img.search-result__product-image',
      'img[alt*="Product"]',
      '.product-image img',
      '.search-result img',
      'img.product-card__image'
    ];
    
    for (const selector of imageSelectors) {
      const imgElement = doc.querySelector(selector);
      if (imgElement) {
        const src = imgElement.getAttribute('src') || imgElement.getAttribute('data-src');
        if (src && src.startsWith('http')) {
          console.log(`Found image for ${searchTerm}: ${src}`);
          imageUrl = src;
          break;
        }
      }
    }
    
    // Try to extract price from TCGPlayer page
    const priceSelectors = [
      '.search-result__market-price--value',
      '.product-card__market-price',
      '.price-point--market-price',
      '[data-testid="market-price"]',
      '.market-price'
    ];
    
    for (const selector of priceSelectors) {
      const priceElement = doc.querySelector(selector);
      if (priceElement) {
        const priceText = priceElement.textContent?.trim();
        if (priceText) {
          // Extract numeric value from price text (e.g., "$45.99" -> 45.99)
          const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
          if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0) {
              console.log(`Found market price for ${searchTerm}: $${price}`);
              marketPrice = price;
              break;
            }
          }
        }
      }
    }
    
    if (!imageUrl) {
      console.warn(`No product image found for: ${searchTerm}`);
    }
    if (!marketPrice) {
      console.warn(`No market price found for: ${searchTerm}`);
    }
    
    return { imageUrl, marketPrice };
  } catch (error) {
    console.error(`Error scraping TCGPlayer for ${setName} ${productType}:`, error);
    return { imageUrl: null, marketPrice: null };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const page = Number(body?.page ?? 1);
    const pageSize = 250;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Backend not configured");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    console.log(`Fetching sealed products page ${page}`);

    // Query Pokemon TCG API for sets (each set will generate sealed product variants)
    const url = `https://api.pokemontcg.io/v2/sets?page=${page}&pageSize=${pageSize}`;
    
    let json: any;
    try {
      json = await fetchJsonWithRetry(url, 40000, 3);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown fetch error";
      console.error(`Pokemon TCG API fetch failed: ${errMsg}`);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch sealed products: ${errMsg}`, 
          imported: 0, 
          updated: 0,
          page,
          hasMore: false 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sets: any[] = json?.data || [];
    const totalCount = json?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    console.log(`Processing ${sets.length} sets to generate sealed products from page ${page}/${totalPages}`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Process sets in batches
    const batchSize = 10;
    for (let i = 0; i < sets.length; i += batchSize) {
      const batch = sets.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (set) => {
          try {
            // Generate common sealed product variants for each set
            const sealedProducts = [
              {
                name: `${set.name} Booster Box`,
                type: 'Booster Box',
                fallbackImage: set.images?.logo || set.images?.symbol || null,
              },
              {
                name: `${set.name} Elite Trainer Box`,
                type: 'Elite Trainer Box', 
                fallbackImage: set.images?.logo || set.images?.symbol || null,
              },
              {
                name: `${set.name} Ultra Premium Collection`,
                type: 'Ultra Premium Collection',
                fallbackImage: set.images?.logo || set.images?.symbol || null,
              },
              {
                name: `${set.name} Premium Collection`,
                type: 'Premium Collection',
                fallbackImage: set.images?.logo || set.images?.symbol || null,
              },
              {
                name: `${set.name} Collection Box`,
                type: 'Collection Box',
                fallbackImage: set.images?.logo || set.images?.symbol || null,
              },
              {
                name: `${set.name} Booster Bundle`,
                type: 'Booster Bundle',
                fallbackImage: set.images?.logo || set.images?.symbol || null,
              },
              {
                name: `${set.name} Booster Pack`,
                type: 'Booster Pack',
                fallbackImage: set.images?.logo || set.images?.symbol || null,
              }
            ];

            for (const product of sealedProducts) {
              // Fetch market price from Scrydex API for sealed products
              let marketPrice: number | null = null;
              let imageUrl: string | null = product.fallbackImage;
              
              try {
                const SCRYDEX_API_KEY = Deno.env.get('SCRYDEX_API_KEY');
                const SCRYDEX_TEAM_ID = Deno.env.get('SCRYDEX_TEAM_ID');
                
                if (SCRYDEX_API_KEY && SCRYDEX_TEAM_ID) {
                  // Construct Scrydex API URL for sealed product
                  const searchQuery = `${set.name} ${product.type}`;
                  const scrydexUrl = `https://api.scrydex.com/v1/teams/${SCRYDEX_TEAM_ID}/sealed-products/search?q=${encodeURIComponent(searchQuery)}`;
                  
                  const scrydexResponse = await fetch(scrydexUrl, {
                    headers: {
                      'Authorization': `Bearer ${SCRYDEX_API_KEY}`,
                      'Accept': 'application/json'
                    }
                  });
                  
                  if (scrydexResponse.ok) {
                    const scrydexData = await scrydexResponse.json();
                    if (scrydexData?.results && scrydexData.results.length > 0) {
                      const firstResult = scrydexData.results[0];
                      marketPrice = firstResult.market_price || null;
                      imageUrl = firstResult.image_url || imageUrl;
                      console.log(`Scrydex data for ${searchQuery}: $${marketPrice}`);
                    }
                  }
                }
              } catch (scrydexErr) {
                console.error(`Error fetching Scrydex data for ${product.name}:`, scrydexErr);
              }
              
              // Fallback to TCGPlayer scraping if Scrydex didn't return data
              if (!marketPrice || !imageUrl) {
                const tcgData = await scrapeTCGPlayerData(set.name, product.type);
                if (!imageUrl) imageUrl = tcgData.imageUrl || product.fallbackImage;
                if (!marketPrice) marketPrice = tcgData.marketPrice;
              }
              
              // Add small delay between requests to avoid rate limiting
              await new Promise(r => setTimeout(r, 500));
              const uniqueId = `sealed-${set.id}-${product.type.toLowerCase().replace(/\s+/g, '-')}`;
              
              // Check if sealed product already exists
              const { data: existing, error: selErr } = await supabase
                .from("products")
                .select("id")
                .eq("pokemon_tcg_id", uniqueId)
                .maybeSingle();

              if (selErr) {
                console.error(`Error checking sealed product ${uniqueId}:`, selErr);
                skipped++;
                continue;
              }

              if (existing?.id) {
                const { error: updErr } = await supabase
                  .from("products")
                  .update({ 
                    name: product.name,
                    set_name: set.name,
                    image_url: imageUrl,
                    market_price: marketPrice,
                    last_price_update: marketPrice ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString() 
                  })
                  .eq("id", existing.id);
                if (updErr) {
                  console.error(`Error updating sealed product ${uniqueId}:`, updErr);
                  skipped++;
                } else {
                  updated++;
                }
              } else {
                const { error: insErr } = await supabase.from("products").insert({
                  name: product.name,
                  set_name: set.name,
                  image_url: imageUrl,
                  pokemon_tcg_id: uniqueId,
                  category: "sealed",
                  market_price: marketPrice,
                  last_price_update: marketPrice ? new Date().toISOString() : null,
                });
                if (insErr) {
                  console.error(`Error inserting sealed product ${uniqueId}:`, insErr);
                  skipped++;
                } else {
                  imported++;
                }
              }
            }
          } catch (err) {
            console.error("Error processing set:", err);
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
        totalSets: sets.length,
        hasMore: page < totalPages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("index-sealed-products error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", imported: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
