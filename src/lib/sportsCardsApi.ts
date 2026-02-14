/**
 * Sports Cards API Client for CardLedger
 * 
 * Provides search and pricing data for sports cards (Baseball, Basketball, Football, etc.)
 * 
 * Data Sources:
 * 1. eBay Browse API - Active listings with current market prices
 * 2. PriceCharting API - Historical/average pricing (via sportscards-prices function)
 * 3. Manual lookup URLs for major databases (SportsCardsPro, Beckett, PSA, etc.)
 * 
 * Supported Sports: Baseball, Basketball, Football, Hockey, Soccer
 * Supported Brands: Topps, Panini, Bowman, Upper Deck, Fleer, Donruss, etc.
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

export interface SportsCardSearchResult {
  id: string;
  name: string;
  set_name: string | null;
  number?: string;
  image_url?: string;
  estimated_value?: number;
  prices?: SportsCardPrices;
  category: string; // "sports"
  sport?: string;
  player?: string;
  team?: string;
  year?: number;
  brand?: string;
  parallel?: string;
  rookie?: boolean;
  graded?: {
    company: string;
    grade: string;
  };
  source: string;
  item_url?: string;
}

export interface SportsCardPrices {
  market?: number;
  low?: number;
  high?: number;
  average?: number;
  median?: number;
  graded?: number;
  sampleSize?: number;
  source?: string;
}

export interface SportsCardSet {
  name: string;
  year: number;
  brand: string;
  sport: string;
}

export interface SportsCardLookupUrls {
  sportscardspro?: string;
  beckett?: string;
  psaCard?: string;
  cardLadder?: string;
  ebay?: string;
}

export interface SportsCardSearchResponse {
  cards: SportsCardSearchResult[];
  totalCount: number;
  sport?: string;
  lookupUrls?: SportsCardLookupUrls;
  source: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SPORTS = [
  { value: "baseball", label: "Baseball", icon: "⚾" },
  { value: "basketball", label: "Basketball", icon: "🏀" },
  { value: "football", label: "Football", icon: "🏈" },
  { value: "hockey", label: "Hockey", icon: "🏒" },
  { value: "soccer", label: "Soccer", icon: "⚽" },
] as const;

export const BRANDS = [
  // Multi-sport brands
  { value: "panini", label: "Panini", sports: ["basketball", "football", "soccer"] },
  { value: "upper-deck", label: "Upper Deck", sports: ["hockey", "baseball", "basketball"] },
  
  // Baseball-specific
  { value: "topps", label: "Topps", sports: ["baseball"] },
  { value: "bowman", label: "Bowman", sports: ["baseball"] },
  { value: "topps-chrome", label: "Topps Chrome", sports: ["baseball"] },
  { value: "bowman-chrome", label: "Bowman Chrome", sports: ["baseball"] },
  
  // Basketball lines
  { value: "prizm", label: "Panini Prizm", sports: ["basketball", "football"] },
  { value: "select", label: "Panini Select", sports: ["basketball", "football"] },
  { value: "optic", label: "Donruss Optic", sports: ["basketball", "football"] },
  { value: "mosaic", label: "Panini Mosaic", sports: ["basketball", "football"] },
  { value: "hoops", label: "NBA Hoops", sports: ["basketball"] },
  { value: "fleer", label: "Fleer", sports: ["basketball", "baseball"] },
  
  // Football lines
  { value: "donruss", label: "Donruss", sports: ["football", "baseball"] },
  { value: "score", label: "Score", sports: ["football"] },
  { value: "contenders", label: "Panini Contenders", sports: ["football", "basketball"] },
  
  // Historical/Legacy
  { value: "o-pee-chee", label: "O-Pee-Chee", sports: ["hockey"] },
  { value: "skybox", label: "Skybox", sports: ["basketball"] },
] as const;

export const PARALLELS = [
  { value: "base", label: "Base" },
  { value: "refractor", label: "Refractor" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
  { value: "black", label: "Black" },
  { value: "auto", label: "Autograph" },
  { value: "patch", label: "Patch" },
  { value: "mem", label: "Memorabilia" },
  { value: "numbered", label: "Numbered" },
  { value: "1-of-1", label: "1/1" },
] as const;

// ============================================================================
// CACHE
// ============================================================================

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes (shorter than Pokemon due to more dynamic pricing)
const CACHE_PREFIX = "sports_cards_cache_";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCacheKey(type: string, params: Record<string, unknown>): string {
  return `${CACHE_PREFIX}${type}_${JSON.stringify(params)}`;
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
    // Ignore errors
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse player and card details from a title string
 */
