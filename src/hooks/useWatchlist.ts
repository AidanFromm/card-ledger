import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const WATCHLIST_LIMIT = 25;

export interface WatchlistItem {
  id: string;
  user_id: string;
  product_name: string;
  set_name: string;
  card_number: string | null;
  image_url: string | null;
  category: string | null;
  grading_company: string | null;
  grade: string | null;
  raw_condition: string | null;
  current_price: number | null;
  previous_price: number | null;
  price_change_percent: number | null;
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AddToWatchlistParams {
  product_name: string;
  set_name: string;
  card_number?: string | null;
  image_url?: string | null;
  category?: string | null;
  grading_company?: string | null;
  grade?: string | null;
  raw_condition?: string | null;
  current_price?: number | null;
}

export const useWatchlist = () => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch watchlist items
  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setItems((data as WatchlistItem[]) || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching watchlist:', err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Add item to watchlist
  const addToWatchlist = useCallback(async (params: AddToWatchlistParams): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not authenticated',
          description: 'Please sign in to use the watchlist.',
        });
        return false;
      }

      // Check limit before adding
      if (items.length >= WATCHLIST_LIMIT) {
        toast({
          variant: 'destructive',
          title: 'Watchlist full',
          description: `You can only watch up to ${WATCHLIST_LIMIT} items. Remove some to add more.`,
        });
        return false;
      }

      // Check if already watching
      const existing = items.find(
        item =>
          item.product_name === params.product_name &&
          item.set_name === params.set_name &&
          item.card_number === (params.card_number || null)
      );

      if (existing) {
        toast({
          title: 'Already watching',
          description: 'This item is already in your watchlist.',
        });
        return false;
      }

      const { error: insertError } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          product_name: params.product_name,
          set_name: params.set_name,
          card_number: params.card_number || null,
          image_url: params.image_url || null,
          category: params.category || 'raw',
          grading_company: params.grading_company || null,
          grade: params.grade || null,
          raw_condition: params.raw_condition || null,
          current_price: params.current_price || null,
          previous_price: null,
          price_change_percent: null,
          price_updated_at: params.current_price ? new Date().toISOString() : null,
        });

      if (insertError) {
        if (insertError.message.includes('limit reached')) {
          toast({
            variant: 'destructive',
            title: 'Watchlist full',
            description: `Maximum ${WATCHLIST_LIMIT} items allowed.`,
          });
        } else {
          throw insertError;
        }
        return false;
      }

      toast({
        title: 'Added to watchlist',
        description: `${params.product_name} is now being watched.`,
      });

      await fetchWatchlist();
      return true;
    } catch (err: any) {
      console.error('Error adding to watchlist:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to add',
        description: err.message,
      });
      return false;
    }
  }, [items, toast, fetchWatchlist]);

  // Remove item from watchlist
  const removeFromWatchlist = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Removed from watchlist',
        description: 'Item is no longer being watched.',
      });

      await fetchWatchlist();
      return true;
    } catch (err: any) {
      console.error('Error removing from watchlist:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to remove',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchWatchlist]);

  // Check if item is in watchlist
  const isWatched = useCallback((productName: string, setName: string, cardNumber?: string | null): boolean => {
    return items.some(
      item =>
        item.product_name === productName &&
        item.set_name === setName &&
        item.card_number === (cardNumber || null)
    );
  }, [items]);

  // Get watchlist item by product details
  const getWatchlistItem = useCallback((productName: string, setName: string, cardNumber?: string | null): WatchlistItem | undefined => {
    return items.find(
      item =>
        item.product_name === productName &&
        item.set_name === setName &&
        item.card_number === (cardNumber || null)
    );
  }, [items]);

  // Update price for a watchlist item
  const updatePrice = useCallback(async (itemId: string, newPrice: number): Promise<boolean> => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return false;

      const previousPrice = item.current_price;
      const priceChangePercent = previousPrice && previousPrice > 0
        ? ((newPrice - previousPrice) / previousPrice) * 100
        : null;

      const { error: updateError } = await supabase
        .from('watchlist')
        .update({
          previous_price: previousPrice,
          current_price: newPrice,
          price_change_percent: priceChangePercent,
          price_updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      await fetchWatchlist();
      return true;
    } catch (err: any) {
      console.error('Error updating watchlist price:', err);
      return false;
    }
  }, [items, fetchWatchlist]);

  // Refresh all prices in watchlist
  const refreshAllPrices = useCallback(async (): Promise<void> => {
    for (const item of items) {
      try {
        const { data, error } = await supabase.functions.invoke('scrydex-price', {
          body: {
            name: item.product_name,
            setName: item.set_name,
            cardNumber: item.card_number,
            category: item.category || 'raw',
          },
        });

        if (!error && data?.market_price) {
          await updatePrice(item.id, data.market_price);
        }
      } catch (err) {
        console.error(`Failed to update price for ${item.product_name}:`, err);
      }
    }
  }, [items, updatePrice]);

  return {
    items,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isWatched,
    getWatchlistItem,
    updatePrice,
    refreshAllPrices,
    refetch: fetchWatchlist,
    count: items.length,
    limit: WATCHLIST_LIMIT,
    isFull: items.length >= WATCHLIST_LIMIT,
  };
};

export default useWatchlist;
