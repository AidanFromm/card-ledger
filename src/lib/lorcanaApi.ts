/**
 * Disney Lorcana API
 * 
 * Wrapper around JustTCG API for Lorcana TCG specific functionality.
 * 
 * Set Format: The First Chapter, Rise of the Floodborn, Into the Inklands, etc.
 */

import { justTcgApi, type UnifiedCardResult, type JustTcgSet } from './justTcgApi';

// ============================================
// Types
// ============================================

export interface LorcanaCard extends UnifiedCardResult {
  category: 'lorcana';
  ink?: string;
}

export interface LorcanaSet extends JustTcgSet {
  setNumber?: number;
}

// ============================================
// Constants
// ============================================

export const LORCANA_GAME_ID = 'disney-lorcana';

// Set abbreviations for Lorcana
export const LORCANA_SET_ABBREVIATIONS: Record<string, string> = {
  'tfc': 'The First Chapter',
  'd23': 'D23 Promo',
  'rotf': 'Rise of the Floodborn',
  'iti': 'Into the Inklands',
  'ursula': "Ursula's Return",
  'shimmering': 'Shimmering Skies',
  'azurite': 'Azurite Sea',
  'archazias': "Archazia's Island",
  'set1': 'The First Chapter',
  'set2': 'Rise of the Floodborn',
  'set3': 'Into the Inklands',
  'set4': "Ursula's Return",
  'set5': 'Shimmering Skies',
  'set6': 'Azurite Sea',
};

// Ink colors in Lorcana
export const LORCANA_INKS = [
  'Amber',
  'Amethyst',
  'Emerald',
  'Ruby',
  'Sapphire',
  'Steel',
] as const;

export type LorcanaInk = typeof LORCANA_INKS[number];

export const INK_COLORS: Record<LorcanaInk, string> = {
  'Amber': 'bg-amber-500/20 text-amber-500',
  'Amethyst': 'bg-purple-500/20 text-purple-500',
  'Emerald': 'bg-emerald-500/20 text-emerald-500',
  'Ruby': 'bg-red-500/20 text-red-500',
  'Sapphire': 'bg-blue-500/20 text-blue-500',
  'Steel': 'bg-slate-500/20 text-slate-500',
};

// Popular Lorcana characters for suggestions
export const POPULAR_LORCANA_CARDS = [
  'Elsa',
  'Mickey Mouse',
  'Stitch',
  'Ursula',
  'Maleficent',
  'Moana',
  'Maui',
  'Belle',
  'Simba',
  'Rapunzel',
  'Robin Hood',
  'Hercules',
  'Hades',
];

// Rarity mappings for Lorcana
export const LORCANA_RARITIES: Record<string, { label: string; color: string }> = {
  'C': { label: 'Common', color: 'text-gray-400' },
  'U': { label: 'Uncommon', color: 'text-green-400' },
  'R': { label: 'Rare', color: 'text-blue-400' },
  'SR': { label: 'Super Rare', color: 'text-purple-400' },
  'L': { label: 'Legendary', color: 'text-amber-400' },
  'E': { label: 'Enchanted', color: 'text-pink-400' },
  'P': { label: 'Promo', color: 'text-cyan-400' },
};

// ============================================
// API Functions
// ============================================

/**
 * Search Lorcana cards
 */
export async function searchLorcanaCards(
  query: string,
  options?: {
    setId?: string;
    printing?: 'Normal' | 'Foil';
    condition?: string;
    pageSize?: number;
  }
): Promise<{ cards: LorcanaCard[]; totalCount: number }> {
  const result = await justTcgApi.searchCards(query, {
    ...options,
    game: LORCANA_GAME_ID,
  });
  
  return {
    cards: result.cards.map(card => ({
      ...card,
      category: 'lorcana' as const,
    })),
    totalCount: result.totalCount,
  };
}

/**
 * Get all Lorcana sets
 */
export async function getLorcanaSets(): Promise<LorcanaSet[]> {
  const sets = await justTcgApi.getSets(LORCANA_GAME_ID as any, {
    orderBy: 'release_date',
    order: 'desc',
  });
  
  return sets.map((set, index) => ({
    ...set,
    setNumber: sets.length - index,
  }));
}

/**
 * Get Lorcana card by TCGPlayer ID
 */
export async function getLorcanaCard(
  tcgplayerId: string,
  options?: {
    condition?: string;
    printing?: string;
  }
): Promise<LorcanaCard | null> {
  const card = await justTcgApi.getCardByTcgplayerId(tcgplayerId, options);
  if (!card) return null;
  
  return {
    ...card,
    category: 'lorcana' as const,
  };
}

/**
 * Expand set abbreviation to full name
 */
export function expandSetAbbreviation(abbrev: string): string | undefined {
  return LORCANA_SET_ABBREVIATIONS[abbrev.toLowerCase()];
}

/**
 * Get ink color styling
 */
export function getInkColor(ink: string): string | undefined {
  return INK_COLORS[ink as LorcanaInk];
}

/**
 * Get rarity info
 */
export function getRarityInfo(rarity: string): { label: string; color: string } | undefined {
  return LORCANA_RARITIES[rarity.toUpperCase()];
}

// ============================================
// Export
// ============================================

export const lorcanaApi = {
  searchCards: searchLorcanaCards,
  getSets: getLorcanaSets,
  getCard: getLorcanaCard,
  expandSetAbbreviation,
  getInkColor,
  getRarityInfo,
  GAME_ID: LORCANA_GAME_ID,
  SET_ABBREVIATIONS: LORCANA_SET_ABBREVIATIONS,
  INKS: LORCANA_INKS,
  INK_COLORS,
  POPULAR_CARDS: POPULAR_LORCANA_CARDS,
  RARITIES: LORCANA_RARITIES,
};

export default lorcanaApi;
