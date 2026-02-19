import Papa from "papaparse";
import type { Database } from "@/integrations/supabase/types";
import { analyzeCSV, transformRow, detectDelimiter, ColumnMapping, NormalizedCard } from "./csvIntelligence";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryInsert = Database["public"]["Tables"]["inventory_items"]["Insert"];

// CSV column headers for export/import (CardLedger native format)
export const CSV_HEADERS = [
  "name",
  "set_name",
  "card_number",
  "grading_company",
  "grade",
  "quantity",
  "purchase_price",
  "market_price",
  "category",
  "notes",
];

// Template row for download
export const CSV_TEMPLATE_ROW = {
  name: "Charizard",
  set_name: "Base Set",
  card_number: "4",
  grading_company: "psa",
  grade: "10",
  quantity: "1",
  purchase_price: "500.00",
  market_price: "750.00",
  category: "cards",
  notes: "1st Edition",
};

// =============================================
// COLUMN MAPPING FOR EXTERNAL FORMATS
// =============================================

// Map external column names to CardLedger field names
const COLUMN_MAPPINGS: Record<string, string> = {
  // CardLedger native
  "name": "name",
  "set_name": "set_name",
  "card_number": "card_number",
  "grading_company": "grading_company",
  "grade": "grade",
  "condition": "condition",
  "quantity": "quantity",
  "purchase_price": "purchase_price",
  "market_price": "market_price",
  "category": "category",
  "notes": "notes",
  "language": "language",

  // TCGPlayer / Scrydex Portfolio Export format
  "product name": "name",
  "set": "set_name",
  "card condition": "condition",
  "average cost paid": "purchase_price",
  "variance": "_ignore",
  "rarity": "rarity",
  "watchlist": "_ignore",
  "date added": "_ignore",
  "price override": "_ignore",
  "portfolio name": "portfolio_name",

  // Handle market price with date suffix
  // This is handled specially in normalizeRow

  // Alternative column names from other platforms
  "product": "name",
  "card name": "name",
  "card": "name",
  "title": "name",
  "item name": "name",
  "set name": "set_name",
  "expansion": "set_name",
  "series": "set_name",
  "number": "card_number",
  "card #": "card_number",
  "card no": "card_number",
  "card no.": "card_number",
  "qty": "quantity",
  "count": "quantity",
  "amount": "quantity",
  "cost": "purchase_price",
  "price": "purchase_price",
  "paid": "purchase_price",
  "cost paid": "purchase_price",
  "buy price": "purchase_price",
  "purchase cost": "purchase_price",
  "value": "market_price",
  "current price": "market_price",
  "current value": "market_price",
  "tcgplayer price": "market_price",
  "grader": "grading_company",
  "grading": "grading_company",
  "grading service": "grading_company",
  "cert": "grade",
  "cert #": "grade",
  "certification": "grade",
  "type": "category",
  "card type": "category",
  "comment": "notes",
  "comments": "notes",
  "note": "notes",
  "description": "notes",
  "lang": "language",
};

// Condition value mappings
const CONDITION_MAPPINGS: Record<string, string> = {
  "mint": "mint",
  "m": "mint",
  "near mint": "near-mint",
  "near-mint": "near-mint",
  "nm": "near-mint",
  "nm-m": "near-mint",
  "nm/m": "near-mint",
  "lightly played": "lightly-played",
  "lightly-played": "lightly-played",
  "lp": "lightly-played",
  "excellent": "lightly-played",
  "ex": "lightly-played",
  "moderately played": "moderately-played",
  "moderately-played": "moderately-played",
  "mp": "moderately-played",
  "good": "moderately-played",
  "gd": "moderately-played",
  "heavily played": "heavily-played",
  "heavily-played": "heavily-played",
  "hp": "heavily-played",
  "played": "heavily-played",
  "poor": "heavily-played",
  "damaged": "damaged",
  "dmg": "damaged",
  "d": "damaged",
};

// Grading company mappings
const GRADING_MAPPINGS: Record<string, string> = {
  "raw": "raw",
  "ungraded": "raw",
  "none": "raw",
  "n/a": "raw",
  "": "raw",
  "psa": "psa",
  "bgs": "bgs",
  "beckett": "bgs",
  "cgc": "cgc",
  "sgc": "sgc",
  "ace": "ace",
  "tag": "tag",
};

