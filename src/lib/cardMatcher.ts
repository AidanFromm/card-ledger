/**
 * Card Matching Engine
 *
 * Multi-signal matching system to find the best Pokemon TCG API match
 * for imported cards. Uses weighted scoring across multiple attributes.
 */

import { NormalizedCard, normalizeCardNumber } from './csvIntelligence';

// =============================================
// TYPES
// =============================================

export interface PokemonTCGCard {
  id: string;
  name: string;
  set: {
    id: string;
    name: string;
    series: string;
  };
  number: string;
  rarity?: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    prices?: Record<string, { market?: number; low?: number }>;
  };
}

export interface MatchResult {
  card: PokemonTCGCard;
  score: number;
  matchDetails: {
    nameScore: number;
    setScore: number;
    numberScore: number;
    rarityScore: number;
    bonuses: string[];
  };
}

export interface MatchConfig {
  minScore: number;          // Minimum score to consider a match (default: 30)
  maxResults: number;        // Max matches to return (default: 5)
  strictMode: boolean;       // Require name match (default: false)
}

const DEFAULT_CONFIG: MatchConfig = {
  minScore: 30,
  maxResults: 5,
  strictMode: false,
};

// =============================================
// SCORING WEIGHTS
// =============================================

const WEIGHTS = {
  // Exact matches
  NAME_EXACT: 40,
  SET_EXACT: 30,
  NUMBER_EXACT: 35,
  RARITY_EXACT: 10,

  // Partial/fuzzy matches
  NAME_CONTAINS: 25,
  NAME_FUZZY: 20,
  SET_CONTAINS: 15,
  SET_FUZZY: 10,

  // Bonuses
  ALL_THREE_MATCH: 20,      // Name + Set + Number all match
  NAME_AND_NUMBER: 15,      // Name + Number match (even without set)
  NAME_AND_SET: 10,         // Name + Set match (even without number)
};

// =============================================
// STRING NORMALIZATION
// =============================================

/**
 * Normalize a string for comparison
 * - Lowercase
 * - Remove special characters
 * - Normalize whitespace
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace special chars with space
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
}

/**
 * Normalize a card name for matching
 * Handles Pokemon-specific patterns:
 * - "Charizard ex" vs "Charizard EX"
 * - "Pikachu V" vs "Pikachu-V"
 * - "Mew VSTAR" vs "Mew V Star"
 */
function normalizeCardName(name: string): string {
  let normalized = normalizeString(name);

  // Normalize Pokemon suffixes
  normalized = normalized
    .replace(/\s*-\s*/g, ' ')           // "Pikachu-V" → "Pikachu V"
    .replace(/\bex\b/gi, 'ex')          // Normalize "EX" to "ex"
    .replace(/\bgx\b/gi, 'gx')
    .replace(/\bv\b/gi, 'v')
    .replace(/\bvmax\b/gi, 'vmax')
    .replace(/\bvstar\b/gi, 'vstar')
    .replace(/\bv\s*star\b/gi, 'vstar')
    .replace(/\bv\s*max\b/gi, 'vmax')
    .replace(/\bradiant\b/gi, 'radiant');

  return normalized;
}

/**
 * Normalize a set name for matching
 * Handles variations:
 * - "Scarlet & Violet" vs "Scarlet and Violet"
 * - "S&V" vs "Scarlet & Violet"
 * - "151" vs "Pokemon 151"
 */
function normalizeSetName(name: string): string {
  let normalized = normalizeString(name);

  // Handle common variations
  normalized = normalized
    .replace(/\band\b/g, '&')
    .replace(/\s*&\s*/g, ' ')
    .replace(/pokemon\s*/gi, '')
    .replace(/tcg\s*/gi, '')
    .replace(/^sv\s*/i, 'scarlet violet ')
    .replace(/^swsh\s*/i, 'sword shield ');

  return normalized;
}

// =============================================
// FUZZY MATCHING
// =============================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

/**
 * Check if string A contains all significant words from string B
 */
function containsAllWords(haystack: string, needle: string): boolean {
  const haystackWords = new Set(haystack.split(/\s+/).filter(w => w.length > 1));
  const needleWords = needle.split(/\s+/).filter(w => w.length > 1);

  return needleWords.every(word => haystackWords.has(word));
}

// =============================================
// MATCHING FUNCTIONS
// =============================================

/**
 * Calculate name match score
 */
