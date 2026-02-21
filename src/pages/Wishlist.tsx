import { useState, useMemo, useCallback } from "react";
import {
  Heart,
  Trash2,
  Package,
  Bell,
  BellOff,
  BellRing,
  DollarSign,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Edit3,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  Sparkles,
  History,
  Target,
  Wallet,
  PiggyBank,
  ShoppingCart,
  StickyNote,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import BottomNav from "@/components/BottomNav";
import CardImage from "@/components/CardImage";
import { useWishlistDb, WishlistItem } from "@/hooks/useWishlistDb";
import { usePriceAlerts, PriceAlert } from "@/hooks/usePriceAlerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { useNavigate } from "react-router-dom";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
type Priority = 'high' | 'medium' | 'low';
type SortOption = 'recent' | 'price-high' | 'price-low' | 'priority' | 'price-drop' | 'target-gap';
type FilterType = 'all' | 'alerts-active' | 'target-hit' | 'no-target';

interface WishlistItemExtended extends WishlistItem {
  priority?: Priority;
  price_trend?: 'up' | 'down' | 'stable';
  price_change_percent?: number;
  lowest_price_30d?: number;
  alert?: PriceAlert | null;
}

// Priority colors and labels
const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🔥' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: '⭐' },
  low: { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: '📋' },
};

