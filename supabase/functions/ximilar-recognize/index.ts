import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Ximilar Card Recognition Edge Function
 *
 * Uses Ximilar's collectibles API to identify trading cards from images.
 * Supports: Pokemon, Yu-Gi-Oh!, MTG, Sports Cards, One Piece, Lorcana
 *
 * SETUP:
 * 1. Sign up at https://www.ximilar.com/ (free: 3,000 credits/month)
 * 2. Get API key from dashboard
 * 3. Add XIMILAR_API_KEY to Supabase secrets
 *
 * API Docs: https://docs.ximilar.com/services/collectibles/
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "image (base64) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const XIMILAR_API_KEY = Deno.env.get("XIMILAR_API_KEY");

    // Return setup required if no API key
    if (!XIMILAR_API_KEY) {
      console.log("Ximilar API key not configured");
      return new Response(
        JSON.stringify({
          setup_required: true,
          message: "Ximilar API key not configured",
          instructions: {
            step1: "Sign up at https://www.ximilar.com/",
            step2: "Get API key from dashboard",
            step3: "Add XIMILAR_API_KEY to Supabase secrets",
            free_tier: "3,000 credits/month",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calling Ximilar card_identify API...");

    // Call Ximilar card identification endpoint
    const response = await fetch(
      "https://api.ximilar.com/collectibles/v2/identify",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${XIMILAR_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              _base64: image,
            },
          ],
          // Request rotation correction
          detect_rotation: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ximilar API error: ${response.status} - ${errorText}`);

      // Handle specific error cases
      if (response.status === 401) {
        return new Response(
          JSON.stringify({
            setup_required: true,
            message: "Invalid Ximilar API key",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Ximilar API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ximilar response received");

    // Parse Ximilar response
    const record = data.records?.[0];

    if (!record || !record._objects || record._objects.length === 0) {
      return new Response(
        JSON.stringify({
          card: null,
          message: "No card detected in image",
          confidence: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cardObject = record._objects[0];
    const cardData = cardObject.card_data || cardObject.best_match || {};
    const confidence = Math.round((cardObject.prob || cardObject.score || 0) * 100);

    // Build card response
    const card = {
      name: cardData.name || cardData.card_name || cardData.title || "Unknown Card",
      set_name: cardData.set || cardData.series || cardData.set_name || cardData.expansion || "Unknown Set",
      card_number: cardData.number || cardData.card_number || cardData.collector_number || null,
      year: cardData.year ? parseInt(cardData.year) : null,
      // Sports card fields
      player: cardData.player || cardData.subject || cardData.athlete || null,
      team: cardData.team || null,
      brand: cardData.brand || cardData.manufacturer || cardData.publisher || null,
      // Category detection
      category: detectCategory(cardData, cardObject),
      // Image from Ximilar if available
      image_url: cardData.image_url || cardData.image || null,
    };

    // Get alternatives if available
    const alternatives = (record._objects.slice(1, 4) || []).map((obj: any) => ({
      name: obj.card_data?.name || obj.best_match?.name || "Unknown",
      confidence: Math.round((obj.prob || obj.score || 0) * 100),
    }));

    // Try to get pricing if available (costs extra credits)
    let marketPrice = null;
    if (cardData.tcgplayer_price || cardData.market_price || cardData.price) {
      marketPrice = cardData.tcgplayer_price || cardData.market_price || cardData.price;
    }

    return new Response(
      JSON.stringify({
        card: {
          ...card,
          market_price: marketPrice,
        },
        confidence,
        alternatives,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ximilar recognition error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        card: null,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Detect card category from Ximilar data
 */
function detectCategory(cardData: any, cardObject: any): string {
  const game = (
    cardData.game ||
    cardData.tcg ||
    cardData.category ||
    cardObject.category ||
    ""
  ).toLowerCase();

  if (game.includes("pokemon") || game.includes("pokémon")) return "pokemon";
  if (game.includes("magic") || game.includes("mtg")) return "mtg";
  if (game.includes("yugioh") || game.includes("yu-gi-oh")) return "yugioh";
  if (game.includes("one piece")) return "one_piece";
  if (game.includes("lorcana")) return "lorcana";
  if (
    cardData.sport ||
    cardData.player ||
    cardData.athlete ||
    game.includes("sport") ||
    game.includes("baseball") ||
    game.includes("basketball") ||
    game.includes("football") ||
    game.includes("hockey")
  ) {
    return "sports";
  }

  return "raw";
}
