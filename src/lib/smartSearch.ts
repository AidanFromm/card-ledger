/**
 * Smart Search Engine
 * 
 * Provides intelligent, typo-tolerant card search with:
 * - Fuzzy matching via Fuse.js
 * - Card number parsing (23, #23, 23/102, SV23)
 * - Set name detection inline
 * - Abbreviation expansion (SV, SWSH, SM, etc.)
 * - Multi-source search (Pokemon TCG, JustTCG)
 * - Match highlighting
 * - Smart ranking
 */

import Fuse from 'fuse.js';

// ============================================
// Types
// ============================================

export interface ParsedQuery {
  // Original query
  original: string;
  // Cleaned card name (with abbreviations expanded)
  cardName: string;
  // Detected set name/abbreviation
  setName?: string;
  // Detected card number
  cardNumber?: string;
  // Detected year
  year?: number;
  // Game category detected
  category?: 'pokemon' | 'mtg' | 'yugioh' | 'lorcana' | 'onepiece' | 'digimon' | 'fab' | 'dbs' | 'sports';
  // Tokens for fuzzy search
  tokens: string[];
}

export interface SearchSuggestion {
  text: string;
  type: 'card' | 'set' | 'player' | 'recent' | 'popular';
  category?: string;
  confidence: number;
}

export interface HighlightedMatch {
  text: string;
  highlighted: boolean;
}

// ============================================
// Set Abbreviation Mappings
// ============================================

const SET_ABBREVIATIONS: Record<string, string[]> = {
  // Scarlet & Violet era
  'scarlet violet': ['sv', 's&v', 'scarlet and violet'],
  'paldea evolved': ['pev', 'paldea'],
  'obsidian flames': ['obf', 'obsidian'],
  'paradox rift': ['par', 'paradox'],
  'temporal forces': ['tef', 'temporal'],
  'twilight masquerade': ['twm', 'twilight', 'masquerade'],
  'shrouded fable': ['sfa', 'shrouded'],
  'stellar crown': ['scr', 'stellar'],
  'surging sparks': ['ssp', 'surging'],
  'prismatic evolutions': ['pre', 'prismatic'],
  
  // Sword & Shield era
  'sword shield': ['swsh', 'sw&sh', 'sword and shield'],
  'vivid voltage': ['viv', 'vivid'],
  'battle styles': ['bst', 'battle'],
  'chilling reign': ['cre', 'chilling'],
  'evolving skies': ['evs', 'evolving'],
  'fusion strike': ['fst', 'fusion'],
  'brilliant stars': ['brs', 'brilliant'],
  'astral radiance': ['asr', 'astral'],
  'pokemon go': ['pgo', 'go'],
  'lost origin': ['lor', 'lost'],
  'silver tempest': ['sit', 'silver'],
  'crown zenith': ['czn', 'crown', 'zenith'],
  
  // Sun & Moon era
  'sun moon': ['sm', 's&m', 'sun and moon'],
  'guardians rising': ['gri', 'guardians'],
  'burning shadows': ['bus', 'burning'],
  'ultra prism': ['upr', 'ultra'],
  'forbidden light': ['fli', 'forbidden'],
  'celestial storm': ['ces', 'celestial'],
  'lost thunder': ['lot', 'thunder'],
  'team up': ['teu', 'team'],
  'unbroken bonds': ['unb', 'unbroken'],
  'unified minds': ['unm', 'unified'],
  'cosmic eclipse': ['cec', 'cosmic'],
  
  // XY era
  'xy': ['xy'],
  'flashfire': ['flf', 'flash'],
  'furious fists': ['ffi', 'furious'],
  'phantom forces': ['phf', 'phantom'],
  'primal clash': ['pcl', 'primal'],
  'roaring skies': ['ros', 'roaring'],
  'ancient origins': ['aor', 'ancient'],
  'breakthrough': ['bkt', 'break'],
  'breakpoint': ['bkp'],
  'fates collide': ['fco', 'fates'],
  'steam siege': ['sts', 'steam'],
  'evolutions': ['evo'],
  
  // Black & White era
  'black white': ['bw', 'b&w', 'black and white'],
  'noble victories': ['nvi', 'noble'],
  'next destinies': ['nxd', 'next'],
  'dark explorers': ['dex', 'dark'],
  'dragons exalted': ['drx', 'dragons'],
  'boundaries crossed': ['bcr', 'boundaries'],
  'plasma storm': ['pls'],
  'plasma freeze': ['plf'],
  'plasma blast': ['plb'],
  'legendary treasures': ['ltr', 'legendary'],
  
  // Classic sets
  'base set': ['base', 'bs'],
  'jungle': ['jun', 'jng'],
  'fossil': ['fos'],
  'team rocket': ['tr', 'rocket'],
  'gym heroes': ['gym1', 'heroes'],
  'gym challenge': ['gym2', 'challenge'],
  'neo genesis': ['neo1', 'genesis'],
  'neo discovery': ['neo2', 'discovery'],
  'neo revelation': ['neo3', 'revelation'],
  'neo destiny': ['neo4', 'destiny'],
  
  // Special sets
  '151': ['151', 'pokemon 151', 'mew'],
  'celebrations': ['cel', 'cele'],
  'shining fates': ['shf', 'shining'],
  'hidden fates': ['hif', 'hidden'],
  'champions path': ['cpa', 'champions'],
};

