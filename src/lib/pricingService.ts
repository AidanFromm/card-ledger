/**
 * Unified Pricing Service
 * 
 * Combines multiple pricing sources:
 * 1. JustTCG API - Primary (Pokemon, MTG, Yu-Gi-Oh, Lorcana, One Piece, Digimon)
 * 2. Pokemon TCG API - Fallback for Pokemon
 * 3. eBay API - Fallback for sports cards
 * 
 * This service provides a unified interface for fetching card prices
 * regardless of the underlying data source.
 */

import { justTcgApi, type JustTcgGame, type UnifiedCardPrices, type JustTcgPriceHistory } from './justTcgApi';
import { pokemonTcgApi, type CardPrices } from './pokemonTcgApi';

// ============================================
// Types
// ============================================

export type CardCategory = 'pokemon' | 'mtg' | 'yugioh' | 'lorcana' | 'onepiece' | 'digimon' | 'sports' | 'other';

export interface PriceResult {
  source: 'justtcg' | 'pokemontcg' | 'ebay' | 'manual';
  market?: number;
  low?: number;
  mid?: number;
  high?: number;
  variant?: string;
  condition?: string;
  lastUpdated?: Date;
  priceHistory?: PriceHistoryPoint[];
  changes?: {
    day7?: number;
    day30?: number;
    day90?: number;
  };
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface CardLookup {
  id?: string;
  tcgplayerId?: string;
  name?: string;
  setName?: string;
  category: CardCategory;
}

// ============================================
// Category Mapping
// ============================================

function categoryToJustTcgGame(category: CardCategory): JustTcgGame | null {
  const mapping: Record<CardCategory, JustTcgGame | null> = {
    pokemon: 'pokemon',
    mtg: 'mtg',
    yugioh: 'yugioh',
    lorcana: 'lorcana',
    onepiece: 'onepiece',
    digimon: 'digimon',
    sports: null,
    other: null,
  };
  return mapping[category];
}

// ============================================
// Main Functions
// ============================================

/**
 * Get price for a card from the best available source
 */
export async function getCardPrice(
  card: CardLookup,
  options?: {
    condition?: string;
    printing?: string;
    forceRefresh?: boolean;
  }
): Promise<PriceResult | null> {
  const { condition = 'NM', printing, forceRefresh = false } = options || {};
  const game = categoryToJustTcgGame(card.category);
  
  // Try JustTCG first for supported games
  if (game && card.tcgplayerId) {
    try {
      const price = await justTcgApi.getCardPrice(card.tcgplayerId, {
        condition,
        printing,
      });
      
      if (price) {
        return {
          source: 'justtcg',
          market: price.market,
          low: price.low,
          mid: price.mid,
          high: price.high,
          variant: price.variant,
          condition: price.condition,
          lastUpdated: new Date(),
        };
      }
    } catch (error) {
      console.warn('JustTCG price lookup failed, trying fallback:', error);
    }
  }
  
  // Fallback to Pokemon TCG API for Pokemon cards
  if (card.category === 'pokemon' && card.id) {
    try {
      const prices = await pokemonTcgApi.getCardPrice(card.id);
      
      if (prices) {
        return {
          source: 'pokemontcg',
          market: prices.market,
          low: prices.low,
          mid: prices.mid,
          high: prices.high,
          variant: prices.variant,
          lastUpdated: new Date(),
        };
      }
    } catch (error) {
      console.warn('Pokemon TCG API price lookup failed:', error);
    }
  }
  
  return null;
}

/**
 * Get price history for a card
 */
export async function getPriceHistory(
  card: CardLookup,
  duration: '7d' | '30d' | '90d' | '180d' = '30d'
): Promise<PriceHistoryPoint[]> {
  const game = categoryToJustTcgGame(card.category);
  
  // Try JustTCG
  if (game && card.tcgplayerId) {
    try {
      const history = await justTcgApi.getPriceHistory(card.tcgplayerId, duration);
      
      return history.map(h => ({
        date: h.date,
        price: h.price_usd,
      }));
    } catch (error) {
      console.warn('JustTCG price history failed:', error);
    }
  }
  
  return [];
}

/**
 * Search for cards across all supported games
 */
export async function searchCardsWithPricing(
  query: string,
  options?: {
    category?: CardCategory;
    page?: number;
    pageSize?: number;
  }
): Promise<{
  cards: Array<{
    id: string;
    name: string;
    setName: string;
    category: CardCategory;
    imageUrl?: string;
    price?: PriceResult;
  }>;
  totalCount: number;
}> {
  const { category, page = 1, pageSize = 20 } = options || {};
  const game = category ? categoryToJustTcgGame(category) : undefined;
  
  // Use JustTCG for search when we have a supported category
  if (!category || game) {
    try {
      const result = await justTcgApi.searchCards(query, {
        game: game || undefined,
        page,
        pageSize,
      });
      
      return {
        cards: result.cards.map(card => ({
          id: card.id,
          name: card.name,
          setName: card.set_name,
          category: card.category as CardCategory,
          imageUrl: card.image_url,
          price: card.prices ? {
            source: 'justtcg' as const,
            market: card.prices.market,
            low: card.prices.low,
            mid: card.prices.mid,
            high: card.prices.high,
            variant: card.prices.variant,
            condition: card.prices.condition,
          } : undefined,
        })),
        totalCount: result.totalCount,
      };
    } catch (error) {
      console.warn('JustTCG search failed:', error);
    }
  }
  
  // Fallback to Pokemon TCG API for Pokemon
  if (!category || category === 'pokemon') {
    try {
      const result = await pokemonTcgApi.searchCards(query, { page, pageSize });
      
      return {
        cards: result.cards.map(card => ({
          id: card.id,
          name: card.name,
          setName: card.set_name,
          category: 'pokemon' as CardCategory,
          imageUrl: card.image_url,
          price: card.prices ? {
            source: 'pokemontcg' as const,
            market: card.prices.market,
            low: card.prices.low,
            mid: card.prices.mid,
            high: card.prices.high,
            variant: card.prices.variant,
          } : undefined,
        })),
        totalCount: result.totalCount,
      };
    } catch (error) {
      console.warn('Pokemon TCG API search failed:', error);
    }
  }
  
  return { cards: [], totalCount: 0 };
}

/**
 * Batch update prices for multiple cards
 * Useful for refreshing inventory prices
 */
export async function batchUpdatePrices(
  cards: CardLookup[]
): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();
  
