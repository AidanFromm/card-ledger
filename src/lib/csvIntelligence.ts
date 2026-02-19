/**
 * CSV Intelligence Module v3
 *
 * Bulletproof column detection for ANY CSV format.
 * Supports: TCGPlayer, Collectr, eBay, PSA, BGS, COMC, CardMarket, and generic formats.
 * Auto-detects delimiters (comma, semicolon, tab, pipe).
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
  | 'image_url'
  | 'cert_number'
  | 'year'
  | 'brand'
  | 'player'
  | 'sport'
  | 'unknown';

export interface ColumnMapping {
  originalHeader: string;
  columnIndex: number;
  detectedType: ColumnType;
  confidence: number;
  detectionMethod: 'exact' | 'pattern' | 'data' | 'manual' | 'none';
}

export interface CSVAnalysisResult {
  columns: ColumnMapping[];
  detectedFormat: string;
  warnings: string[];
  sampleData: Record<string, any>[];
  delimiter: string;
}

export interface ImportHistoryEntry {
  id: string;
  timestamp: string;
  source: string;
  format: string;
  cardCount: number;
  itemIds: string[];
}

// =============================================
// DELIMITER DETECTION
// =============================================

/**
 * Auto-detect CSV delimiter from raw text.
 * Checks comma, semicolon, tab, and pipe.
 */
export function detectDelimiter(rawText: string): string {
  const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 5);
  if (lines.length === 0) return ',';

  const delimiters = [',', ';', '\t', '|'];
  const scores: Record<string, number> = {};

  for (const delim of delimiters) {
    // Count occurrences per line
    const counts = lines.map(line => {
      // Don't count delimiters inside quotes
      let count = 0;
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === delim && !inQuotes) count++;
      }
      return count;
    });

    // A good delimiter should appear consistently across lines
    const nonZero = counts.filter(c => c > 0);
    if (nonZero.length === 0) {
      scores[delim] = 0;
      continue;
    }

    // Check consistency (all lines should have similar count)
    const first = counts[0];
    const consistent = counts.every(c => c === first || Math.abs(c - first) <= 1);
    scores[delim] = consistent && first > 0 ? first * nonZero.length : nonZero.length * 0.5;
  }

  // Return the delimiter with highest score, default to comma
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ',';
}

// =============================================
// EXACT HEADER MAPPINGS (Highest Priority)
// =============================================

