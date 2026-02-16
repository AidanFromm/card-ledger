/**
 * Smart Search Hook
 * 
 * Provides intelligent card search with:
 * - Typo tolerance
 * - Query parsing (numbers, sets, categories)
 * - Multi-source search (Pokemon TCG + JustTCG)
 * - Keyboard navigation
 * - Match highlighting
 * - Instant suggestions
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  parseQuery,
  correctTypos,
  createFuseInstance,
  highlightMatches,
  generateSuggestions,
  type ParsedQuery,
  type SearchSuggestion,
  type HighlightedMatch,
  type FuseSearchItem,
} from '@/lib/smartSearch';
import { searchCards as searchPokemonCards, type CardSearchResult } from '@/lib/pokemonTcgApi';
import { justTcgApi, type UnifiedCardResult, type JustTcgGame } from '@/lib/justTcgApi';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useToast } from '@/hooks/use-toast';

// ============================================
// Types
// ============================================

export type CardCategory = 'pokemon' | 'mtg' | 'yugioh' | 'lorcana' | 'onepiece' | 'digimon' | 'fab' | 'dbs' | 'sports' | 'all';

export interface SmartSearchResult {
  id: string;
  name: string;
  setName: string;
  setId?: string;
  number?: string;
  rarity?: string;
  imageUrl?: string;
  imageUrlLarge?: string;
  category: CardCategory;
  price?: number;
  priceLow?: number;
  priceHigh?: number;
  priceVariant?: string;
  tcgplayerUrl?: string;
  // For highlighting
  nameHighlight?: HighlightedMatch[];
  setHighlight?: HighlightedMatch[];
  // Source tracking
  source: 'pokemontcg' | 'justtcg' | 'local';
  // Match score (0-1, higher is better)
  score: number;
}

export interface UseSmartSearchOptions {
  category?: CardCategory;
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  enableLocalCache?: boolean;
}

export interface UseSmartSearchReturn {
  // State
  query: string;
  setQuery: (q: string) => void;
  results: SmartSearchResult[];
  suggestions: SearchSuggestion[];
  loading: boolean;
  error: string | null;
  parsedQuery: ParsedQuery | null;
  
  // Keyboard navigation
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  
  // Actions
  search: (q?: string) => Promise<void>;
  selectResult: (index: number) => SmartSearchResult | null;
  clear: () => void;
  
  // Stats
  totalCount: number;
  searchTime: number;
}

// ============================================
// Local Cache for Fuzzy Search
// ============================================

interface CachedCard extends FuseSearchItem {
  setName: string;
  imageUrl?: string;
  price?: number;
  source: 'pokemontcg' | 'justtcg';
}

// In-memory cache of fetched cards for instant fuzzy search
const localCardCache = new Map<string, CachedCard[]>();
const CACHE_KEY = 'smart_search_cache';
const MAX_CACHE_SIZE = 1000;

function getLocalCache(): CachedCard[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore
  }
  return [];
}

function addToLocalCache(cards: CachedCard[]) {
  try {
    const existing = getLocalCache();
    const merged = [...cards, ...existing];
    
    // Deduplicate by ID
    const seen = new Set<string>();
    const unique = merged.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    
    // Limit size
    const limited = unique.slice(0, MAX_CACHE_SIZE);
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(limited));
  } catch {
    // Storage full, ignore
  }
}

// ============================================
// Hook Implementation
// ============================================

export function useSmartSearch(options: UseSmartSearchOptions = {}): UseSmartSearchReturn {
  const {
    category = 'all',
    debounceMs = 250,
    minQueryLength = 2,
    maxResults = 25,
    enableLocalCache = true,
  } = options;
  
  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SmartSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  
  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const fuseRef = useRef<Fuse<CachedCard> | null>(null);
  
  // Hooks
  const { recentSearches, addSearch } = useRecentSearches();
  const { toast } = useToast();
  
  // Initialize Fuse with local cache
  useEffect(() => {
    if (enableLocalCache) {
      const cached = getLocalCache();
      if (cached.length > 0) {
        fuseRef.current = createFuseInstance(cached);
      }
    }
  }, [enableLocalCache]);
  
  // Update suggestions when query changes
  useEffect(() => {
    const recentQueries = recentSearches.map(s => s.query);
    const newSuggestions = generateSuggestions(
      query,
      recentQueries,
      category === 'all' ? undefined : category
    );
    setSuggestions(newSuggestions);
  }, [query, recentSearches, category]);
  
  // Convert Pokemon TCG result to SmartSearchResult
  const mapPokemonResult = useCallback((
    card: CardSearchResult,
    score: number = 1,
    queryTokens: string[] = []
  ): SmartSearchResult => {
    return {
      id: card.id,
      name: card.name,
      setName: card.set_name,
      setId: card.set_id,
      number: card.number,
      rarity: card.rarity,
      imageUrl: card.image_url,
      imageUrlLarge: card.image_url_large,
      category: 'pokemon',
      price: card.prices?.market || card.estimated_value,
      priceLow: card.prices?.low,
      priceHigh: card.prices?.high,
      priceVariant: card.prices?.variant,
      tcgplayerUrl: card.tcgplayer_url,
      source: 'pokemontcg',
      score,
    };
  }, []);
  
  // Convert JustTCG result to SmartSearchResult
  const mapJustTcgResult = useCallback((
    card: UnifiedCardResult,
    score: number = 1
  ): SmartSearchResult => {
    return {
      id: card.id,
      name: card.name,
      setName: card.set_name,
      setId: card.set_id,
      number: card.number,
      rarity: card.rarity,
      imageUrl: card.image_url,
      category: card.category as CardCategory,
      price: card.estimated_value,
      priceLow: card.prices?.low,
      priceHigh: card.prices?.high,
      priceVariant: card.prices?.variant,
      source: 'justtcg',
      score,
    };
  }, []);
  
  // Main search function
  const search = useCallback(async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    
    // Clear if query too short
    if (q.length < minQueryLength) {
      setResults([]);
      setTotalCount(0);
      setError(null);
      setParsedQuery(null);
      return;
    }
    
    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    
    const startTime = performance.now();
    setLoading(true);
    setError(null);
    setSelectedIndex(-1);
    
    try {
      // Parse the query
      const parsed = parseQuery(q);
      setParsedQuery(parsed);
      
      // Try typo correction
      const correctedQuery = correctTypos(parsed.cardName);
      
      // Instant local search first (while API loads)
      if (enableLocalCache && fuseRef.current) {
        const localResults = fuseRef.current.search(correctedQuery, { limit: 10 });
        if (localResults.length > 0) {
          const instant = localResults.map(r => ({
            id: r.item.id,
            name: r.item.name,
            setName: r.item.setName,
            number: r.item.number,
            category: (r.item.category || 'pokemon') as CardCategory,
            imageUrl: r.item.imageUrl,
            price: r.item.price,
            source: r.item.source,
            score: 1 - (r.score || 0),
            nameHighlight: r.matches?.find(m => m.key === 'name')
              ? highlightMatches(r.item.name, r.matches.find(m => m.key === 'name')?.indices)
              : undefined,
          } as SmartSearchResult));
          
          setResults(instant);
        }
      }
      
      // Determine which API to call
      const allResults: SmartSearchResult[] = [];
      
      // Map category to JustTCG game
      const justTcgGame: JustTcgGame | undefined = 
        category === 'pokemon' ? 'pokemon' :
        category === 'mtg' ? 'magic-the-gathering' :
        category === 'yugioh' ? 'yugioh' :
        category === 'lorcana' ? 'disney-lorcana' :
        category === 'onepiece' ? 'one-piece-card-game' :
        category === 'digimon' ? 'digimon-card-game' :
        category === 'fab' ? 'flesh-and-blood-tcg' :
        category === 'dbs' ? 'dragon-ball-super-fusion-world' :
        undefined;
      
      // Search Pokemon TCG API (for Pokemon category or all)
      if (category === 'all' || category === 'pokemon') {
        try {
          const pokemonResult = await searchPokemonCards(correctedQuery, {
            set: parsed.setName,
            pageSize: maxResults,
          });
          
          for (const card of pokemonResult.cards) {
            allResults.push(mapPokemonResult(card, 1));
          }
          
          setTotalCount(prev => prev + pokemonResult.totalCount);
        } catch (err) {
          console.warn('Pokemon TCG search failed:', err);
        }
      }
      
      // Search JustTCG API (for specific categories or all non-Pokemon)
      if (justTcgGame || (category === 'all' && !allResults.length)) {
        try {
          const justTcgResult = await justTcgApi.searchCards(correctedQuery, {
            game: justTcgGame,
            pageSize: maxResults,
          });
          
          for (const card of justTcgResult.cards) {
            // Avoid duplicates if we already have Pokemon results
            if (category === 'all' && card.category === 'pokemon' && allResults.length > 0) {
              continue;
            }
            allResults.push(mapJustTcgResult(card, 1));
          }
          
          setTotalCount(prev => prev + justTcgResult.totalCount);
        } catch (err) {
          console.warn('JustTCG search failed:', err);
        }
      }
      
      // Sort by relevance (score) and price availability
      allResults.sort((a, b) => {
        // Prioritize cards with prices
        const aHasPrice = a.price ? 1 : 0;
        const bHasPrice = b.price ? 1 : 0;
        if (aHasPrice !== bHasPrice) return bHasPrice - aHasPrice;
        
        // Then by score
        return b.score - a.score;
      });
      
      // Filter by card number if specified
      let filtered = allResults;
      if (parsed.cardNumber) {
        const targetNum = parseInt(parsed.cardNumber, 10);
        filtered = allResults.filter(r => {
          if (!r.number) return false;
          const cardNum = parseInt(r.number.replace(/\D/g, ''), 10);
          return cardNum === targetNum;
        });
        
        // If no exact matches, fall back to all results
        if (filtered.length === 0) {
          filtered = allResults;
        }
      }
      
      setResults(filtered.slice(0, maxResults));
      setSearchTime(performance.now() - startTime);
      
      // Cache results for future fuzzy search
      if (enableLocalCache) {
        const toCache: CachedCard[] = filtered.map(r => ({
          id: r.id,
          name: r.name,
          setName: r.setName,
          number: r.number,
          category: r.category,
          imageUrl: r.imageUrl,
          price: r.price,
          source: r.source,
        }));
        addToLocalCache(toCache);
        
        // Update Fuse instance
        const allCached = getLocalCache();
        fuseRef.current = createFuseInstance(allCached);
      }
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [query, category, minQueryLength, maxResults, enableLocalCache, mapPokemonResult, mapJustTcgResult]);
  
  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (query.length >= minQueryLength) {
      debounceRef.current = setTimeout(() => {
        search();
      }, debounceMs);
    } else {
      setResults([]);
      setParsedQuery(null);
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search, debounceMs, minQueryLength]);
  
  // Select a result by index
  const selectResult = useCallback((index: number): SmartSearchResult | null => {
    if (index >= 0 && index < results.length) {
      const result = results[index];
      addSearch(result.name);
      return result;
    }
    return null;
  }, [results, addSearch]);
  
  // Clear search
  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setError(null);
    setParsedQuery(null);
    setSelectedIndex(-1);
    setTotalCount(0);
  }, []);
  
  return {
    query,
    setQuery,
    results,
    suggestions,
    loading,
    error,
    parsedQuery,
    selectedIndex,
    setSelectedIndex,
    search,
    selectResult,
    clear,
    totalCount,
    searchTime,
  };
}

// ============================================
// Keyboard Navigation Hook
// ============================================

export function useSearchKeyboard(
  results: SmartSearchResult[],
  selectedIndex: number,
  setSelectedIndex: (i: number) => void,
  onSelect: (result: SmartSearchResult) => void,
  onEscape?: () => void
) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, -1));
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          onSelect(results[selectedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        break;
        
      case 'Tab':
        // Allow tab to work normally for accessibility
        break;
    }
  }, [results, selectedIndex, setSelectedIndex, onSelect, onEscape]);
  
  return handleKeyDown;
}

// ============================================
// Export
// ============================================

export default useSmartSearch;
