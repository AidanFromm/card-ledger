/**
 * CSV Intelligence Module v2
 *
 * Robust column detection with explicit header mappings.
 * Priority: Exact header match > Pattern match > Data analysis
 */

// =============================================
// COLUMN TYPE DEFINITIONS
// =============================================

export type ColumnType =
  | 'card_name'
  | 'set_name'
  | 'card_number'
  | 'quantity'
  | 'purchase_price'
  | 'market_price'
  | 'rarity'
  | 'condition'
  | 'grading_company'
  | 'grade'
  | 'category'
  | 'tcg_type'
  | 'language'
  | 'notes'
  | 'unknown';

export interface ColumnMapping {
  originalHeader: string;
  columnIndex: number;
  detectedType: ColumnType;
  confidence: number;
  detectionMethod: 'exact' | 'pattern' | 'data' | 'none';
}

export interface CSVAnalysisResult {
  columns: ColumnMapping[];
  detectedFormat: string;
  warnings: string[];
  sampleData: Record<string, any>[];
}

// =============================================
// EXACT HEADER MAPPINGS (Highest Priority)
// =============================================

// Lowercase header → column type
const EXACT_HEADER_MAP: Record<string, ColumnType> = {
  // Card Name variations
  'name': 'card_name',
  'card name': 'card_name',
  'cardname': 'card_name',
  'product name': 'card_name',
  'productname': 'card_name',
  'product': 'card_name',
  'card': 'card_name',
  'title': 'card_name',
  'item': 'card_name',
  'item name': 'card_name',

  // Set Name variations
  'set': 'set_name',
  'set name': 'set_name',
  'setname': 'set_name',
  'set_name': 'set_name',
  'expansion': 'set_name',
  'series': 'set_name',
  'collection': 'set_name',

  // Card Number variations
  'card number': 'card_number',
  'cardnumber': 'card_number',
  'card_number': 'card_number',
  'number': 'card_number',
  '#': 'card_number',
  'num': 'card_number',
  'no': 'card_number',
  'no.': 'card_number',
  'collector number': 'card_number',
  'card no': 'card_number',
  'card no.': 'card_number',
  'card #': 'card_number',

  // Quantity variations
  'quantity': 'quantity',
  'qty': 'quantity',
  'count': 'quantity',
  'amount': 'quantity',
  'copies': 'quantity',

  // Purchase Price variations
  'purchase price': 'purchase_price',
  'purchase_price': 'purchase_price',
  'cost': 'purchase_price',
  'price paid': 'purchase_price',
  'paid': 'purchase_price',
  'buy price': 'purchase_price',
  'cost basis': 'purchase_price',
  'avg cost': 'purchase_price',
  'average cost': 'purchase_price',
  'average cost paid': 'purchase_price',

  // Market Price variations
  'market price': 'market_price',
  'market_price': 'market_price',
  'value': 'market_price',
  'current price': 'market_price',
  'current value': 'market_price',
  'tcgplayer price': 'market_price',
  'price': 'market_price',

  // Rarity variations
  'rarity': 'rarity',
  'rare': 'rarity',
  'card rarity': 'rarity',

  // Condition variations
  'condition': 'condition',
  'card condition': 'condition',
  'state': 'condition',

  // Grading variations
  'grading company': 'grading_company',
  'grading_company': 'grading_company',
  'grader': 'grading_company',
  'grading service': 'grading_company',
  'grading': 'grading_company',

  // Grade variations
  'grade': 'grade',
  'score': 'grade',
  'cert': 'grade',
  'certification': 'grade',

  // Category variations
  'category': 'category',
  'type': 'category',
  'card type': 'category',
  'portfolio name': 'category',
  'portfolio': 'category',

  // TCG Type variations
  'tcg': 'tcg_type',
  'game': 'tcg_type',
  'tcg type': 'tcg_type',
  'card game': 'tcg_type',

  // Language variations
  'language': 'language',
  'lang': 'language',

  // Notes variations
  'notes': 'notes',
  'note': 'notes',
  'comments': 'notes',
  'comment': 'notes',
  'description': 'notes',
  'memo': 'notes',
};

// Headers that start with these should be mapped to market_price
const MARKET_PRICE_PREFIXES = ['market price'];

// =============================================
// DATA PATTERN MATCHERS
// =============================================

