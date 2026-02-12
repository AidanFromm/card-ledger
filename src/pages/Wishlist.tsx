import { useState, useMemo } from "react";
import { Heart, Trash2, Package, Bell, DollarSign, Filter, Plus, RefreshCw, Search, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useWishlistDb, WishlistItem } from "@/hooks/useWishlistDb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";

type FilterType = 'all' | 'with-target' | 'no-target';

const Wishlist = () => {
  const navigate = useNavigate();
  const { 
    items, 
    loading, 
    removeItem, 
    moveToInventory,
    refetch,
    count,
  } = useWishlistDb();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Move to inventory dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<WishlistItem | null>(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  // Filter and search wishlist items
  const filteredItems = useMemo(() => {
    let results = items;
    
    // Apply filter
    switch (filter) {
      case 'with-target':
        results = results.filter(i => i.target_price && i.target_price > 0);
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
        i.set_name?.toLowerCase().includes(query)
      );
    }
    
    return results;
  }, [items, filter, searchQuery]);

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: items.length,
    'with-target': items.filter(i => i.target_price && i.target_price > 0).length,
    'no-target': items.filter(i => !i.target_price || i.target_price === 0).length,
  }), [items]);

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

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '—';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate total wishlist value
  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.current_price || 0), 0);
  }, [items]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted/30 rounded" />
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
              <div className="p-2.5 rounded-xl bg-pink-500/10">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Wishlist</h1>
                <p className="text-sm text-muted-foreground">
                  {count} cards • {formatCurrency(totalValue)} total
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

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search wishlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/30 border-none"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {(['all', 'with-target', 'no-target'] as FilterType[]).map((filterType) => {
              const isSelected = filter === filterType;
              const count = filterCounts[filterType];
              const labels = {
                all: 'All',
                'with-target': 'Has Target',
                'no-target': 'No Target',
              };
              const icons = {
                all: Heart,
                'with-target': DollarSign,
                'no-target': Star,
              };
              const Icon = icons[filterType];
              
              return (
                <motion.button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{labels[filterType]}</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    isSelected ? 'bg-primary-foreground/20' : 'bg-muted/50'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Wishlist Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    index={index}
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
              onSearch={() => navigate('/scan')} 
            />
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="bg-card border-2 border-border/50">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from Wishlist?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove {itemToDelete?.card_name} from your wishlist?
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
                <DialogTitle>Add to Collection</DialogTitle>
                <DialogDescription>
                  Moving {itemToMove?.card_name} to your collection.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {itemToMove?.image_url && (
                  <div className="flex justify-center">
                    <img
                      src={itemToMove.image_url}
                      alt={itemToMove.card_name}
                      className="w-32 h-auto rounded-lg border border-border/40"
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
                      Current market price: {formatCurrency(itemToMove.current_price)}
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
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isMoving ? 'Adding...' : 'Add to Collection'}
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

// Wishlist Card Component
interface WishlistCardProps {
  item: WishlistItem;
  index: number;
  onMove: () => void;
  onDelete: () => void;
  formatCurrency: (amount: number | null) => string;
  formatDate: (date: string) => string;
}

const WishlistCard = ({ item, index, onMove, onDelete, formatCurrency, formatDate }: WishlistCardProps) => {
  const hasTarget = item.target_price && item.target_price > 0;
  const priceHitTarget = hasTarget && item.current_price && item.current_price <= item.target_price!;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      className={`relative group rounded-2xl border-2 overflow-hidden bg-card/50 transition-all ${
        priceHitTarget
          ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
          : 'border-border/40 hover:border-primary/30'
      }`}
    >
      {/* Target Hit Badge */}
      {priceHitTarget && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-lg animate-pulse">
          TARGET HIT!
        </div>
      )}

      {/* Card Image */}
      <div className="aspect-[3/4] relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.card_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted/30 flex items-center justify-center">
            <Heart className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <motion.button
            onClick={onMove}
            className="p-2.5 rounded-full bg-emerald-500 text-white shadow-lg"
            whileTap={{ scale: 0.9 }}
            title="Add to Collection"
          >
            <Package className="h-5 w-5" />
          </motion.button>
          <motion.button
            onClick={onDelete}
            className="p-2.5 rounded-full bg-destructive text-white shadow-lg"
            whileTap={{ scale: 0.9 }}
            title="Remove"
          >
            <Trash2 className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{item.card_name}</h3>
        {item.set_name && (
          <p className="text-xs text-muted-foreground truncate">{item.set_name}</p>
        )}
        
        {/* Prices */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Market</span>
            <span className="text-sm font-bold">{formatCurrency(item.current_price)}</span>
          </div>
          {hasTarget && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Target</span>
              <span className={`text-xs font-semibold ${priceHitTarget ? 'text-emerald-500' : 'text-amber-500'}`}>
                {formatCurrency(item.target_price)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Empty State Component
const EmptyState = ({ hasItems, searchQuery, onSearch }: { hasItems: boolean; searchQuery: string; onSearch: () => void }) => {
  if (hasItems && searchQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No matches found
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Try adjusting your search or filters.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-pink-500/10 flex items-center justify-center">
        <Heart className="h-10 w-10 text-pink-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Your Wishlist is Empty
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
        Add cards you want to collect. Set target prices to get notified when prices drop!
      </p>
      <Button
        onClick={onSearch}
        className="bg-pink-500 hover:bg-pink-600 text-white font-semibold"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Search Cards
      </Button>
    </motion.div>
  );
};

export default Wishlist;
