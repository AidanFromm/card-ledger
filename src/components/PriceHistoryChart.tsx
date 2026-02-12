import { useState, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, TrendingDown, Clock, ArrowUp, ArrowDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import type { PriceHistoryPoint } from "@/lib/priceHistory";

type TimeRange = '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryPoint[];
  loading?: boolean;
  currentPrice?: number;
  showTimeSelector?: boolean;
  height?: number;
  compact?: boolean;
}

const TIME_RANGES: { label: TimeRange; days: number }[] = [
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: 3650 },
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
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

export const PriceHistoryChart = memo(({
  priceHistory,
  loading = false,
  currentPrice,
  showTimeSelector = true,
  height = 180,
  compact = false,
}: PriceHistoryChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  
  // Process chart data based on time range
  const { chartData, stats, hasEnoughData } = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      return { chartData: [], stats: null, hasEnoughData: false };
    }
    
    const range = TIME_RANGES.find(r => r.label === timeRange) || TIME_RANGES[1];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);
    
    // Filter and sort data
    const filtered = priceHistory
      .filter(point => new Date(point.recorded_date) >= cutoffDate)
      .sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());
    
    if (filtered.length < 2) {
      return { chartData: [], stats: null, hasEnoughData: false };
    }
    
    // Calculate high/low
    const prices = filtered.map(p => p.market_price);
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const change = endPrice - startPrice;
    const changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;
    
    // Mark high/low points
    const chartData = filtered.map(point => ({
      date: point.recorded_date,
      price: point.market_price,
      isHigh: point.market_price === highPrice,
      isLow: point.market_price === lowPrice,
    }));
    
    // Find first high/low occurrences for reference dots
    const highPoint = chartData.find(d => d.isHigh);
    const lowPoint = chartData.find(d => d.isLow);
    
    return {
      chartData,
      stats: {
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
  }, [priceHistory, timeRange]);
  
  const isPositive = stats ? stats.change >= 0 : true;
  
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30"
        style={{ height }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }
  
  if (!hasEnoughData) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/20"
        style={{ height: compact ? height : height + 40 }}
      >
        <Clock className="h-8 w-8 text-zinc-600 mb-2" />
        <p className="text-sm text-zinc-500 text-center px-4">
          Price history will appear as data is collected
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          Check back tomorrow!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Time Range Selector */}
      {showTimeSelector && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{stats?.changePercent.toFixed(1)}%
            </span>
            <span className="text-xs text-zinc-500">
              ({isPositive ? '+' : ''}${stats?.change.toFixed(2)})
            </span>
          </div>
          
          <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-0.5">
            {TIME_RANGES.map(({ label }) => (
              <button
                key={label}
                onClick={() => setTimeRange(label)}
                className={`
                  text-[11px] px-2.5 py-1 rounded-md font-medium transition-all
                  ${timeRange === label 
                    ? 'bg-white/10 text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                  }
                `}
              >
                {label}
              </button>
            ))}
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
            {stats && !compact && (
              <>
                <ReferenceLine 
                  y={stats.high} 
                  stroke="#10b981" 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.4}
                />
                <ReferenceLine 
                  y={stats.low} 
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
            {stats?.highDate && (
              <ReferenceDot
                x={stats.highDate}
                y={stats.high}
                r={4}
                fill="#10b981"
                stroke="#10b981"
                strokeWidth={2}
              />
            )}
            {stats?.lowDate && (
              <ReferenceDot
                x={stats.lowDate}
                y={stats.low}
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
      {!compact && stats && (
        <div className="flex justify-between text-[11px] px-1">
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">Low:</span>
            <span className="text-red-400 font-medium">${stats.low.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">High:</span>
            <span className="text-emerald-400 font-medium">${stats.high.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
});

PriceHistoryChart.displayName = "PriceHistoryChart";

export default PriceHistoryChart;
