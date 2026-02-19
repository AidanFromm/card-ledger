import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Filter,
  CheckSquare,
  Package,
  Award,
  Box,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
// Dynamic imports for code splitting - jsPDF (~417KB) and autoTable loaded on demand
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
import Papa from "papaparse";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  currentFilter?: {
    category?: string;
    searchTerm?: string;
  };
}

type ExportFormat = "csv-all" | "csv-custom" | "pdf" | "json";

interface ExportField {
  key: keyof InventoryItem | "profit_loss";
  label: string;
  defaultIncluded: boolean;
}

const EXPORT_FIELDS: ExportField[] = [
  { key: "name", label: "Card Name", defaultIncluded: true },
  { key: "set_name", label: "Set Name", defaultIncluded: true },
  { key: "card_number", label: "Card Number", defaultIncluded: true },
  { key: "grading_company", label: "Grading Company", defaultIncluded: true },
  { key: "grade", label: "Grade", defaultIncluded: true },
  { key: "quantity", label: "Quantity", defaultIncluded: true },
  { key: "purchase_price", label: "Purchase Price", defaultIncluded: true },
  { key: "market_price", label: "Current Value", defaultIncluded: true },
  { key: "profit_loss", label: "Profit/Loss", defaultIncluded: true },
  { key: "category", label: "Category", defaultIncluded: false },
  { key: "condition", label: "Condition", defaultIncluded: false },
  { key: "notes", label: "Notes", defaultIncluded: false },
  { key: "language", label: "Language", defaultIncluded: false },
  { key: "created_at", label: "Date Added", defaultIncluded: true },
];