function isCardNumber(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const str = value.trim();
  // 146/132, #146, 146, SV146, TG15/TG30, SM193
  return /^\d+\/\d+$/.test(str) ||           // 146/132
         /^#\d+$/.test(str) ||               // #146
         /^[A-Z]{1,4}\d+$/i.test(str) ||     // SV146, SM193
         /^[A-Z]+\d+\/[A-Z]*\d+$/i.test(str) || // TG15/TG30
         /^\d{1,4}$/.test(str);              // Plain number 1-9999
}

function isPrice(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const str = value.trim().replace(/[$,]/g, '');
  const num = parseFloat(str);
  return !isNaN(num) && num >= 0 && num < 1000000;
}

function isQuantity(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const num = parseInt(value.trim(), 10);
  return !isNaN(num) && num >= 1 && num <= 10000 && String(num) === value.trim();
}

function isRarity(value: string): boolean {
  if (!value) return false;
  const rarities = [
    'common', 'uncommon', 'rare', 'holo', 'reverse', 'ultra',
    'secret', 'full art', 'illustration', 'special', 'promo',
    'amazing', 'rainbow', 'gold', 'hyper', 'alt art', 'shiny',
    'holofoil', 'normal'
  ];
  const lower = value.toLowerCase().trim();
  return rarities.some(r => lower.includes(r));
}

function isCondition(value: string): boolean {
  if (!value) return false;
  const conditions = [
    'mint', 'near mint', 'nm', 'lightly played', 'lp',
    'moderately played', 'mp', 'heavily played', 'hp',
    'damaged', 'excellent', 'good', 'poor', 'nm-m', 'nm/m'
  ];
  const lower = value.toLowerCase().trim();
  return conditions.some(c => lower === c || c.includes(lower) || lower.includes(c));
}

function isGradingCompany(value: string): boolean {
  if (!value) return false;
  const graders = ['psa', 'bgs', 'cgc', 'sgc', 'ace', 'tag', 'beckett', 'raw', 'ungraded'];
  const lower = value.toLowerCase().trim();
  return graders.some(g => lower === g || lower.includes(g));
}

function isGrade(value: string): boolean {
  if (!value) return false;
  const str = value.trim();
  // 10, 9.5, PSA 10, 10.0
  return /^\d{1,2}(\.\d)?$/.test(str) ||
         /^(psa|bgs|cgc|sgc)\s*\d/i.test(str);
}

// =============================================
// MAIN ANALYSIS FUNCTION
// =============================================