// Lowercase header → column type
const EXACT_HEADER_MAP: Record<string, ColumnType> = {
  // ===== Card Name variations =====
  'name': 'card_name',
  'card name': 'card_name',
  'cardname': 'card_name',
  'product name': 'card_name',
  'productname': 'card_name',
  'product': 'card_name',
  'card': 'card_name',
  'title': 'card_name',
  'card title': 'card_name',
  'item': 'card_name',
  'item name': 'card_name',
  'item description': 'card_name',
  'description': 'card_name',
  'subject': 'card_name',
  'card description': 'card_name',
  'player/card': 'card_name',
  'player / card': 'card_name',
  'card info': 'card_name',
  'lot title': 'card_name',       // eBay
  'listing title': 'card_name',   // eBay
  'article name': 'card_name',    // CardMarket
  'artikelname': 'card_name',     // CardMarket DE
  'nom de l\'article': 'card_name', // CardMarket FR
  'product line': 'card_name',
  'line item': 'card_name',
  'cert description': 'card_name', // PSA
  'label description': 'card_name', // BGS

  // ===== Set Name variations =====
  'set': 'set_name',
  'set name': 'set_name',
  'setname': 'set_name',
  'set_name': 'set_name',
  'expansion': 'set_name',
  'expansion name': 'set_name',
  'series': 'set_name',
  'collection': 'set_name',
  'set code': 'set_name',
  'edition': 'set_name',
  'release': 'set_name',
  'subset': 'set_name',
  'product line': 'set_name',
  'brand/set': 'set_name',

  // ===== Card Number variations =====
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
  'card num': 'card_number',
  'catalog number': 'card_number',
  'catalog #': 'card_number',

  // ===== Quantity variations =====
  'quantity': 'quantity',
  'qty': 'quantity',
  'count': 'quantity',
  'amount': 'quantity',
  'copies': 'quantity',
  'total qty': 'quantity',
  'total quantity': 'quantity',
  'anzahl': 'quantity',          // CardMarket DE
  'quantité': 'quantity',        // CardMarket FR
  'units': 'quantity',

  // ===== Purchase Price variations =====
  'purchase price': 'purchase_price',
  'purchase_price': 'purchase_price',
  'cost': 'purchase_price',
  'price paid': 'purchase_price',
  'paid': 'purchase_price',
  'buy price': 'purchase_price',
  'buying price': 'purchase_price',
  'cost basis': 'purchase_price',
  'avg cost': 'purchase_price',
  'average cost': 'purchase_price',
  'average cost paid': 'purchase_price',
  'unit cost': 'purchase_price',
  'total cost': 'purchase_price',
  'acquisition cost': 'purchase_price',
  'invoice price': 'purchase_price',
  'declared value': 'purchase_price',  // PSA/BGS submission
  'insured value': 'purchase_price',
  'einkaufspreis': 'purchase_price',   // CardMarket DE
  'prix d\'achat': 'purchase_price',   // CardMarket FR
  'purchase amount': 'purchase_price',
  'cost per unit': 'purchase_price',
  'price per item': 'purchase_price',
  'bought for': 'purchase_price',
  'bought at': 'purchase_price',

  // ===== Market Price variations =====
  'market price': 'market_price',
  'market_price': 'market_price',
  'value': 'market_price',
  'current price': 'market_price',
  'current value': 'market_price',
  'tcgplayer price': 'market_price',
  'tcg price': 'market_price',
  'tcg player price': 'market_price',
  'tcgplayer market price': 'market_price',
  'price': 'market_price',
  'market value': 'market_price',
  'estimated value': 'market_price',
  'est value': 'market_price',
  'est. value': 'market_price',
  'fair market value': 'market_price',
  'fmv': 'market_price',
  'sale price': 'market_price',
  'sold price': 'market_price',      // eBay
  'sold for': 'market_price',        // eBay
  'final price': 'market_price',     // eBay
  'winning bid': 'market_price',     // eBay
  'total price': 'market_price',
  'retail price': 'market_price',
  'list price': 'market_price',
  'asking price': 'market_price',
  'sell price': 'market_price',
  'avg selling price': 'market_price',
  'average selling price': 'market_price',
  'trend price': 'market_price',     // CardMarket
  'trendpreis': 'market_price',      // CardMarket DE
  'prix tendance': 'market_price',   // CardMarket FR
  'lowest price': 'market_price',
  'best price': 'market_price',
  'comp value': 'market_price',
  'comps': 'market_price',
  'last sold': 'market_price',
  'recent sale': 'market_price',
  'smr value': 'market_price',       // PSA SMR
  'smr price': 'market_price',
  'pop report value': 'market_price',
  'comc price': 'market_price',      // COMC

  // ===== Rarity variations =====
  'rarity': 'rarity',
  'rare': 'rarity',
  'card rarity': 'rarity',
  'print type': 'rarity',
  'finish': 'rarity',
  'foil': 'rarity',
  'variant': 'rarity',
  'parallel': 'rarity',

  // ===== Condition variations =====
  'condition': 'condition',
  'card condition': 'condition',
  'state': 'condition',
  'item condition': 'condition',
  'cond': 'condition',
  'cond.': 'condition',
  'zustand': 'condition',           // CardMarket DE
  'état': 'condition',              // CardMarket FR

  // ===== Grading variations =====
  'grading company': 'grading_company',
  'grading_company': 'grading_company',
  'grader': 'grading_company',
  'grading service': 'grading_company',
  'grading': 'grading_company',
  'authentication': 'grading_company',
  'auth company': 'grading_company',
  'service level': 'grading_company', // PSA submission
  'submission type': 'grading_company',

  // ===== Grade variations =====
  'grade': 'grade',
  'score': 'grade',
  'cert': 'grade',
  'certification': 'grade',
  'grade value': 'grade',
  'overall grade': 'grade',
  'final grade': 'grade',
  'composite grade': 'grade',  // BGS

  // ===== Cert Number (PSA/BGS) =====
  'cert number': 'cert_number',
  'cert #': 'cert_number',
  'cert no': 'cert_number',
  'cert no.': 'cert_number',
  'certification number': 'cert_number',
  'certification #': 'cert_number',
  'psa cert': 'cert_number',
  'psa cert #': 'cert_number',
  'psa #': 'cert_number',
  'bgs cert': 'cert_number',
  'bgs label': 'cert_number',
  'barcode': 'cert_number',

  // ===== Category variations =====
  'category': 'category',
  'type': 'category',
  'card type': 'category',
  'portfolio name': 'category',
  'portfolio': 'category',
  'item type': 'category',

  // ===== TCG Type variations =====
  'tcg': 'tcg_type',
  'game': 'tcg_type',
  'tcg type': 'tcg_type',
  'card game': 'tcg_type',

  // ===== Language variations =====
  'language': 'language',
  'lang': 'language',
  'sprache': 'language',          // CardMarket DE
  'langue': 'language',           // CardMarket FR

  // ===== Notes variations =====
  'notes': 'notes',
  'note': 'notes',
  'comments': 'notes',
  'comment': 'notes',
  'memo': 'notes',
  'remarks': 'notes',
  'additional info': 'notes',

  // ===== Image URL =====
  'image': 'image_url',
  'image url': 'image_url',
  'image_url': 'image_url',
  'photo': 'image_url',
  'photo url': 'image_url',
  'picture': 'image_url',
  'thumbnail': 'image_url',
  'img': 'image_url',

  // ===== Year =====
  'year': 'year',
  'card year': 'year',
  'release year': 'year',
  'vintage': 'year',

  // ===== Brand =====
  'brand': 'brand',
  'manufacturer': 'brand',
  'maker': 'brand',

  // ===== Player (sports) =====
  'player': 'player',
  'player name': 'player',
  'athlete': 'player',

  // ===== Sport =====
  'sport': 'sport',
  'sport type': 'sport',
};