const Wishlist = () => {
  const navigate = useNavigate();
  const {
    items,
    loading,
    removeItem,
    updateItem,
    moveToInventory,
    refetch,
    count,
  } = useWishlistDb();

  const { alerts, getAlertForCard, createAlert, deleteAlert, triggeredAlerts } = usePriceAlerts();

  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Move to inventory dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<WishlistItem | null>(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<WishlistItem | null>(null);
  const [editTargetPrice, setEditTargetPrice] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Extend items with alert data and simulated price trends
  const extendedItems = useMemo<WishlistItemExtended[]>(() => {
    return items.map(item => {
      const alert = getAlertForCard(item.card_id);
      // Simulate price trends (in production, fetch from API)
      const priceChange = Math.random() * 20 - 10; // -10% to +10%
      const trend: 'up' | 'down' | 'stable' = priceChange > 2 ? 'up' : priceChange < -2 ? 'down' : 'stable';
      
      return {
        ...item,
        priority: (item.notes?.includes('[HIGH]') ? 'high' : 
                   item.notes?.includes('[LOW]') ? 'low' : 'medium') as Priority,
        price_trend: trend,
        price_change_percent: priceChange,
        lowest_price_30d: item.current_price ? item.current_price * (1 - Math.random() * 0.15) : undefined,
        alert,
      };
    });
  }, [items, getAlertForCard]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let results = extendedItems;

    // Apply filter
    switch (filter) {
      case 'alerts-active':
        results = results.filter(i => i.alert?.is_active);
        break;
      case 'target-hit':
        results = results.filter(i => i.target_price && i.current_price && i.current_price <= i.target_price);
        break;
      case 'no-target':
        results = results.filter(i => !i.target_price || i.target_price === 0);
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(i =>
        i.card_name.toLowerCase().includes(query) ||
        i.set_name?.toLowerCase().includes(query) ||
        i.notes?.toLowerCase().includes(query)
      );
    }

    // Apply price range
    results = results.filter(i => {
      const price = i.current_price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Apply sort
    switch (sortBy) {
      case 'price-high':
        results = [...results].sort((a, b) => (b.current_price || 0) - (a.current_price || 0));
        break;
      case 'price-low':
        results = [...results].sort((a, b) => (a.current_price || 0) - (b.current_price || 0));
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        results = [...results].sort((a, b) => 
          (priorityOrder[a.priority || 'medium']) - (priorityOrder[b.priority || 'medium'])
        );
        break;
      case 'price-drop':
        results = [...results].sort((a, b) => 
          (a.price_change_percent || 0) - (b.price_change_percent || 0)
        );
        break;
      case 'target-gap':
        results = [...results].sort((a, b) => {
          const gapA = a.target_price && a.current_price 
            ? ((a.current_price - a.target_price) / a.target_price) * 100 
            : 999;
          const gapB = b.target_price && b.current_price 
            ? ((b.current_price - b.target_price) / b.target_price) * 100 
            : 999;
          return gapA - gapB;
        });
        break;
      default:
        // 'recent' - already sorted by created_at desc from DB
        break;
    }

    return results;
  }, [extendedItems, filter, searchQuery, sortBy, priceRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCards = items.length;
    const totalCurrentValue = items.reduce((sum, i) => sum + (i.current_price || 0), 0);
    const totalTargetValue = items.reduce((sum, i) => sum + (i.target_price || i.current_price || 0), 0);
    const potentialSavings = totalCurrentValue - totalTargetValue;
    const itemsAtTarget = extendedItems.filter(i => 
      i.target_price && i.current_price && i.current_price <= i.target_price
    ).length;
    const activeAlerts = extendedItems.filter(i => i.alert?.is_active).length;

    return {
      totalCards,
      totalCurrentValue,
      totalTargetValue,
      potentialSavings,
      itemsAtTarget,
      activeAlerts,
    };
  }, [items, extendedItems]);

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: extendedItems.length,
    'alerts-active': extendedItems.filter(i => i.alert?.is_active).length,
    'target-hit': extendedItems.filter(i => i.target_price && i.current_price && i.current_price <= i.target_price).length,
    'no-target': extendedItems.filter(i => !i.target_price || i.target_price === 0).length,
  }), [extendedItems]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteClick = (item: WishlistItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await removeItem(itemToDelete.id);
      setItemToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleMoveClick = (item: WishlistItem) => {
    setItemToMove(item);
    setPurchasePrice(item.current_price?.toString() || '');
    setMoveDialogOpen(true);
  };

  const confirmMove = async () => {
    if (!itemToMove || !purchasePrice) return;

    setIsMoving(true);
    try {
      await moveToInventory(itemToMove.id, {
        name: itemToMove.card_name,
        set_name: itemToMove.set_name || 'Unknown Set',
        purchase_price: parseFloat(purchasePrice),
        card_image_url: itemToMove.image_url,
        quantity: 1,
        notes: itemToMove.notes,
      });
      setMoveDialogOpen(false);
      setItemToMove(null);
      setPurchasePrice('');
    } finally {
      setIsMoving(false);
    }
  };

  const handleEditClick = (item: WishlistItemExtended) => {
    setEditItem(item);
    setEditTargetPrice(item.target_price?.toString() || '');
    setEditPriority(item.priority || 'medium');
    setEditNotes(item.notes?.replace(/\[(HIGH|MEDIUM|LOW)\]/g, '').trim() || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setIsSaving(true);
    try {
      const priorityTag = `[${editPriority.toUpperCase()}]`;
      const notes = editNotes ? `${priorityTag} ${editNotes}` : priorityTag;
      
      await updateItem(editItem.id, {
        target_price: editTargetPrice ? parseFloat(editTargetPrice) : null,
        notes,
      });

      // Create or update price alert if target price is set
      if (editTargetPrice && parseFloat(editTargetPrice) > 0) {
        const existingAlert = getAlertForCard(editItem.card_id);
        if (!existingAlert) {
          await createAlert({
            card_id: editItem.card_id,
            card_name: editItem.card_name,
            set_name: editItem.set_name,
            card_image_url: editItem.image_url,
            current_price: editItem.current_price,
            target_price: parseFloat(editTargetPrice),
            direction: 'below',
          });
        }
      }

      setEditDialogOpen(false);
      setEditItem(null);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '—';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get max price for slider
  const maxPrice = useMemo(() => {
    const max = Math.max(...items.map(i => i.current_price || 0), 100);
    return Math.ceil(max / 100) * 100;
  }, [items]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <div className="flex">
          <DesktopSidebar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted/30 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted/20 rounded-xl" />
              ))}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 w-24 bg-muted/20 rounded-full" />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[3/4] bg-muted/20 rounded-xl" />
              ))}
            </div>
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
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Wishlist</h1>
                <p className="text-sm text-muted-foreground">
                  {count} cards tracked
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/scan')}
                className="gap-1.5 text-navy-400 hover:text-navy-300 hover:bg-navy-500/10"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Card</span>
              </Button>
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
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatsCard
              icon={Wallet}
              label="Current Value"
              value={formatCurrency(stats.totalCurrentValue)}
              color="navy"
            />
            <StatsCard
              icon={Target}
              label="Target Value"
              value={formatCurrency(stats.totalTargetValue)}
              color="amber"
            />
            <StatsCard
              icon={PiggyBank}
              label="Potential Savings"
              value={formatCurrency(stats.potentialSavings)}
              color="navy"
              highlight={stats.potentialSavings > 0}
            />
            <StatsCard
              icon={BellRing}
              label="Alerts Active"
              value={stats.activeAlerts.toString()}
              subtext={`${stats.itemsAtTarget} at target`}
              color="pink"
            />
          </div>

          {/* Target Hit Banner */}
          {stats.itemsAtTarget > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-gradient-to-r from-navy-500/10 via-navy-500/5 to-navy-500/10 border border-navy-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-navy-500/20">
                  <Sparkles className="h-5 w-5 text-navy-400" />
                </div>
                <div>
                  <p className="font-semibold text-navy-400">
                    🔔 {stats.itemsAtTarget} card{stats.itemsAtTarget > 1 ? 's' : ''} at or below target price!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Great time to buy - prices have dropped to your targets.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilter('target-hit')}
                  className="ml-auto border-navy-500/30 text-navy-400 hover:bg-navy-500/10"
                >
                  View
                </Button>
              </div>
            </motion.div>
          )}

          {/* Search and Filters Bar */}
          <div className="space-y-3 mb-6">
            <div className="flex gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/30 border-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    { value: 'recent', label: 'Recently Added' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'priority', label: 'Priority' },
                    { value: 'price-drop', label: 'Biggest Price Drop' },
                    { value: 'target-gap', label: 'Closest to Target' },
                  ].map(option => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={sortBy === option.value}
                      onCheckedChange={() => setSortBy(option.value as SortOption)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={`shrink-0 ${showFilters ? 'bg-navy-500/10 border-navy-500/30 text-navy-400' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Price Range: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                      </Label>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        max={maxPrice}
                        step={5}
                        className="py-2"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {([
              { key: 'all', label: 'All', icon: Heart },
              { key: 'alerts-active', label: 'Alerts On', icon: Bell },
              { key: 'target-hit', label: 'At Target', icon: Target },
              { key: 'no-target', label: 'No Target', icon: Star },
            ] as const).map(({ key, label, icon: Icon }) => {
              const isSelected = filter === key;
              const count = filterCounts[key];

              return (
                <motion.button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-navy-500 text-white'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    isSelected ? 'bg-white/20' : 'bg-muted/50'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Wishlist Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    index={index}
                    isExpanded={expandedCard === item.id}
                    onToggleExpand={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                    onEdit={() => handleEditClick(item)}
                    onMove={() => handleMoveClick(item)}
                    onDelete={() => handleDeleteClick(item)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState
              hasItems={items.length > 0}
              searchQuery={searchQuery}
              filter={filter}
              onSearch={() => navigate('/scan')}
              onClearFilters={() => {
                setFilter('all');
                setSearchQuery('');
                setPriceRange([0, maxPrice]);
              }}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="bg-card border-2 border-border/50">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from Wishlist?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove {itemToDelete?.card_name} from your wishlist? Any associated price alerts will also be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Move to Collection Dialog */}
          <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
            <DialogContent className="bg-card border-2 border-border/50">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-navy-500" />
                  Add to Collection
                </DialogTitle>
                <DialogDescription>
                  Moving {itemToMove?.card_name} to your collection.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {itemToMove?.image_url && (
                  <div className="flex justify-center">
                    <CardImage
                      src={itemToMove.image_url}
                      alt={itemToMove.card_name}
                      size="lg"
                      rounded="lg"
                      border
                      borderColor="border-border/40"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Purchase Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {itemToMove?.current_price && (
                    <p className="text-xs text-muted-foreground">
                      Market price: {formatCurrency(itemToMove.current_price)}
                      {itemToMove.target_price && ` • Target: ${formatCurrency(itemToMove.target_price)}`}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmMove}
                  disabled={!purchasePrice || isMoving}
                  className="bg-navy-500 hover:bg-navy-600"
                >
                  {isMoving ? 'Adding...' : 'Add to Collection'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Wishlist Item Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="bg-card border-2 border-border/50 max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-navy-500" />
                  Edit Wishlist Item
                </DialogTitle>
                <DialogDescription>
                  {editItem?.card_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                {/* Card Preview */}
                {editItem?.image_url && (
                  <div className="flex justify-center">
                    <CardImage
                      src={editItem.image_url}
                      alt={editItem.card_name}
                      size="lg"
                      rounded="lg"
                      border
                      borderColor="border-border/40"
                    />
                  </div>
                )}

                {/* Target Price */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-navy-400" />
                    Target Price
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Alert me when below..."
                      value={editTargetPrice}
                      onChange={(e) => setEditTargetPrice(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {editItem?.current_price && (
                    <p className="text-xs text-muted-foreground">
                      Current market price: {formatCurrency(editItem.current_price)}
                    </p>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['high', 'medium', 'low'] as Priority[]).map((p) => {
                      const config = PRIORITY_CONFIG[p];
                      const isSelected = editPriority === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setEditPriority(p)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `${config.bg} ${config.border} ${config.color}`
                              : 'border-border/50 bg-muted/20 text-muted-foreground hover:border-border'
                          }`}
                        >
                          <span className="text-lg">{config.icon}</span>
                          <p className="text-xs font-medium mt-1">{config.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-amber-400" />
                    Notes
                  </Label>
                  <Textarea
                    placeholder="Add notes about this card..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="resize-none h-20"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="bg-navy-500 hover:bg-navy-600"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </PageTransition>
      </div>
      <BottomNav />
    </div>
  );
};

// Stats Card Component
interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  color: 'navy' | 'amber' | 'pink';
  highlight?: boolean;
}

