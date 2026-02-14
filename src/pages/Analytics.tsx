import { useState, useMemo, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Award,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Trophy,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  Layers,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useSalesDb } from "@/hooks/useSalesDb";
import { usePortfolioHistory, TimeRange } from "@/hooks/usePortfolioHistory";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface InventoryItem {
  id: string;
  name: string;
  category?: string | null;
  set_name: string;
  grading_company: string;
  grade?: string | null;
  purchase_price: number;
  market_price: number | null;
  quantity: number;
  card_image_url?: string | null;
  sale_price?: number | null;
}

interface Sale {
  id: string;
  item_name: string;
  purchase_price: number;
  sale_price: number;
  quantity_sold: number;
  sale_date: string;
  card_image_url?: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_COLORS: Record<string, { primary: string; glow: string }> = {
  'Pokemon': { primary: '#FBBF24', glow: 'rgba(251, 191, 36, 0.3)' },
  'Sports': { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)' },
  'One Piece': { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.3)' },
  'Magic': { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.3)' },
  'Yu-Gi-Oh!': { primary: '#F97316', glow: 'rgba(249, 115, 22, 0.3)' },
  'Dragon Ball': { primary: '#EC4899', glow: 'rgba(236, 72, 153, 0.3)' },
  'Lorcana': { primary: '#06B6D4', glow: 'rgba(6, 182, 212, 0.3)' },
  'Other': { primary: '#6B7280', glow: 'rgba(107, 114, 128, 0.3)' },
};

const CONDITION_COLORS = {
  'Graded': { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.3)' },
  'Raw': { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)' },
};

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' },
];

// ============================================================================
// Utility Functions
// ============================================================================

const formatCurrency = (value: number) => 
  value.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPercent = (value: number) => 
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

// ============================================================================
// Glassmorphism Card Component
// ============================================================================

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}