// Reverse mapping for quick lookup
const ABBREVIATION_TO_SET: Map<string, string> = new Map();
for (const [setName, abbrevs] of Object.entries(SET_ABBREVIATIONS)) {
  for (const abbrev of abbrevs) {
    ABBREVIATION_TO_SET.set(abbrev.toLowerCase(), setName);
  }
}

// ============================================
// Pokemon Suffixes & Special Terms
// ============================================

const POKEMON_SUFFIXES = ['ex', 'gx', 'v', 'vmax', 'vstar', 'vunion', 'tag team', 'break', 'lv.x', 'prime', 'legend', 'mega', 'radiant', 'shiny'];
const RARITY_KEYWORDS = ['illustration rare', 'special art', 'full art', 'secret rare', 'ultra rare', 'hyper rare', 'rainbow', 'gold', 'alt art', 'alternate art'];
const CARD_CATEGORIES = {
  pokemon: ['pokemon', 'pikachu', 'charizard', 'tcg', 'psa', 'cgc', 'bgs'],
  mtg: ['mtg', 'magic', 'gathering', 'wizards', 'planeswalker', 'mana'],
  yugioh: ['yugioh', 'yu-gi-oh', 'konami', 'duel', 'monster'],
  lorcana: ['lorcana', 'disney', 'inklands', 'enchanted'],
  onepiece: ['one piece', 'onepiece', 'luffy', 'zoro', 'bandai', 'op01', 'op02', 'op03', 'op04', 'op05', 'op06', 'op07', 'op08', 'op09', 'nami', 'sanji'],
  digimon: ['digimon', 'digital monster', 'agumon', 'gabumon', 'bt01', 'bt02', 'bt03'],
  fab: ['flesh and blood', 'fab', 'flesh-and-blood', 'welcome to rathe', 'arcane rising', 'crucible', 'tales of aria', 'brute', 'ninja', 'warrior', 'ranger', 'wizard', 'runeblade'],
  dbs: ['dragon ball', 'dragonball', 'dbs', 'fusion world', 'goku', 'vegeta', 'saiyan', 'fb01', 'fb02', 'fb03', 'super saiyan', 'frieza', 'gohan'],
  sports: ['topps', 'panini', 'prizm', 'bowman', 'rookie', 'rc', 'auto', 'rpa', 'nba', 'nfl', 'mlb', 'nhl'],
};

// ============================================
// Query Parser
// ============================================

/**
 * Parse a search query into structured components
 */
