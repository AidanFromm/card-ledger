import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, X, Plus, QrCode, Clock, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { QRCodeSVG } from 'qrcode.react';

interface CreateClientListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: any[];
  onCreateList: (listName: string, itemsWithQuantities: any[]) => Promise<{ share_token: string } | null>;
  onClearSelection: () => void;
}

export const CreateClientListDialog = ({
  open,
  onOpenChange,
  selectedItems: initialSelectedItems,
  onCreateList,
  onClearSelection,
}: CreateClientListDialogProps) => {
  const [listName, setListName] = useState("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [showAddItems, setShowAddItems] = useState(false);
  const { items: allInventoryItems } = useInventoryDb();
  const { toast } = useToast();

  useEffect(() => {
    // Only initialize when dialog first opens
    if (open) {
      setSelectedItems(initialSelectedItems);
      // Initialize quantities only for items that don't have a quantity set yet
      setItemQuantities(prev => {
        const newQuantities = { ...prev };
        initialSelectedItems.forEach(item => {
          if (newQuantities[item.id] === undefined) {
            newQuantities[item.id] = 0;
          }
        });
        return newQuantities;
      });
    }
  }, [open, initialSelectedItems]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatGrading = (company: string, grade: string | null) => {
    if (company === "raw") return "Raw";
    return grade ? `${company.toUpperCase()} ${grade}` : company.toUpperCase();
  };

  const updateQuantity = (itemId: string, value: string) => {
    if (value === "") {
      // Allow empty string for when user clears the field
      setItemQuantities(prev => ({
        ...prev,
        [itemId]: 0
      }));
      return;
    }
    
    const numValue = parseInt(value) || 0;
    const item = selectedItems.find(i => i.id === itemId);
    const maxQty = item?.quantity || 0;
    
    // Cap at inventory maximum
    const newQty = Math.max(0, Math.min(numValue, maxQty));
    
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: newQty
    }));
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    setItemQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[itemId];
      return newQuantities;
    });
  };

  const addItem = (item: any) => {
    if (!selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(prev => [...prev, item]);
      // Don't pre-fill quantity when adding items
      setItemQuantities(prev => ({
        ...prev,
        [item.id]: 0
      }));
    }
    setShowAddItems(false);
  };

  const availableItems = allInventoryItems.filter(
    item => !selectedItems.find(selected => selected.id === item.id)
  );

  const totalMarketValue = selectedItems.reduce(
    (sum, item) => {
      const qty = itemQuantities[item.id] || 0;
      return sum + (item.market_price * qty);
    },
    0
  );

  const handleCreate = async () => {
    if (!listName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a list name",
        variant: "destructive",
      });
      return;
    }

    // Validate that all items have quantities
    const hasEmptyQuantities = selectedItems.some(item => {
      const qty = itemQuantities[item.id] || 0;
      return qty === 0;
    });

    if (hasEmptyQuantities) {
      toast({
        title: "Error",
        description: "Please enter quantities for all items",
        variant: "destructive",
      });
      return;
    }

    // Create items with adjusted quantities
    const itemsWithQuantities = selectedItems.map(item => ({
      ...item,
      quantity: itemQuantities[item.id] || 0
    }));

    setIsCreating(true);
    const result = await onCreateList(listName, itemsWithQuantities);
    setIsCreating(false);

    if (result) {
      setShareToken(result.share_token);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/client-list/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "Share this link with your client — no login required.",
    });
  };

  const handleClose = () => {
    setListName("");
    setShareToken(null);
    setSelectedItems([]);
    setItemQuantities({});
    setShowAddItems(false);
    onClearSelection();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {shareToken ? "List Created!" : "Create Client List"}
          </DialogTitle>
        </DialogHeader>

        {shareToken ? (
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl shadow-sm">
                <QRCodeSVG
                  value={`${window.location.origin}/client-list/${shareToken}`}
                  size={160}
                  level="M"
                  includeMargin
                />
              </div>
            </div>

            {/* Share Link */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <Label className="text-sm text-muted-foreground">Shareable Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/client-list/${shareToken}`}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button onClick={copyShareLink} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Expiration Notice */}
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
              <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span className="text-amber-700 dark:text-amber-400">
                This link expires in 30 days. You can extend it from your lists page.
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Share this link or scan the QR code. Clients can view the cards and calculate offers based on market price percentages.</p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., Cards for John Doe"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Selected Items ({selectedItems.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddItems(!showAddItems)}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Items
                </Button>
              </div>

              {showAddItems && (
                <div className="border rounded-lg p-3 mb-2 bg-muted/30">
                  <Label className="text-sm mb-2 block">Add from Inventory</Label>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {availableItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          All inventory items are already in the list
                        </p>
                      ) : (
                        availableItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 p-2 bg-background border rounded hover:border-primary/50 cursor-pointer transition-colors"
                            onClick={() => addItem(item)}
                          >
                            {item.card_image_url && (
                              <img
                                src={item.card_image_url}
                                alt={item.name}
                                className="w-10 h-14 object-contain p-1 rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.set_name}</p>
                            </div>
                            <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-3">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No items selected</p>
                      <p className="text-sm mt-1">Click "Add Items" to add cards to this list</p>
                    </div>
                  ) : (
                    selectedItems.map((item) => {
                    const currentQty = itemQuantities[item.id];
                    const perUnitPrice = item.market_price;
                    const totalPrice = perUnitPrice * (currentQty || 0);
                    
                    return (
                      <div key={item.id} className="group relative flex gap-4 p-4 bg-card border border-border/50 rounded-lg hover:border-primary/30 transition-all">
                        {/* Remove button - only visible on hover */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 rounded-md bg-background/90 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground border border-border/50 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        
                        {/* Card Image */}
                        {item.card_image_url && (
                          <div className="w-20 h-28 rounded overflow-hidden bg-muted/10 flex-shrink-0">
                            <img
                              src={item.card_image_url}
                              alt={item.name}
                              className="w-full h-full object-contain p-2"
                            />
                          </div>
                        )}
                        
                        {/* Card Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <p className="font-bold text-base truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{item.set_name}</p>
                          </div>
                          
                          <Badge variant="secondary" className="text-xs w-fit">
                            {formatGrading(item.grading_company, item.grade)}
                          </Badge>
                          
                          {/* Quantity Input */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`qty-${item.id}`} className="text-xs text-muted-foreground">
                                Qty:
                              </Label>
                              <Input
                                id={`qty-${item.id}`}
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={currentQty || ""}
                                onChange={(e) => updateQuantity(item.id, e.target.value)}
                                placeholder="0"
                                className="w-20 h-7 text-sm text-center"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {item.quantity} in inventory
                            </span>
                          </div>
                        </div>
                        
                        {/* Pricing */}
                        <div className="text-right space-y-1 flex-shrink-0">
                          <div>
                            <p className="text-xs text-muted-foreground">Per Unit</p>
                            <p className="text-sm font-semibold text-foreground">
                              ${formatNumber(perUnitPrice)}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-lg font-bold text-primary">
                              ${formatNumber(totalPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Market Value</span>
                <span className="text-2xl font-bold text-primary">
                  ${formatNumber(totalMarketValue)}
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create & Get Link"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