// Headers that start with these should be mapped to market_price
const MARKET_PRICE_PREFIXES = ['market price', 'tcgplayer price', 'trend price', 'current value'];

// Headers that start with these should be mapped to purchase_price
const PURCHASE_PRICE_PREFIXES = ['average cost', 'cost basis', 'buy price', 'purchase price', 'price paid'];

// =============================================
// FORMAT DETECTION PATTERNS
// =============================================

interface FormatSignature {
  name: string;
  requiredHeaders: string[];
  optionalHeaders: string[];
  score: number;
}

const FORMAT_SIGNATURES: FormatSignature[] = [
  {
    name: 'TCGPlayer Collection Export',
    requiredHeaders: ['product name', 'set', 'quantity'],
    optionalHeaders: ['market price', 'rarity', 'card condition', 'portfolio name'],
    score: 0,
  },
  {
    name: 'TCGPlayer/Collectr Portfolio Export',
    requiredHeaders: ['product name', 'average cost paid'],
    optionalHeaders: ['portfolio name', 'set', 'market price'],
    score: 0,
  },
  {
    name: 'eBay Sold Listings Export',
    requiredHeaders: ['item', 'sold for'],
    optionalHeaders: ['sold date', 'buyer', 'listing title', 'final price'],
    score: 0,
  },
  {
    name: 'eBay Selling Manager Export',
    requiredHeaders: ['title', 'sale price'],
    optionalHeaders: ['buyer id', 'ship to', 'quantity sold'],
    score: 0,
  },
  {
    name: 'PSA Submission CSV',
    requiredHeaders: ['cert description', 'grade'],
    optionalHeaders: ['cert number', 'declared value', 'service level', 'year'],
    score: 0,
  },
  {
    name: 'PSA Pop Report Export',
    requiredHeaders: ['name', 'grade', 'pop'],
    optionalHeaders: ['psa #', 'year', 'brand', 'variety'],
    score: 0,
  },
  {
    name: 'BGS Submission CSV',
    requiredHeaders: ['label description', 'overall grade'],
    optionalHeaders: ['cert number', 'centering', 'corners', 'edges', 'surface'],
    score: 0,
  },
  {
    name: 'COMC Inventory Export',
    requiredHeaders: ['item', 'asking price'],
    optionalHeaders: ['condition', 'comc price', 'sport', 'year', 'set'],
    score: 0,
  },
  {
    name: 'CardMarket Export',
    requiredHeaders: ['article name', 'expansion'],
    optionalHeaders: ['trend price', 'condition', 'language', 'quantity', 'rarity'],
    score: 0,
  },
  {
    name: 'CardMarket Export (DE)',
    requiredHeaders: ['artikelname', 'expansion'],
    optionalHeaders: ['trendpreis', 'zustand', 'sprache', 'anzahl'],
    score: 0,
  },
];

