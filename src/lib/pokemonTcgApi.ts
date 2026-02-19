/**
 * Pokemon TCG API Client
 * 
 * API Documentation: https://docs.pokemontcg.io/
 * API Base URL: https://api.pokemontcg.io/v2
 * 
 * Rate Limits:
 * - Without API key: 1000 requests/day, 30 requests/minute
 * - With API key: 20,000 requests/day
 */

// Types for Pokemon TCG API responses
export interface PokemonTcgCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  evolvesTo?: string[];
  rules?: string[];
  attacks?: PokemonTcgAttack[];
  weaknesses?: PokemonTcgWeakness[];
  resistances?: PokemonTcgResistance[];
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: PokemonTcgSet;
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities?: Record<string, string>;
  regulationMark?: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: PokemonTcgTcgplayer;
  cardmarket?: PokemonTcgCardmarket;
}

export interface PokemonTcgAttack {
  name: string;
  cost: string[];
  convertedEnergyCost: number;
  damage: string;
  text?: string;
}

export interface PokemonTcgWeakness {
  type: string;
  value: string;
}

export interface PokemonTcgResistance {
  type: string;
  value: string;
}

export interface PokemonTcgSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities?: Record<string, string>;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

export interface PokemonTcgTcgplayer {
  url: string;
  updatedAt: string;
  prices?: {
    normal?: PokemonTcgPriceData;
    holofoil?: PokemonTcgPriceData;
    reverseHolofoil?: PokemonTcgPriceData;
    '1stEditionHolofoil'?: PokemonTcgPriceData;
    '1stEditionNormal'?: PokemonTcgPriceData;
    unlimitedHolofoil?: PokemonTcgPriceData;
  };
}

export interface PokemonTcgPriceData {
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
  directLow?: number | null;
}

export interface PokemonTcgCardmarket {
  url: string;
  updatedAt: string;
  prices?: {
    averageSellPrice?: number;
    lowPrice?: number;
    trendPrice?: number;
    reverseHoloTrend?: number;
    reverseHoloSell?: number;
    reverseHoloLow?: number;
    avg1?: number;
    avg7?: number;
    avg30?: number;
  };
}

export interface PokemonTcgApiResponse<T> {
  data: T;
  page?: number;
  pageSize?: number;
  count?: number;
  totalCount?: number;
}

// Our internal card format - mapped from API
export interface CardSearchResult {
  id: string;
  name: string;
  set_name: string;
  set_id: string;
  number?: string;
  rarity?: string;
  image_url?: string;
  image_url_large?: string;
  estimated_value?: number;
  prices?: CardPrices;
  category: string;
  supertype?: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  artist?: string;
  tcgplayer_url?: string;
  set_logo?: string;
  set_symbol?: string;
  release_date?: string;
}

export interface CardPrices {
  market?: number;
  low?: number;
  mid?: number;
  high?: number;
  directLow?: number;
  variant?: string; // e.g., "holofoil", "normal", "reverseHolofoil"
  allVariants?: {
    [key: string]: {
      market?: number;
      low?: number;
      mid?: number;
      high?: number;
    };
  };
}

// Cache configuration
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_PREFIX = 'pokemon_tcg_cache_';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Rate limiting
const RATE_LIMIT_DELAY_MS = 100; // 100ms between requests
let lastRequestTime = 0;

// API Configuration
const API_BASE = 'https://api.pokemontcg.io/v2';

function getApiKey(): string | null {
  return import.meta.env.VITE_POKEMON_TCG_API_KEY || null;
}

// Cache utilities
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
  } catch (error) {
    // Storage might be full, clear old cache entries
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
    // Ignore errors
  }
}

// Rate limiting
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

