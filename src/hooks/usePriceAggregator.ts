/**
 * Price Aggregator Hook — Multi-source price aggregation
 * 
 * Sources (in priority order for weighting):
 * 1. eBay sold prices (highest weight — real market data)
 * 2. TCGPlayer/Pokemon TCG API (official market prices)
 * 3. Scrydex (fast, good coverage)
 * 4. Tavily AI (last resort)
 * 
 * Features:
 * - Smart price selection with outlier detection
 * - Confidence scoring (0-100)
 * - localStorage caching (4hr TTL)
 * - Records price snapshots for sparkline history
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { recordItemPrice } from '@/lib/localPriceHistory';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

// ============================================
// Types
// ============================================

export type PriceSourceName = 'scrydex' | 'pokemon_tcg' | 'ebay' | 'tavily';

export interface SourcePrice {
  source: PriceSourceName;
  price: number | null;
  lowPrice: number | null;
  timestamp: number;
  isOutlier?: boolean;
}

export interface AggregatedPriceResult {
  bestPrice: number | null;
  lowestListed: number | null;
  confidence: number; // 0-100
  primarySource: PriceSourceName | null;
  sources: SourcePrice[];
  isStale: boolean;
  lastUpdated: number;
}

export interface RefreshSummary {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  bySource: Record<string, number>;
}

interface CachedPrice {
  result: AggregatedPriceResult;
  cachedAt: number;
}

// ============================================
// Constants
// ============================================

const CACHE_PREFIX = 'cl_pcache_';
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const STALE_THRESHOLD_DAYS = 7;
const OUTDATED_THRESHOLD_DAYS = 30;

// Source weights (higher = more trusted)
const SOURCE_WEIGHTS: Record<PriceSourceName, number> = {
  ebay: 1.0,       // Real sales data
  pokemon_tcg: 0.85, // Official market prices
  scrydex: 0.7,    // Good aggregator
  tavily: 0.4,     // AI-derived, least reliable
};

// ============================================
// Cache helpers
// ============================================

function getCachedPrice(itemId: string): CachedPrice | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${itemId}`);
    if (!raw) return null;
    const cached: CachedPrice = JSON.parse(raw);
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(`${CACHE_PREFIX}${itemId}`);
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

function setCachedPrice(itemId: string, result: AggregatedPriceResult): void {
  try {
    const cached: CachedPrice = { result, cachedAt: Date.now() };
    localStorage.setItem(`${CACHE_PREFIX}${itemId}`, JSON.stringify(cached));
  } catch {
    // localStorage full
  }
}

// ============================================
// Smart price selection
// ============================================

function selectBestPrice(sources: SourcePrice[]): {
  bestPrice: number | null;
  primarySource: PriceSourceName | null;
  confidence: number;
  sourcesWithOutliers: SourcePrice[];
} {
  const validSources = sources.filter(s => s.price !== null && s.price > 0);
  
  if (validSources.length === 0) {
    return { bestPrice: null, primarySource: null, confidence: 0, sourcesWithOutliers: sources };
  }

  const prices = validSources.map(s => s.price!);
  const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];

  // Mark outliers (>30% from median)
  const sourcesWithOutliers = sources.map(s => {
    if (s.price === null || s.price <= 0) return s;
    const deviation = Math.abs(s.price - median) / median;
    return { ...s, isOutlier: deviation > 0.3 };
  });

  // Check if prices agree (within 15%)
  const nonOutlierSources = sourcesWithOutliers.filter(s => s.price !== null && !s.isOutlier);
  const allClose = validSources.every(s => Math.abs(s.price! - median) / median <= 0.15);

  let bestPrice: number;
  let primarySource: PriceSourceName;

  if (allClose && validSources.length >= 2) {
    // Prices agree — use median
    bestPrice = median;
    // Primary source = highest weighted source
    const sorted = [...validSources].sort((a, b) => SOURCE_WEIGHTS[b.source] - SOURCE_WEIGHTS[a.source]);
    primarySource = sorted[0].source;
  } else {
    // Use highest-weighted non-outlier source
    const candidates = nonOutlierSources.length > 0 ? nonOutlierSources : validSources;
    const sorted = [...candidates]
      .filter(s => s.price !== null)
      .sort((a, b) => SOURCE_WEIGHTS[b.source] - SOURCE_WEIGHTS[a.source]);
    bestPrice = sorted[0].price!;
    primarySource = sorted[0].source;
  }

  // Calculate confidence
  let confidence = 0;
  
  // Source count bonus (up to 40)
  confidence += Math.min(validSources.length * 15, 40);
  
  // Agreement bonus (up to 35)
  if (validSources.length >= 2) {
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const spread = max > 0 ? (max - min) / max : 0;
    confidence += Math.max(0, (1 - spread * 2)) * 35;
  } else {
    confidence += 10; // Single source gets some confidence
  }
  
  // Recency bonus (up to 15)
  const mostRecent = Math.max(...validSources.map(s => s.timestamp));
  const hoursSinceUpdate = (Date.now() - mostRecent) / (1000 * 60 * 60);
  if (hoursSinceUpdate < 1) confidence += 15;
  else if (hoursSinceUpdate < 24) confidence += 10;
  else if (hoursSinceUpdate < 168) confidence += 5;
  
  // Weight coverage bonus (up to 10)
  const totalWeight = validSources.reduce((sum, s) => sum + SOURCE_WEIGHTS[s.source], 0);
  confidence += Math.min(totalWeight * 4, 10);

  confidence = Math.min(Math.round(confidence), 100);

  return { bestPrice: Math.round(bestPrice * 100) / 100, primarySource, confidence, sourcesWithOutliers };
}

// ============================================
// Hook
// ============================================

export function usePriceAggregator() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; itemName: string } | null>(null);
  const { toast } = useToast();

  /**
   * Fetch aggregated price for a single item.
   * Uses cache unless forceRefresh is true.
   */
  const fetchAggregatedPrice = useCallback(async (
    item: InventoryItem,
    forceRefresh = false
  ): Promise<AggregatedPriceResult | null> => {
    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedPrice(item.id);
      if (cached) return cached.result;
    }

    const sources: SourcePrice[] = [];
    const now = Date.now();

    // 1. Scrydex (primary — fast, existing flow)
    try {
      const { data } = await supabase.functions.invoke('scrydex-price', {
        body: {
          name: item.name,
          setName: item.set_name,
          cardNumber: item.card_number,
          category: item.category,
          gradingCompany: item.grading_company,
          grade: item.grade,
        },
      });
      if (data?.market_price != null) {
        sources.push({
          source: 'scrydex',
          price: data.market_price,
          lowPrice: data.lowest_listed ?? null,
          timestamp: now,
        });
        // If scrydex returned from pokemon_tcg or tavily, record that source too
        if (data.price_source === 'pokemon_tcg') {
          sources[sources.length - 1].source = 'pokemon_tcg';
        } else if (data.price_source === 'tavily') {
          sources[sources.length - 1].source = 'tavily';
        }
      }
    } catch (e) {
      console.error('Scrydex fetch error:', e);
    }

    // 2. eBay sold prices (if configured)
    try {
      const { data } = await supabase.functions.invoke('ebay-sold-prices', {
        body: {
          cardName: item.name,
          setName: item.set_name,
          gradingCompany: item.grading_company !== 'raw' ? item.grading_company : undefined,
          grade: item.grade ?? undefined,
          category: item.category,
        },
      });
      if (data?.stats?.median && data.stats.median > 0) {
        sources.push({
          source: 'ebay',
          price: data.stats.median,
          lowPrice: data.stats.low ?? null,
          timestamp: now,
        });
      }
    } catch (e) {
      // eBay may not be configured — that's fine
      console.debug('eBay fetch skipped:', e);
    }

    if (sources.length === 0) {
      return null;
    }

    // Run smart selection
    const { bestPrice, primarySource, confidence, sourcesWithOutliers } = selectBestPrice(sources);

    const isStale = item.updated_at
      ? (Date.now() - new Date(item.updated_at).getTime()) > STALE_THRESHOLD_DAYS * 86400000
      : true;

    const result: AggregatedPriceResult = {
      bestPrice,
      lowestListed: sources.find(s => s.lowPrice !== null)?.lowPrice ?? null,
      confidence,
      primarySource,
      sources: sourcesWithOutliers,
      isStale,
      lastUpdated: now,
    };

    // Cache it
    setCachedPrice(item.id, result);

    // Record price snapshot for sparkline
    if (bestPrice && bestPrice > 0) {
      recordItemPrice(item.id, bestPrice);
    }

    return result;
  }, []);

  /**
   * Update item price in DB from aggregated result
   */
  const updateItemPrice = useCallback(async (
    itemId: string,
    result: AggregatedPriceResult
  ): Promise<boolean> => {
    if (result.bestPrice === null) return false;
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          market_price: result.bestPrice,
          lowest_listed: result.lowestListed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);
      return !error;
    } catch {
      return false;
    }
  }, []);

  /**
   * Refresh a single item's price
   */
  const refreshSinglePrice = useCallback(async (
    item: InventoryItem,
    forceRefresh = true
  ): Promise<AggregatedPriceResult | null> => {
    const result = await fetchAggregatedPrice(item, forceRefresh);
    if (result && result.bestPrice !== null) {
      await updateItemPrice(item.id, result);
    }
    return result;
  }, [fetchAggregatedPrice, updateItemPrice]);

  /**
   * Bulk refresh with progress, rate limiting, skip-if-recent, summary
   */
  const refreshAllPrices = useCallback(async (
    items: InventoryItem[],
    forceRefresh = false
  ): Promise<RefreshSummary> => {
    if (isRefreshing || items.length === 0) {
      return { total: 0, success: 0, failed: 0, skipped: 0, bySource: {} };
    }

    setIsRefreshing(true);
    const summary: RefreshSummary = { total: items.length, success: 0, failed: 0, skipped: 0, bySource: {} };

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const batchSize = 3;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      await Promise.all(batch.map(async (item, batchIdx) => {
        setProgress({ current: i + batchIdx + 1, total: items.length, itemName: item.name });

        // Skip if recently updated (unless force)
        if (!forceRefresh && item.updated_at) {
          const updatedTime = new Date(item.updated_at).getTime();
          if (updatedTime > oneHourAgo) {
            summary.skipped++;
            return;
          }
        }

        const result = await fetchAggregatedPrice(item, true);
        if (result && result.bestPrice !== null) {
          const ok = await updateItemPrice(item.id, result);
          if (ok) {
            summary.success++;
            const src = result.primarySource || 'unknown';
            summary.bySource[src] = (summary.bySource[src] || 0) + 1;
          } else {
            summary.failed++;
          }
        } else {
          summary.failed++;
        }
      }));

      // Rate limit: 500ms between batches
      if (i + batchSize < items.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setIsRefreshing(false);
    setProgress(null);

    // Build summary toast
    const parts: string[] = [];
    if (summary.bySource.scrydex) parts.push(`${summary.bySource.scrydex} from Scrydex`);
    if (summary.bySource.pokemon_tcg) parts.push(`${summary.bySource.pokemon_tcg} from TCGPlayer`);
    if (summary.bySource.ebay) parts.push(`${summary.bySource.ebay} from eBay`);
    if (summary.bySource.tavily) parts.push(`${summary.bySource.tavily} from AI`);

    const desc = parts.length > 0
      ? `Updated ${summary.success} cards (${parts.join(', ')})${summary.skipped ? `, ${summary.skipped} skipped (recent)` : ''}, ${summary.failed} unavailable`
      : `Updated ${summary.success} cards, ${summary.failed} unavailable`;

    toast({ title: 'Prices updated', description: desc });

    return summary;
  }, [isRefreshing, fetchAggregatedPrice, updateItemPrice, toast]);

  return {
    isRefreshing,
    progress,
    fetchAggregatedPrice,
    refreshSinglePrice,
    refreshAllPrices,
  };
}

// ============================================
// Utility exports
// ============================================

export function getPriceSourceLabel(source: PriceSourceName | null): string {
  switch (source) {
    case 'scrydex': return 'Scrydex';
    case 'pokemon_tcg': return 'TCGPlayer';
    case 'ebay': return 'eBay';
    case 'tavily': return 'AI Search';
    default: return '';
  }
}

export function getConfidenceBars(confidence: number): number {
  if (confidence >= 75) return 4;
  if (confidence >= 50) return 3;
  if (confidence >= 25) return 2;
  if (confidence > 0) return 1;
  return 0;
}

export function isPriceStale(updatedAt: string | null): 'fresh' | 'stale' | 'outdated' {
  if (!updatedAt) return 'outdated';
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86400000;
  if (days > OUTDATED_THRESHOLD_DAYS) return 'outdated';
  if (days > STALE_THRESHOLD_DAYS) return 'stale';
  return 'fresh';
}

export function getTimeAgo(timestamp: number | string): string {
  const ms = typeof timestamp === 'string' ? Date.now() - new Date(timestamp).getTime() : Date.now() - timestamp;
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
