/**
 * TCGdex API Client
 * 
 * FREE Pokemon pricing API with no API key required!
 * 
 * API Documentation: https://tcgdex.dev/
 * Base URL: https://api.tcgdex.net/v2
 * 
 * Features:
 * - Card data + images
 * - TCGplayer pricing (USD)
 * - Cardmarket pricing (EUR)
 * - No rate limits mentioned
 * - No API key needed
 */

// ============================================
// Types
// ============================================

export interface TcgdexCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
  category: string;
  illustrator?: string;
  rarity?: string;
  set: TcgdexSet;
  variants?: TcgdexVariants;
  pricing?: TcgdexPricing;
}

export interface TcgdexSet {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: {
    total: number;
    official: number;
  };
}

export interface TcgdexVariants {
  normal?: boolean;
  reverse?: boolean;
  holo?: boolean;
  firstEdition?: boolean;
}

export interface TcgdexPricing {
  cardmarket?: TcgdexCardmarketPricing;
  tcgplayer?: TcgdexTcgplayerPricing;
}

export interface TcgdexCardmarketPricing {
  updated: string;
  unit: 'EUR';
  avg?: number;
  low?: number;
  trend?: number;
  avg1?: number;
  avg7?: number;
  avg30?: number;
  'avg-holo'?: number;
  'low-holo'?: number;
  'trend-holo'?: number;
}

export interface TcgdexTcgplayerPricing {
  updated: string;
  unit: 'USD';
  normal?: {
    lowPrice?: number;
    midPrice?: number;
    highPrice?: number;
    marketPrice?: number;
    directLowPrice?: number;
  };
  reverse?: {
    lowPrice?: number;
    midPrice?: number;
    highPrice?: number;
    marketPrice?: number;
    directLowPrice?: number;
  };
  holo?: {
    lowPrice?: number;
    midPrice?: number;
    highPrice?: number;
    marketPrice?: number;
    directLowPrice?: number;
  };
}

export interface TcgdexSearchResult {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

// Our unified format
export interface TcgdexCardResult {
  id: string;
  name: string;
  setName: string;
  setId: string;
  number: string;
  rarity?: string;
  imageUrl?: string;
  illustrator?: string;
  // Pricing
  priceUsd?: number;
  priceLowUsd?: number;
  priceHighUsd?: number;
  priceEur?: number;
  priceTrendEur?: number;
  // Source
  source: 'tcgdex';
}

// ============================================
// Configuration
// ============================================

const API_BASE = 'https://api.tcgdex.net/v2';
const CACHE_PREFIX = 'tcgdex_cache_';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ============================================
// Cache Utilities
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCached<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage full
  }
}

// ============================================
// API Functions
// ============================================

/**
 * Search for cards by name
 */
export async function searchCards(
  query: string,
  lang: string = 'en'
): Promise<TcgdexSearchResult[]> {
  const cacheKey = `search_${lang}_${query}`;
  const cached = getCached<TcgdexSearchResult[]>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/${lang}/cards?name=${encodeURIComponent(query)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TCGdex API error: ${response.status}`);
  }

  const data = await response.json();
  setCache(cacheKey, data);
  
  return data;
}

/**
 * Get full card details including pricing
 */
export async function getCard(
  cardId: string,
  lang: string = 'en'
): Promise<TcgdexCard | null> {
  const cacheKey = `card_${lang}_${cardId}`;
  const cached = getCached<TcgdexCard>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/${lang}/cards/${cardId}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`TCGdex API error: ${response.status}`);
  }

  const data = await response.json();
  setCache(cacheKey, data);
  
  return data;
}

/**
 * Get all sets
 */
export async function getSets(lang: string = 'en'): Promise<TcgdexSet[]> {
  const cacheKey = `sets_${lang}`;
  const cached = getCached<TcgdexSet[]>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/${lang}/sets`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TCGdex API error: ${response.status}`);
  }

  const data = await response.json();
  setCache(cacheKey, data);
  
  return data;
}

/**
 * Get cards in a set
 */
export async function getSetCards(
  setId: string,
  lang: string = 'en'
): Promise<TcgdexSearchResult[]> {
  const cacheKey = `set_cards_${lang}_${setId}`;
  const cached = getCached<TcgdexSearchResult[]>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/${lang}/sets/${setId}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TCGdex API error: ${response.status}`);
  }

  const data = await response.json();
  const cards = data.cards || [];
  setCache(cacheKey, cards);
  
  return cards;
}

/**
 * Search and get full card details with pricing
 */
export async function searchCardsWithPricing(
  query: string,
  lang: string = 'en'
): Promise<TcgdexCardResult[]> {
  const searchResults = await searchCards(query, lang);
  
  // Get full details for first 10 results
  const results: TcgdexCardResult[] = [];
  
  for (const result of searchResults.slice(0, 10)) {
    try {
      const card = await getCard(result.id, lang);
      if (card) {
        results.push(mapCardToResult(card));
      }
    } catch (error) {
      console.warn(`Failed to get details for ${result.id}:`, error);
    }
  }
  
  return results;
}

/**
 * Get price for a card by ID
 */
export async function getCardPrice(
  cardId: string,
  lang: string = 'en'
): Promise<{ usd?: number; eur?: number } | null> {
  const card = await getCard(cardId, lang);
  if (!card?.pricing) return null;

  // Extract best USD price
  let usdPrice: number | undefined;
  const tcgp = card.pricing.tcgplayer;
  if (tcgp) {
    usdPrice = tcgp.holo?.marketPrice 
      || tcgp.normal?.marketPrice 
      || tcgp.reverse?.marketPrice;
  }

  // Extract EUR price
  const eurPrice = card.pricing.cardmarket?.trend;

  return { usd: usdPrice, eur: eurPrice };
}

// ============================================
// Helpers
// ============================================

function mapCardToResult(card: TcgdexCard): TcgdexCardResult {
  // Get best USD price
  let priceUsd: number | undefined;
  let priceLowUsd: number | undefined;
  let priceHighUsd: number | undefined;
  
  const tcgp = card.pricing?.tcgplayer;
  if (tcgp) {
    // Priority: holo > normal > reverse
    const variant = tcgp.holo || tcgp.normal || tcgp.reverse;
    if (variant) {
      priceUsd = variant.marketPrice;
      priceLowUsd = variant.lowPrice;
      priceHighUsd = variant.highPrice;
    }
  }

  // Get EUR prices
  const cm = card.pricing?.cardmarket;
  const priceEur = cm?.avg;
  const priceTrendEur = cm?.trend;

  return {
    id: card.id,
    name: card.name,
    setName: card.set.name,
    setId: card.set.id,
    number: card.localId,
    rarity: card.rarity,
    imageUrl: card.image ? `${card.image}/high.webp` : undefined,
    illustrator: card.illustrator,
    priceUsd,
    priceLowUsd,
    priceHighUsd,
    priceEur,
    priceTrendEur,
    source: 'tcgdex',
  };
}

// ============================================
// Export
// ============================================

export const tcgdexApi = {
  searchCards,
  getCard,
  getSets,
  getSetCards,
  searchCardsWithPricing,
  getCardPrice,
};

export default tcgdexApi;