function calculateNameScore(importedName: string, apiName: string): number {
  const normImported = normalizeCardName(importedName);
  const normApi = normalizeCardName(apiName);

  // Exact match
  if (normImported === normApi) {
    return WEIGHTS.NAME_EXACT;
  }

  // One contains the other
  if (normImported.includes(normApi) || normApi.includes(normImported)) {
    return WEIGHTS.NAME_CONTAINS;
  }

  // Fuzzy match
  const similarity = stringSimilarity(normImported, normApi);
  if (similarity >= 0.8) {
    return WEIGHTS.NAME_FUZZY;
  }

  // Check if all words match
  if (containsAllWords(normApi, normImported) || containsAllWords(normImported, normApi)) {
    return WEIGHTS.NAME_FUZZY * 0.8;
  }

  return 0;
}

/**
 * Calculate set name match score
 */
function calculateSetScore(importedSet: string | null, apiSet: string): number {
  if (!importedSet) return 0;

  const normImported = normalizeSetName(importedSet);
  const normApi = normalizeSetName(apiSet);

  // Exact match
  if (normImported === normApi) {
    return WEIGHTS.SET_EXACT;
  }

  // One contains the other
  if (normImported.includes(normApi) || normApi.includes(normImported)) {
    return WEIGHTS.SET_CONTAINS;
  }

  // Fuzzy match
  const similarity = stringSimilarity(normImported, normApi);
  if (similarity >= 0.7) {
    return WEIGHTS.SET_FUZZY;
  }

  return 0;
}

/**
 * Calculate card number match score
 */
function calculateNumberScore(importedNumber: string | null, apiNumber: string): number {
  if (!importedNumber) return 0;

  const normImported = normalizeCardNumber(importedNumber);
  const normApi = normalizeCardNumber(apiNumber);

  if (!normImported || !normApi) return 0;

  // Exact match
  if (normImported === normApi) {
    return WEIGHTS.NUMBER_EXACT;
  }

  // Numeric comparison (handle leading zeros, etc.)
  const numImported = parseInt(normImported.replace(/\D/g, ''), 10);
  const numApi = parseInt(normApi.replace(/\D/g, ''), 10);

  if (!isNaN(numImported) && !isNaN(numApi) && numImported === numApi) {
    return WEIGHTS.NUMBER_EXACT * 0.9;
  }

  return 0;
}

/**
 * Calculate rarity match score
 */
function calculateRarityScore(importedRarity: string | null, apiRarity: string | undefined): number {
  if (!importedRarity || !apiRarity) return 0;

  const normImported = normalizeString(importedRarity);
  const normApi = normalizeString(apiRarity);

  // Exact match
  if (normImported === normApi) {
    return WEIGHTS.RARITY_EXACT;
  }

  // Partial match (one contains the other)
  if (normImported.includes(normApi) || normApi.includes(normImported)) {
    return WEIGHTS.RARITY_EXACT * 0.7;
  }

  // Map common rarity variations
  const rarityMap: Record<string, string[]> = {
    'illustration rare': ['illustration rare', 'special illustration rare', 'sir', 'ir'],
    'ultra rare': ['ultra rare', 'ur'],
    'secret rare': ['secret rare', 'sr'],
    'full art': ['full art', 'fa'],
    'holo rare': ['holo rare', 'holo', 'holofoil'],
    'rare': ['rare', 'r'],
    'uncommon': ['uncommon', 'u'],
    'common': ['common', 'c'],
  };

  for (const [key, variants] of Object.entries(rarityMap)) {
    const importedMatches = variants.some(v => normImported.includes(v));
    const apiMatches = variants.some(v => normApi.includes(v));
    if (importedMatches && apiMatches) {
      return WEIGHTS.RARITY_EXACT * 0.8;
    }
  }

  return 0;
}

// =============================================
// MAIN MATCHING FUNCTION
// =============================================

/**
 * Find the best matching Pokemon TCG card for an imported card
 */
