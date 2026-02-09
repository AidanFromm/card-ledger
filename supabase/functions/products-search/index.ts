import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Placeholder image for cards without images
const PLACEHOLDER_IMAGE = 'https://placehold.co/200x280/1a1a2e/white?text=No+Image';

// =============================================
// ABBREVIATIONS & EXPANSIONS
// =============================================

const ABBREVIATIONS: Record<string, string[]> = {
  // Product types
  'etb': ['elite trainer box'],
  'bb': ['booster box'],
  'pc': ['pokemon center'],
  'upc': ['ultra premium collection'],

  // Card conditions/types
  'rc': ['rookie'],
  'auto': ['autograph'],
  'sp': ['short print'],
  'ssp': ['super short print'],
  'mem': ['memorabilia'],
  'patch': ['patch card'],
  'rpa': ['rookie patch auto'],

  // Rarities
  'fa': ['full art'],
  'alt': ['alternate art'],
  'sr': ['secret rare'],
  'ur': ['ultra rare'],
  'sar': ['special art rare'],
  'chr': ['character rare'],
  'csr': ['character super rare'],
  'ar': ['art rare'],
  'sir': ['special illustration rare'],
  'ir': ['illustration rare'],
  'hr': ['hyper rare'],
  'rr': ['double rare'],
  'rrr': ['triple rare'],

  // Languages
  'jap': ['japanese'],
  'jp': ['japanese'],
  'jpn': ['japanese'],
  'kor': ['korean'],
  'eng': ['english'],
  'chi': ['chinese'],

  // Sports positions
  'qb': ['quarterback'],
  'wr': ['wide receiver'],
  'rb': ['running back'],
  'te': ['tight end'],
  'pg': ['point guard'],
  'sg': ['shooting guard'],
  'sf': ['small forward'],
  'pf': ['power forward'],

  // Card variants
  'holo': ['holofoil'],
  'rev': ['reverse'],
  'ref': ['refractor'],
  'prism': ['prizm'],
  '1st': ['first edition'],
};

// =============================================
// SPORTS DETECTION
// =============================================

const SPORTS_INDICATORS = {
  players: [
    'brady', 'mahomes', 'rodgers', 'manning', 'favre', 'rice', 'montana', 'elway',
    'aikman', 'marino', 'brees', 'wilson', 'prescott', 'burrow', 'allen', 'herbert',
    'stroud', 'richardson', 'hurts', 'jackson', 'tua', 'lawrence', 'fields',
    'jordan', 'lebron', 'kobe', 'curry', 'durant', 'shaq', 'magic', 'bird',
    'iverson', 'wade', 'garnett', 'duncan', 'nowitzki', 'giannis', 'luka', 'tatum',
    'wembanyama', 'victor', 'zion', 'morant', 'edwards', 'booker', 'jokic',
    'trout', 'ohtani', 'jeter', 'griffey', 'ruth', 'mays', 'mantle', 'aaron',
    'bonds', 'pujols', 'judge', 'soto', 'acuna', 'tatis', 'vlad', 'betts',
    'gretzky', 'crosby', 'ovechkin', 'mcdavid', 'lemieux', 'orr', 'howe',
    'messi', 'ronaldo', 'haaland', 'mbappe',
  ],
  teams: [
    'patriots', 'chiefs', 'cowboys', 'packers', 'raiders', '49ers', 'eagles', 'bears',
    'bills', 'dolphins', 'jets', 'ravens', 'steelers', 'bengals', 'browns', 'texans',
    'colts', 'jaguars', 'titans', 'broncos', 'chargers', 'commanders', 'giants',
    'lakers', 'celtics', 'bulls', 'warriors', 'heat', 'nets', 'knicks', 'spurs',
    'suns', 'bucks', 'sixers', 'mavericks', 'nuggets', 'clippers', 'rockets',
    'yankees', 'dodgers', 'red sox', 'cubs', 'braves', 'mets', 'cardinals',
    'astros', 'phillies', 'padres', 'mariners', 'giants', 'angels', 'rangers',
    'bruins', 'penguins', 'rangers', 'blackhawks', 'maple leafs', 'canadiens',
  ],
  brands: [
    'topps', 'panini', 'upper deck', 'bowman', 'donruss', 'fleer', 'score',
    'prizm', 'select', 'mosaic', 'optic', 'contenders', 'national treasures',
    'spectra', 'immaculate', 'chronicles', 'absolute', 'certified', 'prestige',
    'playoff', 'leaf', 'sage', 'press pass', 'sp authentic', 'exquisite',
  ],
  keywords: ['rookie', 'rc', 'auto', 'autograph', 'patch', 'jersey', 'relic', 'refractor', 'parallel', 'numbered', '/99', '/25', '/10', '/5', '/1'],
};

