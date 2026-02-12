import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TradeListing = Database['public']['Tables']['trade_listings']['Row'];
type TradeMatch = Database['public']['Tables']['trade_matches']['Row'];
type TradeMessage = Database['public']['Tables']['trade_messages']['Row'];
type TradeOfferItem = Database['public']['Tables']['trade_offer_items']['Row'];

export interface TradeListingWithDetails extends TradeListing {
  inventory_item?: {
    market_price: number | null;
    condition: string;
    grade: string | null;
    grading_company: string;
  } | null;
}

export interface PotentialMatch {
  other_user_id: string;
  match_score: number;
  they_have_ids: string[];
  you_have_ids: string[];
  they_have_listings?: TradeListing[];
  you_have_listings?: TradeListing[];
}

export interface TradeMatchWithDetails extends TradeMatch {
  user_a_listing?: TradeListing | null;
  user_b_listing?: TradeListing | null;
  messages?: TradeMessage[];
  offer_items?: TradeOfferItem[];
  other_user_id?: string;
}

export interface CreateListingParams {
  inventory_item_id?: string | null;
  listing_type: 'have' | 'want';
  card_name: string;
  set_name?: string | null;
  card_image_url?: string | null;
  looking_for?: string | null;
  notes?: string | null;
}

export const useTrading = () => {
  const [myListings, setMyListings] = useState<TradeListingWithDetails[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [myTrades, setMyTrades] = useState<TradeMatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch user's trade listings
  const fetchMyListings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMyListings([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('trade_listings')
        .select(`
          *,
          inventory_item:inventory_items(market_price, condition, grade, grading_company)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMyListings((data as TradeListingWithDetails[]) || []);
    } catch (err: any) {
      console.error('Error fetching trade listings:', err);
      setError(err.message);
    }
  }, []);

  // Fetch potential trade matches
  const fetchPotentialMatches = useCallback(async () => {
    try {
      setMatchesLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPotentialMatches([]);
        return;
      }

      // Call the find_trade_matches function
      const { data: matchData, error: matchError } = await supabase
        .rpc('find_trade_matches', { p_user_id: user.id });

      if (matchError) throw matchError;

      // If we have matches, fetch the listing details
      if (matchData && matchData.length > 0) {
        const allListingIds = matchData.flatMap((m: any) => [...(m.they_have_ids || []), ...(m.you_have_ids || [])]);
        
        const { data: listings } = await supabase
          .from('trade_listings')
          .select('*')
          .in('id', allListingIds);

        const listingsMap = new Map((listings || []).map(l => [l.id, l]));

        const matchesWithDetails: PotentialMatch[] = matchData.map((m: any) => ({
          ...m,
          they_have_listings: (m.they_have_ids || []).map((id: string) => listingsMap.get(id)).filter(Boolean),
          you_have_listings: (m.you_have_ids || []).map((id: string) => listingsMap.get(id)).filter(Boolean),
        }));

        setPotentialMatches(matchesWithDetails);
      } else {
        setPotentialMatches([]);
      }
    } catch (err: any) {
      console.error('Error fetching potential matches:', err);
      // Don't set error for RPC errors - likely just no function yet
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  // Fetch user's active trades
  const fetchMyTrades = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMyTrades([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('trade_matches')
        .select(`
          *,
          user_a_listing:trade_listings!trade_matches_user_a_listing_id_fkey(*),
          user_b_listing:trade_listings!trade_matches_user_b_listing_id_fkey(*)
        `)
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Add the other_user_id for easier access
      const tradesWithOtherUser = (data || []).map((trade: any) => ({
        ...trade,
        other_user_id: trade.user_a_id === user.id ? trade.user_b_id : trade.user_a_id,
      }));

      setMyTrades(tradesWithOtherUser);
    } catch (err: any) {
      console.error('Error fetching trades:', err);
    }
  }, []);

  // Create a trade listing
  const createListing = useCallback(async (params: CreateListingParams): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not authenticated',
          description: 'Please sign in to create trade listings.',
        });
        return false;
      }

      const { error: insertError } = await supabase
        .from('trade_listings')
        .insert({
          user_id: user.id,
          inventory_item_id: params.inventory_item_id || null,
          listing_type: params.listing_type,
          card_name: params.card_name,
          set_name: params.set_name || null,
          card_image_url: params.card_image_url || null,
          looking_for: params.looking_for || null,
          notes: params.notes || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Listed for Trade',
        description: `${params.card_name} has been added to your trade list.`,
      });

      await fetchMyListings();
      return true;
    } catch (err: any) {
      console.error('Error creating trade listing:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to create listing',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchMyListings]);

  // Remove a trade listing
  const removeListing = useCallback(async (listingId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('trade_listings')
        .delete()
        .eq('id', listingId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Listing Removed',
        description: 'The card has been removed from your trade list.',
      });

      await fetchMyListings();
      return true;
    } catch (err: any) {
      console.error('Error removing listing:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to remove listing',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchMyListings]);

  // Toggle listing active status
  const toggleListingActive = useCallback(async (listingId: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('trade_listings')
        .update({ is_active: isActive })
        .eq('id', listingId);

      if (updateError) throw updateError;

      await fetchMyListings();
      return true;
    } catch (err: any) {
      console.error('Error toggling listing:', err);
      return false;
    }
  }, [fetchMyListings]);

  // Propose a trade to another user
  const proposeTrade = useCallback(async (
    otherUserId: string,
    myListingIds: string[],
    theirListingIds: string[]
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not authenticated',
          description: 'Please sign in to propose trades.',
        });
        return null;
      }

      // Create the trade match
      const { data: tradeMatch, error: matchError } = await supabase
        .from('trade_matches')
        .insert({
          user_a_id: user.id,
          user_b_id: otherUserId,
          user_a_listing_id: myListingIds[0] || null,
          user_b_listing_id: theirListingIds[0] || null,
          status: 'proposed',
          proposed_by: user.id,
          proposed_at: new Date().toISOString(),
          match_score: myListingIds.length + theirListingIds.length,
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Add offer items
      const offerItems = [
        ...myListingIds.map(id => ({
          trade_match_id: tradeMatch.id,
          offered_by: user.id,
          listing_id: id,
          card_name: '', // Will be filled from listing
        })),
        ...theirListingIds.map(id => ({
          trade_match_id: tradeMatch.id,
          offered_by: otherUserId,
          listing_id: id,
          card_name: '',
        })),
      ];

      // Get listing details to populate card names
      const listingIds = [...myListingIds, ...theirListingIds];
      const { data: listings } = await supabase
        .from('trade_listings')
        .select('id, card_name, set_name, card_image_url')
        .in('id', listingIds);

      if (listings) {
        const listingsMap = new Map(listings.map(l => [l.id, l]));
        offerItems.forEach(item => {
          const listing = listingsMap.get(item.listing_id!);
          if (listing) {
            item.card_name = listing.card_name;
            (item as any).set_name = listing.set_name;
            (item as any).card_image_url = listing.card_image_url;
          }
        });
      }

      if (offerItems.length > 0) {
        await supabase.from('trade_offer_items').insert(offerItems);
      }

      toast({
        title: 'Trade Proposed',
        description: 'Your trade offer has been sent!',
      });

      await fetchMyTrades();
      return tradeMatch.id;
    } catch (err: any) {
      console.error('Error proposing trade:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to propose trade',
        description: err.message,
      });
      return null;
    }
  }, [toast, fetchMyTrades]);

  // Respond to a trade (accept/decline)
  const respondToTrade = useCallback(async (
    tradeId: string,
    accept: boolean
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('trade_matches')
        .update({
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

      if (updateError) throw updateError;

      toast({
        title: accept ? 'Trade Accepted' : 'Trade Declined',
        description: accept 
          ? 'Great! Now coordinate with the other trader to complete the exchange.'
          : 'The trade offer has been declined.',
      });

      await fetchMyTrades();
      return true;
    } catch (err: any) {
      console.error('Error responding to trade:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to respond to trade',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchMyTrades]);

  // Mark trade as completed
  const completeTrade = useCallback(async (tradeId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('trade_matches')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

      if (updateError) throw updateError;

      toast({
        title: 'Trade Completed',
        description: 'Congratulations on the successful trade! 🎉',
      });

      await fetchMyTrades();
      return true;
    } catch (err: any) {
      console.error('Error completing trade:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to complete trade',
        description: err.message,
      });
      return false;
    }
  }, [toast, fetchMyTrades]);

  // Send a message in a trade
  const sendMessage = useCallback(async (tradeId: string, message: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error: insertError } = await supabase
        .from('trade_messages')
        .insert({
          trade_match_id: tradeId,
          sender_id: user.id,
          message,
        });

      if (insertError) throw insertError;
      return true;
    } catch (err: any) {
      console.error('Error sending message:', err);
      return false;
    }
  }, []);

  // Fetch messages for a trade
  const fetchMessages = useCallback(async (tradeId: string): Promise<TradeMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('trade_messages')
        .select('*')
        .eq('trade_match_id', tradeId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      return [];
    }
  }, []);

  // Check if an inventory item is listed for trade
  const isListedForTrade = useCallback((inventoryItemId: string): boolean => {
    return myListings.some(l => l.inventory_item_id === inventoryItemId && l.is_active);
  }, [myListings]);

  // Get listing for inventory item
  const getListingForItem = useCallback((inventoryItemId: string): TradeListing | undefined => {
    return myListings.find(l => l.inventory_item_id === inventoryItemId);
  }, [myListings]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchMyListings(),
        fetchMyTrades(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchMyListings, fetchMyTrades]);

  // Computed stats
  const activeListingsCount = myListings.filter(l => l.is_active && l.listing_type === 'have').length;
  const pendingTradesCount = myTrades.filter(t => t.status === 'proposed' || t.status === 'pending').length;
  const completedTradesCount = myTrades.filter(t => t.status === 'completed').length;

  return {
    // Data
    myListings,
    potentialMatches,
    myTrades,
    
    // Loading states
    loading,
    matchesLoading,
    error,
    
    // Stats
    activeListingsCount,
    pendingTradesCount,
    completedTradesCount,
    
    // Actions
    createListing,
    removeListing,
    toggleListingActive,
    proposeTrade,
    respondToTrade,
    completeTrade,
    sendMessage,
    fetchMessages,
    
    // Helpers
    isListedForTrade,
    getListingForItem,
    
    // Refresh functions
    refetchListings: fetchMyListings,
    refetchMatches: fetchPotentialMatches,
    refetchTrades: fetchMyTrades,
    refetchAll: async () => {
      await Promise.all([
        fetchMyListings(),
        fetchPotentialMatches(),
        fetchMyTrades(),
      ]);
    },
  };
};

export default useTrading;
