import { useState, useMemo, useCallback } from "react";
import { 
  ArrowLeftRight, 
  Package, 
  Users, 
  Plus, 
  RefreshCw, 
  Search, 
  Trash2,
  CheckCircle,
  XCircle,
  MessageCircle,
  Calculator,
  Clock,
  History,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  User,
  Phone,
  FileText,
  Edit2,
  GripVertical,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Mail
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import BottomNav from "@/components/BottomNav";
import CardImage from "@/components/CardImage";
import { useTradingLocal, type TradeCard, type TradePartner, type TradeProposal, type TradeHistoryEntry, type TradeStatus } from "@/hooks/useTradingLocal";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type TabType = 'proposals' | 'calculator' | 'partners' | 'history' | 'pending';

const TradingHub = () => {
  const {
    partners,
    proposals,
    history,
    loading,
    pendingProposals,
    activeProposals,
    totalTradesCompleted,
    totalNetGain,
    addPartner,
    updatePartner,
    deletePartner,
    getPartner,
    getPartnerTradeHistory,
    createProposal,
    updateProposal,
    updateProposalStatus,
    deleteProposal,
    completeProposal,
    deleteHistoryEntry,
    inventoryToTradeCard,
  } = useTradingLocal();

  const { items: inventoryItems } = useInventoryDb();
  
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculator state
  const [yourCards, setYourCards] = useState<TradeCard[]>([]);
  const [theirCards, setTheirCards] = useState<TradeCard[]>([]);
  const [yourCash, setYourCash] = useState(0);
  const [theirCash, setTheirCash] = useState(0);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [tradeNotes, setTradeNotes] = useState('');

  // Dialog states
  const [addPartnerOpen, setAddPartnerOpen] = useState(false);
  const [editPartnerOpen, setEditPartnerOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<TradePartner | null>(null);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [addCardSide, setAddCardSide] = useState<'your' | 'their'>('your');
  const [customCardOpen, setCustomCardOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'partner' | 'proposal' | 'history'; id: string } | null>(null);
  const [proposalDetailOpen, setProposalDetailOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<TradeProposal | null>(null);
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<TradeHistoryEntry | null>(null);
  const [partnerDetailOpen, setPartnerDetailOpen] = useState(false);
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<TradePartner | null>(null);

  // Partner form state
  const [partnerName, setPartnerName] = useState('');
  const [partnerContact, setPartnerContact] = useState('');
  const [partnerNotes, setPartnerNotes] = useState('');

  // Custom card form state
  const [customCardName, setCustomCardName] = useState('');
  const [customCardSet, setCustomCardSet] = useState('');
  const [customCardValue, setCustomCardValue] = useState('');
  const [customCardQuantity, setCustomCardQuantity] = useState('1');

  // Calculate totals
  const yourTotal = useMemo(() => {
    const cardValue = yourCards.reduce((sum, card) => sum + (card.value * card.quantity), 0);
    return cardValue + yourCash;
  }, [yourCards, yourCash]);

  const theirTotal = useMemo(() => {
    const cardValue = theirCards.reduce((sum, card) => sum + (card.value * card.quantity), 0);
    return cardValue + theirCash;
  }, [theirCards, theirCash]);

  const valueDifference = theirTotal - yourTotal;
  const isFair = Math.abs(valueDifference) <= Math.max(yourTotal, theirTotal) * 0.1; // Within 10%
  const youGetBetterDeal = valueDifference > 0;

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    const usedIds = new Set([
      ...yourCards.filter(c => c.inventoryItemId).map(c => c.inventoryItemId),
    ]);
    
    let filtered = inventoryItems.filter(item => !usedIds.has(item.id));
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.set_name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [inventoryItems, yourCards, searchQuery]);

  // Handle adding card from inventory
  const handleAddInventoryCard = useCallback((item: typeof inventoryItems[0]) => {
    const tradeCard = inventoryToTradeCard(item);
    if (addCardSide === 'your') {
      setYourCards(prev => [...prev, tradeCard]);
    } else {
      setTheirCards(prev => [...prev, tradeCard]);
    }
    setAddCardOpen(false);
    setSearchQuery('');
  }, [addCardSide, inventoryToTradeCard]);

  // Handle adding custom card
  const handleAddCustomCard = useCallback(() => {
    if (!customCardName || !customCardValue) return;
    
    const tradeCard: TradeCard = {
      id: crypto.randomUUID(),
      name: customCardName,
      set_name: customCardSet || undefined,
      value: parseFloat(customCardValue) || 0,
      quantity: parseInt(customCardQuantity) || 1,
    };

    if (addCardSide === 'your') {
      setYourCards(prev => [...prev, tradeCard]);
    } else {
      setTheirCards(prev => [...prev, tradeCard]);
    }

    setCustomCardOpen(false);
    setCustomCardName('');
    setCustomCardSet('');
    setCustomCardValue('');
    setCustomCardQuantity('1');
  }, [addCardSide, customCardName, customCardSet, customCardValue, customCardQuantity]);

  // Handle removing card
  const handleRemoveCard = useCallback((cardId: string, side: 'your' | 'their') => {
    if (side === 'your') {
      setYourCards(prev => prev.filter(c => c.id !== cardId));
    } else {
      setTheirCards(prev => prev.filter(c => c.id !== cardId));
    }
  }, []);

  // Handle updating card value
  const handleUpdateCardValue = useCallback((cardId: string, newValue: number, side: 'your' | 'their') => {
    if (side === 'your') {
      setYourCards(prev => prev.map(c => c.id === cardId ? { ...c, value: newValue } : c));
    } else {
      setTheirCards(prev => prev.map(c => c.id === cardId ? { ...c, value: newValue } : c));
    }
  }, []);

  // Create proposal from calculator
  const handleCreateProposal = useCallback(() => {
    if (yourCards.length === 0 && theirCards.length === 0) return;

    createProposal(
      yourCards,
      theirCards,
      yourCash,
      theirCash,
      selectedPartner || undefined,
      selectedPartner ? getPartner(selectedPartner)?.name : undefined,
      tradeNotes || undefined
    );

    // Reset calculator
    setYourCards([]);
    setTheirCards([]);
    setYourCash(0);
    setTheirCash(0);
    setTradeNotes('');
    setSelectedPartner('');
    setActiveTab('pending');
  }, [yourCards, theirCards, yourCash, theirCash, selectedPartner, tradeNotes, createProposal, getPartner]);

  // Add partner
  const handleAddPartner = useCallback(() => {
    if (!partnerName.trim()) return;
    addPartner(partnerName, partnerContact || undefined, partnerNotes || undefined);
    setAddPartnerOpen(false);
    setPartnerName('');
    setPartnerContact('');
    setPartnerNotes('');
  }, [partnerName, partnerContact, partnerNotes, addPartner]);

  // Edit partner
  const handleEditPartner = useCallback(() => {
    if (!editingPartner || !partnerName.trim()) return;
    updatePartner(editingPartner.id, {
      name: partnerName,
      contact: partnerContact || undefined,
      notes: partnerNotes || undefined,
    });
    setEditPartnerOpen(false);
    setEditingPartner(null);
    setPartnerName('');
    setPartnerContact('');
    setPartnerNotes('');
  }, [editingPartner, partnerName, partnerContact, partnerNotes, updatePartner]);

  // Open edit partner
  const openEditPartner = useCallback((partner: TradePartner) => {
    setEditingPartner(partner);
    setPartnerName(partner.name);
    setPartnerContact(partner.contact || '');
    setPartnerNotes(partner.notes || '');
    setEditPartnerOpen(true);
  }, []);

  // Delete confirmation
  const handleDelete = useCallback(() => {
    if (!itemToDelete) return;
    
    switch (itemToDelete.type) {
      case 'partner':
        deletePartner(itemToDelete.id);
        break;
      case 'proposal':
        deleteProposal(itemToDelete.id);
        break;
      case 'history':
        deleteHistoryEntry(itemToDelete.id);
        break;
    }
    
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  }, [itemToDelete, deletePartner, deleteProposal, deleteHistoryEntry]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: TradeStatus) => {
    switch (status) {
      case 'proposed': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'countered': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'accepted': return 'bg-navy-500/20 text-navy-400 border-navy-500/30';
      case 'declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <div className="flex">
          <DesktopSidebar />
          <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl flex-1">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 bg-muted/30 rounded" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-10 w-24 bg-muted/20 rounded-full" />
                ))}
              </div>
              <div className="h-96 bg-muted/20 rounded-xl" />
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <div className="flex">
        <DesktopSidebar />
        <PageTransition>
          <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <ArrowLeftRight className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Trading Hub</h1>
                <p className="text-sm text-muted-foreground">
                  {totalTradesCompleted} trades • {formatCurrency(totalNetGain)} net
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <Clock className="h-5 w-5 text-amber-500 mb-2" />
              <div className="text-2xl font-bold">{pendingProposals.length}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <CheckCircle className="h-5 w-5 text-navy-500 mb-2" />
              <div className="text-2xl font-bold">{totalTradesCompleted}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/40">
              {totalNetGain >= 0 ? (
                <TrendingUp className="h-5 w-5 text-navy-500 mb-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 mb-2" />
              )}
              <div className={`text-2xl font-bold ${totalNetGain >= 0 ? 'text-navy-500' : 'text-red-500'}`}>
                {totalNetGain >= 0 ? '+' : ''}{formatCurrency(totalNetGain)}
              </div>
              <div className="text-xs text-muted-foreground">Net Value</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 bg-muted/30 p-1">
              <TabsTrigger value="calculator" className="gap-1 text-xs">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Calculator</span>
              </TabsTrigger>
              <TabsTrigger value="proposals" className="gap-1 text-xs">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1 text-xs relative">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Pending</span>
                {pendingProposals.length > 0 && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                    {pendingProposals.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="partners" className="gap-1 text-xs">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Partners</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-xs">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            {/* Calculator Tab */}
            <TabsContent value="calculator" className="mt-0 space-y-4">
              {/* Partner Selection */}
              <div className="flex gap-2">
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger className="flex-1 bg-muted/30 border-border/40">
                    <SelectValue placeholder="Select trade partner (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No partner</SelectItem>
                    {partners.map(partner => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setAddPartnerOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Two Column Trade Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {/* Your Side */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      You Give
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setAddCardSide('your');
                        setAddCardOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  <div className="min-h-[200px] rounded-xl border-2 border-dashed border-red-500/30 bg-red-500/5 p-2 space-y-2">
                    <AnimatePresence mode="popLayout">
                      {yourCards.map(card => (
                        <TradeCardItem
                          key={card.id}
                          card={card}
                          onRemove={() => handleRemoveCard(card.id, 'your')}
                          onUpdateValue={(v) => handleUpdateCardValue(card.id, v, 'your')}
                        />
                      ))}
                    </AnimatePresence>
                    
                    {yourCards.length === 0 && (
                      <div className="h-full min-h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                        Add cards you're giving
                      </div>
                    )}
                  </div>

                  {/* Cash input */}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Cash you add"
                      value={yourCash || ''}
                      onChange={(e) => setYourCash(parseFloat(e.target.value) || 0)}
                      className="bg-muted/30 border-border/40"
                    />
                  </div>

                  {/* Your Total */}
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-xs text-muted-foreground">Your Total Value</div>
                    <div className="text-xl font-bold text-red-400">{formatCurrency(yourTotal)}</div>
                  </div>
                </div>

                {/* Their Side */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-navy-500" />
                      You Get
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setAddCardSide('their');
                        setAddCardOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  <div className="min-h-[200px] rounded-xl border-2 border-dashed border-navy-500/30 bg-navy-500/5 p-2 space-y-2">
                    <AnimatePresence mode="popLayout">
                      {theirCards.map(card => (
                        <TradeCardItem
                          key={card.id}
                          card={card}
                          onRemove={() => handleRemoveCard(card.id, 'their')}
                          onUpdateValue={(v) => handleUpdateCardValue(card.id, v, 'their')}
                        />
                      ))}
                    </AnimatePresence>
                    
                    {theirCards.length === 0 && (
                      <div className="h-full min-h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                        Add cards you're receiving
                      </div>
                    )}
                  </div>

                  {/* Cash input */}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Cash they add"
                      value={theirCash || ''}
                      onChange={(e) => setTheirCash(parseFloat(e.target.value) || 0)}
                      className="bg-muted/30 border-border/40"
                    />
                  </div>

                  {/* Their Total */}
                  <div className="p-3 rounded-lg bg-navy-500/10 border border-navy-500/20">
                    <div className="text-xs text-muted-foreground">Their Total Value</div>
                    <div className="text-xl font-bold text-navy-400">{formatCurrency(theirTotal)}</div>
                  </div>
                </div>
              </div>

              {/* Trade Summary */}
              {(yourCards.length > 0 || theirCards.length > 0 || yourCash > 0 || theirCash > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-card border border-border/40"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-purple-500" />
                      <span className="font-semibold">Trade Analysis</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={isFair ? 'bg-navy-500/20 text-navy-400 border-navy-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}
                    >
                      {isFair ? 'Fair Trade' : 'Uneven Trade'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Value Difference</span>
                    <span className={`font-bold ${valueDifference >= 0 ? 'text-navy-400' : 'text-red-400'}`}>
                      {valueDifference >= 0 ? '+' : ''}{formatCurrency(valueDifference)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                    {youGetBetterDeal ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-navy-500" />
                        <span className="text-sm">
                          <span className="font-semibold text-navy-400">You're getting the better deal</span>
                          <span className="text-muted-foreground"> by {formatCurrency(Math.abs(valueDifference))}</span>
                        </span>
                      </>
                    ) : valueDifference < 0 ? (
                      <>
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        <span className="text-sm">
                          <span className="font-semibold text-red-400">They're getting the better deal</span>
                          <span className="text-muted-foreground"> by {formatCurrency(Math.abs(valueDifference))}</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 text-navy-500" />
                        <span className="text-sm font-semibold text-navy-400">Perfectly even trade!</span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              <Textarea
                placeholder="Trade notes (optional)..."
                value={tradeNotes}
                onChange={(e) => setTradeNotes(e.target.value)}
                className="bg-muted/30 border-border/40"
                rows={2}
              />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setYourCards([]);
                    setTheirCards([]);
                    setYourCash(0);
                    setTheirCash(0);
                    setTradeNotes('');
                    setSelectedPartner('');
                  }}
                >
                  Clear
                </Button>
                <Button
                  className="flex-1 bg-purple-500 hover:bg-purple-600"
                  onClick={handleCreateProposal}
                  disabled={yourCards.length === 0 && theirCards.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Save Proposal
                </Button>
              </div>
            </TabsContent>

            {/* Proposals Tab (Quick Add) */}
            <TabsContent value="proposals" className="mt-0">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Calculator className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Create a Trade Proposal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use the Calculator tab to build and analyze your trade offers.
                </p>
                <Button 
                  onClick={() => setActiveTab('calculator')}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <ArrowLeftRight className="h-4 w-4 mr-1.5" />
                  Open Calculator
                </Button>
              </div>
            </TabsContent>

            {/* Pending Trades Tab */}
            <TabsContent value="pending" className="mt-0 space-y-3">
              {pendingProposals.length > 0 ? (
                pendingProposals.map(proposal => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    onView={() => {
                      setSelectedProposal(proposal);
                      setProposalDetailOpen(true);
                    }}
                    onUpdateStatus={(status) => updateProposalStatus(proposal.id, status)}
                    onComplete={() => completeProposal(proposal.id)}
                    onDelete={() => {
                      setItemToDelete({ type: 'proposal', id: proposal.id });
                      setDeleteConfirmOpen(true);
                    }}
                  />
                ))
              ) : (
                <EmptyState
                  icon={MessageCircle}
                  title="No Pending Trades"
                  description="Create a trade proposal in the Calculator tab to get started."
                  action={
                    <Button onClick={() => setActiveTab('calculator')} className="bg-purple-500 hover:bg-purple-600">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create Proposal
                    </Button>
                  }
                />
              )}

              {/* Show all proposals if there are completed/declined ones */}
              {proposals.length > pendingProposals.length && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full text-muted-foreground">
                      <ChevronDown className="h-4 w-4 mr-1.5" />
                      Show All Proposals ({proposals.length - pendingProposals.length} more)
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-3">
                    {proposals.filter(p => p.status === 'completed' || p.status === 'declined').map(proposal => (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getStatusColor={getStatusColor}
                        onView={() => {
                          setSelectedProposal(proposal);
                          setProposalDetailOpen(true);
                        }}
                        onUpdateStatus={(status) => updateProposalStatus(proposal.id, status)}
                        onComplete={() => completeProposal(proposal.id)}
                        onDelete={() => {
                          setItemToDelete({ type: 'proposal', id: proposal.id });
                          setDeleteConfirmOpen(true);
                        }}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </TabsContent>

            {/* Partners Tab */}
            <TabsContent value="partners" className="mt-0 space-y-3">
              <Button 
                onClick={() => setAddPartnerOpen(true)}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Trade Partner
              </Button>

              {partners.length > 0 ? (
                partners.map(partner => (
                  <PartnerCard
                    key={partner.id}
                    partner={partner}
                    tradeCount={getPartnerTradeHistory(partner.id).length}
                    formatDate={formatDate}
                    onView={() => {
                      setSelectedPartnerDetail(partner);
                      setPartnerDetailOpen(true);
                    }}
                    onEdit={() => openEditPartner(partner)}
                    onDelete={() => {
                      setItemToDelete({ type: 'partner', id: partner.id });
                      setDeleteConfirmOpen(true);
                    }}
                  />
                ))
              ) : (
                <EmptyState
                  icon={Users}
                  title="No Trade Partners"
                  description="Add contacts you frequently trade with to track your history."
                />
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-0 space-y-3">
              {history.length > 0 ? (
                history.map(entry => (
                  <HistoryCard
                    key={entry.id}
                    entry={entry}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    onView={() => {
                      setSelectedHistory(entry);
                      setHistoryDetailOpen(true);
                    }}
                    onDelete={() => {
                      setItemToDelete({ type: 'history', id: entry.id });
                      setDeleteConfirmOpen(true);
                    }}
                  />
                ))
              ) : (
                <EmptyState
                  icon={History}
                  title="No Trade History"
                  description="Completed trades will appear here with gain/loss tracking."
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Add Card Dialog */}
          <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
            <DialogContent className="bg-card border-2 border-border/50 max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>
                  Add Card to "{addCardSide === 'your' ? 'You Give' : 'You Get'}"
                </DialogTitle>
                <DialogDescription>
                  Select from your inventory or add a custom card.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/30 border-border/40"
                  />
                </div>

                {/* Custom Card Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setAddCardOpen(false);
                    setCustomCardOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Custom Card
                </Button>

                {/* Inventory Grid */}
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-3 gap-2">
                    {filteredInventory.slice(0, 30).map(item => (
                      <motion.button
                        key={item.id}
                        onClick={() => handleAddInventoryCard(item)}
                        className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-border/40 hover:border-purple-500 transition-all"
                        whileTap={{ scale: 0.95 }}
                      >
                        <CardImage
                          src={item.card_image_url}
                          alt={item.name}
                          size="md"
                          rounded="lg"
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                          showPrice
                          price={item.market_price || item.purchase_price || 0}
                        />
                      </motion.button>
                    ))}
                  </div>
                  {filteredInventory.length > 30 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Showing 30 of {filteredInventory.length} cards
                    </p>
                  )}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          {/* Custom Card Dialog */}
          <Dialog open={customCardOpen} onOpenChange={setCustomCardOpen}>
            <DialogContent className="bg-card border-2 border-border/50">
              <DialogHeader>
                <DialogTitle>Add Custom Card</DialogTitle>
                <DialogDescription>
                  Enter card details manually.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Card Name *</Label>
                  <Input
                    placeholder="e.g., Charizard Holo"
                    value={customCardName}
                    onChange={(e) => setCustomCardName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Set Name</Label>
                  <Input
                    placeholder="e.g., Base Set"
                    value={customCardSet}
                    onChange={(e) => setCustomCardSet(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Value *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={customCardValue}
                      onChange={(e) => setCustomCardValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={customCardQuantity}
                      onChange={(e) => setCustomCardQuantity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCustomCardOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCustomCard}
                  disabled={!customCardName || !customCardValue}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Add Card
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Partner Dialog */}
          <Dialog open={addPartnerOpen} onOpenChange={setAddPartnerOpen}>
            <DialogContent className="bg-card border-2 border-border/50">
              <DialogHeader>
                <DialogTitle>Add Trade Partner</DialogTitle>
                <DialogDescription>
                  Add someone you trade with regularly.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="Partner name"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Info</Label>
                  <Input
                    placeholder="Phone, email, username, etc."
                    value={partnerContact}
                    onChange={(e) => setPartnerContact(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Any notes about this partner..."
                    value={partnerNotes}
                    onChange={(e) => setPartnerNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddPartnerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddPartner}
                  disabled={!partnerName.trim()}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Add Partner
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Partner Dialog */}
          <Dialog open={editPartnerOpen} onOpenChange={setEditPartnerOpen}>
            <DialogContent className="bg-card border-2 border-border/50">
              <DialogHeader>
                <DialogTitle>Edit Partner</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Info</Label>
                  <Input
                    value={partnerContact}
                    onChange={(e) => setPartnerContact(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={partnerNotes}
                    onChange={(e) => setPartnerNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditPartnerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEditPartner}
                  disabled={!partnerName.trim()}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent className="bg-card border-2 border-border/50">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Proposal Detail Sheet */}
          <Sheet open={proposalDetailOpen} onOpenChange={setProposalDetailOpen}>
            <SheetContent className="bg-card overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Trade Proposal</SheetTitle>
                <SheetDescription>
                  {selectedProposal?.partnerName || 'No partner assigned'}
                </SheetDescription>
              </SheetHeader>
              
              {selectedProposal && (
                <div className="mt-6 space-y-6">
                  <Badge className={getStatusColor(selectedProposal.status)}>
                    {selectedProposal.status.toUpperCase()}
                  </Badge>

                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="text-xs text-muted-foreground mb-2">You Give</div>
                      {selectedProposal.yourCards.map(card => (
                        <div key={card.id} className="flex justify-between text-sm">
                          <span>{card.name}</span>
                          <span className="text-red-400">{formatCurrency(card.value)}</span>
                        </div>
                      ))}
                      {selectedProposal.yourCash > 0 && (
                        <div className="flex justify-between text-sm pt-1 border-t border-red-500/20 mt-1">
                          <span>Cash</span>
                          <span className="text-red-400">{formatCurrency(selectedProposal.yourCash)}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-navy-500/10 border border-navy-500/20">
                      <div className="text-xs text-muted-foreground mb-2">You Get</div>
                      {selectedProposal.theirCards.map(card => (
                        <div key={card.id} className="flex justify-between text-sm">
                          <span>{card.name}</span>
                          <span className="text-navy-400">{formatCurrency(card.value)}</span>
                        </div>
                      ))}
                      {selectedProposal.theirCash > 0 && (
                        <div className="flex justify-between text-sm pt-1 border-t border-navy-500/20 mt-1">
                          <span>Cash</span>
                          <span className="text-navy-400">{formatCurrency(selectedProposal.theirCash)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedProposal.notes && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <p className="text-sm">{selectedProposal.notes}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created: {formatDate(selectedProposal.createdAt)}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* History Detail Sheet */}
          <Sheet open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
            <SheetContent className="bg-card overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Trade Details</SheetTitle>
                <SheetDescription>
                  Trade with {selectedHistory?.partnerName}
                </SheetDescription>
              </SheetHeader>
              
              {selectedHistory && (
                <div className="mt-6 space-y-6">
                  <div className={`p-4 rounded-xl ${selectedHistory.netGain >= 0 ? 'bg-navy-500/10' : 'bg-red-500/10'}`}>
                    <div className="text-xs text-muted-foreground">Net Result</div>
                    <div className={`text-2xl font-bold ${selectedHistory.netGain >= 0 ? 'text-navy-400' : 'text-red-400'}`}>
                      {selectedHistory.netGain >= 0 ? '+' : ''}{formatCurrency(selectedHistory.netGain)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="text-xs text-muted-foreground mb-2">You Gave ({formatCurrency(selectedHistory.totalYourValue)})</div>
                      {selectedHistory.youGave.map(card => (
                        <div key={card.id} className="flex justify-between text-sm">
                          <span>{card.name}</span>
                          <span className="text-red-400">{formatCurrency(card.value)}</span>
                        </div>
                      ))}
                      {selectedHistory.cashYouGave > 0 && (
                        <div className="flex justify-between text-sm pt-1 border-t border-red-500/20 mt-1">
                          <span>Cash</span>
                          <span className="text-red-400">{formatCurrency(selectedHistory.cashYouGave)}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-navy-500/10 border border-navy-500/20">
                      <div className="text-xs text-muted-foreground mb-2">You Got ({formatCurrency(selectedHistory.totalTheirValue)})</div>
                      {selectedHistory.youGot.map(card => (
                        <div key={card.id} className="flex justify-between text-sm">
                          <span>{card.name}</span>
                          <span className="text-navy-400">{formatCurrency(card.value)}</span>
                        </div>
                      ))}
                      {selectedHistory.cashYouGot > 0 && (
                        <div className="flex justify-between text-sm pt-1 border-t border-navy-500/20 mt-1">
                          <span>Cash</span>
                          <span className="text-navy-400">{formatCurrency(selectedHistory.cashYouGot)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedHistory.notes && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <p className="text-sm">{selectedHistory.notes}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Completed: {formatDate(selectedHistory.date)}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Partner Detail Sheet */}
          <Sheet open={partnerDetailOpen} onOpenChange={setPartnerDetailOpen}>
            <SheetContent className="bg-card overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{selectedPartnerDetail?.name}</SheetTitle>
                <SheetDescription>
                  Trade partner since {selectedPartnerDetail && formatDate(selectedPartnerDetail.createdAt)}
                </SheetDescription>
              </SheetHeader>
              
              {selectedPartnerDetail && (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground">Total Trades</div>
                      <div className="text-xl font-bold">{selectedPartnerDetail.totalTrades}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground">Last Trade</div>
                      <div className="text-sm font-medium">
                        {selectedPartnerDetail.lastTradeDate 
                          ? formatDate(selectedPartnerDetail.lastTradeDate)
                          : 'Never'
                        }
                      </div>
                    </div>
                  </div>

                  {selectedPartnerDetail.contact && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Contact</div>
                      <p className="text-sm">{selectedPartnerDetail.contact}</p>
                    </div>
                  )}

                  {selectedPartnerDetail.notes && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <p className="text-sm">{selectedPartnerDetail.notes}</p>
                    </div>
                  )}

                  {/* Trade History with Partner */}
                  <div>
                    <h4 className="font-semibold mb-3">Trade History</h4>
                    {getPartnerTradeHistory(selectedPartnerDetail.id).length > 0 ? (
                      <div className="space-y-2">
                        {getPartnerTradeHistory(selectedPartnerDetail.id).map(entry => (
                          <div key={entry.id} className="p-3 rounded-lg bg-muted/20 flex justify-between items-center">
                            <div>
                              <div className="text-sm">{formatDate(entry.date)}</div>
                              <div className="text-xs text-muted-foreground">
                                {entry.youGave.length} → {entry.youGot.length} cards
                              </div>
                            </div>
                            <div className={`font-bold ${entry.netGain >= 0 ? 'text-navy-400' : 'text-red-400'}`}>
                              {entry.netGain >= 0 ? '+' : ''}{formatCurrency(entry.netGain)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No completed trades yet.</p>
                    )}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
          </main>
        </PageTransition>
      </div>
      <BottomNav />
    </div>
  );
};

// Trade Card Item Component
interface TradeCardItemProps {
  card: TradeCard;
  onRemove: () => void;
  onUpdateValue: (value: number) => void;
}

const TradeCardItem = ({ card, onRemove, onUpdateValue }: TradeCardItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.value.toString());

  const handleSaveValue = () => {
    onUpdateValue(parseFloat(editValue) || 0);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/40 group"
    >
      {/* Card Image */}
      <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-muted/30">
        <CardImage 
          src={card.card_image_url} 
          alt={card.name} 
          size="sm"
          rounded="md"
          containerClassName="w-full h-full"
          className="w-full h-full object-cover" 
        />
      </div>

      {/* Card Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{card.name}</div>
        {card.set_name && (
          <div className="text-xs text-muted-foreground truncate">{card.set_name}</div>
        )}
        {/* Editable Value */}
        {isEditing ? (
          <div className="flex items-center gap-1 mt-1">
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-6 text-xs w-20 px-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveValue()}
            />
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleSaveValue}>
              <Check className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-navy-400 font-bold hover:underline flex items-center gap-0.5"
          >
            ${card.value.toFixed(2)}
            <Edit2 className="h-2.5 w-2.5 opacity-50" />
          </button>
        )}
      </div>

      {/* Quantity */}
      {card.quantity > 1 && (
        <Badge variant="secondary" className="text-[10px]">x{card.quantity}</Badge>
      )}

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </motion.div>
  );
};

// Proposal Card Component
interface ProposalCardProps {
  proposal: TradeProposal;
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
  getStatusColor: (s: TradeStatus) => string;
  onView: () => void;
  onUpdateStatus: (status: TradeStatus) => void;
  onComplete: () => void;
  onDelete: () => void;
}

const ProposalCard = ({ 
  proposal, 
  formatCurrency, 
  formatDate, 
  getStatusColor,
  onView, 
  onUpdateStatus, 
  onComplete,
  onDelete 
}: ProposalCardProps) => {
  const yourTotal = proposal.yourCards.reduce((s, c) => s + c.value * c.quantity, 0) + proposal.yourCash;
  const theirTotal = proposal.theirCards.reduce((s, c) => s + c.value * c.quantity, 0) + proposal.theirCash;
  const diff = theirTotal - yourTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border/40"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-medium">{proposal.partnerName || 'Trade Proposal'}</div>
          <div className="text-xs text-muted-foreground">{formatDate(proposal.createdAt)}</div>
        </div>
        <Badge variant="outline" className={getStatusColor(proposal.status)}>
          {proposal.status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="text-red-400">{formatCurrency(yourTotal)}</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-navy-400">{formatCurrency(theirTotal)}</span>
        <span className={`ml-auto font-bold ${diff >= 0 ? 'text-navy-400' : 'text-red-400'}`}>
          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
        </span>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onView} className="flex-1">
          Details
        </Button>
        
        {proposal.status === 'proposed' && (
          <>
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus('countered')}>
              Counter
            </Button>
            <Button size="sm" className="bg-navy-500 hover:bg-navy-600" onClick={() => onUpdateStatus('accepted')}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onUpdateStatus('declined')}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {proposal.status === 'accepted' && (
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={onComplete}>
            Complete
          </Button>
        )}

        {(proposal.status === 'completed' || proposal.status === 'declined') && (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Partner Card Component
interface PartnerCardProps {
  partner: TradePartner;
  tradeCount: number;
  formatDate: (s: string) => string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const PartnerCard = ({ partner, tradeCount, formatDate, onView, onEdit, onDelete }: PartnerCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border/40"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
          <User className="h-6 w-6 text-purple-500" />
        </div>
        <div className="flex-1">
          <div className="font-medium">{partner.name}</div>
          {partner.contact && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {partner.contact}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {tradeCount} trades
            {partner.lastTradeDate && ` • Last: ${formatDate(partner.lastTradeDate)}`}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onView}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// History Card Component
interface HistoryCardProps {
  entry: TradeHistoryEntry;
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
  onView: () => void;
  onDelete: () => void;
}

const HistoryCard = ({ entry, formatCurrency, formatDate, onView, onDelete }: HistoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border/40"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium">{entry.partnerName}</div>
          <div className="text-xs text-muted-foreground">{formatDate(entry.date)}</div>
        </div>
        <div className={`text-lg font-bold ${entry.netGain >= 0 ? 'text-navy-400' : 'text-red-400'}`}>
          {entry.netGain >= 0 ? '+' : ''}{formatCurrency(entry.netGain)}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
        <span>Gave {entry.youGave.length} cards</span>
        <ArrowRight className="h-3 w-3" />
        <span>Got {entry.youGot.length} cards</span>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onView} className="flex-1">
          View Details
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">{description}</p>
      {action}
    </motion.div>
  );
};

export default TradingHub;
