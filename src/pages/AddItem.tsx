import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight,
  Upload, 
  X, 
  AlertTriangle, 
  Trophy, 
  ChevronDown, 
  Star,
  Sparkles,
  ImageOff,
  Calendar,
  DollarSign,
  ShoppingBag,
  StickyNote,
  Camera as CameraIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useFolders } from "@/hooks/useFolders";
import { toast } from "sonner";
import CardImage from "@/components/CardImage";
import { 
  AddMethodSelector, 
  CardSearchPanel,
  ConditionSelector,
  GradingPanel,
  ValuePreview,
  QuickAddMode,
  SuccessCelebration,
  BulkImportPanel,
  FolderSelector,
  TagInput,
  BarcodeScanPanel,
  AICameraPanel,
  type AddMethod,
  type CardSearchResult,
  CONDITIONS,
} from "@/components/addcard";

// Purchase sources
const PURCHASE_SOURCES = [
  { value: "lcs", label: "Local Card Shop" },
  { value: "ebay", label: "eBay" },
  { value: "tcgplayer", label: "TCGPlayer" },
  { value: "whatnot", label: "Whatnot" },
  { value: "trade", label: "Trade" },
  { value: "gift", label: "Gift" },
  { value: "pack", label: "Pack Pull" },
  { value: "facebook", label: "Facebook Marketplace" },
  { value: "other", label: "Other" },
];

// Wizard steps
type WizardStep = 'method' | 'search' | 'details' | 'pricing' | 'extras';

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'method', label: 'Add Method' },
  { key: 'search', label: 'Find Card' },
  { key: 'details', label: 'Card Details' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'extras', label: 'Extras' },
];

