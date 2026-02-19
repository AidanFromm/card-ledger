import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useSalesDb } from "@/hooks/useSalesDb";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Platform fee rates (accurate as of 2024)
const PLATFORMS = [
  { id: 'none', label: 'No Platform', fee: 0 },
  { id: 'ebay', label: 'eBay', fee: 0.1325 },
  { id: 'tcgplayer', label: 'TCGPlayer', fee: 0.1025 },
  { id: 'mercari', label: 'Mercari', fee: 0.10 },
  { id: 'whatnot', label: 'Whatnot', fee: 0.089 },
  { id: 'facebook', label: 'FB Market', fee: 0.05 },
  { id: 'local', label: 'Local/Cash', fee: 0 },
] as const;

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
  const { updateItem } = useInventoryDb();
  const { addSale } = useSalesDb();
  const { toast } = useToast();

  // Filter out sold-out items (quantity = 0)
  const availableItems = preselectedItems.filter(item => item.quantity > 0);
  const isBulkSale = availableItems.length > 1;
  const [bulkSaleData, setBulkSaleData] = useState<Record<string, { quantity: string; salePrice: string }>>({});
  const [quantity, setQuantity] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleTag, setSaleTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBulkTotal, setUseBulkTotal] = useState(false);
  const [bulkTotalPrice, setBulkTotalPrice] = useState("");
  const [shippingCost, setShippingCost] = useState("");

  // Format currency with commas
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

