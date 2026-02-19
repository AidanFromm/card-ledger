import { useState, useEffect, useMemo } from "react";
import { useBackgroundImageFetch } from "@/hooks/useBackgroundImageFetch";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Package, Award, Box, Grid3x3, CheckSquare, Square, DollarSign, Share2, RefreshCw, FileDown, Plus, Trophy, ImageIcon, ArrowUp, ArrowDownUp, List, GitCompareArrows, Printer, Edit3 } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { InventoryTableView } from "@/components/InventoryTableView";
import { CompareCards } from "@/components/CompareCards";
import { PrintExportDialog } from "@/components/PrintExportDialog";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { motion, AnimatePresence } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useScrydexPricing } from "@/hooks/useScrydexPricing";
import { ItemDetailDialog } from "@/components/ItemDetailDialog";
import RecordSaleDialog from "@/components/RecordSaleDialog";
import { CreateClientListDialog } from "@/components/CreateClientListDialog";
import { VirtualizedInventoryGrid } from "@/components/VirtualizedInventoryGrid";
import { useClientLists } from "@/hooks/useClientLists";
import { PageTransition } from "@/components/PageTransition";
import { SkeletonGrid } from "@/components/ui/skeleton-card";
import { EmptyInventory, EmptySearchResults } from "@/components/EmptyState";
import { Progress } from "@/components/ui/progress";
import { ImportExportDialog } from "@/components/ImportExportDialog";
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

