import { useState, useCallback, useEffect } from 'react';
import { justTcgApi, type JustTcgGame, type UnifiedCardResult, type JustTcgPriceHistory } from '@/lib/justTcgApi';
import { useToast } from '@/hooks/use-toast';

// ============================================
// Types
// ============================================

interface UseJustTcgSearchOptions {
  game?: JustTcgGame;
  setId?: string;
  condition?: string;
  autoSearch?: boolean;
}

interface UseJustTcgSearchReturn {
  cards: UnifiedCardResult[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

interface UseJustTcgPriceReturn {
  price: number | null;
  priceHistory: JustTcgPriceHistory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  changes: {
    day7?: number;
    day30?: number;
    day90?: number;
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for searching cards via JustTCG API
 */
export function useJustTcgSearch(options: UseJustTcgSearchOptions = {}): UseJustTcgSearchReturn {
  const { game, setId, condition = 'NM', autoSearch = false } = options;
  const [cards, setCards] = useState<UnifiedCardResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [currentQuery, setCurrentQuery] = useState('');
  const { toast } = useToast();

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCards([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentQuery(query);
    setPage(1);

    try {
      const result = await justTcgApi.searchCards(query, {
        game,
        setId,
        condition,
        page: 1,
        pageSize: 20,
      });

      setCards(result.cards);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      const message = err.message || 'Failed to search cards';
      setError(message);
      toast({
        title: 'Search failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [game, setId, condition, toast]);

  const loadMore = useCallback(async () => {
    if (!currentQuery || loading) return;

    const nextPage = page + 1;
    setLoading(true);

    try {
      const result = await justTcgApi.searchCards(currentQuery, {
        game,
        setId,
        condition,
        page: nextPage,
        pageSize: 20,
      });

      setCards(prev => [...prev, ...result.cards]);
      setPage(nextPage);
    } catch (err: any) {
      setError(err.message || 'Failed to load more');
    } finally {
      setLoading(false);
    }
  }, [currentQuery, page, game, setId, condition, loading]);

  const hasMore = cards.length < totalCount;

  return {
    cards,
    loading,
    error,
    totalCount,
    search,
    loadMore,
    hasMore,
  };
}

/**
 * Hook for getting a single card's price with history
 */
export function useJustTcgPrice(
  tcgplayerId: string | undefined,
  options?: {
    condition?: string;
    historyDuration?: '7d' | '30d' | '90d' | '180d';
  }
): UseJustTcgPriceReturn {
  const { condition = 'NM', historyDuration = '30d' } = options || {};
  const [price, setPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<JustTcgPriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<{ day7?: number; day30?: number; day90?: number }>({});

  const fetchPrice = useCallback(async () => {
    if (!tcgplayerId) {
      setPrice(null);
      setPriceHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const card = await justTcgApi.getCardByTcgplayerId(tcgplayerId, {
        condition,
        priceHistoryDuration: historyDuration,
      });

      if (card) {
        setPrice(card.estimated_value || null);
        setPriceHistory(card.prices?.priceHistory || []);

        // Extract statistics
        if (card.statistics) {
          setChanges({
            day7: card.statistics['7d']?.price_change_pct,
            day30: card.statistics['30d']?.price_change_pct,
            day90: card.statistics['90d']?.price_change_pct,
          });
        }
      } else {
        setPrice(null);
        setPriceHistory([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  }, [tcgplayerId, condition, historyDuration]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return {
    price,
    priceHistory,
    loading,
    error,
    refresh: fetchPrice,
    changes,
  };
}

/**
 * Hook for getting all supported games
 */
export function useJustTcgGames() {
  const [games, setGames] = useState<Awaited<ReturnType<typeof justTcgApi.getGames>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await justTcgApi.getGames();
        setGames(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  return { games, loading, error };
}

/**
 * Hook for getting sets for a specific game
 */
export function useJustTcgSets(game: JustTcgGame | undefined) {
  const [sets, setSets] = useState<Awaited<ReturnType<typeof justTcgApi.getSets>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!game) {
      setSets([]);
      return;
    }

    const fetchSets = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await justTcgApi.getSets(game);
        setSets(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch sets');
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [game]);

  return { sets, loading, error };
}

/**
 * Hook for batch price updates (useful for inventory)
 */
export function useBatchPriceUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updatePrices = useCallback(async (
    cardIds: { tcgplayerId?: string; cardId?: string }[]
  ): Promise<Map<string, number>> => {
    setLoading(true);
    setError(null);

    try {
      const results = await justTcgApi.batchGetCards(cardIds);
      
      const priceMap = new Map<string, number>();
      for (const card of results) {
        if (card.estimated_value) {
          priceMap.set(card.tcgplayer_id || card.id, card.estimated_value);
        }
      }

      toast({
        title: 'Prices updated',
        description: `Updated ${priceMap.size} card prices`,
      });

      return priceMap;
    } catch (err: any) {
      const message = err.message || 'Failed to update prices';
      setError(message);
      toast({
        title: 'Update failed',
        description: message,
        variant: 'destructive',
      });
      return new Map();
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { updatePrices, loading, error };
}

// ============================================
// Export
// ============================================

export {
  useJustTcgSearch,
  useJustTcgPrice,
  useJustTcgGames,
  useJustTcgSets,
  useBatchPriceUpdate,
};
