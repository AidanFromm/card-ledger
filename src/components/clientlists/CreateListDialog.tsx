import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  X,
  Search,
  Globe,
  Link2,
  Lock,
  Package,
  DollarSign,
  Percent,
  Calendar,
  Mail,
  Phone,
  Loader2,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useClientLists, ListVisibility, PricingMode } from "@/hooks/useClientLists";
import { useToast } from "@/hooks/use-toast";

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedItems?: any[];
}

export const CreateListDialog = ({
  open,
  onOpenChange,
  preselectedItems = [],
}: CreateListDialogProps) => {
  const navigate = useNavigate();
  const { items: inventoryItems } = useInventoryDb();
  const { createList } = useClientLists();
  const { toast } = useToast();

  // Form state
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  // Step 1: Basic Info
  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ListVisibility>("unlisted");
  
  // Step 2: Items
  const [selectedItems, setSelectedItems] = useState<Map<string, { item: any; quantity: number; customPrice: number | null }>>(
    new Map()
  );
  const [searchTerm, setSearchTerm] = useState("");
  
  // Step 3: Pricing
  const [pricingMode, setPricingMode] = useState<PricingMode>("market");
  const [markupPercent, setMarkupPercent] = useState(0);
  const [allowOffers, setAllowOffers] = useState(true);
  
  // Step 4: Settings
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("30");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setListName("");
      setDescription("");
      setVisibility("unlisted");
      setSelectedItems(new Map());
      setSearchTerm("");
      setPricingMode("market");
      setMarkupPercent(0);
      setAllowOffers(true);
      setContactEmail("");
      setContactPhone("");
      setExpiresIn("30");

      // Pre-select items if provided
      if (preselectedItems.length > 0) {
        const newSelected = new Map<string, { item: any; quantity: number; customPrice: number | null }>();
        preselectedItems.forEach(item => {
          newSelected.set(item.id, {
            item,
            quantity: item.quantity || 1,
            customPrice: null,
          });
        });
        setSelectedItems(newSelected);
      }
    }
  }, [open, preselectedItems]);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventoryItems;
    const term = searchTerm.toLowerCase();
    return inventoryItems.filter(
      item =>
        item.name.toLowerCase().includes(term) ||
        item.set_name.toLowerCase().includes(term)
    );
  }, [inventoryItems, searchTerm]);

  const toggleItem = (item: any) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.set(item.id, {
        item,
        quantity: 1,
        customPrice: null,
      });
    }
    setSelectedItems(newSelected);
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    const newSelected = new Map(selectedItems);
    const entry = newSelected.get(itemId);
    if (entry) {
      newSelected.set(itemId, { ...entry, quantity: Math.max(1, quantity) });
      setSelectedItems(newSelected);
    }
  };

  const updateItemCustomPrice = (itemId: string, price: number | null) => {
    const newSelected = new Map(selectedItems);
    const entry = newSelected.get(itemId);
    if (entry) {
      newSelected.set(itemId, { ...entry, customPrice: price });
      setSelectedItems(newSelected);
    }
  };

  const removeItem = (itemId: string) => {
    const newSelected = new Map(selectedItems);
    newSelected.delete(itemId);
    setSelectedItems(newSelected);
  };

  const totalValue = useMemo(() => {
    let total = 0;
    selectedItems.forEach(({ item, quantity, customPrice }) => {
      const price = customPrice ?? item.market_price;
      const adjustedPrice = pricingMode === "markup" 
        ? price * (1 + markupPercent / 100)
        : price;
      total += adjustedPrice * quantity;
    });
    return total;
  }, [selectedItems, pricingMode, markupPercent]);

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

  const canProceedStep1 = listName.trim().length > 0;
  const canProceedStep2 = selectedItems.size > 0;
  const canSubmit = canProceedStep1 && canProceedStep2;

  const handleCreate = async () => {
    if (!canSubmit) return;

    setIsCreating(true);

    const items = Array.from(selectedItems.values()).map(({ item, quantity, customPrice }) => ({
      id: item.id,
      name: item.name,
      set_name: item.set_name,
      card_image_url: item.card_image_url,
      grading_company: item.grading_company,
      grade: item.grade,
      market_price: item.market_price,
      custom_price: pricingMode === "custom" ? customPrice : null,
      quantity,
    }));

    const expiresAt = expiresIn !== "never" 
      ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000)
      : null;

    const result = await createList({
      listName,
      description: description || undefined,
      visibility,
      pricingMode,
      markupPercent: pricingMode === "markup" ? markupPercent : 0,
      allowOffers,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      expiresAt,
      items,
    });

    setIsCreating(false);

    if (result) {
      onOpenChange(false);
      navigate(`/lists/${result.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Client List</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {
              step === 1 ? "Basic Information" :
              step === 2 ? "Select Items" :
              step === 3 ? "Pricing Options" :
              "Contact & Settings"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="listName">List Name *</Label>
                <Input
                  id="listName"
                  placeholder="e.g., Available Inventory, Trade Binder"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for your list..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Visibility</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      visibility === "private"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Lock className={`h-5 w-5 mb-2 ${visibility === "private" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium">Private</p>
                    <p className="text-xs text-muted-foreground">Only you can see</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("unlisted")}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      visibility === "unlisted"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Link2 className={`h-5 w-5 mb-2 ${visibility === "unlisted" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium">Unlisted</p>
                    <p className="text-xs text-muted-foreground">Anyone with link</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      visibility === "public"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Globe className={`h-5 w-5 mb-2 ${visibility === "public" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium">Public</p>
                    <p className="text-xs text-muted-foreground">Searchable by all</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Items */}
          {step === 2 && (
            <div className="flex flex-col h-[400px]">
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Badge variant="secondary" className="px-3 flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {selectedItems.size} selected
                </Badge>
              </div>

              <Tabs defaultValue="inventory" className="flex-1 flex flex-col">
                <TabsList className="mb-3">
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="selected">
                    Selected ({selectedItems.size})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="inventory" className="flex-1 mt-0">
                  <ScrollArea className="h-[300px] border rounded-lg">
                    <div className="p-2 space-y-1">
                      {filteredInventory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No items found</p>
                        </div>
                      ) : (
                        filteredInventory.map((item) => {
                          const isSelected = selectedItems.has(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleItem(item)}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/10 border border-primary/30"
                                  : "hover:bg-muted/50 border border-transparent"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              
                              {item.card_image_url ? (
                                <img
                                  src={item.card_image_url}
                                  alt={item.name}
                                  className="w-10 h-14 object-contain rounded"
                                />
                              ) : (
                                <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{item.set_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {formatGrading(item.grading_company, item.grade)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Qty: {item.quantity}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="font-semibold text-primary">
                                ${formatNumber(item.market_price)}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="selected" className="flex-1 mt-0">
                  <ScrollArea className="h-[300px] border rounded-lg">
                    <div className="p-2 space-y-2">
                      {selectedItems.size === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No items selected</p>
                          <p className="text-sm mt-1">Click items to add them</p>
                        </div>
                      ) : (
                        Array.from(selectedItems.values()).map(({ item, quantity, customPrice }) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border"
                          >
                            {item.card_image_url ? (
                              <img
                                src={item.card_image_url}
                                alt={item.name}
                                className="w-10 h-14 object-contain rounded"
                              />
                            ) : (
                              <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {formatGrading(item.grading_company, item.grade)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Qty:</Label>
                              <Input
                                type="number"
                                min={1}
                                max={item.quantity}
                                value={quantity}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-center"
                              />
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Pricing Mode</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPricingMode("market")}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      pricingMode === "market"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <DollarSign className={`h-5 w-5 mb-2 ${pricingMode === "market" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium">Market Price</p>
                    <p className="text-xs text-muted-foreground">Use current market values</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPricingMode("markup")}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      pricingMode === "markup"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Percent className={`h-5 w-5 mb-2 ${pricingMode === "markup" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium">Global Markup</p>
                    <p className="text-xs text-muted-foreground">Apply % to all items</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPricingMode("custom")}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      pricingMode === "custom"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Package className={`h-5 w-5 mb-2 ${pricingMode === "custom" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium">Custom Prices</p>
                    <p className="text-xs text-muted-foreground">Set price per item</p>
                  </button>
                </div>
              </div>

              {pricingMode === "markup" && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>Markup/Discount Percentage</Label>
                    <span className={`font-bold ${markupPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {markupPercent > 0 ? "+" : ""}{markupPercent}%
                    </span>
                  </div>
                  <Slider
                    value={[markupPercent]}
                    onValueChange={([value]) => setMarkupPercent(value)}
                    min={-50}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    {markupPercent > 0 
                      ? `Items will be priced ${markupPercent}% above market value`
                      : markupPercent < 0
                      ? `Items will be priced ${Math.abs(markupPercent)}% below market value`
                      : "Items will be priced at market value"}
                  </p>
                </div>
              )}

              {pricingMode === "custom" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Set custom prices for each item. Leave blank to use market price.
                  </p>
                  <ScrollArea className="h-[200px] border rounded-lg p-3">
                    <div className="space-y-2">
                      {Array.from(selectedItems.values()).map(({ item, quantity, customPrice }) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Market: ${formatNumber(item.market_price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">$</span>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={customPrice ?? ""}
                              onChange={(e) => updateItemCustomPrice(
                                item.id,
                                e.target.value ? parseFloat(e.target.value) : null
                              )}
                              placeholder={formatNumber(item.market_price)}
                              className="w-24 h-8"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Allow Offers</p>
                    <p className="text-sm text-muted-foreground">Let buyers make offers</p>
                  </div>
                </div>
                <Switch
                  checked={allowOffers}
                  onCheckedChange={setAllowOffers}
                />
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total List Value</span>
                  <span className="text-2xl font-bold text-primary">
                    ${formatNumber(totalValue)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>
                <p className="text-sm text-muted-foreground">
                  Optional. Displayed on the public list page for inquiries.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Link Expiration
                </h3>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="never">Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <h3 className="font-semibold">Summary</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">List Name:</span>
                  <span className="font-medium">{listName}</span>
                  
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{selectedItems.size} cards</span>
                  
                  <span className="text-muted-foreground">Visibility:</span>
                  <span className="font-medium capitalize">{visibility}</span>
                  
                  <span className="text-muted-foreground">Pricing:</span>
                  <span className="font-medium capitalize">
                    {pricingMode === "markup" ? `${markupPercent >= 0 ? "+" : ""}${markupPercent}%` : pricingMode}
                  </span>
                  
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="font-medium text-primary">${formatNumber(totalValue)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={isCreating}
            >
              Back
            </Button>
          )}
          
          <div className="flex-1 sm:hidden" />
          
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={!canSubmit || isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create List
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
