import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PriceHistoryPoint } from "@/lib/priceHistory";

interface UsePriceHistoryOptions {
  itemId?: string;
  days?: number;
}

interface UsePriceHistoryReturn {
  priceHistory: PriceHistoryPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch price history for a specific inventory item
 */
export function usePriceHistory(options: UsePriceHistoryOptions = {}): UsePriceHistoryReturn {
  const { itemId, days = 30 } = options;
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPriceHistory = useCallback(async () => {
    if (!itemId) {
      setPriceHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the RPC function for optimized queries
      const { data, error: fetchError } = await supabase.rpc(
        "get_item_price_history",
        {
          p_item_id: itemId,
          p_days: days,
        }
      );

      if (fetchError) throw fetchError;

      setPriceHistory(data || []);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch price history";
      setError(errorMessage);
      console.error("Price history fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [itemId, days]);

  useEffect(() => {
    fetchPriceHistory();
  }, [fetchPriceHistory]);

  return {
    priceHistory,
    loading,
    error,
    refetch: fetchPriceHistory,
  };
}

interface YesterdayValueReturn {
  yesterdayValue: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get yesterday's portfolio value for "today's change" display
 */
export function useYesterdayPortfolioValue(): YesterdayValueReturn {
  const [yesterdayValue, setYesterdayValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchYesterdayValue = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setYesterdayValue(0);
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase.rpc(
          "get_yesterday_portfolio_value",
          { p_user_id: user.id }
        );

        if (fetchError) throw fetchError;

        setYesterdayValue(data || 0);
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch yesterday's value";
        setError(errorMessage);
        console.error("Yesterday value fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchYesterdayValue();
  }, []);

  return { yesterdayValue, loading, error };
}

interface PortfolioChanges {
  todayChange: number;
  todayChangePercent: number;
  hasHistoricalData: boolean;
}

interface PortfolioHistoryReturn {
  values: number[];
  loading: boolean;
}

/**
 * Hook to get recent portfolio value history for sparkline
 * Returns last 7 days of portfolio values
 */
export function usePortfolioHistory(currentValue: number, days: number = 7): PortfolioHistoryReturn {
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setValues([currentValue]);
          setLoading(false);
          return;
        }

        // Get portfolio value history
        const { data, error } = await supabase.rpc(
          "get_portfolio_value_history",
          { p_user_id: user.id, p_days: days }
        );

        if (error || !data || data.length === 0) {
          // No history - just use current value
          setValues([currentValue]);
        } else {
          // Add current value to the end
          const historicalValues = data.map((d: { value: number }) => d.value);
          setValues([...historicalValues, currentValue]);
        }
      } catch (err) {
        console.error("Portfolio history fetch error:", err);
        setValues([currentValue]);
      } finally {
        setLoading(false);
      }
    };

    if (currentValue > 0) {
      fetchHistory();
    } else {
      setValues([]);
      setLoading(false);
    }
  }, [currentValue, days]);

  return { values, loading };
}

/**
 * Hook to calculate today's portfolio change
 */
export function useTodayChange(currentPortfolioValue: number): PortfolioChanges & { loading: boolean } {
  const { yesterdayValue, loading, error } = useYesterdayPortfolioValue();

  const hasHistoricalData = !loading && !error && yesterdayValue > 0;
  const todayChange = hasHistoricalData ? currentPortfolioValue - yesterdayValue : 0;
  const todayChangePercent = hasHistoricalData && yesterdayValue > 0
    ? ((todayChange / yesterdayValue) * 100)
    : 0;

  return {
    todayChange,
    todayChangePercent,
    hasHistoricalData,
    loading,
  };
}
