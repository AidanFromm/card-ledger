/**
 * Flesh and Blood TCG API
 * 
 * Wrapper around JustTCG API for Flesh and Blood specific functionality.
 * 
 * Set Format: WTR (Welcome to Rathe), ARC (Arcane Rising), CRU (Crucible of War), etc.
 */

import { justTcgApi, type UnifiedCardResult, type JustTcgSet } from './justTcgApi';

// ============================================
// Types
// ============================================

export interface FabCard extends UnifiedCardResult {
  category: 'fab';
  heroClass?: string;
}

export interface FabSet extends JustTcgSet {
  setCode?: string;
}

// ============================================
// Constants
// ============================================

export const FAB_GAME_ID = 'flesh-and-blood-tcg';

// Set abbreviations for Flesh and Blood
export const FAB_SET_ABBREVIATIONS: Record<string, string> = {
  // Main Sets
  'wtr': 'Welcome to Rathe',
  'arc': 'Arcane Rising',
  'cru': 'Crucible of War',
  'mon': 'Monarch',
  'ele': 'Tales of Aria',
  'evr': 'Everfest',
  'upr': 'Uprising',
  'dyn': 'Dynasty',
  'out': 'Outsiders',
  'dtd': 'Dusk till Dawn',
  'evo': 'Bright Lights',
  'hvy': 'Heavy Hitters',
  'mst': 'Part the Mistveil',
  'ros': 'Rosetta',
  // Supplemental Sets
  'her': 'History Pack 1',
  'hp2': 'History Pack 2',
  'fab': 'FAB Promos',
  'pro': 'Promos',
  // Blitz Decks
  'ira': 'Ira Welcome Deck',
};

// Hero classes in Flesh and Blood
export const FAB_CLASSES = [
  'Brute',
  'Guardian',
  'Mechanologist',
  'Ninja',
  'Ranger',
  'Runeblade',
  'Warrior',
  'Wizard',
  'Illusionist',
  'Elemental',
  'Shapeshifter',
  'Assassin',
  'Bard',
  'Generic',
] as const;

export type FabClass = typeof FAB_CLASSES[number];

export const CLASS_COLORS: Record<FabClass, string> = {
  'Brute': 'bg-red-600/20 text-red-500',
  'Guardian': 'bg-yellow-600/20 text-yellow-500',
  'Mechanologist': 'bg-orange-500/20 text-orange-500',
  'Ninja': 'bg-green-500/20 text-green-500',
  'Ranger': 'bg-emerald-500/20 text-emerald-500',
  'Runeblade': 'bg-purple-500/20 text-purple-500',
  'Warrior': 'bg-red-500/20 text-red-500',
  'Wizard': 'bg-blue-500/20 text-blue-500',
  'Illusionist': 'bg-pink-500/20 text-pink-500',
  'Elemental': 'bg-cyan-500/20 text-cyan-500',
  'Shapeshifter': 'bg-violet-500/20 text-violet-500',
  'Assassin': 'bg-slate-500/20 text-slate-500',
  'Bard': 'bg-amber-500/20 text-amber-500',
  'Generic': 'bg-gray-500/20 text-gray-500',
};

// Popular Flesh and Blood cards for suggestions
export const POPULAR_FAB_CARDS = [
  'Command and Conquer',
  'Art of War',
  'Enlightened Strike',
  'Fyendal\'s Spring Tunic',
  'Crucible of Aetherweave',
  'Eye of Ophidia',
  'Heart of Fyendal',
  'Mask of Momentum',
  'Arcanite Skullcap',
  'Crown of Seeds',
  'Rosetta Thorn',
  'Tunic',
];

// Rarity mappings for Flesh and Blood
export const FAB_RARITIES: Record<string, { label: string; color: string }> = {
  'C': { label: 'Common', color: 'text-gray-400' },
  'R': { label: 'Rare', color: 'text-blue-400' },
  'S': { label: 'Super Rare', color: 'text-purple-400' },
  'M': { label: 'Majestic', color: 'text-amber-400' },
  'L': { label: 'Legendary', color: 'text-orange-400' },
  'F': { label: 'Fabled', color: 'text-pink-400' },
  'T': { label: 'Token', color: 'text-gray-500' },
  'P': { label: 'Promo', color: 'text-cyan-400' },
};

// Foiling types in FAB
export const FAB_FOILINGS = [
  'Non-Foil',
  'Rainbow Foil',
  'Cold Foil',
  'Extended Art',
  'Alternate Art',
] as const;

// ============================================
// API Functions
// ============================================

/**
 * Search Flesh and Blood cards
 */
export async function searchFabCards(
  query: string,
  options?: {
    setId?: string;
    printing?: 'Normal' | 'Foil';
    condition?: string;
    pageSize?: number;
  }
): Promise<{ cards: FabCard[]; totalCount: number }> {
  const result = await justTcgApi.searchCards(query, {
    ...options,
    game: FAB_GAME_ID,
  });
  
  return {
    cards: result.cards.map(card => ({
      ...card,
      category: 'fab' as const,
    })),
    totalCount: result.totalCount,
  };
}

/**
 * Get all Flesh and Blood sets
 */
export async function getFabSets(): Promise<FabSet[]> {
  const sets = await justTcgApi.getSets(FAB_GAME_ID as any, {
    orderBy: 'release_date',
    order: 'desc',
  });
  
  return sets.map(set => {
    // Try to extract set code from name
    const codeMatch = set.id.match(/^([a-z]{3})/i);
    return {
      ...set,
      setCode: codeMatch ? codeMatch[1].toUpperCase() : undefined,
    };
  });
}

/**
 * Get Flesh and Blood card by TCGPlayer ID
 */
export async function getFabCard(
  tcgplayerId: string,
  options?: {
    condition?: string;
    printing?: string;
  }
): Promise<FabCard | null> {
  const card = await justTcgApi.getCardByTcgplayerId(tcgplayerId, options);
  if (!card) return null;
  
  return {
    ...card,
    category: 'fab' as const,
  };
}

/**
 * Expand set abbreviation to full name
 */
export function expandSetAbbreviation(abbrev: string): string | undefined {
  return FAB_SET_ABBREVIATIONS[abbrev.toLowerCase()];
}

/**
 * Get class color styling
 */
export function getClassColor(heroClass: string): string | undefined {
  return CLASS_COLORS[heroClass as FabClass];
}

/**
 * Get rarity info
 */
export function getRarityInfo(rarity: string): { label: string; color: string } | undefined {
  return FAB_RARITIES[rarity.toUpperCase()];
}

// ============================================
// Export
// ============================================

export const fabApi = {
  searchCards: searchFabCards,
  getSets: getFabSets,
  getCard: getFabCard,
  expandSetAbbreviation,
  getClassColor,
  getRarityInfo,
  GAME_ID: FAB_GAME_ID,
  SET_ABBREVIATIONS: FAB_SET_ABBREVIATIONS,
  CLASSES: FAB_CLASSES,
  CLASS_COLORS,
  POPULAR_CARDS: POPULAR_FAB_CARDS,
  RARITIES: FAB_RARITIES,
  FOILINGS: FAB_FOILINGS,
};

export default fabApi;
