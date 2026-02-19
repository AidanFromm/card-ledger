import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface PortfolioDataPoint {
  date: string;
  value: number;
  timestamp: number;
}

interface UsePortfolioHistoryReturn {
  data: PortfolioDataPoint[];
  loading: boolean;
  error: string | null;
  periodChange: number;
  periodChangePercent: number;
  refetch: () => Promise<void>;
}

/**
 * Hook to get portfolio value history for charting
 * Uses actual price history snapshots when available, falls back to purchase entries
 */
export function usePortfolioHistory(
  timeRange: TimeRange,
  currentValue: number
): UsePortfolioHistoryReturn {
  const [rawData, setRawData] = useState<PortfolioDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDaysForRange = (range: TimeRange): number => {
    switch (range) {
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '1Y': return 365;
      case 'ALL': return 3650; // ~10 years
      default: return 30;
    }
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRawData([]);
        return;
      }

      const days = getDaysForRange(timeRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Try to get portfolio snapshots first (if we have them)
      const { data: snapshots, error: snapshotError } = await supabase
        .from("portfolio_snapshots")
        .select("snapshot_date, total_value")
        .eq("user_id", user.id)
        .gte("snapshot_date", cutoffDate.toISOString().split('T')[0])
        .order("snapshot_date", { ascending: true });

      if (!snapshotError && snapshots && snapshots.length > 0) {
        // Use actual snapshots
        const dataPoints: PortfolioDataPoint[] = snapshots.map(s => ({
          date: s.snapshot_date,
          value: s.total_value,
          timestamp: new Date(s.snapshot_date).getTime(),
        }));

        // Add current value as latest point
        const today = new Date().toISOString().split('T')[0];
        if (dataPoints[dataPoints.length - 1]?.date !== today) {
          dataPoints.push({
            date: today,
            value: currentValue,
            timestamp: Date.now(),
          });
        }

        setRawData(dataPoints);
      } else {
        // Fallback: Build from purchase entries
        const { data: purchases, error: purchaseError } = await supabase
          .from("purchase_entries")
          .select("purchase_date, purchase_price, quantity")
          .eq("user_id", user.id)
          .gte("purchase_date", cutoffDate.toISOString().split('T')[0])
          .order("purchase_date", { ascending: true });

        if (purchaseError) throw purchaseError;

        if (!purchases || purchases.length === 0) {
          // No data at all, just show current value
          setRawData([{
            date: new Date().toISOString().split('T')[0],
            value: currentValue,
            timestamp: Date.now(),
          }]);
          return;
        }

        // Aggregate by date and calculate cumulative
        const dailyTotals = new Map<string, number>();
        let cumulative = 0;

        purchases.forEach(p => {
          const date = p.purchase_date;
          const value = p.purchase_price * p.quantity;
          cumulative += value;
          dailyTotals.set(date, cumulative);
        });

        const dataPoints: PortfolioDataPoint[] = Array.from(dailyTotals.entries()).map(([date, value]) => ({
          date,
          value,
          timestamp: new Date(date).getTime(),
        }));

        // Add current value
        const today = new Date().toISOString().split('T')[0];
        dataPoints.push({
          date: today,
          value: currentValue,
          timestamp: Date.now(),
        });

        setRawData(dataPoints);
      }
    } catch (err: any) {
      console.error("Portfolio history error:", err);
      setError(err.message || "Failed to load portfolio history");
      // Still show current value on error
      setRawData([{
        date: new Date().toISOString().split('T')[0],
        value: currentValue,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, currentValue]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Calculate period change
  const { periodChange, periodChangePercent } = useMemo(() => {
    if (rawData.length < 2) {
      return { periodChange: 0, periodChangePercent: 0 };
    }

    const startValue = rawData[0].value;
    const endValue = rawData[rawData.length - 1].value;
    const change = endValue - startValue;
    const percent = startValue > 0 ? (change / startValue) * 100 : 0;

    return { periodChange: change, periodChangePercent: percent };
  }, [rawData]);

  return {
    data: rawData,
    loading,
    error,
    periodChange,
    periodChangePercent,
    refetch: fetchHistory,
  };
}
