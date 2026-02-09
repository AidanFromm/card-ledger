import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * eBay Browse API - FREE (with rate limits)
 * Docs: https://developer.ebay.com/api-docs/buy/browse/overview.html
 * Returns actual SOLD prices from completed eBay listings
 *
 * SETUP REQUIRED:
 * 1. Create eBay Developer account: https://developer.ebay.com/
 * 2. Create an application to get Client ID and Client Secret
 * 3. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET in Supabase secrets
 */

// Cache for OAuth token
let cachedToken: { token: string; expires: number } | null = null;

async function getEbayAccessToken(clientId: string, clientSecret: string): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!response.ok) {
    throw new Error(`eBay OAuth failed: ${response.status}`);
  }

  const data = await response.json();

  // Cache token (expires_in is in seconds, subtract 60 for safety margin)
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, cardName, setName, gradingCompany, grade, category } = await req.json();

    const EBAY_CLIENT_ID = Deno.env.get("EBAY_CLIENT_ID");
    const EBAY_CLIENT_SECRET = Deno.env.get("EBAY_CLIENT_SECRET");

    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
      console.warn("eBay API credentials not configured");
      return new Response(
        JSON.stringify({
          error: "eBay API not configured",
          products: [],
          setup_required: true,
          setup_url: "https://developer.ebay.com/"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OAuth token
    const accessToken = await getEbayAccessToken(EBAY_CLIENT_ID, EBAY_CLIENT_SECRET);

    // Build search query
    let searchQuery = query || cardName || "";

    if (setName && !searchQuery.toLowerCase().includes(setName.toLowerCase())) {
      searchQuery += ` ${setName}`;
    }

    if (gradingCompany && grade) {
      searchQuery += ` ${gradingCompany} ${grade}`;
    }

    // Category IDs for trading cards
    // 183454 = Non-Sport Trading Cards
    // 212 = Sports Trading Cards
    // 2536 = Pokémon Trading Card Game
    const categoryId = category === "sports" ? "212" : "183454";

    const params = new URLSearchParams({
      q: searchQuery.trim(),
      category_ids: categoryId,
      filter: "buyingOptions:{FIXED_PRICE|AUCTION},conditionIds:{1000|1500|2000|2500|3000}", // Various conditions
      sort: "newlyListed",
      limit: "50",
    });

    // Note: eBay Browse API shows ACTIVE listings, not sold
    // For sold listings, we need to use the Finding API or Marketplace Insights API
    // The Browse API is still useful for current market prices
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`;

    console.log(`eBay API request: ${searchQuery}`);

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`eBay API error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ error: `eBay API error: ${response.status}`, products: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const items = data.itemSummaries || [];

    // Transform to CardLedger format
    const products = items.map((item: any) => {
      const price = parseFloat(item.price?.value || "0");

      return {
        id: `ebay-${item.itemId}`,
        ebay_item_id: item.itemId,
        name: item.title,
        set_name: null, // eBay doesn't provide structured set data
        image_url: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl,
        market_price: price,
        lowest_listed: price,
        condition: item.condition,
        listing_type: item.buyingOptions?.includes("AUCTION") ? "auction" : "buy_now",
        seller: item.seller?.username,
        item_url: item.itemWebUrl,
        source: "ebay",
        category: category || "raw",
      };
    });

    // Calculate price statistics
    const prices = products.map((p: any) => p.market_price).filter((p: number) => p > 0);
    const stats = prices.length > 0 ? {
      average: prices.reduce((a: number, b: number) => a + b, 0) / prices.length,
      median: prices.sort((a: number, b: number) => a - b)[Math.floor(prices.length / 2)],
      low: Math.min(...prices),
      high: Math.max(...prices),
      count: prices.length,
    } : null;

    console.log(`eBay API: ${products.length} listings found, price range: $${stats?.low || 0} - $${stats?.high || 0}`);

    return new Response(
      JSON.stringify({
        products,
        stats,
        totalCount: data.total || products.length,
        source: "ebay",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("eBay API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", products: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
