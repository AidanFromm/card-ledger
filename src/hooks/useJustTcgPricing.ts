import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  justTcgApi, 
  type JustTcgGame, 
  type UnifiedCardResult, 
  type JustTcgPriceHistory,
  type ConditionPrices,
  type PriceStatistics,
  type JustTcgCondition
} from '@/lib/justTcgApi';
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
  conditionPrices: ConditionPrices;
  statistics: PriceStatistics | null;
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
    condition?: JustTcgCondition;
    historyDuration?: '7d' | '30d' | '90d' | '180d';
    autoFetch?: boolean;
  }
): UseJustTcgPriceReturn {
  const { 
    condition = 'NM', 
    historyDuration = '180d',
    autoFetch = true 
  } = options || {};
  
  const [price, setPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<JustTcgPriceHistory[]>([]);
  const [conditionPrices, setConditionPrices] = useState<ConditionPrices>({});
  const [statistics, setStatistics] = useState<PriceStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<{ day7?: number; day30?: number; day90?: number }>({});

  const fetchPrice = useCallback(async () => {
    if (!tcgplayerId) {
      setPrice(null);
      setPriceHistory([]);
      setConditionPrices({});
      setStatistics(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const card = await justTcgApi.getCardByTcgplayerId(tcgplayerId, {
        condition: 'NM,LP,MP,HP,DMG', // Get all conditions
        priceHistoryDuration: historyDuration,
      });

      if (card) {
        setPrice(card.estimated_value || null);
        setPriceHistory(card.prices?.priceHistory || []);
        setConditionPrices(card.conditionPrices || {});
        setStatistics(card.statistics || null);

        // Extract price changes
        if (card.statistics) {
          setChanges({
            day7: card.statistics.change7d,
            day30: card.statistics.change30d,
            day90: card.statistics.change90d,
          });
        }
      } else {
        setPrice(null);
        setPriceHistory([]);
        setConditionPrices({});
        setStatistics(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  }, [tcgplayerId, condition, historyDuration]);

  useEffect(() => {
    if (autoFetch) {
      fetchPrice();
    }
  }, [fetchPrice, autoFetch]);

  return {
    price,
    priceHistory,
    conditionPrices,
    statistics,
    loading,
    error,
    refresh: fetchPrice,
    changes,
  };
}

/**
 * Hook for getting condition-specific prices
 */
export function useConditionPrices(tcgplayerId: string | undefined) {
  const [prices, setPrices] = useState<ConditionPrices>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tcgplayerId) {
      setPrices({});
      return;
    }

    const fetchPrices = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await justTcgApi.getConditionPrices(tcgplayerId);
        setPrices(result || {});
      } catch (err: any) {
        setError(err.message || 'Failed to fetch prices');
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [tcgplayerId]);

  return { prices, loading, error };
}

/**
 * Hook for getting 180-day price history
 */
export function usePriceHistory180d(
  tcgplayerId: string | undefined,
  condition: JustTcgCondition = 'NM'
) {
  const [history, setHistory] = useState<JustTcgPriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculated values
  const stats = useMemo(() => {
    if (history.length < 2) return null;

    const prices = history.map(h => h.price_usd);
    const currentPrice = prices[prices.length - 1];
    const startPrice = prices[0];
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    const change = currentPrice - startPrice;
    const changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;

    // Calculate trend (linear regression slope)
    const n = prices.length;
    const xMean = (n - 1) / 2;
    const yMean = avg;
    let numerator = 0;
    let denominator = 0;
    
    prices.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += (x - xMean) ** 2;
    });
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const trendDirection = slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'stable';

    return {
      currentPrice,
      startPrice,
      high,
      low,
      avg,
      change,
      changePercent,
      slope,
      trendDirection,
      dataPoints: prices.length,
    };
  }, [history]);

  useEffect(() => {
    if (!tcgplayerId) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await justTcgApi.getPriceHistory(tcgplayerId, '180d', condition);
        setHistory(result);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch price history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [tcgplayerId, condition]);

  return { history, stats, loading, error };
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
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const updatePrices = useCallback(async (
    cardIds: { tcgplayerId?: string; cardId?: string }[]
  ): Promise<Map<string, { price: number; change7d?: number; change30d?: number }>> => {
    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: cardIds.length });

    try {
      // Process in batches of 20 (free tier limit)
      const batchSize = 20;
      const results = new Map<string, { price: number; change7d?: number; change30d?: number }>();
      
      for (let i = 0; i < cardIds.length; i += batchSize) {
        const batch = cardIds.slice(i, i + batchSize);
        const batchResults = await justTcgApi.batchGetCards(batch);
        
        for (const card of batchResults) {
          if (card.estimated_value) {
            results.set(card.tcgplayer_id || card.id, {
              price: card.estimated_value,
              change7d: card.statistics?.change7d,
              change30d: card.statistics?.change30d,
            });
          }
        }
        
        setProgress({ current: Math.min(i + batchSize, cardIds.length), total: cardIds.length });
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < cardIds.length) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      toast({
        title: 'Prices updated',
        description: `Updated ${results.size} card prices`,
      });

      return results;
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
      setProgress({ current: 0, total: 0 });
    }
  }, [toast]);

  return { updatePrices, loading, error, progress };
}

/**
 * Hook for refreshing inventory prices from JustTCG
 * Integrates with the inventory system
 */
export function useInventoryPriceRefresh() {
  const { updatePrices, loading, error, progress } = useBatchPriceUpdate();
  const { toast } = useToast();

  const refreshInventoryPrices = useCallback(async (
    items: Array<{ id: string; tcgplayer_id?: string; name: string; category?: string }>,
    updateItemFn: (id: string, updates: { market_price: number }) => Promise<void>
  ): Promise<number> => {
    // Filter to items that have TCGplayer IDs and are from supported categories
    const supportedCategories = ['pokemon', 'mtg', 'yugioh', 'lorcana', 'onepiece', 'digimon'];
    const eligibleItems = items.filter(item => 
      item.tcgplayer_id && 
      (!item.category || supportedCategories.includes(item.category.toLowerCase()))
    );

    if (eligibleItems.length === 0) {
      toast({
        title: 'No eligible cards',
        description: 'No cards with TCGplayer IDs found',
        variant: 'destructive',
      });
      return 0;
    }

    // Fetch prices
    const priceMap = await updatePrices(
      eligibleItems.map(item => ({ tcgplayerId: item.tcgplayer_id }))
    );

    // Update inventory items with new prices
    let updatedCount = 0;
    for (const item of eligibleItems) {
      const priceData = priceMap.get(item.tcgplayer_id!);
      if (priceData) {
        try {
          await updateItemFn(item.id, { market_price: priceData.price });
          updatedCount++;
        } catch (err) {
          console.error(`Failed to update price for ${item.name}:`, err);
        }
      }
    }

    return updatedCount;
  }, [updatePrices, toast]);

  return { refreshInventoryPrices, loading, error, progress };
}

// ============================================
// Export
// ============================================

export {
  useJustTcgSearch,
  useJustTcgPrice,
  useConditionPrices,
  usePriceHistory180d,
  useJustTcgGames,
  useJustTcgSets,
  useBatchPriceUpdate,
  useInventoryPriceRefresh,
};
