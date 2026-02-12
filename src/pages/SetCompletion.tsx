import { useState, useMemo, useEffect } from "react";
import { 
  Layers, Plus, Trash2, ChevronRight, Check, X, Search, 
  RefreshCw, Heart, Filter, ArrowLeft, Grid, List
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useSetCompletion, SetProgress, SetInfo, SetCard } from "@/hooks/useSetCompletion";
import { useWishlistDb } from "@/hooks/useWishlistDb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ViewMode = 'tracked' | 'browse' | 'checklist';
type TCGType = 'pokemon' | 'mtg' | 'yugioh';
type CardViewMode = 'grid' | 'list';

const SetCompletion = () => {
  const { 
    trackedSets, 
    loading, 
    startTrackingSet,
    stopTrackingSet,
    toggleCardOwned,
    isCardOwned,
    fetchPokemonSets,
    fetchMtgSets,
    fetchYugiohSets,
    fetchSetCards,
    refetch,
  } = useSetCompletion();
  const { addItem: addToWishlist, isInWishlist } = useWishlistDb();
  
  const [viewMode, setViewMode] = useState<ViewMode>('tracked');
  const [selectedTcg, setSelectedTcg] = useState<TCGType>('pokemon');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Browse sets
  const [browseSets, setBrowseSets] = useState<SetInfo[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  
  // Checklist view
  const [selectedSet, setSelectedSet] = useState<SetProgress | null>(null);
  const [setCards, setSetCards] = useState<SetCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>('grid');
  const [cardFilter, setCardFilter] = useState<'all' | 'owned' | 'missing'>('all');
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<SetProgress | null>(null);

  // Fetch sets when TCG type changes
  useEffect(() => {
    if (viewMode === 'browse') {
      fetchSetsForTcg();
    }
  }, [selectedTcg, viewMode]);

  const fetchSetsForTcg = async () => {
    setLoadingSets(true);
    try {
      let sets: SetInfo[] = [];
      switch (selectedTcg) {
        case 'pokemon':
          sets = await fetchPokemonSets();
          break;
        case 'mtg':
          sets = await fetchMtgSets();
          break;
        case 'yugioh':
          sets = await fetchYugiohSets();
          break;
      }
      setBrowseSets(sets);
    } finally {
      setLoadingSets(false);
    }
  };

  // Filter browse sets
  const filteredBrowseSets = useMemo(() => {
    if (!searchQuery.trim()) return browseSets;
    const query = searchQuery.toLowerCase();
    return browseSets.filter(s => s.name.toLowerCase().includes(query));
  }, [browseSets, searchQuery]);

  // Handle set selection for checklist
  const handleSetClick = async (set: SetProgress) => {
    setSelectedSet(set);
    setViewMode('checklist');
    setLoadingCards(true);
    try {
      const cards = await fetchSetCards(set.set_id, set.tcg_type);
      setSetCards(cards);
    } finally {
      setLoadingCards(false);
    }
  };

  // Filter cards in checklist
  const filteredCards = useMemo(() => {
    let cards = setCards;
    switch (cardFilter) {
      case 'owned':
        cards = cards.filter(c => c.owned);
        break;
      case 'missing':
        cards = cards.filter(c => !c.owned);
        break;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.number.toLowerCase().includes(query)
      );
    }
    return cards;
  }, [setCards, cardFilter, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleStartTracking = async (set: SetInfo) => {
    await startTrackingSet(set);
    setViewMode('tracked');
  };

  const handleDeleteClick = (set: SetProgress) => {
    setSetToDelete(set);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (setToDelete) {
      await stopTrackingSet(setToDelete.set_id);
      setSetToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleCardToggle = async (card: SetCard) => {
    if (!selectedSet) return;
    await toggleCardOwned(selectedSet.set_id, card.id, !card.owned);
    // Update local state immediately for responsiveness
    setSetCards(prev => prev.map(c => 
      c.id === card.id ? { ...c, owned: !c.owned } : c
    ));
  };

  const handleAddToWishlist = async (card: SetCard) => {
    if (!selectedSet) return;
    await addToWishlist({
      card_id: card.id,
      card_name: card.name,
      set_name: selectedSet.set_name,
      image_url: card.image_url,
      tcg_type: selectedSet.tcg_type,
      card_number: card.number,
      rarity: card.rarity,
    });
  };

  // Calculate stats
  const totalCards = trackedSets.reduce((sum, s) => sum + s.total_cards, 0);
  const totalOwned = trackedSets.reduce((sum, s) => sum + s.owned_cards, 0);
  const avgCompletion = trackedSets.length > 0 
    ? trackedSets.reduce((sum, s) => sum + s.completion_percentage, 0) / trackedSets.length 
    : 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-40 bg-muted/30 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted/20 rounded-xl" />
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
              {viewMode === 'checklist' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewMode('tracked');
                    setSelectedSet(null);
                    setSearchQuery('');
                  }}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <>
                  <div className="p-2.5 rounded-xl bg-violet-500/10">
                    <Layers className="h-6 w-6 text-violet-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Set Completion</h1>
                    <p className="text-sm text-muted-foreground">
                      {trackedSets.length} sets • {totalOwned}/{totalCards} cards
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {viewMode !== 'checklist' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>

          {/* View Mode Tabs */}
          {viewMode !== 'checklist' && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tracked" className="gap-2">
                  <Layers className="h-4 w-4" />
                  My Sets
                </TabsTrigger>
                <TabsTrigger value="browse" className="gap-2">
                  <Search className="h-4 w-4" />
                  Browse Sets
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Checklist View */}
          {viewMode === 'checklist' && selectedSet && (
            <ChecklistView
              set={selectedSet}
              cards={filteredCards}
              allCards={setCards}
              loading={loadingCards}
              viewMode={cardViewMode}
              filter={cardFilter}
              searchQuery={searchQuery}
              onViewModeChange={setCardViewMode}
              onFilterChange={setCardFilter}
              onSearchChange={setSearchQuery}
              onCardToggle={handleCardToggle}
              onAddToWishlist={handleAddToWishlist}
              isInWishlist={isInWishlist}
              isCardOwned={(cardId) => isCardOwned(selectedSet.set_id, cardId)}
            />
          )}

          {/* Tracked Sets View */}
          {viewMode === 'tracked' && (
            <>
              {trackedSets.length > 0 ? (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {trackedSets.map((set, index) => (
                      <SetProgressCard
                        key={set.id}
                        set={set}
                        index={index}
                        onClick={() => handleSetClick(set)}
                        onDelete={() => handleDeleteClick(set)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState onBrowse={() => setViewMode('browse')} />
              )}
            </>
          )}

          {/* Browse Sets View */}
          {viewMode === 'browse' && (
            <>
              {/* TCG Filter */}
              <div className="flex gap-3 mb-4">
                <Select value={selectedTcg} onValueChange={(v) => setSelectedTcg(v as TCGType)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select TCG" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pokemon"> Pokémon</SelectItem>
                    <SelectItem value="mtg"> Magic: The Gathering</SelectItem>
                    <SelectItem value="yugioh"> Yu-Gi-Oh!</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/30 border-none"
                  />
                </div>
              </div>

              {loadingSets ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-muted/20 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredBrowseSets.length > 0 ? (
                <div className="space-y-2">
                  {filteredBrowseSets.map((set) => (
                    <BrowseSetCard
                      key={set.id}
                      set={set}
                      isTracking={trackedSets.some(s => s.set_id === set.id)}
                      onTrack={() => handleStartTracking(set)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  No sets found
                </div>
              )}
            </>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="bg-card border-2 border-border/50">
              <AlertDialogHeader>
                <AlertDialogTitle>Stop Tracking Set?</AlertDialogTitle>
                <AlertDialogDescription>
                  Stop tracking {setToDelete?.set_name}? Your progress will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Stop Tracking
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

// Set Progress Card
interface SetProgressCardProps {
  set: SetProgress;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}

const SetProgressCard = ({ set, index, onClick, onDelete }: SetProgressCardProps) => {
  const isComplete = set.completion_percentage >= 100;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        isComplete
          ? 'bg-emerald-500/10 border-emerald-500/40'
          : 'bg-card/50 border-border/40 hover:border-primary/30'
      }`}
    >
      {/* Complete Badge */}
      {isComplete && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
          COMPLETE!
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Set Logo/Symbol */}
        {set.set_logo_url || set.set_symbol_url ? (
          <img
            src={set.set_logo_url || set.set_symbol_url || ''}
            alt={set.set_name}
            className="w-12 h-12 object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        {/* Set Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate">{set.set_name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground uppercase">
              {set.tcg_type}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground mt-0.5">
            {set.owned_cards} / {set.total_cards} cards
          </p>
          
          {/* Progress Bar */}
          <div className="mt-2 flex items-center gap-2">
            <Progress 
              value={set.completion_percentage} 
              className={`h-2 flex-1 ${isComplete ? '[&>div]:bg-emerald-500' : ''}`}
            />
            <span className={`text-xs font-bold ${isComplete ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              {set.completion_percentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
};

// Browse Set Card
interface BrowseSetCardProps {
  set: SetInfo;
  isTracking: boolean;
  onTrack: () => void;
}

const BrowseSetCard = ({ set, isTracking, onTrack }: BrowseSetCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-3 rounded-xl bg-card/50 border border-border/30"
    >
      {set.logo_url || set.symbol_url ? (
        <img
          src={set.logo_url || set.symbol_url || ''}
          alt={set.name}
          className="w-10 h-10 object-contain"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
          <Layers className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{set.name}</h3>
        <p className="text-xs text-muted-foreground">
          {set.total_cards} cards
          {set.release_date && ` • ${new Date(set.release_date).getFullYear()}`}
        </p>
      </div>
      
      <Button
        size="sm"
        variant={isTracking ? "secondary" : "default"}
        onClick={onTrack}
        disabled={isTracking}
        className="gap-1.5"
      >
        {isTracking ? (
          <>
            <Check className="h-4 w-4" />
            Tracking
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Track
          </>
        )}
      </Button>
    </motion.div>
  );
};

// Checklist View
interface ChecklistViewProps {
  set: SetProgress;
  cards: SetCard[];
  allCards: SetCard[];
  loading: boolean;
  viewMode: CardViewMode;
  filter: 'all' | 'owned' | 'missing';
  searchQuery: string;
  onViewModeChange: (mode: CardViewMode) => void;
  onFilterChange: (filter: 'all' | 'owned' | 'missing') => void;
  onSearchChange: (query: string) => void;
  onCardToggle: (card: SetCard) => void;
  onAddToWishlist: (card: SetCard) => void;
  isInWishlist: (cardId: string) => boolean;
  isCardOwned: (cardId: string) => boolean;
}

const ChecklistView = ({
  set,
  cards,
  allCards,
  loading,
  viewMode,
  filter,
  searchQuery,
  onViewModeChange,
  onFilterChange,
  onSearchChange,
  onCardToggle,
  onAddToWishlist,
  isInWishlist,
  isCardOwned,
}: ChecklistViewProps) => {
  const ownedCount = allCards.filter(c => c.owned).length;
  const missingCount = allCards.length - ownedCount;
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted/20 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Set Header */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/30">
        {set.set_logo_url || set.set_symbol_url ? (
          <img
            src={set.set_logo_url || set.set_symbol_url || ''}
            alt={set.set_name}
            className="w-16 h-16 object-contain"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1">
          <h2 className="font-bold text-lg">{set.set_name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <Progress value={set.completion_percentage} className="h-3 flex-1" />
            <span className="text-sm font-bold">{set.completion_percentage.toFixed(0)}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {ownedCount} owned • {missingCount} missing
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-muted/30 border-none"
          />
        </div>
        
        {/* Filter */}
        <Select value={filter} onValueChange={(v) => onFilterChange(v as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({allCards.length})</SelectItem>
            <SelectItem value="owned">Owned ({ownedCount})</SelectItem>
            <SelectItem value="missing">Missing ({missingCount})</SelectItem>
          </SelectContent>
        </Select>
        
        {/* View Mode */}
        <div className="flex rounded-lg border border-border/30 overflow-hidden">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted/30'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted/30'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cards */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {cards.map((card) => (
            <ChecklistCardGrid
              key={card.id}
              card={card}
              onToggle={() => onCardToggle(card)}
              onAddToWishlist={() => onAddToWishlist(card)}
              inWishlist={isInWishlist(card.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {cards.map((card) => (
            <ChecklistCardList
              key={card.id}
              card={card}
              onToggle={() => onCardToggle(card)}
              onAddToWishlist={() => onAddToWishlist(card)}
              inWishlist={isInWishlist(card.id)}
            />
          ))}
        </div>
      )}

      {cards.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No cards found
        </div>
      )}
    </div>
  );
};

// Checklist Card (Grid)
const ChecklistCardGrid = ({ 
  card, 
  onToggle, 
  onAddToWishlist, 
  inWishlist 
}: { 
  card: SetCard; 
  onToggle: () => void; 
  onAddToWishlist: () => void;
  inWishlist: boolean;
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer transition-all ${
        card.owned
          ? 'ring-2 ring-emerald-500'
          : 'opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
      }`}
    >
      <img
        src={card.image_url}
        alt={card.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Owned Badge */}
      {card.owned && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      
      {/* Add to Wishlist (for missing cards) */}
      {!card.owned && !inWishlist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToWishlist();
          }}
          className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        >
          <Heart className="h-3 w-3 text-white" />
        </button>
      )}
      
      {/* Card Number */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
        <p className="text-[8px] text-white truncate text-center">{card.number}</p>
      </div>
    </motion.div>
  );
};

// Checklist Card (List)
const ChecklistCardList = ({ 
  card, 
  onToggle, 
  onAddToWishlist, 
  inWishlist 
}: { 
  card: SetCard; 
  onToggle: () => void; 
  onAddToWishlist: () => void;
  inWishlist: boolean;
}) => {
  return (
    <motion.div
      onClick={onToggle}
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
        card.owned
          ? 'bg-emerald-500/10 border border-emerald-500/30'
          : 'bg-muted/20 hover:bg-muted/30'
      }`}
    >
      <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0">
        <img
          src={card.image_url}
          alt={card.name}
          className={`w-full h-full object-cover ${!card.owned ? 'grayscale opacity-50' : ''}`}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{card.name}</p>
        <p className="text-xs text-muted-foreground">#{card.number} • {card.rarity}</p>
      </div>
      
      <div className="flex items-center gap-2">
        {!card.owned && !inWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist();
            }}
            className="p-1.5 rounded-full bg-pink-500/10 text-pink-500 hover:bg-pink-500/20"
          >
            <Heart className="h-4 w-4" />
          </button>
        )}
        
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          card.owned ? 'bg-emerald-500' : 'border-2 border-muted-foreground/30'
        }`}>
          {card.owned && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>
    </motion.div>
  );
};

// Empty State
const EmptyState = ({ onBrowse }: { onBrowse: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-500/10 flex items-center justify-center">
        <Layers className="h-10 w-10 text-violet-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No Sets Being Tracked
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
        Track your progress completing TCG sets. Browse available sets to get started!
      </p>
      <Button
        onClick={onBrowse}
        className="bg-violet-500 hover:bg-violet-600 text-white font-semibold"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Browse Sets
      </Button>
    </motion.div>
  );
};

export default SetCompletion;
