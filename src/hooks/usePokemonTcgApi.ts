import { useState, useEffect, useCallback, useRef } from 'react';
import {
  searchCards,
  getCardById,
  getSets,
  getCardPrice,
  getSetCards,
  type CardSearchResult,
  type CardPrices,
  type PokemonTcgSet,
} from '@/lib/pokemonTcgApi';

/**
 * Hook for searching Pokemon TCG cards with debouncing
 */
export function useCardSearch(debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CardSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const search = useCallback(async (searchQuery: string, options?: {
    set?: string;
    rarity?: string;
    types?: string[];
    page?: number;
    pageSize?: number;
  }) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setTotalCount(0);
      return;
    }
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await searchCards(searchQuery, options);
      setResults(result.cards);
      setTotalCount(result.totalCount);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        search(query);
      } else {
        setResults([]);
        setTotalCount(0);
      }
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, search, debounceMs]);
  
  const clearResults = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    setQuery('');
  }, []);
  
  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    totalCount,
    search,
    clearResults,
  };
}

/**
 * Hook for fetching a single card's details
 */
export function useCard(cardId: string | null) {
  const [card, setCard] = useState<CardSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!cardId) {
      setCard(null);
      return;
    }
    
    let cancelled = false;
    
    async function fetchCard() {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getCardById(cardId);
        if (!cancelled) {
          setCard(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch card');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    fetchCard();
    
    return () => {
      cancelled = true;
    };
  }, [cardId]);
  
  return { card, isLoading, error };
}

/**
 * Hook for fetching card price (bypasses cache for fresh data)
 */
export function useCardPrice(cardId: string | null) {
  const [prices, setPrices] = useState<CardPrices | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refetch = useCallback(async () => {
    if (!cardId) {
      setPrices(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getCardPrice(cardId);
      setPrices(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setIsLoading(false);
    }
  }, [cardId]);
  
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return { prices, isLoading, error, refetch };
}

/**
 * Hook for fetching all sets
 */
export function useSets() {
  const [sets, setSets] = useState<PokemonTcgSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchSets() {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getSets();
        if (!cancelled) {
          setSets(result.sets);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch sets');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    fetchSets();
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  return { sets, isLoading, error };
}

/**
 * Hook for fetching cards in a specific set
 */
export function useSetCards(setId: string | null) {
  const [cards, setCards] = useState<CardSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  useEffect(() => {
    if (!setId) {
      setCards([]);
      setTotalCount(0);
      return;
    }
    
    let cancelled = false;
    
    async function fetchCards() {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getSetCards(setId, { pageSize: 250 });
        if (!cancelled) {
          setCards(result.cards);
          setTotalCount(result.totalCount);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch set cards');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    fetchCards();
    
    return () => {
      cancelled = true;
    };
  }, [setId]);
  
  return { cards, isLoading, error, totalCount };
}

/**
 * Format price for display
 */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null) return 'N/A';
  return `$${price.toFixed(2)}`;
}

/**
 * Get the best price from CardPrices
 */
export function getBestPrice(prices: CardPrices | undefined | null): number | null {
  if (!prices) return null;
  return prices.market ?? prices.mid ?? prices.low ?? null;
}

/**
 * Format variant name for display
 */
export function formatVariant(variant: string | undefined): string {
  if (!variant) return '';
  
  const variantMap: Record<string, string> = {
    'normal': 'Normal',
    'holofoil': 'Holofoil',
    'reverseHolofoil': 'Reverse Holo',
    '1stEditionHolofoil': '1st Ed. Holo',
    '1stEditionNormal': '1st Ed.',
    'unlimitedHolofoil': 'Unlimited Holo',
  };
  
  return variantMap[variant] || variant;
}