const StatsCard = ({ icon: Icon, label, value, subtext, color, highlight }: StatsCardProps) => {
  const colorClasses = {
    navy: 'from-navy-500/20 to-navy-400/10 border-navy-500/30 text-navy-400',
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    pink: 'from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border ${
        highlight ? 'ring-2 ring-navy-500/30' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${colorClasses[color].split(' ').pop()}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </motion.div>
  );
};

// Wishlist Card Component
interface WishlistCardProps {
  item: WishlistItemExtended;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number | null | undefined) => string;
  formatDate: (date: string) => string;
}

const WishlistCard = ({
  item,
  index,
  isExpanded,
  onToggleExpand,
  onEdit,
  onMove,
  onDelete,
  formatCurrency,
  formatDate,
}: WishlistCardProps) => {
  const hasTarget = item.target_price && item.target_price > 0;
  const priceHitTarget = hasTarget && item.current_price && item.current_price <= item.target_price!;
  const priceGap = hasTarget && item.current_price
    ? ((item.current_price - item.target_price!) / item.target_price!) * 100
    : null;

  const priorityConfig = PRIORITY_CONFIG[item.priority || 'medium'];

  // Generate TCGPlayer/eBay search links
  const tcgPlayerLink = `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(item.card_name)}`;
  const ebayLink = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(item.card_name + ' ' + (item.set_name || ''))}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.02 }}
      className={`relative rounded-2xl border-2 overflow-hidden bg-card/50 transition-all ${
        priceHitTarget
          ? 'border-navy-500/60 ring-2 ring-navy-500/20'
          : 'border-border/40 hover:border-navy-400/40'
      }`}
    >
      {/* Price Drop Badge */}
      {priceHitTarget && (
        <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-full bg-navy-500 text-white text-[10px] font-bold shadow-lg flex items-center gap-1">
          <BellRing className="h-3 w-3" />
          Price dropped!
        </div>
      )}

      {/* Priority Badge */}
      <div className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border} border`}>
        {priorityConfig.icon} {priorityConfig.label}
      </div>

      {/* Card Image */}
      <div className="aspect-[3/4] relative group">
        <CardImage
          src={item.image_url}
          alt={item.card_name}
          size="full"
          rounded="none"
          containerClassName="w-full h-full"
          className="w-full h-full object-cover"
          loading="lazy"
          showPrice={hasTarget}
          price={item.current_price}
        />

        {/* Price Trend Indicator */}
        {item.price_trend && item.price_trend !== 'stable' && (
          <div className={`absolute top-2 left-2 ${priceHitTarget ? 'top-10' : ''} p-1.5 rounded-lg backdrop-blur-sm ${
            item.price_trend === 'down' ? 'bg-navy-500/80' : 'bg-red-500/80'
          }`}>
            {item.price_trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-white" />
            ) : (
              <TrendingUp className="h-3 w-3 text-white" />
            )}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onEdit}
                className="p-2.5 rounded-full bg-navy-500 text-white shadow-lg"
                whileTap={{ scale: 0.9 }}
              >
                <Edit3 className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onMove}
                className="p-2.5 rounded-full bg-navy-500 text-white shadow-lg"
                whileTap={{ scale: 0.9 }}
              >
                <Package className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>Add to Collection</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onDelete}
                className="p-2.5 rounded-full bg-destructive text-white shadow-lg"
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>Remove</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{item.card_name}</h3>
        {item.set_name && (
          <p className="text-xs text-muted-foreground truncate">{item.set_name}</p>
        )}

        {/* Prices */}
        <div className="mt-3 space-y-2">
          {/* Current Price */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Market</span>
            <div className="flex items-center gap-1.5">
              {item.price_change_percent && Math.abs(item.price_change_percent) > 1 && (
                <span className={`text-[10px] font-medium ${
                  item.price_change_percent < 0 ? 'text-navy-400' : 'text-red-400'
                }`}>
                  {item.price_change_percent > 0 ? '+' : ''}{item.price_change_percent.toFixed(1)}%
                </span>
              )}
              <span className="text-base font-bold">{formatCurrency(item.current_price)}</span>
            </div>
          </div>

          {/* Target Price */}
          {hasTarget && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Target</span>
              <div className="flex items-center gap-1.5">
                {priceGap !== null && priceGap > 0 && (
                  <span className="text-[10px] text-amber-400">
                    {priceGap.toFixed(0)}% away
                  </span>
                )}
                <span className={`text-sm font-semibold ${
                  priceHitTarget ? 'text-navy-400' : 'text-navy-400'
                }`}>
                  {formatCurrency(item.target_price)}
                </span>
              </div>
            </div>
          )}

          {/* Price Comparison Bar */}
          {hasTarget && item.current_price && (
            <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (item.target_price! / item.current_price) * 100)}%`
                }}
                className={`absolute inset-y-0 left-0 rounded-full ${
                  priceHitTarget ? 'bg-navy-500' : 'bg-navy-500/60'
                }`}
              />
              {priceHitTarget && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          )}

          {/* Lowest Price Hint */}
          {item.lowest_price_30d && item.lowest_price_30d < (item.current_price || 0) && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <History className="h-3 w-3" />
              30d low: {formatCurrency(item.lowest_price_30d)}
            </p>
          )}
        </div>

        {/* Alert Status */}
        {item.alert && (
          <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-medium ${
            item.alert.is_active ? 'text-amber-400' : 'text-muted-foreground'
          }`}>
            {item.alert.is_active ? (
              <>
                <Bell className="h-3 w-3" />
                Alert active below {formatCurrency(item.alert.target_price)}
              </>
            ) : (
              <>
                <BellOff className="h-3 w-3" />
                Alert paused
              </>
            )}
          </div>
        )}

        {/* Expand/Collapse */}
        <button
          onClick={onToggleExpand}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              More
            </>
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-border/40 space-y-3">
                {/* Notes */}
                {item.notes && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Notes:</span>{' '}
                    {item.notes.replace(/\[(HIGH|MEDIUM|LOW)\]/g, '').trim()}
                  </div>
                )}

                {/* Buy Links */}
                <div className="flex gap-2">
                  <a
                    href={tcgPlayerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    TCGPlayer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={ebayLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    eBay
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Added {formatDate(item.created_at)}</span>
                  {item.rarity && <Badge variant="outline" className="text-[9px]">{item.rarity}</Badge>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Empty State Component
interface EmptyStateProps {
  hasItems: boolean;
  searchQuery: string;
  filter: FilterType;
  onSearch: () => void;
  onClearFilters: () => void;
}

const EmptyState = ({ hasItems, searchQuery, filter, onSearch, onClearFilters }: EmptyStateProps) => {
  if (hasItems && (searchQuery || filter !== 'all')) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
          <Filter className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No matches found
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
          Try adjusting your search or filters.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center">
        <Heart className="h-12 w-12 text-pink-500" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Your Wishlist is Empty
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        Add cards you're looking to buy. Set target prices and get notified when prices drop!
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onSearch}
          className="bg-gradient-to-r from-navy-600 to-navy-400 hover:from-navy-700 hover:to-navy-500 text-white font-semibold gap-2"
        >
          <Search className="h-4 w-4" />
          Search Cards
        </Button>
      </div>

      {/* Feature Highlights */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
        {[
          { icon: Target, title: 'Set Target Prices', desc: 'Define your ideal buy price for each card' },
          { icon: Bell, title: 'Price Alerts', desc: 'Get notified when prices drop to your target' },
          { icon: TrendingDown, title: 'Track Trends', desc: 'See price trends and find the best time to buy' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-4 rounded-xl bg-muted/20 border border-border/40">
            <Icon className="h-6 w-6 text-navy-400 mb-2" />
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Wishlist;