// API request helper
async function apiRequest<T>(
  endpoint: string,
  params?: Record<string, string>,
  useCache = true
): Promise<T> {
  const cacheKey = getCacheKey(endpoint, params);
  
  // Check cache first
  if (useCache) {
    const cached = getFromCache<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Wait for rate limit
  await waitForRateLimit();
  
  // Build URL
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const apiKey = getApiKey();
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
  
  // Make request
  const response = await fetch(url.toString(), { headers });
  
  if (!response.ok) {
    // Handle rate limiting
    if (response.status === 429) {
      // Wait and retry once
      await new Promise(resolve => setTimeout(resolve, 2000));
      return apiRequest<T>(endpoint, params, useCache);
    }
    throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Cache the result
  if (useCache) {
    setCache(cacheKey, data);
  }
  
  return data;
}

// Map API card to our format
function mapCardToResult(card: PokemonTcgCard): CardSearchResult {
  // Get the best price available
  const prices = card.tcgplayer?.prices;
  let bestPrice: CardPrices | undefined;
  let variant = '';
  
  if (prices) {
    // Priority: holofoil > reverseHolofoil > normal > others
    const priceKeys: (keyof NonNullable<PokemonTcgTcgplayer['prices']>)[] = [
      'holofoil',
      '1stEditionHolofoil',
      'reverseHolofoil',
      'normal',
      '1stEditionNormal',
      'unlimitedHolofoil',
    ];
    
    const allVariants: CardPrices['allVariants'] = {};
    
    for (const key of priceKeys) {
      const priceData = prices[key];
      if (priceData && priceData.market !== null) {
        allVariants[key] = {
          market: priceData.market ?? undefined,
          low: priceData.low ?? undefined,
          mid: priceData.mid ?? undefined,
          high: priceData.high ?? undefined,
        };
        
        if (!bestPrice) {
          variant = key;
          bestPrice = {
            market: priceData.market ?? undefined,
            low: priceData.low ?? undefined,
            mid: priceData.mid ?? undefined,
            high: priceData.high ?? undefined,
            directLow: priceData.directLow ?? undefined,
            variant: key,
          };
        }
      }
    }
    
    if (bestPrice) {
      bestPrice.allVariants = allVariants;
    }
  }
  
  return {
    id: card.id,
    name: card.name,
    set_name: card.set.name,
    set_id: card.set.id,
    number: card.number,
    rarity: card.rarity,
    image_url: card.images.small,
    image_url_large: card.images.large,
    estimated_value: bestPrice?.market,
    prices: bestPrice,
    category: 'pokemon',
    supertype: card.supertype,
    subtypes: card.subtypes,
    hp: card.hp,
    types: card.types,
    artist: card.artist,
    tcgplayer_url: card.tcgplayer?.url,
    set_logo: card.set.images.logo,
    set_symbol: card.set.images.symbol,
    release_date: card.set.releaseDate,
  };
}

// API Functions

/**
 * Search cards by name with optional filters
 */
export async function searchCards(
  query: string,
  options?: {
    set?: string;
    rarity?: string;
    types?: string[];
    page?: number;
    pageSize?: number;
  }
): Promise<{ cards: CardSearchResult[]; totalCount: number; page: number }> {
  const { set, rarity, types, page = 1, pageSize = 20 } = options || {};
  
  // Build query string
  // The API uses Lucene query syntax
  let q = `name:"${query}*"`;
  
  if (set) {
    q += ` set.name:"${set}"`;
  }
  if (rarity) {
    q += ` rarity:"${rarity}"`;
  }
  if (types && types.length > 0) {
    q += ` types:${types.join(' OR types:')}`;
  }
  
  const params: Record<string, string> = {
    q,
    page: page.toString(),
    pageSize: pageSize.toString(),
    orderBy: '-set.releaseDate,name',
    select: 'id,name,supertype,subtypes,hp,types,number,artist,rarity,images,set,tcgplayer',
  };
  
  const response = await apiRequest<PokemonTcgApiResponse<PokemonTcgCard[]>>(
    '/cards',
    params
  );
  
  return {
    cards: (response.data || []).map(mapCardToResult),
    totalCount: response.totalCount || 0,
    page: response.page || 1,
  };
}

/**
 * Search cards with advanced query
 */
export async function searchCardsAdvanced(
  params: {
    name?: string;
    setId?: string;
    setName?: string;
    rarity?: string;
    types?: string[];
    subtypes?: string[];
    supertype?: string;
    hp?: string;
    artist?: string;
    number?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<{ cards: CardSearchResult[]; totalCount: number; page: number }> {
  const {
    name,
    setId,
    setName,
    rarity,
    types,
    subtypes,
    supertype,
    hp,
    artist,
    number,
    page = 1,
    pageSize = 20,
  } = params;
  
  // Build query parts
  const queryParts: string[] = [];
  
  if (name) queryParts.push(`name:"${name}*"`);
  if (setId) queryParts.push(`set.id:"${setId}"`);
  if (setName) queryParts.push(`set.name:"${setName}*"`);
  if (rarity) queryParts.push(`rarity:"${rarity}"`);
  if (types?.length) queryParts.push(`(${types.map(t => `types:"${t}"`).join(' OR ')})`);
  if (subtypes?.length) queryParts.push(`(${subtypes.map(s => `subtypes:"${s}"`).join(' OR ')})`);
  if (supertype) queryParts.push(`supertype:"${supertype}"`);
  if (hp) queryParts.push(`hp:"${hp}"`);
  if (artist) queryParts.push(`artist:"${artist}*"`);
  if (number) queryParts.push(`number:"${number}"`);
  
  if (queryParts.length === 0) {
    return { cards: [], totalCount: 0, page: 1 };
  }
  
  const requestParams: Record<string, string> = {
    q: queryParts.join(' '),
    page: page.toString(),
    pageSize: pageSize.toString(),
    orderBy: '-set.releaseDate,name',
    select: 'id,name,supertype,subtypes,hp,types,number,artist,rarity,images,set,tcgplayer',
  };
  
  const response = await apiRequest<PokemonTcgApiResponse<PokemonTcgCard[]>>(
    '/cards',
    requestParams
  );
  
  return {
    cards: (response.data || []).map(mapCardToResult),
    totalCount: response.totalCount || 0,
    page: response.page || 1,
  };
}

/**
 * Get a single card by ID
 */
export async function getCardById(id: string): Promise<CardSearchResult | null> {
  try {
    const response = await apiRequest<PokemonTcgApiResponse<PokemonTcgCard>>(
      `/cards/${id}`
    );
    
    if (!response.data) return null;
    
    return mapCardToResult(response.data);
  } catch (error) {
    console.error('Error fetching card:', error);
    return null;
  }
}

/**
 * Get full card details (including all price variants)
 */
export async function getCardDetails(id: string): Promise<PokemonTcgCard | null> {
  try {
    const response = await apiRequest<PokemonTcgApiResponse<PokemonTcgCard>>(
      `/cards/${id}`
    );
    
    return response.data || null;
  } catch (error) {
    console.error('Error fetching card details:', error);
    return null;
  }
}

/**
 * Get all sets
 */
export async function getSets(
  options?: {
    page?: number;
    pageSize?: number;
    orderBy?: string;
  }
): Promise<{ sets: PokemonTcgSet[]; totalCount: number }> {
  const { page = 1, pageSize = 250, orderBy = '-releaseDate' } = options || {};
  
  const params: Record<string, string> = {
    page: page.toString(),
    pageSize: pageSize.toString(),
    orderBy,
  };
  
  const response = await apiRequest<PokemonTcgApiResponse<PokemonTcgSet[]>>(
    '/sets',
    params
  );
  
  return {
    sets: response.data || [],
    totalCount: response.totalCount || 0,
  };
}

/**
 * Get a single set by ID
 */
export async function getSetById(id: string): Promise<PokemonTcgSet | null> {
  try {
    const response = await apiRequest<PokemonTcgApiResponse<PokemonTcgSet>>(
      `/sets/${id}`
    );
    
    return response.data || null;
  } catch (error) {
    console.error('Error fetching set:', error);
    return null;
  }
}

/**
 * Get all cards in a set
 */
export async function getSetCards(
  setId: string,
  options?: {
    page?: number;
    pageSize?: number;
  }
): Promise<{ cards: CardSearchResult[]; totalCount: number; page: number }> {
  const { page = 1, pageSize = 250 } = options || {};
  
  const params: Record<string, string> = {
    q: `set.id:"${setId}"`,
    page: page.toString(),
    pageSize: pageSize.toString(),
    orderBy: 'number',
    select: 'id,name,supertype,subtypes,hp,types,number,artist,rarity,images,set,tcgplayer',
  };
  
  const response = await apiRequest<PokemonTcgApiResponse<PokemonTcgCard[]>>(
    '/cards',
    params
  );
  
  return {
    cards: (response.data || []).map(mapCardToResult),
    totalCount: response.totalCount || 0,
    page: response.page || 1,
  };
}

/**
 * Get available rarities
 */
export async function getRarities(): Promise<string[]> {
  const response = await apiRequest<PokemonTcgApiResponse<string[]>>('/rarities');
  return response.data || [];
}

/**
 * Get available types (Fire, Water, etc.)
 */
export async function getTypes(): Promise<string[]> {
  const response = await apiRequest<PokemonTcgApiResponse<string[]>>('/types');
  return response.data || [];
}

/**
 * Get available subtypes (V, VMAX, etc.)
 */
export async function getSubtypes(): Promise<string[]> {
  const response = await apiRequest<PokemonTcgApiResponse<string[]>>('/subtypes');
  return response.data || [];
}

/**
 * Get available supertypes (Pokémon, Trainer, Energy)
 */
export async function getSupertypes(): Promise<string[]> {
  const response = await apiRequest<PokemonTcgApiResponse<string[]>>('/supertypes');
  return response.data || [];
}

/**
 * Get price for a specific card (refreshed data, bypasses cache)
 */
export async function getCardPrice(
  cardId: string
): Promise<CardPrices | null> {
  try {
    const response = await apiRequest<PokemonTcgApiResponse<PokemonTcgCard>>(
      `/cards/${cardId}`,
      { select: 'id,tcgplayer' },
      false // Don't use cache for price lookups
    );
    
    if (!response.data?.tcgplayer?.prices) return null;
    
    const prices = response.data.tcgplayer.prices;
    const allVariants: CardPrices['allVariants'] = {};
    let bestPrice: CardPrices | undefined;
    
    const priceKeys: (keyof NonNullable<PokemonTcgTcgplayer['prices']>)[] = [
      'holofoil',
      '1stEditionHolofoil',
      'reverseHolofoil',
      'normal',
      '1stEditionNormal',
      'unlimitedHolofoil',
    ];
    
    for (const key of priceKeys) {
      const priceData = prices[key];
      if (priceData && priceData.market !== null) {
        allVariants[key] = {
          market: priceData.market ?? undefined,
          low: priceData.low ?? undefined,
          mid: priceData.mid ?? undefined,
          high: priceData.high ?? undefined,
        };
        
        if (!bestPrice) {
          bestPrice = {
            market: priceData.market ?? undefined,
            low: priceData.low ?? undefined,
            mid: priceData.mid ?? undefined,
            high: priceData.high ?? undefined,
            directLow: priceData.directLow ?? undefined,
            variant: key,
            allVariants,
          };
        }
      }
    }
    
    return bestPrice || null;
  } catch (error) {
    console.error('Error fetching card price:', error);
    return null;
  }
}

/**
 * Clear all Pokemon TCG API cache
 */
export function clearCache(): void {
  clearOldCache();
}

/**
 * Prefetch common data (sets, types, rarities) for better UX
 */
export async function prefetchCommonData(): Promise<void> {
  try {
    await Promise.all([
      getSets(),
      getTypes(),
      getRarities(),
    ]);
  } catch (error) {
    console.warn('Failed to prefetch Pokemon TCG data:', error);
  }
}

// Export a singleton-like object for convenience
export const pokemonTcgApi = {
  searchCards,
  searchCardsAdvanced,
  getCardById,
  getCardDetails,
  getSets,
  getSetById,
  getSetCards,
  getRarities,
  getTypes,
  getSubtypes,
  getSupertypes,
  getCardPrice,
  clearCache,
  prefetchCommonData,
};

export default pokemonTcgApi;
