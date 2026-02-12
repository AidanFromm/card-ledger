import { useState, useMemo } from "react";
import { 
  ArrowLeftRight, 
  Package, 
  Heart, 
  Users, 
  Plus, 
  RefreshCw, 
  Search, 
  Trash2,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  Sparkles,
  TrendingUp,
  Clock,
  Filter,
  ChevronRight,
  Star
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useTrading, type TradeListingWithDetails, type PotentialMatch, type TradeMatchWithDetails } from "@/hooks/useTrading";
import { useWishlistDb } from "@/hooks/useWishlistDb";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

type TabType = 'trade-list' | 'matches' | 'active-trades';

const TradingHub = () => {
  const { 
    myListings, 
    potentialMatches, 
    myTrades,
    loading,
    matchesLoading,
    activeListingsCount,
    pendingTradesCount,
    completedTradesCount,
    createListing,
    removeListing,
    proposeTrade,
    respondToTrade,
    completeTrade,
    refetchAll,
    refetchMatches,
  } = useTrading();
  
  const { items: wishlistItems } = useWishlistDb();
  const { items: inventoryItems } = useInventoryDb();
  
  const [activeTab, setActiveTab] = useState<TabType>('trade-list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Dialog states
  const [addListingOpen, setAddListingOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string | null>(null);
  const [lookingFor, setLookingFor] = useState('');
  const [listingNotes, setListingNotes] = useState('');
  
  const [deleteListingOpen, setDeleteListingOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<TradeListingWithDetails | null>(null);
  
  const [tradeDetailOpen, setTradeDetailOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeMatchWithDetails | null>(null);
  
  const [proposeTradeOpen, setProposeTradeOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);

  // Filter listings for trade list
  const haveListings = useMemo(() => {
    return myListings.filter(l => l.listing_type === 'have' && l.is_active);
  }, [myListings]);

  // Inventory items not yet listed
  const unlistedInventory = useMemo(() => {
    const listedIds = new Set(myListings.map(l => l.inventory_item_id).filter(Boolean));
    return inventoryItems.filter(item => !listedIds.has(item.id));
  }, [inventoryItems, myListings]);

  // Filter by search
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return haveListings;
    const query = searchQuery.toLowerCase();
    return haveListings.filter(l => 
      l.card_name.toLowerCase().includes(query) ||
      l.set_name?.toLowerCase().includes(query)
    );
  }, [haveListings, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchAll();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleFindMatches = async () => {
    setIsRefreshing(true);
    await refetchMatches();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleAddListing = async () => {
    if (!selectedInventoryItem) return;
    
    const item = inventoryItems.find(i => i.id === selectedInventoryItem);
    if (!item) return;

    const success = await createListing({
      inventory_item_id: item.id,
      listing_type: 'have',
      card_name: item.name,
      set_name: item.set_name,
      card_image_url: item.card_image_url,
      looking_for: lookingFor || null,
      notes: listingNotes || null,
    });

    if (success) {
      setAddListingOpen(false);
      setSelectedInventoryItem(null);
      setLookingFor('');
      setListingNotes('');
    }
  };

  const handleDeleteListing = async () => {
    if (listingToDelete) {
      await removeListing(listingToDelete.id);
      setListingToDelete(null);
    }
    setDeleteListingOpen(false);
  };

  const handleProposeTrade = async () => {
    if (!selectedMatch) return;
    
    // For now, propose with the first matched items
    const myListingIds = selectedMatch.you_have_ids?.slice(0, 1) || [];
    const theirListingIds = selectedMatch.they_have_ids?.slice(0, 1) || [];
    
    const tradeId = await proposeTrade(
      selectedMatch.other_user_id,
      myListingIds,
      theirListingIds
    );

    if (tradeId) {
      setProposeTradeOpen(false);
      setSelectedMatch(null);
      setActiveTab('active-trades');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'bg-amber-500/20 text-amber-500';
      case 'accepted': return 'bg-emerald-500/20 text-emerald-500';
      case 'declined': return 'bg-red-500/20 text-red-500';
      case 'completed': return 'bg-blue-500/20 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted/30 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 w-32 bg-muted/20 rounded-full" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[3/4] bg-muted/20 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <ArrowLeftRight className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Trading Hub</h1>
                <p className="text-sm text-muted-foreground">
                  {activeListingsCount} cards listed • {pendingTradesCount} pending
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <Package className="h-5 w-5 text-purple-500 mb-2" />
              <div className="text-2xl font-bold">{activeListingsCount}</div>
              <div className="text-xs text-muted-foreground">For Trade</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <Clock className="h-5 w-5 text-amber-500 mb-2" />
              <div className="text-2xl font-bold">{pendingTradesCount}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <CheckCircle className="h-5 w-5 text-emerald-500 mb-2" />
              <div className="text-2xl font-bold">{completedTradesCount}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/30">
              <TabsTrigger value="trade-list" className="gap-1.5">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Trade List</span>
              </TabsTrigger>
              <TabsTrigger value="matches" className="gap-1.5">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Matches</span>
                {potentialMatches.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {potentialMatches.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active-trades" className="gap-1.5">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Trades</span>
                {pendingTradesCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {pendingTradesCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Trade List Tab */}
            <TabsContent value="trade-list" className="mt-0">
              {/* Search + Add Button */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your trade list..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/30 border-none"
                  />
                </div>
                <Button 
                  onClick={() => setAddListingOpen(true)}
                  className="bg-purple-500 hover:bg-purple-600 gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Card</span>
                </Button>
              </div>

              {/* Trade Listings Grid */}
              {filteredListings.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <AnimatePresence mode="popLayout">
                    {filteredListings.map((listing, index) => (
                      <TradeListingCard
                        key={listing.id}
                        listing={listing}
                        index={index}
                        onDelete={() => {
                          setListingToDelete(listing);
                          setDeleteListingOpen(true);
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyTradeList 
                  hasListings={myListings.length > 0}
                  onAddClick={() => setAddListingOpen(true)}
                />
              )}
            </TabsContent>

            {/* Matches Tab */}
            <TabsContent value="matches" className="mt-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Potential Matches</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFindMatches}
                  disabled={matchesLoading}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-4 w-4 ${matchesLoading ? 'animate-spin' : ''}`} />
                  Find Matches
                </Button>
              </div>

              {potentialMatches.length > 0 ? (
                <div className="space-y-3">
                  {potentialMatches.map((match) => (
                    <MatchCard
                      key={match.other_user_id}
                      match={match}
                      onPropose={() => {
                        setSelectedMatch(match);
                        setProposeTradeOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyMatches 
                  hasListings={activeListingsCount > 0}
                  hasWishlist={wishlistItems.length > 0}
                />
              )}
            </TabsContent>

            {/* Active Trades Tab */}
            <TabsContent value="active-trades" className="mt-0">
              {myTrades.length > 0 ? (
                <div className="space-y-3">
                  {myTrades.map((trade) => (
                    <TradeCard
                      key={trade.id}
                      trade={trade}
                      onView={() => {
                        setSelectedTrade(trade);
                        setTradeDetailOpen(true);
                      }}
                      onAccept={async () => await respondToTrade(trade.id, true)}
                      onDecline={async () => await respondToTrade(trade.id, false)}
                      onComplete={async () => await completeTrade(trade.id)}
                      formatDate={formatDate}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              ) : (
                <EmptyTrades />
              )}
            </TabsContent>
          </Tabs>

          {/* Add Listing Dialog */}
          <Dialog open={addListingOpen} onOpenChange={setAddListingOpen}>
            <DialogContent className="bg-card border-2 border-border/50 max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>List Card for Trade</DialogTitle>
                <DialogDescription>
                  Select a card from your inventory to list for trade.
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-4 py-4">
                  {/* Card Selection */}
                  <div className="space-y-2">
                    <Label>Select Card</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {unlistedInventory.slice(0, 12).map(item => (
                        <motion.button
                          key={item.id}
                          onClick={() => setSelectedInventoryItem(item.id)}
                          className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                            selectedInventoryItem === item.id 
                              ? 'border-purple-500 ring-2 ring-purple-500/20' 
                              : 'border-border/40 hover:border-border'
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          {item.card_image_url ? (
                            <img 
                              src={item.card_image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {selectedInventoryItem === item.id && (
                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                              <CheckCircle className="h-8 w-8 text-purple-500" />
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                    {unlistedInventory.length > 12 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Showing 12 of {unlistedInventory.length} unlisted cards
                      </p>
                    )}
                  </div>

                  {selectedInventoryItem && (
                    <>
                      <div className="space-y-2">
                        <Label>Looking For (optional)</Label>
                        <Input
                          placeholder="e.g., Base Set Charizard, vintage holos..."
                          value={lookingFor}
                          onChange={(e) => setLookingFor(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea
                          placeholder="Condition notes, trade preferences..."
                          value={listingNotes}
                          onChange={(e) => setListingNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddListingOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddListing}
                  disabled={!selectedInventoryItem}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  List for Trade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Listing Confirmation */}
          <AlertDialog open={deleteListingOpen} onOpenChange={setDeleteListingOpen}>
            <AlertDialogContent className="bg-card border-2 border-border/50">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from Trade List?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove {listingToDelete?.card_name} from your trade list?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteListing}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Propose Trade Dialog */}
          <Dialog open={proposeTradeOpen} onOpenChange={setProposeTradeOpen}>
            <DialogContent className="bg-card border-2 border-border/50">
              <DialogHeader>
                <DialogTitle>Propose Trade</DialogTitle>
                <DialogDescription>
                  Send a trade offer to this user.
                </DialogDescription>
              </DialogHeader>
              
              {selectedMatch && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Match Score</div>
                      <div className="text-2xl font-bold text-purple-500">
                        {selectedMatch.match_score} cards
                      </div>
                    </div>
                    <Star className="h-8 w-8 text-amber-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">They Have (You Want)</div>
                      <div className="space-y-1">
                        {selectedMatch.they_have_listings?.slice(0, 3).map(l => (
                          <div key={l.id} className="text-sm truncate">{l.card_name}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">You Have (They Want)</div>
                      <div className="space-y-1">
                        {selectedMatch.you_have_listings?.slice(0, 3).map(l => (
                          <div key={l.id} className="text-sm truncate">{l.card_name}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setProposeTradeOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleProposeTrade}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Send Proposal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Trade Detail Sheet */}
          <Sheet open={tradeDetailOpen} onOpenChange={setTradeDetailOpen}>
            <SheetContent className="bg-card">
              <SheetHeader>
                <SheetTitle>Trade Details</SheetTitle>
                <SheetDescription>
                  View and manage this trade.
                </SheetDescription>
              </SheetHeader>
              
              {selectedTrade && (
                <div className="mt-6 space-y-4">
                  <Badge className={getStatusColor(selectedTrade.status)}>
                    {selectedTrade.status.toUpperCase()}
                  </Badge>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div>{formatDate(selectedTrade.created_at)}</div>
                  </div>

                  {selectedTrade.user_a_listing && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Their Offer</div>
                      <div className="font-medium">{selectedTrade.user_a_listing.card_name}</div>
                      {selectedTrade.user_a_listing.set_name && (
                        <div className="text-sm text-muted-foreground">
                          {selectedTrade.user_a_listing.set_name}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTrade.user_b_listing && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Your Offer</div>
                      <div className="font-medium">{selectedTrade.user_b_listing.card_name}</div>
                      {selectedTrade.user_b_listing.set_name && (
                        <div className="text-sm text-muted-foreground">
                          {selectedTrade.user_b_listing.set_name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

// Trade Listing Card Component
interface TradeListingCardProps {
  listing: TradeListingWithDetails;
  index: number;
  onDelete: () => void;
}

const TradeListingCard = ({ listing, index, onDelete }: TradeListingCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      className="relative group rounded-2xl border-2 border-border/40 overflow-hidden bg-card/50 hover:border-purple-500/30 transition-all"
    >
      {/* Card Image */}
      <div className="aspect-[3/4] relative">
        {listing.card_image_url ? (
          <img
            src={listing.card_image_url}
            alt={listing.card_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted/30 flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <motion.button
            onClick={onDelete}
            className="p-2.5 rounded-full bg-destructive text-white shadow-lg"
            whileTap={{ scale: 0.9 }}
            title="Remove listing"
          >
            <Trash2 className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Trade badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold">
          FOR TRADE
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{listing.card_name}</h3>
        {listing.set_name && (
          <p className="text-xs text-muted-foreground truncate">{listing.set_name}</p>
        )}
        {listing.looking_for && (
          <p className="text-xs text-purple-400 truncate mt-1">
            Looking for: {listing.looking_for}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Match Card Component
interface MatchCardProps {
  match: PotentialMatch;
  onPropose: () => void;
}

const MatchCard = ({ match, onPropose }: MatchCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border-2 border-border/40 bg-card/50 hover:border-purple-500/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <div className="font-medium">Potential Match</div>
            <div className="text-sm text-muted-foreground">
              {match.match_score} overlapping cards
            </div>
          </div>
        </div>
        <Badge className="bg-purple-500/20 text-purple-500">
          <Star className="h-3 w-3 mr-1" />
          {match.match_score}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">They have ({match.they_have_ids?.length || 0})</div>
          <div className="flex flex-wrap gap-1">
            {match.they_have_listings?.slice(0, 2).map(l => (
              <Badge key={l.id} variant="outline" className="text-[10px] truncate max-w-[100px]">
                {l.card_name}
              </Badge>
            ))}
            {(match.they_have_listings?.length || 0) > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{(match.they_have_listings?.length || 0) - 2}
              </Badge>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">You have ({match.you_have_ids?.length || 0})</div>
          <div className="flex flex-wrap gap-1">
            {match.you_have_listings?.slice(0, 2).map(l => (
              <Badge key={l.id} variant="outline" className="text-[10px] truncate max-w-[100px]">
                {l.card_name}
              </Badge>
            ))}
            {(match.you_have_listings?.length || 0) > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{(match.you_have_listings?.length || 0) - 2}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Button 
        onClick={onPropose}
        className="w-full bg-purple-500 hover:bg-purple-600"
        size="sm"
      >
        <Send className="h-4 w-4 mr-1.5" />
        Propose Trade
      </Button>
    </motion.div>
  );
};

// Trade Card Component
interface TradeCardProps {
  trade: TradeMatchWithDetails;
  onView: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
}

const TradeCard = ({ trade, onView, onAccept, onDecline, onComplete, formatDate, getStatusColor }: TradeCardProps) => {
  const isPending = trade.status === 'proposed';
  const isAccepted = trade.status === 'accepted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border-2 border-border/40 bg-card/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">Trade #{trade.id.slice(0, 8)}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(trade.created_at)}
            </div>
          </div>
        </div>
        <Badge className={getStatusColor(trade.status)}>
          {trade.status}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onView}
          className="flex-1"
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        
        {isPending && trade.proposed_by !== trade.user_a_id && (
          <>
            <Button 
              size="sm" 
              onClick={onAccept}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={onDecline}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {isAccepted && (
          <Button 
            size="sm" 
            onClick={onComplete}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Complete
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Empty States
const EmptyTradeList = ({ hasListings, onAddClick }: { hasListings: boolean; onAddClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/10 flex items-center justify-center">
      <Package className="h-10 w-10 text-purple-500" />
    </div>
    <h3 className="text-lg font-semibold mb-2">
      {hasListings ? "No results" : "No Cards Listed"}
    </h3>
    <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
      {hasListings 
        ? "Try adjusting your search."
        : "List cards from your inventory that you're willing to trade."
      }
    </p>
    {!hasListings && (
      <Button onClick={onAddClick} className="bg-purple-500 hover:bg-purple-600">
        <Plus className="h-4 w-4 mr-1.5" />
        List Your First Card
      </Button>
    )}
  </motion.div>
);

const EmptyMatches = ({ hasListings, hasWishlist }: { hasListings: boolean; hasWishlist: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
      <Users className="h-10 w-10 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
      {!hasListings && "List some cards for trade to find matches."}
      {hasListings && !hasWishlist && "Add cards to your wishlist to find traders who have what you want."}
      {hasListings && hasWishlist && "We'll notify you when we find users who have your wants and want your haves!"}
    </p>
  </motion.div>
);

const EmptyTrades = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
      <MessageCircle className="h-10 w-10 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">No Active Trades</h3>
    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
      Your trade history will appear here. Find matches and propose trades to get started!
    </p>
  </motion.div>
);

export default TradingHub;
