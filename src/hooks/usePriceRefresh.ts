/**
 * Price Refresh Hook
 * 
 * Provides batch price updates for inventory items using:
 * - JustTCG API for TCG cards
 * - Pokemon TCG API fallback
 * - Progress tracking
 * - Rate limiting
 */

import { useState, useCallback, useRef } from 'react';
import { justTcgApi, type JustTcgGame } from '@/lib/justTcgApi';
import { getCardPrice } from '@/lib/pokemonTcgApi';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export interface InventoryItem {
  id: string;
  name: string;
  set_name: string;
  card_number?: string;
  category?: string;
  current_value?: number;
  tcgplayer_id?: string;
}

export interface PriceUpdate {
  itemId: string;
  oldPrice: number | null;
  newPrice: number | null;
  change: number;
  changePercent: number;
  source: 'justtcg' | 'pokemontcg' | 'failed';
}

export interface RefreshProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  currentItem?: string;
}

export interface UsePriceRefreshReturn {
  refreshPrices: (items: InventoryItem[]) => Promise<PriceUpdate[]>;
  refreshSinglePrice: (item: InventoryItem) => Promise<PriceUpdate | null>;
  progress: RefreshProgress | null;
  loading: boolean;
  cancel: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function usePriceRefresh(): UsePriceRefreshReturn {
  const [progress, setProgress] = useState<RefreshProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);
  const { toast } = useToast();

  // Category to JustTCG game mapping
  const categoryToGame = (category?: string): JustTcgGame | null => {
    if (!category) return 'pokemon'; // Default to Pokemon
    const lower = category.toLowerCase();
    if (lower.includes('pokemon') || lower.includes('pokémon')) return 'pokemon';
    if (lower.includes('magic') || lower.includes('mtg')) return 'mtg';
    if (lower.includes('yugioh') || lower.includes('yu-gi-oh')) return 'yugioh';
    if (lower.includes('lorcana')) return 'lorcana';
    if (lower.includes('one piece') || lower.includes('onepiece')) return 'onepiece';
    if (lower.includes('digimon')) return 'digimon';
    return 'pokemon'; // Default
  };

  // Refresh a single item's price
  const refreshSinglePrice = useCallback(async (
    item: InventoryItem
  ): Promise<PriceUpdate | null> => {
    const oldPrice = item.current_value ?? null;
    let newPrice: number | null = null;
    let source: 'justtcg' | 'pokemontcg' | 'failed' = 'failed';

    try {
      // Try JustTCG first if we have a TCGplayer ID
      if (item.tcgplayer_id) {
        const justTcgPrice = await justTcgApi.getCardPrice(item.tcgplayer_id);
        if (justTcgPrice?.market) {
          newPrice = justTcgPrice.market;
          source = 'justtcg';
        }
      }

      // If no price yet, try searching JustTCG
      if (!newPrice) {
        const game = categoryToGame(item.category);
        if (game) {
          const searchResult = await justTcgApi.searchCards(item.name, {
            game,
            pageSize: 5,
          });

          // Find best match
          for (const card of searchResult.cards) {
            if (
              card.name.toLowerCase().includes(item.name.toLowerCase()) ||
              item.name.toLowerCase().includes(card.name.toLowerCase())
            ) {
              if (card.estimated_value) {
                newPrice = card.estimated_value;
                source = 'justtcg';
                break;
              }
            }
          }
        }
      }

      // Fallback to Pokemon TCG API for Pokemon cards
      if (!newPrice && (!item.category || item.category.toLowerCase().includes('pokemon'))) {
        // Search by name and set
        const searchQuery = `${item.name} ${item.set_name || ''}`.trim();
        const { searchCards } = await import('@/lib/pokemonTcgApi');
        const result = await searchCards(searchQuery, { pageSize: 5 });

        for (const card of result.cards) {
          if (card.prices?.market) {
            newPrice = card.prices.market;
            source = 'pokemontcg';
            break;
          }
        }
      }

      // Calculate change
      const change = (newPrice ?? 0) - (oldPrice ?? 0);
      const changePercent = oldPrice && oldPrice > 0 
        ? ((change / oldPrice) * 100) 
        : 0;

      return {
        itemId: item.id,
        oldPrice,
        newPrice,
        change,
        changePercent,
        source,
      };
    } catch (error) {
      console.error(`Failed to refresh price for ${item.name}:`, error);
      return {
        itemId: item.id,
        oldPrice,
        newPrice: null,
        change: 0,
        changePercent: 0,
        source: 'failed',
      };
    }
  }, []);

  // Batch refresh prices
  const refreshPrices = useCallback(async (
    items: InventoryItem[]
  ): Promise<PriceUpdate[]> => {
    if (items.length === 0) return [];

    cancelledRef.current = false;
    setLoading(true);
    setProgress({
      total: items.length,
      completed: 0,
      successful: 0,
      failed: 0,
    });

    const updates: PriceUpdate[] = [];
    const batchSize = 5; // Process 5 at a time to respect rate limits

    try {
      for (let i = 0; i < items.length; i += batchSize) {
        if (cancelledRef.current) {
          toast({
            title: 'Price refresh cancelled',
            description: `Completed ${updates.length} of ${items.length} items`,
          });
          break;
        }

        const batch = items.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(item => refreshSinglePrice(item))
        );

        for (const result of batchResults) {
          if (result) {
            updates.push(result);
            
            // Update progress
            setProgress(prev => prev ? {
              ...prev,
              completed: prev.completed + 1,
              successful: prev.successful + (result.source !== 'failed' ? 1 : 0),
              failed: prev.failed + (result.source === 'failed' ? 1 : 0),
              currentItem: result.itemId,
            } : null);

            // Update database if we got a new price
            if (result.newPrice !== null && result.newPrice !== result.oldPrice) {
              await supabase
                .from('inventory_items')
                .update({ current_value: result.newPrice })
                .eq('id', result.itemId);
            }
          }
        }

        // Small delay between batches to respect rate limits
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Summary toast
      const successful = updates.filter(u => u.source !== 'failed').length;
      const priceChanges = updates.filter(u => u.change !== 0 && u.newPrice !== null);
      const totalChange = priceChanges.reduce((sum, u) => sum + u.change, 0);

      toast({
        title: 'Price refresh complete',
        description: `Updated ${successful}/${items.length} cards. Portfolio ${totalChange >= 0 ? '+' : ''}$${totalChange.toFixed(2)}`,
      });

    } catch (error) {
      console.error('Batch price refresh error:', error);
      toast({
        title: 'Price refresh failed',
        description: 'An error occurred while updating prices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }

    return updates;
  }, [refreshSinglePrice, toast]);

  // Cancel ongoing refresh
  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  return {
    refreshPrices,
    refreshSinglePrice,
    progress,
    loading,
    cancel,
  };
}

export default usePriceRefresh;
