import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingCard {
  card_name: string;
  set_name: string | null;
  card_image_url: string | null;
  product_id: string | null;
  activity_count: number;
  latest_price: number | null;
  unique_users: number;
}

export interface PriceMover {
  inventory_item_id: string;
  item_name: string;
  set_name: string | null;
  card_image_url: string | null;
  grading_company: string | null;
  grade: string | null;
  current_price: number;
  previous_price: number;
  price_change: number;
  change_percent: number;
  quantity: number;
}

export interface RecentSale {
  sale_id: string;
  item_name: string;
  set_name: string | null;
  card_image_url: string | null;
  sale_price: number;
  purchase_price: number;
  profit: number;
  profit_percent: number;
  sale_date: string;
  grading_company: string | null;
  grade: string | null;
  quantity_sold: number;
}

interface UseMarketTrendsReturn {
  trendingCards: TrendingCard[];
  gainers: PriceMover[];
  losers: PriceMover[];
  recentSales: RecentSale[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMarketTrends(): UseMarketTrendsReturn {
  const [trendingCards, setTrendingCards] = useState<TrendingCard[]>([]);
  const [gainers, setGainers] = useState<PriceMover[]>([]);
  const [losers, setLosers] = useState<PriceMover[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [trendingResult, gainersResult, losersResult, salesResult] = await Promise.all([
        supabase.rpc('get_trending_cards', {
          p_days: 7,
          p_activity_types: ['search', 'view', 'add'],
          p_limit: 20,
        }),
        supabase.rpc('get_price_movers', {
          p_days: 7,
          p_direction: 'up',
          p_limit: 10,
          p_min_price: 1.00,
        }),
        supabase.rpc('get_price_movers', {
          p_days: 7,
          p_direction: 'down',
          p_limit: 10,
          p_min_price: 1.00,
        }),
        supabase.rpc('get_recently_sold', {
          p_limit: 20,
          p_user_id: null, // All users for market trends
        }),
      ]);

      if (trendingResult.error) console.warn('Trending error:', trendingResult.error);
      if (gainersResult.error) console.warn('Gainers error:', gainersResult.error);
      if (losersResult.error) console.warn('Losers error:', losersResult.error);
      if (salesResult.error) console.warn('Sales error:', salesResult.error);

      setTrendingCards(trendingResult.data || []);
      setGainers(gainersResult.data || []);
      setLosers(losersResult.data || []);
      setRecentSales(salesResult.data || []);
    } catch (err: any) {
      console.error('Market trends fetch error:', err);
      setError(err.message || 'Failed to load market trends');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return {
    trendingCards,
    gainers,
    losers,
    recentSales,
    loading,
    error,
    refetch: fetchTrends,
  };
}

// Hook to record card activity
export function useRecordActivity() {
  const recordActivity = useCallback(async (
    cardName: string,
    activityType: 'search' | 'view' | 'add' | 'watchlist' | 'sale' = 'search',
    options?: {
      setName?: string;
      productId?: string;
      cardImageUrl?: string;
      price?: number;
    }
  ) => {
    try {
      const { error } = await supabase.rpc('record_card_activity', {
        p_card_name: cardName,
        p_set_name: options?.setName || null,
        p_activity_type: activityType,
        p_product_id: options?.productId || null,
        p_card_image_url: options?.cardImageUrl || null,
        p_price: options?.price || null,
        p_user_id: null, // Will use auth.uid() in the function
      });

      if (error) {
        console.warn('Failed to record activity:', error);
      }
    } catch (err) {
      console.warn('Activity recording error:', err);
    }
  }, []);

  return { recordActivity };
}
