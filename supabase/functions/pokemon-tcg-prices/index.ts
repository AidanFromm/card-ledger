import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Pokemon TCG API - FREE
 * Docs: https://docs.pokemontcg.io/
 * Returns card data with TCGPlayer pricing (market, low, high prices)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, cardId, name, setName, cardNumber } = await req.json();

    const POKEMON_TCG_API_KEY = Deno.env.get("POKEMON_TCG_API_KEY"); // Optional but recommended

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add API key if available (increases rate limits)
    if (POKEMON_TCG_API_KEY) {
      headers["X-Api-Key"] = POKEMON_TCG_API_KEY;
    }

    let url: string;

    if (cardId) {
      // Direct card lookup by ID
      url = `https://api.pokemontcg.io/v2/cards/${cardId}`;
    } else if (name || query) {
      // Search by name/query
      const searchTerms: string[] = [];

      if (name || query) {
        searchTerms.push(`name:"${name || query}*"`);
      }
      if (setName) {
        searchTerms.push(`set.name:"${setName}"`);
      }
      if (cardNumber) {
        searchTerms.push(`number:${cardNumber}`);
      }

      const q = encodeURIComponent(searchTerms.join(" "));
      url = `https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=20&orderBy=-set.releaseDate`;
    } else {
      return new Response(
        JSON.stringify({ error: "Query, cardId, or name required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Pokemon TCG API request: ${url}`);

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(`Pokemon TCG API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `API returned ${response.status}`, products: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Transform to CardLedger format
    const transformCard = (card: any) => {
      const tcgPrices = card.tcgplayer?.prices || {};

      // Get the best price from available variants
      let marketPrice = null;
      let lowPrice = null;

      // Priority: holofoil > reverseHolofoil > normal > 1stEditionHolofoil
      const priceTypes = ['holofoil', 'reverseHolofoil', 'normal', '1stEditionHolofoil', '1stEditionNormal', 'unlimited'];

      for (const type of priceTypes) {
        if (tcgPrices[type]) {
          if (!marketPrice && tcgPrices[type].market) {
            marketPrice = tcgPrices[type].market;
          }
          if (!lowPrice && tcgPrices[type].low) {
            lowPrice = tcgPrices[type].low;
          }
          if (marketPrice && lowPrice) break;
        }
      }

      return {
        id: `ptcg-${card.id}`,
        pokemon_tcg_id: card.id,
        name: card.name,
        set_name: card.set?.name || "Unknown Set",
        card_number: card.number,
        image_url: card.images?.large || card.images?.small,
        market_price: marketPrice,
        lowest_listed: lowPrice,
        high_price: tcgPrices.holofoil?.high || tcgPrices.normal?.high || null,
        rarity: card.rarity,
        artist: card.artist,
        category: "raw",
        source: "pokemon_tcg_api",
        tcgplayer_url: card.tcgplayer?.url,
        // All price variants for detailed view
        price_variants: tcgPrices,
      };
    };

    let products = [];

    if (data.data) {
      // Multiple cards returned
      products = Array.isArray(data.data)
        ? data.data.map(transformCard)
        : [transformCard(data.data)];
    }

    // Filter out cards without prices if searching
    const productsWithPrices = products.filter((p: any) => p.market_price || p.lowest_listed);

    console.log(`Pokemon TCG API: ${products.length} cards found, ${productsWithPrices.length} with prices`);

    return new Response(
      JSON.stringify({
        products,
        productsWithPrices,
        totalCount: products.length,
        withPricesCount: productsWithPrices.length,
        source: "pokemon_tcg_api"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pokemon TCG API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", products: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
