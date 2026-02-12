import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Pencil, Trash2, Check, X, Loader2, Save, ExternalLink, 
  Share2, DollarSign, TrendingUp, TrendingDown, ChevronLeft,
  Calendar, Clock, AlertCircle, Minus, BellRing, Sparkles,
  ChevronRight, ImageIcon, Layers, Eye, Camera, RotateCcw, Award
} from "lucide-react";
import PriceAlertDialog from "@/components/PriceAlertDialog";
import SlabGeneratorModal from "@/components/SlabGeneratorModal";
import { SendToGradingDialog } from "@/components/SendToGradingDialog";
import { usePurchaseEntries } from "@/hooks/usePurchaseEntries";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { format } from "date-fns";
import { AddToInventoryDialog } from "./AddToInventoryDialog";
import { useToast } from "@/hooks/use-toast";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { supabase } from "@/integrations/supabase/client";
import { cleanCardName, getBaseName, cardNumbersMatch, getPlaceholderForItem } from "@/lib/cardNameUtils";
import { getChartData, hasEnoughHistory, formatSellingPrice } from "@/lib/priceHistory";
import { RAW_CONDITIONS, getGradeLabel } from "@/lib/gradingScales";
import { triggerHaptic, triggerSuccessHaptic } from "@/lib/haptics";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";
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
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// Extended condition options for detailed tracking
const DETAILED_CONDITIONS = [
  { value: 'mint', label: 'Mint', abbrev: 'M', description: 'Perfect condition, factory fresh', valueMultiplier: 1.0 },
  { value: 'near-mint', label: 'Near Mint', abbrev: 'NM', description: 'Minimal wear, crisp corners, no visible flaws', valueMultiplier: 1.0 },
  { value: 'lightly-played', label: 'Lightly Played', abbrev: 'LP', description: 'Minor edge wear, small scuffs, slight whitening', valueMultiplier: 0.85 },
  { value: 'moderately-played', label: 'Moderately Played', abbrev: 'MP', description: 'Noticeable wear, scratches, corner/edge damage', valueMultiplier: 0.70 },
  { value: 'heavily-played', label: 'Heavily Played', abbrev: 'HP', description: 'Major wear, creases, still identifiable', valueMultiplier: 0.50 },
  { value: 'damaged', label: 'Damaged', abbrev: 'DMG', description: 'Structural damage, tears, water damage', valueMultiplier: 0.30 },
];

// Quick Sell Slider Component
const PERCENT_OPTIONS = [50, 60, 70, 80, 90, 100] as const;
type PercentOption = typeof PERCENT_OPTIONS[number];

interface QuickSellSliderProps {
  value: PercentOption;
  onChange: (value: PercentOption) => void;
  marketPrice: number;
}

