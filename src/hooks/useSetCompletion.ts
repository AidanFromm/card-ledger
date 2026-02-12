import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export interface SetCard {
  id: string;
  name: string;
  number: string;
  image_url: string;
  rarity?: string;
  owned: boolean;
}

export interface SetInfo {
  id: string;
  name: string;
  series?: string;
  total_cards: number;
  release_date?: string;
  logo_url?: string;
  symbol_url?: string;
  tcg_type: string;
}

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

  // Start tracking a new set
  const startTrackingSet = useCallback(async (setInfo: SetInfo): Promise<boolean> => {
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
          total_cards: setInfo.total_cards,
          owned_cards: 0,
          owned_card_ids: [],
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

  // Fetch sets from TCG APIs
  const fetchPokemonSets = useCallback(async (): Promise<SetInfo[]> => {
    try {
      const response = await fetch('https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate');
      const data = await response.json();
      
      return data.data.map((set: any) => ({
        id: set.id,
        name: set.name,
        series: set.series,
        total_cards: set.printedTotal || set.total,
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
          release_date: set.tcg_date,
          tcg_type: 'yugioh',
        }));
    } catch (err) {
      console.error('Error fetching Yu-Gi-Oh sets:', err);
      return [];
    }
  }, []);

  // Fetch cards for a specific set
  const fetchSetCards = useCallback(async (setId: string, tcgType: string): Promise<SetCard[]> => {
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
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&orderBy=number`);
        const data = await response.json();
        
        cards = data.data.map((card: any) => ({
          id: card.id,
          name: card.name,
          number: card.number,
          image_url: card.images?.small || card.images?.large,
          rarity: card.rarity,
          owned: false,
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
            cards: cards.map(c => ({ id: c.id, name: c.name, number: c.number, image_url: c.image_url, rarity: c.rarity })),
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
    refetch: fetchTrackedSets,
  };
};

export default useSetCompletion;