export const ExportDialog = ({
  open,
  onOpenChange,
  items,
  currentFilter,
}: ExportDialogProps) => {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv-all");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(EXPORT_FIELDS.filter((f) => f.defaultIncluded).map((f) => f.key))
  );
  const [useCurrentFilters, setUseCurrentFilters] = useState(true);

  // Apply filters if needed
  const filteredItems = useMemo(() => {
    if (!useCurrentFilters) return items;

    return items.filter((item) => {
      if (item.quantity === 0) return false;

      if (currentFilter?.category && currentFilter.category !== "all") {
        if (currentFilter.category === "raw" && item.grading_company !== "raw") return false;
        if (currentFilter.category === "graded" && item.grading_company === "raw") return false;
        if (
          currentFilter.category === "sealed" &&
          item.category?.toLowerCase() !== "sealed"
        )
          return false;
      }

      if (currentFilter?.searchTerm) {
        const search = currentFilter.searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(search) ||
          item.set_name.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [items, currentFilter, useCurrentFilters]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = filteredItems.reduce(
      (sum, item) => sum + item.purchase_price * item.quantity,
      0
    );
    const totalValue = filteredItems.reduce(
      (sum, item) => sum + (item.market_price || item.purchase_price) * item.quantity,
      0
    );
    const totalProfit = totalValue - totalCost;

    return { totalItems, totalCost, totalValue, totalProfit };
  }, [filteredItems]);

  const toggleField = (fieldKey: string) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
      } else {
        newSet.add(fieldKey);
      }
      return newSet;
    });
  };

  const selectAllFields = () => {
    setSelectedFields(new Set(EXPORT_FIELDS.map((f) => f.key)));
  };

  const selectDefaultFields = () => {
    setSelectedFields(
      new Set(EXPORT_FIELDS.filter((f) => f.defaultIncluded).map((f) => f.key))
    );
  };

  // Build export data
  const buildExportData = () => {
    return filteredItems.map((item) => {
      const row: Record<string, any> = {};

      if (selectedFields.has("name")) row["Card Name"] = item.name;
      if (selectedFields.has("set_name")) row["Set Name"] = item.set_name;
      if (selectedFields.has("card_number")) row["Card Number"] = item.card_number || "";
      if (selectedFields.has("grading_company"))
        row["Grading Company"] = item.grading_company?.toUpperCase() || "RAW";
      if (selectedFields.has("grade")) row["Grade"] = item.grade || "";
      if (selectedFields.has("quantity")) row["Quantity"] = item.quantity;
      if (selectedFields.has("purchase_price"))
        row["Purchase Price"] = item.purchase_price.toFixed(2);
      if (selectedFields.has("market_price"))
        row["Current Value"] = (item.market_price || item.purchase_price).toFixed(2);
      if (selectedFields.has("profit_loss")) {
        const profitLoss =
          (item.market_price || item.purchase_price) * item.quantity -
          item.purchase_price * item.quantity;
        row["Profit/Loss"] = profitLoss.toFixed(2);
      }
      if (selectedFields.has("category")) row["Category"] = item.category || "";
      if (selectedFields.has("condition")) row["Condition"] = item.condition || "";
      if (selectedFields.has("notes")) row["Notes"] = item.notes || "";
      if (selectedFields.has("language")) row["Language"] = item.language || "";
      if (selectedFields.has("created_at"))
        row["Date Added"] = format(new Date(item.created_at), "yyyy-MM-dd");

      return row;
    });
  };

  // Export handlers
  const handleExportCSV = (allFields: boolean = false) => {
    const fieldsToInclude = allFields
      ? new Set(EXPORT_FIELDS.map((f) => f.key))
      : selectedFields;

    const originalSelected = selectedFields;
    if (allFields) {
      // Temporarily set all fields
      setSelectedFields(fieldsToInclude);
    }

    const data = buildExportData();
    const csv = Papa.unparse(data);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const date = format(new Date(), "yyyy-MM-dd");
    link.href = URL.createObjectURL(blob);
    link.download = `cardledger-inventory-${date}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    if (allFields) {
      setSelectedFields(originalSelected);
    }

    toast({
      title: "Export successful",
      description: `Exported ${filteredItems.length} items to CSV.`,
    });
    onOpenChange(false);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredItems, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const link = document.createElement("a");
    const date = format(new Date(), "yyyy-MM-dd");
    link.href = URL.createObjectURL(blob);
    link.download = `cardledger-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: "Backup successful",
      description: `Backed up ${filteredItems.length} items to JSON.`,
    });
    onOpenChange(false);
  };

  const handleExportPDF = async () => {
    // Dynamic imports for code splitting - jsPDF (~417KB) + autoTable
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const doc = new jsPDF();
    const date = format(new Date(), "MMMM d, yyyy");

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CardLedger Inventory Report", 14, 22);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated on ${date}`, 14, 30);
    doc.text(`For Insurance/Documentation Purposes`, 14, 36);

    // Summary box
    doc.setDrawColor(200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 42, 182, 30, 3, 3, "FD");

    doc.setTextColor(60);
    doc.setFontSize(9);
    doc.text("PORTFOLIO SUMMARY", 20, 52);

    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Total Items: ${totals.totalItems}`, 20, 62);
    doc.text(`Total Cost: $${totals.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 70, 62);
    doc.text(`Current Value: $${totals.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 130, 62);

    // Table data
    const tableData = filteredItems.map((item) => {
      const value = (item.market_price || item.purchase_price) * item.quantity;
      const cost = item.purchase_price * item.quantity;
      const profitLoss = value - cost;

      return [
        item.name.length > 30 ? item.name.substring(0, 27) + "..." : item.name,
        item.set_name.length > 20 ? item.set_name.substring(0, 17) + "..." : item.set_name,
        item.grading_company !== "raw" && item.grade
          ? `${item.grading_company?.toUpperCase()} ${item.grade}`
          : "Raw",
        item.quantity.toString(),
        `$${item.purchase_price.toFixed(2)}`,
        `$${(item.market_price || item.purchase_price).toFixed(2)}`,
        `${profitLoss >= 0 ? "+" : ""}$${profitLoss.toFixed(2)}`,
      ];
    });

    // Table
    autoTable(doc, {
      startY: 78,
      head: [["Card Name", "Set", "Grade", "Qty", "Cost", "Value", "P/L"]],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 22, halign: "right" },
        6: { cellWidth: 22, halign: "right" },
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} | CardLedger Export | ${date}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(`cardledger-insurance-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "PDF generated",
      description: `Created insurance report with ${filteredItems.length} items.`,
    });
    onOpenChange(false);
  };

  const handleExport = async () => {
    switch (exportFormat) {
      case "csv-all":
        handleExportCSV(true);
        break;
      case "csv-custom":
        handleExportCSV(false);
        break;
      case "pdf":
        await handleExportPDF();
        break;
      case "json":
        handleExportJSON();
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Export Inventory</DialogTitle>
          <DialogDescription className="text-center">
            Choose your export format and options
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold">{filteredItems.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Items</p>
          </div>
          <div className="bg-navy-500/10 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-navy-500">
              ${totals.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Value</p>
          </div>
        </div>

        {/* Filter option */}
        {currentFilter && (currentFilter.category || currentFilter.searchTerm) && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Checkbox
              id="useFilters"
              checked={useCurrentFilters}
              onCheckedChange={(checked) => setUseCurrentFilters(checked === true)}
            />
            <Label htmlFor="useFilters" className="text-sm flex items-center gap-2 cursor-pointer">
              <Filter className="h-4 w-4" />
              Apply current filters
              {currentFilter.category && currentFilter.category !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {currentFilter.category}
                </Badge>
              )}
            </Label>
          </div>
        )}

        {/* Format selection */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Export Format</h4>
          <RadioGroup
            value={exportFormat}
            onValueChange={(v) => setExportFormat(v as ExportFormat)}
            className="space-y-2"
          >
            <Label
              htmlFor="csv-all"
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                exportFormat === "csv-all"
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-secondary/20 border-2 border-transparent hover:bg-secondary/30"
              }`}
            >
              <RadioGroupItem value="csv-all" id="csv-all" />
              <FileSpreadsheet className="h-5 w-5 text-navy-500" />
              <div className="flex-1">
                <p className="font-medium text-sm">CSV (All Fields)</p>
                <p className="text-xs text-muted-foreground">
                  Complete spreadsheet export
                </p>
              </div>
            </Label>

            <Label
              htmlFor="csv-custom"
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                exportFormat === "csv-custom"
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-secondary/20 border-2 border-transparent hover:bg-secondary/30"
              }`}
            >
              <RadioGroupItem value="csv-custom" id="csv-custom" />
              <CheckSquare className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium text-sm">CSV (Custom Fields)</p>
                <p className="text-xs text-muted-foreground">
                  Choose which columns to include
                </p>
              </div>
            </Label>

            <Label
              htmlFor="pdf"
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                exportFormat === "pdf"
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-secondary/20 border-2 border-transparent hover:bg-secondary/30"
              }`}
            >
              <RadioGroupItem value="pdf" id="pdf" />
              <FileText className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="font-medium text-sm">PDF (Insurance Report)</p>
                <p className="text-xs text-muted-foreground">
                  Formatted document for documentation
                </p>
              </div>
            </Label>

            <Label
              htmlFor="json"
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                exportFormat === "json"
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-secondary/20 border-2 border-transparent hover:bg-secondary/30"
              }`}
            >
              <RadioGroupItem value="json" id="json" />
              <FileJson className="h-5 w-5 text-violet-500" />
              <div className="flex-1">
                <p className="font-medium text-sm">JSON (Full Backup)</p>
                <p className="text-xs text-muted-foreground">
                  Complete data backup with all metadata
                </p>
              </div>
            </Label>
          </RadioGroup>
        </div>

        {/* Custom fields selection */}
        {exportFormat === "csv-custom" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Select Fields</h4>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllFields}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectDefaultFields}
                  className="h-7 text-xs"
                >
                  Default
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
              {EXPORT_FIELDS.map((field) => (
                <Label
                  key={field.key}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm ${
                    selectedFields.has(field.key)
                      ? "bg-primary/10 text-foreground"
                      : "bg-secondary/20 text-muted-foreground"
                  }`}
                >
                  <Checkbox
                    checked={selectedFields.has(field.key)}
                    onCheckedChange={() => toggleField(field.key)}
                  />
                  {field.label}
                </Label>
              ))}
            </div>
          </motion.div>
        )}

        {/* Export button */}
        <Button onClick={handleExport} className="w-full h-12 rounded-xl" size="lg">
          <Download className="h-5 w-5 mr-2" />
          Export {filteredItems.length} Items
        </Button>
      </DialogContent>
    </Dialog>
  );
};
