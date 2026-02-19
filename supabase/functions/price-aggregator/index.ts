import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Price Aggregator - Central price fetching with caching
 * 
 * Features:
 * 1. Check local DB first (return cached if < 24h old)
 * 2. Query multiple sources in parallel:
 *    - Pokemon TCG API (for Pokemon cards)
 *    - Scryfall (for Magic: The Gathering)
 *    - Tavily AI (fallback for everything else)
 * 3. Calculate weighted average if multiple sources
 * 4. Store result in products table with timestamp
 * 5. Return aggregated price with confidence score
 */

interface PriceSource {
  source: string;
  price: number | null;
  lowPrice: number | null;
  weight: number;
  timestamp: number;
}

interface AggregatedResult {
  market_price: number | null;
  lowest_listed: number | null;
  confidence: number;
  sources: PriceSource[];
  cached: boolean;
  cache_age_hours?: number;
  product_id?: string;
}

const CACHE_TTL_HOURS = 24;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const {
      name,
      set_name,
      card_number,
      category,  // 'pokemon', 'magic', 'sports', 'sealed', 'one_piece'
      force_refresh = false,
      pokemon_tcg_id,
    } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: "name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Backend not configured");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false }
    });

    // Detect card type if not provided
    const cardType = category || detectCardType(name);
    console.log(`Price aggregation for: "${name}" (type: ${cardType})`);

    // =============================================
    // STEP 1: Check local DB cache
    // =============================================
    
    if (!force_refresh) {
      const cached = await checkLocalCache(supabase, name, set_name, card_number, pokemon_tcg_id);
      if (cached) {
        const ageHours = (Date.now() - new Date(cached.last_price_update).getTime()) / (1000 * 60 * 60);
        
        if (ageHours < CACHE_TTL_HOURS && cached.market_price !== null) {
          console.log(`Cache hit: ${name} (${ageHours.toFixed(1)}h old)`);
          return new Response(
            JSON.stringify({
              market_price: cached.market_price,
              lowest_listed: cached.lowest_listed,
              confidence: cached.price_confidence || 50,
              sources: [{ 
                source: cached.price_source || 'cached', 
                price: cached.market_price,
                lowPrice: cached.lowest_listed,
                weight: 1,
                timestamp: new Date(cached.last_price_update).getTime()
              }],
              cached: true,
              cache_age_hours: Math.round(ageHours * 10) / 10,
              product_id: cached.id,
            } as AggregatedResult),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // =============================================
    // STEP 2: Query multiple sources in parallel
    // =============================================
    
    const sources: PriceSource[] = [];
    const errors: string[] = [];
    const fetchPromises: Promise<void>[] = [];

    // Pokemon TCG API (for Pokemon cards)
    if (cardType === 'pokemon' || cardType === 'raw') {
      fetchPromises.push(
        fetchPokemonTcgPrice(name, set_name, card_number)
          .then(result => {
            if (result.price !== null) {
              sources.push({
                source: 'pokemon_tcg',
                price: result.price,
                lowPrice: result.lowPrice,
                weight: 0.4, // High weight - official source
                timestamp: Date.now(),
              });
            }
          })
          .catch(e => errors.push(`Pokemon TCG: ${e.message}`))
      );
    }

    // Scryfall (for Magic cards)
    if (cardType === 'magic') {
      fetchPromises.push(
        fetchScryfallPrice(name, set_name)
          .then(result => {
            if (result.price !== null) {
              sources.push({
                source: 'scryfall',
                price: result.price,
                lowPrice: result.lowPrice,
                weight: 0.5, // High weight for Magic - authoritative
                timestamp: Date.now(),
              });
            }
          })
          .catch(e => errors.push(`Scryfall: ${e.message}`))
      );
    }

    // Scrydex API (if available - for Pokemon sealed/graded)
    if (cardType === 'pokemon' || cardType === 'sealed') {
      fetchPromises.push(
        fetchScrydexPrice(name, set_name)
          .then(result => {
            if (result.price !== null) {
              sources.push({
                source: 'scrydex',
                price: result.price,
                lowPrice: result.lowPrice,
                weight: cardType === 'sealed' ? 0.5 : 0.35,
                timestamp: Date.now(),
              });
            }
          })
          .catch(e => errors.push(`Scrydex: ${e.message}`))
      );
    }

    // Tavily AI search (fallback for everything)
    if (sources.length === 0 || cardType === 'sports' || cardType === 'one_piece' || cardType === 'unknown') {
      fetchPromises.push(
        fetchTavilyPrice(name, set_name, cardType)
          .then(result => {
            if (result.price !== null) {
              sources.push({
                source: 'tavily',
                price: result.price,
                lowPrice: result.lowPrice,
                weight: 0.25, // Lower weight - AI-derived
                timestamp: Date.now(),
              });
            }
          })
          .catch(e => errors.push(`Tavily: ${e.message}`))
      );
    }

    // Wait for all fetches
    await Promise.allSettled(fetchPromises);

    // If still no sources, try Tavily as last resort
    if (sources.length === 0) {
      console.log(`No sources found, trying Tavily fallback for: "${name}"`);
      try {
        const tavilyResult = await fetchTavilyPrice(name, set_name, cardType);
        if (tavilyResult.price !== null) {
          sources.push({
            source: 'tavily',
            price: tavilyResult.price,
            lowPrice: tavilyResult.lowPrice,
            weight: 0.3,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        errors.push(`Tavily fallback: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    }

    // =============================================
    // STEP 3: Calculate weighted average
    // =============================================
    
    const aggregated = calculateWeightedAverage(sources);
    console.log(`Aggregated: ${sources.length} sources, price: $${aggregated.market_price}, confidence: ${aggregated.confidence}%`);

    // =============================================
    // STEP 4: Store result in products table
    // =============================================
    
    let productId: string | undefined;
    if (aggregated.market_price !== null) {
      productId = await storePrice(supabase, {
        name,
        set_name,
        card_number,
        pokemon_tcg_id,
        market_price: aggregated.market_price,
        lowest_listed: aggregated.lowest_listed,
        price_source: sources[0]?.source || 'unknown',
        confidence: aggregated.confidence,
        category: cardType,
      });
    }

    const timeMs = Date.now() - startTime;
    console.log(`Price aggregation complete in ${timeMs}ms`);

    return new Response(
      JSON.stringify({
        market_price: aggregated.market_price,
        lowest_listed: aggregated.lowest_listed,
        confidence: aggregated.confidence,
        sources: aggregated.sources,
        cached: false,
        product_id: productId,
        card_type: cardType,
        errors: errors.length > 0 ? errors : undefined,
        time_ms: timeMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Price aggregator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// =============================================
// HELPER FUNCTIONS
// =============================================

function detectCardType(query: string): string {
  const lower = query.toLowerCase();

  // Sealed products
  if (/booster box|etb|elite trainer|tin|collection box|bundle|case|upc/i.test(lower)) {
    return 'sealed';
  }

  // Magic: The Gathering
  if (/mtg|magic|planeswalker|mana\b|wizards/i.test(lower)) {
    return 'magic';
  }

  // One Piece
  if (/one piece|onepiece|op-\d|luffy|zoro|nami|sanji/i.test(lower)) {
    return 'one_piece';
  }

  // Sports cards
  if (/topps|panini|bowman|upper deck|nba|mlb|nfl|nhl|prizm|select|rookie\s+card/i.test(lower)) {
    return 'sports';
  }

  // Pokemon (default for most card queries)
  if (/pokemon|pikachu|charizard|mewtwo|eevee|bulbasaur|tcg|psa|bgs|cgc/i.test(lower)) {
    return 'pokemon';
  }

  return 'unknown';
}

async function checkLocalCache(
  supabase: any,
  name: string,
  setName?: string,
  cardNumber?: string,
  pokemonTcgId?: string
): Promise<any | null> {
  // Build query
  let query = supabase
    .from('products')
    .select('id, name, set_name, market_price, lowest_listed, price_source, price_confidence, last_price_update')
    .limit(1);

  // Prefer exact match by pokemon_tcg_id
  if (pokemonTcgId) {
    const { data } = await query.eq('pokemon_tcg_id', pokemonTcgId).single();
    if (data) return data;
  }

  // Otherwise try name + set + number match
  query = supabase
    .from('products')
    .select('id, name, set_name, market_price, lowest_listed, price_source, price_confidence, last_price_update')
    .ilike('name', name)
    .limit(1);

  if (setName) {
    query = query.ilike('set_name', setName);
  }
  if (cardNumber) {
    query = query.eq('card_number', cardNumber);
  }

  const { data } = await query.single();
  return data;
}

async function fetchPokemonTcgPrice(
  name: string,
  setName?: string,
  cardNumber?: string
): Promise<{ price: number | null; lowPrice: number | null }> {
  const POKEMON_TCG_API_KEY = Deno.env.get("POKEMON_TCG_API_KEY");

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = POKEMON_TCG_API_KEY;
  }

  const searchTerms: string[] = [`name:"${name}*"`];
  if (setName) searchTerms.push(`set.name:"${setName}"`);
  if (cardNumber) searchTerms.push(`number:${cardNumber}`);

  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchTerms.join(" "))}&pageSize=5`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    const cards = data.data || [];

    if (cards.length === 0) return { price: null, lowPrice: null };

    // Get price from first card with pricing
    for (const card of cards) {
      const prices = card.tcgplayer?.prices || {};
      const priceTypes = ["holofoil", "reverseHolofoil", "normal", "1stEditionHolofoil"];

      for (const type of priceTypes) {
        if (prices[type]?.market) {
          return {
            price: prices[type].market,
            lowPrice: prices[type].low || null,
          };
        }
      }
    }

    return { price: null, lowPrice: null };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function fetchScryfallPrice(
  name: string,
  setName?: string
): Promise<{ price: number | null; lowPrice: number | null }> {
  let url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
  if (setName) {
    // Try to get set code from set name
    url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}&set=${encodeURIComponent(setName.toLowerCase().replace(/\s+/g, ''))}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      // Try without set
      const fallbackResponse = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
      );
      if (!fallbackResponse.ok) throw new Error(`API returned ${fallbackResponse.status}`);
      const data = await fallbackResponse.json();
      return extractScryfallPrices(data);
    }

    const data = await response.json();
    return extractScryfallPrices(data);
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function extractScryfallPrices(card: any): { price: number | null; lowPrice: number | null } {
  const prices = card.prices || {};
  
  // Try USD prices first, then EUR converted
  const usd = parseFloat(prices.usd) || null;
  const usdFoil = parseFloat(prices.usd_foil) || null;
  
  const price = usd || usdFoil || null;
  
  return {
    price,
    lowPrice: price, // Scryfall only has one price point
  };
}

async function fetchScrydexPrice(
  name: string,
  setName?: string
): Promise<{ price: number | null; lowPrice: number | null }> {
  const SCRYDEX_API_KEY = Deno.env.get("SCRYDEX_API_KEY");
  const SCRYDEX_TEAM_ID = Deno.env.get("SCRYDEX_TEAM_ID");

  if (!SCRYDEX_API_KEY || !SCRYDEX_TEAM_ID) {
    return { price: null, lowPrice: null };
  }

  const isSealedQuery = /booster box|etb|elite trainer|tin|collection|bundle/i.test(name);
  const endpoint = isSealedQuery ? "sealed" : "cards";
  const url = `https://api.scrydex.com/pokemon/v1/${endpoint}?q=${encodeURIComponent(name)}&page_size=5`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url, {
      headers: {
        "X-Api-Key": SCRYDEX_API_KEY,
        "X-Team-ID": SCRYDEX_TEAM_ID,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    const products = data.data || [];

    if (products.length === 0) return { price: null, lowPrice: null };

    const product = products[0];
    const marketPrice =
      product.prices?.market_price ||
      product.market_price ||
      product.prices?.tcgplayer?.market ||
      null;
    const lowPrice =
      product.prices?.lowest_listed ||
      product.lowest_listed ||
      product.prices?.tcgplayer?.low ||
      null;

    return { price: marketPrice, lowPrice };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function fetchTavilyPrice(
  name: string,
  setName?: string,
  cardType?: string
): Promise<{ price: number | null; lowPrice: number | null }> {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) {
    return { price: null, lowPrice: null };
  }

  let searchQuery = name;
  if (setName) searchQuery += ` ${setName}`;
  
  // Add context based on card type
  if (cardType === 'pokemon' || cardType === 'raw') {
    searchQuery += ' pokemon card tcgplayer price';
  } else if (cardType === 'magic') {
    searchQuery += ' mtg card price';
  } else if (cardType === 'sports') {
    searchQuery += ' sports card price ebay';
  } else if (cardType === 'one_piece') {
    searchQuery += ' one piece tcg card price';
  } else {
    searchQuery += ' trading card price value';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    const answer = data.answer || '';

    // Extract prices from answer
    const priceMatches = answer.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
    const prices = priceMatches
      .map((p: string) => parseFloat(p.replace(/[$,]/g, '')))
      .filter((p: number) => p > 0.1 && p < 100000)
      .sort((a: number, b: number) => a - b);

    if (prices.length === 0) return { price: null, lowPrice: null };

    const medianPrice = prices[Math.floor(prices.length / 2)];
    const lowPrice = prices[0];

    return { price: medianPrice, lowPrice };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function calculateWeightedAverage(sources: PriceSource[]): {
  market_price: number | null;
  lowest_listed: number | null;
  confidence: number;
  sources: PriceSource[];
} {
  if (sources.length === 0) {
    return {
      market_price: null,
      lowest_listed: null,
      confidence: 0,
      sources: [],
    };
  }

  // Normalize weights to sum to 1
  const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
  const normalizedSources = sources.map(s => ({
    ...s,
    weight: s.weight / totalWeight,
  }));

  // Calculate weighted average market price
  let weightedSum = 0;
  let weightUsed = 0;

  for (const source of normalizedSources) {
    if (source.price !== null) {
      weightedSum += source.price * source.weight;
      weightUsed += source.weight;
    }
  }

  const marketPrice = weightUsed > 0 ? Math.round((weightedSum / weightUsed) * 100) / 100 : null;

  // Get lowest listed from all sources
  const lowPrices = sources
    .map(s => s.lowPrice)
    .filter((p): p is number => p !== null);
  const lowestListed = lowPrices.length > 0 ? Math.min(...lowPrices) : null;

  // Calculate confidence score
  let confidence = 0;

  // Base confidence from source count (up to 40%)
  confidence += Math.min(sources.length * 15, 40);

  // Price agreement bonus (up to 40%)
  const allPrices = sources.map(s => s.price).filter((p): p is number => p !== null);
  if (allPrices.length > 1) {
    const max = Math.max(...allPrices);
    const min = Math.min(...allPrices);
    const variance = max > 0 ? (max - min) / max : 0;
    const agreementScore = Math.max(0, 1 - variance) * 40;
    confidence += agreementScore;
  } else if (allPrices.length === 1) {
    confidence += 20; // Single source, moderate confidence
  }

  // Weight coverage bonus (up to 20%)
  confidence += weightUsed * 20;

  confidence = Math.min(Math.round(confidence), 100);

  return {
    market_price: marketPrice,
    lowest_listed: lowestListed ? Math.round(lowestListed * 100) / 100 : null,
    confidence,
    sources: normalizedSources,
  };
}

async function storePrice(
  supabase: any,
  data: {
    name: string;
    set_name?: string;
    card_number?: string;
    pokemon_tcg_id?: string;
    market_price: number;
    lowest_listed?: number | null;
    price_source: string;
    confidence: number;
    category: string;
  }
): Promise<string | undefined> {
  try {
    // Use the upsert function
    const { data: result, error } = await supabase.rpc('upsert_product_with_price', {
      p_name: data.name,
      p_set_name: data.set_name || null,
      p_card_number: data.card_number || null,
      p_image_url: null,
      p_market_price: data.market_price,
      p_lowest_listed: data.lowest_listed || null,
      p_price_source: data.price_source,
      p_category: data.category === 'sealed' ? 'sealed' : 
                  data.category === 'graded' ? 'graded' : 'raw',
      p_pokemon_tcg_id: data.pokemon_tcg_id || null,
      p_rarity: null,
    });

    if (error) {
      console.error('Error storing price:', error);
      return undefined;
    }

    console.log(`Stored price for "${data.name}": $${data.market_price} (${data.price_source})`);
    return result;
  } catch (e) {
    console.error('Error storing price:', e);
    return undefined;
  }
}
