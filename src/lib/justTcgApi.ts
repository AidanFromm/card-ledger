/**
 * JustTCG API Client
 * 
 * API Documentation: https://justtcg.com/docs
 * API Base URL: https://api.justtcg.com/v1
 * 
 * Supported Games:
 * - Magic: The Gathering (mtg)
 * - Pokémon (pokemon)
 * - Yu-Gi-Oh! (yugioh)
 * - Disney Lorcana (lorcana)
 * - One Piece TCG (onepiece)
 * - Digimon (digimon)
 * - Union Arena (unionarena)
 * 
 * Features:
 * - Condition-specific pricing (NM, LP, MP, HP)
 * - Printing variants (Normal, Foil)
 * - Price history (7d, 30d, 90d, 180d)
 * - Market statistics
 */

// ============================================
// Types
// ============================================

export type JustTcgGame = 'pokemon' | 'mtg' | 'yugioh' | 'lorcana' | 'onepiece' | 'digimon' | 'unionarena';

export interface JustTcgGameInfo {
  id: string;
  name: string;
  cards_count: number;
  variants_count: number;
  sealed_count: number;
  sets_count: number;
  last_updated: number;
  game_value_index_cents: number;
  game_value_change_7d_pct: number;
  game_value_change_30d_pct: number;
  game_value_change_90d_pct: number;
}

export interface JustTcgSet {
  id: string;
  name: string;
  game_id: string;
  game: string;
  cards_count: number;
  variants_count: number;
  sealed_count: number;
  release_date: string;
  set_value_usd: number;
  set_value_change_7d_pct: number;
  set_value_change_30d_pct: number;
  set_value_change_90d_pct: number;
}

export interface JustTcgVariant {
  variant_id: string;
  tcgplayer_sku_id: string;
  printing: string;
  condition: string;
  price_usd: number;
  price_history?: JustTcgPriceHistory[];
  statistics?: JustTcgStatistics;
}

export interface JustTcgPriceHistory {
  date: string;
  price_usd: number;
}

export interface JustTcgStatistics {
  '7d'?: JustTcgStatPeriod;
  '30d'?: JustTcgStatPeriod;
  '90d'?: JustTcgStatPeriod;
  '1y'?: JustTcgStatPeriod;
  allTime?: JustTcgStatPeriod;
}

export interface JustTcgStatPeriod {
  price_change_pct: number;
  price_change_usd: number;
  high_usd: number;
  low_usd: number;
  avg_usd: number;
}

export interface JustTcgCard {
  card_id: string;
  tcgplayer_id: string;
  name: string;
  set_id: string;
  set_name: string;
  game_id: string;
  game: string;
  collector_number?: string;
  rarity?: string;
  image_url?: string;
  variants: JustTcgVariant[];
}

export interface JustTcgApiResponse<T> {
  data: T;
  page?: number;
  page_size?: number;
  total_count?: number;
}

// Our unified card format (compatible with existing code)
export interface UnifiedCardResult {
  id: string;
  source: 'justtcg';
  tcgplayer_id?: string;
  name: string;
  set_name: string;
  set_id: string;
  number?: string;
  rarity?: string;
  image_url?: string;
  category: JustTcgGame;
  estimated_value?: number;
  prices?: UnifiedCardPrices;
  variants?: JustTcgVariant[];
  statistics?: JustTcgStatistics;
}

export interface UnifiedCardPrices {
  market?: number;
  low?: number;
  mid?: number;
  high?: number;
  variant?: string;
  condition?: string;
  allVariants?: Record<string, {
    price_usd: number;
    condition: string;
    printing: string;
  }>;
  priceHistory?: JustTcgPriceHistory[];
}

// ============================================
// Configuration
// ============================================

const API_BASE = 'https://api.justtcg.com/v1';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour (prices update every 6 hours)
const CACHE_PREFIX = 'justtcg_cache_';
const RATE_LIMIT_DELAY_MS = 100;

let lastRequestTime = 0;