export function parseQuery(query: string): ParsedQuery {
  const original = query.trim();
  const lower = original.toLowerCase();
  const tokens = lower.split(/\s+/).filter(t => t.length > 0);
  
  let cardName = original;
  let setName: string | undefined;
  let cardNumber: string | undefined;
  let year: number | undefined;
  let category: ParsedQuery['category'];
  
  // Extract card number patterns
  // Patterns: "23", "#23", "23/102", "SV23", "TG15/TG30"
  const numberPatterns = [
    /^#?(\d{1,4})\/\d{1,4}$/,           // 23/102 or #23/102
    /^#(\d{1,4})$/,                       // #23
    /^([A-Z]{1,3})(\d{1,4})(?:\/.*)?$/i,  // SV23, TG15, TG15/TG30
    /\s#?(\d{1,4})(?:\/\d{1,4})?$/,       // trailing " 23" or " 23/102"
  ];
  
  for (const token of tokens) {
    // Check for card number
    for (const pattern of numberPatterns) {
      const match = token.match(pattern);
      if (match) {
        // Extract the numeric part
        cardNumber = match[1] || match[2] || token.replace(/\D/g, '');
        cardName = cardName.replace(new RegExp(`\\s*${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), ' ').trim();
        break;
      }
    }
    
    // Check for year (1990-2030)
    const yearMatch = token.match(/^(19\d{2}|20[0-3]\d)$/);
    if (yearMatch) {
      year = parseInt(yearMatch[1], 10);
      cardName = cardName.replace(new RegExp(`\\s*${token}\\s*`, 'i'), ' ').trim();
    }
    
    // Check for set abbreviation
    const setMatch = ABBREVIATION_TO_SET.get(token);
    if (setMatch && !setName) {
      setName = setMatch;
      cardName = cardName.replace(new RegExp(`\\b${token}\\b`, 'i'), '').trim();
    }
  }
  
  // Check for inline set name mentions
  for (const [setNameKey] of Object.entries(SET_ABBREVIATIONS)) {
    if (lower.includes(setNameKey)) {
      setName = setNameKey;
      cardName = cardName.replace(new RegExp(setNameKey, 'gi'), '').trim();
      break;
    }
  }
  
  // Detect category
  for (const [cat, keywords] of Object.entries(CARD_CATEGORIES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      category = cat as ParsedQuery['category'];
      break;
    }
  }
  
  // Clean up card name
  cardName = cardName
    .replace(/\s+/g, ' ')
    .replace(/^\s*[-–—]\s*/, '')
    .replace(/\s*[-–—]\s*$/, '')
    .trim();
  
  // If card name is now empty, use original
  if (!cardName) {
    cardName = original;
  }
  
  return {
    original,
    cardName,
    setName,
    cardNumber,
    year,
    category,
    tokens: cardName.toLowerCase().split(/\s+/).filter(t => t.length > 0),
  };
}

// ============================================
// Typo Correction
// ============================================

// Common Pokemon misspellings
const COMMON_CORRECTIONS: Record<string, string> = {
  'charzard': 'charizard',
  'charzrd': 'charizard',
  'charazard': 'charizard',
  'pickachu': 'pikachu',
  'pikchu': 'pikachu',
  'pikacu': 'pikachu',
  'mewtow': 'mewtwo',
  'mewto': 'mewtwo',
  'blastois': 'blastoise',
  'blastiose': 'blastoise',
  'venasaur': 'venusaur',
  'venosaur': 'venusaur',
  'genger': 'gengar',
  'gengor': 'gengar',
  'gyrados': 'gyarados',
  'gyardos': 'gyarados',
  'alakazm': 'alakazam',
  'dragonit': 'dragonite',
  'dragonight': 'dragonite',
  'snorelax': 'snorlax',
  'lucairo': 'lucario',
  'greninja': 'greninja',
  'garchamp': 'garchomp',
  'umbrean': 'umbreon',
  'espean': 'espeon',
  'rayquazza': 'rayquaza',
  'rayquasa': 'rayquaza',
  'luigia': 'lugia',
  'dialaga': 'dialga',
  'palkea': 'palkia',
  'arcues': 'arceus',
  'zekram': 'zekrom',
  'reshiram': 'reshiram',
  'kyurium': 'kyurem',
  'xerneus': 'xerneas',
  'yveltel': 'yveltal',
  'zygard': 'zygarde',
  'lunalla': 'lunala',
  'solgalio': 'solgaleo',
  'necrozam': 'necrozma',
  'zacain': 'zacian',
  'zamazeta': 'zamazenta',
  'eternatis': 'eternatus',
  'caldyrex': 'calyrex',
  'koriadon': 'koraidon',
  'miradon': 'miraidon',
};

/**
 * Attempt to correct common misspellings
 */
export function correctTypos(query: string): string {
  let corrected = query.toLowerCase();
  
  for (const [typo, correct] of Object.entries(COMMON_CORRECTIONS)) {
    corrected = corrected.replace(new RegExp(`\\b${typo}\\b`, 'gi'), correct);
  }
  
  return corrected;
}

// ============================================
// Fuse.js Configuration
// ============================================

export interface FuseSearchItem {
  id: string;
  name: string;
  setName?: string;
  number?: string;
  category?: string;
  price?: number;
}

/**
 * Create a Fuse instance for fuzzy searching
 */
export function createFuseInstance<T extends FuseSearchItem>(
  items: T[],
  options?: Partial<Fuse.IFuseOptions<T>>
): Fuse<T> {
  const defaultOptions: Fuse.IFuseOptions<T> = {
    // Keys to search (with weights)
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'setName', weight: 0.2 },
      { name: 'number', weight: 0.1 },
    ],
    // Fuzzy matching settings
    threshold: 0.4,           // 0 = exact, 1 = match anything
    distance: 100,            // How far from the search location to match
    minMatchCharLength: 2,    // Minimum chars to start matching
    includeScore: true,       // Include match score
    includeMatches: true,     // Include match positions for highlighting
    ignoreLocation: true,     // Search entire string, not just beginning
    useExtendedSearch: true,  // Enable advanced query syntax
    findAllMatches: true,     // Find all matches, not just first
    ...options,
  };
  
  return new Fuse(items, defaultOptions);
}

/**
 * Create highlighted text from Fuse match indices
 */
export function highlightMatches(
  text: string,
  indices: readonly [number, number][] | undefined
): HighlightedMatch[] {
  if (!indices || indices.length === 0) {
    return [{ text, highlighted: false }];
  }
  
  const result: HighlightedMatch[] = [];
  let lastIndex = 0;
  
  // Sort indices to ensure correct order
  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0]);
  
  for (const [start, end] of sortedIndices) {
    // Add non-highlighted text before this match
    if (start > lastIndex) {
      result.push({
        text: text.slice(lastIndex, start),
        highlighted: false,
      });
    }
    
    // Add highlighted match
    result.push({
      text: text.slice(start, end + 1),
      highlighted: true,
    });
    
    lastIndex = end + 1;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    result.push({
      text: text.slice(lastIndex),
      highlighted: false,
    });
  }
  
  return result;
}

// ============================================
// Smart Suggestions
// ============================================

// Popular cards for quick suggestions
export const POPULAR_CARDS = [
  'Charizard', 'Pikachu', 'Mew', 'Mewtwo', 'Lugia', 'Umbreon',
  'Rayquaza', 'Gengar', 'Blastoise', 'Venusaur', 'Gyarados',
  'Alakazam', 'Dragonite', 'Snorlax', 'Lucario', 'Greninja',
  'Garchomp', 'Espeon', 'Eevee', 'Sylveon', 'Leafeon', 'Glaceon',
];

// Popular sports cards
export const POPULAR_PLAYERS = {
  basketball: ['LeBron James', 'Michael Jordan', 'Luka Doncic', 'Victor Wembanyama', 'Stephen Curry'],
  baseball: ['Mike Trout', 'Shohei Ohtani', 'Ronald Acuña Jr.', 'Aaron Judge', 'Mookie Betts'],
  football: ['Patrick Mahomes', 'Travis Kelce', 'Josh Allen', 'Justin Jefferson', 'CeeDee Lamb'],
  hockey: ['Connor McDavid', 'Sidney Crosby', 'Nathan MacKinnon', 'Auston Matthews'],
};

/**
 * Generate smart suggestions based on partial input
 */
export function generateSuggestions(
  query: string,
  recentSearches: string[] = [],
  category?: string
): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const lower = query.toLowerCase();
  
  if (!query) {
    // Show recent searches first
    for (const recent of recentSearches.slice(0, 3)) {
      suggestions.push({
        text: recent,
        type: 'recent',
        confidence: 0.9,
      });
    }
    
    // Then popular cards
    const popular = category === 'sports' 
      ? Object.values(POPULAR_PLAYERS).flat().slice(0, 5)
      : POPULAR_CARDS.slice(0, 5);
    
    for (const card of popular) {
      suggestions.push({
        text: card,
        type: 'popular',
        category: category || 'pokemon',
        confidence: 0.7,
      });
    }
    
    return suggestions;
  }
  
  // Filter recent searches that match
  for (const recent of recentSearches) {
    if (recent.toLowerCase().includes(lower)) {
      suggestions.push({
        text: recent,
        type: 'recent',
        confidence: 0.95,
      });
    }
  }
  
  // Filter popular cards that match
  const popular = category === 'sports'
    ? Object.values(POPULAR_PLAYERS).flat()
    : POPULAR_CARDS;
  
  for (const card of popular) {
    if (card.toLowerCase().includes(lower) || lower.includes(card.toLowerCase().slice(0, 3))) {
      suggestions.push({
        text: card,
        type: 'card',
        category: category || 'pokemon',
        confidence: 0.8,
      });
    }
  }
  
  // Check for typo corrections
  const corrected = correctTypos(query);
  if (corrected !== lower) {
    // Find matching popular cards for the corrected query
    for (const card of popular) {
      if (card.toLowerCase().includes(corrected)) {
        suggestions.push({
          text: card,
          type: 'card',
          category: category || 'pokemon',
          confidence: 0.75,
        });
      }
    }
  }
  
  // Sort by confidence and deduplicate
  const seen = new Set<string>();
  return suggestions
    .filter(s => {
      if (seen.has(s.text.toLowerCase())) return false;
      seen.add(s.text.toLowerCase());
      return true;
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
}

// ============================================
// Exports
// ============================================

export {
  SET_ABBREVIATIONS,
  ABBREVIATION_TO_SET,
  POKEMON_SUFFIXES,
  CARD_CATEGORIES,
};