// Category mappings - database only allows: raw, graded, sealed
const CATEGORY_MAPPINGS: Record<string, string> = {
  "raw": "raw",
  "graded": "graded",
  "sealed": "sealed",
  // Map everything else to raw or sealed based on context
  "pokemon": "raw",
  "pokémon": "raw",
  "one piece": "raw",
  "onepiece": "raw",
  "magic": "raw",
  "mtg": "raw",
  "magic the gathering": "raw",
  "yugioh": "raw",
  "yu-gi-oh": "raw",
  "sports": "raw",
  "baseball": "raw",
  "basketball": "raw",
  "football": "raw",
  "hockey": "raw",
  "soccer": "raw",
  "cards": "raw",
};

// =============================================
// HELPER FUNCTIONS
// =============================================

// Parse price string, handling commas and currency symbols
function parsePrice(value: any): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  // Convert to string and clean up
  const str = String(value)
    .replace(/[$€£¥]/g, "")  // Remove currency symbols
    .replace(/,/g, "")        // Remove commas
    .replace(/\s/g, "")       // Remove whitespace
    .trim();

  if (str === "" || str === "0") {
    return 0;
  }

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

// Parse quantity
function parseQuantity(value: any): number {
  if (value === undefined || value === null || value === "") {
    return 1;
  }
  const num = parseInt(String(value).replace(/,/g, ""), 10);
  return isNaN(num) || num < 1 ? 1 : num;
}

// Normalize column name for matching
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[_-]/g, " ");
}

// Detect if a column is a market price column (handles date suffix)
function isMarketPriceColumn(columnName: string): boolean {
  const lower = normalizeColumnName(columnName);
  return lower.startsWith("market price") ||
         lower === "market_price" ||
         lower === "value" ||
         lower === "current price" ||
         lower === "current value";
}

// Map a row from external format to CardLedger format
function normalizeRow(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  const originalKeys = Object.keys(row);

  for (const key of originalKeys) {
    const normalizedKey = normalizeColumnName(key);
    let mappedKey = COLUMN_MAPPINGS[normalizedKey];

    // Special handling for market price with date suffix
    if (!mappedKey && isMarketPriceColumn(key)) {
      mappedKey = "market_price";
    }

    if (mappedKey && mappedKey !== "_ignore") {
      normalized[mappedKey] = row[key];
    }
  }

  return normalized;
}

// =============================================
// EXPORT FUNCTIONS
// =============================================

// Export inventory to CSV string
export const exportToCSV = (items: InventoryItem[]): string => {
  const data = items.map((item) => ({
    name: item.name,
    set_name: item.set_name,
    card_number: item.card_number || "",
    grading_company: item.grading_company,
    grade: item.grade || "",
    quantity: item.quantity,
    purchase_price: item.purchase_price,
    market_price: item.market_price || "",
    category: item.category || "cards",
    notes: item.notes || "",
  }));

  return Papa.unparse(data, {
    header: true,
    columns: CSV_HEADERS,
  });
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Generate template CSV
export const generateTemplateCSV = (): string => {
  return Papa.unparse([CSV_TEMPLATE_ROW], {
    header: true,
    columns: CSV_HEADERS,
  });
};

// =============================================
// VALIDATION
// =============================================

// Validation result for a row
export interface ValidationResult {
  row: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: Partial<InventoryInsert>;
}

// Validate a single row (handles both native and external formats)
const validateRow = (rawRow: any, rowIndex: number): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Normalize the row to CardLedger format
  const row = normalizeRow(rawRow);

  // Required fields
  if (!row.name || String(row.name).trim() === "") {
    errors.push("Name is required");
  }
  if (!row.set_name || String(row.set_name).trim() === "") {
    errors.push("Set name is required");
  }

  // Parse purchase price (allow 0 for items with no cost)
  let purchasePrice = parsePrice(row.purchase_price);
  if (purchasePrice === null) {
    purchasePrice = 0;
    warnings.push("Purchase price not found, defaulting to $0");
  }

  // Parse quantity
  const quantity = parseQuantity(row.quantity);

  // Parse market price
  let marketPrice = parsePrice(row.market_price);

  // Map grading company
  const rawGrade = String(row.grade || row.grading_company || "").toLowerCase().trim();
  let gradingCompany = GRADING_MAPPINGS[rawGrade] || "raw";
  let grade: string | null = null;

  // If grade is a number, it's the actual grade and grading company needs to be determined
  if (/^\d+(\.\d+)?$/.test(rawGrade)) {
    grade = rawGrade;
    gradingCompany = String(row.grading_company || "psa").toLowerCase();
    gradingCompany = GRADING_MAPPINGS[gradingCompany] || "psa";
  } else if (gradingCompany !== "raw" && row.grade) {
    // If grading company is set and there's a separate grade field
    grade = String(row.grade).trim();
  }

  // Map condition
  const rawCondition = String(row.condition || "near mint").toLowerCase().trim();
  const condition = CONDITION_MAPPINGS[rawCondition] || "near-mint";

  // Map category - database only allows: raw, graded, sealed
  // Only use explicit category from CSV, otherwise base on grading company
  const rawCategory = String(row.category || "").toLowerCase().trim();
  let category: string;

  if (rawCategory === "sealed") {
    category = "sealed";
  } else if (rawCategory === "graded" || gradingCompany !== "raw") {
    category = "graded";
  } else {
    category = "raw";
  }

  // Handle notes - include portfolio name if different from "Main"
  let notes = row.notes ? String(row.notes).trim() : null;
  if (row.portfolio_name && String(row.portfolio_name).toLowerCase() !== "main") {
    const portfolioNote = `Portfolio: ${row.portfolio_name}`;
    notes = notes ? `${portfolioNote}. ${notes}` : portfolioNote;
  }

  if (errors.length > 0) {
    return { row: rowIndex, valid: false, errors, warnings };
  }

  // Build validated data
  // Note: 'condition' and 'language' fields removed as they may not exist in database
  const data: Partial<InventoryInsert> = {
    name: String(row.name).trim(),
    set_name: String(row.set_name).trim(),
    card_number: row.card_number ? String(row.card_number).trim() : null,
    grading_company: gradingCompany as any,
    grade,
    quantity,
    purchase_price: purchasePrice,
    market_price: marketPrice,
    category,
    notes,
  };

  return { row: rowIndex, valid: true, errors: [], warnings, data };
};