function detectSportsQuery(query: string): { isSports: boolean; confidence: number; detectedTerms: string[] } {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);
  const detectedTerms: string[] = [];
  let score = 0;

  for (const player of SPORTS_INDICATORS.players) {
    if (lowerQuery.includes(player)) {
      score += 3;
      detectedTerms.push(`player:${player}`);
    }
  }

  for (const team of SPORTS_INDICATORS.teams) {
    if (lowerQuery.includes(team)) {
      score += 2;
      detectedTerms.push(`team:${team}`);
    }
  }

  for (const brand of SPORTS_INDICATORS.brands) {
    if (lowerQuery.includes(brand)) {
      score += 1.5;
      detectedTerms.push(`brand:${brand}`);
    }
  }

  for (const keyword of SPORTS_INDICATORS.keywords) {
    if (words.includes(keyword) || lowerQuery.includes(keyword)) {
      score += 0.5;
      detectedTerms.push(`keyword:${keyword}`);
    }
  }

  const yearMatch = lowerQuery.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    score += 0.5;
    detectedTerms.push(`year:${yearMatch[1]}`);
  }

  // Negative indicators (TCG/Pokemon terms)
  const tcgTerms = ['pokemon', 'pikachu', 'charizard', 'magic', 'mtg', 'yugioh', 'yu-gi-oh', 'lorcana', 'one piece', 'digimon', 'weiss', 'cardfight'];
  for (const term of tcgTerms) {
    if (lowerQuery.includes(term)) {
      score -= 5;
    }
  }

  const confidence = Math.min(score / 5, 1);
  return {
    isSports: score >= 2,
    confidence,
    detectedTerms,
  };
}

// =============================================
// TCG DETECTION (Pokemon, One Piece, etc.)
// =============================================

const ONE_PIECE_INDICATORS = [
  'one piece', 'onepiece', 'op-', 'op01', 'op02', 'op03', 'op04', 'op05', 'op06', 'op07', 'op08',
  'luffy', 'zoro', 'roronoa', 'nami', 'sanji', 'usopp', 'chopper', 'robin', 'franky', 'brook', 'jinbe',
  'shanks', 'ace', 'portgas', 'whitebeard', 'kaido', 'big mom', 'blackbeard', 'doflamingo', 'law', 'trafalgar',
  'straw hat', 'marine', 'warlord', 'yonko', 'mugiwara',
  'romance dawn', 'paramount war', 'pillars of strength', 'kingdoms of intrigue',
  'awakening of the new era', 'wings of the captain', 'two legends',
  'memorial collection', 'extra booster', 'starter deck',
];

const OTHER_TCG_INDICATORS = {
  'yugioh': ['yu-gi-oh', 'yugioh', 'dark magician', 'blue eyes', 'exodia', 'konami'],
  'magic': ['magic the gathering', 'mtg', 'planeswalker', 'mana', 'wizards of the coast'],
  'lorcana': ['disney lorcana', 'lorcana', 'illumineer'],
  'digimon': ['digimon', 'agumon', 'gabumon', 'bandai'],
  'weiss': ['weiss schwarz', 'weiss', 'schwarz'],
};

function detectTCGType(query: string): { tcgType: string; confidence: number } {
  const lowerQuery = query.toLowerCase();

  // Check for One Piece
  let onePieceScore = 0;
  for (const indicator of ONE_PIECE_INDICATORS) {
    if (lowerQuery.includes(indicator)) {
      onePieceScore += indicator.length > 4 ? 2 : 1;
    }
  }
  if (onePieceScore >= 2) {
    return { tcgType: 'one_piece', confidence: Math.min(onePieceScore / 4, 1) };
  }

  // Check for other TCGs
  for (const [tcg, indicators] of Object.entries(OTHER_TCG_INDICATORS)) {
    for (const indicator of indicators) {
      if (lowerQuery.includes(indicator)) {
        return { tcgType: tcg, confidence: 0.9 };
      }
    }
  }

  // Check for Pokemon (default for generic card queries)
  const pokemonTerms = ['pokemon', 'pikachu', 'charizard', 'mewtwo', 'eevee', 'bulbasaur', 'squirtle', 'jigglypuff'];
  for (const term of pokemonTerms) {
    if (lowerQuery.includes(term)) {
      return { tcgType: 'pokemon', confidence: 0.95 };
    }
  }

  return { tcgType: 'unknown', confidence: 0 };
}

// =============================================
// QUERY NORMALIZATION & MATCHING
// =============================================

function normalizeQuery(query: string): {
  original: string;
  normalized: string;
  tokens: string[];
  expandedQuery: string;
} {
  const lower = query.toLowerCase().trim();
  const tokens = lower.split(/\s+/).filter(t => t.length > 0);

  // Expand abbreviations
  const expandedTokens: string[] = [];
  for (const token of tokens) {
    expandedTokens.push(token);
    if (ABBREVIATIONS[token]) {
      expandedTokens.push(...ABBREVIATIONS[token]);
    }
  }

  // Remove noise words for matching (but keep for display)
  const noiseWords = new Set(['the', 'a', 'an', 'of', 'in', 'for', 'and', 'or']);
  const filteredTokens = expandedTokens.filter(t => !noiseWords.has(t));

  return {
    original: query,
    normalized: lower,
    tokens: filteredTokens,
    expandedQuery: filteredTokens.join(' '),
  };
}

