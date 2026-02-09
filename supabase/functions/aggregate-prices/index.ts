import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Aggregate Prices - Multi-Source Price Aggregation Engine
 *
 * Combines pricing data from multiple sources:
 * 1. Scrydex (current primary - $99/mo)
 * 2. Pokemon TCG API (free - TCGPlayer prices)
 * 3. eBay Browse API (free - market listings)
 * 4. PriceCharting (for sports cards)
 *
 * Returns weighted average with confidence score
 */

interface PriceSource {
  source: string;
  price: number | null;
  lowPrice: number | null;
  weight: number;
  timestamp?: number;
}

interface AggregatedPrice {
  market_price: number | null;
  lowest_listed: number | null;
  confidence: number; // 0-100
  sources: PriceSource[];
  source_count: number;
  price_range: { low: number; high: number } | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      query,
      cardName,
      setName,
      cardNumber,
      category, // 'pokemon', 'sports', 'mtg', 'sealed'
      gradingCompany,
      grade,
    } = await req.json();

    if (!query && !cardName) {
      return new Response(
        JSON.stringify({ error: "query or cardName required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchTerm = query || cardName;
    const sources: PriceSource[] = [];
    const errors: string[] = [];

    // Determine card type for appropriate source weighting
    const cardType = category || detectCardType(searchTerm);
    console.log(`Aggregating prices for: "${searchTerm}" (type: ${cardType})`);

    // Parallel fetch from all available sources
    const fetchPromises: Promise<void>[] = [];

    // 1. Pokemon TCG API (for Pokemon cards)
    if (cardType === "pokemon" || cardType === "raw") {
      fetchPromises.push(
        fetchPokemonTcgPrice(searchTerm, setName, cardNumber)
          .then((result) => {
            if (result.price) {
              sources.push({
                source: "pokemon_tcg_api",
                price: result.price,
                lowPrice: result.lowPrice,
                weight: 0.3, // 30% weight
              });
            }
          })
          .catch((e) => errors.push(`Pokemon TCG: ${e.message}`))
      );
    }

    // 2. Scrydex (primary for sealed + graded)
    fetchPromises.push(
      fetchScrydexPrice(searchTerm, setName, gradingCompany, grade)
        .then((result) => {
          if (result.price) {
            sources.push({
              source: "scrydex",
              price: result.price,
              lowPrice: result.lowPrice,
              weight: cardType === "sealed" ? 0.5 : 0.35, // Higher weight for sealed
            });
          }
        })
        .catch((e) => errors.push(`Scrydex: ${e.message}`))
    );

    // 3. eBay (for market validation)
    fetchPromises.push(
      fetchEbayPrice(searchTerm, gradingCompany, grade, cardType)
        .then((result) => {
          if (result.price) {
            sources.push({
              source: "ebay",
              price: result.price,
              lowPrice: result.lowPrice,
              weight: 0.25, // 25% weight
            });
          }
        })
        .catch((e) => errors.push(`eBay: ${e.message}`))
    );

    // 4. PriceCharting (for sports cards)
    if (cardType === "sports") {
      fetchPromises.push(
        fetchPriceChartingPrice(searchTerm)
          .then((result) => {
            if (result.price) {
              sources.push({
                source: "pricecharting",
                price: result.price,
                lowPrice: result.lowPrice,
                weight: 0.4, // Higher weight for sports
              });
            }
          })
          .catch((e) => errors.push(`PriceCharting: ${e.message}`))
      );
    }

    // Wait for all sources
    await Promise.allSettled(fetchPromises);

    // Calculate aggregated price
    const aggregated = calculateAggregatedPrice(sources);

    console.log(`Aggregation complete: ${sources.length} sources, confidence: ${aggregated.confidence}%`);

    return new Response(
      JSON.stringify({
        ...aggregated,
        card_type: cardType,
        search_term: searchTerm,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Aggregate prices error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function detectCardType(query: string): string {
  const lower = query.toLowerCase();

  // Sealed products
  if (/booster box|etb|elite trainer|tin|collection box|bundle|case/i.test(lower)) {
    return "sealed";
  }

  // Sports cards
  if (/topps|panini|bowman|upper deck|nba|mlb|nfl|nhl|prizm|select/i.test(lower)) {
    return "sports";
  }

  // Graded
  if (/\b(psa|bgs|cgc|sgc|ace|tag)\s*\d/i.test(lower)) {
    return "graded";
  }

  // Default to Pokemon
  return "pokemon";
}

function calculateAggregatedPrice(sources: PriceSource[]): AggregatedPrice {
  if (sources.length === 0) {
    return {
      market_price: null,
      lowest_listed: null,
      confidence: 0,
      sources: [],
      source_count: 0,
      price_range: null,
    };
  }

  // Normalize weights to sum to 1
  const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
  const normalizedSources = sources.map((s) => ({
    ...s,
    weight: s.weight / totalWeight,
  }));

  // Calculate weighted average
  let weightedSum = 0;
  let weightUsed = 0;

  for (const source of normalizedSources) {
    if (source.price !== null) {
      weightedSum += source.price * source.weight;
      weightUsed += source.weight;
    }
  }

  const marketPrice = weightUsed > 0 ? weightedSum / weightUsed : null;

  // Get lowest listed from all sources
  const lowPrices = sources
    .map((s) => s.lowPrice)
    .filter((p): p is number => p !== null);
  const lowestListed = lowPrices.length > 0 ? Math.min(...lowPrices) : null;

  // Calculate price range
  const allPrices = sources
    .map((s) => s.price)
    .filter((p): p is number => p !== null);
  const priceRange =
    allPrices.length > 0
      ? { low: Math.min(...allPrices), high: Math.max(...allPrices) }
      : null;

  // Calculate confidence score
  // Higher confidence with more sources and closer price agreement
  let confidence = 0;

  // Base confidence from source count (up to 40%)
  confidence += Math.min(sources.length * 15, 40);

  // Price agreement bonus (up to 40%)
  if (priceRange && priceRange.high > 0) {
    const variance = (priceRange.high - priceRange.low) / priceRange.high;
    const agreementScore = Math.max(0, 1 - variance) * 40;
    confidence += agreementScore;
  }

  // Weight coverage bonus (up to 20%)
  confidence += weightUsed * 20;

  confidence = Math.min(Math.round(confidence), 100);

  return {
    market_price: marketPrice ? Math.round(marketPrice * 100) / 100 : null,
    lowest_listed: lowestListed ? Math.round(lowestListed * 100) / 100 : null,
    confidence,
    sources: normalizedSources,
    source_count: sources.length,
    price_range: priceRange
      ? {
          low: Math.round(priceRange.low * 100) / 100,
          high: Math.round(priceRange.high * 100) / 100,
        }
      : null,
  };
}

// Helper functions to fetch from each source
async function fetchPokemonTcgPrice(
  query: string,
  setName?: string,
  cardNumber?: string
): Promise<{ price: number | null; lowPrice: number | null }> {
  const POKEMON_TCG_API_KEY = Deno.env.get("POKEMON_TCG_API_KEY");

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = POKEMON_TCG_API_KEY;
  }

  const searchTerms: string[] = [`name:"${query}*"`];
  if (setName) searchTerms.push(`set.name:"${setName}"`);
  if (cardNumber) searchTerms.push(`number:${cardNumber}`);

  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchTerms.join(" "))}&pageSize=5`;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`API returned ${response.status}`);

  const data = await response.json();
  const cards = data.data || [];

  if (cards.length === 0) return { price: null, lowPrice: null };

  // Get price from first card with pricing
  for (const card of cards) {
    const prices = card.tcgplayer?.prices || {};
    const priceTypes = ["holofoil", "reverseHolofoil", "normal"];

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
}

async function fetchScrydexPrice(
  query: string,
  setName?: string,
  gradingCompany?: string,
  grade?: string
): Promise<{ price: number | null; lowPrice: number | null }> {
  const SCRYDEX_API_KEY = Deno.env.get("SCRYDEX_API_KEY");
  const SCRYDEX_TEAM_ID = Deno.env.get("SCRYDEX_TEAM_ID");

  if (!SCRYDEX_API_KEY || !SCRYDEX_TEAM_ID) {
    return { price: null, lowPrice: null };
  }

  const isSealedQuery = /booster box|etb|elite trainer|tin|collection|bundle/i.test(query);
  const endpoint = isSealedQuery ? "sealed" : "cards";
  const url = `https://api.scrydex.com/pokemon/v1/${endpoint}?q=${encodeURIComponent(query)}&page_size=5`;

  const response = await fetch(url, {
    headers: {
      "X-Api-Key": SCRYDEX_API_KEY,
      "X-Team-ID": SCRYDEX_TEAM_ID,
      Accept: "application/json",
    },
  });

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
}

async function fetchEbayPrice(
  query: string,
  gradingCompany?: string,
  grade?: string,
  category?: string
): Promise<{ price: number | null; lowPrice: number | null }> {
  const EBAY_CLIENT_ID = Deno.env.get("EBAY_CLIENT_ID");
  const EBAY_CLIENT_SECRET = Deno.env.get("EBAY_CLIENT_SECRET");

  if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
    return { price: null, lowPrice: null };
  }

  // Get OAuth token
  const credentials = btoa(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`);
  const tokenResponse = await fetch(
    "https://api.ebay.com/identity/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    }
  );

  if (!tokenResponse.ok) throw new Error("OAuth failed");

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Build search query
  let searchQuery = query;
  if (gradingCompany && grade) {
    searchQuery += ` ${gradingCompany} ${grade}`;
  }

  const categoryId = category === "sports" ? "212" : "183454";
  const params = new URLSearchParams({
    q: searchQuery,
    category_ids: categoryId,
    limit: "20",
  });

  const response = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    }
  );

  if (!response.ok) throw new Error(`API returned ${response.status}`);

  const data = await response.json();
  const items = data.itemSummaries || [];

  if (items.length === 0) return { price: null, lowPrice: null };

  // Calculate median price from listings
  const prices = items
    .map((item: any) => parseFloat(item.price?.value || "0"))
    .filter((p: number) => p > 0)
    .sort((a: number, b: number) => a - b);

  if (prices.length === 0) return { price: null, lowPrice: null };

  const medianPrice = prices[Math.floor(prices.length / 2)];
  const lowPrice = prices[0];

  return { price: medianPrice, lowPrice };
}

async function fetchPriceChartingPrice(
  query: string
): Promise<{ price: number | null; lowPrice: number | null }> {
  const PRICECHARTING_API_KEY = Deno.env.get("PRICECHARTING_API_KEY");

  if (!PRICECHARTING_API_KEY) {
    return { price: null, lowPrice: null };
  }

  const url = `https://www.pricecharting.com/api/products?t=${PRICECHARTING_API_KEY}&q=${encodeURIComponent(query)}&type=trading-cards`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`API returned ${response.status}`);

  const data = await response.json();
  const products = data.products || [];

  if (products.length === 0) return { price: null, lowPrice: null };

  const product = products[0];

  // PriceCharting returns prices in cents
  const price = product.price ? parseFloat(product.price) / 100 : null;
  const lowPrice = product["loose-price"]
    ? parseFloat(product["loose-price"]) / 100
    : null;

  return { price, lowPrice };
}