export function analyzeCSV(headers: string[], rows: Record<string, any>[]): CSVAnalysisResult {
  const columns: ColumnMapping[] = [];
  const warnings: string[] = [];
  const usedTypes = new Set<ColumnType>();

  console.log('\n=== CSV INTELLIGENCE v2 ===');
  console.log(`Headers: ${headers.join(', ')}`);

  headers.forEach((header, index) => {
    const trimmedHeader = header.trim();
    const lowerHeader = trimmedHeader.toLowerCase();

    let detectedType: ColumnType = 'unknown';
    let confidence = 0;
    let method: 'exact' | 'pattern' | 'data' | 'none' = 'none';

    // Step 1: Check exact header mapping (HIGHEST PRIORITY)
    if (EXACT_HEADER_MAP[lowerHeader]) {
      detectedType = EXACT_HEADER_MAP[lowerHeader];
      confidence = 1.0;
      method = 'exact';
      console.log(`  [${index}] "${trimmedHeader}" → ${detectedType} (exact match)`);
    }
    // Step 2: Check market price prefix (handles "Market Price (As of 2026-02-03)")
    else if (MARKET_PRICE_PREFIXES.some(prefix => lowerHeader.startsWith(prefix))) {
      detectedType = 'market_price';
      confidence = 0.95;
      method = 'pattern';
      console.log(`  [${index}] "${trimmedHeader}" → market_price (prefix match)`);
    }
    // Step 3: Analyze data patterns for unknown columns
    else {
      // Sample non-empty values from rows
      const sampleValues = rows
        .slice(0, 20)
        .map(row => row[header])
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
        .map(v => String(v).trim());

      if (sampleValues.length > 0) {
        // Count how many values match each pattern
        const matches = {
          card_number: sampleValues.filter(isCardNumber).length,
          price: sampleValues.filter(isPrice).length,
          quantity: sampleValues.filter(isQuantity).length,
          rarity: sampleValues.filter(isRarity).length,
          condition: sampleValues.filter(isCondition).length,
          grading_company: sampleValues.filter(isGradingCompany).length,
          grade: sampleValues.filter(isGrade).length,
        };

        const total = sampleValues.length;

        // Find best matching type based on data
        if (matches.card_number / total > 0.7 && !usedTypes.has('card_number')) {
          detectedType = 'card_number';
          confidence = 0.7;
          method = 'data';
        } else if (matches.rarity / total > 0.7 && !usedTypes.has('rarity')) {
          detectedType = 'rarity';
          confidence = 0.7;
          method = 'data';
        } else if (matches.condition / total > 0.7 && !usedTypes.has('condition')) {
          detectedType = 'condition';
          confidence = 0.7;
          method = 'data';
        } else if (matches.grading_company / total > 0.7 && !usedTypes.has('grading_company')) {
          detectedType = 'grading_company';
          confidence = 0.7;
          method = 'data';
        } else if (matches.grade / total > 0.7 && !usedTypes.has('grade')) {
          detectedType = 'grade';
          confidence = 0.7;
          method = 'data';
        }

        if (detectedType !== 'unknown') {
          console.log(`  [${index}] "${trimmedHeader}" → ${detectedType} (data pattern)`);
        }
      }
    }

    // Handle duplicates - if type already used, only override if confidence is higher
    if (detectedType !== 'unknown' && usedTypes.has(detectedType)) {
      const existing = columns.find(c => c.detectedType === detectedType);
      if (existing && existing.confidence >= confidence) {
        console.log(`  [${index}] "${trimmedHeader}" → unknown (${detectedType} already used with higher confidence)`);
        detectedType = 'unknown';
        confidence = 0;
        method = 'none';
      } else if (existing) {
        // This one is better, demote the existing
        warnings.push(`Column "${existing.originalHeader}" demoted - "${trimmedHeader}" is better match for ${detectedType}`);
        existing.detectedType = 'unknown';
        existing.confidence = 0;
        usedTypes.delete(detectedType);
      }
    }

    if (detectedType !== 'unknown') {
      usedTypes.add(detectedType);
    }

    columns.push({
      originalHeader: trimmedHeader,
      columnIndex: index,
      detectedType,
      confidence,
      detectionMethod: method,
    });
  });

  // Detect format based on columns
  let detectedFormat = 'Unknown';
  const hasPortfolioName = columns.some(c => c.originalHeader.toLowerCase() === 'portfolio name');
  const hasAvgCostPaid = columns.some(c => c.originalHeader.toLowerCase() === 'average cost paid');
  const hasProductName = columns.some(c => c.originalHeader.toLowerCase() === 'product name');

  if (hasPortfolioName && hasProductName && hasAvgCostPaid) {
    detectedFormat = 'TCGPlayer/Collectr Portfolio Export';
  } else if (hasProductName) {
    detectedFormat = 'Portfolio Export';
  } else if (columns.some(c => c.detectedType === 'card_name')) {
    detectedFormat = 'Generic Card List';
  }

  // Validate required columns
  if (!usedTypes.has('card_name')) {
    warnings.push('Could not detect card name column');
  }

  console.log(`\nDetected format: ${detectedFormat}`);
  console.log(`Warnings: ${warnings.length > 0 ? warnings.join(', ') : 'none'}`);
  console.log('=== END CSV INTELLIGENCE ===\n');

  return {
    columns,
    detectedFormat,
    warnings,
    sampleData: rows.slice(0, 5),
  };
}

// =============================================
// CARD NUMBER NORMALIZATION
// =============================================

/**
 * Normalize a card number to extract the primary number
 * "146/132" → "146"
 * "#146" → "146"
 * "SV146" → "SV146"
 * "TG15/TG30" → "TG15"
 */
export function normalizeCardNumber(cardNumber: string | null): string | null {
  if (!cardNumber) return null;
  const str = String(cardNumber).trim();
  if (str === '' || str === '0' || str === '0.0000') return null;

  // Handle "146/132" → take first part
  if (/^\d+\/\d+$/.test(str)) {
    return str.split('/')[0];
  }

  // Handle "TG15/TG30" → take first part
  if (/^[A-Z]+\d+\/[A-Z]*\d+$/i.test(str)) {
    return str.split('/')[0].toUpperCase();
  }

  // Handle "#146" → remove #
  if (/^#\d+$/.test(str)) {
    return str.substring(1);
  }

  // Handle "SV146" → keep as is
  if (/^[A-Z]{1,4}\d+$/i.test(str)) {
    return str.toUpperCase();
  }

  // Handle plain number
  if (/^\d+$/.test(str)) {
    return str;
  }

  return str;
}

// =============================================
// ROW TRANSFORMATION
// =============================================

