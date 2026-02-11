import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Placeholder image for cards without images
const PLACEHOLDER_IMAGE = 'https://placehold.co/200x280/1a1a2e/white?text=No+Image';

// Scryfall API base URL
const SCRYFALL_API = 'https://api.scryfall.com';

// Rate limiting - Scryfall asks for max 10 requests/second
// We'll add a small delay between requests if needed
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests = max 10/sec

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'CardLedger/1.0 (https://cardledger.app)',
    },
  });
}

interface ScryfallCard {
  id: string;
  name: string;
  set_name: string;
  set: string;
  collector_number: string;
  rarity: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small?: string;
      normal?: string;
      large?: string;
    };
  }>;
  prices: {
    usd?: string | null;
    usd_foil?: string | null;
    usd_etched?: string | null;
    eur?: string | null;
    eur_foil?: string | null;
  };
  artist?: string;
  type_line?: string;
  oracle_text?: string;
  mana_cost?: string;
  cmc?: number;
  colors?: string[];
  color_identity?: string[];
  keywords?: string[];
  legalities?: Record<string, string>;
  released_at?: string;
  reprint?: boolean;
  digital?: boolean;
  promo?: boolean;
  scryfall_uri?: string;
  tcgplayer_id?: number;
  cardmarket_id?: number;
}

interface ScryfallSearchResponse {
  object: string;
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}

interface TransformedCard {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string;
  market_price: number | null;
  lowest_listed: number | null;
  foil_price: number | null;
  rarity: string | null;
  subtypes: string[];
  artist: string | null;
  pokemon_tcg_id: string | null;
  category: string;
  price_source: string | null;
  relevance: number;
  type_line?: string;
  mana_cost?: string;
  oracle_text?: string;
  scryfall_uri?: string;
  tcgplayer_id?: number;
  colors?: string[];
}

function getCardImage(card: ScryfallCard): string {
  // Try normal card image first
  if (card.image_uris?.normal) {
    return card.image_uris.normal;
  }
  if (card.image_uris?.large) {
    return card.image_uris.large;
  }
  if (card.image_uris?.small) {
    return card.image_uris.small;
  }
  
  // For double-faced cards, use the front face
  if (card.card_faces && card.card_faces.length > 0) {
    const frontFace = card.card_faces[0];
    if (frontFace.image_uris?.normal) {
      return frontFace.image_uris.normal;
    }
    if (frontFace.image_uris?.large) {
      return frontFace.image_uris.large;
    }
    if (frontFace.image_uris?.small) {
      return frontFace.image_uris.small;
    }
  }
  
  return PLACEHOLDER_IMAGE;
}

function parsePrice(priceStr: string | null | undefined): number | null {
  if (!priceStr) return null;
  const parsed = parseFloat(priceStr);
  return isNaN(parsed) ? null : parsed;
}

function transformScryfallCard(card: ScryfallCard, queryTokens: string[]): TransformedCard {
  const usdPrice = parsePrice(card.prices.usd);
  const foilPrice = parsePrice(card.prices.usd_foil);
  const etchedPrice = parsePrice(card.prices.usd_etched);
  
  // Use the cheapest available price as market_price
  const availablePrices = [usdPrice, foilPrice, etchedPrice].filter((p): p is number => p !== null);
  const marketPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : null;
  
  // Calculate relevance score based on query match
  const relevance = calculateRelevance(card, queryTokens);
  
  // Extract subtypes from type_line (e.g., "Creature — Human Wizard" -> ["Human", "Wizard"])
  const subtypes: string[] = [];
  if (card.type_line) {
    const dashIndex = card.type_line.indexOf('—');
    if (dashIndex !== -1) {
      const subtypePart = card.type_line.substring(dashIndex + 1).trim();
      subtypes.push(...subtypePart.split(/\s+/));
    }
  }
  
  return {
    id: `scryfall-${card.id}`,
    name: card.name,
    set_name: card.set_name,
    card_number: card.collector_number,
    image_url: getCardImage(card),
    market_price: marketPrice,
    lowest_listed: usdPrice, // Regular USD price is typically lowest
    foil_price: foilPrice,
    rarity: card.rarity,
    subtypes,
    artist: card.artist || null,
    pokemon_tcg_id: null, // Not applicable for MTG
    category: 'raw',
    price_source: marketPrice !== null ? 'scryfall' : null,
    relevance,
    type_line: card.type_line,
    mana_cost: card.mana_cost,
    oracle_text: card.oracle_text,
    scryfall_uri: card.scryfall_uri,
    tcgplayer_id: card.tcgplayer_id,
    colors: card.colors,
  };
}

