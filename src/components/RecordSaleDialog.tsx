import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useSalesDb } from "@/hooks/useSalesDb";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Calendar, User, Store, Minus, Plus, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Platform options
const PLATFORMS = ["eBay", "TCGplayer", "Local", "Facebook", "Discord", "Other"] as const;
type Platform = typeof PLATFORMS[number];

interface RecordSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedItems?: Array<{
    id: string;
    name: string;
    set_name: string;
    card_number: string | null;
    purchase_price: number;
    quantity: number;
    market_price: number | null;
    card_image_url: string | null;
    condition: string;
    grading_company: string;
    grade: string | null;
  }>;
  onSaleComplete?: () => void;
}

const RecordSaleDialog = ({ open, onOpenChange, preselectedItems = [], onSaleComplete }: RecordSaleDialogProps) => {
  const { items: inventoryItems, updateItem } = useInventoryDb();
  const { addSale } = useSalesDb();
  const { toast } = useToast();

  // Filter out sold-out items (quantity = 0)
  const availableItems = preselectedItems.filter(item => item.quantity > 0);
  const isBulkSale = availableItems.length > 1;
  
  // Item selection mode (when preselectedItems is empty or has all inventory)
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  
  // Form state
  const [bulkSaleData, setBulkSaleData] = useState<Record<string, { quantity: string; salePrice: string }>>({});
  const [quantity, setQuantity] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleTag, setSaleTag] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [buyerName, setBuyerName] = useState("");
  const [saleDate, setSaleDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fees, setFees] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBulkTotal, setUseBulkTotal] = useState(false);
  const [bulkTotalPrice, setBulkTotalPrice] = useState("");

  // Format currency with commas
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Determine which items to work with
  const workingItems = availableItems.length > 0 
    ? availableItems 
    : inventoryItems
        .filter(item => item.quantity > 0 && selectedItemIds.has(item.id))
        .map(item => ({
          id: item.id,
          name: item.name,
          set_name: item.set_name,
          card_number: item.card_number,
          purchase_price: item.purchase_price,
          quantity: item.quantity,
          market_price: item.market_price,
          card_image_url: item.card_image_url,
          condition: item.condition || "NM",
          grading_company: item.grading_company || "raw",
          grade: item.grade,
        }));

  // Searchable inventory items
  const searchableItems = inventoryItems.filter(item => {
    if (item.quantity <= 0) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(query) || 
           item.set_name.toLowerCase().includes(query);
  });

  // Initialize data when available items change
  const lastItemIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (workingItems.length === 1) {
      const currentId = workingItems[0].id;
      if (lastItemIdRef.current !== currentId) {
        setQuantity("");
        setSalePrice("");
        lastItemIdRef.current = currentId;
      }
    } else if (workingItems.length > 1) {
      const needsInit = workingItems.some(item => !bulkSaleData[item.id]) ||
        Object.keys(bulkSaleData).length !== workingItems.length;
      if (needsInit) {
        const initialData: Record<string, { quantity: string; salePrice: string }> = {};
        workingItems.forEach(item => {
          initialData[item.id] = { quantity: "", salePrice: "" };
        });
        setBulkSaleData(initialData);
      }
    }
  }, [JSON.stringify(workingItems.map(i => i.id).sort())]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      // If no preselected items, show the item selector
      if (preselectedItems.length === 0) {
        setShowItemSelector(true);
      } else {
        setShowItemSelector(false);
      }
    }
  }, [open, preselectedItems.length]);

  const selectedItem = workingItems.length === 1 ? workingItems[0] : null;
  
  const purchasePrice = selectedItem?.purchase_price || 0;
  const quantityNum = parseInt(quantity) || 0;
  const feesNum = parseFloat(fees) || 0;
  const salePriceNum = parseFloat(salePrice) || 0;
  const profit = salePrice ? salePriceNum - purchasePrice - (feesNum / Math.max(quantityNum, 1)) : 0;

  // FIFO: Deduct sold quantity from purchase entries
  const deductFromPurchaseEntries = async (inventoryItemId: string, soldQuantity: number) => {
    const { data: entries, error } = await supabase
      .from('purchase_entries')
      .select('*')
      .eq('inventory_item_id', inventoryItemId)
      .order('purchase_date', { ascending: true });

    if (error || !entries) {
      console.error('Error fetching purchase entries:', error);
      return;
    }

    let remainingToDeduct = soldQuantity;

    for (const entry of entries) {
      if (remainingToDeduct <= 0) break;

      if (entry.quantity <= remainingToDeduct) {
        remainingToDeduct -= entry.quantity;
        await supabase
          .from('purchase_entries')
          .delete()
          .eq('id', entry.id);
      } else {
        const newQuantity = entry.quantity - remainingToDeduct;
        remainingToDeduct = 0;
        await supabase
          .from('purchase_entries')
          .update({ quantity: newQuantity })
          .eq('id', entry.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (workingItems.length > 1) {
      await handleBulkSaleSubmit();
    } else {
      await handleSingleSaleSubmit();
    }
  };

  const handleSingleSaleSubmit = async () => {
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Please select an item",
        variant: "destructive",
      });
      return;
    }

    const quantityNum = parseInt(quantity);
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    if (quantityNum > selectedItem.quantity) {
      toast({
        title: "Error",
        description: "Sale quantity exceeds available inventory",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const salePriceNum = parseFloat(salePrice);
      const feesNum = parseFloat(fees) || 0;
      const feePerUnit = feesNum / quantityNum;
      const profitPerUnit = salePriceNum - purchasePrice - feePerUnit;
      
      await addSale({
        inventory_item_id: selectedItem.id,
        item_name: selectedItem.name,
        quantity_sold: quantityNum,
        purchase_price: purchasePrice,
        sale_price: salePriceNum,
        profit: profitPerUnit,
        platform: platform || undefined,
        client_name: buyerName || undefined,
        notes: saleTag || notes || undefined,
        sale_date: saleDate,
        card_image_url: selectedItem.card_image_url || undefined,
        set_name: selectedItem.set_name,
        condition: selectedItem.condition,
        grading_company: selectedItem.grading_company,
        grade: selectedItem.grade || undefined,
        fees: feesNum > 0 ? feesNum : undefined,
      } as any);

      await deductFromPurchaseEntries(selectedItem.id, quantityNum);

      const newQuantity = selectedItem.quantity - quantityNum;
      await updateItem(selectedItem.id, {
        quantity: newQuantity,
      });

      toast({
        title: "Sale recorded",
        description: `${quantityNum}x ${selectedItem.name} sold successfully`,
      });

      resetForm();
      onOpenChange(false);
      onSaleComplete?.();
    } catch (error) {
      console.error("Error recording sale:", error);
      toast({
        title: "Error",
        description: "Failed to record sale",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSaleSubmit = async () => {
    setLoading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      const saleGroupId = crypto.randomUUID();

      let itemSalePrices: Record<string, number> = {};
      
      if (useBulkTotal) {
        const totalPrice = parseFloat(bulkTotalPrice);
        if (isNaN(totalPrice) || totalPrice <= 0) {
          toast({
            title: "Error",
            description: "Please enter a valid total sale price",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const totalPurchaseCost = workingItems.reduce((sum, item) => {
          const itemQuantity = parseInt(bulkSaleData[item.id]?.quantity) || 0;
          return sum + (item.purchase_price * itemQuantity);
        }, 0);

        workingItems.forEach(item => {
          const itemQuantity = parseInt(bulkSaleData[item.id]?.quantity) || 0;
          const itemPurchaseCost = item.purchase_price * itemQuantity;
          const proportion = itemPurchaseCost / totalPurchaseCost;
          const itemTotalSale = totalPrice * proportion;
          itemSalePrices[item.id] = itemTotalSale / itemQuantity;
        });
      }

      const totalFees = parseFloat(fees) || 0;
      const totalItems = workingItems.reduce((sum, item) => {
        return sum + (parseInt(bulkSaleData[item.id]?.quantity) || 0);
      }, 0);
      const feePerItem = totalItems > 0 ? totalFees / totalItems : 0;

      for (const item of workingItems) {
        const itemData = bulkSaleData[item.id];
        const itemQuantity = parseInt(itemData?.quantity) || 0;
        
        const salePricePerUnit = useBulkTotal 
          ? itemSalePrices[item.id]
          : parseFloat(itemData?.salePrice);
        
        if (itemQuantity <= 0 || isNaN(salePricePerUnit)) {
          failCount++;
          continue;
        }

        if (itemQuantity > item.quantity) {
          toast({
            title: "Error",
            description: `${item.name}: Sale quantity exceeds available inventory`,
            variant: "destructive",
          });
          failCount++;
          continue;
        }

        try {
          const profitPerUnit = salePricePerUnit - item.purchase_price - feePerItem;
          
          await addSale({
            inventory_item_id: item.id,
            item_name: item.name,
            quantity_sold: itemQuantity,
            purchase_price: item.purchase_price,
            sale_price: salePricePerUnit,
            profit: profitPerUnit,
            platform: platform || undefined,
            client_name: buyerName || undefined,
            notes: saleTag || notes || undefined,
            sale_date: saleDate,
            sale_group_id: saleGroupId,
            card_image_url: item.card_image_url || undefined,
            set_name: item.set_name,
            condition: item.condition,
            grading_company: item.grading_company,
            grade: item.grade || undefined,
            fees: feePerItem > 0 ? feePerItem * itemQuantity : undefined,
          } as any);

          await deductFromPurchaseEntries(item.id, itemQuantity);

          const newQuantity = item.quantity - itemQuantity;
          await updateItem(item.id, {
            quantity: newQuantity,
          });

          successCount++;
        } catch (error) {
          console.error(`Error recording sale for ${item.name}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Bulk sale recorded",
          description: `${successCount} item(s) sold successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      } else if (failCount > 0) {
        toast({
          title: "Error",
          description: "Failed to record sales. Please check quantities and try again.",
          variant: "destructive",
        });
      }

      if (failCount === 0) {
        resetForm();
        onOpenChange(false);
        onSaleComplete?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuantity("");
    setSalePrice("");
    setSaleTag("");
    setPlatform("");
    setBuyerName("");
    setSaleDate(format(new Date(), "yyyy-MM-dd"));
    setFees("");
    setNotes("");
    setBulkSaleData({});
    setUseBulkTotal(false);
    setBulkTotalPrice("");
    setSelectedItemIds(new Set());
    setSearchQuery("");
    setShowItemSelector(false);
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItemIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItemIds(newSelected);
  };

  // Quick quantity button helper
  const getQuickQuantities = (maxQty: number) => {
    const half = Math.floor(maxQty / 2);
    return [
      { label: '1', value: 1 },
      { label: '5', value: Math.min(5, maxQty) },
      { label: '½', value: half > 0 ? half : 1 },
      { label: 'All', value: maxQty },
    ].filter((q, i, arr) => {
      return arr.findIndex(x => x.value === q.value) === i && q.value <= maxQty;
    });
  };

  // Calculate totals for bulk
  const bulkTotals = useMemo(() => {
    if (workingItems.length <= 1) return null;
    
    let totalQuantity = 0;
    let totalCost = 0;
    let totalSale = 0;
    let totalProfit = 0;

    workingItems.forEach(item => {
      const data = bulkSaleData[item.id];
      const qty = parseInt(data?.quantity) || 0;
      const price = useBulkTotal ? 0 : parseFloat(data?.salePrice) || 0;
      
      totalQuantity += qty;
      totalCost += item.purchase_price * qty;
      totalSale += price * qty;
    });

    if (useBulkTotal) {
      totalSale = parseFloat(bulkTotalPrice) || 0;
    }

    const feesNum = parseFloat(fees) || 0;
    totalProfit = totalSale - totalCost - feesNum;

    return { totalQuantity, totalCost, totalSale, totalProfit };
  }, [workingItems, bulkSaleData, useBulkTotal, bulkTotalPrice, fees]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden border-2 border-border/40 bg-card backdrop-blur-sm flex flex-col p-4 sm:p-6">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {showItemSelector 
              ? 'Select Items to Sell' 
              : workingItems.length > 1 
                ? `Record Sale (${workingItems.length})` 
                : 'Record Sale'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {showItemSelector
              ? "Search and select cards from your inventory"
              : workingItems.length > 1
                ? "Set quantity and price for each item"
                : "Enter sale details"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {/* Item Selector View */}
          {showItemSelector && selectedItemIds.size === 0 ? (
            <div className="space-y-4 pt-2 pb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              {/* Inventory List */}
              <ScrollArea className="h-[50vh] pr-1">
                <div className="space-y-2">
                  {searchableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItemSelection(item.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        selectedItemIds.has(item.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border/30 bg-card/50 hover:border-primary/50'
                      }`}
                    >
                      {item.card_image_url && (
                        <img
                          src={item.card_image_url}
                          alt={item.name}
                          className="w-10 h-14 object-contain rounded border border-border/30"
                        />
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground truncate">{item.set_name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>Qty: {item.quantity}</span>
                          <span>·</span>
                          <span>${formatCurrency(item.purchase_price)}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedItemIds.has(item.id)
                          ? 'border-primary bg-primary text-white'
                          : 'border-muted-foreground/30'
                      }`}>
                        {selectedItemIds.has(item.id) && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}

                  {searchableItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No items found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Selection Actions */}
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    onOpenChange(false);
                  }}
                  className="h-10 flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={selectedItemIds.size === 0}
                  onClick={() => setShowItemSelector(false)}
                  className="h-10 flex-1"
                >
                  Continue ({selectedItemIds.size})
                </Button>
              </div>
            </div>
          ) : (
            /* Sale Form */
            <form onSubmit={handleSubmit} className="space-y-5 pt-2 pb-4">
              {workingItems.length > 1 ? (
                // Bulk Sale Form
                <>
                  {/* Bulk Pricing Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 border border-border/40 rounded-lg">
                    <div className="flex-1 pr-3">
                      <Label htmlFor="bulk-toggle" className="text-sm font-semibold cursor-pointer">
                        Use Total Bulk Price
                      </Label>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        One total for all items
                      </p>
                    </div>
                    <Switch
                      id="bulk-toggle"
                      checked={useBulkTotal}
                      onCheckedChange={setUseBulkTotal}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {useBulkTotal && (
                    <div className="space-y-1.5">
                      <Label htmlFor="bulkTotalPrice" className="text-sm font-semibold">Total Sale Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="bulkTotalPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={bulkTotalPrice}
                          onChange={(e) => setBulkTotalPrice(e.target.value)}
                          placeholder="0.00"
                          className="h-10 pl-7 text-lg font-bold"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <ScrollArea className="h-[30vh] pr-1">
                    <div className="space-y-2 pr-1">
                      {workingItems.map((item) => {
                        const itemData = bulkSaleData[item.id] || { quantity: "", salePrice: "" };
                        const itemQuantityNum = parseInt(itemData.quantity) || 0;
                        const itemProfit = itemData.salePrice
                          ? (parseFloat(itemData.salePrice) - item.purchase_price) * itemQuantityNum
                          : 0;
                        const quickQtys = getQuickQuantities(item.quantity);

                        return (
                          <div key={item.id} className="relative p-3 bg-background/50 border border-border/40 rounded-lg hover:border-primary/50 transition-all">
                            <div className="flex gap-3">
                              {item.card_image_url && (
                                <img
                                  src={item.card_image_url}
                                  alt={item.name}
                                  className="w-12 h-16 object-contain rounded border border-border/40 flex-shrink-0"
                                />
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {item.set_name}
                                      {item.grading_company !== 'raw' && item.grade && (
                                        <span className="ml-1 font-semibold text-primary">
                                          • {item.grading_company.toUpperCase()} {item.grade}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  {!useBulkTotal && itemProfit !== 0 && (
                                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ml-1 ${
                                      itemProfit >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                    }`}>
                                      <TrendingUp className="h-2.5 w-2.5" />
                                      {itemProfit >= 0 ? '+' : ''}${formatCurrency(Math.abs(itemProfit))}
                                    </div>
                                  )}
                                </div>

                                {/* Quantity row */}
                                <div className="flex items-center gap-2 mb-2">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={itemData.quantity}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9]/g, '');
                                      setBulkSaleData(prev => ({
                                        ...prev,
                                        [item.id]: { ...prev[item.id], quantity: value }
                                      }));
                                    }}
                                    placeholder="Qty"
                                    className="h-8 w-14 text-center font-semibold"
                                  />
                                  <div className="flex gap-1">
                                    {quickQtys.map((q) => (
                                      <button
                                        key={q.label}
                                        type="button"
                                        onClick={() => setBulkSaleData(prev => ({
                                          ...prev,
                                          [item.id]: { ...prev[item.id], quantity: String(q.value) }
                                        }))}
                                        className={`h-8 px-2 text-xs font-semibold rounded-lg border transition-all ${
                                          parseInt(itemData.quantity) === q.value
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-secondary/50 border-border/50 hover:border-primary/50'
                                        }`}
                                      >
                                        {q.label}
                                      </button>
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">/{item.quantity}</span>
                                </div>

                                {/* Sale Price (only if not using bulk total) */}
                                {!useBulkTotal && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">Sale $</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={itemData.salePrice}
                                        onChange={(e) => setBulkSaleData(prev => ({
                                          ...prev,
                                          [item.id]: { ...prev[item.id], salePrice: e.target.value }
                                        }))}
                                        placeholder="0.00"
                                        className="h-8 w-20 font-semibold"
                                        required
                                      />
                                      <span className="text-[10px] text-muted-foreground">(cost ${formatCurrency(item.purchase_price)})</span>
                                    </div>
                                    {item.market_price && item.market_price > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {[70, 80, 90, 100].map((pct) => {
                                          const price = (item.market_price! * pct / 100).toFixed(2);
                                          const isSelected = itemData.salePrice === price;
                                          return (
                                            <button
                                              key={pct}
                                              type="button"
                                              onClick={() => setBulkSaleData(prev => ({
                                                ...prev,
                                                [item.id]: { ...prev[item.id], salePrice: price }
                                              }))}
                                              className={`h-7 px-2 text-[10px] font-semibold rounded-md border transition-all ${
                                                isSelected
                                                  ? 'bg-success text-white border-success'
                                                  : 'bg-success/10 text-success border-success/30 hover:border-success/60'
                                              }`}
                                            >
                                              {pct}% · ${price}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Bulk Totals Summary */}
                  {bulkTotals && (bulkTotals.totalQuantity > 0) && (
                    <div className="p-3 bg-gradient-to-br from-muted/40 to-muted/20 border border-primary/30 rounded-lg">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Items</p>
                          <p className="text-sm font-bold">{bulkTotals.totalQuantity}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Cost</p>
                          <p className="text-sm font-semibold text-muted-foreground">${formatCurrency(bulkTotals.totalCost)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Sale</p>
                          <p className="text-sm font-bold">${formatCurrency(bulkTotals.totalSale)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Profit</p>
                          <p className={`text-sm font-bold ${bulkTotals.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {bulkTotals.totalProfit >= 0 ? '+' : ''}${formatCurrency(Math.abs(bulkTotals.totalProfit))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Single Sale Form
                <>
                  {/* Item Info Card */}
                  {selectedItem && (
                    <div className="relative p-3 bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40 rounded-lg">
                      <div className="flex gap-3">
                        {selectedItem.card_image_url && (
                          <img
                            src={selectedItem.card_image_url}
                            alt={selectedItem.name}
                            className="w-16 h-22 object-contain rounded-lg border border-border/40 flex-shrink-0"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm truncate">{selectedItem.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{selectedItem.set_name}</p>

                          {selectedItem.grading_company && selectedItem.grading_company !== 'raw' && selectedItem.grade ? (
                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-bold text-primary bg-primary/10">
                              {selectedItem.grading_company.toUpperCase()} {selectedItem.grade}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-semibold text-muted-foreground bg-muted/50">
                              Raw{selectedItem.condition ? ` - ${selectedItem.condition}` : ''}
                            </span>
                          )}

                          <div className="flex gap-4 mt-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Cost: </span>
                              <span className="font-semibold">${formatCurrency(purchasePrice)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Stock: </span>
                              <span className="font-semibold">{selectedItem.quantity}</span>
                            </div>
                            {selectedItem.market_price && (
                              <div>
                                <span className="text-muted-foreground">Market: </span>
                                <span className="font-semibold text-primary">${formatCurrency(selectedItem.market_price)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity with quick buttons */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-semibold">Quantity</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="quantity"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={quantity}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setQuantity(value);
                        }}
                        onFocus={(e) => e.target.select()}
                        placeholder="1"
                        className="h-10 w-16 text-center font-semibold"
                      />
                      {selectedItem && (
                        <div className="flex gap-1 flex-wrap">
                          {getQuickQuantities(selectedItem.quantity).map((q) => (
                            <button
                              key={q.label}
                              type="button"
                              onClick={() => setQuantity(String(q.value))}
                              className={`h-10 px-3 text-sm font-semibold rounded-lg border transition-all ${
                                parseInt(quantity) === q.value
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-secondary/50 border-border/50 hover:border-primary/50'
                              }`}
                            >
                              {q.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sale Price */}
                  <div className="space-y-2">
                    <Label htmlFor="salePrice" className="text-sm font-semibold">Sale Price (each)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        placeholder="0.00"
                        className="h-10 pl-7 font-semibold"
                        required
                      />
                    </div>
                    {selectedItem?.market_price && selectedItem.market_price > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[70, 80, 90, 100].map((pct) => {
                          const price = (selectedItem.market_price! * pct / 100).toFixed(2);
                          const isSelected = salePrice === price;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setSalePrice(price)}
                              className={`h-8 px-2.5 text-xs font-semibold rounded-lg border transition-all ${
                                isSelected
                                  ? 'bg-success text-white border-success'
                                  : 'bg-success/10 text-success border-success/30 hover:border-success/60'
                              }`}
                            >
                              {pct}% · ${price}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Common Fields for Both Single and Bulk */}
              <div className="space-y-4 pt-2 border-t border-border/30">
                {/* Platform & Date Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="platform" className="text-sm font-semibold flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      Platform
                    </Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="saleDate" className="text-sm font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Date
                    </Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Buyer & Fees Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="buyerName" className="text-sm font-semibold flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Buyer (optional)
                    </Label>
                    <Input
                      id="buyerName"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Buyer name"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fees" className="text-sm font-semibold flex items-center gap-1">
                      <Minus className="h-3 w-3" />
                      Fees/Shipping
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="fees"
                        type="number"
                        step="0.01"
                        min="0"
                        value={fees}
                        onChange={(e) => setFees(e.target.value)}
                        placeholder="0.00"
                        className="h-10 pl-7"
                      />
                    </div>
                  </div>
                </div>

                {/* Sale Tag */}
                <div className="space-y-1.5">
                  <Label htmlFor="saleTag" className="text-sm font-semibold">Sale Tag / Client</Label>
                  <Input
                    id="saleTag"
                    value={saleTag}
                    onChange={(e) => setSaleTag(e.target.value)}
                    placeholder="e.g., 'John - Chicago Event'"
                    className="h-10"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-sm font-semibold">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    className="min-h-[60px] resize-none"
                  />
                </div>

                {/* Profit Summary (Single Sale) */}
                {workingItems.length === 1 && salePrice && quantity && (
                  <div className="p-3 bg-gradient-to-br from-muted/40 to-muted/20 border border-primary/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">Total Sale</span>
                        <p className="text-lg font-bold">${formatCurrency(salePriceNum * quantityNum)}</p>
                      </div>
                      {feesNum > 0 && (
                        <div className="text-center">
                          <span className="text-xs text-muted-foreground">Fees</span>
                          <p className="text-sm font-semibold text-destructive">-${formatCurrency(feesNum)}</p>
                        </div>
                      )}
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <TrendingUp className="h-3 w-3" />
                          Profit
                        </span>
                        <p className={`text-lg font-bold ${profit * quantityNum >= 0 ? "text-success" : "text-destructive"}`}>
                          {profit * quantityNum >= 0 ? "+" : ""}${formatCurrency(Math.abs(profit * quantityNum))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (showItemSelector || selectedItemIds.size > 0) {
                      setSelectedItemIds(new Set());
                      setShowItemSelector(true);
                    } else {
                      resetForm();
                      onOpenChange(false);
                    }
                  }}
                  disabled={loading}
                  className="h-10 flex-1"
                >
                  {showItemSelector || selectedItemIds.size > 0 ? 'Back' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (workingItems.length === 1 && (!selectedItem || !salePrice))}
                  className="h-10 flex-1 font-semibold"
                >
                  {loading ? (
                    "Recording..."
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-1" />
                      {workingItems.length > 1 ? `Sell (${workingItems.length})` : "Record Sale"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </DialogContent>
    </Dialog>
  );
};

export default RecordSaleDialog;
