import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getSets, getSetCards as fetchPokemonSetCards } from '@/lib/pokemonTcgApi';

export interface SetProgress {
  id: string;
  user_id: string;
  set_id: string;
  set_name: string;
  tcg_type: string;
  set_logo_url: string | null;
  set_symbol_url: string | null;
  release_date: string | null;
  total_cards: number;
  owned_cards: number;
  completion_percentage: number;
  owned_card_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Extended fields for goals and master set tracking
  goal_percentage?: number;
  track_master_set?: boolean;
  master_total?: number;
  master_owned?: number;
}

export interface SetCard {
  id: string;
  name: string;
  number: string;
  image_url: string;
  rarity?: string;
  owned: boolean;
  // Extended fields for pricing and variants
  price?: number;
  variant_type?: 'normal' | 'reverse_holo' | 'holo' | 'secret_rare' | 'promo' | 'special';
  subtypes?: string[];
  supertype?: string;
}

export interface SetInfo {
  id: string;
  name: string;
  series?: string;
  total_cards: number;
  printed_total?: number;
  release_date?: string;
  logo_url?: string;
  symbol_url?: string;
  tcg_type: string;
}

export type SortOption = 'completion' | 'name' | 'release_date' | 'recently_added';
export type CardVariantFilter = 'all' | 'normal' | 'reverse_holo' | 'holo' | 'secret_rare' | 'promo';

