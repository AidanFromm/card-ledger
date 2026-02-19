import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useWatchlist } from "@/hooks/useWatchlist";
import { supabase } from "@/integrations/supabase/client";
import { Constants, type Enums } from "@/integrations/supabase/types";
import { useCelebration } from "@/components/Celebration";
import { Sparkles, Loader2, Info, ChevronDown, ChevronUp, Eye } from "lucide-react";
import {
  GRADING_SCALES,
  RAW_CONDITIONS,
  getGradeLabel,
  getUniqueGradeValues,
  BGS_SUBGRADE_FIELDS,
  BGS_SUBGRADE_VALUES
} from "@/lib/gradingScales";

interface Product {
  id: string;
  name: string;
  set_name: string;
  card_number: string | null;
  image_url: string | null;
  market_price: number | null;
  lowest_listed?: number | null;
  category?: string;
  pokemon_tcg_id?: string | null;
  condition?: string;
  grading_company?: string;
  grade?: string | null;
}

interface AddToInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

// BGS Subgrades state type
interface BgsSubgrades {
  centering: string;
  corners: string;
  edges: string;
  surface: string;
}

export const AddToInventoryDialog = ({ open, onOpenChange, product }: AddToInventoryDialogProps) => {
  const { addItem, updateItem } = useInventoryDb();
  const { addToWatchlist, isWatched } = useWatchlist();
  const { celebrate } = useCelebration();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [gradedPrice, setGradedPrice] = useState<number | null>(null);
  const [ungradedPrice, setUngradedPrice] = useState<number | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isFetchingAiPrice, setIsFetchingAiPrice] = useState(false);
  const [aiPriceSummary, setAiPriceSummary] = useState<string | null>(null);
  const [showGradeInfo, setShowGradeInfo] = useState(false);

  // BGS subgrades state
  const [bgsSubgrades, setBgsSubgrades] = useState<BgsSubgrades>({
    centering: '',
    corners: '',
    edges: '',
    surface: '',
  });

  // Function to fetch AI price via Tavily
  const fetchAiPrice = async () => {
    if (!product) return;

    setIsFetchingAiPrice(true);
    setAiPriceSummary(null);

    try {
      console.log('Fetching AI price for:', product.name, product.set_name);

      const { data, error } = await supabase.functions.invoke('ai-price-search', {
        body: {
          cardName: product.name,
          setName: product.set_name,
          cardNumber: product.card_number,
        }
      });

      console.log('AI price response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.price) {
        console.log('Setting price:', data.price);
        setUngradedPrice(Math.round(data.price * 100));
        setAiPriceSummary(data.summary || 'AI-estimated price');
      } else if (data?.summary) {
        setAiPriceSummary(data.summary);
      } else {
        console.log('No price in response:', data);
        setAiPriceSummary('No price found');
      }
    } catch (error: any) {
      console.error('Failed to fetch AI price:', error);
      setAiPriceSummary(error?.message || 'Could not find price');
    } finally {
      setIsFetchingAiPrice(false);
    }
  };

  const [formData, setFormData] = useState<{
    quantity: string;
    condition: string;
    grading_company: Enums<"grading_company">;
    grade: string;
    purchase_price: string;
    purchase_date: string;
    purchase_location: string;
  }>({
    quantity: "",
    condition: "NM",
    grading_company: "raw",
    grade: "",
    purchase_price: "",
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_location: "",
  });

  // Reset BGS subgrades when company changes
  useEffect(() => {
    if (formData.grading_company !== 'bgs') {
      setBgsSubgrades({
        centering: '',
        corners: '',
        edges: '',
        surface: '',
      });
    }
  }, [formData.grading_company]);

  // Update form data when product changes and fetch ungraded price immediately
  useEffect(() => {
    if (product) {
      // For sealed products, set grading_company to 'raw' but we'll store category as 'sealed'
      // For cards, use the product's grading_company or default to 'raw'
      const isSealed = product.category === 'sealed';

      setFormData({
        quantity: "",
        condition: "NM",
        grading_company: (product.grading_company as Enums<"grading_company">) || "raw",
        grade: product.grade || "",
        purchase_price: "", // Always start empty
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_location: "",
      });
      setGradedPrice(null);
      setBgsSubgrades({
        centering: '',
        corners: '',
        edges: '',
        surface: '',
      });

      // Fetch market price using backend function as fallback
      const fetchUngradedPrice = async () => {
        setIsFetchingPrice(true);
        try {
          // First prefer price coming with the product (from search)
          if (product.market_price) {
            setUngradedPrice(Math.round(product.market_price * 100));
            return;
          }

          // Try Scrydex first (raw and sealed) via backend helper
          const { data: scryData, error: scryErr } = await supabase.functions.invoke('scrydex-price', {
            body: {
              name: product.name,
              setName: product.set_name,
              cardNumber: product.card_number,
              category: product.category || (product.card_number ? 'raw' : 'sealed')
            }
          });

          if (!scryErr && scryData?.market_price) {
            setUngradedPrice(Math.round(scryData.market_price * 100));
            return;
          }

          setUngradedPrice(null);
        } catch (error) {
          console.error('Failed to fetch ungraded price:', error);
          setUngradedPrice(null);
        } finally {
          setIsFetchingPrice(false);
        }
      };

      fetchUngradedPrice();
    }
  }, [product]);

  useEffect(() => {
    const fetchGradedPrice = async () => {
      if (!product || formData.grading_company === "raw" || !formData.grade) {
        setGradedPrice(null);
        return;
      }

      setIsFetchingPrice(true);
      try {
        const { data, error } = await supabase.functions.invoke('scrydex-price', {
          body: {
            name: product.name,
            setName: product.set_name,
            cardNumber: product.card_number,
            category: product.category || 'raw',
            gradingCompany: formData.grading_company,
            grade: formData.grade
          }
        });

        if (error) {
          console.error('Error fetching graded price:', error);
          setGradedPrice(null);
          return;
        }

        if (data?.graded_price) {
          // Scrydex returns prices in dollars, convert to cents
          setGradedPrice(Math.round(data.graded_price * 100));
        } else {
          setGradedPrice(null);
        }
      } catch (error) {
        console.error('Failed to fetch graded price:', error);
        setGradedPrice(null);
      } finally {
        setIsFetchingPrice(false);
      }
    };

    fetchGradedPrice();
  }, [product, formData.grading_company, formData.grade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Determine the market price to use (graded or ungraded)
      const marketPriceToUse = (formData.grading_company !== "raw" && formData.grade && gradedPrice)
        ? gradedPrice / 100  // Convert from cents to dollars
        : ungradedPrice ? ungradedPrice / 100 : product.market_price; // Use fetched ungraded price for raw cards

      // Check if this exact item already exists (same name, set, grading company, and grade)
      // Normalize grade: treat null and empty string as equivalent
      const normalizedGrade = formData.grade?.trim() || null;

      const isGraded = formData.grading_company !== "raw";

      const { data: existingItems } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", product.name)
        .eq("set_name", product.set_name)
        .eq("grading_company", formData.grading_company);

      // Find matching item by comparing normalized grades
      const existingItem = existingItems?.find(item => {
        const itemGrade = item.grade?.trim() || null;
        return itemGrade === normalizedGrade;
      });

      const purchaseQty = parseInt(formData.quantity || '1');
      const purchasePrice = parseFloat(formData.purchase_price || '0');

      let itemId: string;

      if (existingItem) {
        // Update existing item's quantity
        const newQuantity = existingItem.quantity + purchaseQty;
        // Calculate weighted average purchase price
        const totalCost = (existingItem.purchase_price * existingItem.quantity) + (purchasePrice * purchaseQty);
        const avgPrice = totalCost / newQuantity;

        await updateItem(existingItem.id, {
          quantity: newQuantity,
          purchase_price: avgPrice,
          market_price: marketPriceToUse,
        });

        itemId = existingItem.id;
      } else {
        // Create new item
        // Map raw condition abbreviation to database enum value
        const conditionMap: Record<string, Enums<"card_condition">> = {
          'NM': 'near-mint',
          'LP': 'lightly-played',
          'MP': 'moderately-played',
          'HP': 'heavily-played',
          'DMG': 'damaged',
        };
        const conditionToSave = isGraded ? "near-mint" : (conditionMap[formData.condition] || "near-mint");

        console.log('Adding item - product.image_url:', product.image_url);

        await addItem({
          name: product.name,
          set_name: product.set_name,
          card_number: product.card_number,
          card_image_url: product.image_url,
          quantity: purchaseQty,
          condition: conditionToSave,
          grading_company: formData.grading_company,
          grade: formData.grade || null,
          purchase_price: purchasePrice,
          purchase_date: formData.purchase_date || null,
          purchase_location: formData.purchase_location || null,
          market_price: marketPriceToUse,
          lowest_listed: (product as any).lowest_listed || null,
          notes: null,
          category: product.category || null,
          sale_price: null,
          platform_sold: null,
          language: "English",
        });

        // Get the newly created item ID
        const { data: newItem } = await supabase
          .from("inventory_items")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", product.name)
          .eq("set_name", product.set_name)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        itemId = newItem?.id || "";
      }

      // Always create a purchase entry to track this specific purchase
      if (itemId) {
        await supabase.from("purchase_entries").insert({
          user_id: user.id,
          inventory_item_id: itemId,
          item_name: product.name,
          set_name: product.set_name,
          quantity: purchaseQty,
          purchase_price: purchasePrice,
          notes: null,
        });
      }

      // Celebrate if card is valuable ($100+)
      const totalValue = purchasePrice * purchaseQty;
      const marketValue = (marketPriceToUse || 0) * purchaseQty;
      const celebrationValue = Math.max(totalValue, marketValue);
      celebrate({ type: 'card-added', value: celebrationValue });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle adding to watchlist with grading info
  const handleWatchlist = async () => {
    if (!product) return;

    setIsAddingToWatchlist(true);
    try {
      // Determine the price to use
      const priceToUse = (formData.grading_company !== "raw" && formData.grade && gradedPrice)
        ? gradedPrice / 100
        : ungradedPrice ? ungradedPrice / 100 : product.market_price;

      const success = await addToWatchlist({
        product_name: product.name,
        set_name: product.set_name,
        card_number: product.card_number || null,
        image_url: product.image_url || null,
        category: product.category || 'raw',
        grading_company: formData.grading_company !== 'raw' ? formData.grading_company : null,
        grade: formData.grading_company !== 'raw' ? formData.grade || null : null,
        raw_condition: formData.grading_company === 'raw' ? formData.condition : null,
        current_price: priceToUse || null,
      });

      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  // Check if already watched
  const alreadyWatched = product ? isWatched(product.name, product.set_name, product.card_number) : false;

  // Get grade options based on selected company
  const gradeOptions = formData.grading_company !== 'raw'
    ? getUniqueGradeValues(formData.grading_company)
    : [];

  // Get the current grade's label/name
  const currentGradeLabel = formData.grade
    ? getGradeLabel(formData.grading_company, parseFloat(formData.grade))
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold tracking-tight">Add to Collection</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground/70">
            Set quantity, grading, and purchase price
          </DialogDescription>
        </DialogHeader>

        {product && (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
            {/* Product Preview */}
            <div className="flex gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/20">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-20 h-28 object-contain rounded"
                />
              ) : (
                <div className="w-20 h-28 flex items-center justify-center bg-muted rounded">
                  <span className="text-xs text-muted-foreground">No Image</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold">
                  {product.name}
                  {product.card_number && (
                    <span className="text-muted-foreground font-normal"> #{product.card_number}</span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{product.set_name}</p>
                <div className="mt-2 space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {product.category === 'sealed' ? 'Market' : 'Ungraded Market'}: <span className="text-gold">
                      {(ungradedPrice || product.market_price) ? (
                        `$${ungradedPrice ? (ungradedPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (product.market_price as number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        'Not available'
                      )}
                    </span>
                    {aiPriceSummary && (
                      <span className="ml-1 text-xs text-primary">(AI Est.)</span>
                    )}
                  </p>

                  {/* Reveal AI Price Button - show when price is not available */}
                  {!ungradedPrice && !product.market_price && !isFetchingAiPrice && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchAiPrice}
                      className="h-7 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                    >
                      <Sparkles className="w-3 h-3" />
                      Reveal AI Price
                    </Button>
                  )}

                  {/* Loading state */}
                  {isFetchingAiPrice && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Searching for price...
                    </div>
                  )}

                  {/* AI Summary */}
                  {aiPriceSummary && !isFetchingAiPrice && (
                    <p className="text-xs text-muted-foreground italic line-clamp-2">
                      {aiPriceSummary}
                    </p>
                  )}

                  {/* Lowest Listed Price */}
                  {product.lowest_listed && (
                    <p className="text-sm font-medium text-muted-foreground">
                      Lowest Listed: <span className="text-gold">
                        ${product.lowest_listed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </p>
                  )}

                  {/* Graded Price */}
                  {formData.grading_company !== "raw" && formData.grade && (
                    <p className="text-sm font-medium text-gold">
                      {formData.grading_company.toUpperCase()} {formData.grade}
                      {currentGradeLabel && ` (${currentGradeLabel})`}:
                      {isFetchingPrice ? (
                        <span className="ml-1">Loading...</span>
                      ) : gradedPrice ? (
                        <span className="ml-1">${(gradedPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="ml-1 text-muted-foreground">Price not available</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
                required
              />
            </div>

            {/* Grading - only show for non-sealed products */}
            {product.category !== 'sealed' && (
              <>
                {/* Grading Company */}
                <div className="space-y-2">
                  <Label htmlFor="grading">Grading</Label>
                  <Select
                    value={formData.grading_company}
                    onValueChange={(value: any) => setFormData({ ...formData, grading_company: value, grade: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Constants.public.Enums.grading_company.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company === 'raw' ? 'RAW (Ungraded)' : (
                            <span>
                              {company.toUpperCase()}
                              {GRADING_SCALES[company] && (
                                <span className="text-muted-foreground ml-1">
                                  - {GRADING_SCALES[company].fullName}
                                </span>
                              )}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Raw Card Condition */}
                {formData.grading_company === "raw" && (
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {RAW_CONDITIONS.map((condition) => (
                        <Button
                          key={condition.value}
                          type="button"
                          variant={formData.condition === condition.value ? "default" : "outline"}
                          className={`h-12 flex flex-col items-center justify-center p-1 ${
                            formData.condition === condition.value
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'hover:bg-primary/10'
                          }`}
                          onClick={() => setFormData({ ...formData, condition: condition.value })}
                          title={condition.description}
                        >
                          <span className="text-xs font-bold">{condition.abbrev}</span>
                          <span className="text-[10px] opacity-70 leading-tight">{condition.label.split(' ')[0]}</span>
                        </Button>
                      ))}
                    </div>
                    {/* Condition description */}
                    <p className="text-xs text-muted-foreground">
                      {RAW_CONDITIONS.find(c => c.value === formData.condition)?.description}
                    </p>
                  </div>
                )}

                {/* Grade Selection for Graded Cards */}
                {formData.grading_company !== "raw" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="grade">Grade</Label>
                      <button
                        type="button"
                        onClick={() => setShowGradeInfo(!showGradeInfo)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Info className="w-3 h-3" />
                        {showGradeInfo ? 'Hide' : 'Show'} grade info
                        {showGradeInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Grade info panel */}
                    {showGradeInfo && GRADING_SCALES[formData.grading_company] && (
                      <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1 max-h-32 overflow-y-auto">
                        {GRADING_SCALES[formData.grading_company].grades.slice(0, 6).map((g, idx) => (
                          <div key={`${g.value}-${idx}`} className="flex justify-between">
                            <span className="font-medium">{g.value} - {g.label}</span>
                            <span className="text-muted-foreground">{g.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Grade bubbles */}
                    <div className="grid grid-cols-6 gap-2">
                      {gradeOptions.map((grade) => {
                        const label = getGradeLabel(formData.grading_company, grade);
                        return (
                          <Button
                            key={grade}
                            type="button"
                            variant={formData.grade === grade.toString() ? "default" : "outline"}
                            className={`h-14 flex flex-col items-center justify-center p-1 ${
                              formData.grade === grade.toString()
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'hover:bg-primary/10'
                            }`}
                            onClick={() => setFormData({ ...formData, grade: grade.toString() })}
                          >
                            <span className="text-lg font-bold">{grade}</span>
                            <span className="text-[9px] opacity-70 leading-tight truncate w-full text-center">
                              {label.length > 8 ? label.slice(0, 6) + '..' : label}
                            </span>
                          </Button>
                        );
                      })}
                    </div>

                    {/* BGS Black Label option for grade 10 */}
                    {formData.grading_company === 'bgs' && formData.grade === '10' && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <input
                          type="checkbox"
                          id="blackLabel"
                          className="rounded"
                        />
                        <label htmlFor="blackLabel" className="text-sm font-medium text-amber-600">
                          Black Label (All subgrades 10)
                        </label>
                      </div>
                    )}

                    {/* BGS Subgrades */}
                    {formData.grading_company === 'bgs' && formData.grade && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">BGS Subgrades (Optional)</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {BGS_SUBGRADE_FIELDS.map((field) => (
                            <div key={field.key} className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">{field.abbrev}</Label>
                              <Select
                                value={bgsSubgrades[field.key as keyof BgsSubgrades]}
                                onValueChange={(value) => setBgsSubgrades({ ...bgsSubgrades, [field.key]: value })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">-</SelectItem>
                                  {BGS_SUBGRADE_VALUES.map((val) => (
                                    <SelectItem key={val} value={val.toString()}>{val}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Purchase Details */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Purchase Details</Label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Purchase Price */}
                <div className="space-y-1.5">
                  <Label htmlFor="purchase_price" className="text-xs">Price Paid</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      placeholder="0.00"
                      className="pl-7"
                      required
                    />
                  </div>
                </div>
                
                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="purchase_date" className="text-xs">Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date || ''}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Purchase Location */}
              <div className="space-y-1.5">
                <Label htmlFor="purchase_location" className="text-xs">Where Purchased (optional)</Label>
                <Input
                  id="purchase_location"
                  value={formData.purchase_location || ''}
                  onChange={(e) => setFormData({ ...formData, purchase_location: e.target.value })}
                  placeholder="e.g., eBay, TCGPlayer, Local Card Shop"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 rounded-2xl font-semibold"
                disabled={isSubmitting || isAddingToWatchlist}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleWatchlist}
                className="flex-1 h-12 rounded-2xl font-semibold"
                disabled={isSubmitting || isAddingToWatchlist || alreadyWatched}
                title={alreadyWatched ? "Already in watchlist" : "Add to watchlist"}
              >
                <Eye className="w-4 h-4 mr-1.5" />
                {isAddingToWatchlist ? "Adding..." : alreadyWatched ? "Watched" : "Watch"}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-2xl font-semibold shadow-[0_4px_14px_rgba(0,116,251,0.25)]"
                disabled={isSubmitting || isAddingToWatchlist}
              >
                {isSubmitting ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
