/**
 * One Piece Card Game API
 * 
 * Wrapper around JustTCG API for One Piece TCG specific functionality.
 * 
 * Set Code Format: OP01, OP02, OP03, etc. (Booster sets)
 * Also includes: ST01-ST18 (Starter Decks), EB01 (Extra Booster), PRB01 (Premium Booster)
 */

import { justTcgApi, type UnifiedCardResult, type JustTcgSet } from './justTcgApi';

// ============================================
// Types
// ============================================

export interface OnePieceCard extends UnifiedCardResult {
  category: 'onepiece';
}

export interface OnePieceSet extends JustTcgSet {
  setCode?: string;
}

// ============================================
// Constants
// ============================================

export const ONE_PIECE_GAME_ID = 'one-piece-card-game';

// Set abbreviations for One Piece TCG
export const ONE_PIECE_SET_ABBREVIATIONS: Record<string, string> = {
  // Booster Sets
  'op01': 'Romance Dawn',
  'op02': 'Paramount War',
  'op03': 'Pillars of Strength',
  'op04': 'Kingdoms of Intrigue',
  'op05': 'Awakening of the New Era',
  'op06': 'Wings of the Captain',
  'op07': '500 Years in the Future',
  'op08': 'Two Legends',
  'op09': 'The Four Emperors',
  // Starter Decks
  'st01': 'Straw Hat Crew',
  'st02': 'Worst Generation',
  'st03': 'The Seven Warlords of the Sea',
  'st04': 'Animal Kingdom Pirates',
  'st05': 'ONE PIECE FILM edition',
  'st06': 'Absolute Justice',
  'st07': 'Big Mom Pirates',
  'st08': 'Monkey.D.Luffy',
  'st09': 'Yamato',
  'st10': 'The Three Captains',
  'st11': 'Uta',
  'st12': 'Zoro and Sanji',
  'st13': 'The Three Brothers',
  'st14': '3D2Y',
  'st15': 'RED Edward.Newgate',
  'st16': 'GREEN Uta',
  'st17': 'BLUE Donquixote Doflamingo',
  'st18': 'PURPLE Monkey.D.Luffy',
  // Extra Boosters
  'eb01': 'Memorial Collection',
  // Premium Boosters
  'prb01': 'Premium Booster -ONE PIECE CARD THE BEST-',
};

// Popular One Piece cards for suggestions
export const POPULAR_ONE_PIECE_CARDS = [
  'Monkey.D.Luffy',
  'Roronoa Zoro',
  'Nami',
  'Portgas.D.Ace',
  'Shanks',
  'Charlotte Katakuri',
  'Trafalgar Law',
  'Eustass Kid',
  'Boa Hancock',
  'Kaido',
  'Yamato',
  'Uta',
  'Gear 5',
];

// Rarity mappings
export const ONE_PIECE_RARITIES: Record<string, { label: string; color: string }> = {
  'C': { label: 'Common', color: 'text-gray-400' },
  'UC': { label: 'Uncommon', color: 'text-green-400' },
  'R': { label: 'Rare', color: 'text-blue-400' },
  'SR': { label: 'Super Rare', color: 'text-purple-400' },
  'SEC': { label: 'Secret Rare', color: 'text-amber-400' },
  'L': { label: 'Leader', color: 'text-red-400' },
  'SP': { label: 'Special', color: 'text-pink-400' },
  'P': { label: 'Promo', color: 'text-cyan-400' },
};

// ============================================
// API Functions
// ============================================

/**
 * Search One Piece cards
 */
export async function searchOnePieceCards(
  query: string,
  options?: {
    setId?: string;
    printing?: 'Normal' | 'Foil';
    condition?: string;
    pageSize?: number;
  }
): Promise<{ cards: OnePieceCard[]; totalCount: number }> {
  const result = await justTcgApi.searchCards(query, {
    ...options,
    game: ONE_PIECE_GAME_ID,
  });
  
  return {
    cards: result.cards.map(card => ({
      ...card,
      category: 'onepiece' as const,
    })),
    totalCount: result.totalCount,
  };
}

/**
 * Get all One Piece sets
 */
export async function getOnePieceSets(): Promise<OnePieceSet[]> {
  const sets = await justTcgApi.getSets(ONE_PIECE_GAME_ID as any, {
    orderBy: 'release_date',
    order: 'desc',
  });
  
  return sets.map(set => {
    // Try to extract set code from name
    const codeMatch = set.name.match(/\[([A-Z]{2,3}\d{2})\]/i);
    return {
      ...set,
      setCode: codeMatch ? codeMatch[1].toUpperCase() : undefined,
    };
  });
}

/**
 * Get One Piece card by TCGPlayer ID
 */
export async function getOnePieceCard(
  tcgplayerId: string,
  options?: {
    condition?: string;
    printing?: string;
  }
): Promise<OnePieceCard | null> {
  const card = await justTcgApi.getCardByTcgplayerId(tcgplayerId, options);
  if (!card) return null;
  
  return {
    ...card,
    category: 'onepiece' as const,
  };
}

/**
 * Expand set abbreviation to full name
 */
export function expandSetAbbreviation(abbrev: string): string | undefined {
  return ONE_PIECE_SET_ABBREVIATIONS[abbrev.toLowerCase()];
}

/**
 * Get rarity info
 */
export function getRarityInfo(rarity: string): { label: string; color: string } | undefined {
  return ONE_PIECE_RARITIES[rarity.toUpperCase()];
}

// ============================================
// Export
// ============================================

export const onePieceApi = {
  searchCards: searchOnePieceCards,
  getSets: getOnePieceSets,
  getCard: getOnePieceCard,
  expandSetAbbreviation,
  getRarityInfo,
  GAME_ID: ONE_PIECE_GAME_ID,
  SET_ABBREVIATIONS: ONE_PIECE_SET_ABBREVIATIONS,
  POPULAR_CARDS: POPULAR_ONE_PIECE_CARDS,
  RARITIES: ONE_PIECE_RARITIES,
};

export default onePieceApi;