// Simple phonetic encoding for typo tolerance
function phoneticEncode(word: string): string {
  return word.toLowerCase()
    .replace(/[aeiou]/g, 'a')   // All vowels → a
    .replace(/[sz]/g, 's')      // S/Z confusion
    .replace(/[ck]/g, 'k')      // C/K confusion
    .replace(/[pb]/g, 'b')      // P/B confusion
    .replace(/[dt]/g, 'd')      // D/T confusion
    .replace(/[fv]/g, 'f')      // F/V confusion
    .replace(/[gj]/g, 'g')      // G/J confusion
    .replace(/[mn]/g, 'm')      // M/N confusion
    .replace(/[wy]/g, 'w')      // W/Y confusion
    .replace(/x/g, 'ks')        // X → KS
    .replace(/qu/g, 'kw')       // QU → KW
    .replace(/(.)\1+/g, '$1');  // Remove repeated chars
}

// Calculate token-based match score (word-order-independent)
function calculateTokenMatchScore(queryTokens: string[], targetText: string): number {
  if (!targetText || queryTokens.length === 0) return 0;

  const targetLower = targetText.toLowerCase();
  const targetTokens = targetLower.split(/\s+/);
  const targetPhonetic = targetTokens.map(phoneticEncode);

  let totalScore = 0;

  for (const qToken of queryTokens) {
    const qPhonetic = phoneticEncode(qToken);

    // Exact token match (highest score)
    if (targetTokens.includes(qToken)) {
      totalScore += 1.0;
      continue;
    }

    // Phonetic match (catches typos)
    if (targetPhonetic.includes(qPhonetic)) {
      totalScore += 0.9;
      continue;
    }

    // Prefix match (autocomplete feel)
    if (targetTokens.some(t => t.startsWith(qToken))) {
      totalScore += 0.8;
      continue;
    }

    // Phonetic prefix match
    if (targetPhonetic.some(t => t.startsWith(qPhonetic))) {
      totalScore += 0.7;
      continue;
    }

    // Contains match (substring)
    if (targetLower.includes(qToken)) {
      totalScore += 0.5;
      continue;
    }

    // Phonetic contains
    if (targetPhonetic.some(t => t.includes(qPhonetic))) {
      totalScore += 0.4;
    }
  }

  // Normalize by number of query tokens
  return totalScore / queryTokens.length;
}

// Calculate trigram similarity (Jaccard)
function trigramSimilarity(a: string, b: string): number {
  const getTrigrams = (s: string): Set<string> => {
    const padded = `  ${s.toLowerCase()}  `;
    const trigrams = new Set<string>();
    for (let i = 0; i < padded.length - 2; i++) {
      trigrams.add(padded.substring(i, i + 3));
    }
    return trigrams;
  };

  const trigramsA = getTrigrams(a);
  const trigramsB = getTrigrams(b);

  let intersection = 0;
  for (const t of trigramsA) {
    if (trigramsB.has(t)) intersection++;
  }

  const union = trigramsA.size + trigramsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// =============================================
// DEDUPLICATION
// =============================================

function createCardKey(card: any): string {
  const normalizeName = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  return [
    normalizeName(card.name),
    normalizeName(card.set_name),
    (card.card_number || '').toString().toLowerCase(),
  ].join('|');
}

function scoreItemQuality(item: any): number {
  let score = 0;
  if (item.image_url && !item.image_url.includes('placehold')) score += 3;
  if (item.market_price) score += 2;
  if (item.relevance) score += item.relevance;
  if (item.price_source) score += 1;
  return score;
}

function deduplicateResults(results: any[]): any[] {
  const seen = new Map<string, { item: any; index: number }>();
  const output: any[] = [];

  for (const item of results) {
    const key = createCardKey(item);

    if (!seen.has(key)) {
      seen.set(key, { item, index: output.length });
      output.push(item);
    } else {
      // Compare quality and keep the better one
      const existing = seen.get(key)!;
      const existingScore = scoreItemQuality(existing.item);
      const newScore = scoreItemQuality(item);

      if (newScore > existingScore) {
        output[existing.index] = item;
        seen.set(key, { item, index: existing.index });
      }
    }
  }

  return output;
}

// =============================================
// RELEVANCE SCORING
// =============================================

function calculateRelevance(item: any, normalizedQuery: any): number {
  const { normalized, tokens } = normalizedQuery;
  const name = (item.name || '').toLowerCase();
  const setName = (item.set_name || '').toLowerCase();
  const player = (item.player || '').toLowerCase();

  let score = 0;

  // 1. Exact name match
  if (name === normalized) {
    score = 1.0;
  }
  // 2. Name starts with query (autocomplete)
  else if (name.startsWith(normalized)) {
    score = 0.95;
  }
  // 3. Token-based matching (word-order-independent)
  else {
    const tokenScore = calculateTokenMatchScore(tokens, name);
    score = tokenScore * 0.9;
  }

  // 4. Player name match (for sports cards)
  if (player) {
    const playerTokenScore = calculateTokenMatchScore(tokens, player);
    if (playerTokenScore > 0.5) {
      score = Math.max(score, playerTokenScore * 0.85);
    }
  }

  // 5. Set name bonus
  const setScore = calculateTokenMatchScore(tokens, setName);
  if (setScore > 0.3) {
    score += setScore * 0.1;
  }

  // 6. Trigram similarity fallback
  if (score < 0.3) {
    const trigramScore = trigramSimilarity(normalized, name);
    score = Math.max(score, trigramScore * 0.7);
  }

  // 7. Quality bonuses
  if (item.image_url && !item.image_url.includes('placehold')) score += 0.03;
  if (item.market_price) score += 0.02;

  return Math.min(score, 1);
}

// =============================================
// API FETCHERS
// =============================================

async function fetchWithTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  try {
    return await Promise.race([promise, timeout]);
  } catch {
    return fallback;
  }
}