const Inventory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, deleteItem, loading, refetch, updateItem } = useInventoryDb();
  const { createList } = useClientLists();
  const { isRefreshing, progress, refreshAllPrices } = useScrydexPricing();
  const [searchTerm, setSearchTerm] = useState("");
  const [gradingFilter, setGradingFilter] = useState<"all" | "raw" | "graded" | "sealed">("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [portfolioPercent, setPortfolioPercent] = useState<number>(100);
  const [selectedItem, setSelectedItem] = useState<typeof items[0] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemsForSale, setItemsForSale] = useState<typeof items>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkGrading, setBulkGrading] = useState<string>('');
  const [bulkCondition, setBulkCondition] = useState<string>('');
  const [sortBy, setSortBy] = useState<"valuable" | "gainers" | "losers" | "recent" | "alpha">("recent");

  const { isRunning: isFetchingImages, startBackgroundFetch } = useBackgroundImageFetch();

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (item.quantity === 0) return false;

      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.set_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((item as any).player && (item as any).player.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((item as any).team && (item as any).team.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesGrading =
        gradingFilter === "all" ||
        (gradingFilter === "raw" && item.grading_company === "raw" && item.category?.toLowerCase() !== "sealed") ||
        (gradingFilter === "graded" && item.grading_company !== "raw" && item.category?.toLowerCase() !== "sealed") ||
        (gradingFilter === "sealed" && item.category?.toLowerCase() === "sealed");

      const matchesSport = sportFilter === "all" || (item as any).sport === sportFilter;

      return matchesSearch && matchesGrading && matchesSport;
    });

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case "valuable":
        sorted.sort((a, b) => ((b.market_price || b.purchase_price) * b.quantity) - ((a.market_price || a.purchase_price) * a.quantity));
        break;
      case "gainers":
        sorted.sort((a, b) => {
          const aGain = a.market_price && a.purchase_price > 0 ? (a.market_price - a.purchase_price) / a.purchase_price : 0;
          const bGain = b.market_price && b.purchase_price > 0 ? (b.market_price - b.purchase_price) / b.purchase_price : 0;
          return bGain - aGain;
        });
        break;
      case "losers":
        sorted.sort((a, b) => {
          const aGain = a.market_price && a.purchase_price > 0 ? (a.market_price - a.purchase_price) / a.purchase_price : 0;
          const bGain = b.market_price && b.purchase_price > 0 ? (b.market_price - b.purchase_price) / b.purchase_price : 0;
          return aGain - bGain;
        });
        break;
      case "alpha":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "recent":
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return sorted;
  }, [items, searchTerm, gradingFilter, sportFilter, sortBy]);

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) newSelected.delete(itemId);
    else newSelected.add(itemId);
    setSelectedItems(newSelected);
  };

  const handleBulkSale = () => {
    setItemsForSale(items.filter(item => selectedItems.has(item.id)));
    setIsSaleDialogOpen(true);
  };

  const handleSingleSale = (item: typeof items[0]) => {
    setItemsForSale([item]);
    setIsSaleDialogOpen(true);
  };

  const handleSaleComplete = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
    setItemsForSale([]);
  };

  const handleCreateList = () => setIsListDialogOpen(true);

  const handleListCreate = async (listName: string, itemsWithQuantities: any[]) => {
    return await createList(listName, itemsWithQuantities);
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const handleSelectAll = () => {
    const allFilteredItemIds = filteredItems.map(item => item.id);
    const allSelected = allFilteredItemIds.every(id => selectedItems.has(id));
    setSelectedItems(allSelected ? new Set() : new Set(allFilteredItemIds));
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedItems).map(itemId => deleteItem(itemId)));
      setSelectedItems(new Set());
      setSelectionMode(false);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete items:", error);
    }
  };

  const handleBulkEdit = async () => {
    try {
      const updates: Record<string, any> = {};
      if (bulkGrading) updates.grading_company = bulkGrading;
      if (bulkCondition) updates.condition = bulkCondition;
      if (Object.keys(updates).length === 0) return;
      await Promise.all(
        Array.from(selectedItems).map(id => updateItem(id, updates))
      );
      toast({ title: `Updated ${selectedItems.size} items` });
      setIsBulkEditOpen(false);
      setBulkGrading('');
      setBulkCondition('');
      refetch();
    } catch (err) {
      toast({ title: 'Bulk edit failed', variant: 'destructive' });
    }
  };

  const handleRefreshPrices = async () => {
    await refreshAllPrices(filteredItems.filter(item => item.quantity > 0));
    refetch();
  };

  const handleFetchImages = () => startBackgroundFetch();

  const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filteredItems.reduce((sum, item) => {
    const price = item.market_price || item.purchase_price;
    return sum + price * item.quantity;
  }, 0);
  const totalCost = filteredItems.reduce((sum, item) => sum + item.purchase_price * item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <div className="mb-8">
            <div className="h-8 w-32 bg-muted/30 rounded-xl animate-pulse mb-3" />
            <div className="h-12 w-48 bg-muted/40 rounded-xl animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground/50 text-center mb-4">Loading your collection...</p>
          <SkeletonGrid count={12} />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <div className="flex items-center justify-between mb-4 gap-2">
              <h1 className="text-2xl font-bold tracking-tight flex-shrink-0">Inventory</h1>
              <div className="flex gap-1.5">
                {[
                  { icon: FileDown, onClick: () => setIsImportExportOpen(true), label: "Import", disabled: false },
                  { icon: ImageIcon, onClick: handleFetchImages, label: "Images", disabled: isFetchingImages },
                  { icon: RefreshCw, onClick: handleRefreshPrices, label: "Refresh", disabled: isRefreshing },
                  { icon: Printer, onClick: () => setIsPrintOpen(true), label: "Print", disabled: false },
                ].map(({ icon: Icon, onClick, label, disabled }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={onClick}
                    disabled={disabled}
                    className="gap-1 rounded-xl h-9 px-2.5 text-[11px] border-border/30 hover:bg-secondary/50"
                  >
                    <Icon className={`h-3.5 w-3.5 ${disabled ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Portfolio Value Card */}
            <motion.div className="card-clean-elevated rounded-3xl p-5">
              <div className="mb-4">
                <p className="label-metric mb-1.5">Portfolio Value</p>
                <p className="text-3xl font-bold text-emerald-500 font-mono" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  ${formatPrice(totalValue * (portfolioPercent / 100))}
                </p>
              </div>

              {/* Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-muted-foreground/40 px-0.5 font-medium">
                  <span>10%</span><span>30%</span><span>50%</span><span>70%</span><span>90%</span><span>100%</span>
                </div>
                <div className="relative h-1.5 bg-secondary/40 rounded-full">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
                    style={{ width: `${((portfolioPercent - 10) / 90) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="10" max="100" step="1"
                    value={portfolioPercent}
                    onChange={(e) => setPortfolioPercent(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute -top-7 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none"
                    style={{ left: `${((portfolioPercent - 10) / 90) * 100}%` }}
                  >
                    {portfolioPercent}%
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/30 border-2 border-white dark:border-card pointer-events-none"
                    style={{ left: `${((portfolioPercent - 10) / 90) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Price refresh progress */}
            {isRefreshing && progress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 card-clean-elevated rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-muted-foreground">
                    Updating... {progress.current}/{progress.total}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                    {progress.itemName}
                  </span>
                </div>
                <Progress value={(progress.current / progress.total) * 100} className="h-1" />
              </motion.div>
            )}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5 space-y-3"
          >
            {/* Filter Pills */}
            <div className="-mx-4 px-4">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {[
                  { key: 'all', label: 'All', icon: Grid3x3 },
                  { key: 'raw', label: 'Raw', icon: Package },
                  { key: 'graded', label: 'Graded', icon: Award },
                  { key: 'sealed', label: 'Sealed', icon: Box },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setGradingFilter(key as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                      gradingFilter === key
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'bg-secondary/30 text-muted-foreground/60 hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sport Filters */}
            {items.some((item: any) => item.sport) && (
              <div className="-mx-4 px-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 flex-shrink-0 pr-2 font-medium">
                    <Trophy className="h-3.5 w-3.5" />
                    <span>Sport:</span>
                  </div>
                  {['all', 'baseball', 'basketball', 'football', 'hockey', 'soccer'].map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSportFilter(sport)}
                      className={`px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                        sportFilter === sport
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'bg-secondary/30 text-muted-foreground/60 hover:bg-secondary/50'
                      }`}
                    >
                      {sport === 'all' ? 'All' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Mode */}
            {selectionMode && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/15">
                <div className="flex items-center gap-2 mr-auto">
                  <span className="text-sm font-semibold">{selectedItems.size} of {filteredItems.length} selected</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8 px-3 text-[11px] rounded-xl border-border/30">
                  {filteredItems.every(item => selectedItems.has(item.id)) ? 'Deselect All' : 'Select All'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearSelection} className="h-8 px-3 text-[11px] rounded-xl">
                  Cancel
                </Button>
              </div>
            )}

            {/* Inline bulk actions hidden - replaced by floating bar */}

            {/* Sort Control — Task 7 */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
              {[
                { key: 'recent', label: 'Recent' },
                { key: 'valuable', label: 'Most Valuable' },
                { key: 'gainers', label: 'Gainers' },
                { key: 'losers', label: 'Losers' },
                { key: 'alpha', label: 'A–Z' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key as any)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
                    sortBy === key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/30 text-muted-foreground/60 hover:bg-secondary/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search + Select */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
                <Input
                  placeholder="Search your collection..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-11 rounded-2xl bg-secondary/25 border-border/25 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              {/* View Toggle */}
              <div className="flex bg-secondary/30 rounded-xl p-0.5 h-11">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground/60'}`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground/60'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant={selectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedItems(new Set());
                }}
                className="h-11 px-4 text-[13px] font-semibold gap-1.5 rounded-2xl flex-shrink-0 border-border/30"
              >
                {selectionMode ? (
                  <><CheckSquare className="h-4 w-4" /><span>{selectedItems.size}</span></>
                ) : (
                  <><Square className="h-4 w-4" /><span>Select</span></>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {items.length === 0 ? (
              <EmptyInventory />
            ) : filteredItems.length === 0 ? (
              <EmptySearchResults />
            ) : viewMode === 'table' ? (
              <InventoryTableView
                items={filteredItems}
                selectionMode={selectionMode}
                selectedItems={selectedItems}
                onToggleSelect={toggleItemSelection}
                onOpenDetail={(item) => {
                  setSelectedItem(item);
                  setIsDetailOpen(true);
                }}
              />
            ) : (
              <VirtualizedInventoryGrid
                items={filteredItems}
                selectionMode={selectionMode}
                selectedItems={selectedItems}
                onToggleSelect={toggleItemSelection}
                onOpenDetail={(item) => {
                  setSelectedItem(item);
                  setIsDetailOpen(true);
                }}
                onSell={handleSingleSale}
                onDelete={deleteItem}
              />
            )}
          </motion.div>

          {/* Dialogs */}
          <ItemDetailDialog item={selectedItem} open={isDetailOpen} onOpenChange={setIsDetailOpen} />
          <RecordSaleDialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen} preselectedItems={itemsForSale} onSaleComplete={handleSaleComplete} />
          <CreateClientListDialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen} selectedItems={items.filter(item => selectedItems.has(item.id))} onCreateList={handleListCreate} onClearSelection={handleClearSelection} />

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="border-border/30 bg-card/95 backdrop-blur-xl rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-xl">
                  <Trash2 className="h-5 w-5 text-destructive" /> Delete Selected Items
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  Are you sure you want to delete {selectedItems.size} selected {selectedItems.size === 1 ? 'item' : 'items'}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border/30 rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl">
                  Delete {selectedItems.size} {selectedItems.size === 1 ? 'Item' : 'Items'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <ImportExportDialog open={isImportExportOpen} onOpenChange={setIsImportExportOpen} items={items} onImportComplete={refetch} />

          <CompareCards
            open={isCompareOpen}
            onOpenChange={setIsCompareOpen}
            items={items.filter(item => selectedItems.has(item.id))}
            allItems={items}
          />

          <PrintExportDialog
            open={isPrintOpen}
            onOpenChange={setIsPrintOpen}
            items={filteredItems}
          />

          {/* Bulk Edit Dialog */}
          <AlertDialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
            <AlertDialogContent className="border-border/30 bg-card/95 backdrop-blur-xl rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-xl">
                  <Edit3 className="h-5 w-5 text-primary" /> Bulk Edit {selectedItems.size} Items
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  Update fields for all selected items. Leave blank to skip.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Grading Company</label>
                  <select
                    value={bulkGrading}
                    onChange={e => setBulkGrading(e.target.value)}
                    className="w-full p-3 rounded-xl bg-secondary/25 border border-border/25 text-sm"
                  >
                    <option value="">Don't change</option>
                    <option value="raw">Raw</option>
                    <option value="psa">PSA</option>
                    <option value="bgs">BGS</option>
                    <option value="cgc">CGC</option>
                    <option value="sgc">SGC</option>
                    <option value="ace">ACE</option>
                    <option value="tag">TAG</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Condition</label>
                  <select
                    value={bulkCondition}
                    onChange={e => setBulkCondition(e.target.value)}
                    className="w-full p-3 rounded-xl bg-secondary/25 border border-border/25 text-sm"
                  >
                    <option value="">Don't change</option>
                    <option value="mint">Mint</option>
                    <option value="near-mint">Near Mint</option>
                    <option value="lightly-played">Lightly Played</option>
                    <option value="moderately-played">Moderately Played</option>
                    <option value="heavily-played">Heavily Played</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border/30 rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkEdit} className="bg-primary hover:bg-primary/90 rounded-xl">
                  Update {selectedItems.size} Items
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </PageTransition>

      {/* Floating Action Bar for Selected Items */}
      <AnimatePresence>
        {selectionMode && selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 max-w-lg mx-auto"
          >
            <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground">{selectedItems.size} selected</span>
                <button onClick={handleClearSelection} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsDeleteDialogOpen(true)} size="sm" variant="outline" className="flex-1 gap-1.5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs h-9">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                <Button onClick={handleBulkSale} size="sm" variant="outline" className="flex-1 gap-1.5 rounded-xl border-success/30 text-success hover:bg-success/10 text-xs h-9">
                  <DollarSign className="h-3.5 w-3.5" /> Sell
                </Button>
                <Button onClick={() => setIsBulkEditOpen(true)} size="sm" variant="outline" className="flex-1 gap-1.5 rounded-xl text-xs h-9">
                  <Edit3 className="h-3.5 w-3.5" /> Grade
                </Button>
                <Button onClick={() => setIsImportExportOpen(true)} size="sm" variant="outline" className="flex-1 gap-1.5 rounded-xl text-xs h-9">
                  <FileDown className="h-3.5 w-3.5" /> Export
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => navigate('/scan')}
        className="fixed bottom-28 right-4 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"
        style={{ boxShadow: '0 8px 24px hsl(212 100% 49% / 0.35)' }}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-28 left-4 md:bottom-8 z-40 h-11 w-11 rounded-2xl bg-secondary/80 text-foreground border border-border/20 flex items-center justify-center backdrop-blur-sm"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default Inventory;
