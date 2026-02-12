import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Settings2,
  FileUp,
  Download,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { analyzeCSV, transformRow, ColumnMapping, ColumnType } from "@/lib/csvIntelligence";
import { generateTemplateCSV, downloadCSV } from "@/lib/csv";

type InventoryInsert = Database["public"]["Tables"]["inventory_items"]["Insert"];

interface ParsedRow {
  original: Record<string, any>;
  transformed: Partial<InventoryInsert> | null;
  errors: string[];
  warnings: string[];
  rowIndex: number;
}

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

const AVAILABLE_FIELD_TYPES: { value: ColumnType; label: string }[] = [
  { value: "card_name", label: "Card Name" },
  { value: "set_name", label: "Set Name" },
  { value: "card_number", label: "Card Number" },
  { value: "quantity", label: "Quantity" },
  { value: "purchase_price", label: "Purchase Price" },
  { value: "market_price", label: "Market Price" },
  { value: "grading_company", label: "Grading Company" },
  { value: "grade", label: "Grade" },
  { value: "condition", label: "Condition" },
  { value: "category", label: "Category" },
  { value: "rarity", label: "Rarity" },
  { value: "language", label: "Language" },
  { value: "notes", label: "Notes" },
  { value: "unknown", label: "Skip / Ignore" },
];

const ImportPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"csv" | "xlsx" | "">("");

  // Raw data
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Column mappings
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [detectedFormat, setDetectedFormat] = useState("");

  // Parsed/validated data
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Process file after parsing
  const processFileData = useCallback(
    (parsedHeaders: string[], rows: Record<string, any>[]) => {
      setHeaders(parsedHeaders);
      setRawRows(rows);

      // Run smart analysis
      const analysis = analyzeCSV(parsedHeaders, rows);
      setColumnMappings(analysis.columns);
      setDetectedFormat(analysis.detectedFormat);

      setStep("mapping");
    },
    []
  );

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);

    const extension = file.name.split(".").pop()?.toLowerCase();

    try {
      if (extension === "csv") {
        setFileType("csv");
        const content = await file.text();
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedHeaders = results.meta.fields || [];
            const rows = results.data as Record<string, any>[];
            processFileData(parsedHeaders, rows);
          },
          error: (error) => {
            throw new Error(`CSV parsing failed: ${error.message}`);
          },
        });
      } else if (extension === "xlsx" || extension === "xls") {
        setFileType("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          throw new Error("Excel file is empty or has no data");
        }

        const parsedHeaders = Object.keys(jsonData[0] as object);
        processFileData(parsedHeaders, jsonData as Record<string, any>[]);
      } else {
        throw new Error("Unsupported file format. Please use CSV or Excel (.xlsx, .xls)");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to parse file",
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Update column mapping
  const updateColumnMapping = (columnIndex: number, newType: ColumnType) => {
    setColumnMappings((prev) =>
      prev.map((col, idx) =>
        idx === columnIndex ? { ...col, detectedType: newType, confidence: 1.0, detectionMethod: "exact" as const } : col
      )
    );
  };

  // Transform rows based on current mappings
  const transformedData = useMemo(() => {
    if (rawRows.length === 0 || columnMappings.length === 0) return [];

    return rawRows.map((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const transformed = transformRow(row, columnMappings);

        // Validate required fields
        if (!transformed.name || transformed.name.trim() === "") {
          errors.push("Card name is required");
        }

        if (!transformed.set_name) {
          warnings.push("Set name missing - matching may be less accurate");
        }

        if (transformed.purchase_price === 0) {
          warnings.push("Purchase price is $0");
        }

        // Build the data object
        const data: Partial<InventoryInsert> = {
          name: transformed.name,
          set_name: transformed.set_name || "Unknown",
          card_number: transformed.card_number,
          grading_company: transformed.grading_company as any,
          grade: transformed.grade,
          quantity: transformed.quantity,
          purchase_price: transformed.purchase_price,
          market_price: transformed.market_price,
          category: transformed.category,
          notes: transformed.notes,
        };

        return {
          original: row,
          transformed: errors.length === 0 ? data : null,
          errors,
          warnings,
          rowIndex: index + 1,
        };
      } catch (error) {
        return {
          original: row,
          transformed: null,
          errors: [`Processing error: ${error}`],
          warnings: [],
          rowIndex: index + 1,
        };
      }
    });
  }, [rawRows, columnMappings]);

  // Proceed to preview
  const handleProceedToPreview = () => {
    setParsedRows(transformedData);
    setStep("preview");
  };

  // Import data
  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.transformed !== null);
    if (validRows.length === 0) {
      toast({
        variant: "destructive",
        title: "No valid rows",
        description: "Please fix the errors before importing.",
      });
      return;
    }

    setStep("importing");
    setImportProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const itemsToInsert: InventoryInsert[] = validRows.map((r) => ({
        ...r.transformed!,
        user_id: user.id,
      }));

      // Insert in batches
      const batchSize = 50;
      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < itemsToInsert.length; i += batchSize) {
        const batch = itemsToInsert.slice(i, i + batchSize);

        const { error } = await supabase.from("inventory_items").insert(batch);

        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          imported += batch.length;
        }

        setImportProgress(((i + batch.length) / itemsToInsert.length) * 100);
      }

      setImportResults({
        imported,
        skipped: parsedRows.length - validRows.length,
        errors,
      });

      setStep("complete");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
      setStep("preview");
    }
  };

  // Reset everything
  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setFileType("");
    setHeaders([]);
    setRawRows([]);
    setColumnMappings([]);
    setDetectedFormat("");
    setParsedRows([]);
    setImportProgress(0);
    setImportResults(null);
  };

  const validCount = transformedData.filter((r) => r.errors.length === 0).length;
  const invalidCount = transformedData.filter((r) => r.errors.length > 0).length;

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/inventory")}
                className="rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Import Cards</h1>
            </div>
            <p className="text-muted-foreground ml-12">
              Import your collection from CSV or Excel files
            </p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between relative">
              {["Upload", "Map Columns", "Preview", "Import"].map((label, idx) => {
                const stepKeys: ImportStep[] = ["upload", "mapping", "preview", "importing"];
                const currentIdx = stepKeys.indexOf(step);
                const isComplete = idx < currentIdx || step === "complete";
                const isCurrent = idx === currentIdx;

                return (
                  <div key={label} className="flex flex-col items-center z-10 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        isComplete
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isComplete ? <Check className="h-5 w-5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
              {/* Progress line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-secondary -z-0">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${
                      step === "upload"
                        ? 0
                        : step === "mapping"
                        ? 33
                        : step === "preview"
                        ? 66
                        : 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Step 1: Upload */}
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Drop zone */}
                <div
                  className="rounded-3xl border-2 border-dashed border-border/50 bg-secondary/10 p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/20 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-5 rounded-3xl bg-primary/10">
                      <FileUp className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {isProcessing ? "Processing..." : "Drop your file here"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Supports CSV, Excel (.xlsx, .xls)
                      </p>
                    </div>
                    <Button disabled={isProcessing} className="h-12 px-8 rounded-xl">
                      {isProcessing ? (
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-5 w-5 mr-2" />
                      )}
                      Select File
                    </Button>
                  </div>
                </div>

                {/* Supported formats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-secondary/10 border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <FileSpreadsheet className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium mb-1">CSV Files</h4>
                          <p className="text-xs text-muted-foreground">
                            TCGPlayer, Collectr, Google Sheets exports
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-secondary/10 border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <FileJson className="h-8 w-8 text-blue-500 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium mb-1">Excel Files</h4>
                          <p className="text-xs text-muted-foreground">
                            .xlsx and .xls spreadsheets
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Download template */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20">
                  <div>
                    <h4 className="text-sm font-medium">Need a template?</h4>
                    <p className="text-xs text-muted-foreground">
                      Download our CSV template to get started
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const template = generateTemplateCSV();
                      downloadCSV(template, "cardledger-import-template.csv");
                      toast({
                        title: "Template downloaded",
                        description: "Fill in the template and upload to import.",
                      });
                    }}
                    className="rounded-xl"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Template
                  </Button>
                </div>

                {/* Smart detection info */}
                <Alert className="bg-primary/5 border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    <strong>Smart Detection:</strong> We automatically detect column types like card name, set,
                    price, grade, and more. You can adjust mappings if needed.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Step 2: Column Mapping */}
            {step === "mapping" && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* File info */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div>
                      <h4 className="font-medium">{fileName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {rawRows.length} rows • {headers.length} columns
                      </p>
                    </div>
                  </div>
                  {detectedFormat && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {detectedFormat}
                    </Badge>
                  )}
                </div>

                {/* Column mapping table */}
                <Card className="border-border/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      Column Mappings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {columnMappings.map((col, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-3 rounded-xl bg-secondary/10"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{col.originalHeader}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              Sample: {rawRows[0]?.[col.originalHeader] || "—"}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Select
                            value={col.detectedType}
                            onValueChange={(val) => updateColumnMapping(idx, val as ColumnType)}
                          >
                            <SelectTrigger className="w-[180px] h-9 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_FIELD_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {col.confidence >= 0.8 && col.detectedType !== "unknown" && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex-shrink-0"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Validation summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-secondary/20 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold">{rawRows.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      Total Rows
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-500">{validCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      Valid
                    </p>
                  </div>
                  <div className="bg-red-500/10 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-500">{invalidCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      Errors
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleReset} className="flex-1 h-12 rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProceedToPreview}
                    disabled={validCount === 0}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Preview Data
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preview */}
            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-secondary/20 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold">{parsedRows.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      Total Rows
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-500">
                      {parsedRows.filter((r) => r.errors.length === 0).length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      Ready to Import
                    </p>
                  </div>
                  <div className="bg-red-500/10 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-500">
                      {parsedRows.filter((r) => r.errors.length > 0).length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      Skipped
                    </p>
                  </div>
                </div>

                {/* Data preview table */}
                <Card className="border-border/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Data Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Card Name</TableHead>
                            <TableHead>Set</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                            <TableHead className="text-right">Market</TableHead>
                            <TableHead>Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedRows.slice(0, 50).map((row) => (
                            <TableRow
                              key={row.rowIndex}
                              className={row.errors.length > 0 ? "bg-red-500/5" : ""}
                            >
                              <TableCell className="font-mono text-xs">{row.rowIndex}</TableCell>
                              <TableCell>
                                {row.errors.length > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-500/10 text-red-500 border-red-500/20"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Error
                                  </Badge>
                                ) : row.warnings.length > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Warn
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    OK
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {row.transformed?.name || (
                                  <span className="text-red-500">{row.errors.join(", ")}</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {row.transformed?.set_name || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {row.transformed?.quantity || 1}
                              </TableCell>
                              <TableCell className="text-right">
                                ${row.transformed?.purchase_price?.toFixed(2) || "0.00"}
                              </TableCell>
                              <TableCell className="text-right text-emerald-500">
                                {row.transformed?.market_price
                                  ? `$${row.transformed.market_price.toFixed(2)}`
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                {row.transformed?.grading_company !== "raw" && row.transformed?.grade
                                  ? `${row.transformed.grading_company?.toUpperCase()} ${row.transformed.grade}`
                                  : row.transformed?.grading_company === "raw"
                                  ? "Raw"
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {parsedRows.length > 50 && (
                      <div className="p-3 text-center text-sm text-muted-foreground border-t">
                        Showing first 50 of {parsedRows.length} rows
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Errors list */}
                {parsedRows.filter((r) => r.errors.length > 0).length > 0 && (
                  <Alert className="bg-red-500/5 border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-sm">
                      <strong className="text-red-500">
                        {parsedRows.filter((r) => r.errors.length > 0).length} rows have errors
                      </strong>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        {parsedRows
                          .filter((r) => r.errors.length > 0)
                          .slice(0, 5)
                          .map((r) => (
                            <li key={r.rowIndex}>
                              Row {r.rowIndex}: {r.errors.join(", ")}
                            </li>
                          ))}
                        {parsedRows.filter((r) => r.errors.length > 0).length > 5 && (
                          <li className="text-muted-foreground/60">
                            ...and {parsedRows.filter((r) => r.errors.length > 0).length - 5} more
                          </li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("mapping")}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={parsedRows.filter((r) => r.errors.length === 0).length === 0}
                    className="flex-1 h-12 rounded-xl"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import {parsedRows.filter((r) => r.errors.length === 0).length} Cards
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Importing */}
            {step === "importing" && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-16"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Upload className="h-10 w-10 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Importing...</h2>
                  <p className="text-muted-foreground">Adding cards to your inventory</p>
                </div>

                <div className="max-w-md mx-auto space-y-3">
                  <Progress value={importProgress} className="h-3 rounded-full" />
                  <p className="text-center text-sm text-muted-foreground">
                    {Math.round(importProgress)}% complete
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {step === "complete" && importResults && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Import Complete! 🎉</h2>
                  <p className="text-muted-foreground">
                    Your cards have been added to your inventory
                  </p>
                </div>

                {/* Results summary */}
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                  <div className="bg-emerald-500/10 rounded-2xl p-6 text-center">
                    <p className="text-3xl font-bold text-emerald-500">{importResults.imported}</p>
                    <p className="text-sm text-muted-foreground mt-1">Cards Imported</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-2xl p-6 text-center">
                    <p className="text-3xl font-bold text-amber-500">{importResults.skipped}</p>
                    <p className="text-sm text-muted-foreground mt-1">Skipped</p>
                  </div>
                </div>

                {importResults.errors.length > 0 && (
                  <Alert className="max-w-md mx-auto mb-8 bg-red-500/5 border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-sm">
                      <strong className="text-red-500">Some errors occurred:</strong>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        {importResults.errors.slice(0, 3).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-3 max-w-md mx-auto">
                  <Button variant="outline" onClick={handleReset} className="flex-1 h-12 rounded-xl">
                    Import More
                  </Button>
                  <Button
                    onClick={() => navigate("/inventory")}
                    className="flex-1 h-12 rounded-xl"
                  >
                    View Inventory
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default ImportPage;