async function fetchPokemonTcgCards(query: string, normalizedQuery: any): Promise<any[]> {
  const POKEMON_TCG_API_KEY = Deno.env.get("POKEMON_TCG_API_KEY");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (POKEMON_TCG_API_KEY) headers["X-Api-Key"] = POKEMON_TCG_API_KEY;

  // Check if query looks like a card number (numeric, or formats like "158/165", "#158")
  const cardNumberMatch = query.match(/^#?(\d+)(?:\/\d+)?$/);
  const isNumericQuery = cardNumberMatch !== null;

  // Build search query - search by name OR number if query is numeric
  let searchQuery: string;
  if (isNumericQuery) {
    const number = cardNumberMatch[1];
    // Search by number (Pokemon TCG API uses 'number' field)
    searchQuery = `number:${number}`;
  } else {
    // Standard name search
    searchQuery = `name:"${query}*"`;
  }

  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&pageSize=30`;

  const response = await fetch(url, { headers });
  if (!response.ok) return [];

  const data = await response.json();
  const cards = data.data || [];

  return cards.map((card: any) => {
    const prices = card.tcgplayer?.prices || {};
    const priceTypes = ['holofoil', 'reverseHolofoil', 'normal', '1stEditionHolofoil'];
    let marketPrice = null;
    let lowestListed = null;

    for (const type of priceTypes) {
      if (prices[type]?.market) {
        marketPrice = prices[type].market;
        lowestListed = prices[type].low || marketPrice;
        break;
      }
    }

    const item = {
      id: `ptcg-${card.id}`,
      name: card.name,
      set_name: card.set?.name || 'Unknown Set',
      card_number: card.number || null,
      image_url: card.images?.large || card.images?.small || PLACEHOLDER_IMAGE,
      market_price: marketPrice,
      lowest_listed: lowestListed,
      rarity: card.rarity || null,
      subtypes: card.subtypes || [],
      artist: card.artist || null,
      pokemon_tcg_id: card.id,
      category: 'raw',
      price_source: marketPrice ? 'pokemon_tcg' : null,
      relevance: 0,
    };

    item.relevance = calculateRelevance(item, normalizedQuery);
    return item;
  });
}

async function fetchScrydexProducts(query: string, normalizedQuery: any): Promise<any[]> {
  const SCRYDEX_API_KEY = Deno.env.get("SCRYDEX_API_KEY");
  const SCRYDEX_TEAM_ID = Deno.env.get("SCRYDEX_TEAM_ID");
  if (!SCRYDEX_API_KEY || !SCRYDEX_TEAM_ID) return [];

  const isSealedQuery = /\b(booster box|elite trainer box|etb|tin|collection|bundle|case|upc)s?\b/i.test(query);
  const base = 'https://api.scrydex.com/pokemon/v1';
  const endpoint = isSealedQuery ? 'sealed' : 'cards';
  const url = `${base}/${endpoint}?q=${encodeURIComponent(query)}&page_size=30`;

  const response = await fetch(url, {
    headers: {
      'X-Api-Key': SCRYDEX_API_KEY,
      'X-Team-ID': SCRYDEX_TEAM_ID,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) return [];

  const data = await response.json();
  const products = data?.data || [];

  return products.map((p: any) => {
    const item = {
      id: `scrydex-${p.id || p.sku}`,
      name: p.name || p.title,
      set_name: p.expansion?.name || p.set?.name || 'Unknown Set',
      card_number: p.number || null,
      image_url: p.images?.[0]?.large || p.images?.large || p.image || PLACEHOLDER_IMAGE,
      market_price: p.prices?.market_price || p.market_price || null,
      lowest_listed: p.prices?.lowest_listed || p.lowest_listed || null,
      rarity: p.rarity || null,
      subtypes: p.types || p.subtypes || [],
      artist: p.artist || null,
      pokemon_tcg_id: `scrydex-${p.id || p.sku}`,
      category: isSealedQuery ? 'sealed' : 'raw',
      price_source: p.prices?.market_price ? 'scrydex' : null,
      relevance: 0,
    };

    item.relevance = calculateRelevance(item, normalizedQuery);
    return item;
  });
}

async function fetchSportsCardsViaTavily(query: string, normalizedQuery: any): Promise<any[]> {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) return [];

  const searchQuery = `${query} sports card price value`;

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: searchQuery,
      search_depth: "advanced",
      include_answer: true,
      include_images: true,
      max_results: 10,
      include_domains: ["ebay.com", "comc.com", "130point.com", "psacard.com", "sportscardspro.com"],
    }),
  });

  if (!response.ok) return [];

  const data = await response.json();
  const results: any[] = [];
  const answer = data.answer || '';
  const images = data.images || [];

  // Extract prices from answer
  const priceMatches = answer.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
  const prices = priceMatches
    .map((p: string) => parseFloat(p.replace(/[$,]/g, '')))
    .filter((p: number) => p > 0.5 && p < 100000)
    .sort((a: number, b: number) => a - b);

  const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : null;
  const isRookie = /rookie|rc\b/i.test(query);
  const yearMatch = query.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Create a result for each unique card found
  if (answer || data.results?.length > 0) {
    const cardImage = images.length > 0 ? images[0] : PLACEHOLDER_IMAGE;

    const item = {
      id: `tavily-${Date.now()}`,
      name: query.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      set_name: 'Sports Card (AI Search)',
      card_number: null,
      image_url: cardImage,
      market_price: medianPrice,
      lowest_listed: prices.length > 0 ? prices[0] : null,
      rarity: null,
      subtypes: [],
      artist: null,
      pokemon_tcg_id: null,
      category: 'sports',
      player: query,
      team: null,
      sport: null,
      year: year,
      brand: null,
      rookie: isRookie,
      price_source: medianPrice ? 'tavily' : null,
      ai_summary: answer,
      search_urls: data.results?.slice(0, 3).map((r: any) => ({ title: r.title, url: r.url })) || [],
      relevance: 0.8, // AI results get good relevance
    };

    results.push(item);
  }

  return results;
}

// Specialized One Piece TCG search via Tavily
async function fetchOnePieceCards(query: string, normalizedQuery: any): Promise<any[]> {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) return [];

  // Clean query and add One Piece context if not present
  let searchQuery = query;
  if (!query.toLowerCase().includes('one piece')) {
    searchQuery = `One Piece TCG ${query}`;
  }
  searchQuery = `${searchQuery} card price image`;

  console.log(`One Piece search: "${searchQuery}"`);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "advanced",
        include_answer: true,
        include_images: true,
        max_results: 15,
        include_domains: [
          "tcgplayer.com",
          "cardmarket.com",
          "tcgrepublic.com",
          "trollandtoad.com",
          "ebay.com",
          "onepiece-cardgame.com",
          "onepiecetopdecks.com",
        ],
      }),
    });

    if (!response.ok) {
      console.error(`One Piece Tavily error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results: any[] = [];
    const answer = data.answer || '';
    const images = data.images || [];
    const webResults = data.results || [];

    // Extract prices from answer
    const priceMatches = answer.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
    const prices = priceMatches
      .map((p: string) => parseFloat(p.replace(/[$,]/g, '')))
      .filter((p: number) => p > 0.10 && p < 10000)
      .sort((a: number, b: number) => a - b);

    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : null;

    // Try to find card images from web results
    let cardImage = PLACEHOLDER_IMAGE;

    // First try direct images from Tavily
    if (images.length > 0) {
      // Prefer tcgplayer or cardmarket images
      const preferredImage = images.find((img: string) =>
        img.includes('tcgplayer') ||
        img.includes('cardmarket') ||
        img.includes('onepiece')
      );
      cardImage = preferredImage || images[0];
    }

    // Parse web results for additional info
    let setName = 'One Piece TCG';
    let cardNumber = null;

    for (const result of webResults) {
      const title = result.title || '';
      const content = result.content || '';

      // Try to extract set name from result
      const setMatch = title.match(/\[(OP\d{2}|EB\d{2}|ST\d{2})\]/i) ||
                       content.match(/(Romance Dawn|Paramount War|Pillars of Strength|Kingdoms of Intrigue|Awakening of the New Era|Wings of the Captain|Two Legends|Memorial Collection|500 Years in the Future)/i);
      if (setMatch) {
        setName = setMatch[1] || setMatch[0];
      }

      // Try to extract card number
      const numMatch = title.match(/[#-]?(\d{3})/);
      if (numMatch) {
        cardNumber = numMatch[1];
      }

      // Get image from result if available
      if (!cardImage || cardImage === PLACEHOLDER_IMAGE) {
        if (result.image) cardImage = result.image;
      }
    }

    // Create result item
    if (answer || webResults.length > 0) {
      const item = {
        id: `onepiece-${Date.now()}`,
        name: query.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
        set_name: setName,
        card_number: cardNumber,
        image_url: cardImage,
        market_price: medianPrice,
        lowest_listed: prices.length > 0 ? prices[0] : null,
        rarity: null,
        subtypes: [],
        artist: null,
        pokemon_tcg_id: null,
        category: 'raw',
        price_source: medianPrice ? 'tavily' : null,
        ai_summary: answer,
        search_urls: webResults.slice(0, 3).map((r: any) => ({ title: r.title, url: r.url })),
        relevance: 0.85,
      };

      item.relevance = calculateRelevance(item, normalizedQuery);
      results.push(item);
    }

    console.log(`One Piece search: Found ${results.length} results, has image: ${cardImage !== PLACEHOLDER_IMAGE}`);
    return results;
  } catch (error) {
    console.error('One Piece search error:', error);
    return [];
  }
}

async function fetchTavilyFallback(query: string, normalizedQuery: any): Promise<any[]> {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) return [];

  // Detect TCG type for better search
  const tcgDetection = detectTCGType(query);

  let searchQuery: string;
  let domains: string[] = [];

  if (tcgDetection.tcgType === 'one_piece') {
    searchQuery = `One Piece TCG ${query} card price image`;
    domains = ["tcgplayer.com", "cardmarket.com", "tcgrepublic.com", "ebay.com"];
  } else if (tcgDetection.tcgType === 'yugioh') {
    searchQuery = `Yu-Gi-Oh ${query} card price`;
    domains = ["tcgplayer.com", "cardmarket.com", "yugiohprices.com"];
  } else if (tcgDetection.tcgType === 'magic') {
    searchQuery = `Magic The Gathering MTG ${query} card price`;
    domains = ["tcgplayer.com", "cardmarket.com", "scryfall.com"];
  } else {
    const isPokemon = /pokemon|pikachu|charizard|mewtwo|eevee|tcg/i.test(query);
    searchQuery = isPokemon
      ? `${query} pokemon card tcgplayer price`
      : `${query} trading card price value`;
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "advanced",
        include_answer: true,
        include_images: true,
        max_results: 8,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results: any[] = [];
    const answer = data.answer || '';
    const images = data.images || [];
    const cardImage = images.length > 0 ? images[0] : PLACEHOLDER_IMAGE;

    const priceMatches = answer.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
    const prices = priceMatches
      .map((p: string) => parseFloat(p.replace(/[$,]/g, '')))
      .filter((p: number) => p > 0.1 && p < 100000)
      .sort((a: number, b: number) => a - b);

    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : null;

    if (answer || data.results?.length > 0) {
      results.push({
        id: `tavily-${Date.now()}`,
        name: query.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
        set_name: isPokemon ? 'Pokemon (AI Search)' : 'Trading Card (AI Search)',
        card_number: null,
        image_url: cardImage,
        market_price: medianPrice,
        lowest_listed: prices.length > 0 ? prices[0] : null,
        rarity: null,
        subtypes: [],
        artist: null,
        pokemon_tcg_id: null,
        category: isPokemon ? 'raw' : 'sports',
        player: isPokemon ? null : query,
        team: null,
        sport: null,
        year: null,
        brand: null,
        rookie: /rookie|rc\b/i.test(query),
        price_source: medianPrice ? 'tavily' : null,
        ai_summary: answer,
        search_urls: data.results?.slice(0, 3).map((r: any) => ({ title: r.title, url: r.url })) || [],
        relevance: 0.7,
      });
    }

    return results;
  } catch (error) {
    console.error('Tavily fallback error:', error);
    return [];
  }
}

// =============================================
// GRADED SLAB IMAGE SEARCH
// =============================================

async function fetchGradedSlabImages(
  cardName: string,
  gradingCompany: string,
  grade: string | null,
  normalizedQuery: any
): Promise<any[]> {
  const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY_API_KEY) return [];

  // Search specifically for slab images
  const gradeStr = grade ? ` ${grade}` : '';
  const searchQuery = `${cardName} ${gradingCompany.toUpperCase()}${gradeStr} graded slab card`;

  console.log(`Graded slab search: "${searchQuery}"`);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "advanced",
        include_images: true,
        max_results: 10,
        include_domains: [
          "psacard.com",
          "beckett.com",
          "cgccards.com",
          "sgccard.com",
          "ebay.com",
          "pwccmarketplace.com",
          "goldin.co"
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Graded slab search error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const images = data.images || [];
    const webResults = data.results || [];
    const answer = data.answer || '';

    // Extract prices from answer
    const priceMatches = answer.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
    const prices = priceMatches
      .map((p: string) => parseFloat(p.replace(/[$,]/g, '')))
      .filter((p: number) => p > 1 && p < 100000)
      .sort((a: number, b: number) => a - b);
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : null;

    // Find the best slab image
    let slabImage = null;

    // Prefer images from grading company sites
    const gradingDomains = ['psacard.com', 'beckett.com', 'cgccards.com', 'sgccard.com'];
    const auctionDomains = ['ebay.com', 'pwccmarketplace.com', 'goldin.co'];

    for (const img of images) {
      // Check if image is from a grading company site (highest priority)
      if (gradingDomains.some(d => img.includes(d))) {
        slabImage = img;
        console.log(`  Found slab image from grading site: ${img.substring(0, 80)}...`);
        break;
      }
    }

    // If no grading site image, try auction sites
    if (!slabImage) {
      for (const img of images) {
        if (auctionDomains.some(d => img.includes(d))) {
          slabImage = img;
          console.log(`  Found slab image from auction site: ${img.substring(0, 80)}...`);
          break;
        }
      }
    }

    // Fall back to any image if nothing found yet
    if (!slabImage && images.length > 0) {
      slabImage = images[0];
      console.log(`  Using first available image: ${slabImage.substring(0, 80)}...`);
    }

    if (!slabImage) {
      console.log(`  No slab image found for graded card`);
      return [];
    }

    // Create a result with the slab image
    const result = {
      id: `graded-${Date.now()}`,
      name: cardName,
      set_name: `${gradingCompany.toUpperCase()} Graded`,
      card_number: null,
      image_url: slabImage,
      market_price: medianPrice,
      lowest_listed: prices.length > 0 ? prices[0] : null,
      rarity: null,
      subtypes: [],
      artist: null,
      pokemon_tcg_id: null,
      category: 'graded',
      grading_company: gradingCompany,
      grade: grade,
      price_source: medianPrice ? 'tavily' : null,
      ai_summary: answer,
      search_urls: webResults.slice(0, 3).map((r: any) => ({ title: r.title, url: r.url })),
      relevance: 0.95, // High relevance for graded-specific results
      is_slab_image: true,
    };

    console.log(`  Graded slab search: Found image, price: ${medianPrice ? '$' + medianPrice : 'N/A'}`);
    return [result];
  } catch (error) {
    console.error('Graded slab search error:', error);
    return [];
  }
}