function calculateRelevance(card: ScryfallCard, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0.5;
  
  const cardName = card.name.toLowerCase();
  const setName = card.set_name.toLowerCase();
  
  let score = 0;
  let matchedTokens = 0;
  
  for (const token of queryTokens) {
    const tokenLower = token.toLowerCase();
    
    // Exact word match in name (highest score)
    if (cardName.split(/\s+/).includes(tokenLower)) {
      score += 1.0;
      matchedTokens++;
    }
    // Name starts with token
    else if (cardName.startsWith(tokenLower)) {
      score += 0.9;
      matchedTokens++;
    }
    // Name contains token
    else if (cardName.includes(tokenLower)) {
      score += 0.7;
      matchedTokens++;
    }
    // Set name contains token
    else if (setName.includes(tokenLower)) {
      score += 0.3;
      matchedTokens++;
    }
    // Collector number match
    else if (card.collector_number.toLowerCase() === tokenLower) {
      score += 0.5;
      matchedTokens++;
    }
  }
  
  // Normalize by query length
  const normalizedScore = queryTokens.length > 0 ? score / queryTokens.length : 0;
  
  // Bonus for matching all tokens
  if (matchedTokens === queryTokens.length && queryTokens.length > 1) {
    return Math.min(normalizedScore + 0.1, 1.0);
  }
  
  // Bonus for having a price
  if (card.prices.usd || card.prices.usd_foil) {
    return Math.min(normalizedScore + 0.02, 1.0);
  }
  
  return Math.min(normalizedScore, 1.0);
}

async function searchScryfall(query: string): Promise<TransformedCard[]> {
  const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  
  try {
    // Build Scryfall search query
    // Scryfall supports name:query for name searches
    const encodedQuery = encodeURIComponent(query);
    const url = `${SCRYFALL_API}/cards/search?q=${encodedQuery}&order=released&dir=desc&unique=prints`;
    
    console.log(`Scryfall search: ${url}`);
    
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      // Scryfall returns 404 for no results
      if (response.status === 404) {
        console.log('Scryfall: No results found');
        return [];
      }
      console.error(`Scryfall error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data: ScryfallSearchResponse = await response.json();
    
    console.log(`Scryfall: Found ${data.total_cards} cards`);
    
    // Transform and return results (limit to first 30 for performance)
    const cards = data.data.slice(0, 30);
    return cards.map(card => transformScryfallCard(card, queryTokens));
    
  } catch (error) {
    console.error('Scryfall search error:', error);
    return [];
  }
}

async function searchScryfallByName(name: string): Promise<TransformedCard | null> {
  const queryTokens = name.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  
  try {
    // Use fuzzy name search for single card lookups
    const encodedName = encodeURIComponent(name);
    const url = `${SCRYFALL_API}/cards/named?fuzzy=${encodedName}`;
    
    console.log(`Scryfall name search: ${url}`);
    
    const response = await rateLimitedFetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Scryfall: Card not found by name');
        return null;
      }
      console.error(`Scryfall name error: ${response.status}`);
      return null;
    }
    
    const card: ScryfallCard = await response.json();
    return transformScryfallCard(card, queryTokens);
    
  } catch (error) {
    console.error('Scryfall name search error:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    const { query, mode = 'search' } = await req.json();
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(JSON.stringify({
        products: [],
        meta: { time_ms: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const trimmedQuery = query.trim();
    let results: TransformedCard[];
    
    if (mode === 'exact' || mode === 'name') {
      // Single card lookup by name
      const card = await searchScryfallByName(trimmedQuery);
      results = card ? [card] : [];
    } else {
      // General search
      results = await searchScryfall(trimmedQuery);
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    const timeMs = Date.now() - startTime;
    console.log(`Scryfall search completed: ${results.length} results in ${timeMs}ms`);
    
    return new Response(JSON.stringify({
      products: results,
      meta: {
        total: results.length,
        with_prices: results.filter(p => p.market_price !== null).length,
        with_images: results.filter(p => p.image_url && !p.image_url.includes('placehold')).length,
        source: 'scryfall',
        time_ms: timeMs,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error('Scryfall handler error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      products: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
