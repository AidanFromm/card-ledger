import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AI-Powered Price Search
 *
 * Uses Tavily AI Search API to find real-time prices across the web
 * Cost: ~$1 per 1000 searches (much cheaper than PriceCharting)
 *
 * SETUP:
 * 1. Sign up at https://tavily.com (free tier: 1000 searches/month)
 * 2. Get API key
 * 3. Add TAVILY_API_KEY to Supabase secrets
 */

interface PriceResult {
  market_price: number | null;
  price_range: { low: number; high: number } | null;
  confidence: number;
  sources: string[];
  raw_response?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      cardName,
      setName,
      gradingCompany,
      grade,
      category // 'pokemon', 'sports', 'mtg', 'sealed'
    } = await req.json();

    if (!cardName) {
      return new Response(
        JSON.stringify({ error: "cardName required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    // Build search query - be very specific for accurate pricing
    let searchQuery = `"${cardName}"`;
    if (setName) searchQuery += ` "${setName}"`;
    if (gradingCompany && grade) searchQuery += ` ${gradingCompany.toUpperCase()} ${grade}`;

    // Add specific price search terms
    const currentYear = new Date().getFullYear();
    searchQuery += ` market price TCGPlayer ${currentYear}`;

    // Determine category for better search
    const isPokemon = /pokemon|pikachu|charizard|mewtwo/i.test(cardName + ' ' + (setName || ''));
    const isSports = category === 'sports' || /topps|panini|prizm|rookie/i.test(cardName + ' ' + (setName || ''));

    console.log(`AI Price Search: "${searchQuery}"`);

    let priceData: PriceResult = {
      market_price: null,
      price_range: null,
      confidence: 0,
      sources: [],
    };

    // Try Tavily first (cheapest and most reliable)
    if (TAVILY_API_KEY) {
      try {
        const tavilyResult = await searchWithTavily(searchQuery, TAVILY_API_KEY);
        if (tavilyResult.market_price) {
          priceData = tavilyResult;
        }
      } catch (e) {
        console.warn("Tavily search failed:", e);
      }
    }

    // Fallback to Claude with web search if Tavily fails
    if (!priceData.market_price && ANTHROPIC_API_KEY) {
      try {
        const claudeResult = await searchWithClaude(searchQuery, ANTHROPIC_API_KEY);
        if (claudeResult.market_price) {
          priceData = claudeResult;
        }
      } catch (e) {
        console.warn("Claude search failed:", e);
      }
    }

    // If no API keys configured, return setup instructions
    if (!TAVILY_API_KEY && !ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "AI search not configured",
          setup_required: true,
          instructions: {
            tavily: "Sign up at https://tavily.com (free tier: 1000/month)",
            anthropic: "Get API key from https://console.anthropic.com",
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        price: priceData.market_price,
        price_range: priceData.price_range,
        confidence: priceData.confidence,
        summary: priceData.raw_response || (priceData.market_price ? `AI estimated price: $${priceData.market_price}` : 'Price not found'),
        sources: priceData.sources,
        search_query: searchQuery,
        card_name: cardName,
        set_name: setName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Price Search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Search using Tavily AI Search API
 * Docs: https://docs.tavily.com/
 */
async function searchWithTavily(query: string, apiKey: string): Promise<PriceResult> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: false,
      max_results: 8,
      // Focus on trusted pricing sources only
      include_domains: [
        "tcgplayer.com",
        "pricecharting.com",
        "pokemonprice.com",
        "psacard.com",
        "130point.com",  // eBay sold price tracker
        "mavin.io",      // Price guide
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract prices from the AI answer and search results
  const prices = extractPricesFromText(data.answer || "");
  const sources = (data.results || []).map((r: any) => r.url);

  // Also extract prices from result snippets
  for (const result of data.results || []) {
    const snippetPrices = extractPricesFromText(result.content || "");
    prices.push(...snippetPrices);
  }

  // Filter out obvious non-prices (shipping, quantities, years, etc.)
  const validPrices = prices.filter(p => {
    // Remove prices that are likely years (1990-2030)
    if (p >= 1990 && p <= 2030) return false;
    // Remove very small prices (likely shipping or cents displayed as dollars)
    if (p < 0.50) return false;
    // Remove unrealistically high prices
    if (p > 50000) return false;
    return true;
  });

  if (validPrices.length === 0) {
    return {
      market_price: null,
      price_range: null,
      confidence: 0,
      sources,
      raw_response: data.answer,
    };
  }

  // Sort and use MEDIAN instead of average (more robust to outliers)
  validPrices.sort((a, b) => a - b);
  const medianPrice = validPrices[Math.floor(validPrices.length / 2)];
  const minPrice = validPrices[0];
  const maxPrice = validPrices[validPrices.length - 1];

  // Confidence based on number of price points and agreement
  let confidence = Math.min(validPrices.length * 15, 60);
  const priceVariance = (maxPrice - minPrice) / medianPrice;
  if (priceVariance < 0.3) confidence += 30; // Prices agree well
  else if (priceVariance < 0.5) confidence += 15;
  confidence = Math.min(confidence, 95);

  return {
    market_price: Math.round(medianPrice * 100) / 100,
    price_range: {
      low: Math.round(minPrice * 100) / 100,
      high: Math.round(maxPrice * 100) / 100,
    },
    confidence,
    sources,
    raw_response: data.answer,
  };
}

/**
 * Search using Claude with web search capability
 */
async function searchWithClaude(query: string, apiKey: string): Promise<PriceResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a trading card price expert. Based on your knowledge of recent market prices (as of early 2024), estimate the current market price for:

"${query}"

Provide your response in this exact JSON format:
{
  "market_price": <number or null if unknown>,
  "price_range_low": <number or null>,
  "price_range_high": <number or null>,
  "confidence": <0-100>,
  "reasoning": "<brief explanation>"
}

Consider:
- TCGPlayer market prices
- eBay sold listings
- Recent sales trends
- Card condition (assume near mint if not specified)
- Grading premiums if applicable

Only return the JSON, no other text.`
        }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "";

  try {
    // Parse JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        market_price: parsed.market_price,
        price_range: parsed.price_range_low && parsed.price_range_high
          ? { low: parsed.price_range_low, high: parsed.price_range_high }
          : null,
        confidence: parsed.confidence || 50,
        sources: ["claude_knowledge"],
        raw_response: parsed.reasoning,
      };
    }
  } catch (e) {
    console.warn("Failed to parse Claude response:", e);
  }

  return {
    market_price: null,
    price_range: null,
    confidence: 0,
    sources: [],
  };
}

/**
 * Extract dollar amounts from text
 */
function extractPricesFromText(text: string): number[] {
  const prices: number[] = [];

  // Match various price formats: $45, $45.99, 45.99 USD, etc.
  const priceRegex = /\$\s*(\d{1,6}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,6}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?)/gi;

  let match;
  while ((match = priceRegex.exec(text)) !== null) {
    const priceStr = (match[1] || match[2]).replace(/,/g, '');
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price > 0) {
      prices.push(price);
    }
  }

  return prices;
}
