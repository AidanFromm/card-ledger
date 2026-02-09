import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Use language-agnostic base to support TCG + Pocket + sealed
const SCRYDEX_BASE = "https://api.scrydex.com/pokemon/v1";

// Price source types for tracking where prices come from
type PriceSource = 'scrydex' | 'pokemon_tcg' | 'tavily';

/**
 * FALLBACK 1: Fetch price from Pokemon TCG API (FREE - 20,000 req/day)
 * Used when Scrydex returns no price for individual Pokemon cards
 */
async function fetchPokemonTcgPrice(
  cardName: string,
  setName?: string,
  cardNumber?: string | number
): Promise<{ market: number; low: number } | null> {
  try {
    const POKEMON_TCG_API_KEY = Deno.env.get("POKEMON_TCG_API_KEY");

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (POKEMON_TCG_API_KEY) {
      headers["X-Api-Key"] = POKEMON_TCG_API_KEY;
    }

    // Build search query - use exact name match and optional set/number filters
    let searchQuery = `name:"${cardName}"`;
    if (setName) {
      searchQuery += ` set.name:"${setName}"`;
    }
    if (cardNumber) {
      searchQuery += ` number:"${cardNumber}"`;
    }

    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&pageSize=10`;
    console.log(`Pokemon TCG API search: ${searchQuery}`);

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.warn(`Pokemon TCG API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const cards = data.data || [];

    if (cards.length === 0) {
      console.log("Pokemon TCG API: No cards found");
      return null;
    }

    // Find the best matching card with prices
    for (const card of cards) {
      const prices = card.tcgplayer?.prices || {};
      const priceTypes = ['holofoil', 'reverseHolofoil', 'normal', '1stEditionHolofoil', 'unlimited'];

      for (const type of priceTypes) {
        if (prices[type]?.market) {
          console.log(`Pokemon TCG API: Found ${type} price $${prices[type].market} for ${card.name}`);
          return {
            market: prices[type].market,
            low: prices[type].low || prices[type].market,
          };
        }
      }
    }

    console.log("Pokemon TCG API: Cards found but no prices available");
    return null;
  } catch (error) {
    console.error("Pokemon TCG API error:", error);
    return null;
  }
}

/**
 * FALLBACK 2: Fetch price from Tavily AI Search (1,000 free/month)
 * Last resort - uses AI to search web for card prices
 * IMPORTANT: Only use for individual lookups, NOT bulk refresh (too expensive)
 */