function detectFormat(headers: string[]): string {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  let bestFormat = 'Generic Card List';
  let bestScore = 0;

  for (const sig of FORMAT_SIGNATURES) {
    let score = 0;
    const requiredMatches = sig.requiredHeaders.filter(rh =>
      lowerHeaders.some(h => h === rh || h.startsWith(rh))
    ).length;

    // All required headers must match
    if (requiredMatches < sig.requiredHeaders.length) continue;

    score += requiredMatches * 10;

    const optionalMatches = sig.optionalHeaders.filter(oh =>
      lowerHeaders.some(h => h === oh || h.startsWith(oh))
    ).length;
    score += optionalMatches * 3;

    if (score > bestScore) {
      bestScore = score;
      bestFormat = sig.name;
    }
  }

  return bestFormat;
}

// =============================================
// DATA PATTERN MATCHERS
// =============================================

function isCardNumber(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const str = value.trim();
  return /^\d+\/\d+$/.test(str) ||           // 146/132
         /^#\d+$/.test(str) ||               // #146
         /^[A-Z]{1,4}\d+$/i.test(str) ||     // SV146, SM193
         /^[A-Z]+\d+\/[A-Z]*\d+$/i.test(str) || // TG15/TG30
         /^\d{1,4}$/.test(str);              // Plain number 1-9999
}

function isPrice(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const str = value.trim().replace(/[$€£¥,]/g, '');
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
    'holofoil', 'normal', 'mythic', 'legendary', 'super rare',
    'double rare', 'triple rare', 'special art'
  ];
  const lower = value.toLowerCase().trim();
  return rarities.some(r => lower.includes(r));
}

function isCondition(value: string): boolean {
  if (!value) return false;
  const conditions = [
    'mint', 'near mint', 'nm', 'lightly played', 'lp',
    'moderately played', 'mp', 'heavily played', 'hp',
    'damaged', 'excellent', 'good', 'poor', 'nm-m', 'nm/m',
    'ex', 'vg', 'fair', 'played', 'gd', 'ex-mt', 'vg-ex'
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
  return /^\d{1,2}(\.\d)?$/.test(str) ||
         /^(psa|bgs|cgc|sgc)\s*\d/i.test(str);
}

function isUrl(value: string): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value.trim());
}

// =============================================
// MAIN ANALYSIS FUNCTION
// =============================================

