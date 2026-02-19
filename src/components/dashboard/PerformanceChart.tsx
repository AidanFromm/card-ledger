import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { PortfolioDataPoint, TimeRange } from "@/hooks/usePortfolioHistory";

interface PerformanceChartProps {
  data: PortfolioDataPoint[];
  timeRange: TimeRange;
  isPositive: boolean;
  loading?: boolean;
  onHover?: (value: number | null) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: PortfolioDataPoint }>;
  label?: string;
  timeRange: TimeRange;
}

const CustomTooltip = ({ active, payload, timeRange }: CustomTooltipProps) => {
  if (!active || !payload?.[0]) return null;
  
  const data = payload[0].payload;
  const value = payload[0].value;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '1D') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: timeRange === 'ALL' || timeRange === '1Y' ? 'numeric' : undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl px-4 py-3 shadow-2xl"
    >
      <p className="text-xs text-zinc-400 mb-1">{formatDate(data.date)}</p>
      <p className="text-lg font-bold text-white">
        ${value.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}
      </p>
    </motion.div>
  );
};

const ChartSkeleton = () => (
  <div className="h-[280px] w-full flex items-center justify-center">
    <div className="w-full h-full relative overflow-hidden">
      {/* Animated skeleton bars */}
      <div className="absolute inset-0 flex items-end justify-around gap-1 px-4 pb-8">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: "20%" }}
            animate={{ 
              height: `${30 + Math.sin(i * 0.5) * 20 + Math.random() * 20}%` 
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.05,
            }}
            className="w-full bg-zinc-800/50 rounded-t-lg"
          />
        ))}
      </div>
      {/* Shimmer overlay */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent"
      />
    </div>
  </div>
);

export const PerformanceChart = memo(({ 
  data, 
  timeRange, 
  isPositive,
  loading = false,
  onHover,
}: PerformanceChartProps) => {
  const [isHovering, setIsHovering] = useState(false);
  
  const chartColor = isPositive ? "#627d98" : "#ef4444";
  const gradientId = `chartGradient-${isPositive ? 'positive' : 'negative'}-${timeRange}`;

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '1D') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric' });
    }
    if (timeRange === '1W' || timeRange === '1M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Calculate domain with padding
  const { minValue, maxValue, startValue } = useMemo(() => {
    if (data.length === 0) return { minValue: 0, maxValue: 100, startValue: 50 };
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.15 || max * 0.1;
    return { 
      minValue: Math.max(0, min - padding), 
      maxValue: max + padding,
      startValue: data[0]?.value || 0,
    };
  }, [data]);

  if (loading) {
    return <ChartSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">Add items to see your chart</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={timeRange}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="h-[280px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data} 
            margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
            onMouseMove={(e) => {
              if (e?.activePayload?.[0]?.value) {
                setIsHovering(true);
                onHover?.(e.activePayload[0].value);
              }
            }}
            onMouseLeave={() => {
              setIsHovering(false);
              onHover?.(null);
            }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="50%" stopColor={chartColor} stopOpacity={0.1} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: 'rgb(113, 113, 122)',
                fontWeight: 500
              }}
              interval="preserveStartEnd"
              minTickGap={60}
              dy={10}
            />
            
            <YAxis
              domain={[minValue, maxValue]}
              hide
            />

            {/* Reference line at start value */}
            {data.length > 1 && (
              <ReferenceLine 
                y={startValue} 
                stroke="rgb(63, 63, 70)" 
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            
            <Tooltip
              content={<CustomTooltip timeRange={timeRange} />}
              cursor={{ 
                stroke: chartColor, 
                strokeWidth: 1.5, 
                strokeDasharray: '4 4',
                strokeOpacity: 0.5
              }}
              isAnimationActive={false}
            />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={isHovering ? 2.5 : 2}
              fill={`url(#${gradientId})`}
              animationDuration={800}
              animationEasing="ease-out"
              dot={false}
              activeDot={{
                r: 6,
                fill: chartColor,
                stroke: 'rgb(24, 24, 27)',
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  );
});

PerformanceChart.displayName = "PerformanceChart";

export default PerformanceChart;