const AddItem = () => {
  const navigate = useNavigate();
  const { addItem, uploadCardImage, checkForDuplicates } = useInventoryDb();
  const { addItemToFolder } = useFolders();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('method');
  const [addMethod, setAddMethod] = useState<AddMethod | null>(null);
  
  // Selected card from search
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  
  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ exists: boolean; quantity: number } | null>(null);
  const [showSportsFields, setShowSportsFields] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Quick add mode
  const [quickAddEnabled, setQuickAddEnabled] = useState(false);
  const [quickAddDefaults, setQuickAddDefaults] = useState({
    condition: "near-mint",
    quantity: 1,
    folderId: undefined as string | undefined,
  });
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    set_name: "",
    card_number: "",
    category: "",
    purchase_price: "",
    sale_price: "",
    quantity: "1",
    condition: "near-mint",
    grading_company: "raw",
    grade: "",
    cert_number: "",
    platform_sold: "",
    purchase_source: "",
    purchase_date: "",
    notes: "",
    // Sports card fields
    player: "",
    team: "",
    sport: "",
    year: "",
    brand: "",
    rookie: false,
    // Extra fields
    folderId: null as string | null,
    tags: [] as string[],
  });

  // Check for duplicates when relevant fields change
  const checkDuplicates = useCallback(async () => {
    if (!formData.name || !formData.set_name) {
      setDuplicateWarning(null);
      return;
    }

    const result = await checkForDuplicates(
      formData.name,
      formData.set_name,
      formData.grading_company,
      formData.grade || null
    );

    if (result.exists) {
      setDuplicateWarning({ exists: true, quantity: result.quantity });
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.name, formData.set_name, formData.grading_company, formData.grade, checkForDuplicates]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkDuplicates();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [checkDuplicates]);

  // Sync selected card to form
  useEffect(() => {
    if (selectedCard) {
      setFormData(prev => ({
        ...prev,
        name: selectedCard.name,
        set_name: selectedCard.set_name,
        card_number: selectedCard.number || "",
        category: selectedCard.rarity || "",
      }));
      if (selectedCard.image_url) {
        setImagePreview(selectedCard.image_url);
      }
    }
  }, [selectedCard]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMethodSelect = (method: AddMethod) => {
    setAddMethod(method);
    if (method === 'search' || method === 'barcode' || method === 'camera') {
      setCurrentStep('search');
    } else if (method === 'manual') {
      setCurrentStep('details');
    } else if (method === 'bulk') {
      // Stay on method step, show bulk import panel
    }
  };

  const handleCardSelect = (card: CardSearchResult) => {
    setSelectedCard(card);
    
    if (quickAddEnabled) {
      // In quick add mode, add immediately with defaults
      handleQuickAdd(card);
    } else {
      // Normal mode, go to details
      setCurrentStep('details');
    }
  };

  const handleQuickAdd = async (card: CardSearchResult) => {
    setUploading(true);
    try {
      await addItem({
        name: card.name,
        set_name: card.set_name,
        category: card.rarity || null,
        purchase_price: card.estimated_value || 0,
        quantity: quickAddDefaults.quantity,
        condition: quickAddDefaults.condition as any,
        grading_company: "raw" as any,
        card_image_url: card.image_url || null,
      } as any);

      if (quickAddDefaults.folderId) {
        // Note: We'd need the item ID here, which requires refactoring
      }

      setShowSuccess(true);
      setSelectedCard(null);
    } catch (error) {
      console.error("Error quick adding card:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!formData.name || !formData.set_name || !formData.purchase_price || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = imagePreview;
      
      // Only upload if it's a local file (data URL)
      if (imageFile) {
        imageUrl = await uploadCardImage(imageFile);
      }

      await addItem({
        name: formData.name,
        set_name: formData.set_name,
        category: formData.category || null,
        purchase_price: parseFloat(formData.purchase_price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        quantity: parseInt(formData.quantity),
        condition: formData.condition as any,
        grading_company: formData.grading_company as any,
        grade: formData.grade || null,
        platform_sold: formData.platform_sold || null,
        card_image_url: imageUrl || null,
        notes: formData.notes || null,
        // Sports card fields
        player: formData.player || null,
        team: formData.team || null,
        sport: formData.sport || null,
        year: formData.year ? parseInt(formData.year) : null,
        brand: formData.brand || null,
        rookie: formData.rookie,
      } as any);

      setShowSuccess(true);
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleBulkImport = async (cards: any[]) => {
    for (const card of cards) {
      await addItem({
        name: card.name,
        set_name: card.set_name,
        quantity: card.quantity,
        condition: card.condition as any,
        purchase_price: card.purchase_price,
        grading_company: "raw" as any,
      } as any);
    }
    toast.success(`Successfully imported ${cards.length} cards!`);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      set_name: "",
      card_number: "",
      category: "",
      purchase_price: "",
      sale_price: "",
      quantity: "1",
      condition: "near-mint",
      grading_company: "raw",
      grade: "",
      cert_number: "",
      platform_sold: "",
      purchase_source: "",
      purchase_date: "",
      notes: "",
      player: "",
      team: "",
      sport: "",
      year: "",
      brand: "",
      rookie: false,
      folderId: null,
      tags: [],
    });
    setSelectedCard(null);
    setImageFile(null);
    setImagePreview("");
    setCurrentStep('method');
    setAddMethod(null);
    setShowSuccess(false);
  };

  const goToNextStep = () => {
    const stepIndex = WIZARD_STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[stepIndex + 1].key);
    }
  };

  const goToPrevStep = () => {
    const stepIndex = WIZARD_STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[stepIndex - 1].key);
    }
  };

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.key === currentStep);
  const isGraded = formData.grading_company !== "raw";
  const selectedCondition = CONDITIONS.find(c => c.value === formData.condition);

  return (
    <div className="min-h-screen bg-background pt-safe pb-24">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Cards</h1>
            <p className="text-sm text-muted-foreground">
              {currentStep === 'method' && 'Choose how to add cards'}
              {currentStep === 'search' && 'Search for your card'}
              {currentStep === 'details' && 'Enter card details'}
              {currentStep === 'pricing' && 'Set pricing info'}
              {currentStep === 'extras' && 'Add extra details'}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        {addMethod && addMethod !== 'bulk' && (
          <div className="mb-6">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {WIZARD_STEPS.filter(s => 
                addMethod === 'manual' ? s.key !== 'search' : true
              ).map((step, index) => {
                const stepIdx = WIZARD_STEPS.findIndex(s => s.key === step.key);
                const isCurrent = step.key === currentStep;
                const isComplete = currentStepIndex > stepIdx;
                
                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                        ${isCurrent 
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                          : isComplete 
                            ? 'bg-navy-500 text-white' 
                            : 'bg-secondary text-muted-foreground'
                        }
                      `}>
                        {isComplete ? '✓' : index + 1}
                      </div>
                      <span className={`text-xs mt-1 ${isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < WIZARD_STEPS.filter(s => addMethod === 'manual' ? s.key !== 'search' : true).length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${isComplete ? 'bg-navy-500' : 'bg-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <Card className="max-w-2xl mx-auto border-border/50 bg-gradient-vault">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {/* Step: Method Selection */}
              {currentStep === 'method' && (
                <motion.div
                  key="method"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <AddMethodSelector
                    selectedMethod={addMethod}
                    onSelectMethod={handleMethodSelect}
                  />
                  
                  {/* Bulk Import Panel (shown inline) */}
                  {addMethod === 'bulk' && (
                    <div className="mt-6">
                      <BulkImportPanel onImport={handleBulkImport} />
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step: Search */}
              {currentStep === 'search' && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Barcode Scanner */}
                  {addMethod === 'barcode' && (
                    <BarcodeScanPanel
                      onScanComplete={(barcode, type) => {
                        // In production, look up the barcode in a database
                        console.log('Scanned:', barcode, type);
                        toast.info(`Scanned: ${barcode}. Looking up card...`);
                        // For now, switch to search mode
                        setAddMethod('search');
                      }}
                      onCancel={() => {
                        setAddMethod(null);
                        setCurrentStep('method');
                      }}
                    />
                  )}

                  {/* AI Camera Recognition */}
                  {addMethod === 'camera' && (
                    <AICameraPanel
                      onCardRecognized={(card) => {
                        setSelectedCard(card);
                        setCurrentStep('details');
                      }}
                      onCancel={() => {
                        setAddMethod(null);
                        setCurrentStep('method');
                      }}
                    />
                  )}

                  {/* Standard Search */}
                  {addMethod === 'search' && (
                    <>
                      {/* Quick Add Mode Toggle */}
                      <QuickAddMode
                        isEnabled={quickAddEnabled}
                        onToggle={setQuickAddEnabled}
                        defaults={quickAddDefaults}
                        onDefaultsChange={setQuickAddDefaults}
                        selectedCard={selectedCard}
                        onConfirm={handleQuickAdd}
                        onSkip={() => setSelectedCard(null)}
                        onClear={() => setSelectedCard(null)}
                      />

                      {/* Card Search */}
                      <CardSearchPanel
                        onSelectCard={handleCardSelect}
                      />
                    </>
                  )}

                  {/* Navigation */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={goToPrevStep} className="flex-1">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    {selectedCard && !quickAddEnabled && addMethod === 'search' && (
                      <Button onClick={goToNextStep} className="flex-1 shadow-gold">
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step: Card Details */}
              {currentStep === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Card Image Preview */}
                  <div className="flex gap-6">
                    {/* Image */}
                    <div className="w-32 flex-shrink-0">
                      {imagePreview ? (
                        <div className="relative">
                          <CardImage
                            src={imagePreview}
                            alt="Card preview"
                            size="xl"
                            rounded="xl"
                            border
                            borderColor="border-border/50"
                            containerClassName="w-full shadow-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 z-10"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-border/50 border-dashed rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-secondary/20">
                          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground text-center">
                            Tap to upload
                          </p>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                        </label>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Card Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="e.g., Charizard VMAX"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="set_name">
                          Set Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="set_name"
                          placeholder="e.g., Brilliant Stars"
                          value={formData.set_name}
                          onChange={(e) => setFormData({ ...formData, set_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="card_number">Card Number</Label>
                          <Input
                            id="card_number"
                            placeholder="e.g., 134/174"
                            value={formData.card_number}
                            onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Rarity</Label>
                          <Input
                            id="category"
                            placeholder="e.g., Ultra Rare"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate Warning */}
                  {duplicateWarning?.exists && (
                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-amber-600 dark:text-amber-400">
                        You already own <strong>{duplicateWarning.quantity}</strong> of this card.
                        Adding more will create a new entry.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Condition Selector */}
                  <ConditionSelector
                    value={formData.condition}
                    onChange={(value) => setFormData({ ...formData, condition: value })}
                    showValueImpact={true}
                    estimatedMintValue={selectedCard?.estimated_value}
                  />

                  {/* Grading Panel */}
                  <GradingPanel
                    isGraded={isGraded}
                    onGradedChange={(graded) => setFormData({ 
                      ...formData, 
                      grading_company: graded ? "psa" : "raw" 
                    })}
                    company={formData.grading_company}
                    onCompanyChange={(company) => setFormData({ ...formData, grading_company: company })}
                    grade={formData.grade}
                    onGradeChange={(grade) => setFormData({ ...formData, grade })}
                    certNumber={formData.cert_number}
                    onCertNumberChange={(cert) => setFormData({ ...formData, cert_number: cert })}
                  />

                  {/* Sports Card Fields */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowSportsFields(!showSportsFields)}
                      className="flex items-center justify-between w-full p-4 glass-card rounded-xl hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-chart-4/15 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-chart-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Sports Card Details</p>
                          <p className="text-xs text-muted-foreground">Player, team, and year info</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showSportsFields ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showSportsFields && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="player">Player Name</Label>
                              <Input
                                id="player"
                                placeholder="e.g., LeBron James"
                                value={formData.player}
                                onChange={(e) => setFormData({ ...formData, player: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="team">Team</Label>
                              <Input
                                id="team"
                                placeholder="e.g., Lakers"
                                value={formData.team}
                                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="sport">Sport</Label>
                              <Select
                                value={formData.sport}
                                onValueChange={(value) => setFormData({ ...formData, sport: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sport" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="baseball">Baseball</SelectItem>
                                  <SelectItem value="basketball">Basketball</SelectItem>
                                  <SelectItem value="football">Football</SelectItem>
                                  <SelectItem value="hockey">Hockey</SelectItem>
                                  <SelectItem value="soccer">Soccer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="year">Year</Label>
                              <Input
                                id="year"
                                type="number"
                                placeholder="e.g., 2023"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 glass-card rounded-xl">
                            <div className="flex items-center gap-3">
                              <Star className="w-5 h-5 text-amber-500" />
                              <div>
                                <p className="font-medium">Rookie Card</p>
                                <p className="text-xs text-muted-foreground">First year card</p>
                              </div>
                            </div>
                            <Switch
                              checked={formData.rookie}
                              onCheckedChange={(checked) => setFormData({ ...formData, rookie: checked })}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={goToPrevStep} className="flex-1">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={goToNextStep} className="flex-1 shadow-gold">
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step: Pricing */}
              {currentStep === 'pricing' && (
                <motion.div
                  key="pricing"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Value Preview */}
                  {selectedCard?.estimated_value && (
                    <ValuePreview
                      rawValue={selectedCard.estimated_value}
                      gradedValue={selectedCard.estimated_value * 2.5} // Rough estimate
                      condition={formData.condition}
                      costBasis={formData.purchase_price ? parseFloat(formData.purchase_price) : undefined}
                      isGraded={isGraded}
                      grade={formData.grade}
                    />
                  )}

                  {/* Pricing Fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_price" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Cost Basis <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        step="0.01"
                        placeholder="What you paid"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">
                        Quantity <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFormData({ 
                            ...formData, 
                            quantity: String(Math.max(1, parseInt(formData.quantity) - 1)) 
                          })}
                        >
                          -
                        </Button>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          className="text-center"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFormData({ 
                            ...formData, 
                            quantity: String(parseInt(formData.quantity) + 1) 
                          })}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_date" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Purchase Date
                      </Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchase_source" className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Purchase Source
                      </Label>
                      <Select
                        value={formData.purchase_source}
                        onValueChange={(value) => setFormData({ ...formData, purchase_source: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Where did you buy it?" />
                        </SelectTrigger>
                        <SelectContent>
                          {PURCHASE_SOURCES.map(source => (
                            <SelectItem key={source.value} value={source.value}>
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={goToPrevStep} className="flex-1">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={goToNextStep} className="flex-1 shadow-gold">
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step: Extras */}
              {currentStep === 'extras' && (
                <motion.div
                  key="extras"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Folder Selector */}
                  <FolderSelector
                    selectedFolderId={formData.folderId}
                    onSelect={(folderId) => setFormData({ ...formData, folderId })}
                  />

                  {/* Tags */}
                  <TagInput
                    tags={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                  />

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes about this card..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Summary Card */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Card:</span>
                        <p className="font-medium truncate">{formData.name || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Set:</span>
                        <p className="font-medium truncate">{formData.set_name || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Condition:</span>
                        <Badge variant="outline">{selectedCondition?.abbrev || 'NM'}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost:</span>
                        <p className="font-medium">${formData.purchase_price || '0.00'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p className="font-medium">{formData.quantity}</p>
                      </div>
                      {isGraded && (
                        <div>
                          <span className="text-muted-foreground">Grade:</span>
                          <p className="font-medium">{formData.grading_company.toUpperCase()} {formData.grade}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Final Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={goToPrevStep} className="flex-1">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={uploading}
                      className="flex-1 shadow-gold hover:shadow-gold-strong"
                    >
                      {uploading ? "Adding..." : "Add Card"}
                      <Sparkles className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>

      {/* Success Celebration */}
      <SuccessCelebration
        isVisible={showSuccess}
        cardName={formData.name}
        cardImage={imagePreview}
        value={formData.purchase_price ? parseFloat(formData.purchase_price) : undefined}
        onAddAnother={resetForm}
        onViewInventory={() => navigate('/inventory')}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
};

export default AddItem;
