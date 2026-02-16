/**
 * Dragon Ball Super: Fusion World API
 * 
 * Wrapper around JustTCG API for Dragon Ball Super Fusion World specific functionality.
 * 
 * Set Format: FB01, FB02, FB03, etc. (Fusion World Booster sets)
 * Also includes: FS01-FS04 (Starter Decks), Promos
 */

import { justTcgApi, type UnifiedCardResult, type JustTcgSet } from './justTcgApi';

// ============================================
// Types
// ============================================

export interface DbsCard extends UnifiedCardResult {
  category: 'dbs';
  color?: string;
}

export interface DbsSet extends JustTcgSet {
  setCode?: string;
}

// ============================================
// Constants
// ============================================

export const DBS_GAME_ID = 'dragon-ball-super-fusion-world';

// Set abbreviations for Dragon Ball Super Fusion World
export const DBS_SET_ABBREVIATIONS: Record<string, string> = {
  // Booster Sets
  'fb01': 'Awakened Pulse',
  'fb02': 'Blazing Aura',
  'fb03': 'Extreme Evolution',
  'fb04': 'Ultimate Awakened Power',
  // Starter Decks
  'fs01': 'Son Goku',
  'fs02': 'Vegeta',
  'fs03': 'Broly',
  'fs04': 'Frieza',
  'fs05': 'Son Gohan',
  'fs06': 'Android 17 & 18',
  // Special
  'promo': 'Promos',
  'pr': 'Promos',
};

// Colors in Dragon Ball Super Fusion World
export const DBS_COLORS = [
  'Red',
  'Blue', 
  'Green',
  'Yellow',
  'Black',
  'Multi',
] as const;

export type DbsColor = typeof DBS_COLORS[number];

export const COLOR_STYLES: Record<DbsColor, string> = {
  'Red': 'bg-red-500/20 text-red-500',
  'Blue': 'bg-blue-500/20 text-blue-500',
  'Green': 'bg-green-500/20 text-green-500',
  'Yellow': 'bg-yellow-500/20 text-yellow-500',
  'Black': 'bg-gray-700/20 text-gray-400',
  'Multi': 'bg-gradient-to-r from-red-500/20 via-blue-500/20 to-green-500/20 text-purple-400',
};

// Popular Dragon Ball Super cards for suggestions
export const POPULAR_DBS_CARDS = [
  'Son Goku',
  'Vegeta',
  'Gohan',
  'Frieza',
  'Broly',
  'Piccolo',
  'Goku Black',
  'Beerus',
  'Whis',
  'Cell',
  'Majin Buu',
  'Trunks',
  'Gogeta',
  'Vegito',
  'Super Saiyan',
  'Ultra Instinct',
];

// Character types/sagas
export const DBS_SAGAS = [
  'Saiyan Saga',
  'Frieza Saga',
  'Cell Saga',
  'Buu Saga',
  'God of Destruction',
  'Universe Survival',
  'Broly Movie',
  'Super Hero',
] as const;

// Rarity mappings for Dragon Ball Super Fusion World
export const DBS_RARITIES: Record<string, { label: string; color: string }> = {
  'C': { label: 'Common', color: 'text-gray-400' },
  'UC': { label: 'Uncommon', color: 'text-green-400' },
  'R': { label: 'Rare', color: 'text-blue-400' },
  'SR': { label: 'Super Rare', color: 'text-purple-400' },
  'SCR': { label: 'Secret Rare', color: 'text-amber-400' },
  'SPR': { label: 'Special Rare', color: 'text-pink-400' },
  'L': { label: 'Leader', color: 'text-red-400' },
  'P': { label: 'Promo', color: 'text-cyan-400' },
};

// Card types in DBS
export const DBS_CARD_TYPES = [
  'Leader',
  'Battle',
  'Extra',
] as const;

// ============================================
// API Functions
// ============================================

/**
 * Search Dragon Ball Super Fusion World cards
 */
export async function searchDbsCards(
  query: string,
  options?: {
    setId?: string;
    printing?: 'Normal' | 'Foil';
    condition?: string;
    pageSize?: number;
  }
): Promise<{ cards: DbsCard[]; totalCount: number }> {
  const result = await justTcgApi.searchCards(query, {
    ...options,
    game: DBS_GAME_ID,
  });
  
  return {
    cards: result.cards.map(card => ({
      ...card,
      category: 'dbs' as const,
    })),
    totalCount: result.totalCount,
  };
}

/**
 * Get all Dragon Ball Super Fusion World sets
 */
export async function getDbsSets(): Promise<DbsSet[]> {
  const sets = await justTcgApi.getSets(DBS_GAME_ID as any, {
    orderBy: 'release_date',
    order: 'desc',
  });
  
  return sets.map(set => {
    // Try to extract set code from name (FB01, FS01, etc.)
    const codeMatch = set.name.match(/\[?(FB\d{2}|FS\d{2})\]?/i);
    return {
      ...set,
      setCode: codeMatch ? codeMatch[1].toUpperCase() : undefined,
    };
  });
}

/**
 * Get Dragon Ball Super card by TCGPlayer ID
 */
export async function getDbsCard(
  tcgplayerId: string,
  options?: {
    condition?: string;
    printing?: string;
  }
): Promise<DbsCard | null> {
  const card = await justTcgApi.getCardByTcgplayerId(tcgplayerId, options);
  if (!card) return null;
  
  return {
    ...card,
    category: 'dbs' as const,
  };
}

/**
 * Expand set abbreviation to full name
 */
export function expandSetAbbreviation(abbrev: string): string | undefined {
  return DBS_SET_ABBREVIATIONS[abbrev.toLowerCase()];
}

/**
 * Get color styling
 */
export function getColorStyle(color: string): string | undefined {
  return COLOR_STYLES[color as DbsColor];
}

/**
 * Get rarity info
 */
export function getRarityInfo(rarity: string): { label: string; color: string } | undefined {
  return DBS_RARITIES[rarity.toUpperCase()];
}

// ============================================
// Export
// ============================================

export const dbsApi = {
  searchCards: searchDbsCards,
  getSets: getDbsSets,
  getCard: getDbsCard,
  expandSetAbbreviation,
  getColorStyle,
  getRarityInfo,
  GAME_ID: DBS_GAME_ID,
  SET_ABBREVIATIONS: DBS_SET_ABBREVIATIONS,
  COLORS: DBS_COLORS,
  COLOR_STYLES,
  POPULAR_CARDS: POPULAR_DBS_CARDS,
  SAGAS: DBS_SAGAS,
  RARITIES: DBS_RARITIES,
  CARD_TYPES: DBS_CARD_TYPES,
};

export default dbsApi;
