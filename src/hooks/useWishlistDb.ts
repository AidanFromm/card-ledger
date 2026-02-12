import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';

export interface WishlistItem {
  id: string;
  user_id: string;
  card_id: string;
  card_name: string;
  set_name: string | null;
  image_url: string | null;
  target_price: number | null;
  current_price: number | null;
  notes: string | null;
  tcg_type: string | null;
  card_number: string | null;
  rarity: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddToWishlistParams {
  card_id: string;
  card_name: string;
  set_name?: string | null;
  image_url?: string | null;
  target_price?: number | null;
  current_price?: number | null;
  notes?: string | null;
  tcg_type?: string | null;
  card_number?: string | null;
  rarity?: string | null;
}

const WISHLIST_LIMIT = 200;

export const useWishlistDb = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { createAlert } = usePriceAlerts();

  // Fetch all wishlist items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setItems((data as WishlistItem[]) || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching wishlist:', err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Add item to wishlist
  const addItem = useCallback(async (params: AddToWishlistParams, createPriceAlert = false): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not authenticated',
          description: 'Please sign in to add to wishlist.',
        });
        return false;
      }

      // Check limit
      if (items.length >= WISHLIST_LIMIT) {
        toast({
          variant: 'destructive',
          title: 'Wishlist full',
          description: `You can only have up to ${WISHLIST_LIMIT} items in your wishlist.`,
        });
        return false;
      }

      // Check for existing item
      const existing = items.find(i => i.card_id === params.card_id);
      if (existing) {
        toast({
          variant: 'destructive',
          title: 'Already in wishlist',
          description: `${params.card_name} is already in your wishlist.`,
        });
        return false;
      }

      const { error: insertError } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          card_id: params.card_id,
          card_name: params.card_name,
          set_name: params.set_name || null,
          image_url: params.image_url || null,
          target_price: params.target_price || null,
          current_price: params.current_price || null,
          notes: params.notes || null,
          tcg_type: params.tcg_type || 'pokemon',
          card_number: params.card_number || null,
          rarity: params.rarity || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Added to Wishlist',
        description: `${params.card_name} has been added to your wishlist.`,
      });

      // Auto-create price alert if target price is set
      if (createPriceAlert && params.target_price && params.target_price > 0) {
        await createAlert({
          card_id: params.card_id,
          card_name: params.card_name,
          set_name: params.set_name,
          card_image_url: params.image_url,
          current_price: params.current_price,
          target_price: params.target_price,
          direction: 'below',
        });
      }

      await fetchItems();
      return true;
    } catch (err: any) {
      console.error('Error adding to wishlist:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to add to wishlist',
        description: err.message,
      });
      return false;
    }
  }, [items, toast, fetchItems, createAlert]);

  // Update wishlist item
  const updateItem = useCallback(async (id: string, updates: Partial<WishlistItem>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('wishlist')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: 'Updated',
        description: 'Wishlist item updated.',
      });

      await fetchItems();
      return true;
    } catch (err: any) {
      console.error('Error updating wishlist item:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to update',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchItems]);

  // Remove item from wishlist
  const removeItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Removed',
        description: 'Item removed from wishlist.',
      });

      await fetchItems();
      return true;
    } catch (err: any) {
      console.error('Error removing from wishlist:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to remove',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchItems]);

  // Check if card is in wishlist
  const isInWishlist = useCallback((cardId: string): boolean => {
    return items.some(i => i.card_id === cardId);
  }, [items]);

  // Get wishlist item by card ID
  const getWishlistItem = useCallback((cardId: string): WishlistItem | undefined => {
    return items.find(i => i.card_id === cardId);
  }, [items]);

  // Move item to inventory (add to inventory and remove from wishlist)
  const moveToInventory = useCallback(async (
    wishlistId: string,
    inventoryData: {
      name: string;
      set_name: string;
      purchase_price: number;
      quantity?: number;
      card_image_url?: string | null;
      condition?: string;
      grading_company?: string;
      grade?: string | null;
      notes?: string | null;
    }
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not authenticated',
          description: 'Please sign in.',
        });
        return false;
      }

      // Add to inventory
      const { error: inventoryError } = await supabase
        .from('inventory_items')
        .insert({
          user_id: user.id,
          name: inventoryData.name,
          set_name: inventoryData.set_name,
          purchase_price: inventoryData.purchase_price,
          quantity: inventoryData.quantity || 1,
          card_image_url: inventoryData.card_image_url,
          condition: inventoryData.condition || 'near-mint',
          grading_company: inventoryData.grading_company || 'raw',
          grade: inventoryData.grade,
          notes: inventoryData.notes,
        });

      if (inventoryError) throw inventoryError;

      // Remove from wishlist
      const { error: deleteError } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Added to Collection',
        description: `${inventoryData.name} has been moved to your collection!`,
      });

      await fetchItems();
      return true;
    } catch (err: any) {
      console.error('Error moving to inventory:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to add to collection',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchItems]);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    isInWishlist,
    getWishlistItem,
    moveToInventory,
    refetch: fetchItems,
    count: items.length,
    limit: WISHLIST_LIMIT,
    isFull: items.length >= WISHLIST_LIMIT,
  };
};

export default useWishlistDb;
