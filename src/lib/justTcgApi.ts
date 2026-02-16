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
 * - Condition-specific pricing (NM, LP, MP, HP, DMG)
 * - Printing variants (Normal, Foil)
 * - Price history (7d, 30d, 90d, 180d)
 * - Market statistics
 */

// ============================================
// Types
// ============================================

export type JustTcgGame = 'pokemon' | 'mtg' | 'yugioh' | 'lorcana' | 'onepiece' | 'digimon' | 'unionarena';

export type JustTcgCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG' | 'S';
export type JustTcgConditionFull = 'Near Mint' | 'Lightly Played' | 'Moderately Played' | 'Heavily Played' | 'Damaged' | 'Sealed';

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
  id: string;
  variant_id?: string;
  tcgplayerSkuId: string;
  tcgplayer_sku_id?: string;
  printing: string;
  condition: string;
  language?: string;
  price: number; // In USD (API returns USD directly for v1 cards endpoint)
  lastUpdated?: number;
  priceChange24hr?: number | null;
  priceChange7d?: number | null;
  priceChange30d?: number | null;
  priceChange90d?: number | null;
  avgPrice?: number | null;
  avgPrice7d?: number | null;
  avgPrice30d?: number | null;
  avgPrice90d?: number | null;
  minPrice7d?: number | null;
  maxPrice7d?: number | null;
  minPrice30d?: number | null;
  maxPrice30d?: number | null;
  minPrice90d?: number | null;
  maxPrice90d?: number | null;
  trendSlope7d?: number | null;
  trendSlope30d?: number | null;
  trendSlope90d?: number | null;
  priceHistory?: Array<{ p: number; t: number }>; // price in USD, timestamp in seconds
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

// Raw card response from API
export interface JustTcgCardRaw {
  id: string;
  name: string;
  game: string;
  set: string;
  set_name: string;
  number?: string;
  tcgplayerId?: string;
  mtgjsonId?: string;
  scryfallId?: string;
  rarity?: string;
  details?: string | null;
  variants: JustTcgVariant[];
}

// Transformed card
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