export function analyzeCSV(headers: string[], rows: Record<string, any>[]): CSVAnalysisResult {
  const columns: ColumnMapping[] = [];
  const warnings: string[] = [];
  const usedTypes = new Set<ColumnType>();

  console.log('\n=== CSV INTELLIGENCE v3 ===');
  console.log(`Headers: ${headers.join(', ')}`);

  // Detect format
  const detectedFormat = detectFormat(headers);

  headers.forEach((header, index) => {
    const trimmedHeader = header.trim();
    const lowerHeader = trimmedHeader.toLowerCase();

    let detectedType: ColumnType = 'unknown';
    let confidence = 0;
    let method: 'exact' | 'pattern' | 'data' | 'manual' | 'none' = 'none';

    // Step 1: Check exact header mapping (HIGHEST PRIORITY)
    if (EXACT_HEADER_MAP[lowerHeader]) {
      detectedType = EXACT_HEADER_MAP[lowerHeader];
      confidence = 1.0;
      method = 'exact';
      console.log(`  [${index}] "${trimmedHeader}" → ${detectedType} (exact match)`);
    }
    // Step 2: Check prefix patterns (handles "Market Price (As of 2026-02-03)")
    else if (MARKET_PRICE_PREFIXES.some(prefix => lowerHeader.startsWith(prefix))) {
      detectedType = 'market_price';
      confidence = 0.95;
      method = 'pattern';
      console.log(`  [${index}] "${trimmedHeader}" → market_price (prefix match)`);
    }
    else if (PURCHASE_PRICE_PREFIXES.some(prefix => lowerHeader.startsWith(prefix))) {
      detectedType = 'purchase_price';
      confidence = 0.95;
      method = 'pattern';
      console.log(`  [${index}] "${trimmedHeader}" → purchase_price (prefix match)`);
    }
    // Step 3: Fuzzy header matching — catch misspellings and close variants
    else {
      const fuzzyMatch = fuzzyMatchHeader(lowerHeader);
      if (fuzzyMatch) {
        detectedType = fuzzyMatch.type;
        confidence = fuzzyMatch.confidence;
        method = 'pattern';
        console.log(`  [${index}] "${trimmedHeader}" → ${detectedType} (fuzzy header match, ${(confidence * 100).toFixed(0)}%)`);
      }
    }

    // Step 4: Analyze data patterns for unknown columns
    if (detectedType === 'unknown') {
      const sampleValues = rows
        .slice(0, 20)
        .map(row => row[header])
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
        .map(v => String(v).trim());

      if (sampleValues.length > 0) {
        const matches = {
          card_number: sampleValues.filter(isCardNumber).length,
          price: sampleValues.filter(isPrice).length,
          quantity: sampleValues.filter(isQuantity).length,
          rarity: sampleValues.filter(isRarity).length,
          condition: sampleValues.filter(isCondition).length,
          grading_company: sampleValues.filter(isGradingCompany).length,
          grade: sampleValues.filter(isGrade).length,
          image_url: sampleValues.filter(isUrl).length,
        };

        const total = sampleValues.length;

        if (matches.image_url / total > 0.7 && !usedTypes.has('image_url')) {
          detectedType = 'image_url';
          confidence = 0.7;
          method = 'data';
        } else if (matches.card_number / total > 0.7 && !usedTypes.has('card_number')) {
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

  // Validate required columns
  if (!usedTypes.has('card_name')) {
    warnings.push('Could not detect card name column — please map it manually');
  }

  console.log(`\nDetected format: ${detectedFormat}`);
  console.log(`Warnings: ${warnings.length > 0 ? warnings.join(', ') : 'none'}`);
  console.log('=== END CSV INTELLIGENCE ===\n');

  return {
    columns,
    detectedFormat,
    warnings,
    sampleData: rows.slice(0, 10),
    delimiter: ',',
  };
}

// =============================================
// FUZZY HEADER MATCHING
// =============================================

function fuzzyMatchHeader(header: string): { type: ColumnType; confidence: number } | null {
  // Keywords that strongly suggest a column type
  const keywordMap: { keywords: string[]; type: ColumnType; confidence: number }[] = [
    { keywords: ['card', 'name', 'product', 'title', 'item', 'description'], type: 'card_name', confidence: 0.8 },
    { keywords: ['set', 'expansion', 'collection', 'edition', 'series'], type: 'set_name', confidence: 0.8 },
    { keywords: ['number', 'num', 'no', '#'], type: 'card_number', confidence: 0.75 },
    { keywords: ['qty', 'quantity', 'count', 'amount'], type: 'quantity', confidence: 0.85 },
    { keywords: ['cost', 'paid', 'buy', 'purchase', 'basis'], type: 'purchase_price', confidence: 0.8 },
    { keywords: ['market', 'value', 'sell', 'sold', 'price', 'worth', 'trend'], type: 'market_price', confidence: 0.75 },
    { keywords: ['rarity', 'rare', 'foil', 'variant'], type: 'rarity', confidence: 0.85 },
    { keywords: ['condition', 'cond', 'state'], type: 'condition', confidence: 0.85 },
    { keywords: ['grading', 'grader', 'service'], type: 'grading_company', confidence: 0.8 },
    { keywords: ['grade', 'score'], type: 'grade', confidence: 0.8 },
    { keywords: ['cert', 'certification', 'barcode'], type: 'cert_number', confidence: 0.8 },
    { keywords: ['image', 'photo', 'picture', 'thumbnail', 'img'], type: 'image_url', confidence: 0.85 },
    { keywords: ['note', 'comment', 'memo', 'remark'], type: 'notes', confidence: 0.8 },
  ];

  const words = header.split(/[\s_\-\/]+/).filter(w => w.length > 1);

  for (const entry of keywordMap) {
    const matchCount = words.filter(w => entry.keywords.some(kw => w.includes(kw) || kw.includes(w))).length;
    if (matchCount > 0 && matchCount / words.length >= 0.5) {
      return { type: entry.type, confidence: entry.confidence * (matchCount / words.length) };
    }
  }

  return null;
}

// =============================================
// CARD NUMBER NORMALIZATION
// =============================================

export function normalizeCardNumber(cardNumber: string | null): string | null {
  if (!cardNumber) return null;
  const str = String(cardNumber).trim();
  if (str === '' || str === '0' || str === '0.0000' || /^0\.0+$/.test(str)) return null;

  if (/^\d+\/\d+$/.test(str)) return str.split('/')[0];
  if (/^[A-Z]+\d+\/[A-Z]*\d+$/i.test(str)) return str.split('/')[0].toUpperCase();
  if (/^#\d+$/.test(str)) return str.substring(1);
  if (/^[A-Z]{1,4}\d+$/i.test(str)) return str.toUpperCase();
  if (/^\d+$/.test(str)) return str;

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
  image_url: string | null;
  cert_number: string | null;
  original_row: Record<string, any>;
}

export function transformRow(row: Record<string, any>, columns: ColumnMapping[]): NormalizedCard {
  const getValue = (type: ColumnType): any => {
    const col = columns.find(c => c.detectedType === type);
    if (!col) return null;
    return row[col.originalHeader];
  };

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
  const rawImageUrl = getValue('image_url');
  const rawCertNumber = getValue('cert_number');

  const name = rawName ? String(rawName).trim() : '';
  const set_name = rawSet ? String(rawSet).trim() : null;

  let card_number: string | null = null;
  if (rawNumber) {
    const numStr = String(rawNumber).trim();
    if (numStr && numStr !== '0' && numStr !== '0.0000' && !/^0\.0+$/.test(numStr)) {
      card_number = numStr;
    }
  }
  const card_number_normalized = normalizeCardNumber(card_number);

  let quantity = 1;
  if (rawQuantity) {
    const parsed = parseInt(String(rawQuantity).replace(/,/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) quantity = parsed;
  }

  const parsePrice = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const str = String(val).replace(/[$€£¥,]/g, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };

  const purchase_price = parsePrice(rawPurchasePrice) ?? 0;
  const market_price = parsePrice(rawMarketPrice);

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

  if (rawGrade) {
    const gradeStr = String(rawGrade).trim();
    const gradeMatch = gradeStr.match(/^(psa|bgs|cgc|sgc)\s*(\d+(?:\.\d+)?)/i);
    if (gradeMatch) {
      grading_company = gradeMatch[1].toLowerCase();
      grade = gradeMatch[2];
    } else {
      const plainGrade = gradeStr.match(/^(\d+(?:\.\d+)?)$/);
      if (plainGrade) {
        grade = plainGrade[1];
      } else {
        grade = gradeStr;
      }
    }
  }

  // If we have a cert number, it's likely graded
  if (rawCertNumber && grading_company === 'raw') {
    // Try to infer grading company from cert number format
    const certStr = String(rawCertNumber).trim();
    if (/^\d{8,}$/.test(certStr)) {
      grading_company = 'psa'; // PSA certs are typically 8+ digits
    }
  }

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

  const image_url = rawImageUrl ? String(rawImageUrl).trim() : null;
  const cert_number = rawCertNumber ? String(rawCertNumber).trim() : null;

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
    image_url,
    cert_number,
    original_row: row,
  };
}

// =============================================
// IMPORT HISTORY MANAGEMENT
// =============================================

const IMPORT_HISTORY_KEY = 'cardledger_import_history';

export function getImportHistory(): ImportHistoryEntry[] {
  try {
    const raw = localStorage.getItem(IMPORT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveImportHistoryEntry(entry: ImportHistoryEntry): void {
  try {
    const history = getImportHistory();
    history.unshift(entry);
    // Keep last 50 entries
    localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch {
    // silently fail
  }
}

export function removeImportHistoryEntry(id: string): void {
  try {
    const history = getImportHistory().filter(e => e.id !== id);
    localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // silently fail
  }
}

// =============================================
// VALIDATION HELPERS
// =============================================

export interface ImportValidationWarning {
  type: 'duplicate' | 'missing_name' | 'suspicious_price' | 'zero_price' | 'high_price' | 'missing_set';
  row: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export function validateImportRows(
  cards: NormalizedCard[],
  existingNames?: Set<string>
): ImportValidationWarning[] {
  const warnings: ImportValidationWarning[] = [];
  const seenNames = new Set<string>();

  cards.forEach((card, idx) => {
    const row = idx + 1;

    if (!card.name || card.name.trim() === '') {
      warnings.push({ type: 'missing_name', row, message: `Row ${row}: Missing card name (required)`, severity: 'error' });
      return;
    }

    if (!card.set_name) {
      warnings.push({ type: 'missing_set', row, message: `Row ${row}: "${card.name}" — no set name (image matching may be less accurate)`, severity: 'info' });
    }

    // Check duplicate within import
    const key = `${card.name.toLowerCase()}|${card.set_name?.toLowerCase() || ''}|${card.card_number || ''}`;
    if (seenNames.has(key)) {
      warnings.push({ type: 'duplicate', row, message: `Row ${row}: "${card.name}" appears multiple times in this import`, severity: 'info' });
    }
    seenNames.add(key);

    // Check duplicate against existing inventory
    if (existingNames && existingNames.has(key)) {
      warnings.push({ type: 'duplicate', row, message: `Row ${row}: "${card.name}" already exists in your inventory`, severity: 'warning' });
    }

    // Suspicious prices
    if (card.purchase_price === 0 && card.market_price === null) {
      warnings.push({ type: 'zero_price', row, message: `Row ${row}: "${card.name}" — no price data`, severity: 'info' });
    }

    if (card.market_price !== null && card.market_price > 50000) {
      warnings.push({ type: 'high_price', row, message: `Row ${row}: "${card.name}" — market price $${card.market_price.toLocaleString()} seems very high`, severity: 'warning' });
    }

    if (card.purchase_price > 50000) {
      warnings.push({ type: 'high_price', row, message: `Row ${row}: "${card.name}" — purchase price $${card.purchase_price.toLocaleString()} seems very high`, severity: 'warning' });
    }
  });

  return warnings;
}
