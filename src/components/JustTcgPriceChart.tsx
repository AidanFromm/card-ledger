import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, TrendingDown, Clock, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { usePriceHistory180d, type JustTcgCondition } from '@/hooks/useJustTcgPricing';
import type { JustTcgPriceHistory } from '@/lib/justTcgApi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type TimeRange = '7D' | '1M' | '3M' | '6M' | 'ALL';

interface JustTcgPriceChartProps {
  /** TCGplayer ID for the card */
  tcgplayerId: string;
  /** Condition to show prices for */
  condition?: JustTcgCondition;
  /** Show time range selector */
  showTimeSelector?: boolean;
  /** Chart height in pixels */
  height?: number;
  /** Compact mode (less padding, smaller text) */
  compact?: boolean;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Custom className */
  className?: string;
}

const TIME_RANGES: { label: TimeRange; days: number }[] = [
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: 'ALL', days: 365 },
];

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className="bg-zinc-900/95 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-[11px] text-zinc-400 mb-0.5">
        {new Date(data.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })}
      </p>
      <p className="text-lg font-bold text-white">
        ${data.price.toFixed(2)}
      </p>
      {data.isHigh && (
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
          <ArrowUp className="h-2.5 w-2.5" /> Period High
        </span>
      )}
      {data.isLow && (
        <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-medium">
          <ArrowDown className="h-2.5 w-2.5" /> Period Low
        </span>
      )}
    </div>
  );
};

export const JustTcgPriceChart = memo(({
  tcgplayerId,
  condition = 'NM',
  showTimeSelector = true,
  height = 180,
  compact = false,
  showRefresh = false,
  className,
}: JustTcgPriceChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');
  
  // Fetch 180-day price history from JustTCG
  const { history, stats, loading, error } = usePriceHistory180d(tcgplayerId, condition);
  
  // Process chart data based on time range
  const { chartData, displayStats, hasEnoughData } = useMemo(() => {
    if (!history || history.length === 0) {
      return { chartData: [], displayStats: null, hasEnoughData: false };
    }
    
    const range = TIME_RANGES.find(r => r.label === timeRange) || TIME_RANGES[2];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);
    
    // Filter and sort data
    const filtered = history
      .filter(point => new Date(point.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (filtered.length < 2) {
      return { chartData: [], displayStats: null, hasEnoughData: false };
    }
    
    // Calculate high/low for this period
    const prices = filtered.map(p => p.price_usd);
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const change = endPrice - startPrice;
    const changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;
    
    // Mark high/low points
    const chartData = filtered.map(point => ({
      date: point.date,
      price: point.price_usd,
      isHigh: point.price_usd === highPrice,
      isLow: point.price_usd === lowPrice,
    }));
    
    // Find first high/low occurrences for reference dots
    const highPoint = chartData.find(d => d.isHigh);
    const lowPoint = chartData.find(d => d.isLow);
    
    return {
      chartData,
      displayStats: {
        high: highPrice,
        low: lowPrice,
        change,
        changePercent,
        highDate: highPoint?.date,
        lowDate: lowPoint?.date,
        startPrice,
        endPrice,
      },
      hasEnoughData: true,
    };
  }, [history, timeRange]);
  
  const isPositive = displayStats ? displayStats.change >= 0 : true;
  
  if (loading) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30',
          className
        )}
        style={{ height }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border border-red-900/30 bg-red-900/10',
          className
        )}
        style={{ height: compact ? height : height + 40 }}
      >
        <p className="text-sm text-red-400">Failed to load price data</p>
        <p className="text-xs text-red-400/70 mt-1">{error}</p>
      </div>
    );
  }
  
  if (!hasEnoughData) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/20',
          className
        )}
        style={{ height: compact ? height : height + 40 }}
      >
        <Clock className="h-8 w-8 text-zinc-600 mb-2" />
        <p className="text-sm text-zinc-500 text-center px-4">
          Price history will appear as data is collected
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          Powered by JustTCG
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Time Range Selector & Stats */}
      {showTimeSelector && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span className={cn(
              'text-sm font-semibold',
              isPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {isPositive ? '+' : ''}{displayStats?.changePercent.toFixed(1)}%
            </span>
            <span className="text-xs text-zinc-500">
              ({isPositive ? '+' : ''}${displayStats?.change.toFixed(2)})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {showRefresh && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                  // Could add refresh functionality here
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
              </Button>
            )}
            
            <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-0.5">
              {TIME_RANGES.map(({ label }) => (
                <button
                  key={label}
                  onClick={() => setTimeRange(label)}
                  className={cn(
                    'text-[11px] px-2.5 py-1 rounded-md font-medium transition-all',
                    timeRange === label 
                      ? 'bg-white/10 text-white' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradientUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="priceGradientDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="date" 
              hide 
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              hide 
              domain={['auto', 'auto']} 
              padding={{ top: 20, bottom: 20 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* High/Low reference lines */}
            {displayStats && !compact && (
              <>
                <ReferenceLine 
                  y={displayStats.high} 
                  stroke="#10b981" 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.4}
                />
                <ReferenceLine 
                  y={displayStats.low} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.4}
                />
              </>
            )}
            
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill={isPositive ? 'url(#priceGradientUp)' : 'url(#priceGradientDown)'}
              animationDuration={500}
            />
            
            {/* High/Low marker dots */}
            {displayStats?.highDate && (
              <ReferenceDot
                x={displayStats.highDate}
                y={displayStats.high}
                r={4}
                fill="#10b981"
                stroke="#10b981"
                strokeWidth={2}
              />
            )}
            {displayStats?.lowDate && (
              <ReferenceDot
                x={displayStats.lowDate}
                y={displayStats.low}
                r={4}
                fill="#ef4444"
                stroke="#ef4444"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Stats Row */}
      {!compact && displayStats && (
        <div className="flex justify-between text-[11px] px-1">
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">Low:</span>
            <span className="text-red-400 font-medium">${displayStats.low.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">High:</span>
            <span className="text-emerald-400 font-medium">${displayStats.high.toFixed(2)}</span>
          </div>
        </div>
      )}
      
      {/* JustTCG attribution */}
      <div className="text-center">
        <span className="text-[9px] text-zinc-600">
          Pricing data by JustTCG
        </span>
      </div>
    </div>
  );
});

JustTcgPriceChart.displayName = 'JustTcgPriceChart';

/**
 * Simple mini chart for use in cards/lists
 */
interface MiniPriceChartProps {
  tcgplayerId: string;
  condition?: JustTcgCondition;
  width?: number;
  height?: number;
  className?: string;
}

export const MiniPriceChart = memo(({
  tcgplayerId,
  condition = 'NM',
  width = 80,
  height = 30,
  className,
}: MiniPriceChartProps) => {
  const { history, stats, loading } = usePriceHistory180d(tcgplayerId, condition);
  
  // Get last 30 days for mini chart
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    
    return history
      .filter(p => new Date(p.date) >= cutoff)
      .map(p => ({ price: p.price_usd }));
  }, [history]);
  
  if (loading || chartData.length < 2) {
    return (
      <div 
        className={cn('bg-zinc-800/30 rounded', className)}
        style={{ width, height }}
      />
    );
  }
  
  const isPositive = stats?.changePercent && stats.changePercent >= 0;
  
  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={1.5}
            fill="url(#miniGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

MiniPriceChart.displayName = 'MiniPriceChart';

export default JustTcgPriceChart;
