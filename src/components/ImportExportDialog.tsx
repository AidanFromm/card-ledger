import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  AlertCircle,
  CheckCircle2,
  X,
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

export const ImportExportDialog = ({
  open,
  onOpenChange,
  items,
  onImportComplete,
}: ImportExportDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<{
    valid: ValidationResult[];
    invalid: ValidationResult[];
    totalRows: number;
    detectedFormat?: string;
  } | null>(null);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "importing">("upload");

  /**
   * Advanced Card Matching Engine for Background Image Fetch
   *
   * Uses multi-signal matching:
   * 1. Card name (normalized, fuzzy matching)
   * 2. Set name (normalized, fuzzy matching)
   * 3. Card number (extracted and normalized)
   * 4. Combined scoring with weighted signals
   */
  const fetchImagesInBackground = async (userId: string) => {
    try {
      // Get items without images, including card_number for matching
      const { data: itemsWithoutImages } = await supabase
        .from("inventory_items")
        .select("id, name, set_name, card_number, category")
        .eq("user_id", userId)
        .is("card_image_url", null)
        .limit(300);

      if (!itemsWithoutImages || itemsWithoutImages.length === 0) {
        console.log("Background: No items without images");
        return;
      }

      // Group items by name+set for efficient batch processing
      interface ProductGroup {
        name: string;
        set_name: string;
        card_number: string | null;
        category: string | null;
        ids: string[];
      }

      const uniqueProducts = new Map<string, ProductGroup>();
      itemsWithoutImages.forEach(item => {
        // Create a unique key based on name + set + number
        const key = `${item.name.toLowerCase()}|${item.set_name?.toLowerCase() || ''}|${item.card_number || ''}`;
        if (!uniqueProducts.has(key)) {
          uniqueProducts.set(key, {
            name: item.name,
            set_name: item.set_name || '',
            card_number: item.card_number,
            category: item.category,
            ids: [item.id]
          });
        } else {
          uniqueProducts.get(key)!.ids.push(item.id);
        }
      });

      console.log(` Background Matcher: Processing ${uniqueProducts.size} unique cards from ${itemsWithoutImages.length} items`);

      const products = Array.from(uniqueProducts.values());
      let imagesFound = 0;
      let perfectMatches = 0;
      let fuzzyMatches = 0;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        try {
          // Normalize the imported card data
          const importedName = normalizeCardName(product.name);
          const importedSet = normalizeSetName(product.set_name);
          const importedNumber = normalizeCardNumber(product.card_number);

          console.log(`\n[${i + 1}/${products.length}] Matching: "${product.name}" | Set: "${product.set_name}" | #${product.card_number || 'N/A'}`);

          // Search using the card name
          const { data: searchResults, error } = await supabase.functions.invoke('products-search', {
            body: { query: product.name }
          });

          if (error) {
            console.error(`  ❌ Search error:`, error.message);
            continue;
          }

          if (!searchResults?.products || searchResults.products.length === 0) {
            console.log(`  ❌ No results found`);
            continue;
          }

          // Filter to results with images
          const resultsWithImages = searchResults.products.filter((p: any) =>
            p.image_url && !p.image_url.includes('placehold')
          );

          if (resultsWithImages.length === 0) {
            console.log(`  ❌ ${searchResults.products.length} results but none have images`);
            continue;
          }

          console.log(`   Found ${resultsWithImages.length} results with images`);

          // Score each result using multi-signal matching
          interface ScoredResult {
            result: any;
            score: number;
            nameScore: number;
            setScore: number;
            numberScore: number;
            matchType: string;
          }

          const scoredResults: ScoredResult[] = resultsWithImages.map((result: any) => {
            const resultName = normalizeCardName(result.name || '');
            const resultSet = normalizeSetName(result.set_name || '');
            const resultNumber = normalizeCardNumber(result.card_number);

            // Calculate individual scores
            let nameScore = 0;
            let setScore = 0;
            let numberScore = 0;

            // Name matching (0-40 points)
            if (importedName === resultName) {
              nameScore = 40; // Exact match
            } else if (importedName.includes(resultName) || resultName.includes(importedName)) {
              nameScore = 30; // Contains match
            } else {
              const similarity = stringSimilarity(importedName, resultName);
              nameScore = Math.floor(similarity * 25); // Fuzzy match (0-25)
            }

            // Set matching (0-30 points)
            if (importedSet && resultSet) {
              if (importedSet === resultSet) {
                setScore = 30; // Exact match
              } else if (importedSet.includes(resultSet) || resultSet.includes(importedSet)) {
                setScore = 20; // Contains match
              } else {
                const similarity = stringSimilarity(importedSet, resultSet);
                setScore = Math.floor(similarity * 15); // Fuzzy match (0-15)
              }
            }

            // Number matching (0-35 points) - Very important for exact card identification
            if (importedNumber && resultNumber) {
              if (importedNumber === resultNumber) {
                numberScore = 35; // Exact match
              } else {
                // Try numeric comparison (handles "146" vs "0146")
                const numImported = parseInt(importedNumber.replace(/\D/g, ''), 10);
                const numResult = parseInt(resultNumber.replace(/\D/g, ''), 10);
                if (!isNaN(numImported) && !isNaN(numResult) && numImported === numResult) {
                  numberScore = 30; // Numeric match
                }
              }
            }

            const totalScore = nameScore + setScore + numberScore;

            // Determine match type
            let matchType = 'none';
            if (nameScore >= 30 && setScore >= 20 && numberScore >= 30) {
              matchType = 'perfect';
            } else if (nameScore >= 30 && numberScore >= 30) {
              matchType = 'name+number';
            } else if (nameScore >= 30 && setScore >= 20) {
              matchType = 'name+set';
            } else if (nameScore >= 25) {
              matchType = 'name-only';
            }

            return {
              result,
              score: totalScore,
              nameScore,
              setScore,
              numberScore,
              matchType,
            };
          });

          // Sort by score (highest first)
          scoredResults.sort((a, b) => b.score - a.score);

          // Get best match
          const bestMatch = scoredResults[0];

          // Require minimum score of 25 (at least a decent name match)
          if (bestMatch.score < 25) {
            console.log(`  ❌ Best score ${bestMatch.score} below threshold (25)`);
            continue;
          }

          // Log match details
          const { result, score, nameScore, setScore, numberScore, matchType } = bestMatch;
          console.log(`  ✅ MATCH [${matchType}] Score: ${score} (name:${nameScore} set:${setScore} num:${numberScore})`);
          console.log(`     → "${result.name}" | ${result.set_name} | #${result.card_number || 'N/A'}`);

          // Update the database
          const { error: updateError } = await supabase
            .from("inventory_items")
            .update({ card_image_url: result.image_url })
            .in("id", product.ids);

          if (updateError) {
            console.error(`  ❌ DB update failed:`, updateError.message);
          } else {
            imagesFound++;
            if (matchType === 'perfect') perfectMatches++;
            else fuzzyMatches++;
          }

        } catch (error) {
          console.error(`  ❌ Error processing "${product.name}":`, error);
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 350));
      }

      // Summary
      console.log(`\n${'='.repeat(50)}`);
      console.log(` MATCHING COMPLETE`);
      console.log(`   Total items: ${itemsWithoutImages.length}`);
      console.log(`   Unique cards: ${products.length}`);
      console.log(`   Images found: ${imagesFound}`);
      console.log(`   Perfect matches: ${perfectMatches}`);
      console.log(`   Fuzzy matches: ${fuzzyMatches}`);
      console.log(`${'='.repeat(50)}\n`);

      if (imagesFound > 0) {
        toast({
          title: "✅ Images matched!",
          description: `Found ${imagesFound} images (${perfectMatches} perfect, ${fuzzyMatches} fuzzy). Pull to refresh!`,
          duration: 8000,
        });
      } else {
        toast({
          title: "Image search complete",
          description: `Searched ${products.length} cards. Try searching manually in the app.`,
          duration: 5000,
        });
      }

    } catch (error) {
      console.error("Background image fetch failed:", error);
      toast({
        variant: "destructive",
        title: "Image fetch failed",
        description: "There was an error fetching images. Try refreshing manually.",
      });
    }
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "No items to export",
        description: "Add some items to your inventory first.",
      });
      return;
    }

    const csv = exportToCSV(items);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `cardledger-inventory-${date}.csv`);

    toast({
      title: "Export successful",
      description: `Exported ${items.length} items to CSV.`,
    });
  };

  const handleExportJSON = () => {
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "No items to export",
        description: "Add some items to your inventory first.",
      });
      return;
    }

    const json = exportToJSON(items);
    const date = new Date().toISOString().split("T")[0];
    downloadJSON(json, `cardledger-backup-${date}.json`);

    toast({
      title: "Backup successful",
      description: `Backed up ${items.length} items to JSON.`,
    });
  };

  const handleDownloadTemplate = () => {
    const template = generateTemplateCSV();
    downloadCSV(template, "cardledger-import-template.csv");

    toast({
      title: "Template downloaded",
      description: "Fill in the template and upload to import.",
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const content = await file.text();
      const results = await parseAndValidateCSV(content);
      setValidationResults(results);
      setImportStep("preview");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to parse CSV",
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = async () => {
    if (!validationResults || validationResults.valid.length === 0) return;

    setImportStep("importing");
    setIsProcessing(true);
    setImportProgress(0);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build items to insert (images will be fetched when viewing items)
      const itemsToInsert: InventoryInsert[] = validationResults.valid
        .filter(r => r.data)
        .map(result => ({
          ...result.data,
          user_id: user.id,
        } as InventoryInsert));

      setImportProgress(10);

      // Insert in batches
      const insertBatchSize = 50;
      let imported = 0;

      for (let i = 0; i < itemsToInsert.length; i += insertBatchSize) {
        const batch = itemsToInsert.slice(i, i + insertBatchSize);

        const { error } = await supabase.from("inventory_items").insert(batch);

        if (error) throw error;

        imported += batch.length;
        setImportProgress(10 + (imported / itemsToInsert.length) * 90);
      }

      toast({
        title: "Import successful!",
        description: `Imported ${imported} items to your inventory.`,
      });

      // Show persistent toast about images
      setTimeout(() => {
        toast({
          title: " Loading images...",
          description: "Finding product images in background. This may take a minute. We'll notify you when done!",
          duration: 10000,
        });
      }, 1000);

      // Reset state and close dialog
      setValidationResults(null);
      setImportStep("upload");
      onImportComplete();
      onOpenChange(false);

      // Fetch images in background after dialog closes
      fetchImagesInBackground(user.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
      setImportStep("preview");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setValidationResults(null);
    setImportStep("upload");
    setImportProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Import / Export</DialogTitle>
          <DialogDescription className="text-center">
            Export your inventory or import cards from a CSV file
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-secondary/30 p-1">
            <TabsTrigger value="export" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="import" className="mt-4 space-y-4">
            <AnimatePresence mode="wait">
              {importStep === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="rounded-2xl border-2 border-dashed border-border/50 bg-secondary/10 p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-2xl bg-primary/10">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Upload CSV File</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Supports TCGPlayer, Scrydex, and other exports
                        </p>
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="h-11 px-6 rounded-xl"
                      >
                        {isProcessing ? "Processing..." : "Select File"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20">
                    <div>
                      <h4 className="text-sm font-medium">Need a template?</h4>
                      <p className="text-xs text-muted-foreground">
                        Download CSV template
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="rounded-xl">
                      <Download className="h-4 w-4 mr-2" />
                      Template
                    </Button>
                  </div>
                </motion.div>
              )}

              {importStep === "preview" && validationResults && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Detected Format */}
                  {validationResults.detectedFormat && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <p className="text-sm">
                        Detected format: <span className="font-semibold">{validationResults.detectedFormat}</span>
                      </p>
                    </div>
                  )}

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-secondary/20 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold">{validationResults.totalRows}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Rows</p>
                    </div>
                    <div className="bg-navy-500/10 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold text-navy-500">{validationResults.valid.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Valid</p>
                    </div>
                    <div className="bg-red-500/10 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold text-red-500">{validationResults.invalid.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Invalid</p>
                    </div>
                  </div>

                  {/* Errors */}
                  {validationResults.invalid.length > 0 && (
                    <div className="p-4 rounded-2xl bg-red-500/10">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-red-500 mb-2">
                            {validationResults.invalid.length} rows have errors
                          </p>
                          <div className="max-h-24 overflow-y-auto text-xs space-y-1 text-muted-foreground">
                            {validationResults.invalid.slice(0, 5).map((result) => (
                              <div key={result.row}>
                                Row {result.row}: {result.errors.join(", ")}
                              </div>
                            ))}
                            {validationResults.invalid.length > 5 && (
                              <div className="text-muted-foreground/60">
                                ...and {validationResults.invalid.length - 5} more errors
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Valid rows preview */}
                  {validationResults.valid.length > 0 && (
                    <div className="rounded-2xl bg-secondary/10 overflow-hidden">
                      <div className="px-4 py-3 border-b border-border/30">
                        <h4 className="text-sm font-semibold">Preview (first 5 rows)</h4>
                      </div>
                      <div className="divide-y divide-border/20">
                        {validationResults.valid.slice(0, 5).map((result) => (
                          <div key={result.row} className="p-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="h-4 w-4 text-navy-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-sm truncate">{result.data?.name}</span>
                                  <span className="text-xs text-muted-foreground flex-shrink-0">
                                    x{result.data?.quantity}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {result.data?.set_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Cost: <span className="text-foreground">${result.data?.purchase_price?.toFixed(2)}</span>
                                  {' • '}
                                  Market: <span className="text-navy-500">${result.data?.market_price?.toFixed(2) || 'N/A'}</span>
                                </p>
                                {result.warnings && result.warnings.length > 0 && (
                                  <p className="text-[10px] text-amber-500 mt-1">
                                     {result.warnings.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
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

              {importStep === "importing" && (
                <motion.div
                  key="importing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-12"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Importing...</h3>
                    <p className="text-sm text-muted-foreground">
                      Adding items to your inventory
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