// =============================================
// MAIN SEARCH HANDLER
// =============================================

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    let { query, isGraded, gradingCompany, grade } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ products: [], meta: { time_ms: 0 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    query = query.trim();

    // Normalize and expand the query
    const normalizedQuery = normalizeQuery(query);
    console.log(`Query: "${query}" → Tokens: [${normalizedQuery.tokens.join(', ')}]`);

    // Handle graded card searches - prioritize slab images
    if (isGraded && gradingCompany && gradingCompany !== 'raw') {
      console.log(`Graded card detected: ${gradingCompany.toUpperCase()} ${grade || ''}`);

      const slabResults = await fetchWithTimeout(
        fetchGradedSlabImages(query, gradingCompany, grade, normalizedQuery),
        5000,
        []
      );

      if (slabResults.length > 0 && slabResults[0].image_url) {
        console.log(`Found slab image for graded card, returning prioritized result`);

        // Return slab image as the top result
        const timeMs = Date.now() - startTime;
        return new Response(JSON.stringify({
          products: slabResults,
          meta: {
            total: slabResults.length,
            with_prices: slabResults.filter((p: any) => p.market_price).length,
            with_images: slabResults.filter((p: any) => p.image_url).length,
            graded_search: true,
            grading_company: gradingCompany,
            cached: false,
            time_ms: timeMs,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // No slab image found - return empty so frontend uses placeholder
      console.log(`No slab image found for graded card, returning empty (use placeholder)`);
      const timeMs = Date.now() - startTime;
      return new Response(JSON.stringify({
        products: [],
        meta: {
          total: 0,
          graded_search: true,
          grading_company: gradingCompany,
          no_slab_image: true,
          cached: false,
          time_ms: timeMs,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect if this is a sports card query
    const sportsDetection = detectSportsQuery(normalizedQuery.expandedQuery);
    console.log(`Sports: ${sportsDetection.isSports} (${(sportsDetection.confidence * 100).toFixed(0)}%) | Terms: ${sportsDetection.detectedTerms.join(', ')}`);

    // Detect TCG type (One Piece, Yu-Gi-Oh, etc.)
    const tcgDetection = detectTCGType(normalizedQuery.expandedQuery);
    console.log(`TCG: ${tcgDetection.tcgType} (${(tcgDetection.confidence * 100).toFixed(0)}%)`);

    // Setup Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Backend not configured");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false }
    });

    // Check cache first (6 hour TTL)
    const queryHash = btoa(normalizedQuery.normalized).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    const { data: cached } = await supabase
      .from('search_cache')
      .select('results, created_at')
      .eq('query_hash', queryHash)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (cached?.results) {
      console.log(`Cache hit for "${query}"`);
      return new Response(JSON.stringify({
        products: cached.results,
        meta: {
          total: cached.results.length,
          cached: true,
          time_ms: Date.now() - startTime,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run searches in parallel with timeouts
    const searches: Promise<any[]>[] = [];

    // 1. Local database search
    const dbSearch = supabase
      .rpc('search_products_fast', { search_query: normalizedQuery.expandedQuery, result_limit: 50 })
      .then(({ data, error }) => {
        if (error) {
          console.warn('DB search error, using fallback:', error.message);
          return supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${query}%,set_name.ilike.%${query}%,player.ilike.%${query}%,card_number.ilike.%${query}%`)
            .limit(50)
            .then(({ data }) => (data || []).map((p: any) => ({
              ...p,
              image_url: p.image_url || PLACEHOLDER_IMAGE,
              relevance: calculateRelevance(p, normalizedQuery)
            })));
        }
        return (data || []).map((p: any) => ({
          ...p,
          image_url: p.image_url || PLACEHOLDER_IMAGE,
        }));
      });
    searches.push(fetchWithTimeout(dbSearch, 2000, []));

    // 2. Pokemon TCG API (for Pokemon cards only)
    if (!sportsDetection.isSports && tcgDetection.tcgType !== 'one_piece' && tcgDetection.tcgType !== 'yugioh' && tcgDetection.tcgType !== 'magic') {
      // Numeric queries (card number searches) can take longer on Pokemon TCG API
      const isNumericQuery = /^#?\d+(?:\/\d+)?$/.test(query.trim());
      const ptcgTimeout = isNumericQuery ? 20000 : 5000;
      searches.push(fetchWithTimeout(fetchPokemonTcgCards(query, normalizedQuery), ptcgTimeout, []));
    }

    // 3. Scrydex API (for sealed products, Pokemon cards only)
    if (!sportsDetection.isSports && tcgDetection.tcgType !== 'one_piece' && tcgDetection.tcgType !== 'yugioh' && tcgDetection.tcgType !== 'magic') {
      searches.push(fetchWithTimeout(fetchScrydexProducts(query, normalizedQuery), 3000, []));
    }

    // 4. One Piece TCG search via Tavily (dedicated search)
    if (tcgDetection.tcgType === 'one_piece') {
      console.log('Using One Piece dedicated search');
      searches.push(fetchWithTimeout(fetchOnePieceCards(query, normalizedQuery), 4000, []));
    }

    // 5. Other non-Pokemon TCGs via Tavily fallback
    if (!sportsDetection.isSports && (tcgDetection.tcgType === 'yugioh' || tcgDetection.tcgType === 'magic' || tcgDetection.tcgType === 'unknown')) {
      searches.push(fetchWithTimeout(fetchTavilyFallback(query, normalizedQuery), 4000, []));
    }

    // 6. Sports card search via Tavily AI
    if (sportsDetection.isSports) {
      searches.push(fetchWithTimeout(fetchSportsCardsViaTavily(query, normalizedQuery), 4000, []));
    }

    // Wait for all searches
    const results = await Promise.all(searches);

    // Flatten all results
    let allResults: any[] = [];
    for (const resultSet of results) {
      for (const item of resultSet) {
        // Ensure all items have relevance scores
        if (typeof item.relevance !== 'number') {
          item.relevance = calculateRelevance(item, normalizedQuery);
        }
        // Ensure all items have images
        if (!item.image_url) {
          item.image_url = PLACEHOLDER_IMAGE;
        }
        allResults.push(item);
      }
    }

    // FALLBACK: If no results OR no results with images, use Tavily AI
    const hasResultsWithImages = allResults.some(r => r.image_url && !r.image_url.includes('placehold'));

    if (allResults.length === 0 || !hasResultsWithImages) {
      const reason = allResults.length === 0 ? 'no results' : 'no images';
      console.log(`Tavily fallback (${reason}) for: "${query}"`);

      // Use specialized search based on TCG type
      let tavilyResults: any[];
      if (tcgDetection.tcgType === 'one_piece') {
        tavilyResults = await fetchWithTimeout(fetchOnePieceCards(query, normalizedQuery), 5000, []);
      } else {
        tavilyResults = await fetchWithTimeout(fetchTavilyFallback(query, normalizedQuery), 5000, []);
      }

      // If we got images from Tavily, merge them with existing results
      if (tavilyResults.length > 0 && tavilyResults[0].image_url && !tavilyResults[0].image_url.includes('placehold')) {
        const tavilyImage = tavilyResults[0].image_url;
        // Apply image to existing results that don't have images
        allResults.forEach(r => {
          if (!r.image_url || r.image_url.includes('placehold')) {
            r.image_url = tavilyImage;
          }
        });
      }

      // Add Tavily results
      allResults.push(...tavilyResults);
    }

    // Deduplicate results (smart deduplication)
    allResults = deduplicateResults(allResults);

    // Sort by relevance
    allResults.sort((a, b) => {
      // Primary: relevance score
      const relDiff = (b.relevance || 0) - (a.relevance || 0);
      if (Math.abs(relDiff) > 0.05) return relDiff;

      // Secondary: has real image
      const aHasImage = a.image_url && !a.image_url.includes('placehold') ? 1 : 0;
      const bHasImage = b.image_url && !b.image_url.includes('placehold') ? 1 : 0;
      if (aHasImage !== bHasImage) return bHasImage - aHasImage;

      // Tertiary: has price
      const aHasPrice = a.market_price ? 1 : 0;
      const bHasPrice = b.market_price ? 1 : 0;
      return bHasPrice - aHasPrice;
    });

    // Limit to 50 results
    const finalResults = allResults.slice(0, 50);

    // Cache results
    if (finalResults.length > 0) {
      supabase
        .from('search_cache')
        .upsert({
          query_hash: queryHash,
          query: normalizedQuery.normalized,
          results: finalResults,
          result_count: finalResults.length,
          expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'query_hash' })
        .then(() => console.log(`Cached results for "${query}"`))
        .catch((e) => console.warn('Cache write failed:', e));
    }

    const timeMs = Date.now() - startTime;
    console.log(`Search completed: ${finalResults.length} results in ${timeMs}ms`);

    return new Response(JSON.stringify({
      products: finalResults,
      meta: {
        total: finalResults.length,
        with_prices: finalResults.filter((p: any) => p.market_price).length,
        with_images: finalResults.filter((p: any) => p.image_url && !p.image_url.includes('placehold')).length,
        sports_query: sportsDetection.isSports,
        sports_confidence: sportsDetection.confidence,
        cached: false,
        time_ms: timeMs,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Search error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
      products: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