export function findBestMatch(
  importedCard: NormalizedCard,
  apiCards: PokemonTCGCard[],
  config: Partial<MatchConfig> = {}
): MatchResult | null {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!importedCard.name || apiCards.length === 0) {
    return null;
  }

  const results: MatchResult[] = [];

  for (const apiCard of apiCards) {
    const nameScore = calculateNameScore(importedCard.name, apiCard.name);
    const setScore = calculateSetScore(importedCard.set_name, apiCard.set.name);
    const numberScore = calculateNumberScore(importedCard.card_number, apiCard.number);
    const rarityScore = calculateRarityScore(importedCard.rarity, apiCard.rarity);

    let totalScore = nameScore + setScore + numberScore + rarityScore;
    const bonuses: string[] = [];

    // Apply bonuses for multiple matches
    if (nameScore > 0 && setScore > 0 && numberScore > 0) {
      totalScore += WEIGHTS.ALL_THREE_MATCH;
      bonuses.push('Name+Set+Number match');
    } else if (nameScore > 0 && numberScore > 0) {
      totalScore += WEIGHTS.NAME_AND_NUMBER;
      bonuses.push('Name+Number match');
    } else if (nameScore > 0 && setScore > 0) {
      totalScore += WEIGHTS.NAME_AND_SET;
      bonuses.push('Name+Set match');
    }

    // Skip if below minimum score
    if (totalScore < cfg.minScore) continue;

    // Skip if strict mode and no name match
    if (cfg.strictMode && nameScore === 0) continue;

    results.push({
      card: apiCard,
      score: totalScore,
      matchDetails: {
        nameScore,
        setScore,
        numberScore,
        rarityScore,
        bonuses,
      },
    });
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  // Return best match
  return results.length > 0 ? results[0] : null;
}

/**
 * Find all potential matches for an imported card
 */
export function findAllMatches(
  importedCard: NormalizedCard,
  apiCards: PokemonTCGCard[],
  config: Partial<MatchConfig> = {}
): MatchResult[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!importedCard.name || apiCards.length === 0) {
    return [];
  }

  const results: MatchResult[] = [];

  for (const apiCard of apiCards) {
    const nameScore = calculateNameScore(importedCard.name, apiCard.name);
    const setScore = calculateSetScore(importedCard.set_name, apiCard.set.name);
    const numberScore = calculateNumberScore(importedCard.card_number, apiCard.number);
    const rarityScore = calculateRarityScore(importedCard.rarity, apiCard.rarity);

    let totalScore = nameScore + setScore + numberScore + rarityScore;
    const bonuses: string[] = [];

    if (nameScore > 0 && setScore > 0 && numberScore > 0) {
      totalScore += WEIGHTS.ALL_THREE_MATCH;
      bonuses.push('Name+Set+Number');
    } else if (nameScore > 0 && numberScore > 0) {
      totalScore += WEIGHTS.NAME_AND_NUMBER;
      bonuses.push('Name+Number');
    } else if (nameScore > 0 && setScore > 0) {
      totalScore += WEIGHTS.NAME_AND_SET;
      bonuses.push('Name+Set');
    }

    if (totalScore < cfg.minScore) continue;
    if (cfg.strictMode && nameScore === 0) continue;

    results.push({
      card: apiCard,
      score: totalScore,
      matchDetails: {
        nameScore,
        setScore,
        numberScore,
        rarityScore,
        bonuses,
      },
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, cfg.maxResults);
}

/**
 * Batch match multiple imported cards against API results
 */
export async function batchMatch(
  importedCards: NormalizedCard[],
  searchFunction: (query: string) => Promise<PokemonTCGCard[]>,
  config: Partial<MatchConfig> = {}
): Promise<Map<NormalizedCard, MatchResult | null>> {
  const results = new Map<NormalizedCard, MatchResult | null>();

  // Group cards by name for efficient API calls
  const cardsByName = new Map<string, NormalizedCard[]>();
  for (const card of importedCards) {
    const key = normalizeCardName(card.name);
    if (!cardsByName.has(key)) {
      cardsByName.set(key, []);
    }
    cardsByName.get(key)!.push(card);
  }

  // Search and match for each unique name
  for (const [normalizedName, cards] of cardsByName) {
    try {
      // Use the first card's name for search
      const searchQuery = cards[0].name;
      const apiCards = await searchFunction(searchQuery);

      // Find best match for each card with this name
      for (const card of cards) {
        const match = findBestMatch(card, apiCards, config);
        results.set(card, match);
      }
    } catch (error) {
      console.error(`Error matching cards for "${normalizedName}":`, error);
      // Set null for all cards with this name
      for (const card of cards) {
        results.set(card, null);
      }
    }
  }

  return results;
}

// =============================================
// UTILITY EXPORTS
// =============================================

export {
  normalizeString,
  normalizeCardName,
  normalizeSetName,
  stringSimilarity,
  WEIGHTS,
};