export interface NormalizedCard {
  name: string;
  set_name: string | null;
  card_number: string | null;
  card_number_normalized: string | null;
  quantity: number;
  purchase_price: number;
  market_price: number | null;
  rarity: string | null;
  condition: string | null;
  grading_company: string;
  grade: string | null;
  category: string;
  language: string | null;
  notes: string | null;
  original_row: Record<string, any>;
}

export function transformRow(row: Record<string, any>, columns: ColumnMapping[]): NormalizedCard {
  const getValue = (type: ColumnType): any => {
    const col = columns.find(c => c.detectedType === type);
    if (!col) return null;
    const value = row[col.originalHeader];
    return value;
  };

  // Get raw values
  const rawName = getValue('card_name');
  const rawSet = getValue('set_name');
  const rawNumber = getValue('card_number');
  const rawQuantity = getValue('quantity');
  const rawPurchasePrice = getValue('purchase_price');
  const rawMarketPrice = getValue('market_price');
  const rawRarity = getValue('rarity');
  const rawCondition = getValue('condition');
  const rawGradingCompany = getValue('grading_company');
  const rawGrade = getValue('grade');
  const rawCategory = getValue('category');
  const rawLanguage = getValue('language');
  const rawNotes = getValue('notes');

  // Parse name
  const name = rawName ? String(rawName).trim() : '';

  // Parse set
  const set_name = rawSet ? String(rawSet).trim() : null;

  // Parse card number - handle "0.0000" as no number
  let card_number: string | null = null;
  if (rawNumber) {
    const numStr = String(rawNumber).trim();
    // Filter out values that look like prices (0.0000, etc.)
    if (numStr && numStr !== '0' && numStr !== '0.0000' && !/^0\.0+$/.test(numStr)) {
      card_number = numStr;
    }
  }
  const card_number_normalized = normalizeCardNumber(card_number);

  // Parse quantity (default 1)
  let quantity = 1;
  if (rawQuantity) {
    const parsed = parseInt(String(rawQuantity).replace(/,/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) quantity = parsed;
  }

  // Parse prices
  const parsePrice = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const str = String(val).replace(/[$,]/g, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };

  const purchase_price = parsePrice(rawPurchasePrice) ?? 0;
  const market_price = parsePrice(rawMarketPrice);

  // Normalize grading company - handle "PSA 10.0" in grade column
  let grading_company = 'raw';
  let grade: string | null = null;

  if (rawGradingCompany) {
    const gc = String(rawGradingCompany).toLowerCase().trim();
    const graderMap: Record<string, string> = {
      'psa': 'psa', 'bgs': 'bgs', 'beckett': 'bgs', 'cgc': 'cgc',
      'sgc': 'sgc', 'ace': 'ace', 'tag': 'tag', 'raw': 'raw',
      'ungraded': 'raw', 'none': 'raw', '': 'raw'
    };
    grading_company = graderMap[gc] || 'raw';
  }

  // Parse grade - handle "PSA 10.0" format
  if (rawGrade) {
    const gradeStr = String(rawGrade).trim();
    // Check if grade contains grading company (e.g., "PSA 10.0")
    const gradeMatch = gradeStr.match(/^(psa|bgs|cgc|sgc)\s*(\d+(?:\.\d+)?)/i);
    if (gradeMatch) {
      grading_company = gradeMatch[1].toLowerCase();
      grade = gradeMatch[2];
    } else {
      // Plain grade like "10" or "9.5"
      const plainGrade = gradeStr.match(/^(\d+(?:\.\d+)?)$/);
      if (plainGrade) {
        grade = plainGrade[1];
      } else {
        grade = gradeStr;
      }
    }
  }

  // Determine category
  let category = 'raw';
  if (rawCategory) {
    const cat = String(rawCategory).toLowerCase().trim();
    if (cat.includes('sealed')) {
      category = 'sealed';
    } else if (cat.includes('slab') || cat.includes('graded') || grading_company !== 'raw') {
      category = 'graded';
    }
  } else if (grading_company !== 'raw') {
    category = 'graded';
  }

  return {
    name,
    set_name,
    card_number,
    card_number_normalized,
    quantity,
    purchase_price,
    market_price,
    rarity: rawRarity ? String(rawRarity).trim() : null,
    condition: rawCondition ? String(rawCondition).trim() : null,
    grading_company,
    grade,
    category,
    language: rawLanguage ? String(rawLanguage).trim() : null,
    notes: rawNotes ? String(rawNotes).trim() : null,
    original_row: row,
  };
}
