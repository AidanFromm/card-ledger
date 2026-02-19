import { useState, useEffect, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Check, X, ImageOff, Package, Loader2, Save, ExternalLink, ShoppingCart } from "lucide-react";
import { usePurchaseEntries } from "@/hooks/usePurchaseEntries";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { format } from "date-fns";
import { AddToInventoryDialog } from "./AddToInventoryDialog";
import { useToast } from "@/hooks/use-toast";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { supabase } from "@/integrations/supabase/client";
import { cleanCardName, getBaseName, cardNumbersMatch, getPlaceholderForItem } from "@/lib/cardNameUtils";
import { getChartData, hasEnoughHistory, getFirstRecordedDate, formatSellingPrice } from "@/lib/priceHistory";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
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
    const padding = 12; // Account for ball size
    const trackWidth = rect.width - padding * 2;
    const x = clientX - rect.left - padding;
    const percentage = Math.max(0, Math.min(1, x / trackWidth));
    const index = Math.round(percentage * (PERCENT_OPTIONS.length - 1));
    const clampedIndex = Math.max(0, Math.min(PERCENT_OPTIONS.length - 1, index));
    return PERCENT_OPTIONS[clampedIndex];
  };

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    onChange(getPercentFromPosition(clientX));
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    onChange(getPercentFromPosition(clientX));
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
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
  }, [isDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const selectedIndex = PERCENT_OPTIONS.indexOf(value);
  const ballPosition = (selectedIndex / (PERCENT_OPTIONS.length - 1)) * 100;

  return (
    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm text-muted-foreground">Quick Sell</h4>
        <p className="text-xl font-bold text-success" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatSellingPrice(marketPrice, value)}
        </p>
      </div>

      {/* Percentage labels */}
      <div className="flex justify-between mb-2">
        {PERCENT_OPTIONS.map((percent) => (
          <button
            key={percent}
            onClick={() => onChange(percent)}
            className={`text-xs transition-colors min-w-[32px] ${
              value === percent
                ? 'text-primary font-bold'
                : 'text-muted-foreground/70'
            }`}
          >
            {percent}%
          </button>
        ))}
      </div>

      {/* Track with draggable ball */}
      <div
        ref={trackRef}
        className="relative h-6 cursor-pointer select-none touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Track background (unfilled) */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-muted-foreground/20" />

        {/* Track fill (progress) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-primary"
          style={{ width: `${ballPosition}%` }}
        />

        {/* Draggable ball */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary shadow-md border-2 border-white dark:border-card ${
            isDragging ? 'scale-110 shadow-lg' : ''
          }`}
          style={{ left: `${ballPosition}%` }}
        />
      </div>
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
  grading_company: string;
  grade: string | null;
  category: string | null;
}

interface ItemDetailDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ItemDetailDialog = ({ item, open, onOpenChange }: ItemDetailDialogProps) => {
  const { entries, loading, updateEntry, deleteEntry, refetch } = usePurchaseEntries(item?.id);
  const { updateItem, refetch: refetchInventory } = useInventoryDb();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  // Edit item fields state
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editItemQuantity, setEditItemQuantity] = useState("");
  const [editItemPurchasePrice, setEditItemPurchasePrice] = useState("");
  const [editItemMarketPrice, setEditItemMarketPrice] = useState("");
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Image fetching state
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [localCategory, setLocalCategory] = useState<string | null>(null);

  // Price display state (50-100%)
  const [valuePercent, setValuePercent] = useState<50 | 60 | 70 | 80 | 90 | 100>(100);
  const [priceChartRange, setPriceChartRange] = useState<'7D' | '30D' | '90D'>('30D');

  // Price history hook
  const {
    priceHistory,
    loading: priceHistoryLoading,
  } = usePriceHistory({
    itemId: item?.id,
    days: priceChartRange === '7D' ? 7 : priceChartRange === '30D' ? 30 : 90,
  });

  // Initialize edit fields when item changes
  useEffect(() => {
    if (item) {
      setEditItemQuantity(item.quantity.toString());
      setEditItemPurchasePrice(item.purchase_price.toString());
      setEditItemMarketPrice(item.market_price?.toString() || "");
      setLocalImageUrl(item.card_image_url);
      setLocalCategory(item.category);
    }
  }, [item]);

  // Smart image fetch using products-search edge function (has caching & multiple sources)
  const fetchImageForItem = async () => {
    if (!item) return;

    setIsFetchingImage(true);
    console.log(`🔍 Fetching image for: "${item.name}" | Set: "${item.set_name}" | #${item.card_number || 'N/A'}`);

    try {
      let imageUrl: string | null = null;

      // Detect if this is a sealed product
      const isSealed = item.category === 'sealed' ||
        /\b(etb|elite trainer|booster box|collection box|tin|bundle|pack)\b/i.test(item.name);

      // ALWAYS clean the name - strip parenthetical and bracket content
      const cleanedName = cleanCardName(item.name);
      const baseName = getBaseName(item.name);

      // Build smarter search variations
      const searchVariations: string[] = [];

      if (isSealed) {
        // For sealed products: prioritize set name + cleaned name
        if (item.set_name && !cleanedName.toLowerCase().includes(item.set_name.toLowerCase())) {
          searchVariations.push(`${item.set_name} ${cleanedName}`);
        }
        searchVariations.push(cleanedName);
        if (/elite trainer/i.test(item.name)) {
          searchVariations.push(`${item.set_name} Elite Trainer Box Pokemon`);
          searchVariations.push(`${item.set_name} ETB`);
        } else if (/booster box/i.test(item.name)) {
          searchVariations.push(`${item.set_name} Booster Box Pokemon`);
        }
        console.log(`  📦 Sealed product detected, cleaned name: "${cleanedName}"`);
      } else {
        // For cards: build smarter search variations

        // 1. BEST: Full cleaned name + card number (most specific)
        if (item.card_number) {
          searchVariations.push(`${cleanedName} ${item.card_number.split('/')[0]}`);
        }

        // 2. Full cleaned name + set name
        if (item.set_name) {
          searchVariations.push(`${cleanedName} ${item.set_name}`);
        }

        // 3. Full cleaned name alone
        searchVariations.push(cleanedName);

        // 4. Base name + card number (for API variations)
        if (item.card_number && baseName !== cleanedName) {
          searchVariations.push(`${baseName} ${item.card_number.split('/')[0]}`);
        }

        // 5. Base name + set name
        if (item.set_name && baseName !== cleanedName) {
          searchVariations.push(`${baseName} ${item.set_name}`);
        }

        // 6. Base name alone (last resort)
        if (baseName !== cleanedName) {
          searchVariations.push(baseName);
        }

        // 7. Original name (in case cleaning removed important info)
        if (item.name !== cleanedName) {
          searchVariations.push(item.name);
        }

        console.log(`  🃏 Card detected, cleaned: "${cleanedName}", base: "${baseName}"`);
      }

      // Remove duplicates and empty strings
      const uniqueQueries = [...new Set(searchVariations.filter(q => q && q.length > 2))];

      // Try each search variation until we find an image
      for (const searchQuery of uniqueQueries) {
        if (imageUrl) break;

        console.log(`  📡 Searching: "${searchQuery}"`);

        const { data, error } = await supabase.functions.invoke('products-search', {
          body: { query: searchQuery }
        });

        if (error) {
          console.error('  ❌ Search error:', error.message);
          continue;
        }

        if (!data?.products || data.products.length === 0) {
          console.log('  ❌ No results found');
          continue;
        }

        console.log(`  📊 Found ${data.products.length} results`);

        // Filter to products with real images
        const withImages = data.products.filter((p: any) =>
          p.image_url && !p.image_url.includes('placehold')
        );

        if (withImages.length === 0) {
          console.log('  ⚠️ Results found but none have images');
          continue;
        }

        // If card has a number, ONLY consider results with matching numbers first
        let candidates = withImages;
        if (item.card_number) {
          const numberMatches = withImages.filter((p: any) =>
            cardNumbersMatch(item.card_number, p.card_number)
          );
          if (numberMatches.length > 0) {
            candidates = numberMatches;
            console.log(`  🎯 Found ${numberMatches.length} card number matches`);
          }
        }

        // Score remaining candidates by set name and name match
        interface ScoredProduct {
          product: any;
          score: number;
        }

        const scored: ScoredProduct[] = candidates.map((p: any) => {
          let score = p.relevance || 0;

          // Card number match bonus (already filtered, but add points for scoring)
          if (item.card_number && p.card_number && cardNumbersMatch(item.card_number, p.card_number)) {
            score += 50;
          }

          // Set name match
          if (item.set_name && p.set_name) {
            const importedSet = item.set_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const apiSet = p.set_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (importedSet === apiSet) {
              score += 30;
            } else if (importedSet.includes(apiSet) || apiSet.includes(importedSet)) {
              score += 15;
            }
          }

          // Name match (compare cleaned names)
          const apiCleanedName = cleanCardName(p.name || '').toLowerCase();
          const itemCleanedName = cleanedName.toLowerCase();
          if (apiCleanedName === itemCleanedName) {
            score += 25;
          } else if (apiCleanedName.includes(itemCleanedName) || itemCleanedName.includes(apiCleanedName)) {
            score += 15;
          }

          return { product: p, score };
        });

        // Sort by score
        scored.sort((a, b) => b.score - a.score);

        const best = scored[0];
        if (best && best.product.image_url) {
          imageUrl = best.product.image_url;
          console.log(`  ✅ Best match: "${best.product.name}" | ${best.product.set_name} | #${best.product.card_number || 'N/A'} (score: ${best.score.toFixed(1)})`);
        }
      }

      if (imageUrl) {
        console.log(`  💾 Saving image to database for item ${item.id}...`);
        setLocalImageUrl(imageUrl);

        // Save to database
        try {
          await updateItem(item.id, { card_image_url: imageUrl }, { silent: true });
          console.log(`  ✅ Database update successful!`);
        } catch (updateErr) {
          console.error(`  ❌ Database update FAILED:`, updateErr);
          toast({ title: "Failed to save image", description: String(updateErr), variant: "destructive" });
          return;
        }

        // Refresh inventory list so the grid shows the new image
        console.log(`  🔄 Refreshing inventory...`);
        await refetchInventory();
        console.log(`  ✅ Inventory refreshed!`);

        // Verify the save worked by checking the database directly
        const { data: verifyData } = await supabase
          .from('inventory_items')
          .select('card_image_url')
          .eq('id', item.id)
          .single();
        console.log(`  🔍 Verification - DB has card_image_url:`, verifyData?.card_image_url ? 'YES ✅' : 'NO ❌');

        toast({ title: "Image saved!", description: verifyData?.card_image_url ? "Image is now in your inventory." : "Image displayed but may not have saved." });
      } else {
        console.log('  ❌ No image found after all attempts');
        toast({ title: "No image found", description: "Try searching manually in the Search tab.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to fetch image:', error);
      toast({ title: "Error fetching image", variant: "destructive" });
    } finally {
      setIsFetchingImage(false);
    }
  };

  // Auto-fetch image if missing
  useEffect(() => {
    if (open && item && !item.card_image_url && !localImageUrl && !isFetchingImage) {
      fetchImageForItem();
    }
  }, [item, open, localImageUrl]);

  if (!item) return null;

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
        toast({
          title: "Invalid values",
          description: "Please enter valid quantity and price",
          variant: "destructive",
        });
        return;
      }

      await updateEntry(entryId, {
        quantity: newQty,
        purchase_price: newPrice,
      });

      // Recalculate inventory item totals
      await recalculateInventoryTotals();
      
      cancelEdit();
    } catch (error) {
      console.error("Failed to update entry:", error);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
      
      // Recalculate inventory item totals
      await recalculateInventoryTotals();
      
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const recalculateInventoryTotals = async () => {
    // Refetch entries to get updated data
    await refetch();
    
    if (!item) return;

    // Wait a bit for entries to update
    setTimeout(async () => {
      const { data: updatedEntries } = await supabase
        .from("purchase_entries")
        .select("*")
        .eq("inventory_item_id", item.id);

      if (updatedEntries && updatedEntries.length > 0) {
        const totalQty = updatedEntries.reduce((sum: number, e: any) => sum + e.quantity, 0);
        const totalCost = updatedEntries.reduce((sum: number, e: any) => sum + (e.purchase_price * e.quantity), 0);
        const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;

        await updateItem(item.id, {
          quantity: totalQty,
          purchase_price: avgPrice,
        });
      } else {
        // No entries left, set quantity to 0
        await updateItem(item.id, {
          quantity: 0,
        });
      }
    }, 300);
  };

  // Calculate from entries if available, otherwise use item values
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

  // Save item edits
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

      await updateItem(item.id, updates);
      await refetchInventory();
      setIsEditingItem(false);
      toast({ title: "Item updated", description: "Changes saved successfully" });
    } catch (error: any) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingItem(false);
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

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh] px-0 rounded-t-[28px]">
          {/* iOS-style grab handle is built into DrawerContent */}
          <DrawerHeader className="px-5 pb-1 pt-1">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-base font-semibold">Card Details</DrawerTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-1 border-primary/30 hover:border-primary/50 h-7 text-xs rounded-lg"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
          </DrawerHeader>

          {/* Scrollable content area */}
          <div className="overflow-y-auto px-5 pb-safe">
            <div className="space-y-3 pb-6">
          {/* Item Info */}
          <div className="flex gap-3 p-4 rounded-2xl bg-secondary/30 border border-border/20">
            <div className="w-20 h-28 flex-shrink-0 rounded border border-border/30 overflow-hidden relative group">
              {isFetchingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
              {localImageUrl ? (
                <img
                  src={localImageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <button
                  onClick={fetchImageForItem}
                  disabled={isFetchingImage}
                  className="w-full h-full flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer rounded overflow-hidden"
                >
                  <img
                    src={getPlaceholderForItem({ category: localCategory, grading_company: item.grading_company })}
                    alt="Placeholder"
                    className="w-full h-full object-contain p-1"
                  />
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base break-words leading-tight">
                {item.name}
                {item.card_number && item.grading_company !== 'sealed' && (
                  <span className="text-muted-foreground/60 text-sm"> #{item.card_number}</span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground mb-1.5">{item.set_name}</p>
              <div className="flex gap-2">
                <Badge variant="outline" className={
                  localCategory === 'sealed'
                    ? "border-chart-4/40 bg-chart-4/10 text-chart-4 font-semibold"
                    : localCategory === 'graded'
                    ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                    : "border-secondary/40 bg-secondary/10 text-secondary-foreground font-semibold"
                }>
                  {localCategory === 'sealed' ? 'Sealed' : item.grading_company === "raw" ? "Raw" : `${item.grading_company.toUpperCase()} ${item.grade || ""}`}
                </Badge>
                {item.grading_company === "raw" && localCategory !== 'sealed' && item.condition && (
                  <Badge variant="outline">
                    {item.condition.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Summary - with edit toggle */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Item Details</h4>
              {!isEditingItem ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingItem(true)}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingItem(false)}
                    className="h-7 px-2 text-xs"
                    disabled={isSavingItem}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={saveItemEdits}
                    className="h-7 px-2 text-xs gap-1"
                    disabled={isSavingItem}
                  >
                    {isSavingItem ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                  </Button>
                </div>
              )}
            </div>

            {isEditingItem ? (
              // Edit Mode
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editItemQuantity}
                    onChange={(e) => setEditItemQuantity(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cost Paid</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editItemPurchasePrice}
                      onChange={(e) => setEditItemPurchasePrice(e.target.value)}
                      className="h-9 pl-6"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Market Price</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editItemMarketPrice}
                      onChange={(e) => setEditItemMarketPrice(e.target.value)}
                      placeholder="0.00"
                      className="h-9 pl-6"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // View Mode - Compact with consistent pricing
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="text-lg font-bold font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{currentQuantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cost Basis</p>
                  <p className="text-lg font-bold text-muted-foreground/70 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>${formatNumber(avgPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold text-muted-foreground/70 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>${formatNumber(totalPaid)}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">Market Price</p>
                  <p className="text-2xl font-bold text-emerald-500 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.market_price ? `$${formatNumber(item.market_price)}` : 'Not available'}
                  </p>
                </div>
                {item.market_price && item.purchase_price > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">P&L</p>
                    {(() => {
                      const pl = (item.market_price - avgPrice) * currentQuantity;
                      const isUp = pl >= 0;
                      return (
                        <p className={`text-lg font-bold font-mono ${isUp ? 'text-emerald-500' : 'text-red-500'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {isUp ? '+' : ''}${formatNumber(pl)}
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 50-100% Value Toggle - Draggable Pill Slider */}
          {item.market_price && item.market_price > 0 && (
            <QuickSellSlider
              value={valuePercent}
              onChange={setValuePercent}
              marketPrice={item.market_price}
            />
          )}

          {/* Price History Chart */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Price History</h4>
              <div className="flex gap-1">
                {(['7D', '30D', '90D'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setPriceChartRange(range)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                      priceChartRange === range
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            {priceHistoryLoading ? (
              <div className="h-[100px] flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : hasEnoughHistory(priceHistory) ? (
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData(priceHistory, priceChartRange)}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '11px',
                        padding: '6px 10px',
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[60px] flex items-center justify-center text-center">
                <p className="text-xs text-muted-foreground">No price history yet</p>
              </div>
            )}
          </div>

          {/* Where to Buy Links */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/20">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Where to Buy</h4>
            <div className="flex flex-wrap gap-1.5">
              <a
                href={`https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(item.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
              >
                TCGPlayer
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${item.name} ${item.set_name || ''}`.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/50 text-foreground hover:bg-secondary/70 transition-colors text-xs font-medium"
              >
                eBay
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={`https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(item.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/50 text-foreground hover:bg-secondary/70 transition-colors text-xs font-medium"
              >
                Cardmarket
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Purchase Entries */}
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Purchase History</h4>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-4 border rounded-lg bg-muted/30">
                <Package className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No purchase history</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => {
                  const isEditing = editingId === entry.id;
                  
                  return (
                    <div
                      key={entry.id}
                      className="group flex items-center justify-between gap-3 p-3 border-2 border-border/40 rounded-lg bg-card hover:border-primary/50 transition-all"
                    >
                      {isEditing ? (
                        // Edit Mode
                        <>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Quantity</label>
                              <Input
                                type="number"
                                min="1"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Price Each</label>
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
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-success/20"
                              onClick={() => saveEdit(entry.id)}
                            >
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-destructive/20"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Qty {entry.quantity}</span>
                              <span className="text-sm text-muted-foreground">
                                @ ${formatNumber(entry.purchase_price)} each
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.purchase_date), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-bold">${formatNumber(entry.purchase_price * entry.quantity)}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-primary/20"
                              onClick={() => startEdit(entry)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20"
                              onClick={() => setDeleteConfirmId(entry.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
          </div>
        </DrawerContent>
      </Drawer>
    
    <AddToInventoryDialog
      open={isAddDialogOpen}
      onOpenChange={setIsAddDialogOpen}
      product={productForDialog}
    />

    <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Purchase Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove this purchase entry and recalculate your inventory totals. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