const GlassCard = memo(({ children, className = "", glowColor, delay = 0 }: GlassCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
    className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/40",
      "backdrop-blur-xl border border-zinc-800/50 rounded-2xl",
      "transition-all duration-300 hover:border-zinc-700/60",
      className
    )}
    style={{
      boxShadow: glowColor ? `0 0 40px ${glowColor}` : undefined,
    }}
  >
    {glowColor && (
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${glowColor}, transparent 60%)`,
        }}
      />
    )}
    <div className="relative z-10">{children}</div>
  </motion.div>
));
GlassCard.displayName = "GlassCard";

// ============================================================================
// Stats Card Component (with animated counter)
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  isPositive?: boolean;
  showSign?: boolean;
  delay?: number;
  subValue?: string;
}

const StatCard = memo(({ 
  label, 
  value, 
  prefix = "$", 
  suffix = "", 
  icon: Icon, 
  iconColor, 
  iconBg,
  isPositive,
  showSign = false,
  delay = 0,
  subValue,
}: StatCardProps) => {
  const displayPrefix = showSign ? (value >= 0 ? `+${prefix}` : `-${prefix}`) : prefix;
  const displayValue = showSign ? Math.abs(value) : value;
  const glowColor = isPositive !== undefined 
    ? (isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)')
    : undefined;

  return (
    <GlassCard delay={delay} glowColor={glowColor} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </span>
        <div className={cn("p-2 rounded-xl", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>
      <div className={cn(
        "text-2xl font-bold tracking-tight",
        isPositive !== undefined ? (isPositive ? "text-emerald-400" : "text-red-400") : "text-white"
      )}>
        <AnimatedNumber value={displayValue} prefix={displayPrefix} suffix={suffix} decimals={2} />
      </div>
      {subValue && (
        <div className="mt-1 text-xs text-zinc-500">{subValue}</div>
      )}
    </GlassCard>
  );
});
StatCard.displayName = "StatCard";

// ============================================================================
// Time Range Selector Component
// ============================================================================

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TimeRangeSelector = memo(({ selected, onChange }: TimeRangeSelectorProps) => (
  <div className="flex items-center gap-1 p-1 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl">
    {TIME_RANGES.map(({ value, label }) => (
      <motion.button
        key={value}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onChange(value)}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200",
          selected === value
            ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        )}
      >
        {label}
      </motion.button>
    ))}
  </div>
));
TimeRangeSelector.displayName = "TimeRangeSelector";

// ============================================================================
// Performance Chart Component
// ============================================================================

interface PerformanceChartProps {
  data: Array<{ date: string; value: number }>;
  loading: boolean;
  isPositive: boolean;
  showCostBasis: boolean;
  costBasisData?: Array<{ date: string; cost: number }>;
}

const PerformanceChart = memo(({ 
  data, 
  loading, 
  isPositive, 
  showCostBasis,
  costBasisData = [],
}: PerformanceChartProps) => {
  const chartColor = isPositive ? "#14b8a6" : "#ef4444";
  const costColor = "#6366f1";

  // Merge data with cost basis
  const mergedData = useMemo(() => {
    if (!showCostBasis || costBasisData.length === 0) return data;
    
    return data.map(d => {
      const costPoint = costBasisData.find(c => c.date === d.date);
      return {
        ...d,
        cost: costPoint?.cost || 0,
      };
    });
  }, [data, costBasisData, showCostBasis]);

  if (loading) {
    return (
      <div className="h-[280px] bg-zinc-900/40 rounded-2xl flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading chart...</span>
        </div>
      </div>
    );
  }

  return (
    <GlassCard className="p-4" delay={0.2}>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={costColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={costColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#52525b" 
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#52525b"
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(24, 24, 27, 0.95)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: '12px',
                backdropFilter: 'blur(12px)',
                padding: '12px',
              }}
              labelStyle={{ color: '#a1a1aa', marginBottom: '8px' }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'cost' ? 'Cost Basis' : 'Portfolio Value'
              ]}
            />
            {showCostBasis && (
              <Area
                type="monotone"
                dataKey="cost"
                stroke={costColor}
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#costGradient)"
                animationDuration={1000}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2.5}
              fill="url(#valueGradient)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
});
PerformanceChart.displayName = "PerformanceChart";

// ============================================================================
// Allocation Pie Chart Component
// ============================================================================

type AllocationView = 'category' | 'condition' | 'set';

interface AllocationChartProps {
  items: InventoryItem[];
  view: AllocationView;
  onSegmentClick?: (segment: string) => void;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 15px ${payload.glow || 'rgba(20, 184, 166, 0.4)'})` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

const AllocationChart = memo(({ items, view, onSegmentClick }: AllocationChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const groups = new Map<string, { value: number; count: number }>();

    items.forEach(item => {
      let key: string;
      
      if (view === 'category') {
        key = item.category || 'Other';
      } else if (view === 'condition') {
        key = item.grading_company !== 'Raw' && item.grade ? 'Graded' : 'Raw';
      } else {
        key = item.set_name || 'Unknown Set';
      }

      const value = (item.market_price || item.purchase_price) * item.quantity;
      const existing = groups.get(key) || { value: 0, count: 0 };
      groups.set(key, {
        value: existing.value + value,
        count: existing.count + item.quantity,
      });
    });

    const colors = view === 'condition' ? CONDITION_COLORS : CATEGORY_COLORS;
    const defaultColors = ['#14b8a6', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#84cc16', '#6366f1', '#f43f5e'];
    let colorIndex = 0;

    return Array.from(groups.entries())
      .map(([name, data]) => {
        const colorSet = colors[name as keyof typeof colors] || {
          primary: defaultColors[colorIndex++ % defaultColors.length],
          glow: `rgba(20, 184, 166, 0.3)`,
        };
        return {
          name,
          value: data.value,
          count: data.count,
          color: colorSet.primary,
          glow: colorSet.glow,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8
  }, [items, view]);

  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);
  const activeData = activeIndex !== null ? chartData[activeIndex] : null;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Pie Chart */}
      <div className="w-48 h-48 flex-shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              animationDuration={800}
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(data) => onSegmentClick?.(data.name)}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={entry.color}
                  style={{ filter: `drop-shadow(0 0 6px ${entry.glow})` }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {activeData ? (
              <motion.div
                key={activeData.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                <p className="text-2xl font-bold text-white">
                  {((activeData.value / totalValue) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-zinc-400">{activeData.count} cards</p>
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                <p className="text-lg font-bold text-white">
                  {formatCurrency(totalValue).replace('.00', '')}
                </p>
                <p className="text-xs text-zinc-400">Total</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide w-full">
        {chartData.map((entry, index) => {
          const percentage = totalValue > 0 ? (entry.value / totalValue * 100) : 0;
          const isActive = activeIndex === index;

          return (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200",
                isActive ? "bg-zinc-800/80" : "hover:bg-zinc-800/40"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => onSegmentClick?.(entry.name)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{
                    backgroundColor: entry.color,
                    boxShadow: isActive ? `0 0 10px ${entry.glow}` : 'none',
                  }}
                />
                <span className={cn(
                  "text-sm font-medium truncate max-w-[150px]",
                  isActive ? "text-white" : "text-zinc-400"
                )}>
                  {entry.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-sm font-semibold",
                  isActive ? "text-white" : "text-zinc-300"
                )}>
                  {formatCurrency(entry.value).replace('.00', '')}
                </span>
                <span className="text-xs text-zinc-500 w-12 text-right">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
AllocationChart.displayName = "AllocationChart";

// ============================================================================
// Performers Table Component
// ============================================================================

interface PerformerData {
  id: string;
  name: string;
  cost: number;
  value: number;
  pl: number;
  roi: number;
  imageUrl?: string | null;
}

interface PerformersTableProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  data: PerformerData[];
  isGainers: boolean;
}

const PerformersTable = memo(({ title, icon: Icon, iconColor, data, isGainers }: PerformersTableProps) => {
  const [sortField, setSortField] = useState<'roi' | 'pl' | 'value'>('roi');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(isGainers ? 'desc' : 'asc');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1;
      return mult * (a[sortField] - b[sortField]);
    });
  }, [data, sortField, sortDir]);

  const handleSort = (field: 'roi' | 'pl' | 'value') => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(isGainers ? 'desc' : 'asc');
    }
  };

  const SortIcon = sortDir === 'desc' ? ChevronDown : ChevronUp;

  return (
    <GlassCard className="p-4" delay={isGainers ? 0.3 : 0.35}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={cn("p-2 rounded-xl", isGainers ? "bg-emerald-500/15" : "bg-red-500/15")}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-800/50">
        <div className="col-span-5">Card</div>
        <div className="col-span-2 text-right">Cost</div>
        <div 
          className="col-span-2 text-right cursor-pointer hover:text-zinc-300 flex items-center justify-end gap-1"
          onClick={() => handleSort('value')}
        >
          Value
          {sortField === 'value' && <SortIcon className="h-3 w-3" />}
        </div>
        <div 
          className="col-span-3 text-right cursor-pointer hover:text-zinc-300 flex items-center justify-end gap-1"
          onClick={() => handleSort('roi')}
        >
          ROI
          {sortField === 'roi' && <SortIcon className="h-3 w-3" />}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-zinc-800/30 max-h-[300px] overflow-y-auto scrollbar-hide">
        {sortedData.slice(0, 10).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-zinc-800/30 transition-colors"
          >
            <div className="col-span-5 flex items-center gap-2">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-8 h-8 rounded-lg object-cover bg-zinc-800"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">
                  🃏
                </div>
              )}
              <span className="text-sm text-white truncate">{item.name}</span>
            </div>
            <div className="col-span-2 text-right text-sm text-zinc-400">
              ${item.cost.toFixed(0)}
            </div>
            <div className="col-span-2 text-right text-sm text-white">
              ${item.value.toFixed(0)}
            </div>
            <div className={cn(
              "col-span-3 text-right text-sm font-semibold flex items-center justify-end gap-1",
              item.roi >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {item.roi >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {formatPercent(item.roi)}
            </div>
          </motion.div>
        ))}

        {sortedData.length === 0 && (
          <div className="py-8 text-center text-zinc-500 text-sm">
            No data available
          </div>
        )}
      </div>
    </GlassCard>
  );
});
PerformersTable.displayName = "PerformersTable";

// ============================================================================
// Statistics Cards Grid
// ============================================================================

interface StatsGridProps {
  avgValue: number;
  avgROI: number;
  winRate: number;
  bestGain: { name: string; value: number };
  worstLoss: { name: string; value: number };
}

const StatsGrid = memo(({ avgValue, avgROI, winRate, bestGain, worstLoss }: StatsGridProps) => (
  <GlassCard className="p-5" delay={0.4}>
    <div className="flex items-center gap-2.5 mb-5">
      <div className="p-2 rounded-xl bg-teal-500/15">
        <BarChart3 className="h-4 w-4 text-teal-400" />
      </div>
      <h3 className="text-base font-semibold text-white">Quick Statistics</h3>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Avg Card Value */}
      <div className="text-center p-4 rounded-xl bg-zinc-800/30">
        <div className="text-2xl font-bold text-white mb-1">
          <AnimatedNumber value={avgValue} prefix="$" decimals={0} />
        </div>
        <div className="text-xs text-zinc-400">Avg Card Value</div>
      </div>

      {/* Avg ROI */}
      <div className="text-center p-4 rounded-xl bg-zinc-800/30">
        <div className={cn(
          "text-2xl font-bold mb-1",
          avgROI >= 0 ? "text-emerald-400" : "text-red-400"
        )}>
          <AnimatedNumber value={avgROI} prefix={avgROI >= 0 ? "+" : ""} suffix="%" decimals={1} />
        </div>
        <div className="text-xs text-zinc-400">Avg ROI</div>
      </div>

      {/* Win Rate */}
      <div className="text-center p-4 rounded-xl bg-zinc-800/30">
        <div className="text-2xl font-bold text-teal-400 mb-1">
          <AnimatedNumber value={winRate} suffix="%" decimals={0} />
        </div>
        <div className="text-xs text-zinc-400">Win Rate</div>
      </div>

      {/* Best Gain */}
      <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="text-2xl font-bold text-emerald-400 mb-1">
          +<AnimatedNumber value={bestGain.value} prefix="$" decimals={0} />
        </div>
        <div className="text-xs text-emerald-400/70 truncate" title={bestGain.name}>
          {bestGain.name || "Best Gain"}
        </div>
      </div>

      {/* Worst Loss */}
      <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="text-2xl font-bold text-red-400 mb-1">
          -<AnimatedNumber value={Math.abs(worstLoss.value)} prefix="$" decimals={0} />
        </div>
        <div className="text-xs text-red-400/70 truncate" title={worstLoss.name}>
          {worstLoss.name || "Worst Loss"}
        </div>
      </div>
    </div>
  </GlassCard>
));
StatsGrid.displayName = "StatsGrid";

// ============================================================================
// Loading Skeleton
// ============================================================================

const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Hero stats skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="h-28 bg-zinc-800/40 rounded-2xl" />
      ))}
    </div>
    
    {/* Chart skeleton */}
    <div className="h-[320px] bg-zinc-800/30 rounded-2xl relative overflow-hidden">
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent"
      />
    </div>
    
    {/* Allocation skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-[280px] bg-zinc-800/30 rounded-2xl" />
      <div className="h-[280px] bg-zinc-800/30 rounded-2xl" />
    </div>
  </div>
);

// ============================================================================
// Main Analytics Page Component
// ============================================================================

const Analytics = () => {
  const { items, loading: inventoryLoading, refetch, isSyncing } = useInventoryDb();
  const { sales, loading: salesLoading } = useSalesDb();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [allocationView, setAllocationView] = useState<AllocationView>('category');
  const [showCostBasis, setShowCostBasis] = useState(false);

  // Filter to only unsold items for portfolio analysis
  const unsoldItems = useMemo(() => 
    items.filter(item => !item.sale_price) as InventoryItem[],
    [items]
  );

  // ========================================
  // Portfolio Summary Calculations
  // ========================================
  const portfolioStats = useMemo(() => {
    // Total Value (current market value of unsold items)
    const totalValue = unsoldItems.reduce((sum, item) => {
      const price = item.market_price || item.purchase_price;
      return sum + (price * item.quantity);
    }, 0);

    // Total Cost Basis (what we paid for unsold items)
    const totalCostBasis = unsoldItems.reduce((sum, item) => {
      return sum + (item.purchase_price * item.quantity);
    }, 0);

    // Unrealized P&L (paper gains/losses on unsold items)
    const unrealizedPL = totalValue - totalCostBasis;

    // Realized P&L (actual gains/losses from sales)
    const realizedPL = sales.reduce((sum, sale) => {
      const profit = (sale.sale_price - sale.purchase_price) * sale.quantity_sold;
      return sum + profit;
    }, 0);

    // Total P&L
    const totalPL = unrealizedPL + realizedPL;

    // ROI % overall (total P&L / total investment)
    const totalInvested = totalCostBasis + sales.reduce((sum, sale) => 
      sum + (sale.purchase_price * sale.quantity_sold), 0
    );
    const roiPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalCostBasis,
      unrealizedPL,
      realizedPL,
      totalPL,
      roiPercent,
    };
  }, [unsoldItems, sales]);

  // ========================================
  // Portfolio History for Chart
  // ========================================
  const { 
    data: portfolioHistory, 
    loading: historyLoading,
  } = usePortfolioHistory(timeRange, portfolioStats.totalValue);

  // Cost basis line data (cumulative cost over time)
  const costBasisHistory = useMemo(() => {
    // For simplicity, show flat cost basis line at current total
    if (portfolioHistory.length === 0) return [];
    return portfolioHistory.map(d => ({
      date: d.date,
      cost: portfolioStats.totalCostBasis,
    }));
  }, [portfolioHistory, portfolioStats.totalCostBasis]);

  // ========================================
  // Performance Data (for tables)
  // ========================================
  const performanceData = useMemo(() => {
    return unsoldItems.map(item => {
      const cost = item.purchase_price * item.quantity;
      const value = (item.market_price || item.purchase_price) * item.quantity;
      const pl = value - cost;
      const roi = cost > 0 ? ((value - cost) / cost) * 100 : 0;

      return {
        id: item.id,
        name: item.name,
        cost,
        value,
        pl,
        roi,
        imageUrl: item.card_image_url,
      };
    });
  }, [unsoldItems]);

  const topPerformers = useMemo(() => 
    [...performanceData].sort((a, b) => b.roi - a.roi),
    [performanceData]
  );

  const worstPerformers = useMemo(() => 
    [...performanceData].sort((a, b) => a.roi - b.roi),
    [performanceData]
  );

  // ========================================
  // Statistics Calculations
  // ========================================
  const statistics = useMemo(() => {
    if (performanceData.length === 0) {
      return {
        avgValue: 0,
        avgROI: 0,
        winRate: 0,
        bestGain: { name: '', value: 0 },
        worstLoss: { name: '', value: 0 },
      };
    }

    const totalCards = unsoldItems.reduce((sum, item) => sum + item.quantity, 0);
    const avgValue = totalCards > 0 ? portfolioStats.totalValue / totalCards : 0;
    const avgROI = performanceData.length > 0
      ? performanceData.reduce((sum, p) => sum + p.roi, 0) / performanceData.length
      : 0;

    const profitableCards = performanceData.filter(p => p.pl > 0).length;
    const winRate = performanceData.length > 0 
      ? (profitableCards / performanceData.length) * 100 
      : 0;

    const best = topPerformers[0] || { name: '', pl: 0 };
    const worst = worstPerformers[0] || { name: '', pl: 0 };

    return {
      avgValue,
      avgROI,
      winRate,
      bestGain: { name: best.name, value: best.pl },
      worstLoss: { name: worst.name, value: worst.pl },
    };
  }, [performanceData, portfolioStats.totalValue, unsoldItems, topPerformers, worstPerformers]);

  // ========================================
  // Allocation View Toggle
  // ========================================
  const allocationViews: { value: AllocationView; label: string }[] = [
    { value: 'category', label: 'Category' },
    { value: 'condition', label: 'Condition' },
    { value: 'set', label: 'Set/Series' },
  ];

  // Loading state
  const loading = inventoryLoading || salesLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <AnalyticsSkeleton />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
              <p className="text-sm text-zinc-400">Portfolio performance & insights</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isSyncing}
              className="gap-1.5 h-9 px-3 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              {isSyncing ? 'Syncing...' : 'Refresh'}
            </Button>
          </motion.div>

          {/* ================================ */}
          {/* Portfolio Summary Cards */}
          {/* ================================ */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Total Value"
              value={portfolioStats.totalValue}
              icon={DollarSign}
              iconColor="text-teal-400"
              iconBg="bg-teal-500/15"
              delay={0}
            />
            <StatCard
              label="Cost Basis"
              value={portfolioStats.totalCostBasis}
              icon={Wallet}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/15"
              delay={0.05}
            />
            <StatCard
              label="Unrealized P&L"
              value={portfolioStats.unrealizedPL}
              icon={TrendingUp}
              iconColor={portfolioStats.unrealizedPL >= 0 ? "text-emerald-400" : "text-red-400"}
              iconBg={portfolioStats.unrealizedPL >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"}
              isPositive={portfolioStats.unrealizedPL >= 0}
              showSign
              delay={0.1}
            />
            <StatCard
              label="Realized P&L"
              value={portfolioStats.realizedPL}
              icon={Award}
              iconColor={portfolioStats.realizedPL >= 0 ? "text-emerald-400" : "text-red-400"}
              iconBg={portfolioStats.realizedPL >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"}
              isPositive={portfolioStats.realizedPL >= 0}
              showSign
              delay={0.15}
              subValue={`${sales.length} sales`}
            />
            <StatCard
              label="Total P&L"
              value={portfolioStats.totalPL}
              icon={Activity}
              iconColor={portfolioStats.totalPL >= 0 ? "text-emerald-400" : "text-red-400"}
              iconBg={portfolioStats.totalPL >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"}
              isPositive={portfolioStats.totalPL >= 0}
              showSign
              delay={0.2}
            />
            <StatCard
              label="Overall ROI"
              value={portfolioStats.roiPercent}
              prefix=""
              suffix="%"
              icon={Percent}
              iconColor={portfolioStats.roiPercent >= 0 ? "text-emerald-400" : "text-red-400"}
              iconBg={portfolioStats.roiPercent >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"}
              isPositive={portfolioStats.roiPercent >= 0}
              showSign
              delay={0.25}
            />
          </div>

          {/* ================================ */}
          {/* Performance Chart Section */}
          {/* ================================ */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/15">
                  <Activity className="h-4 w-4 text-teal-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Portfolio Performance</h2>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Cost Basis Toggle */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCostBasis(!showCostBasis)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                    showCostBasis
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:text-white"
                  )}
                >
                  Cost Basis Line
                </motion.button>
                
                {/* Time Range Selector */}
                <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
              </div>
            </div>

            <PerformanceChart
              data={portfolioHistory}
              loading={historyLoading}
              isPositive={portfolioStats.unrealizedPL >= 0}
              showCostBasis={showCostBasis}
              costBasisData={costBasisHistory}
            />
          </div>

          {/* ================================ */}
          {/* Allocation Breakdown Section */}
          {/* ================================ */}
          <GlassCard className="p-5 mb-6" delay={0.25}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15">
                  <PieChartIcon className="h-4 w-4 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Allocation Breakdown</h2>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-zinc-800/50 rounded-lg">
                {allocationViews.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setAllocationView(value)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      allocationView === value
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <AllocationChart
              items={unsoldItems}
              view={allocationView}
              onSegmentClick={(segment) => {
                // Could navigate to inventory filtered by segment
                console.log('Clicked segment:', segment);
              }}
            />
          </GlassCard>

          {/* ================================ */}
          {/* Top & Worst Performers */}
          {/* ================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <PerformersTable
              title="Top Performers"
              icon={Trophy}
              iconColor="text-emerald-400"
              data={topPerformers}
              isGainers
            />
            <PerformersTable
              title="Worst Performers"
              icon={AlertTriangle}
              iconColor="text-red-400"
              data={worstPerformers}
              isGainers={false}
            />
          </div>

          {/* ================================ */}
          {/* Statistics Cards */}
          {/* ================================ */}
          <StatsGrid
            avgValue={statistics.avgValue}
            avgROI={statistics.avgROI}
            winRate={statistics.winRate}
            bestGain={statistics.bestGain}
            worstLoss={statistics.worstLoss}
          />

          {/* Empty State */}
          {unsoldItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center"
              >
                <span className="text-5xl">📊</span>
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">
                No Data Yet
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
                Add cards to your inventory to see detailed analytics and performance metrics.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.href = '/scan'}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25"
              >
                Scan Your First Card
              </motion.button>
            </motion.div>
          )}

          {/* Bottom padding for mobile nav */}
          <div className="h-4 md:h-0" />
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default Analytics;