// Initialize data when available items change (only when the actual item set changes)
  const lastItemIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (availableItems.length === 1) {
      const currentId = availableItems[0].id;
      if (lastItemIdRef.current !== currentId) {
        setQuantity("");
        setSalePrice("");
        lastItemIdRef.current = currentId;
      }
    } else if (availableItems.length > 1) {
      const needsInit = availableItems.some(item => !bulkSaleData[item.id]) ||
        Object.keys(bulkSaleData).length !== availableItems.length;
      if (needsInit) {
        const initialData: Record<string, { quantity: string; salePrice: string }> = {};
        availableItems.forEach(item => {
          initialData[item.id] = { quantity: "", salePrice: "" };
        });
        setBulkSaleData(initialData);
      }
    }
    // Only re-run when the set of item IDs changes
  }, [JSON.stringify(availableItems.map(i => i.id).sort())]);

  const selectedItem = availableItems.length === 1 ? availableItems[0] : null;
  
  const [platformFee, setPlatformFee] = useState('none');

  const purchasePrice = selectedItem?.purchase_price || 0;
  const quantityNum = parseInt(quantity) || 0;
  const selectedPlatform = PLATFORMS.find(p => p.id === platformFee) || PLATFORMS[0];
  const feeRate = selectedPlatform.fee;
  const salePriceNum = parseFloat(salePrice) || 0;
  const shippingCostNum = parseFloat(shippingCost) || 0;
  const feeAmount = salePriceNum * feeRate * quantityNum;
  const netRevenue = (salePriceNum * quantityNum) - feeAmount - shippingCostNum;
  const profit = salePrice ? parseFloat(salePrice) - purchasePrice : 0;
  const netProfit = netRevenue - (purchasePrice * quantityNum);

  // FIFO: Deduct sold quantity from purchase entries
  const deductFromPurchaseEntries = async (inventoryItemId: string, soldQuantity: number) => {
    // Fetch purchase entries for this item, ordered by purchase_date (FIFO)
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
        // This entire entry is sold, delete it
        remainingToDeduct -= entry.quantity;
        await supabase
          .from('purchase_entries')
          .delete()
          .eq('id', entry.id);
      } else {
        // Partially sold, reduce the quantity
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
    
    if (isBulkSale) {
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
      // Record the sale
      const salePriceNum = parseFloat(salePrice);
      await addSale({
        inventory_item_id: selectedItem.id,
        item_name: selectedItem.name,
        quantity_sold: quantityNum,
        purchase_price: purchasePrice,
        sale_price: salePriceNum,
        profit: salePriceNum - purchasePrice,
        notes: saleTag || undefined,
        card_image_url: selectedItem.card_image_url || undefined,
        set_name: selectedItem.set_name,
        condition: selectedItem.condition,
        grading_company: selectedItem.grading_company,
        grade: selectedItem.grade || undefined,
      } as any);

      // Deduct from purchase entries using FIFO
      await deductFromPurchaseEntries(selectedItem.id, quantityNum);

      // Update inventory quantity
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

      // Generate a unique group ID for this bulk sale transaction
      const saleGroupId = crypto.randomUUID();

      // Calculate individual prices if using bulk total
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

        // Calculate total purchase cost to determine proportional distribution
        const totalPurchaseCost = availableItems.reduce((sum, item) => {
          const itemQuantity = parseInt(bulkSaleData[item.id]?.quantity) || 0;
          return sum + (item.purchase_price * itemQuantity);
        }, 0);

        // Distribute sale price proportionally based on purchase cost
        availableItems.forEach(item => {
          const itemQuantity = parseInt(bulkSaleData[item.id]?.quantity) || 0;
          const itemPurchaseCost = item.purchase_price * itemQuantity;
          const proportion = itemPurchaseCost / totalPurchaseCost;
          const itemTotalSale = totalPrice * proportion;
          itemSalePrices[item.id] = itemTotalSale / itemQuantity; // Per unit price
        });
      }

      for (const item of availableItems) {
        const itemData = bulkSaleData[item.id];
        const itemQuantity = parseInt(itemData?.quantity) || 0;
        
        // Get sale price either from bulk total distribution or individual input
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
          // Record the sale with the group ID for bulk sales
          await addSale({
            inventory_item_id: item.id,
            item_name: item.name,
            quantity_sold: itemQuantity,
            purchase_price: item.purchase_price,
            sale_price: salePricePerUnit,
            profit: salePricePerUnit - item.purchase_price,
            notes: saleTag || undefined,
            sale_group_id: saleGroupId,
            card_image_url: item.card_image_url || undefined,
            set_name: item.set_name,
            condition: item.condition,
            grading_company: item.grading_company,
            grade: item.grade || undefined,
          } as any);

          // Deduct from purchase entries using FIFO
          await deductFromPurchaseEntries(item.id, itemQuantity);

          // Update inventory quantity
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
    setBulkSaleData({});
    setUseBulkTotal(false);
    setBulkTotalPrice("");
    setShippingCost("");
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
      // Remove duplicates by value
      return arr.findIndex(x => x.value === q.value) === i && q.value <= maxQty;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-hidden border-2 border-border/40 bg-card backdrop-blur-sm flex flex-col p-4 sm:p-6">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {isBulkSale ? `Record Sale (${availableItems.length})` : 'Record Sale'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {isBulkSale
              ? "Set quantity for each item"
              : "Enter sale details"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-6 pt-2 pb-4">
          {isBulkSale ? (
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

            {useBulkTotal ? (
              // Bulk Total Price Input
              <>
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

                {/* Items Summary for Quantity Selection */}
                <ScrollArea className="h-[35vh] pr-1">
                  <div className="space-y-2 pr-1">
                    {availableItems.map((item) => {
                      const itemData = bulkSaleData[item.id] || { quantity: "1", salePrice: "" };
                      const quickQtys = getQuickQuantities(item.quantity);

                      return (
                        <div key={item.id} className="relative p-3 bg-background/50 border border-border/40 rounded-lg">
                          <div className="flex gap-3">
                            {item.card_image_url && (
                              <img
                                src={item.card_image_url}
                                alt={item.name}
                                className="w-12 h-16 object-contain rounded border border-border/40 flex-shrink-0"
                              />
                            )}

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

                              <div className="flex items-center gap-2 mt-2">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={itemData.quantity}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    setBulkSaleData(prev => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], quantity: value, salePrice: "" }
                                    }));
                                  }}
                                  placeholder="Qty"
                                  className="h-8 w-16 text-center font-semibold"
                                />
                                <div className="flex gap-1">
                                  {quickQtys.map((q) => (
                                    <button
                                      key={q.label}
                                      type="button"
                                      onClick={() => setBulkSaleData(prev => ({
                                        ...prev,
                                        [item.id]: { ...prev[item.id], quantity: String(q.value), salePrice: "" }
                                      }))}
                                      className={`h-8 px-2.5 text-xs font-semibold rounded-lg border transition-all ${
                                        parseInt(itemData.quantity) === q.value
                                          ? 'bg-primary text-primary-foreground border-primary'
                                          : 'bg-secondary/50 border-border/50 hover:border-primary/50'
                                      }`}
                                    >
                                      {q.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1">Max: {item.quantity}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            ) : (
              // Individual Pricing
              <ScrollArea className="h-[40vh] pr-1">
                <div className="space-y-2 pr-1">
                {availableItems.map((item) => {
                const itemData = bulkSaleData[item.id] || { quantity: "1", salePrice: "" };
                const itemQuantityNum = parseInt(itemData.quantity) || 0;
                const itemProfit = itemData.salePrice
                  ? (parseFloat(itemData.salePrice) - item.purchase_price) * itemQuantityNum
                  : 0;
                const quickQtys = getQuickQuantities(item.quantity);

                return (
                  <div key={item.id} className="relative p-3 bg-background/50 border border-border/40 rounded-lg hover:border-primary/50 transition-all">
                    <div className="flex gap-3">
                      {/* Card Image */}
                      {item.card_image_url && (
                        <img
                          src={item.card_image_url}
                          alt={item.name}
                          className="w-12 h-16 object-contain rounded border border-border/40 flex-shrink-0"
                        />
                      )}

                       {/* Item Details */}
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
                          {itemProfit !== 0 && (
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ml-1 ${
                              itemProfit >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                            }`}>
                              <TrendingUp className="h-2.5 w-2.5" />
                              {itemProfit >= 0 ? '+' : ''}${formatCurrency(Math.abs(itemProfit))}
                            </div>
                          )}
                        </div>

                        {/* Quantity row with quick buttons */}
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

                        {/* Sale Price with market price quick buttons */}
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
                            <span className="text-[10px] text-muted-foreground">(paid ${formatCurrency(item.purchase_price)})</span>
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
                      </div>
                    </div>
                  </div>
                  );
                })}
                </div>
              </ScrollArea>
            )}
            
            {/* Sale Tag for Bulk Sales */}
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="bulkSaleTag" className="text-sm font-semibold">Sale Tag</Label>
              <Input
                id="bulkSaleTag"
                value={saleTag}
                onChange={(e) => setSaleTag(e.target.value)}
                placeholder="e.g., 'John - Chicago Event'"
                className="h-10"
              />
            </div>
            </>
          ) : (
            // Single Sale Form
            <>
              {/* Item Info Card */}
              {selectedItem && (
                <div className="relative p-3 bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40 rounded-lg">
                  <div className="flex gap-3">
                    {/* Card Image */}
                    {selectedItem.card_image_url && (
                      <img
                        src={selectedItem.card_image_url}
                        alt={selectedItem.name}
                        className="w-16 h-22 object-contain rounded-lg border border-border/40 flex-shrink-0"
                      />
                    )}

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{selectedItem.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{selectedItem.set_name}</p>

                      {/* Grading Badge */}
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
                          <span className="text-muted-foreground">Paid: </span>
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

              {/* Sale Details */}
              <div className="space-y-3">
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

                {/* Sale Price with market price quick buttons */}
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

                {/* Sale Tag */}
                <div className="space-y-1.5">
                  <Label htmlFor="saleTag" className="text-sm font-semibold">Sale Tag</Label>
                  <Input
                    id="saleTag"
                    value={saleTag}
                    onChange={(e) => setSaleTag(e.target.value)}
                    placeholder="e.g., 'John - Chicago Event'"
                    className="h-10"
                  />
                </div>

                {/* Platform Fee Calculator */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5" />
                    Platform Fees
                  </Label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatformFee(p.id)}
                        className={`h-8 px-2.5 text-xs font-semibold rounded-lg border transition-all ${
                          platformFee === p.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary/50 border-border/50 hover:border-primary/50'
                        }`}
                      >
                        {p.label}{p.fee > 0 ? ` ${(p.fee * 100).toFixed(p.fee * 100 % 1 === 0 ? 0 : 2)}%` : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shipping Cost */}
                <div className="space-y-2">
                  <Label htmlFor="shippingCost" className="text-sm font-semibold">Shipping Cost</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="shippingCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      placeholder="0.00"
                      className="h-10 pl-7"
                    />
                  </div>
                </div>

                {/* Net Profit Summary */}
                {salePrice && (
                  <div className="p-3 bg-gradient-to-br from-muted/40 to-muted/20 border border-primary/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total Sale</span>
                      <span className="text-sm font-bold">${formatCurrency(salePriceNum * quantityNum)}</span>
                    </div>
                    {feeRate > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{selectedPlatform.label} Fee ({(feeRate * 100).toFixed(feeRate * 100 % 1 === 0 ? 0 : 2)}%)</span>
                        <span className="text-sm font-semibold text-destructive">-${formatCurrency(feeAmount)}</span>
                      </div>
                    )}
                    {shippingCostNum > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Shipping</span>
                        <span className="text-sm font-semibold text-destructive">-${formatCurrency(shippingCostNum)}</span>
                      </div>
                    )}
                    {(feeRate > 0 || shippingCostNum > 0) && (
                      <div className="flex items-center justify-between border-t border-border/30 pt-2">
                        <span className="text-xs text-muted-foreground">Net Revenue</span>
                        <span className="text-sm font-bold">${formatCurrency(netRevenue)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border/30 pt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Net Profit
                      </span>
                      <span className={`text-lg font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                        {netProfit >= 0 ? "+" : ""}${formatCurrency(Math.abs(netProfit))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}


          <div className="flex gap-2 pt-4 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
              className="h-10 flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (!isBulkSale && (!selectedItem || !salePrice))}
              className="h-10 flex-1 font-semibold"
            >
              {loading ? (
                "Recording..."
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-1" />
                  {isBulkSale ? `Sell (${availableItems.length})` : "Sell"}
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </DialogContent>
    </Dialog>
  );
};

export default RecordSaleDialog;