// API Key - loaded from environment or hardcoded for now
function getApiKey(): string {
  // Try environment variable first
  const envKey = import.meta.env.VITE_JUSTTCG_API_KEY;
  if (envKey) return envKey;
  
  // Fallback to hardcoded key (for development)
  return 'tcg_3aa7cd75bd2b46728b102d988f8576be';
}

// ============================================
// Cache Utilities
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCacheKey(endpoint: string, params?: Record<string, string>): string {
  const paramString = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${endpoint}_${paramString}`;
}

function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION_MS;
    
    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage full - clear old entries
    clearOldCache();
  }
}

function clearOldCache(): void {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore
  }
}

// ============================================
// Rate Limiting
// ============================================

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
    await new Promise(resolve => 
      setTimeout(resolve, RATE_LIMIT_DELAY_MS - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
}

// ============================================
// API Request Helper
// ============================================

async function apiRequest<T>(
  endpoint: string,
  params?: Record<string, string>,
  options?: {
    useCache?: boolean;
    method?: 'GET' | 'POST';
    body?: unknown;
  }
): Promise<T> {
  const { useCache = true, method = 'GET', body } = options || {};
  const cacheKey = getCacheKey(endpoint, params);
  
  // Check cache first (GET requests only)
  if (useCache && method === 'GET') {
    const cached = getFromCache<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  await waitForRateLimit();
  
  // Build URL
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params && method === 'GET') {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': getApiKey(),
  };
  
  // Make request
  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  
  if (body && method === 'POST') {
    fetchOptions.body = JSON.stringify(body);
  }
  
  const response = await fetch(url.toString(), fetchOptions);
  
  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited - wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return apiRequest<T>(endpoint, params, options);
    }
    
    const errorText = await response.text();
    throw new Error(`JustTCG API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  // Cache successful GET responses
  if (useCache && method === 'GET') {
    setCache(cacheKey, data);
  }
  
  return data;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all supported games
 */
export async function getGames(): Promise<JustTcgGameInfo[]> {
  const response = await apiRequest<{ data: JustTcgGameInfo[] }>('/games');
  return response.data || [];
}

/**
 * Get all sets for a game
 */
export async function getSets(
  game: JustTcgGame,
  options?: {
    query?: string;
    orderBy?: 'name' | 'release_date';
    order?: 'asc' | 'desc';
  }
): Promise<JustTcgSet[]> {
  const { query, orderBy = 'release_date', order = 'desc' } = options || {};
  
  const params: Record<string, string> = {
    game,
    orderBy,
    order,
  };
  
  if (query) {
    params.q = query;
  }
  
  const response = await apiRequest<{ data: JustTcgSet[] }>('/sets', params);
  return response.data || [];
}

/**
 * Search cards by name
 */
export async function searchCards(
  query: string,
  options?: {
    game?: JustTcgGame;
    setId?: string;
    printing?: 'Normal' | 'Foil';
    condition?: string;
    priceHistoryDuration?: '7d' | '30d' | '90d' | '180d';
    includeStatistics?: boolean;
    page?: number;
    pageSize?: number;
  }
): Promise<{ cards: UnifiedCardResult[]; totalCount: number }> {
  const {
    game,
    setId,
    printing,
    condition = 'NM',
    priceHistoryDuration = '7d',
    includeStatistics = true,
    page = 1,
    pageSize = 20,
  } = options || {};
  
  const params: Record<string, string> = {
    q: query,
    page: page.toString(),
    pageSize: pageSize.toString(),
    condition,
    priceHistoryDuration,
    include_price_history: 'true',
  };
  
  if (game) params.game = game;
  if (setId) params.set = setId;
  if (printing) params.printing = printing;
  if (includeStatistics) {
    params.include_statistics = '7d,30d,90d';
  }
  
  const response = await apiRequest<{ data: JustTcgCard[]; total_count?: number }>(
    '/cards',
    params
  );
  
  const cards = (response.data || []).map(mapCardToUnified);
  
  return {
    cards,
    totalCount: response.total_count || cards.length,
  };
}

/**
 * Get card by TCGplayer ID
 */
export async function getCardByTcgplayerId(
  tcgplayerId: string,
  options?: {
    condition?: string;
    printing?: string;
    priceHistoryDuration?: '7d' | '30d' | '90d' | '180d';
  }
): Promise<UnifiedCardResult | null> {
  const { condition, printing, priceHistoryDuration = '30d' } = options || {};
  
  const params: Record<string, string> = {
    tcgplayerId,
    priceHistoryDuration,
    include_price_history: 'true',
    include_statistics: '7d,30d,90d',
  };
  
  if (condition) params.condition = condition;
  if (printing) params.printing = printing;
  
  try {
    const response = await apiRequest<{ data: JustTcgCard[] }>('/cards', params);
    
    if (!response.data || response.data.length === 0) {
      return null;
    }
    
    return mapCardToUnified(response.data[0]);
  } catch (error) {
    console.error('Error fetching card:', error);
    return null;
  }
}

/**
 * Batch lookup multiple cards
 */
export async function batchGetCards(
  cardIds: { tcgplayerId?: string; cardId?: string }[],
  options?: {
    condition?: string;
    printing?: string;
    priceHistoryDuration?: '7d' | '30d' | '90d' | '180d';
  }
): Promise<UnifiedCardResult[]> {
  const { condition, printing, priceHistoryDuration = '7d' } = options || {};
  
  // Build request body
  const requestBody = cardIds.map(id => {
    const item: Record<string, string> = {};
    if (id.tcgplayerId) item.tcgplayerId = id.tcgplayerId;
    if (id.cardId) item.cardId = id.cardId;
    if (condition) item.condition = condition;
    if (printing) item.printing = printing;
    return item;
  });
  
  try {
    const response = await apiRequest<{ data: JustTcgCard[] }>(
      '/cards',
      { priceHistoryDuration, include_price_history: 'true' },
      { method: 'POST', body: requestBody, useCache: false }
    );
    
    return (response.data || []).map(mapCardToUnified);
  } catch (error) {
    console.error('Error batch fetching cards:', error);
    return [];
  }
}

/**
 * Get price for a specific card (fresh, no cache)
 */
export async function getCardPrice(
  tcgplayerId: string,
  options?: {
    condition?: string;
    printing?: string;
  }
): Promise<UnifiedCardPrices | null> {
  const { condition = 'NM', printing } = options || {};
  
  const params: Record<string, string> = {
    tcgplayerId,
    condition,
    include_price_history: 'false',
    include_statistics: '7d,30d',
  };
  
  if (printing) params.printing = printing;
  
  try {
    const response = await apiRequest<{ data: JustTcgCard[] }>(
      '/cards',
      params,
      { useCache: false }
    );
    
    if (!response.data || response.data.length === 0) {
      return null;
    }
    
    const card = response.data[0];
    return extractPrices(card);
  } catch (error) {
    console.error('Error fetching card price:', error);
    return null;
  }
}

/**
 * Get price history for a card
 */
export async function getPriceHistory(
  tcgplayerId: string,
  duration: '7d' | '30d' | '90d' | '180d' = '30d'
): Promise<JustTcgPriceHistory[]> {
  const params: Record<string, string> = {
    tcgplayerId,
    priceHistoryDuration: duration,
    include_price_history: 'true',
    condition: 'NM',
  };
  
  try {
    const response = await apiRequest<{ data: JustTcgCard[] }>(
      '/cards',
      params,
      { useCache: false }
    );
    
    if (!response.data || response.data.length === 0) {
      return [];
    }
    
    const card = response.data[0];
    const nmVariant = card.variants?.find(v => v.condition === 'NM' || v.condition === 'Near Mint');
    
    return nmVariant?.price_history || [];
  } catch (error) {
    console.error('Error fetching price history:', error);
    return [];
  }
}

// ============================================
// Helper Functions
// ============================================

function mapCardToUnified(card: JustTcgCard): UnifiedCardResult {
  const prices = extractPrices(card);
  
  return {
    id: card.card_id,
    source: 'justtcg',
    tcgplayer_id: card.tcgplayer_id,
    name: card.name,
    set_name: card.set_name,
    set_id: card.set_id,
    number: card.collector_number,
    rarity: card.rarity,
    image_url: card.image_url,
    category: card.game_id as JustTcgGame,
    estimated_value: prices?.market,
    prices,
    variants: card.variants,
    statistics: card.variants?.[0]?.statistics,
  };
}

function extractPrices(card: JustTcgCard): UnifiedCardPrices | undefined {
  if (!card.variants || card.variants.length === 0) {
    return undefined;
  }
  
  // Find best variant (prefer NM, then LP, etc.)
  const conditionPriority = ['NM', 'Near Mint', 'LP', 'Lightly Played', 'MP', 'HP'];
  let bestVariant: JustTcgVariant | undefined;
  
  for (const condition of conditionPriority) {
    bestVariant = card.variants.find(v => 
      v.condition === condition || v.condition.includes(condition)
    );
    if (bestVariant) break;
  }
  
  // Fallback to first variant
  if (!bestVariant) {
    bestVariant = card.variants[0];
  }
  
  // Build all variants map
  const allVariants: Record<string, { price_usd: number; condition: string; printing: string }> = {};
  
  for (const variant of card.variants) {
    const key = `${variant.printing}_${variant.condition}`;
    allVariants[key] = {
      price_usd: variant.price_usd,
      condition: variant.condition,
      printing: variant.printing,
    };
  }
  
  // Calculate low/mid/high from all variants
  const prices = card.variants.map(v => v.price_usd).filter(p => p > 0);
  const sortedPrices = prices.sort((a, b) => a - b);
  
  return {
    market: bestVariant.price_usd,
    low: sortedPrices[0],
    mid: sortedPrices[Math.floor(sortedPrices.length / 2)],
    high: sortedPrices[sortedPrices.length - 1],
    variant: bestVariant.printing,
    condition: bestVariant.condition,
    allVariants,
    priceHistory: bestVariant.price_history,
  };
}

/**
 * Clear all JustTCG API cache
 */
export function clearCache(): void {
  clearOldCache();
}

// ============================================
// Game-Specific Convenience Functions
// ============================================

export async function searchPokemonCards(query: string, options?: Omit<Parameters<typeof searchCards>[1], 'game'>) {
  return searchCards(query, { ...options, game: 'pokemon' });
}

export async function searchMtgCards(query: string, options?: Omit<Parameters<typeof searchCards>[1], 'game'>) {
  return searchCards(query, { ...options, game: 'mtg' });
}

export async function searchYugiohCards(query: string, options?: Omit<Parameters<typeof searchCards>[1], 'game'>) {
  return searchCards(query, { ...options, game: 'yugioh' });
}

export async function searchLorcanaCards(query: string, options?: Omit<Parameters<typeof searchCards>[1], 'game'>) {
  return searchCards(query, { ...options, game: 'lorcana' });
}

export async function searchOnePieceCards(query: string, options?: Omit<Parameters<typeof searchCards>[1], 'game'>) {
  return searchCards(query, { ...options, game: 'onepiece' });
}

export async function searchDigimonCards(query: string, options?: Omit<Parameters<typeof searchCards>[1], 'game'>) {
  return searchCards(query, { ...options, game: 'digimon' });
}

// ============================================
// Export
// ============================================

export const justTcgApi = {
  // Core functions
  getGames,
  getSets,
  searchCards,
  getCardByTcgplayerId,
  batchGetCards,
  getCardPrice,
  getPriceHistory,
  clearCache,
  
  // Game-specific search
  searchPokemonCards,
  searchMtgCards,
  searchYugiohCards,
  searchLorcanaCards,
  searchOnePieceCards,
  searchDigimonCards,
};

export default justTcgApi;
