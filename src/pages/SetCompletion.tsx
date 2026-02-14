import { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Layers, Plus, Trash2, ChevronRight, Check, X, Search, 
  RefreshCw, Heart, Filter, ArrowLeft, Grid, List, Target,
  TrendingUp, DollarSign, Sparkles, Star, Award, SortAsc,
  Settings, ChevronDown, Percent, Calendar
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import CardImage from "@/components/CardImage";
import { useSetCompletion, SetProgress, SetInfo, SetCard, SortOption, CardVariantFilter } from "@/hooks/useSetCompletion";
import { useWishlistDb } from "@/hooks/useWishlistDb";
import { useCelebration, triggerCelebration } from "@/components/Celebration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ViewMode = 'tracked' | 'browse' | 'checklist';
type TCGType = 'pokemon' | 'mtg' | 'yugioh';
type CardViewMode = 'grid' | 'list';

// Progress Ring Component
const ProgressRing = ({ 
  progress, 
  size = 80, 
  strokeWidth = 8,
  goalProgress,
  showGoal = true 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  goalProgress?: number;
  showGoal?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const goalOffset = goalProgress ? circumference - (Math.min(goalProgress, 100) / 100) * circumference : circumference;
  
  const isComplete = progress >= 100;
  const goalReached = goalProgress !== undefined && progress >= goalProgress;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Goal indicator (dashed) */}
        {showGoal && goalProgress && goalProgress < 100 && (
          <circle
            className="text-amber-500/40"
            strokeWidth={strokeWidth - 2}
            stroke="currentColor"
            strokeDasharray={`${strokeWidth} ${strokeWidth * 2}`}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDashoffset: goalOffset,
              transition: 'stroke-dashoffset 0.5s ease',
            }}
          />
        )}
        {/* Progress circle */}
        <circle
          className={cn(
            "transition-all duration-500 ease-out",
            isComplete ? "text-navy-500" : goalReached ? "text-amber-500" : "text-violet-500"
          )}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isComplete ? (
          <Award className="h-6 w-6 text-navy-500" />
        ) : (
          <span className={cn(
            "text-lg font-bold",
            goalReached ? "text-amber-500" : ""
          )}>
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  );
};

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
    sortTrackedSets,
    updateSetGoal,
    calculateCompletionStats,
    refetch,
  } = useSetCompletion();
  const { addItem: addToWishlist, isInWishlist } = useWishlistDb();
  const { celebrate } = useCelebration();
  
  const [viewMode, setViewMode] = useState<ViewMode>('tracked');
  const [selectedTcg, setSelectedTcg] = useState<TCGType>('pokemon');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('completion');
  
  // Browse sets
  const [browseSets, setBrowseSets] = useState<SetInfo[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [browseSortBy, setBrowseSortBy] = useState<'name' | 'release_date' | 'total_cards'>('release_date');
  
  // Checklist view
  const [selectedSet, setSelectedSet] = useState<SetProgress | null>(null);
  const [setCards, setSetCards] = useState<SetCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>('grid');
  const [cardFilter, setCardFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [variantFilter, setVariantFilter] = useState<CardVariantFilter>('all');
  const [completionStats, setCompletionStats] = useState<ReturnType<typeof calculateCompletionStats> | null>(null);
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<SetProgress | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedSetForGoal, setSelectedSetForGoal] = useState<SetProgress | null>(null);
  const [goalValue, setGoalValue] = useState(100);
  
  // Track previous completion for celebration
  const [previousCompletions, setPreviousCompletions] = useState<Map<string, number>>(new Map());

  // Fetch sets when TCG type changes
  useEffect(() => {
    if (viewMode === 'browse') {
      fetchSetsForTcg();
    }
  }, [selectedTcg, viewMode]);

  // Check for goal completion and celebrate
  useEffect(() => {
    trackedSets.forEach(set => {
      const previousCompletion = previousCompletions.get(set.set_id) || 0;
      const currentCompletion = set.completion_percentage;
      const goal = set.goal_percentage || 100;
      
      // Celebrate when reaching goal
      if (previousCompletion < goal && currentCompletion >= goal) {
        triggerCelebration('big');
      }
      // Celebrate 100% completion
      else if (previousCompletion < 100 && currentCompletion >= 100) {
        triggerCelebration('big');
      }
    });
    
    // Update previous completions
    const newMap = new Map<string, number>();
    trackedSets.forEach(set => {
      newMap.set(set.set_id, set.completion_percentage);
    });
    setPreviousCompletions(newMap);
  }, [trackedSets]);

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

  // Sort and filter tracked sets
  const sortedTrackedSets = useMemo(() => {
    let filtered = trackedSets;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.set_name.toLowerCase().includes(query));
    }
    return sortTrackedSets(filtered, sortBy);
  }, [trackedSets, sortBy, searchQuery, sortTrackedSets]);

  // Filter and sort browse sets
  const filteredBrowseSets = useMemo(() => {
    let filtered = browseSets;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(query));
    }
    
    // Sort browse sets
    return [...filtered].sort((a, b) => {
      switch (browseSortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'release_date':
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA;
        case 'total_cards':
          return b.total_cards - a.total_cards;
        default:
          return 0;
      }
    });
  }, [browseSets, searchQuery, browseSortBy]);

  // Handle set selection for checklist
  const handleSetClick = async (set: SetProgress) => {
    setSelectedSet(set);
    setViewMode('checklist');
    setLoadingCards(true);
    setSearchQuery('');
    setCardFilter('all');
    setVariantFilter('all');
    try {
      const cards = await fetchSetCards(set.set_id, set.tcg_type);
      setSetCards(cards);
      const stats = calculateCompletionStats(cards, set.owned_card_ids);
      setCompletionStats(stats);
    } finally {
      setLoadingCards(false);
    }
  };

  // Filter cards in checklist
  const filteredCards = useMemo(() => {
    let cards = setCards;
    
    // Ownership filter
    switch (cardFilter) {
      case 'owned':
        cards = cards.filter(c => c.owned);
        break;
      case 'missing':
        cards = cards.filter(c => !c.owned);
        break;
    }
    
    // Variant filter
    if (variantFilter !== 'all') {
      cards = cards.filter(c => c.variant_type === variantFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.number.toLowerCase().includes(query)
      );
    }
    return cards;
  }, [setCards, cardFilter, variantFilter, searchQuery]);

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

  const handleSetGoalClick = (set: SetProgress) => {
    setSelectedSetForGoal(set);
    setGoalValue(set.goal_percentage || 100);
    setGoalDialogOpen(true);
  };

  const confirmGoal = async () => {
    if (selectedSetForGoal) {
      await updateSetGoal(selectedSetForGoal.set_id, goalValue);
      setSelectedSetForGoal(null);
    }
    setGoalDialogOpen(false);
  };

  const handleCardToggle = async (card: SetCard) => {
    if (!selectedSet) return;
    
    const wasOwned = card.owned;
    await toggleCardOwned(selectedSet.set_id, card.id, !card.owned);
    
    // Update local state immediately for responsiveness
    const newCards = setCards.map(c => 
      c.id === card.id ? { ...c, owned: !c.owned } : c
    );
    setSetCards(newCards);
    
    // Recalculate stats
    const newOwnedIds = !wasOwned 
      ? [...(selectedSet.owned_card_ids || []), card.id]
      : (selectedSet.owned_card_ids || []).filter(id => id !== card.id);
    
    const stats = calculateCompletionStats(newCards, newOwnedIds);
    setCompletionStats(stats);
    
    // Mini celebration for expensive cards
    if (!wasOwned && card.price && card.price >= 50) {
      celebrate({ type: 'card-added', value: card.price });
    }
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
      current_price: card.price,
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Calculate stats
  const totalCards = trackedSets.reduce((sum, s) => sum + s.total_cards, 0);
  const totalOwned = trackedSets.reduce((sum, s) => sum + s.owned_cards, 0);
  const avgCompletion = trackedSets.length > 0 
    ? trackedSets.reduce((sum, s) => sum + s.completion_percentage, 0) / trackedSets.length 
    : 0;
  const completedSets = trackedSets.filter(s => s.completion_percentage >= 100).length;

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
                    setCompletionStats(null);
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
                      {completedSets > 0 && (
                        <span className="text-navy-500 ml-1">
                          • {completedSets} complete
                        </span>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {viewMode !== 'checklist' && (
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                {viewMode === 'tracked' && trackedSets.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        <SortAsc className="h-4 w-4" />
                        <span className="hidden sm:inline">Sort</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setSortBy('completion')}
                        className={sortBy === 'completion' ? 'bg-accent' : ''}
                      >
                        <Percent className="h-4 w-4 mr-2" />
                        Completion %
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortBy('name')}
                        className={sortBy === 'name' ? 'bg-accent' : ''}
                      >
                        <SortAsc className="h-4 w-4 mr-2" />
                        Name
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortBy('release_date')}
                        className={sortBy === 'release_date' ? 'bg-accent' : ''}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Release Date
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortBy('recently_added')}
                        className={sortBy === 'recently_added' ? 'bg-accent' : ''}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Recently Added
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
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
              variantFilter={variantFilter}
              searchQuery={searchQuery}
              stats={completionStats}
              onViewModeChange={setCardViewMode}
              onFilterChange={setCardFilter}
              onVariantFilterChange={setVariantFilter}
              onSearchChange={setSearchQuery}
              onCardToggle={handleCardToggle}
              onAddToWishlist={handleAddToWishlist}
              onSetGoal={() => handleSetGoalClick(selectedSet)}
              isInWishlist={isInWishlist}
              isCardOwned={(cardId) => isCardOwned(selectedSet.set_id, cardId)}
              formatCurrency={formatCurrency}
            />
          )}

          {/* Tracked Sets View */}
          {viewMode === 'tracked' && (
            <>
              {/* Search for tracked sets */}
              {trackedSets.length > 3 && (
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your sets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/30 border-none"
                  />
                </div>
              )}
              
              {sortedTrackedSets.length > 0 ? (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {sortedTrackedSets.map((set, index) => (
                      <SetProgressCard
                        key={set.id}
                        set={set}
                        index={index}
                        onClick={() => handleSetClick(set)}
                        onDelete={() => handleDeleteClick(set)}
                        onSetGoal={() => handleSetGoalClick(set)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : searchQuery ? (
                <div className="text-center py-16 text-muted-foreground">
                  No sets matching "{searchQuery}"
                </div>
              ) : (
                <EmptyState onBrowse={() => setViewMode('browse')} />
              )}
            </>
          )}

          {/* Browse Sets View */}
          {viewMode === 'browse' && (
            <>
              {/* TCG Filter + Search + Sort */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <Select value={selectedTcg} onValueChange={(v) => setSelectedTcg(v as TCGType)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select TCG" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pokemon">🔴 Pokémon</SelectItem>
                    <SelectItem value="mtg">⚫ Magic: The Gathering</SelectItem>
                    <SelectItem value="yugioh">🟡 Yu-Gi-Oh!</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/30 border-none"
                  />
                </div>
                
                <Select value={browseSortBy} onValueChange={(v) => setBrowseSortBy(v as any)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="release_date">Newest</SelectItem>
                    <SelectItem value="name">A-Z</SelectItem>
                    <SelectItem value="total_cards">Most Cards</SelectItem>
                  </SelectContent>
                </Select>
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

          {/* Goal Setting Dialog */}
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogContent className="bg-card border-2 border-border/50">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-500" />
                  Set Completion Goal
                </DialogTitle>
                <DialogDescription>
                  Set a goal for {selectedSetForGoal?.set_name}. You'll be celebrated when you reach it!
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-6 space-y-6">
                <div className="flex items-center justify-center">
                  <ProgressRing 
                    progress={selectedSetForGoal?.completion_percentage || 0}
                    goalProgress={goalValue}
                    size={120}
                    strokeWidth={12}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Goal: {goalValue}%</Label>
                    <Badge variant={goalValue === 100 ? "default" : "secondary"}>
                      {goalValue === 100 ? 'Full Completion' : `${goalValue}% Target`}
                    </Badge>
                  </div>
                  <Slider
                    value={[goalValue]}
                    onValueChange={(v) => setGoalValue(v[0])}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmGoal} className="gap-2">
                  <Target className="h-4 w-4" />
                  Set Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
  onSetGoal: () => void;
}

const SetProgressCard = ({ set, index, onClick, onDelete, onSetGoal }: SetProgressCardProps) => {
  const isComplete = set.completion_percentage >= 100;
  const goalReached = set.goal_percentage && set.completion_percentage >= set.goal_percentage;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-2xl border-2 cursor-pointer transition-all",
        isComplete
          ? 'bg-gradient-to-r from-navy-500/10 to-navy-500/5 border-navy-500/40'
          : goalReached
          ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/40'
          : 'bg-card/50 border-border/40 hover:border-primary/30'
      )}
    >
      {/* Complete Badge */}
      {isComplete && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-navy-600 to-navy-500 text-white text-xs font-bold shadow-lg flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3" />
          COMPLETE!
        </motion.div>
      )}
      
      {/* Goal Reached Badge */}
      {!isComplete && goalReached && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg flex items-center gap-1"
        >
          <Target className="h-3 w-3" />
          Goal!
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        {/* Progress Ring */}
        <ProgressRing 
          progress={set.completion_percentage} 
          goalProgress={set.goal_percentage}
          size={72}
          strokeWidth={6}
          showGoal={!!set.goal_percentage && set.goal_percentage < 100}
        />

        {/* Set Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {(set.set_logo_url || set.set_symbol_url) && (
              <CardImage
                src={set.set_logo_url || set.set_symbol_url || ''}
                alt=""
                size="xs"
                containerClassName="w-5 h-5"
                className="w-full h-full object-contain"
              />
            )}
            <h3 className="font-bold text-sm truncate">{set.set_name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground uppercase flex-shrink-0">
              {set.tcg_type}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {set.owned_cards} / {set.total_cards} cards
            {set.goal_percentage && set.goal_percentage < 100 && (
              <span className="text-amber-500 ml-2">
                • Goal: {set.goal_percentage}%
              </span>
            )}
          </p>
          
          {/* Linear Progress Bar */}
          <div className="mt-2">
            <Progress 
              value={set.completion_percentage} 
              className={cn(
                "h-1.5",
                isComplete ? '[&>div]:bg-navy-500' : goalReached ? '[&>div]:bg-amber-500' : ''
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSetGoal();
            }}
            className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all"
            whileTap={{ scale: 0.9 }}
          >
            <Target className="h-4 w-4" />
          </motion.button>
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
          <ChevronRight className="h-5 w-5 text-muted-foreground ml-1" />
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
      className="flex items-center gap-4 p-3 rounded-xl bg-card/50 border border-border/30 hover:border-border/50 transition-all"
    >
      {set.logo_url || set.symbol_url ? (
        <CardImage
          src={set.logo_url || set.symbol_url || ''}
          alt={set.name}
          size="sm"
          containerClassName="w-10 h-10"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
          <Layers className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{set.name}</h3>
        <p className="text-xs text-muted-foreground">
          {set.printed_total || set.total_cards} cards
          {set.release_date && ` • ${new Date(set.release_date).toLocaleDateString()}`}
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
  variantFilter: CardVariantFilter;
  searchQuery: string;
  stats: ReturnType<typeof useSetCompletion>['calculateCompletionStats'] extends (...args: any) => infer R ? R : never;
  onViewModeChange: (mode: CardViewMode) => void;
  onFilterChange: (filter: 'all' | 'owned' | 'missing') => void;
  onVariantFilterChange: (filter: CardVariantFilter) => void;
  onSearchChange: (query: string) => void;
  onCardToggle: (card: SetCard) => void;
  onAddToWishlist: (card: SetCard) => void;
  onSetGoal: () => void;
  isInWishlist: (cardId: string) => boolean;
  isCardOwned: (cardId: string) => boolean;
  formatCurrency: (value: number) => string;
}

const ChecklistView = ({
  set,
  cards,
  allCards,
  loading,
  viewMode,
  filter,
  variantFilter,
  searchQuery,
  stats,
  onViewModeChange,
  onFilterChange,
  onVariantFilterChange,
  onSearchChange,
  onCardToggle,
  onAddToWishlist,
  onSetGoal,
  isInWishlist,
  isCardOwned,
  formatCurrency,
}: ChecklistViewProps) => {
  const ownedCount = allCards.filter(c => c.owned).length;
  const missingCount = allCards.length - ownedCount;
  const isComplete = set.completion_percentage >= 100;
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted/20 rounded-xl animate-pulse" />
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
      {/* Set Header with Stats */}
      <div className={cn(
        "p-4 rounded-2xl border-2 transition-all",
        isComplete 
          ? "bg-gradient-to-r from-navy-500/10 to-navy-500/5 border-navy-500/40" 
          : "bg-card/50 border-border/30"
      )}>
        <div className="flex items-start gap-4">
          {/* Progress Ring */}
          <ProgressRing 
            progress={set.completion_percentage}
            goalProgress={set.goal_percentage}
            size={100}
            strokeWidth={10}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {(set.set_logo_url || set.set_symbol_url) && (
                <CardImage
                  src={set.set_logo_url || set.set_symbol_url || ''}
                  alt=""
                  size="sm"
                  containerClassName="w-8 h-8"
                  className="w-full h-full object-contain"
                />
              )}
              <h2 className="font-bold text-lg truncate">{set.set_name}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-lg bg-navy-500/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-navy-500" />
                </div>
                <div>
                  <p className="font-semibold">{ownedCount}</p>
                  <p className="text-xs text-muted-foreground">Owned</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <X className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <p className="font-semibold">{missingCount}</p>
                  <p className="text-xs text-muted-foreground">Missing</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Goal Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSetGoal}
            className="gap-1.5"
          >
            <Target className="h-4 w-4 text-amber-500" />
          </Button>
        </div>
        
        {/* Value Stats */}
        {stats && stats.cardsWithPrices > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-navy-500">
                {formatCurrency(stats.ownedValue)}
              </p>
              <p className="text-xs text-muted-foreground">Owned Value</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-rose-500">
                {formatCurrency(stats.missingValue)}
              </p>
              <p className="text-xs text-muted-foreground">Missing Value</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-violet-500">
                {formatCurrency(stats.estimatedCompletionCost)}
              </p>
              <p className="text-xs text-muted-foreground">To Complete</p>
            </div>
          </div>
        )}
        
        {/* Variant Stats */}
        {stats && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.variantStats)
                .filter(([_, v]) => v.total > 0)
                .map(([variant, data]) => (
                  <Badge 
                    key={variant}
                    variant={variantFilter === variant ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => onVariantFilterChange(variantFilter === variant ? 'all' : variant as CardVariantFilter)}
                  >
                    {variant.replace('_', ' ')}
                    <span className="ml-1 opacity-70">{data.owned}/{data.total}</span>
                  </Badge>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[180px] relative">
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
            <SelectItem value="owned">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-navy-500" />
                Owned ({ownedCount})
              </span>
            </SelectItem>
            <SelectItem value="missing">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                Missing ({missingCount})
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {/* View Mode */}
        <div className="flex rounded-lg border border-border/30 overflow-hidden">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "p-2 transition-colors",
              viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 hover:bg-muted/50'
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "p-2 transition-colors",
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 hover:bg-muted/50'
            )}
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
              formatCurrency={(v) => `$${v.toFixed(2)}`}
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
  const variantColors: Record<string, string> = {
    reverse_holo: 'from-blue-500/20 to-purple-500/20',
    holo: 'from-amber-500/20 to-yellow-500/20',
    secret_rare: 'from-pink-500/20 to-rose-500/20',
    promo: 'from-navy-500/20 to-navy-400/20',
    special: 'from-violet-500/20 to-indigo-500/20',
  };
  
  const variantGradient = card.variant_type && variantColors[card.variant_type];
  
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        "relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer transition-all",
        card.owned
          ? 'ring-2 ring-navy-500 shadow-lg shadow-navy-500/20'
          : 'opacity-50 grayscale hover:opacity-75 hover:grayscale-0',
        variantGradient && `bg-gradient-to-br ${variantGradient}`
      )}
    >
      <CardImage
        src={card.image_url}
        alt={card.name}
        size="md"
        containerClassName="w-full h-full"
        className="w-full h-full object-cover"
        loading="lazy"
        owned={card.owned}
      />
      
      {/* Owned Badge */}
      {card.owned && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-navy-500 flex items-center justify-center shadow-lg"
        >
          <Check className="h-3 w-3 text-white" />
        </motion.div>
      )}
      
      {/* Variant Badge */}
      {card.variant_type && card.variant_type !== 'normal' && (
        <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/60 text-[8px] text-white uppercase">
          {card.variant_type.replace('_', ' ')}
        </div>
      )}
      
      {/* Add to Wishlist (for missing cards) */}
      {!card.owned && !inWishlist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToWishlist();
          }}
          className="absolute bottom-6 right-1 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-lg"
        >
          <Heart className="h-3 w-3 text-white" />
        </button>
      )}
      
      {/* Price Badge */}
      {card.price && card.price > 0 && (
        <div className="absolute bottom-6 left-1 px-1 py-0.5 rounded bg-black/70 text-[8px] text-navy-400 font-medium">
          ${card.price.toFixed(2)}
        </div>
      )}
      
      {/* Card Number */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
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
  inWishlist,
  formatCurrency
}: { 
  card: SetCard; 
  onToggle: () => void; 
  onAddToWishlist: () => void;
  inWishlist: boolean;
  formatCurrency: (value: number) => string;
}) => {
  return (
    <motion.div
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
        card.owned
          ? 'bg-navy-500/10 border border-navy-500/30'
          : 'bg-muted/20 hover:bg-muted/30'
      )}
    >
      <div className={cn(
        "w-10 h-14 rounded overflow-hidden flex-shrink-0 transition-all",
        !card.owned && "grayscale opacity-50"
      )}>
        <CardImage
          src={card.image_url}
          alt={card.name}
          size="sm"
          containerClassName="w-full h-full"
          className="w-full h-full object-cover"
          owned={card.owned}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{card.name}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">#{card.number}</p>
          {card.rarity && (
            <span className="text-xs text-muted-foreground">• {card.rarity}</span>
          )}
          {card.variant_type && card.variant_type !== 'normal' && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {card.variant_type.replace('_', ' ')}
            </Badge>
          )}
          {card.price && card.price > 0 && (
            <span className="text-xs text-navy-500 font-medium">
              {formatCurrency(card.price)}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {!card.owned && !inWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist();
            }}
            className="p-1.5 rounded-full bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 transition-colors"
          >
            <Heart className="h-4 w-4" />
          </button>
        )}
        
        {inWishlist && !card.owned && (
          <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
        )}
        
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
          card.owned ? 'bg-navy-500' : 'border-2 border-muted-foreground/30'
        )}>
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
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
        <Layers className="h-12 w-12 text-violet-500" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Sets Being Tracked
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
        Track your progress completing TCG sets. Set goals and celebrate when you reach them!
      </p>
      <Button
        onClick={onBrowse}
        size="lg"
        className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold gap-2"
      >
        <Plus className="h-5 w-5" />
        Browse Sets
      </Button>
    </motion.div>
  );
};

export default SetCompletion;
