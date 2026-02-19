import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Undo2,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  exportToCSV,
  downloadCSV,
  generateTemplateCSV,
  parseAndValidateCSV,
  exportToJSON,
  downloadJSON,
  ValidationResult,
} from "@/lib/csv";
import {
  ColumnMapping,
  ColumnType,
  validateImportRows,
  ImportValidationWarning,
  getImportHistory,
  saveImportHistoryEntry,
  removeImportHistoryEntry,
  ImportHistoryEntry,
  NormalizedCard,
  transformRow,
} from "@/lib/csvIntelligence";
import {
  normalizeCardName,
  normalizeSetName,
  stringSimilarity,
} from "@/lib/cardMatcher";
import { normalizeCardNumber } from "@/lib/csvIntelligence";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryInsert = Database["public"]["Tables"]["inventory_items"]["Insert"];

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onImportComplete: () => void;
}

const COLUMN_TYPE_OPTIONS: { value: ColumnType; label: string }[] = [
  { value: 'unknown', label: 'Skip / Ignore' },
  { value: 'card_name', label: 'Card Name' },
  { value: 'set_name', label: 'Set Name' },
  { value: 'card_number', label: 'Card Number' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'purchase_price', label: 'Purchase Price' },
  { value: 'market_price', label: 'Market Price' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'condition', label: 'Condition' },
  { value: 'grading_company', label: 'Grading Company' },
  { value: 'grade', label: 'Grade' },
  { value: 'category', label: 'Category' },
  { value: 'notes', label: 'Notes' },
  { value: 'image_url', label: 'Image URL' },
  { value: 'cert_number', label: 'Cert Number' },
  { value: 'language', label: 'Language' },
  { value: 'tcg_type', label: 'TCG Type' },
  { value: 'year', label: 'Year' },
  { value: 'brand', label: 'Brand' },
  { value: 'player', label: 'Player' },
  { value: 'sport', label: 'Sport' },
];

function confidenceBadge(confidence: number) {
  if (confidence >= 0.95) return <Badge className="bg-emerald-500/20 text-emerald-600 text-[10px] px-1.5">High</Badge>;
  if (confidence >= 0.7) return <Badge className="bg-amber-500/20 text-amber-600 text-[10px] px-1.5">Med</Badge>;
  if (confidence > 0) return <Badge className="bg-red-500/20 text-red-600 text-[10px] px-1.5">Low</Badge>;
  return null;
}

