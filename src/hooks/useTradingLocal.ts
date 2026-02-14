import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

// Trade Partner
export interface TradePartner {
  id: string;
  name: string;
  contact?: string;
  notes?: string;
  createdAt: string;
  lastTradeDate?: string;
  totalTrades: number;
}

// Card in a trade (either from inventory or custom entry)
export interface TradeCard {
  id: string;
  name: string;
  set_name?: string;
  card_image_url?: string;
  value: number;
  quantity: number;
  inventoryItemId?: string; // If from inventory
  condition?: string;
  grade?: string;
}

// Trade status
export type TradeStatus = 'proposed' | 'countered' | 'accepted' | 'declined' | 'completed';

// Trade Proposal
export interface TradeProposal {
  id: string;
  partnerId?: string;
  partnerName?: string;
  yourCards: TradeCard[];
  theirCards: TradeCard[];
  yourCash: number;
  theirCash: number;
  status: TradeStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Trade History Entry
export interface TradeHistoryEntry {
  id: string;
  partnerId?: string;
  partnerName: string;
  youGave: TradeCard[];
  youGot: TradeCard[];
  cashYouGave: number;
  cashYouGot: number;
  totalYourValue: number;
  totalTheirValue: number;
  netGain: number;
  date: string;
  notes?: string;
}

// Storage keys
const PARTNERS_KEY = 'cardledger_trade_partners';
const PROPOSALS_KEY = 'cardledger_trade_proposals';
const HISTORY_KEY = 'cardledger_trade_history';

// Generate UUID
const generateId = () => crypto.randomUUID();

export const useTradingLocal = () => {
  const [partners, setPartners] = useState<TradePartner[]>([]);
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [history, setHistory] = useState<TradeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load from localStorage
  useEffect(() => {
    try {
      const storedPartners = localStorage.getItem(PARTNERS_KEY);
      const storedProposals = localStorage.getItem(PROPOSALS_KEY);
      const storedHistory = localStorage.getItem(HISTORY_KEY);

      if (storedPartners) setPartners(JSON.parse(storedPartners));
      if (storedProposals) setProposals(JSON.parse(storedProposals));
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch (error) {
      console.error('Error loading trading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save partners
  const savePartners = useCallback((newPartners: TradePartner[]) => {
    setPartners(newPartners);
    localStorage.setItem(PARTNERS_KEY, JSON.stringify(newPartners));
  }, []);

  // Save proposals
  const saveProposals = useCallback((newProposals: TradeProposal[]) => {
    setProposals(newProposals);
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(newProposals));
  }, []);

  // Save history
  const saveHistory = useCallback((newHistory: TradeHistoryEntry[]) => {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }, []);

  // ========== PARTNER OPERATIONS ==========

  const addPartner = useCallback((name: string, contact?: string, notes?: string): TradePartner => {
    const newPartner: TradePartner = {
      id: generateId(),
      name,
      contact,
      notes,
      createdAt: new Date().toISOString(),
      totalTrades: 0,
    };
    savePartners([...partners, newPartner]);
    toast({ title: 'Partner added', description: `${name} added to your trade partners.` });
    return newPartner;
  }, [partners, savePartners, toast]);

  const updatePartner = useCallback((id: string, updates: Partial<TradePartner>) => {
    const updated = partners.map(p => p.id === id ? { ...p, ...updates } : p);
    savePartners(updated);
    toast({ title: 'Partner updated' });
  }, [partners, savePartners, toast]);

  const deletePartner = useCallback((id: string) => {
    savePartners(partners.filter(p => p.id !== id));
    toast({ title: 'Partner removed' });
  }, [partners, savePartners, toast]);

  const getPartner = useCallback((id: string) => {
    return partners.find(p => p.id === id);
  }, [partners]);

  const getPartnerTradeHistory = useCallback((partnerId: string) => {
    return history.filter(h => h.partnerId === partnerId);
  }, [history]);

  // ========== PROPOSAL OPERATIONS ==========

  const createProposal = useCallback((
    yourCards: TradeCard[],
    theirCards: TradeCard[],
    yourCash: number = 0,
    theirCash: number = 0,
    partnerId?: string,
    partnerName?: string,
    notes?: string
  ): TradeProposal => {
    const now = new Date().toISOString();
    const newProposal: TradeProposal = {
      id: generateId(),
      partnerId,
      partnerName: partnerName || getPartner(partnerId || '')?.name,
      yourCards,
      theirCards,
      yourCash,
      theirCash,
      status: 'proposed',
      notes,
      createdAt: now,
      updatedAt: now,
    };
    saveProposals([newProposal, ...proposals]);
    toast({ title: 'Trade proposal created' });
    return newProposal;
  }, [proposals, saveProposals, getPartner, toast]);

  const updateProposal = useCallback((id: string, updates: Partial<TradeProposal>) => {
    const updated = proposals.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    saveProposals(updated);
    toast({ title: 'Proposal updated' });
  }, [proposals, saveProposals, toast]);

  const updateProposalStatus = useCallback((id: string, status: TradeStatus) => {
    const now = new Date().toISOString();
    const updated = proposals.map(p => 
      p.id === id ? { 
        ...p, 
        status, 
        updatedAt: now,
        completedAt: status === 'completed' ? now : p.completedAt 
      } : p
    );
    saveProposals(updated);
    
    const statusMessages: Record<TradeStatus, string> = {
      proposed: 'Marked as proposed',
      countered: 'Marked as countered',
      accepted: 'Trade accepted',
      declined: 'Trade declined',
      completed: 'Trade completed',
    };
    toast({ title: statusMessages[status] });
  }, [proposals, saveProposals, toast]);

  const deleteProposal = useCallback((id: string) => {
    saveProposals(proposals.filter(p => p.id !== id));
    toast({ title: 'Proposal deleted' });
  }, [proposals, saveProposals, toast]);

  const completeProposal = useCallback((id: string) => {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return;

    // Calculate values
    const totalYourValue = proposal.yourCards.reduce((sum, c) => sum + c.value * c.quantity, 0) + proposal.yourCash;
    const totalTheirValue = proposal.theirCards.reduce((sum, c) => sum + c.value * c.quantity, 0) + proposal.theirCash;
    const netGain = totalTheirValue - totalYourValue;

    // Create history entry
    const historyEntry: TradeHistoryEntry = {
      id: generateId(),
      partnerId: proposal.partnerId,
      partnerName: proposal.partnerName || 'Unknown',
      youGave: proposal.yourCards,
      youGot: proposal.theirCards,
      cashYouGave: proposal.yourCash,
      cashYouGot: proposal.theirCash,
      totalYourValue,
      totalTheirValue,
      netGain,
      date: new Date().toISOString(),
      notes: proposal.notes,
    };
    saveHistory([historyEntry, ...history]);

    // Update partner stats
    if (proposal.partnerId) {
      const partner = getPartner(proposal.partnerId);
      if (partner) {
        updatePartner(proposal.partnerId, {
          totalTrades: partner.totalTrades + 1,
          lastTradeDate: new Date().toISOString(),
        });
      }
    }

    // Update proposal status
    updateProposalStatus(id, 'completed');

    toast({ 
      title: 'Trade completed!', 
      description: netGain >= 0 
        ? `You gained $${netGain.toFixed(2)} in value!` 
        : `You lost $${Math.abs(netGain).toFixed(2)} in value.`
    });
  }, [proposals, history, saveHistory, getPartner, updatePartner, updateProposalStatus, toast]);

  // ========== HISTORY OPERATIONS ==========

  const addHistoryEntry = useCallback((entry: Omit<TradeHistoryEntry, 'id'>) => {
    const newEntry: TradeHistoryEntry = {
      ...entry,
      id: generateId(),
    };
    saveHistory([newEntry, ...history]);
    toast({ title: 'Trade logged' });
    return newEntry;
  }, [history, saveHistory, toast]);

  const deleteHistoryEntry = useCallback((id: string) => {
    saveHistory(history.filter(h => h.id !== id));
    toast({ title: 'History entry deleted' });
  }, [history, saveHistory, toast]);

  // ========== COMPUTED VALUES ==========

  const pendingProposals = proposals.filter(p => 
    p.status === 'proposed' || p.status === 'countered'
  );

  const activeProposals = proposals.filter(p => 
    p.status !== 'completed' && p.status !== 'declined'
  );

  const completedProposals = proposals.filter(p => p.status === 'completed');
  const declinedProposals = proposals.filter(p => p.status === 'declined');

  // Stats
  const totalTradesCompleted = history.length;
  const totalNetGain = history.reduce((sum, h) => sum + h.netGain, 0);
  const averageTradeValue = history.length > 0 
    ? history.reduce((sum, h) => sum + h.totalYourValue, 0) / history.length 
    : 0;

  // ========== HELPER: Convert inventory item to trade card ==========

  const inventoryToTradeCard = useCallback((item: InventoryItem): TradeCard => ({
    id: generateId(),
    name: item.name,
    set_name: item.set_name || undefined,
    card_image_url: item.card_image_url || undefined,
    value: item.market_price || item.purchase_price || 0,
    quantity: 1,
    inventoryItemId: item.id,
    condition: item.condition || undefined,
    grade: item.grade || undefined,
  }), []);

  return {
    // Data
    partners,
    proposals,
    history,
    loading,

    // Partner operations
    addPartner,
    updatePartner,
    deletePartner,
    getPartner,
    getPartnerTradeHistory,

    // Proposal operations
    createProposal,
    updateProposal,
    updateProposalStatus,
    deleteProposal,
    completeProposal,

    // History operations
    addHistoryEntry,
    deleteHistoryEntry,

    // Computed
    pendingProposals,
    activeProposals,
    completedProposals,
    declinedProposals,

    // Stats
    totalTradesCompleted,
    totalNetGain,
    averageTradeValue,

    // Helpers
    inventoryToTradeCard,
  };
};