function parseCardTitle(title: string): {
  player?: string;
  year?: number;
  brand?: string;
  cardNumber?: string;
  parallel?: string;
  rookie?: boolean;
} {
  const result: ReturnType<typeof parseCardTitle> = {};
  
  // Detect rookie card
  result.rookie = /\b(RC|ROOKIE|1st Year)\b/i.test(title);
  
  // Extract year (4-digit number between 1900-2099)
  const yearMatch = title.match(/\b(19[0-9]{2}|20[0-9]{2})\b/);
  if (yearMatch) {
    result.year = parseInt(yearMatch[1], 10);
  }
  
  // Extract card number
  const numberMatch = title.match(/#?\s*(\d{1,4})(?:\/\d+)?(?:\s|$)/);
  if (numberMatch) {
    result.cardNumber = numberMatch[1];
  }
  
  // Detect parallels
  const parallelPatterns: Record<string, RegExp> = {
    refractor: /\b(REFRACTOR|PRISM|PRIZM|CHROME)\b/i,
    auto: /\b(AUTO|AUTOGRAPH|SIGNED)\b/i,
    patch: /\b(PATCH|GAME.?USED|JERSEY)\b/i,
    numbered: /\/\d{1,4}\b/,
    gold: /\bGOLD\b/i,
    silver: /\bSILVER\b/i,
    red: /\bRED\b/i,
    blue: /\bBLUE\b/i,
    green: /\bGREEN\b/i,
  };
  
  for (const [parallel, pattern] of Object.entries(parallelPatterns)) {
    if (pattern.test(title)) {
      result.parallel = result.parallel ? `${result.parallel}, ${parallel}` : parallel;
    }
  }
  
  // Detect brand
  const brandPatterns: Record<string, RegExp> = {
    "Topps": /\bTOPPS\b/i,
    "Bowman": /\bBOWMAN\b/i,
    "Panini": /\bPANINI\b/i,
    "Prizm": /\bPRIZM\b/i,
    "Select": /\bSELECT\b/i,
    "Optic": /\bOPTIC\b/i,
    "Mosaic": /\bMOSAIC\b/i,
    "Upper Deck": /\bUPPER\s*DECK\b/i,
    "Fleer": /\bFLEER\b/i,
    "Donruss": /\bDONRUSS\b/i,
    "Score": /\bSCORE\b/i,
  };
  
  for (const [brand, pattern] of Object.entries(brandPatterns)) {
    if (pattern.test(title)) {
      result.brand = brand;
      break;
    }
  }
  
  // Extract grading info (PSA, BGS, CGC, SGC)
  const gradeMatch = title.match(/\b(PSA|BGS|CGC|SGC)\s*(\d{1,2}(?:\.\d)?)\b/i);
  if (gradeMatch) {
    // We return this separately in the main parsing
  }
  
  return result;
}

/**
 * Parse grading info from title
 */
function parseGrading(title: string): { company: string; grade: string } | undefined {
  const match = title.match(/\b(PSA|BGS|CGC|SGC)\s*(\d{1,2}(?:\.\d)?)\b/i);
  if (match) {
    return {
      company: match[1].toUpperCase(),
      grade: match[2],
    };
  }
  return undefined;
}

/**
 * Detect sport from search query
 */
function detectSport(query: string): string | undefined {
  const lowerQuery = query.toLowerCase();
  
  // Baseball keywords
  if (/\b(topps|bowman|mlb|baseball|batting|pitcher)\b/i.test(lowerQuery)) {
    return "baseball";
  }
  
  // Basketball keywords
  if (/\b(nba|basketball|panini\s*prizm|hoops|lebron|jordan|curry)\b/i.test(lowerQuery)) {
    return "basketball";
  }
  
  // Football keywords
  if (/\b(nfl|football|mahomes|brady)\b/i.test(lowerQuery)) {
    return "football";
  }
  
  // Hockey keywords
  if (/\b(nhl|hockey|upper\s*deck|gretzky|mcdavid)\b/i.test(lowerQuery)) {
    return "hockey";
  }
  
  // Soccer keywords
  if (/\b(soccer|fifa|premier\s*league|messi|ronaldo|mbappe)\b/i.test(lowerQuery)) {
    return "soccer";
  }
  
  return undefined;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Search for sports cards using multiple data sources
 */
export async function searchSportsCards(
  query: string,
  options?: {
    sport?: string;
    brand?: string;
    year?: number;
    gradingCompany?: string;
    grade?: string;
    playerName?: string;
    useCache?: boolean;
  }
): Promise<SportsCardSearchResponse> {
  const { sport, brand, year, gradingCompany, grade, playerName, useCache = true } = options || {};
  
  const cacheKey = getCacheKey("search", { query, sport, brand, year, gradingCompany, grade, playerName });
  
  // Check cache
  if (useCache) {
    const cached = getFromCache<SportsCardSearchResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Build search query
  let searchQuery = query;
  if (playerName && !searchQuery.includes(playerName)) {
    searchQuery = `${playerName} ${searchQuery}`;
  }
  if (brand && !searchQuery.toLowerCase().includes(brand.toLowerCase())) {
    searchQuery += ` ${brand}`;
  }
  if (year && !searchQuery.includes(String(year))) {
    searchQuery += ` ${year}`;
  }
  
  const detectedSport = sport || detectSport(searchQuery);
  
  // Fetch from multiple sources in parallel
  const [ebayResult, sportscardsResult] = await Promise.allSettled([
    // eBay API - current market prices
    supabase.functions.invoke("ebay-sold-prices", {
      body: {
        query: searchQuery,
        cardName: playerName || query,
        gradingCompany,
        grade,
        category: "sports",
      },
    }),
    // Sports Cards API - pricing database
    supabase.functions.invoke("sportscards-prices", {
      body: {
        query: searchQuery,
        playerName,
        year,
        brand,
        sport: detectedSport,
        gradingCompany,
        grade,
      },
    }),
  ]);
  
  const cards: SportsCardSearchResult[] = [];
  let lookupUrls: SportsCardLookupUrls | undefined;
  
  // Process eBay results
  if (ebayResult.status === "fulfilled" && ebayResult.value.data?.products) {
    const ebayProducts = ebayResult.value.data.products || [];
    const stats = ebayResult.value.data.stats;
    
    for (const product of ebayProducts) {
      const parsed = parseCardTitle(product.name);
      const graded = parseGrading(product.name);
      
      cards.push({
        id: product.id,
        name: product.name,
        set_name: product.set_name || parsed.brand || null,
        image_url: product.image_url,
        estimated_value: product.market_price,
        prices: {
          market: product.market_price,
          low: stats?.low,
          high: stats?.high,
          average: stats?.average,
          median: stats?.median,
          sampleSize: stats?.count,
          source: "ebay",
        },
        category: "sports",
        sport: detectedSport,
        year: parsed.year,
        brand: parsed.brand,
        parallel: parsed.parallel,
        rookie: parsed.rookie,
        graded,
        source: "ebay",
        item_url: product.item_url,
      });
    }
  }
  
  // Process sportscards-prices results
  if (sportscardsResult.status === "fulfilled" && sportscardsResult.value.data) {
    const sportsData = sportscardsResult.value.data;
    lookupUrls = sportsData.lookupUrls;
    
    if (sportsData.products) {
      for (const product of sportsData.products) {
        // Skip duplicates from eBay
        if (cards.some(c => c.name === product.name)) continue;
        
        cards.push({
          id: product.id,
          name: product.name,
          set_name: product.set_name,
          image_url: product.image_url,
          estimated_value: product.market_price || product.graded_price,
          prices: {
            market: product.market_price,
            graded: product.graded_price,
            low: product.lowest_listed,
            source: product.source,
          },
          category: "sports",
          sport: product.sport || detectedSport,
          source: product.source || "database",
        });
      }
    }
  }
  
  // Sort by price (highest first) for better UX
  cards.sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0));
  
  const response: SportsCardSearchResponse = {
    cards,
    totalCount: cards.length,
    sport: detectedSport,
    lookupUrls,
    source: cards.length > 0 ? (cards[0].source || "multi") : "none",
  };
  
  // Cache the results
  if (useCache) {
    setCache(cacheKey, response);
  }
  
  return response;
}

/**
 * Search by player name specifically
 */
export async function searchByPlayer(
  playerName: string,
  options?: {
    sport?: string;
    year?: number;
    brand?: string;
  }
): Promise<SportsCardSearchResponse> {
  return searchSportsCards(playerName, {
    ...options,
    playerName,
  });
}

/**
 * Search by card set/brand
 */
export async function searchBySet(
  brand: string,
  year?: number,
  sport?: string
): Promise<SportsCardSearchResponse> {
  const query = year ? `${year} ${brand}` : brand;
  return searchSportsCards(query, { brand, year, sport });
}

/**
 * Get pricing data for a specific card
 */
export async function getCardPricing(
  cardName: string,
  options?: {
    setName?: string;
    gradingCompany?: string;
    grade?: string;
  }
): Promise<SportsCardPrices | null> {
  const { setName, gradingCompany, grade } = options || {};
  
  try {
    const { data, error } = await supabase.functions.invoke("ebay-sold-prices", {
      body: {
        cardName,
        setName,
        gradingCompany,
        grade,
        category: "sports",
      },
    });
    
    if (error || !data?.stats) {
      return null;
    }
    
    return {
      market: data.stats.median,
      low: data.stats.low,
      high: data.stats.high,
      average: data.stats.average,
      median: data.stats.median,
      sampleSize: data.stats.count,
      source: "ebay",
    };
  } catch {
    return null;
  }
}

/**
 * Get lookup URLs for manual price research
 */
export function getLookupUrls(query: string): SportsCardLookupUrls {
  const encodedQuery = encodeURIComponent(query);
  
  return {
    sportscardspro: `https://www.sportscardspro.com/search?q=${encodedQuery}`,
    beckett: `https://www.beckett.com/search/?term=${encodedQuery}&type=cards`,
    psaCard: `https://www.psacard.com/smrpriceguide?s=${encodedQuery}`,
    cardLadder: `https://www.cardladder.com/search?q=${encodedQuery}`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=212&LH_Sold=1`,
  };
}

/**
 * Get brands for a specific sport
 */
export function getBrandsForSport(sport: string): typeof BRANDS[number][] {
  return BRANDS.filter(brand => 
    (brand.sports as readonly string[]).includes(sport)
  );
}

/**
 * Clear sports cards cache
 */
export function clearCache(): void {
  clearOldCache();
}

// ============================================================================
// EXPORT
// ============================================================================

export const sportsCardsApi = {
  searchCards: searchSportsCards,
  searchByPlayer,
  searchBySet,
  getCardPricing,
  getLookupUrls,
  getBrandsForSport,
  clearCache,
  
  // Constants
  SPORTS,
  BRANDS,
  PARALLELS,
};

export default sportsCardsApi;