export const ImportExportDialog = ({
  open,
  onOpenChange,
  items,
  onImportComplete,
}: ImportExportDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"export" | "import" | "history">("export");
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importProgressLabel, setImportProgressLabel] = useState("");
  const [validationResults, setValidationResults] = useState<{
    valid: ValidationResult[];
    invalid: ValidationResult[];
    totalRows: number;
    detectedFormat?: string;
    detectedDelimiter?: string;
    columnMappings?: ColumnMapping[];
  } | null>(null);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "mapping" | "importing">("upload");
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ImportValidationWarning[]>([]);
  const [showAllWarnings, setShowAllWarnings] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([]);
  const [rawParsedData, setRawParsedData] = useState<{ headers: string[]; rows: Record<string, any>[] } | null>(null);
  const [undoingImportId, setUndoingImportId] = useState<string | null>(null);

  // Load import history when history tab is selected
  useEffect(() => {
    if (activeTab === 'history') {
      setImportHistory(getImportHistory());
    }
  }, [activeTab]);

  /**
   * Background image fetch after import (unchanged from original)
   */
  const fetchImagesInBackground = async (userId: string) => {
    try {
      const { data: itemsWithoutImages } = await supabase
        .from("inventory_items")
        .select("id, name, set_name, card_number, category")
        .eq("user_id", userId)
        .is("card_image_url", null)
        .limit(300);

      if (!itemsWithoutImages || itemsWithoutImages.length === 0) return;

      interface ProductGroup {
        name: string;
        set_name: string;
        card_number: string | null;
        category: string | null;
        ids: string[];
      }

      const uniqueProducts = new Map<string, ProductGroup>();
      itemsWithoutImages.forEach(item => {
        const key = `${item.name.toLowerCase()}|${item.set_name?.toLowerCase() || ''}|${item.card_number || ''}`;
        if (!uniqueProducts.has(key)) {
          uniqueProducts.set(key, { name: item.name, set_name: item.set_name || '', card_number: item.card_number, category: item.category, ids: [item.id] });
        } else {
          uniqueProducts.get(key)!.ids.push(item.id);
        }
      });

      const products = Array.from(uniqueProducts.values());
      let imagesFound = 0;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
          const { data: searchResults, error } = await supabase.functions.invoke('products-search', {
            body: { query: product.name }
          });
          if (error || !searchResults?.products) continue;

          const resultsWithImages = searchResults.products.filter((p: any) =>
            p.image_url && !p.image_url.includes('placehold')
          );
          if (resultsWithImages.length === 0) continue;

          const importedName = normalizeCardName(product.name);
          const importedSet = normalizeSetName(product.set_name);
          const importedNumber = normalizeCardNumber(product.card_number);

          const scored = resultsWithImages.map((result: any) => {
            const rName = normalizeCardName(result.name || '');
            const rSet = normalizeSetName(result.set_name || '');
            const rNum = normalizeCardNumber(result.card_number);
            let score = 0;
            if (importedName === rName) score += 40;
            else if (importedName.includes(rName) || rName.includes(importedName)) score += 30;
            else score += Math.floor(stringSimilarity(importedName, rName) * 25);
            if (importedSet && rSet) {
              if (importedSet === rSet) score += 30;
              else if (importedSet.includes(rSet) || rSet.includes(importedSet)) score += 20;
            }
            if (importedNumber && rNum && importedNumber === rNum) score += 35;
            return { result, score };
          }).sort((a: any, b: any) => b.score - a.score);

          if (scored[0].score >= 25) {
            await supabase
              .from("inventory_items")
              .update({ card_image_url: scored[0].result.image_url })
              .in("id", product.ids);
            imagesFound++;
          }
        } catch {}
        await new Promise(resolve => setTimeout(resolve, 350));
      }

      if (imagesFound > 0) {
        toast({ title: "Card images found! 🖼️", description: `Matched ${imagesFound} images. Pull to refresh!`, duration: 8000 });
      }
    } catch {}
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast({ variant: "destructive", title: "No items to export", description: "Add some items first." });
      return;
    }
    const csv = exportToCSV(items);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `cardledger-inventory-${date}.csv`);
    toast({ title: "CSV downloaded! 📋", description: `${items.length} cards exported.` });
  };

  const handleExportJSON = () => {
    if (items.length === 0) {
      toast({ variant: "destructive", title: "No items to export", description: "Add some items first." });
      return;
    }
    const json = exportToJSON(items);
    const date = new Date().toISOString().split("T")[0];
    downloadJSON(json, `cardledger-backup-${date}.json`);
    toast({ title: "Backup saved! 💾", description: `${items.length} cards backed up.` });
  };

  const handleDownloadTemplate = () => {
    const template = generateTemplateCSV();
    downloadCSV(template, "cardledger-import-template.csv");
    toast({ title: "Template ready!", description: "Fill in your card details and upload." });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const content = await file.text();
      const results = await parseAndValidateCSV(content);
      setValidationResults(results);
      setColumnMappings(results.columnMappings || []);

      // Store raw parsed data for re-processing if user changes column mappings
      const Papa = (await import('papaparse')).default;
      const { detectDelimiter } = await import('@/lib/csvIntelligence');
      const delimiter = detectDelimiter(content);
      const parsed = Papa.parse(content, { header: true, skipEmptyLines: true, delimiter });
      setRawParsedData({ headers: parsed.meta.fields || [], rows: parsed.data as Record<string, any>[] });

      // Run validation warnings
      const existingNameSet = new Set(items.map(i =>
        `${i.name.toLowerCase()}|${i.set_name?.toLowerCase() || ''}|${i.card_number || ''}`
      ));

      const transformedCards = (parsed.data as Record<string, any>[]).map(row =>
        transformRow(row, results.columnMappings || [])
      ).filter(c => c.name.trim() !== '');

      const warnings = validateImportRows(transformedCards, existingNameSet);
      setValidationWarnings(warnings);

      setImportStep("preview");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to parse CSV", description: error.message });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleColumnMappingChange = useCallback((index: number, newType: ColumnType) => {
    setColumnMappings(prev => {
      const updated = [...prev];
      // Clear any existing column with same type (except unknown)
      if (newType !== 'unknown') {
        updated.forEach((col, i) => {
          if (i !== index && col.detectedType === newType) {
            updated[i] = { ...col, detectedType: 'unknown', confidence: 0, detectionMethod: 'none' };
          }
        });
      }
      updated[index] = { ...updated[index], detectedType: newType, confidence: newType === 'unknown' ? 0 : 0.9, detectionMethod: 'manual' };
      return updated;
    });
  }, []);

  const reprocessWithMappings = useCallback(async () => {
    if (!rawParsedData) return;
    setIsProcessing(true);
    try {
      const valid: ValidationResult[] = [];
      const invalid: ValidationResult[] = [];

      rawParsedData.rows.forEach((row, index) => {
        try {
          const transformed = transformRow(row, columnMappings);
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!transformed.name || transformed.name.trim() === "") {
            errors.push("Name is required");
          }
          if (!transformed.set_name) {
            warnings.push("Set name not found");
          }

          if (errors.length > 0) {
            invalid.push({ row: index + 1, valid: false, errors, warnings });
            return;
          }

          const data: Partial<InventoryInsert> = {
            name: transformed.name,
            set_name: transformed.set_name,
            card_number: transformed.card_number,
            grading_company: transformed.grading_company as any,
            grade: transformed.grade,
            quantity: transformed.quantity,
            purchase_price: transformed.purchase_price,
            market_price: transformed.market_price,
            category: transformed.category,
            notes: transformed.notes,
          };

          valid.push({ row: index + 1, valid: true, errors: [], warnings, data });
        } catch (error) {
          invalid.push({ row: index + 1, valid: false, errors: [`Error: ${error}`], warnings: [] });
        }
      });

      setValidationResults(prev => prev ? {
        ...prev,
        valid,
        invalid,
        columnMappings: columnMappings,
      } : null);

      setImportStep("preview");
    } finally {
      setIsProcessing(false);
    }
  }, [rawParsedData, columnMappings]);

  const handleImport = async () => {
    if (!validationResults || validationResults.valid.length === 0) return;

    setImportStep("importing");
    setIsProcessing(true);
    setImportProgress(0);
    setImportProgressLabel("Preparing import...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const itemsToInsert: InventoryInsert[] = validationResults.valid
        .filter(r => r.data)
        .map(result => ({ ...result.data, user_id: user.id } as InventoryInsert));

      const totalItems = itemsToInsert.length;
      const insertBatchSize = 50;
      let imported = 0;
      const insertedIds: string[] = [];

      for (let i = 0; i < itemsToInsert.length; i += insertBatchSize) {
        const batch = itemsToInsert.slice(i, i + insertBatchSize);
        const currentCard = batch[0]?.name || '';
        const batchEnd = Math.min(i + insertBatchSize, totalItems);

        setImportProgressLabel(`Importing card ${i + 1} of ${totalItems}: ${currentCard}`);
        setImportProgress(Math.round((i / totalItems) * 100));

        const { data: insertedData, error } = await supabase
          .from("inventory_items")
          .insert(batch)
          .select('id');

        if (error) throw error;

        if (insertedData) {
          insertedIds.push(...insertedData.map((d: any) => d.id));
        }
        imported += batch.length;

        // Yield to UI
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setImportProgress(100);
      setImportProgressLabel(`Import complete! ${imported} cards added.`);

      // Save import history
      const historyEntry: ImportHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        source: validationResults.detectedFormat || 'Unknown',
        format: validationResults.detectedFormat || 'Generic',
        cardCount: imported,
        itemIds: insertedIds,
      };
      saveImportHistoryEntry(historyEntry);

      toast({
        title: "Import complete! 🎉",
        description: `${imported} cards added to your collection.`,
      });

      setTimeout(() => {
        toast({ title: "📷 Finding card images...", description: "Matching images in the background...", duration: 10000 });
      }, 1000);

      setValidationResults(null);
      setRawParsedData(null);
      setColumnMappings([]);
      setValidationWarnings([]);
      setImportStep("upload");
      onImportComplete();
      onOpenChange(false);

      fetchImagesInBackground(user.id);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Import failed", description: error.message });
      setImportStep("preview");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndoImport = async (entry: ImportHistoryEntry) => {
    if (!entry.itemIds || entry.itemIds.length === 0) {
      toast({ variant: "destructive", title: "Cannot undo", description: "No item IDs stored for this import." });
      return;
    }

    setUndoingImportId(entry.id);
    try {
      // Delete in batches of 100
      for (let i = 0; i < entry.itemIds.length; i += 100) {
        const batch = entry.itemIds.slice(i, i + 100);
        const { error } = await supabase
          .from("inventory_items")
          .delete()
          .in("id", batch);
        if (error) throw error;
      }

      removeImportHistoryEntry(entry.id);
      setImportHistory(getImportHistory());
      onImportComplete();

      toast({ title: "Import undone! ↩️", description: `Removed ${entry.cardCount} cards from that import.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Undo failed", description: error.message });
    } finally {
      setUndoingImportId(null);
    }
  };

  const resetImport = () => {
    setValidationResults(null);
    setRawParsedData(null);
    setColumnMappings([]);
    setValidationWarnings([]);
    setImportStep("upload");
    setImportProgress(0);
    setImportProgressLabel("");
    setShowAllWarnings(false);
  };

  const errorWarnings = validationWarnings.filter(w => w.severity === 'error');
  const warnWarnings = validationWarnings.filter(w => w.severity === 'warning');
  const infoWarnings = validationWarnings.filter(w => w.severity === 'info');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Import / Export</DialogTitle>
          <DialogDescription className="text-center">
            Move your collection in or out — supports TCGPlayer, eBay, PSA, BGS, COMC, CardMarket & more
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-secondary/30 p-1">
            <TabsTrigger value="export" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* ===== EXPORT TAB ===== */}
          <TabsContent value="export" className="mt-4 space-y-4">
            <div className="p-5 rounded-2xl bg-secondary/20">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Export to CSV</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download as spreadsheet for Excel or Google Sheets
                  </p>
                </div>
              </div>
              <Button onClick={handleExportCSV} disabled={items.length === 0} className="w-full mt-4 h-11 rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/20">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <FileJson className="h-6 w-6 text-violet-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Backup to JSON</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Full backup with all inventory data
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportJSON} disabled={items.length === 0} className="w-full mt-4 h-11 rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Backup
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              {items.length} items available for export
            </p>
          </TabsContent>

          {/* ===== IMPORT TAB ===== */}
          <TabsContent value="import" className="mt-4 space-y-4">
            <AnimatePresence mode="wait">
              {/* UPLOAD STEP */}
              {importStep === "upload" && (
                <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="rounded-2xl border-2 border-dashed border-border/50 bg-secondary/10 p-8 text-center">
                    <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFileSelect} className="hidden" />
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-2xl bg-primary/10">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Drop your CSV here</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          TCGPlayer, eBay, PSA, BGS, COMC, CardMarket, or any CSV
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Auto-detects commas, semicolons, tabs & pipes
                        </p>
                      </div>
                      <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="h-11 px-6 rounded-xl">
                        {isProcessing ? "Processing..." : "Select File"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20">
                    <div>
                      <h4 className="text-sm font-medium">Need a template?</h4>
                      <p className="text-xs text-muted-foreground">Download CSV template</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="rounded-xl">
                      <Download className="h-4 w-4 mr-2" />
                      Template
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* PREVIEW STEP */}
              {importStep === "preview" && validationResults && (
                <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  {/* Detected Format */}
                  {validationResults.detectedFormat && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm">
                          Format: <span className="font-semibold">{validationResults.detectedFormat}</span>
                        </p>
                        {validationResults.detectedDelimiter && validationResults.detectedDelimiter !== ',' && (
                          <p className="text-xs text-muted-foreground">
                            Delimiter: {validationResults.detectedDelimiter === '\t' ? 'Tab' : validationResults.detectedDelimiter === ';' ? 'Semicolon' : validationResults.detectedDelimiter}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-secondary/20 rounded-2xl p-3 text-center">
                      <p className="text-2xl font-bold">{validationResults.totalRows}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total</p>
                    </div>
                    <div className="bg-emerald-500/10 rounded-2xl p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-500">{validationResults.valid.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Valid</p>
                    </div>
                    <div className="bg-red-500/10 rounded-2xl p-3 text-center">
                      <p className="text-2xl font-bold text-red-500">{validationResults.invalid.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Invalid</p>
                    </div>
                  </div>

                  {/* Column Mapping Editor */}
                  <div className="rounded-2xl bg-secondary/10 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Column Mappings</h4>
                      <Button variant="ghost" size="sm" onClick={() => setImportStep("mapping")} className="text-xs h-7">
                        Edit Mappings
                      </Button>
                    </div>
                    <div className="p-3 space-y-1.5 max-h-32 overflow-y-auto">
                      {columnMappings.filter(c => c.detectedType !== 'unknown').map((col, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground truncate flex-1">"{col.originalHeader}"</span>
                          <span className="text-foreground">→</span>
                          <span className="font-medium">{COLUMN_TYPE_OPTIONS.find(o => o.value === col.detectedType)?.label}</span>
                          {confidenceBadge(col.confidence)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Validation Warnings */}
                  {validationWarnings.length > 0 && (
                    <div className="rounded-2xl bg-secondary/10 overflow-hidden">
                      <button
                        className="w-full px-4 py-3 border-b border-border/30 flex items-center justify-between hover:bg-secondary/20 transition-colors"
                        onClick={() => setShowAllWarnings(!showAllWarnings)}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <h4 className="text-sm font-semibold">
                            {validationWarnings.length} Warning{validationWarnings.length !== 1 ? 's' : ''}
                          </h4>
                          {errorWarnings.length > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5">{errorWarnings.length} errors</Badge>
                          )}
                          {warnWarnings.length > 0 && (
                            <Badge className="bg-amber-500/20 text-amber-600 text-[10px] px-1.5">{warnWarnings.length} warnings</Badge>
                          )}
                        </div>
                        {showAllWarnings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {showAllWarnings && (
                        <div className="p-3 max-h-40 overflow-y-auto space-y-1">
                          {validationWarnings.slice(0, 50).map((w, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              {w.severity === 'error' && <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />}
                              {w.severity === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />}
                              {w.severity === 'info' && <Info className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />}
                              <span className="text-muted-foreground">{w.message}</span>
                            </div>
                          ))}
                          {validationWarnings.length > 50 && (
                            <p className="text-xs text-muted-foreground">...and {validationWarnings.length - 50} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row Preview Table */}
                  {validationResults.valid.length > 0 && (
                    <div className="rounded-2xl bg-secondary/10 overflow-hidden">
                      <div className="px-4 py-3 border-b border-border/30">
                        <h4 className="text-sm font-semibold">Preview (first 10 rows)</h4>
                      </div>
                      <ScrollArea className="max-h-64">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border/20 bg-secondary/20">
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Set</th>
                                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cost</th>
                                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Market</th>
                              </tr>
                            </thead>
                            <tbody>
                              {validationResults.valid.slice(0, 10).map((result) => (
                                <tr key={result.row} className="border-b border-border/10 hover:bg-secondary/10">
                                  <td className="px-3 py-2 text-muted-foreground">{result.row}</td>
                                  <td className="px-3 py-2 font-medium truncate max-w-[200px]">{result.data?.name}</td>
                                  <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">{result.data?.set_name || '—'}</td>
                                  <td className="px-3 py-2 text-right">{result.data?.quantity}</td>
                                  <td className="px-3 py-2 text-right">${result.data?.purchase_price?.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right text-emerald-500">{result.data?.market_price != null ? `$${result.data.market_price.toFixed(2)}` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Errors */}
                  {validationResults.invalid.length > 0 && (
                    <div className="p-3 rounded-2xl bg-red-500/10">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <p className="font-medium text-red-500">{validationResults.invalid.length} rows skipped (missing name)</p>
                          {validationResults.invalid.slice(0, 3).map(r => (
                            <div key={r.row}>Row {r.row}: {r.errors.join(", ")}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={resetImport} className="flex-1 h-12 rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={validationResults.valid.length === 0}
                      className="flex-1 h-12 rounded-xl"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import {validationResults.valid.length} Items
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* COLUMN MAPPING EDITOR */}
              {importStep === "mapping" && (
                <motion.div key="mapping" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="px-1">
                    <h3 className="font-semibold">Edit Column Mappings</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reassign columns if auto-detection got something wrong
                    </p>
                  </div>

                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2 pr-2">
                      {columnMappings.map((col, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">"{col.originalHeader}"</p>
                            {rawParsedData && rawParsedData.rows.length > 0 && (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                e.g. "{String(rawParsedData.rows[0][col.originalHeader] || '').slice(0, 40)}"
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {confidenceBadge(col.confidence)}
                            <Select
                              value={col.detectedType}
                              onValueChange={(value) => handleColumnMappingChange(index, value as ColumnType)}
                            >
                              <SelectTrigger className="w-[160px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COLUMN_TYPE_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setImportStep("preview")} className="flex-1 h-11 rounded-xl">
                      Back
                    </Button>
                    <Button onClick={reprocessWithMappings} disabled={isProcessing} className="flex-1 h-11 rounded-xl">
                      {isProcessing ? "Reprocessing..." : "Apply & Preview"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* IMPORTING STEP */}
              {importStep === "importing" && (
                <motion.div key="importing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Importing...</h3>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px] mx-auto">
                      {importProgressLabel}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Progress value={importProgress} className="h-2 rounded-full" />
                    <p className="text-center text-sm text-muted-foreground">
                      {Math.round(importProgress)}% complete
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ===== HISTORY TAB ===== */}
          <TabsContent value="history" className="mt-4 space-y-4">
            {importHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No import history yet</p>
                <p className="text-xs mt-1">Import some cards and they'll show up here</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3 pr-2">
                  {importHistory.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-2xl bg-secondary/20 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{entry.format}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()} • {entry.cardCount} cards
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={undoingImportId === entry.id}
                          onClick={() => handleUndoImport(entry)}
                        >
                          {undoingImportId === entry.id ? (
                            <div className="h-3 w-3 border-2 border-destructive border-t-transparent rounded-full animate-spin mr-1" />
                          ) : (
                            <Undo2 className="h-3 w-3 mr-1" />
                          )}
                          Undo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
