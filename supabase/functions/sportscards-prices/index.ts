import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Sports Cards Pricing API
 * Multiple sources for sports card data:
 * 1. SportsCardsPro - Free tier available
 * 2. Card Ladder - Premium
 * 3. Beckett - Manual lookup
 *
 * SETUP:
 * - SPORTSCARDSPRO_API_KEY (optional, for higher rate limits)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, playerName, year, brand, cardNumber, sport, gradingCompany, grade } = await req.json();

    if (!query && !playerName) {
      return new Response(
        JSON.stringify({ error: "query or playerName required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const products: any[] = [];

    // Build search query
    let searchQuery = query || "";
    if (playerName) searchQuery = playerName;
    if (year) searchQuery += ` ${year}`;
    if (brand) searchQuery += ` ${brand}`;
    if (cardNumber) searchQuery += ` #${cardNumber}`;
    if (gradingCompany && grade) searchQuery += ` ${gradingCompany} ${grade}`;

    // Determine sport category
    const sportCategory = sport?.toLowerCase() || detectSport(searchQuery);

    console.log(`Sports card search: "${searchQuery}" (${sportCategory})`);

    // Try PriceCharting API (already have this integrated)
    // This is a backup data source for sports cards
    const PRICECHARTING_API_KEY = Deno.env.get("PRICECHARTING_API_KEY");

    if (PRICECHARTING_API_KEY) {
      try {
        const pcUrl = `https://www.pricecharting.com/api/products?t=${PRICECHARTING_API_KEY}&q=${encodeURIComponent(searchQuery)}&type=trading-cards`;

        const pcResponse = await fetch(pcUrl);

        if (pcResponse.ok) {
          const pcData = await pcResponse.json();
          const pcProducts = pcData.products || [];

          pcProducts.forEach((product: any) => {
            // Filter for sports cards based on console/category
            if (isSportsCard(product)) {
              products.push({
                id: `pc-${product.id}`,
                pricecharting_id: product.id,
                name: product["product-name"],
                set_name: product.console || product.category,
                image_url: null, // PriceCharting doesn't provide images
                market_price: parseFloat(product.price) / 100 || null, // Price is in cents
                lowest_listed: parseFloat(product["loose-price"]) / 100 || null,
                graded_price: parseFloat(product["graded-price"]) / 100 || null,
                category: "sports",
                sport: sportCategory,
                source: "pricecharting",
              });
            }
          });
        }
      } catch (error) {
        console.warn("PriceCharting sports lookup failed:", error);
      }
    }

    // Generate lookup URLs for manual verification
    const lookupUrls = {
      sportscardspro: `https://www.sportscardspro.com/search?q=${encodeURIComponent(searchQuery)}`,
      beckett: `https://www.beckett.com/search/?term=${encodeURIComponent(searchQuery)}&type=cards`,
      psaCard: `https://www.psacard.com/smrpriceguide?s=${encodeURIComponent(searchQuery)}`,
      cardLadder: `https://www.cardladder.com/search?q=${encodeURIComponent(searchQuery)}`,
      ebay: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&_sacat=212&LH_Sold=1`,
    };

    // Return sports-specific data structure
    return new Response(
      JSON.stringify({
        products,
        sport: sportCategory,
        lookupUrls,
        totalCount: products.length,
        source: "multi",
        message: products.length === 0
          ? "No automated pricing found. Use lookup URLs for manual research."
          : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sports cards API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", products: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function detectSport(query: string): string {
  const lowerQuery = query.toLowerCase();

  // Baseball keywords
  if (/topps|bowman|mlb|baseball|batting|pitcher|rookie.*year/i.test(lowerQuery)) {
    return "baseball";
  }

  // Basketball keywords
  if (/nba|basketball|panini.*prizm|hoops|lebron|jordan|curry/i.test(lowerQuery)) {
    return "basketball";
  }

  // Football keywords
  if (/nfl|football|panini.*select|mahomes|brady|touchdown/i.test(lowerQuery)) {
    return "football";
  }

  // Hockey keywords
  if (/nhl|hockey|upper deck.*series|gretzky|mcdavid/i.test(lowerQuery)) {
    return "hockey";
  }

  // Soccer keywords
  if (/soccer|fifa|premier league|messi|ronaldo|mbappe/i.test(lowerQuery)) {
    return "soccer";
  }

  return "unknown";
}

function isSportsCard(product: any): boolean {
  const name = (product["product-name"] || "").toLowerCase();
  const category = (product.console || product.category || "").toLowerCase();

  const sportsKeywords = [
    "topps", "panini", "bowman", "upper deck", "fleer", "donruss",
    "basketball", "baseball", "football", "hockey", "soccer",
    "nba", "mlb", "nfl", "nhl",
    "rookie", "prizm", "optic", "select", "mosaic",
  ];

  return sportsKeywords.some(kw => name.includes(kw) || category.includes(kw));
}