async function fetchTavilyPrice(
  cardName: string,
  setName?: string,
  gradingCompany?: string,
  grade?: number | string
): Promise<{ market: number; confidence: number } | null> {
  try {
    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    if (!TAVILY_API_KEY) {
      console.log("Tavily API key not configured");
      return null;
    }

    // Build search query for price lookup
    let searchQuery = `${cardName} Pokemon card price`;
    if (setName) {
      searchQuery += ` ${setName}`;
    }
    if (gradingCompany && gradingCompany !== "raw" && grade) {
      searchQuery += ` ${gradingCompany} ${grade} graded`;
    }
    searchQuery += " TCGPlayer eBay market value 2024 2025";

    console.log(`Tavily search: ${searchQuery}`);

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      console.warn(`Tavily API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Extract prices from the AI answer and search results
    const prices: number[] = [];

    // Check AI-generated answer first
    if (data.answer) {
      const answerPrices = extractPricesFromText(data.answer);
      prices.push(...answerPrices);
    }

    // Also check search result snippets
    for (const result of data.results || []) {
      const snippetPrices = extractPricesFromText(result.content || "");
      prices.push(...snippetPrices);
    }

    if (prices.length === 0) {
      console.log("Tavily: No prices found in search results");
      return null;
    }

    // Filter out obviously wrong prices (too low or too high)
    const validPrices = prices.filter(p => p >= 0.25 && p <= 100000);

    if (validPrices.length === 0) {
      console.log("Tavily: No valid prices after filtering");
      return null;
    }

    // Calculate median price for better accuracy
    validPrices.sort((a, b) => a - b);
    const median = validPrices[Math.floor(validPrices.length / 2)];

    // Confidence based on how many price points we found
    const confidence = Math.min(100, validPrices.length * 20);

    console.log(`Tavily: Found ${validPrices.length} prices, median: $${median.toFixed(2)}, confidence: ${confidence}%`);

    return {
      market: median,
      confidence,
    };
  } catch (error) {
    console.error("Tavily API error:", error);
    return null;
  }
}

/**
 * Extract price values from text using regex
 */
function extractPricesFromText(text: string): number[] {
  const prices: number[] = [];

  // Match various price formats: $19.99, $1,234.56, USD 50.00, etc.
  const pricePatterns = [
    /\$\s*([\d,]+(?:\.\d{2})?)/g,           // $19.99 or $1,234.56
    /USD\s*([\d,]+(?:\.\d{2})?)/gi,          // USD 19.99
    /(?:price|cost|value|market|sold)\s*(?:is|at|for|:)?\s*\$?([\d,]+(?:\.\d{2})?)/gi,
  ];

  for (const pattern of pricePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const priceStr = match[1].replace(/,/g, "");
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        prices.push(price);
      }
    }
  }

  return prices;
}

function getHeaders(apiKey: string, teamId: string) {
  return {
    "X-Api-Key": apiKey,
    "X-Team-ID": teamId,
    Accept: "application/json",
  } as Record<string, string>;
}

function isEtbName(name?: string) {
  return !!name && /(elite trainer box|\betb\b)/i.test(name);
}

function extractSetName(p: any): string | null {
  return p?.expansion?.name || p?.set?.name || p?.set || p?.expansion || null;
}

function extractImage(p: any): string | null {
  return p?.images?.[0]?.large || p?.images?.large || p?.image || p?.imageUrl || null;
}

function pickCardPrice(card: any): { market: number | null; low: number | null } {
  try {
    // Variants array sometimes carries price snapshots
    if (card?.variants && Array.isArray(card.variants)) {
      for (const variant of card.variants) {
        const prices = variant?.prices;
        if (Array.isArray(prices) && prices.length > 0) {
          const priceEntry = prices[0];
          const market = priceEntry?.market ?? priceEntry?.marketPrice ?? null;
          const low = priceEntry?.low ?? priceEntry?.lowestListed ?? null;
          if (market !== null) return { market, low: low ?? null };
        }
      }
    }
  } catch (_) {}
  return { market: null, low: null };
}

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

async function searchScrydex(key: string, teamId: string, endpoint: "cards" | "sealed", q: string) {
  const url = `${SCRYDEX_BASE}/${endpoint}?q=${encodeURIComponent(q)}&page_size=100&include=prices`;
  try {
    const resp = await fetchWithTimeout(url, { headers: getHeaders(key, teamId) }, 5000);
    const status = resp.status;
    if (!resp.ok) {
      console.warn(`Scrydex search failed status=${status} q="${q}" endpoint=${endpoint}`);
      return { items: [] as any[], status };
    }
    const json = await resp.json();
    const items: any[] = json?.data || [];
    console.log(`Scrydex returned ${items.length} items for q="${q}" endpoint=${endpoint}`);
    return { items, status };
  } catch (error: any) {
    console.warn(`Scrydex search error for q="${q}": ${error.message}`);
    return { items: [] as any[], status: 0 };
  }
}

function selectBestCandidate(items: any[], name?: string, setName?: string, cardNumber?: string | number): any {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];

  const norm = (v: any) => String(v ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  const wantName = norm(name);
  const wantSet = norm(setName);
  const wantNum = String(cardNumber ?? "").replace(/^#/, "").trim();

  let best: any = null;
  let bestScore = -1;

  for (const it of items) {
    const itName = norm(it?.name || it?.title);
    const itSet = norm(it?.expansion?.name || it?.set?.name || it?.set || it?.expansion);
    const itNum = String(it?.number || it?.cardNumber || "").replace(/^#/, "");

    let score = 0;

    // Exact card number match is strongest signal
    if (wantNum && itNum && itNum === wantNum) score += 10;

    // Set name matching
    if (wantSet && itSet) {
      if (itSet === wantSet) score += 5;           // exact match
      else if (itSet.includes(wantSet)) score += 3; // contains
      else if (wantSet.includes(itSet)) score += 2; // reverse contains
    }

    // Name matching
    if (wantName && itName) {
      if (itName === wantName) score += 5;         // exact match
      else if (itName.startsWith(wantName)) score += 3; // starts with
      else if (itName.includes(wantName)) score += 1;   // contains
    }

    if (score > bestScore) {
      bestScore = score;
      best = it;
    }
  }

  console.log("Best candidate score:", bestScore, "for", { name: wantName, set: wantSet, num: wantNum });
  return best || items[0];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { name, setName, cardNumber, category, gradingCompany, grade } = await req.json();
    if (!name && !setName) {
      return new Response(JSON.stringify({ error: "Missing name or setName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("SCRYDEX_API_KEY");
    const teamId = Deno.env.get("SCRYDEX_TEAM_ID");
    const apiKeySecondary = Deno.env.get("SCRYDEX_API_KEY_SECONDARY");

    if (!apiKey || !teamId) {
      return new Response(JSON.stringify({ error: "Scrydex not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sealed = category === "sealed" || isEtbName(name);
    const isGraded = gradingCompany && gradingCompany !== "raw" && grade;
    const endpoint: "cards" | "sealed" = sealed ? "sealed" : "cards";

    const fullQuery = [name, setName, cardNumber ? `#${cardNumber}` : ""].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    const nameNumQuery = [name, cardNumber ? `#${cardNumber}` : ""].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    const nameOnlyQuery = String(name || setName || "").trim();

    const keys = [apiKey, apiKeySecondary].filter(Boolean) as string[];
    const queries = [fullQuery, nameNumQuery, nameOnlyQuery].filter(Boolean);

    // Collect results - stop early when we find good results
    let allItems: any[] = [];
    let usedKey = apiKey;

    outerLoop:
    for (const key of keys) {
      for (const q of queries) {
        const { items } = await searchScrydex(key, teamId!, endpoint, q);
        if (items.length > 0) {
          allItems.push(...items);
          usedKey = key;
          // If we found 3+ items, that's enough - stop searching
          if (allItems.length >= 3) break outerLoop;
        }
      }
      // If we found items with primary key, don't try secondary
      if (allItems.length > 0) break;
    }

    if (allItems.length === 0) {
      console.warn("No results found from Scrydex after all queries/keys");

      // FALLBACK: Try Pokemon TCG API and Tavily for individual cards
      if (!sealed) {
        // FALLBACK 1: Pokemon TCG API (free, 20k/day)
        console.log("Trying Pokemon TCG API fallback...");
        const pokemonPrice = await fetchPokemonTcgPrice(name, setName, cardNumber);
        if (pokemonPrice) {
          console.log(`Pokemon TCG API returned price: $${pokemonPrice.market}`);
          return new Response(
            JSON.stringify({
              market_price: pokemonPrice.market,
              lowest_listed: pokemonPrice.low,
              graded_price: null,
              ungraded_price: pokemonPrice.market,
              id: null,
              name: name,
              set_name: setName || null,
              card_number: cardNumber || null,
              image_url: null,
              category: "raw",
              price_source: "pokemon_tcg" as PriceSource,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // FALLBACK 2: Tavily AI Search (limited, 1k/month - use sparingly)
        const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
        if (TAVILY_API_KEY) {
          console.log("Trying Tavily AI fallback...");
          const tavilyPrice = await fetchTavilyPrice(name, setName, gradingCompany, grade);
          if (tavilyPrice && tavilyPrice.confidence >= 40) {
            console.log(`Tavily returned price: $${tavilyPrice.market} (confidence: ${tavilyPrice.confidence}%)`);
            return new Response(
              JSON.stringify({
                market_price: tavilyPrice.market,
                lowest_listed: null,
                graded_price: isGraded ? tavilyPrice.market : null,
                ungraded_price: !isGraded ? tavilyPrice.market : null,
                id: null,
                name: name,
                set_name: setName || null,
                card_number: cardNumber || null,
                image_url: null,
                category: isGraded ? "graded" : "raw",
                price_source: "tavily" as PriceSource,
                price_confidence: tavilyPrice.confidence,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      return new Response(JSON.stringify({ market_price: null, price_source: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use smart selection to find best match
    const candidate = selectBestCandidate(allItems, name, setName, cardNumber);

    if (!candidate) {
      console.warn("No suitable candidate selected");
      return new Response(JSON.stringify({ market_price: null, price_source: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const set_name = extractSetName(candidate);
    const image_url = extractImage(candidate);
    const card_number = candidate?.number || candidate?.cardNumber || null;

    // Pricing extraction
    let { market: market_price, low: lowest_listed } = pickCardPrice(candidate);
    let graded_price: number | null = null;
    let ungraded_price: number | null = market_price;

    // Fallbacks from common Scrydex shapes for ungraded
    if (market_price == null) {
      const p = candidate?.prices || candidate;
      market_price = p?.market_price ?? p?.marketPrice ?? p?.tcgplayer?.market ?? p?.tcgplayer?.avg ?? null;
      ungraded_price = market_price;
    }
    if (lowest_listed == null) {
      const p = candidate?.prices || candidate;
      lowest_listed = p?.lowest_listed ?? p?.lowestListed ?? p?.tcgplayer?.low ?? null;
    }

    // If graded pricing requested, extract from variants
    if (isGraded) {
      try {
        const variants = candidate?.variants || [];
        const gradeKey = `${gradingCompany.toLowerCase()}-${grade}`;
        
        console.log(`Looking for graded price: ${gradingCompany} ${grade}`);
        console.log(`Total variants found: ${variants.length}`);
        
        // Look for matching graded variant
        for (const variant of variants) {
          const variantName = String(variant?.name || variant?.title || "").toLowerCase();
          console.log(`Checking variant: ${variantName}`);
          
          // Check if variant matches grading company and grade
          if (variantName.includes(gradingCompany.toLowerCase()) && 
              variantName.includes(grade.toString())) {
            const prices = variant?.prices;
            console.log(`Found matching variant! Prices:`, prices);
            
            if (Array.isArray(prices) && prices.length > 0) {
              const priceEntry = prices[0];
              graded_price = priceEntry?.market ?? priceEntry?.marketPrice ?? null;
              if (graded_price !== null) {
                console.log(`Found graded price: $${graded_price}`);
                lowest_listed = priceEntry?.low ?? priceEntry?.lowestListed ?? lowest_listed;
                break;
              }
            }
          }
        }

        // If no variant match, try direct price fields on candidate
        if (graded_price === null && candidate?.prices) {
          const prices = candidate.prices;
          graded_price = prices?.[gradeKey] ?? prices?.[`${gradingCompany}_${grade}`] ?? null;
        }
      } catch (e) {
        console.error("Error extracting graded price:", e);
      }
    }

    // Track the price source
    let price_source: PriceSource = "scrydex";
    let price_confidence: number | null = null;

    // If Scrydex found a candidate but has no price, try fallbacks for individual cards
    const effectivePrice = isGraded ? graded_price : market_price;
    if (effectivePrice == null && !sealed) {
      console.log("Scrydex candidate found but no price, trying fallbacks...");

      // FALLBACK 1: Pokemon TCG API (free, 20k/day)
      const pokemonPrice = await fetchPokemonTcgPrice(
        candidate?.name || name,
        set_name || setName,
        card_number || cardNumber
      );
      if (pokemonPrice) {
        console.log(`Pokemon TCG API returned price: $${pokemonPrice.market}`);
        market_price = pokemonPrice.market;
        ungraded_price = pokemonPrice.market;
        lowest_listed = pokemonPrice.low;
        price_source = "pokemon_tcg";
      } else {
        // FALLBACK 2: Tavily AI Search (limited, 1k/month)
        const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
        if (TAVILY_API_KEY) {
          console.log("Trying Tavily AI fallback...");
          const tavilyPrice = await fetchTavilyPrice(
            candidate?.name || name,
            set_name || setName,
            gradingCompany,
            grade
          );
          if (tavilyPrice && tavilyPrice.confidence >= 40) {
            console.log(`Tavily returned price: $${tavilyPrice.market} (confidence: ${tavilyPrice.confidence}%)`);
            if (isGraded) {
              graded_price = tavilyPrice.market;
            } else {
              market_price = tavilyPrice.market;
              ungraded_price = tavilyPrice.market;
            }
            price_source = "tavily";
            price_confidence = tavilyPrice.confidence;
          }
        }
      }
    }

    const finalPrice = isGraded ? graded_price : market_price;

    console.info("Selected candidate", {
      name: candidate?.name || candidate?.title || name,
      set_name,
      card_number,
      endpoint,
      used_key: usedKey === apiKey ? "primary" : "secondary",
      has_prices: finalPrice != null,
      is_graded: isGraded,
      graded_price: graded_price,
      price_source,
    });

    return new Response(
      JSON.stringify({
        market_price: finalPrice,
        ungraded_price: ungraded_price ?? null,
        graded_price: graded_price ?? null,
        lowest_listed: lowest_listed ?? null,
        id: candidate?.id || null,
        name: candidate?.name || candidate?.title || name,
        set_name,
        card_number,
        image_url,
        category: sealed ? "sealed" : isGraded ? "graded" : "raw",
        price_source: finalPrice != null ? price_source : null,
        price_confidence: price_confidence,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scrydex-price error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