// Condition pricing breakdown
export interface ConditionPrices {
  NM?: number;
  LP?: number;
  MP?: number;
  HP?: number;
  DMG?: number;
  foil_NM?: number;
  foil_LP?: number;
  foil_MP?: number;
  foil_HP?: number;
  foil_DMG?: number;
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
  conditionPrices?: ConditionPrices;
  variants?: JustTcgVariant[];
  statistics?: PriceStatistics;
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

export interface PriceStatistics {
  change24h?: number;
  change7d?: number;
  change30d?: number;
  change90d?: number;
  avg7d?: number;
  avg30d?: number;
  avg90d?: number;
  min7d?: number;
  max7d?: number;
  min30d?: number;
  max30d?: number;
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
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_JUSTTCG_API_KEY) {
    return import.meta.env.VITE_JUSTTCG_API_KEY;
  }
  
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
// Helper: Transform API card to our format
// ============================================

function transformCard(rawCard: JustTcgCardRaw): JustTcgCard {
  return {
    card_id: rawCard.id,
    tcgplayer_id: rawCard.tcgplayerId || rawCard.id,
    name: rawCard.name,
    set_id: rawCard.set,
    set_name: rawCard.set_name,
    game_id: rawCard.game.toLowerCase().replace(/[^a-z]/g, ''),
    game: rawCard.game,
    collector_number: rawCard.number,
    rarity: rawCard.rarity,
    variants: rawCard.variants || [],
  };
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
    condition = 'NM,LP,MP,HP,DMG', // Get all conditions
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
  
  const response = await apiRequest<{ data: JustTcgCardRaw[]; total_count?: number }>(
    '/cards',
    params
  );
  
  const cards = (response.data || []).map(raw => {
    const card = transformCard(raw);
    return mapCardToUnified(card);
  });
  
  return {
    cards,
    totalCount: response.total_count || cards.length,
  };
}

/**
 * Get card by TCGplayer ID with full pricing data
 */
export async function getCardByTcgplayerId(
  tcgplayerId: string,
  options?: {
    condition?: string;
    printing?: string;
    priceHistoryDuration?: '7d' | '30d' | '90d' | '180d';
  }
): Promise<UnifiedCardResult | null> {
  const { 
    condition = 'NM,LP,MP,HP,DMG', // Get all conditions by default
    printing, 
    priceHistoryDuration = '180d' // Default to 180d for full history
  } = options || {};
  
  const params: Record<string, string> = {
    tcgplayerId,
    priceHistoryDuration,
    include_price_history: 'true',
    include_statistics: '7d,30d,90d',
    condition,
  };
  
  if (printing) params.printing = printing;
  
  try {
    const response = await apiRequest<{ data: JustTcgCardRaw[] }>('/cards', params);
    
    if (!response.data || response.data.length === 0) {
      return null;
    }
    
    const card = transformCard(response.data[0]);
    return mapCardToUnified(card);
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
  const { 
    condition = 'NM,LP,MP,HP,DMG', 
    printing, 
    priceHistoryDuration = '7d' 
  } = options || {};
  
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
    const response = await apiRequest<{ data: JustTcgCardRaw[] }>(
      '/cards',
      { priceHistoryDuration, include_price_history: 'true' },
      { method: 'POST', body: requestBody, useCache: false }
    );
    
    return (response.data || []).map(raw => {
      const card = transformCard(raw);
      return mapCardToUnified(card);
    });
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
  const { condition = 'NM,LP,MP,HP,DMG', printing } = options || {};
  
  const params: Record<string, string> = {
    tcgplayerId,
    condition,
    include_price_history: 'false',
    include_statistics: '7d,30d',
  };
  
  if (printing) params.printing = printing;
  
  try {
    const response = await apiRequest<{ data: JustTcgCardRaw[] }>(
      '/cards',
      params,
      { useCache: false }
    );
    
    if (!response.data || response.data.length === 0) {
      return null;
    }
    
    const card = transformCard(response.data[0]);
    return extractPrices(card);
  } catch (error) {
    console.error('Error fetching card price:', error);
    return null;
  }
}

/**
 * Get condition-specific prices for a card
 */
export async function getConditionPrices(
  tcgplayerId: string,
  printing?: 'Normal' | 'Foil'
): Promise<ConditionPrices | null> {
  const params: Record<string, string> = {
    tcgplayerId,
    condition: 'NM,LP,MP,HP,DMG',
    include_price_history: 'false',
  };
  
  if (printing) params.printing = printing;
  
  try {
    const response = await apiRequest<{ data: JustTcgCardRaw[] }>(
      '/cards',
      params,
      { useCache: true }
    );
    
    if (!response.data || response.data.length === 0) {
      return null;
    }
    
    const card = transformCard(response.data[0]);
    return extractConditionPrices(card);
  } catch (error) {
    console.error('Error fetching condition prices:', error);
    return null;
  }
}

/**
 * Get price history for a card (up to 180 days)
 */
export async function getPriceHistory(
  tcgplayerId: string,
  duration: '7d' | '30d' | '90d' | '180d' = '180d',
  condition: JustTcgCondition = 'NM'
): Promise<JustTcgPriceHistory[]> {
  const params: Record<string, string> = {
    tcgplayerId,
    priceHistoryDuration: duration,
    include_price_history: 'true',
    condition,
  };
  
  try {
    const response = await apiRequest<{ data: JustTcgCardRaw[] }>(
      '/cards',
      params,
      { useCache: true }
    );
    
    if (!response.data || response.data.length === 0) {
      return [];
    }
    
    const card = response.data[0];
    // Find NM variant or first available
    const variant = card.variants?.find(v => 
      v.condition === condition || v.condition === 'Near Mint'
    ) || card.variants?.[0];
    
    if (!variant?.priceHistory) {
      return [];
    }
    
    return variant.priceHistory.map(h => ({
      date: new Date(h.t * 1000).toISOString().split('T')[0],
      price_usd: h.p, // API returns USD directly
    }));
  } catch (error) {
    console.error('Error fetching price history:', error);
    return [];
  }
}

// ============================================
// Helper Functions
// ============================================

function normalizeCondition(condition: string): JustTcgCondition {
  const mapping: Record<string, JustTcgCondition> = {
    'near mint': 'NM',
    'nm': 'NM',
    'lightly played': 'LP',
    'lp': 'LP',
    'moderately played': 'MP',
    'mp': 'MP',
    'heavily played': 'HP',
    'hp': 'HP',
    'damaged': 'DMG',
    'dmg': 'DMG',
    'sealed': 'S',
    's': 'S',
  };
  
  return mapping[condition.toLowerCase()] || 'NM';
}

function mapCardToUnified(card: JustTcgCard): UnifiedCardResult {
  const prices = extractPrices(card);
  const conditionPrices = extractConditionPrices(card);
  const statistics = extractStatistics(card);
  
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
    conditionPrices,
    variants: card.variants,
    statistics,
  };
}

function extractPrices(card: JustTcgCard): UnifiedCardPrices | undefined {
  if (!card.variants || card.variants.length === 0) {
    return undefined;
  }
  
  // Find best variant (prefer NM Normal, then NM Foil)
  const conditionPriority = ['NM', 'Near Mint', 'LP', 'Lightly Played', 'MP', 'HP', 'DMG'];
  let bestVariant: JustTcgVariant | undefined;
  
  // First try Normal printing
  for (const condition of conditionPriority) {
    bestVariant = card.variants.find(v => 
      (v.condition === condition || v.condition.includes(condition)) &&
      v.printing?.toLowerCase() === 'normal'
    );
    if (bestVariant && bestVariant.price > 0) break;
  }
  
  // Fallback to any printing
  if (!bestVariant || !bestVariant.price) {
    for (const condition of conditionPriority) {
      bestVariant = card.variants.find(v => 
        v.condition === condition || v.condition.includes(condition)
      );
      if (bestVariant && bestVariant.price > 0) break;
    }
  }
  
  // Fallback to first variant with a price
  if (!bestVariant || !bestVariant.price) {
    bestVariant = card.variants.find(v => v.price > 0);
  }
  
  if (!bestVariant) {
    return undefined;
  }
  
  // Build all variants map
  const allVariants: Record<string, { price_usd: number; condition: string; printing: string }> = {};
  
  for (const variant of card.variants) {
    const key = `${variant.printing || 'Normal'}_${normalizeCondition(variant.condition)}`;
    if (variant.price > 0) {
      allVariants[key] = {
        price_usd: variant.price,
        condition: variant.condition,
        printing: variant.printing || 'Normal',
      };
    }
  }
  
  // Calculate low/mid/high from all variants
  const prices = card.variants
    .map(v => v.price)
    .filter(p => p > 0);
  const sortedPrices = prices.sort((a, b) => a - b);
  
  // Convert price history
  const priceHistory: JustTcgPriceHistory[] = (bestVariant.priceHistory || [])
    .map(h => ({
      date: new Date(h.t * 1000).toISOString().split('T')[0],
      price_usd: h.p,
    }));
  
  return {
    market: bestVariant.price,
    low: sortedPrices[0],
    mid: sortedPrices[Math.floor(sortedPrices.length / 2)],
    high: sortedPrices[sortedPrices.length - 1],
    variant: bestVariant.printing || 'Normal',
    condition: bestVariant.condition,
    allVariants,
    priceHistory,
  };
}

function extractConditionPrices(card: JustTcgCard): ConditionPrices {
  const prices: ConditionPrices = {};
  
  if (!card.variants) return prices;
  
  for (const variant of card.variants) {
    if (variant.price <= 0) continue;
    
    const condition = normalizeCondition(variant.condition);
    const isFoil = variant.printing?.toLowerCase() === 'foil';
    
    if (isFoil) {
      const key = `foil_${condition}` as keyof ConditionPrices;
      prices[key] = variant.price;
    } else {
      prices[condition] = variant.price;
    }
  }
  
  return prices;
}

function extractStatistics(card: JustTcgCard): PriceStatistics | undefined {
  if (!card.variants || card.variants.length === 0) return undefined;
  
  // Get NM variant for stats
  const nmVariant = card.variants.find(v => 
    v.condition === 'NM' || v.condition === 'Near Mint'
  ) || card.variants[0];
  
  if (!nmVariant) return undefined;
  
  return {
    change24h: nmVariant.priceChange24hr ?? undefined,
    change7d: nmVariant.priceChange7d ?? undefined,
    change30d: nmVariant.priceChange30d ?? undefined,
    change90d: nmVariant.priceChange90d ?? undefined,
    avg7d: nmVariant.avgPrice7d ?? nmVariant.avgPrice ?? undefined,
    avg30d: nmVariant.avgPrice30d ?? undefined,
    avg90d: nmVariant.avgPrice90d ?? undefined,
    min7d: nmVariant.minPrice7d ?? undefined,
    max7d: nmVariant.maxPrice7d ?? undefined,
    min30d: nmVariant.minPrice30d ?? undefined,
    max30d: nmVariant.maxPrice30d ?? undefined,
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
  getConditionPrices,
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
