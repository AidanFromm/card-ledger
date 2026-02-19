/**
 * Price Breakdown — expandable section showing all source prices
 * Includes confidence bars, stale indicator, and refresh button
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Signal, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type AggregatedPriceResult,
  type PriceSourceName,
  getPriceSourceLabel,
  getConfidenceBars,
  getTimeAgo,
  isPriceStale,
} from '@/hooks/usePriceAggregator';

// ============================================
// Confidence Bars
// ============================================

const ConfidenceBars = ({ confidence }: { confidence: number }) => {
  const bars = getConfidenceBars(confidence);
  return (
    <div className="flex items-center gap-0.5" title={`Confidence: ${confidence}%`}>
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className={`w-1 rounded-full transition-colors ${
            level <= bars
              ? bars >= 3
                ? 'bg-emerald-500'
                : bars >= 2
                ? 'bg-amber-500'
                : 'bg-red-500'
              : 'bg-muted-foreground/20'
          }`}
          style={{ height: `${6 + level * 3}px` }}
        />
      ))}
    </div>
  );
};

// ============================================
// Stale Price Indicator
// ============================================

export const StalePriceIndicator = ({ updatedAt }: { updatedAt: string | null }) => {
  const status = isPriceStale(updatedAt);
  if (status === 'fresh') return null;

  if (status === 'outdated') {
    return (
      <div className="flex items-center gap-1 text-amber-500/80">
        <AlertTriangle className="w-3 h-3" />
        <span className="text-[10px] font-medium">Price may be outdated</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-muted-foreground/60">
      <Clock className="w-2.5 h-2.5" />
      <span className="text-[10px]">Stale price</span>
    </div>
  );
};

// ============================================
// Price Source Badge (for InventoryCard)
// ============================================

export const PriceSourceBadge = ({ source }: { source: PriceSourceName | string | null }) => {
  if (!source) return null;
  const label = getPriceSourceLabel(source as PriceSourceName);
  if (!label) return null;

  return (
    <span className="text-[9px] text-muted-foreground/50 font-medium">
      via {label}
    </span>
  );
};

// ============================================
// Price Breakdown Component
// ============================================

interface PriceBreakdownProps {
  aggregated: AggregatedPriceResult | null;
  updatedAt: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const PriceBreakdown = ({
  aggregated,
  updatedAt,
  onRefresh,
  isRefreshing = false,
}: PriceBreakdownProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!aggregated) return null;

  const formatPrice = (n: number | null) =>
    n !== null ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

  const sourceOrder: PriceSourceName[] = ['scrydex', 'pokemon_tcg', 'ebay', 'tavily'];

  return (
    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/20">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ConfidenceBars confidence={aggregated.confidence} />
          <span className="text-[10px] text-muted-foreground/60">{aggregated.confidence}% confidence</span>
        </div>
        <div className="flex items-center gap-2">
          {updatedAt && (
            <span className="text-[10px] text-muted-foreground/50">
              Updated {getTimeAgo(updatedAt)}
            </span>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Stale warning */}
      <StalePriceIndicator updatedAt={updatedAt} />

      {/* Expandable breakdown */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:text-primary/80 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide' : 'See'} price breakdown
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
          {sourceOrder.map((sourceName) => {
            const src = aggregated.sources.find(s => s.source === sourceName);
            if (!src) return null;

            return (
              <div
                key={sourceName}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  src.isOutlier ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-card/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{getPriceSourceLabel(sourceName)}</span>
                  {src.isOutlier && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-semibold">
                      Outlier
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(src.price)}
                </span>
              </div>
            );
          })}

          {aggregated.lowestListed !== null && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
              <span className="text-xs font-medium text-muted-foreground">Lowest Listed</span>
              <span className="text-xs font-bold font-mono text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatPrice(aggregated.lowestListed)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