const QuickSellSlider = ({ value, onChange, marketPrice }: QuickSellSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getPercentFromPosition = (clientX: number): PercentOption => {
    if (!trackRef.current) return value;

    const rect = trackRef.current.getBoundingClientRect();
    const padding = 12;
    const trackWidth = rect.width - padding * 2;
    const x = clientX - rect.left - padding;
    const percentage = Math.max(0, Math.min(1, x / trackWidth));
    const index = Math.round(percentage * (PERCENT_OPTIONS.length - 1));
    const clampedIndex = Math.max(0, Math.min(PERCENT_OPTIONS.length - 1, index));
    return PERCENT_OPTIONS[clampedIndex];
  };

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    triggerHaptic('light');
    onChange(getPercentFromPosition(clientX));
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const newValue = getPercentFromPosition(clientX);
    if (newValue !== value) {
      triggerHaptic('light');
      onChange(newValue);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, value]);

  const selectedIndex = PERCENT_OPTIONS.indexOf(value);
  const ballPosition = (selectedIndex / (PERCENT_OPTIONS.length - 1)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground">Quick Sell</h4>
        <p className="text-2xl font-bold text-success" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatSellingPrice(marketPrice, value)}
        </p>
      </div>

      <div className="flex justify-between mb-1">
        {PERCENT_OPTIONS.map((percent) => (
          <button
            key={percent}
            onClick={() => { triggerHaptic('light'); onChange(percent); }}
            className={`text-xs transition-all min-w-[32px] py-1 px-2 rounded-full ${
              value === percent
                ? 'bg-primary text-primary-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {percent}%
          </button>
        ))}
      </div>

      <div
        ref={trackRef}
        className="relative h-8 cursor-pointer select-none touch-none"
        onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX); }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full bg-success transition-all"
          style={{ width: `${ballPosition}%` }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-success shadow-lg border-2 border-white dark:border-card"
          style={{ left: `${ballPosition}%` }}
          animate={{ scale: isDragging ? 1.2 : 1 }}
        />
      </div>
    </div>
  );
};

// Image Gallery Component
interface ImageGalleryProps {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onImageClick?: () => void;
  isLoading?: boolean;
}

const ImageGallery = ({ images, currentIndex, onIndexChange, onImageClick, isLoading }: ImageGalleryProps) => {
  const hasMultiple = images.length > 1;

  return (
    <div className="relative w-full aspect-[3/4] max-w-[280px] mx-auto">
      {/* Main Image */}
      <motion.div 
        className="relative w-full h-full cursor-pointer group"
        onClick={onImageClick}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10 rounded-2xl backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}
        
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt="Card"
            className="w-full h-full object-contain rounded-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Zoom hint overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Eye className="w-8 h-8 text-white drop-shadow-lg" />
        </div>

        {/* Navigation arrows for multiple images */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange(Math.max(0, currentIndex - 1)); triggerHaptic('light'); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange(Math.min(images.length - 1, currentIndex + 1)); triggerHaptic('light'); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </motion.div>

      {/* Thumbnail dots */}
      {hasMultiple && (
        <div className="flex justify-center gap-2 mt-3">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { onIndexChange(idx); triggerHaptic('light'); }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex 
                  ? 'bg-primary w-6' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface InventoryItem {
  id: string;
  name: string;
  set_name: string;
  card_number: string | null;
  card_image_url: string | null;
  quantity: number;
  purchase_price: number;
  market_price: number | null;
  condition?: string;
  raw_condition?: string | null;
  notes?: string | null;
  grading_company: string;
  grade: string | null;
  category: string | null;
}

interface ItemDetailDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSell?: () => void;
  onDelete?: () => void;
}

export const ItemDetailDialog = ({ item, open, onOpenChange, onSell, onDelete }: ItemDetailDialogProps) => {
  const { entries, loading, updateEntry, deleteEntry, refetch } = usePurchaseEntries(item?.id);
  const { updateItem, deleteItem, refetch: refetchInventory } = useInventoryDb();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false);
  const { toast } = useToast();

  // Edit item fields state
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editItemQuantity, setEditItemQuantity] = useState("");
  const [editItemPurchasePrice, setEditItemPurchasePrice] = useState("");
  const [editItemMarketPrice, setEditItemMarketPrice] = useState("");
  const [editItemCondition, setEditItemCondition] = useState("");
  const [editItemConditionNotes, setEditItemConditionNotes] = useState("");
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Image fetching state
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [localCategory, setLocalCategory] = useState<string | null>(null);
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Price alert dialog state
  const [showPriceAlertDialog, setShowPriceAlertDialog] = useState(false);

  // Slab generator modal state
  const [showSlabGenerator, setShowSlabGenerator] = useState(false);

  // Send to grading dialog state
  const [showSendToGrading, setShowSendToGrading] = useState(false);

  // Price display state
  const [valuePercent, setValuePercent] = useState<PercentOption>(100);
  const [priceChartRange, setPriceChartRange] = useState<'7D' | '30D' | '90D'>('30D');

  // Price history
  const { priceHistory, loading: priceHistoryLoading } = usePriceHistory({
    itemId: item?.id,
    days: priceChartRange === '7D' ? 7 : priceChartRange === '30D' ? 30 : 90,
  });

  // Initialize edit fields when item changes
  useEffect(() => {
    if (item) {
      setEditItemQuantity(item.quantity.toString());
      setEditItemPurchasePrice(item.purchase_price.toString());
      setEditItemMarketPrice(item.market_price?.toString() || "");
      setEditItemCondition(item.raw_condition || item.condition || "near-mint");
      setEditItemConditionNotes(item.notes || "");
      setLocalImageUrl(item.card_image_url);
      setLocalCategory(item.category);
      
      // Setup image gallery
      const images = [item.card_image_url].filter(Boolean) as string[];
      setImageGallery(images.length > 0 ? images : [getPlaceholderForItem({ category: item.category, grading_company: item.grading_company })]);
      setCurrentImageIndex(0);
    }
  }, [item]);

  // Auto-fetch image if missing
  useEffect(() => {
    if (open && item && !item.card_image_url && !localImageUrl && !isFetchingImage) {
      fetchImageForItem();
    }
  }, [item, open, localImageUrl]);

  // Smart image fetch
  const fetchImageForItem = async () => {
    if (!item) return;

    setIsFetchingImage(true);

    try {
      let imageUrl: string | null = null;
      const isSealed = item.category === 'sealed' ||
        /\b(etb|elite trainer|booster box|collection box|tin|bundle|pack)\b/i.test(item.name);

      const cleanedName = cleanCardName(item.name);
      const baseName = getBaseName(item.name);

      const searchVariations: string[] = [];

      if (isSealed) {
        if (item.set_name && !cleanedName.toLowerCase().includes(item.set_name.toLowerCase())) {
          searchVariations.push(`${item.set_name} ${cleanedName}`);
        }
        searchVariations.push(cleanedName);
      } else {
        if (item.card_number) {
          searchVariations.push(`${cleanedName} ${item.card_number.split('/')[0]}`);
        }
        if (item.set_name) {
          searchVariations.push(`${cleanedName} ${item.set_name}`);
        }
        searchVariations.push(cleanedName);
        if (item.card_number && baseName !== cleanedName) {
          searchVariations.push(`${baseName} ${item.card_number.split('/')[0]}`);
        }
        if (item.set_name && baseName !== cleanedName) {
          searchVariations.push(`${baseName} ${item.set_name}`);
        }
        if (baseName !== cleanedName) {
          searchVariations.push(baseName);
        }
        if (item.name !== cleanedName) {
          searchVariations.push(item.name);
        }
      }

      const uniqueQueries = [...new Set(searchVariations.filter(q => q && q.length > 2))];

      for (const searchQuery of uniqueQueries) {
        if (imageUrl) break;

        const { data, error } = await supabase.functions.invoke('products-search', {
          body: { query: searchQuery }
        });

        if (error || !data?.products || data.products.length === 0) continue;

        const withImages = data.products.filter((p: any) =>
          p.image_url && !p.image_url.includes('placehold')
        );

        if (withImages.length === 0) continue;

        let candidates = withImages;
        if (item.card_number) {
          const numberMatches = withImages.filter((p: any) =>
            cardNumbersMatch(item.card_number, p.card_number)
          );
          if (numberMatches.length > 0) {
            candidates = numberMatches;
          }
        }

        const scored = candidates.map((p: any) => {
          let score = p.relevance || 0;

          if (item.card_number && p.card_number && cardNumbersMatch(item.card_number, p.card_number)) {
            score += 50;
          }

          if (item.set_name && p.set_name) {
            const importedSet = item.set_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const apiSet = p.set_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (importedSet === apiSet) {
              score += 30;
            } else if (importedSet.includes(apiSet) || apiSet.includes(importedSet)) {
              score += 15;
            }
          }

          const apiCleanedName = cleanCardName(p.name || '').toLowerCase();
          const itemCleanedName = cleanedName.toLowerCase();
          if (apiCleanedName === itemCleanedName) {
            score += 25;
          } else if (apiCleanedName.includes(itemCleanedName) || itemCleanedName.includes(apiCleanedName)) {
            score += 15;
          }

          return { product: p, score };
        });

        scored.sort((a: any, b: any) => b.score - a.score);

        const best = scored[0];
        if (best && best.product.image_url) {
          imageUrl = best.product.image_url;
        }
      }

      if (imageUrl) {
        setLocalImageUrl(imageUrl);
        setImageGallery([imageUrl]);
        await updateItem(item.id, { card_image_url: imageUrl }, { silent: true });
        await refetchInventory();
        toast({ title: "Image saved!" });
      } else {
        toast({ title: "No image found", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to fetch image:', error);
      toast({ title: "Error fetching image", variant: "destructive" });
    } finally {
      setIsFetchingImage(false);
    }
  };

  if (!item) return null;

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate P&L
  const hasEntries = entries.length > 0;
  const totalPaid = hasEntries
    ? entries.reduce((sum, entry) => sum + (entry.purchase_price * entry.quantity), 0)
    : item.purchase_price * item.quantity;
  const totalPurchased = hasEntries
    ? entries.reduce((sum, entry) => sum + entry.quantity, 0)
    : item.quantity;
  const avgPrice = totalPurchased > 0 ? totalPaid / totalPurchased : item.purchase_price;
  const currentQuantity = hasEntries
    ? entries.reduce((sum, e) => sum + e.quantity, 0)
    : item.quantity;

  // P&L calculation
  const marketPrice = item.market_price || 0;
  const currentValue = marketPrice * currentQuantity;
  const totalGain = currentValue - totalPaid;
  const gainPercent = totalPaid > 0 ? (totalGain / totalPaid) * 100 : 0;
  const isUp = totalGain > 0;
  const isNeutral = Math.abs(gainPercent) < 1;

  // Condition value adjustment
  const conditionMultiplier = DETAILED_CONDITIONS.find(c => c.value === editItemCondition)?.valueMultiplier || 1.0;
  const adjustedValue = marketPrice * conditionMultiplier;

  const startEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditQuantity(entry.quantity.toString());
    setEditPrice(entry.purchase_price.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuantity("");
    setEditPrice("");
  };

  const saveEdit = async (entryId: string) => {
    try {
      const newQty = parseInt(editQuantity);
      const newPrice = parseFloat(editPrice);

      if (isNaN(newQty) || newQty <= 0 || isNaN(newPrice) || newPrice < 0) {
        toast({ title: "Invalid values", variant: "destructive" });
        return;
      }

      await updateEntry(entryId, { quantity: newQty, purchase_price: newPrice });
      await recalculateInventoryTotals();
      triggerSuccessHaptic();
      cancelEdit();
    } catch (error) {
      console.error("Failed to update entry:", error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
      await recalculateInventoryTotals();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const recalculateInventoryTotals = async () => {
    await refetch();
    
    if (!item) return;

    setTimeout(async () => {
      const { data: updatedEntries } = await supabase
        .from("purchase_entries")
        .select("*")
        .eq("inventory_item_id", item.id);

      if (updatedEntries && updatedEntries.length > 0) {
        const totalQty = updatedEntries.reduce((sum: number, e: any) => sum + e.quantity, 0);
        const totalCost = updatedEntries.reduce((sum: number, e: any) => sum + (e.purchase_price * e.quantity), 0);
        const avgPriceCalc = totalQty > 0 ? totalCost / totalQty : 0;

        await updateItem(item.id, { quantity: totalQty, purchase_price: avgPriceCalc });
      } else {
        await updateItem(item.id, { quantity: 0 });
      }
    }, 300);
  };

  const saveItemEdits = async () => {
    setIsSavingItem(true);
    try {
      const updates: any = {};

      const newQty = parseInt(editItemQuantity);
      const newPurchasePrice = parseFloat(editItemPurchasePrice);
      const newMarketPrice = editItemMarketPrice ? parseFloat(editItemMarketPrice) : null;

      if (isNaN(newQty) || newQty < 0) {
        toast({ title: "Invalid quantity", variant: "destructive" });
        return;
      }
      if (isNaN(newPurchasePrice) || newPurchasePrice < 0) {
        toast({ title: "Invalid purchase price", variant: "destructive" });
        return;
      }

      updates.quantity = newQty;
      updates.purchase_price = newPurchasePrice;
      updates.market_price = newMarketPrice;
      updates.condition = editItemCondition;
      updates.raw_condition = item.grading_company === 'raw' ? editItemCondition : null;
      updates.notes = editItemConditionNotes || null;

      await updateItem(item.id, updates);
      await refetchInventory();
      setIsEditingItem(false);
      triggerSuccessHaptic();
      toast({ title: "Changes saved" });
    } catch (error: any) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleDeleteItem = async () => {
    try {
      await deleteItem(item.id);
      triggerSuccessHaptic();
      toast({ title: "Item deleted" });
      onOpenChange(false);
      if (onDelete) onDelete();
    } catch (error: any) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: item.name,
        text: `Check out my ${item.name} - worth $${formatNumber(marketPrice)}!`,
        url: window.location.href,
      });
      triggerSuccessHaptic();
    } catch (error) {
      // User cancelled or not supported
      toast({ title: "Sharing not available" });
    }
  };

  const productForDialog = {
    id: item.id,
    name: item.name,
    set_name: item.set_name,
    card_number: item.card_number,
    image_url: localImageUrl || item.card_image_url,
    market_price: item.market_price,
    condition: item.condition,
    grading_company: item.grading_company,
    grade: item.grade,
  };

  const isGraded = item.grading_company !== 'raw' && item.grade;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg p-0 gap-0 h-[95vh] max-h-[900px] flex flex-col overflow-hidden bg-gradient-to-b from-background to-muted/20">
          {/* Premium Glass Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b bg-background/60 backdrop-blur-xl"
          >
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="gap-1 hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={handleShare} className="hover:bg-white/10">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-1 hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </motion.div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto pb-safe">
            {/* Hero Image Section with Premium Gradient */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative pt-6 pb-8"
            >
              {/* Ambient glow effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
              </div>
              
              <div className="relative px-4">
                <ImageGallery
                  images={imageGallery}
                  currentIndex={currentImageIndex}
                  onIndexChange={setCurrentImageIndex}
                  isLoading={isFetchingImage}
                  onImageClick={() => {
                    if (!localImageUrl && !isFetchingImage) {
                      fetchImageForItem();
                    }
                  }}
                />

                {/* Quick image actions */}
                {!localImageUrl && !isFetchingImage && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={fetchImageForItem}
                    className="flex items-center gap-2 mx-auto mt-4 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                  >
                    <Camera className="h-4 w-4" />
                    Find Image
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Content */}
            <div className="px-5 space-y-5">
              {/* Title & Grade - Premium Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative p-4 rounded-2xl bg-card/80 backdrop-blur-sm border shadow-lg"
              >
                <h1 className="text-xl font-bold leading-tight">{item.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.set_name}
                  {item.card_number && item.category !== 'sealed' && (
                    <span className="opacity-60"> #{item.card_number}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className={`
                    ${localCategory === 'sealed'
                      ? "border-purple-500/40 bg-purple-500/10 text-purple-400"
                      : isGraded
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                      : "border-secondary bg-secondary/10"
                    }
                  `}>
                    {localCategory === 'sealed' ? (
                      <><Layers className="w-3 h-3 mr-1" /> Sealed</>
                    ) : isGraded ? (
                      <><Sparkles className="w-3 h-3 mr-1" /> {item.grading_company.toUpperCase()} {item.grade}</>
                    ) : 'Raw'}
                  </Badge>
                  {item.grading_company === 'raw' && localCategory !== 'sealed' && (
                    <Badge variant="outline" className="bg-background/50">
                      {DETAILED_CONDITIONS.find(c => c.value === (item.raw_condition || item.condition))?.label || 'Near Mint'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-background/50">
                    Qty: {currentQuantity}
                  </Badge>
                </div>
              </motion.div>

              {/* Big Price & P&L Display - Robinhood Style Glass Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative p-5 rounded-2xl bg-card/80 backdrop-blur-sm border shadow-lg overflow-hidden"
              >
                {/* Subtle gradient overlay */}
                <div className={`absolute inset-0 opacity-5 ${isUp ? 'bg-gradient-to-br from-emerald-500' : 'bg-gradient-to-br from-red-500'} to-transparent`} />
                
                <div className="relative">
                  <p className="text-4xl font-bold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ${formatNumber(currentValue)}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <motion.div 
                      className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${
                        isNeutral 
                          ? 'text-muted-foreground bg-muted/50' 
                          : isUp 
                          ? 'text-emerald-500 bg-emerald-500/10' 
                          : 'text-red-500 bg-red-500/10'
                      }`}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      {isNeutral ? (
                        <Minus className="h-4 w-4" />
                      ) : isUp ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{isUp ? '+' : ''}${formatNumber(totalGain)} ({isUp ? '+' : ''}{gainPercent.toFixed(1)}%)</span>
                    </motion.div>
                    <span className="text-sm text-muted-foreground">All time</span>
                  </div>

                  {/* You paid → Now worth */}
                  <div className="flex items-center gap-2 mt-5 p-4 rounded-xl bg-muted/30 border">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">You paid</p>
                      <p className="text-xl font-bold mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${formatNumber(totalPaid)}
                      </p>
                    </div>
                    <motion.div 
                      className="text-2xl text-muted-foreground/50"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      →
                    </motion.div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Now worth</p>
                      <p className={`text-xl font-bold mt-1 ${isUp ? 'text-emerald-500' : isNeutral ? '' : 'text-red-500'}`}
                         style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${formatNumber(currentValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Price History Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border bg-card/80 backdrop-blur-sm p-4 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Price History</h3>
                  <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
                    {(['7D', '30D', '90D'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setPriceChartRange(range)}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                          priceChartRange === range
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                {priceHistoryLoading ? (
                  <div className="h-[120px] flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : hasEnoughHistory(priceHistory) ? (
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData(priceHistory, priceChartRange)}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            fontSize: '12px',
                            padding: '10px 14px',
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                          labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2} 
                          fill="url(#priceGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[80px] flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl">
                    <Clock className="h-5 w-5 text-muted-foreground/50 mb-1" />
                    <p className="text-xs text-muted-foreground">Price history will appear here</p>
                  </div>
                )}
              </motion.div>

              {/* Quick Sell Slider */}
              {marketPrice > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border bg-card/80 backdrop-blur-sm p-4 shadow-lg"
                >
                  <QuickSellSlider
                    value={valuePercent}
                    onChange={setValuePercent}
                    marketPrice={marketPrice * currentQuantity}
                  />
                </motion.div>
              )}

              {/* Item Details - Editable */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl border bg-card/80 backdrop-blur-sm p-4 shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Details</h3>
                  {!isEditingItem ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingItem(true)} className="h-8 gap-1">
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingItem(false)} className="h-8" disabled={isSavingItem}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={saveItemEdits} className="h-8 gap-1" disabled={isSavingItem}>
                        {isSavingItem ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                {isEditingItem ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editItemQuantity}
                          onChange={(e) => setEditItemQuantity(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Cost Paid</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editItemPurchasePrice}
                            onChange={(e) => setEditItemPurchasePrice(e.target.value)}
                            className="h-10 pl-7"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Market Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editItemMarketPrice}
                            onChange={(e) => setEditItemMarketPrice(e.target.value)}
                            placeholder="0.00"
                            className="h-10 pl-7"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Condition Picker (for raw cards) */}
                    {item.grading_company === 'raw' && localCategory !== 'sealed' && (
                      <div className="space-y-2">
                        <Label className="text-xs">Condition</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {DETAILED_CONDITIONS.map((condition) => (
                            <button
                              key={condition.value}
                              onClick={() => setEditItemCondition(condition.value)}
                              className={`p-2 rounded-lg border-2 text-center transition-all ${
                                editItemCondition === condition.value
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <span className="text-sm font-semibold">{condition.abbrev}</span>
                              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{condition.label}</p>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {DETAILED_CONDITIONS.find(c => c.value === editItemCondition)?.description}
                        </p>
                        {conditionMultiplier < 1 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <p className="text-xs">
                              Estimated value: ${formatNumber(adjustedValue)} ({(conditionMultiplier * 100).toFixed(0)}% of market)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Condition Notes */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        value={editItemConditionNotes}
                        onChange={(e) => setEditItemConditionNotes(e.target.value)}
                        placeholder="Add notes about condition, damage, etc..."
                        className="resize-none h-20"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="text-xl font-bold mt-1">{currentQuantity}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-xs text-muted-foreground">Avg. Cost</p>
                      <p className="text-xl font-bold mt-1">${formatNumber(avgPrice)}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <p className="text-xs text-muted-foreground">Each Worth</p>
                      <p className="text-xl font-bold mt-1 text-primary">${formatNumber(marketPrice)}</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Purchase History Timeline */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border bg-card/80 backdrop-blur-sm p-4 shadow-lg"
              >
                <h3 className="font-semibold text-sm mb-3">Purchase History</h3>
                {loading ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed rounded-xl">
                    <Calendar className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No purchase records yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry, index) => {
                      const isEditing = editingId === entry.id;
                      
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pl-6"
                        >
                          {/* Timeline line */}
                          {index < entries.length - 1 && (
                            <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-border" />
                          )}
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
                          
                          <div className={`p-3 rounded-xl border ${isEditing ? 'border-primary bg-primary/5' : 'bg-muted/20'}`}>
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">Quantity</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(e.target.value)}
                                      className="h-9"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Price Each</Label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        className="h-9 pl-7"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                  <Button size="sm" onClick={() => saveEdit(entry.id)}>Save</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold">
                                    {entry.quantity}× @ ${formatNumber(entry.purchase_price)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(entry.purchase_date), "MMM d, yyyy")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <p className="font-bold mr-2">${formatNumber(entry.purchase_price * entry.quantity)}</p>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(entry)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirmId(entry.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Where to Buy Links */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="rounded-2xl border bg-card/80 backdrop-blur-sm p-4 shadow-lg"
              >
                <h3 className="font-semibold text-sm mb-3">Where to Buy</h3>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-500 hover:from-orange-500/30 hover:to-orange-600/20 transition-all text-sm font-medium border border-orange-500/20"
                  >
                    TCGPlayer <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${item.name} ${item.set_name || ''}`.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-500 hover:from-blue-500/30 hover:to-blue-600/20 transition-all text-sm font-medium border border-blue-500/20"
                  >
                    eBay <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={`https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-500 hover:from-green-500/30 hover:to-green-600/20 transition-all text-sm font-medium border border-green-500/20"
                  >
                    Cardmarket <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </motion.div>

              {/* Premium Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 pb-6"
              >
                {/* Main action row */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => { triggerSuccessHaptic(); if (onSell) onSell(); }} 
                    className="h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                  >
                    <DollarSign className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Sell</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => { triggerHaptic('medium'); setShowSlabGenerator(true); }} 
                    className="h-14 border-2 border-purple-500/30 text-purple-500 hover:bg-purple-500/10 hover:border-purple-500/50"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Generate Slab</span>
                  </Button>
                </div>
                
                {/* Secondary action row */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Send to Grading - only show for raw cards */}
                  {item.grading_company === 'raw' && item.category !== 'sealed' && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSendToGrading(true)} 
                      className="h-12 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    >
                      <Award className="h-4 w-4 mr-1.5" />
                      Grade
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPriceAlertDialog(true)} 
                    className={`h-12 border-blue-500/30 text-blue-500 hover:bg-blue-500/10 ${item.grading_company !== 'raw' || item.category === 'sealed' ? 'col-span-1' : ''}`}
                  >
                    <BellRing className="h-4 w-4 mr-1.5" />
                    Alert
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="h-12">
                    <Share2 className="h-4 w-4 mr-1.5" />
                    Share
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteItemConfirm(true)} 
                    className="h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddToInventoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        product={productForDialog}
      />

      {/* Price Alert Dialog */}
      <PriceAlertDialog
        open={showPriceAlertDialog}
        onOpenChange={setShowPriceAlertDialog}
        card={{
          id: item.id,
          name: item.name,
          set_name: item.set_name,
          card_image_url: localImageUrl,
          market_price: item.market_price,
        }}
      />

      {/* Slab Generator Modal */}
      <SlabGeneratorModal
        open={showSlabGenerator}
        onOpenChange={setShowSlabGenerator}
        cardName={item.name}
        setName={item.set_name}
        cardNumber={item.card_number}
        cardImage={localImageUrl}
        year={item.set_name?.match(/\d{4}/)?.[0]}
        existingGrade={item.grade}
        existingCompany={item.grading_company !== 'raw' ? item.grading_company : null}
      />

      {/* Send to Grading Dialog */}
      <SendToGradingDialog
        open={showSendToGrading}
        onOpenChange={setShowSendToGrading}
        item={{
          id: item.id,
          name: item.name,
          set_name: item.set_name,
          card_number: item.card_number,
          card_image_url: localImageUrl,
        }}
      />

      {/* Delete Entry Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this purchase entry and recalculate your inventory totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteEntry(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={showDeleteItemConfirm} onOpenChange={setShowDeleteItemConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{item.name}</span> will be permanently removed from your inventory along with all purchase history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