  // Group cards by category
  const tcgCards = cards.filter(c => {
    const game = categoryToJustTcgGame(c.category);
    return game && c.tcgplayerId;
  });
  
  // Batch fetch from JustTCG
  if (tcgCards.length > 0) {
    try {
      const tcgResults = await justTcgApi.batchGetCards(
        tcgCards.map(c => ({ tcgplayerId: c.tcgplayerId! }))
      );
      
      for (const card of tcgResults) {
        if (card.prices) {
          results.set(card.tcgplayer_id || card.id, {
            source: 'justtcg',
            market: card.prices.market,
            low: card.prices.low,
            mid: card.prices.mid,
            high: card.prices.high,
            variant: card.prices.variant,
            condition: card.prices.condition,
            lastUpdated: new Date(),
          });
        }
      }
    } catch (error) {
      console.warn('JustTCG batch fetch failed:', error);
    }
  }
  
  return results;
}

/**
 * Get available games from JustTCG
 */
export async function getAvailableGames() {
  return justTcgApi.getGames();
}

/**
 * Get sets for a specific game
 */
export async function getGameSets(category: CardCategory) {
  const game = categoryToJustTcgGame(category);
  
  if (game) {
    return justTcgApi.getSets(game);
  }
  
  // Fallback to Pokemon TCG API
  if (category === 'pokemon') {
    const result = await pokemonTcgApi.getSets();
    return result.sets.map(set => ({
      id: set.id,
      name: set.name,
      game_id: 'pokemon',
      game: 'Pokémon',
      cards_count: set.total,
      variants_count: 0,
      sealed_count: 0,
      release_date: set.releaseDate,
      set_value_usd: 0,
      set_value_change_7d_pct: 0,
      set_value_change_30d_pct: 0,
      set_value_change_90d_pct: 0,
    }));
  }
  
  return [];
}

// ============================================
// Export
// ============================================

export const pricingService = {
  getCardPrice,
  getPriceHistory,
  searchCardsWithPricing,
  batchUpdatePrices,
  getAvailableGames,
  getGameSets,
};

export default pricingService;