export const useSetCompletion = () => {
  const [trackedSets, setTrackedSets] = useState<SetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch tracked sets
  const fetchTrackedSets = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTrackedSets([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('set_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('completion_percentage', { ascending: false });

      if (fetchError) throw fetchError;
      setTrackedSets((data as SetProgress[]) || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching set progress:', err);
      setError(err.message);
      setTrackedSets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrackedSets();
  }, [fetchTrackedSets]);

  // Sort tracked sets
  const sortTrackedSets = useCallback((sets: SetProgress[], sortBy: SortOption): SetProgress[] => {
    const sorted = [...sets];
    switch (sortBy) {
      case 'completion':
        return sorted.sort((a, b) => b.completion_percentage - a.completion_percentage);
      case 'name':
        return sorted.sort((a, b) => a.set_name.localeCompare(b.set_name));
      case 'release_date':
        return sorted.sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA; // Newest first
        });
      case 'recently_added':
        return sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      default:
        return sorted;
    }
  }, []);

  // Start tracking a new set
  const startTrackingSet = useCallback(async (setInfo: SetInfo, options?: { trackMasterSet?: boolean; goalPercentage?: number }): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not authenticated',
          description: 'Please sign in to track sets.',
        });
        return false;
      }

      // Check if already tracking
      const existing = trackedSets.find(s => s.set_id === setInfo.id);
      if (existing) {
        toast({
          variant: 'destructive',
          title: 'Already tracking',
          description: `You're already tracking ${setInfo.name}.`,
        });
        return false;
      }

      const { error: insertError } = await supabase
        .from('set_progress')
        .insert({
          user_id: user.id,
          set_id: setInfo.id,
          set_name: setInfo.name,
          tcg_type: setInfo.tcg_type,
          set_logo_url: setInfo.logo_url || null,
          set_symbol_url: setInfo.symbol_url || null,
          release_date: setInfo.release_date || null,
          total_cards: setInfo.printed_total || setInfo.total_cards,
          owned_cards: 0,
          owned_card_ids: [],
          goal_percentage: options?.goalPercentage || 100,
          track_master_set: options?.trackMasterSet || false,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Set Tracking Started',
        description: `Now tracking ${setInfo.name}!`,
      });

      await fetchTrackedSets();
      return true;
    } catch (err: any) {
      console.error('Error starting set tracking:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to start tracking',
        description: err.message,
      });
      return false;
    }
  }, [trackedSets, toast, fetchTrackedSets]);

  // Stop tracking a set
  const stopTrackingSet = useCallback(async (setId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('set_progress')
        .delete()
        .eq('set_id', setId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Stopped tracking',
        description: 'Set removed from your collection tracker.',
      });

      await fetchTrackedSets();
      return true;
    } catch (err: any) {
      console.error('Error stopping set tracking:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to stop tracking',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchTrackedSets]);

  // Update set goal
  const updateSetGoal = useCallback(async (setId: string, goalPercentage: number): Promise<boolean> => {
    try {
      const setProgress = trackedSets.find(s => s.set_id === setId);
      if (!setProgress) return false;

      const { error: updateError } = await supabase
        .from('set_progress')
        .update({ goal_percentage: goalPercentage })
        .eq('id', setProgress.id);

      if (updateError) throw updateError;
      await fetchTrackedSets();
      return true;
    } catch (err: any) {
      console.error('Error updating goal:', err);
      return false;
    }
  }, [trackedSets, fetchTrackedSets]);

  // Toggle master set tracking
  const toggleMasterSetTracking = useCallback(async (setId: string, enabled: boolean): Promise<boolean> => {
    try {
      const setProgress = trackedSets.find(s => s.set_id === setId);
      if (!setProgress) return false;

      const { error: updateError } = await supabase
        .from('set_progress')
        .update({ track_master_set: enabled })
        .eq('id', setProgress.id);

      if (updateError) throw updateError;
      await fetchTrackedSets();
      return true;
    } catch (err: any) {
      console.error('Error toggling master set:', err);
      return false;
    }
  }, [trackedSets, fetchTrackedSets]);

  // Toggle card ownership
  const toggleCardOwned = useCallback(async (setId: string, cardId: string, owned: boolean): Promise<boolean> => {
    try {
      const setProgress = trackedSets.find(s => s.set_id === setId);
      if (!setProgress) {
        toast({
          variant: 'destructive',
          title: 'Set not found',
          description: 'This set is not being tracked.',
        });
        return false;
      }

      let newOwnedIds: string[];
      let newOwnedCount: number;

      if (owned) {
        // Add card
        if (setProgress.owned_card_ids.includes(cardId)) {
          return true; // Already owned
        }
        newOwnedIds = [...setProgress.owned_card_ids, cardId];
        newOwnedCount = setProgress.owned_cards + 1;
      } else {
        // Remove card
        newOwnedIds = setProgress.owned_card_ids.filter(id => id !== cardId);
        newOwnedCount = Math.max(0, setProgress.owned_cards - 1);
      }

      const { error: updateError } = await supabase
        .from('set_progress')
        .update({
          owned_card_ids: newOwnedIds,
          owned_cards: newOwnedCount,
        })
        .eq('id', setProgress.id);

      if (updateError) throw updateError;

      await fetchTrackedSets();
      return true;
    } catch (err: any) {
      console.error('Error toggling card ownership:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to update',
        description: err.message,
      });
      return false;
    }
  }, [trackedSets, toast, fetchTrackedSets]);

  // Bulk update owned cards
  const bulkUpdateOwnedCards = useCallback(async (setId: string, cardIds: string[]): Promise<boolean> => {
    try {
      const setProgress = trackedSets.find(s => s.set_id === setId);
      if (!setProgress) return false;

      const { error: updateError } = await supabase
        .from('set_progress')
        .update({
          owned_card_ids: cardIds,
          owned_cards: cardIds.length,
        })
        .eq('id', setProgress.id);

      if (updateError) throw updateError;

      await fetchTrackedSets();
      return true;
    } catch (err: any) {
      console.error('Error bulk updating cards:', err);
      return false;
    }
  }, [trackedSets, fetchTrackedSets]);

  // Check if tracking a set
  const isTrackingSet = useCallback((setId: string): boolean => {
    return trackedSets.some(s => s.set_id === setId);
  }, [trackedSets]);

  // Get set progress
  const getSetProgress = useCallback((setId: string): SetProgress | undefined => {
    return trackedSets.find(s => s.set_id === setId);
  }, [trackedSets]);

  // Check if card is owned in a set
  const isCardOwned = useCallback((setId: string, cardId: string): boolean => {
    const setProgress = trackedSets.find(s => s.set_id === setId);
    return setProgress?.owned_card_ids.includes(cardId) ?? false;
  }, [trackedSets]);

  // Determine variant type from Pokemon TCG card data
  const determineVariantType = (card: any): SetCard['variant_type'] => {
    const rarity = (card.rarity || '').toLowerCase();
    const subtypes = card.subtypes || [];
    const number = card.number || '';
    const supertype = card.supertype || '';
    
    // Check for secret rare (card number > printed total)
    if (number.includes('/')) {
      const [num, total] = number.split('/').map(n => parseInt(n));
      if (num > total) return 'secret_rare';
    }
    
    // Check for promo
    if (rarity.includes('promo') || card.set?.id?.includes('promo')) return 'promo';
    
    // Check for special variants
    if (rarity.includes('illustration rare') || rarity.includes('special art')) return 'special';
    if (rarity.includes('secret') || rarity.includes('hyper')) return 'secret_rare';
    if (rarity.includes('holo') && !subtypes.includes('Basic')) return 'holo';
    
    // Check subtypes for reverse holo indicators
    if (subtypes.some((s: string) => s.toLowerCase().includes('reverse'))) return 'reverse_holo';
    
    return 'normal';
  };

  // Fetch sets from TCG APIs
  const fetchPokemonSets = useCallback(async (): Promise<SetInfo[]> => {
    try {
      const result = await getSets();
      
      return result.sets.map((set) => ({
        id: set.id,
        name: set.name,
        series: set.series,
        total_cards: set.total,
        printed_total: set.printedTotal,
        release_date: set.releaseDate,
        logo_url: set.images?.logo,
        symbol_url: set.images?.symbol,
        tcg_type: 'pokemon',
      }));
    } catch (err) {
      console.error('Error fetching Pokemon sets:', err);
      return [];
    }
  }, []);

  const fetchMtgSets = useCallback(async (): Promise<SetInfo[]> => {
    try {
      const response = await fetch('https://api.scryfall.com/sets');
      const data = await response.json();
      
      return data.data
        .filter((set: any) => set.set_type !== 'token' && set.card_count > 0)
        .slice(0, 100) // Limit to recent sets
        .map((set: any) => ({
          id: set.code,
          name: set.name,
          series: set.set_type,
          total_cards: set.card_count,
          printed_total: set.card_count,
          release_date: set.released_at,
          logo_url: set.icon_svg_uri,
          symbol_url: set.icon_svg_uri,
          tcg_type: 'mtg',
        }));
    } catch (err) {
      console.error('Error fetching MTG sets:', err);
      return [];
    }
  }, []);

  const fetchYugiohSets = useCallback(async (): Promise<SetInfo[]> => {
    try {
      // Yu-Gi-Oh API (YGOProDeck)
      const response = await fetch('https://db.ygoprodeck.com/api/v7/cardsets.php');
      const data = await response.json();
      
      return data
        .filter((set: any) => set.num_of_cards > 0)
        .slice(0, 100)
        .map((set: any) => ({
          id: set.set_code || set.set_name.toLowerCase().replace(/\s+/g, '-'),
          name: set.set_name,
          total_cards: set.num_of_cards,
          printed_total: set.num_of_cards,
          release_date: set.tcg_date,
          tcg_type: 'yugioh',
        }));
    } catch (err) {
      console.error('Error fetching Yu-Gi-Oh sets:', err);
      return [];
    }
  }, []);

  // Fetch cards for a specific set with pricing
  const fetchSetCards = useCallback(async (setId: string, tcgType: string, includePrices = true): Promise<SetCard[]> => {
    try {
      // Check cache first
      const { data: cached } = await supabase
        .from('set_cards_cache')
        .select('cards')
        .eq('set_id', setId)
        .single();

      if (cached?.cards) {
        const setProgress = trackedSets.find(s => s.set_id === setId);
        const ownedIds = setProgress?.owned_card_ids || [];
        
        return (cached.cards as any[]).map((card: any) => ({
          ...card,
          owned: ownedIds.includes(card.id),
        }));
      }

      // Fetch from API
      let cards: SetCard[] = [];

      if (tcgType === 'pokemon') {
        const result = await fetchPokemonSetCards(setId);
        
        cards = result.cards.map((card) => ({
          id: card.id,
          name: card.name,
          number: card.number || '',
          image_url: card.image_url || card.image_url_large || '',
          rarity: card.rarity,
          owned: false,
          price: card.estimated_value || null,
          variant_type: determineVariantType({
            rarity: card.rarity,
            subtypes: card.subtypes,
            number: card.number,
            supertype: card.supertype,
            set: { id: card.set_id },
          }),
          subtypes: card.subtypes,
          supertype: card.supertype,
        }));
      } else if (tcgType === 'mtg') {
        const response = await fetch(`https://api.scryfall.com/cards/search?q=set:${setId}&order=set`);
        const data = await response.json();
        
        cards = (data.data || []).map((card: any) => ({
          id: card.id,
          name: card.name,
          number: card.collector_number,
          image_url: card.image_uris?.small || card.image_uris?.normal,
          rarity: card.rarity,
          owned: false,
          price: card.prices?.usd ? parseFloat(card.prices.usd) : null,
          variant_type: card.promo ? 'promo' : 
                       card.full_art ? 'special' : 
                       card.foil ? 'holo' : 'normal',
        }));
      }

      // Cache the cards
      if (cards.length > 0) {
        const setProgress = trackedSets.find(s => s.set_id === setId);
        await supabase
          .from('set_cards_cache')
          .upsert({
            set_id: setId,
            tcg_type: tcgType,
            set_name: setProgress?.set_name || setId,
            total_cards: cards.length,
            cards: cards.map(c => ({ 
              id: c.id, 
              name: c.name, 
              number: c.number, 
              image_url: c.image_url, 
              rarity: c.rarity,
              price: c.price,
              variant_type: c.variant_type,
            })),
          });

        // Mark owned cards
        const ownedIds = setProgress?.owned_card_ids || [];
        cards = cards.map(card => ({
          ...card,
          owned: ownedIds.includes(card.id),
        }));
      }

      return cards;
    } catch (err) {
      console.error('Error fetching set cards:', err);
      return [];
    }
  }, [trackedSets]);

  // Calculate completion stats (missing value, etc.)
  const calculateCompletionStats = useCallback((cards: SetCard[], ownedCardIds: string[]) => {
    const totalCards = cards.length;
    const ownedCards = cards.filter(c => ownedCardIds.includes(c.id));
    const missingCards = cards.filter(c => !ownedCardIds.includes(c.id));
    
    const missingValue = missingCards.reduce((sum, c) => sum + (c.price || 0), 0);
    const ownedValue = ownedCards.reduce((sum, c) => sum + (c.price || 0), 0);
    const totalValue = cards.reduce((sum, c) => sum + (c.price || 0), 0);
    
    // Variant breakdowns
    const variantStats = {
      normal: { total: 0, owned: 0, missing: 0, missingValue: 0 },
      reverse_holo: { total: 0, owned: 0, missing: 0, missingValue: 0 },
      holo: { total: 0, owned: 0, missing: 0, missingValue: 0 },
      secret_rare: { total: 0, owned: 0, missing: 0, missingValue: 0 },
      promo: { total: 0, owned: 0, missing: 0, missingValue: 0 },
      special: { total: 0, owned: 0, missing: 0, missingValue: 0 },
    };
    
    cards.forEach(card => {
      const variant = card.variant_type || 'normal';
      if (variantStats[variant]) {
        variantStats[variant].total++;
        if (ownedCardIds.includes(card.id)) {
          variantStats[variant].owned++;
        } else {
          variantStats[variant].missing++;
          variantStats[variant].missingValue += card.price || 0;
        }
      }
    });
    
    return {
      totalCards,
      ownedCount: ownedCards.length,
      missingCount: missingCards.length,
      completionPercentage: totalCards > 0 ? (ownedCards.length / totalCards) * 100 : 0,
      missingValue,
      ownedValue,
      totalValue,
      estimatedCompletionCost: missingValue,
      variantStats,
      cardsWithPrices: cards.filter(c => c.price !== null && c.price !== undefined).length,
    };
  }, []);

  return {
    trackedSets,
    loading,
    error,
    startTrackingSet,
    stopTrackingSet,
    toggleCardOwned,
    bulkUpdateOwnedCards,
    isTrackingSet,
    getSetProgress,
    isCardOwned,
    fetchPokemonSets,
    fetchMtgSets,
    fetchYugiohSets,
    fetchSetCards,
    sortTrackedSets,
    updateSetGoal,
    toggleMasterSetTracking,
    calculateCompletionStats,
    refetch: fetchTrackedSets,
  };
};

export default useSetCompletion;
