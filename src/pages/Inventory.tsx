import { useState, useEffect } from "react";
import { useBackgroundImageFetch } from "@/hooks/useBackgroundImageFetch";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Package, Award, Box, Grid3x3, CheckSquare, Square, DollarSign, Share2, RefreshCw, FileDown, Plus, TrendingUp, TrendingDown, Trophy, ImageIcon, ArrowUp } from "lucide-react";
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
import { ExportDialog } from "@/components/ExportDialog";
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
  const [portfolioPercent, setPortfolioPercent] = useState<number>(100); // Portfolio percentage view (100%, 90%, etc.)
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

  // Global background image fetch (runs app-wide)
  const { isRunning: isFetchingImages, startBackgroundFetch } = useBackgroundImageFetch();

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredItems = items.filter((item) => {
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

    const matchesSport =
      sportFilter === "all" ||
      (item as any).sport === sportFilter;

    return matchesSearch && matchesGrading && matchesSport;
  });

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkSale = () => {
    const itemsToSell = items.filter(item => selectedItems.has(item.id));
    setItemsForSale(itemsToSell);
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

  const handleCreateList = () => {
    setIsListDialogOpen(true);
  };

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

    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allFilteredItemIds));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedItems).map(itemId => deleteItem(itemId));
      await Promise.all(deletePromises);

      setSelectedItems(new Set());
      setSelectionMode(false);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete items:", error);
    }
  };

  const handleRefreshPrices = async () => {
    const itemsToRefresh = filteredItems.filter(item => item.quantity > 0);
    await refreshAllPrices(itemsToRefresh);
    refetch();
  };

  // Trigger global background image fetch
  const handleFetchImages = () => {
    startBackgroundFetch();
  };

  // Calculate totals for header
  const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filteredItems.reduce((sum, item) => {
    const price = item.market_price || item.purchase_price;
    return sum + price * item.quantity;
  }, 0);
  const totalCost = filteredItems.reduce((sum, item) => sum + item.purchase_price * item.quantity, 0);
  const totalProfit = totalValue - totalCost;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <div className="mb-8">
            <div className="h-10 w-48 bg-muted/40 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-64 bg-muted/30 rounded animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground text-center mb-4">Loading your collection...</p>
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
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Header with Expandable Stats */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <div className="flex items-center justify-between mb-3 gap-2">
              <h1 className="text-2xl font-bold flex-shrink-0">Inventory</h1>
              <div className="flex gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportExportOpen(true)}
                  className="gap-1 sm:gap-1.5 rounded-xl h-9 px-2.5 sm:px-3 text-xs"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFetchImages}
                  disabled={isFetchingImages}
                  className="gap-1 sm:gap-1.5 rounded-xl h-9 px-2.5 sm:px-3 text-xs"
                >
                  <ImageIcon className={`h-4 w-4 ${isFetchingImages ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">Images</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshPrices}
                  disabled={isRefreshing}
                  className="gap-1 sm:gap-1.5 rounded-xl h-9 px-2.5 sm:px-3 text-xs"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>

            {/* Portfolio Value Card */}
            <motion.div className="card-clean-elevated rounded-3xl p-4">
              {/* Value Display */}
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Portfolio Value</p>
                <p className="text-3xl font-bold text-success">
                  ${(totalValue * (portfolioPercent / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Percentage Slider */}
              <div className="space-y-1">
                {/* Percentage Labels */}
                <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                  <span>10%</span>
                  <span>30%</span>
                  <span>50%</span>
                  <span>70%</span>
                  <span>90%</span>
                  <span>100%</span>
                </div>

                {/* Slider Track */}
                <div className="relative h-2 bg-secondary/50 rounded-full">
                  {/* Filled Track */}
                  <div
                    className="absolute left-0 top-0 h-full bg-primary rounded-full"
                    style={{ width: `${((portfolioPercent - 10) / 90) * 100}%` }}
                  />
                  {/* Draggable Thumb */}
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={portfolioPercent}
                    onChange={(e) => setPortfolioPercent(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {/* Percentage Tooltip */}
                  <div
                    className="absolute -top-8 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded pointer-events-none"
                    style={{ left: `${((portfolioPercent - 10) / 90) * 100}%` }}
                  >
                    {portfolioPercent}%
                  </div>
                  {/* Visual Thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full shadow-lg border-2 border-white pointer-events-none"
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
                className="mt-3 p-3 card-clean rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Updating... {progress.current}/{progress.total}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {progress.itemName}
                  </span>
                </div>
                <Progress value={(progress.current / progress.total) * 100} className="h-1.5" />
              </motion.div>
            )}

          </motion.div>

          {/* Filters and Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            {/* Filter Chip Pills */}
            <div className="mb-4 -mx-4 px-4">
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
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      gradingFilter === key
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sport Filter Pills */}
            {items.some((item: any) => item.sport) && (
              <div className="mb-4 -mx-4 px-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-shrink-0 pr-2">
                    <Trophy className="h-4 w-4" />
                    <span>Sport:</span>
                  </div>
                  {['all', 'baseball', 'basketball', 'football', 'hockey', 'soccer'].map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSportFilter(sport)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                        sportFilter === sport
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                          : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      }`}
                    >
                      {sport === 'all' ? 'All' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Mode Actions */}
            {selectionMode && (
              <div className="flex flex-wrap items-center gap-2 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mr-auto">
                  <span className="text-sm font-medium">
                    {selectedItems.size} of {filteredItems.length} selected
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 px-3 text-xs rounded-lg"
                >
                  {filteredItems.every(item => selectedItems.has(item.id)) ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-8 px-3 text-xs rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Bulk Actions */}
            {selectionMode && selectedItems.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
              >
                <Button
                  onClick={handleBulkSale}
                  className="gap-2 bg-success/10 border border-success/30 text-success hover:bg-success/20"
                  variant="outline"
                >
                  <DollarSign className="h-4 w-4" />
                  Record Sale
                </Button>
                <Button
                  onClick={handleCreateList}
                  className="gap-2"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4" />
                  Create List
                </Button>
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="gap-2 bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </motion.div>
            )}

            {/* Search + Select */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-11 rounded-xl bg-secondary/30 border-border/50"
                />
              </div>
              <Button
                variant={selectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedItems(new Set());
                }}
                className="h-11 px-4 text-sm font-medium gap-1.5 rounded-xl flex-shrink-0"
              >
                {selectionMode ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    <span>{selectedItems.size}</span>
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    <span>Select</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {items.length === 0 ? (
              <EmptyInventory />
            ) : filteredItems.length === 0 ? (
              <EmptySearchResults />
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
          <ItemDetailDialog
            item={selectedItem}
            open={isDetailOpen}
            onOpenChange={setIsDetailOpen}
          />

          <RecordSaleDialog
            open={isSaleDialogOpen}
            onOpenChange={setIsSaleDialogOpen}
            preselectedItems={itemsForSale}
            onSaleComplete={handleSaleComplete}
          />

          <CreateClientListDialog
            open={isListDialogOpen}
            onOpenChange={setIsListDialogOpen}
            selectedItems={items.filter(item => selectedItems.has(item.id))}
            onCreateList={handleListCreate}
            onClearSelection={handleClearSelection}
          />

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-xl">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  Delete Selected Items
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  Are you sure you want to delete {selectedItems.size} selected {selectedItems.size === 1 ? 'item' : 'items'}?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Delete {selectedItems.size} {selectedItems.size === 1 ? 'Item' : 'Items'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <ImportExportDialog
            open={isImportExportOpen}
            onOpenChange={setIsImportExportOpen}
            items={items}
            onImportComplete={refetch}
          />
        </main>
      </PageTransition>

      {/* Floating Action Button for Quick Add */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/scan')}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 left-4 md:bottom-8 z-40 h-12 w-12 rounded-2xl bg-secondary/90 text-foreground shadow-lg border border-border/50 flex items-center justify-center backdrop-blur-sm"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default Inventory;
