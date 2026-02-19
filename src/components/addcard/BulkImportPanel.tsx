import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Check, 
  AlertCircle,
  FileText,
  Loader2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";

interface ParsedCard {
  name: string;
  set_name: string;
  quantity: number;
  condition: string;
  purchase_price: number;
  isValid: boolean;
  errors: string[];
  rowNumber: number;
}

interface BulkImportPanelProps {
  onImport: (cards: ParsedCard[]) => Promise<void>;
}

const REQUIRED_COLUMNS = ['name', 'set_name', 'quantity', 'condition', 'purchase_price'];

const CSV_TEMPLATE = `name,set_name,quantity,condition,purchase_price,grading_company,grade,notes
"Charizard VMAX",Brilliant Stars,1,near-mint,25.00,raw,,
"Pikachu V",Vivid Voltage,2,mint,8.50,psa,10,Perfect centering
"Umbreon VMAX",Evolving Skies,1,lightly-played,120.00,raw,,Alt art`;

export const BulkImportPanel = ({ onImport }: BulkImportPanelProps) => {
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cardledger_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateCard = (row: Record<string, string>, rowNumber: number): ParsedCard => {
    const errors: string[] = [];
    
    const name = row.name?.trim() || '';
    const set_name = row.set_name?.trim() || '';
    const quantity = parseInt(row.quantity) || 0;
    const condition = row.condition?.toLowerCase().trim() || 'near-mint';
    const purchase_price = parseFloat(row.purchase_price) || 0;

    if (!name) errors.push('Missing card name');
    if (!set_name) errors.push('Missing set name');
    if (quantity < 1) errors.push('Quantity must be at least 1');
    if (purchase_price < 0) errors.push('Invalid price');

    const validConditions = ['mint', 'near-mint', 'lightly-played', 'moderately-played', 'heavily-played', 'damaged'];
    if (!validConditions.includes(condition)) {
      errors.push(`Invalid condition: ${condition}`);
    }

    return {
      name,
      set_name,
      quantity: quantity || 1,
      condition,
      purchase_price,
      isValid: errors.length === 0,
      errors,
      rowNumber,
    };
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cards: ParsedCard[] = results.data.map((row: any, index) => 
          validateCard(row, index + 2) // +2 for header row and 1-based index
        );

        setParsedCards(cards);
        setStats({
          total: cards.length,
          valid: cards.filter(c => c.isValid).length,
          invalid: cards.filter(c => !c.isValid).length,
        });
        setStep('preview');
        setIsProcessing(false);
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        setIsProcessing(false);
      },
    });
  }, []);

  const handleImport = async () => {
    const validCards = parsedCards.filter(c => c.isValid);
    if (validCards.length === 0) return;

    setStep('importing');
    setImportProgress(0);

    try {
      await onImport(validCards);
      setStep('complete');
    } catch (error) {
      console.error('Import error:', error);
      setStep('preview');
    }
  };

  const resetImport = () => {
    setParsedCards([]);
    setStep('upload');
    setFileName('');
    setStats({ total: 0, valid: 0, invalid: 0 });
    setImportProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl border-2 border-dashed border-border/50 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              {isProcessing ? (
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
              ) : (
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              )}
              <p className="text-lg font-medium text-foreground mb-2">
                {isProcessing ? 'Processing...' : 'Upload CSV File'}
              </p>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to select
              </p>
            </label>
          </div>

          <div className="flex items-center justify-center">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* Format Info */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV Format
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Required columns:</span> name, set_name, quantity, condition, purchase_price</p>
              <p><span className="font-medium">Optional columns:</span> grading_company, grade, notes, category</p>
              <p><span className="font-medium">Conditions:</span> mint, near-mint, lightly-played, moderately-played, heavily-played, damaged</p>
            </div>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Stats */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">{fileName}</p>
                <p className="text-sm text-muted-foreground">{stats.total} cards found</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-navy-500">
                {stats.valid} valid
              </Badge>
              {stats.invalid > 0 && (
                <Badge variant="destructive">
                  {stats.invalid} invalid
                </Badge>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="rounded-xl border border-border/50 overflow-hidden max-h-[40vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Row</TableHead>
                  <TableHead>Card Name</TableHead>
                  <TableHead>Set</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedCards.slice(0, 50).map((card) => (
                  <TableRow key={card.rowNumber} className={!card.isValid ? 'bg-red-500/5' : ''}>
                    <TableCell className="text-muted-foreground">{card.rowNumber}</TableCell>
                    <TableCell className="font-medium">{card.name || '-'}</TableCell>
                    <TableCell>{card.set_name || '-'}</TableCell>
                    <TableCell className="text-center">{card.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {card.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${card.purchase_price.toFixed(2)}</TableCell>
                    <TableCell>
                      {card.isValid ? (
                        <Check className="h-4 w-4 text-navy-500" />
                      ) : (
                        <div className="flex items-center gap-1" title={card.errors.join(', ')}>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {parsedCards.length > 50 && (
              <div className="p-3 text-center text-sm text-muted-foreground border-t">
                Showing first 50 of {parsedCards.length} cards
              </div>
            )}
          </div>

          {/* Error Summary */}
          {stats.invalid > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <h4 className="font-medium text-red-500 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {stats.invalid} cards have errors
              </h4>
              <ul className="text-sm text-red-400 space-y-1 list-disc list-inside">
                {parsedCards
                  .filter(c => !c.isValid)
                  .slice(0, 5)
                  .map(card => (
                    <li key={card.rowNumber}>
                      Row {card.rowNumber}: {card.errors.join(', ')}
                    </li>
                  ))}
                {stats.invalid > 5 && (
                  <li>...and {stats.invalid - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetImport} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={stats.valid === 0}
              className="flex-1 shadow-gold"
            >
              Import {stats.valid} Cards
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 text-center"
        >
          <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Importing Cards...
          </h3>
          <Progress value={importProgress} className="max-w-xs mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(importProgress)}% complete
          </p>
        </motion.div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto bg-navy-500 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Import Complete! 🎉
          </h3>
          <p className="text-muted-foreground mb-6">
            Successfully imported {stats.valid} cards to your collection.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={resetImport}>
              Import More
            </Button>
            <Button onClick={() => window.location.href = '/inventory'}>
              View Inventory
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BulkImportPanel;