// Parse and validate CSV content using intelligent column detection
export const parseAndValidateCSV = (
  csvContent: string
): Promise<{
  valid: ValidationResult[];
  invalid: ValidationResult[];
  totalRows: number;
  detectedFormat: string;
  detectedDelimiter: string;
  columnMappings?: ColumnMapping[];
}> => {
  return new Promise((resolve, reject) => {
    // Auto-detect delimiter
    const delimiter = detectDelimiter(csvContent);
    // debug log removed

    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: delimiter,
      complete: (results) => {
        const valid: ValidationResult[] = [];
        const invalid: ValidationResult[] = [];

        const columns = results.meta.fields || [];
        const rows = results.data as Record<string, any>[];

        // Use intelligent CSV analysis
        const analysis = analyzeCSV(columns, rows);
        // debug log removed
        // debug log removed
        // debug log removed
        // debug log removed
        analysis.columns.forEach(col => {
          const confidence = (col.confidence * 100).toFixed(0);
        });
        if (analysis.warnings.length > 0) {
          // debug log removed
        }

        // Check if we have required fields
        const hasName = analysis.columns.some(c => c.detectedType === 'card_name' && c.confidence > 0.5);
        const hasSet = analysis.columns.some(c => c.detectedType === 'set_name' && c.confidence > 0.5);

        if (!hasName) {
          reject(new Error("Could not detect card name column. Please ensure your CSV has a column for card names."));
          return;
        }

        // Process each row using intelligent transformation
        rows.forEach((row: any, index: number) => {
          try {
            const transformed = transformRow(row, analysis.columns);

            // Validate required fields
            const errors: string[] = [];
            const warnings: string[] = [];

            if (!transformed.name || transformed.name.trim() === "") {
              errors.push("Name is required");
            }

            if (!transformed.set_name) {
              warnings.push("Set name not found - matching may be less accurate");
            }

            if (transformed.purchase_price === 0) {
              warnings.push("Purchase price not found, defaulting to $0");
            }

            if (errors.length > 0) {
              invalid.push({
                row: index + 1,
                valid: false,
                errors,
                warnings,
              });
              return;
            }

            // Build the data object
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

            valid.push({
              row: index + 1,
              valid: true,
              errors: [],
              warnings,
              data,
            });

          } catch (error) {
            invalid.push({
              row: index + 1,
              valid: false,
              errors: [`Processing error: ${error}`],
              warnings: [],
            });
          }
        });

        resolve({
          valid,
          invalid,
          totalRows: results.data.length,
          detectedFormat: analysis.detectedFormat,
          detectedDelimiter: delimiter,
          columnMappings: analysis.columns,
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
};

// =============================================
// JSON EXPORT/IMPORT
// =============================================

// Export inventory to JSON (for backup)
export const exportToJSON = (items: InventoryItem[]): string => {
  return JSON.stringify(items, null, 2);
};

// Download JSON file
export const downloadJSON = (jsonContent: string, filename: string) => {
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
