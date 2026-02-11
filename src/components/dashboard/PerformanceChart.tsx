import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { PortfolioDataPoint } from "@/hooks/usePortfolioHistory";
import type { TimeRange } from "@/hooks/usePortfolioHistory";

interface PerformanceChartProps {
  data: PortfolioDataPoint[];
  timeRange: TimeRange;
  isPositive: boolean;
  loading?: boolean;
}

export const PerformanceChart = memo(({ 
  data, 
  timeRange, 
  isPositive,
  loading = false 
}: PerformanceChartProps) => {
  const chartColor = isPositive ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)";
  const gradientId = `chartGradient-${isPositive ? 'positive' : 'negative'}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '1D') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (timeRange === '1W' || timeRange === '1M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const formatCurrency = (value: number) => {
    return '$' + value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Calculate Y-axis domain with some padding
  const { minValue, maxValue } = useMemo(() => {
    if (data.length === 0) return { minValue: 0, maxValue: 100 };
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || max * 0.1;
    return { 
      minValue: Math.max(0, min - padding), 
      maxValue: max + padding 
    };
  }, [data]);

  if (loading) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-32 w-full max-w-xs bg-muted/30 rounded-lg" />
          <div className="h-4 w-24 bg-muted/20 rounded" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Add items to see chart</p>
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
        transition={{ duration: 0.2 }}
        className="h-[200px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data} 
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            
            <YAxis
              domain={[minValue, maxValue]}
              hide
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                fontSize: '13px',
                padding: '10px 14px',
              }}
              labelFormatter={formatDate}
              formatter={(value: number) => [formatCurrency(value), 'Value']}
              cursor={{ 
                stroke: chartColor, 
                strokeWidth: 1, 
                strokeDasharray: '4 4' 
              }}
            />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  );
});

PerformanceChart.displayName = "PerformanceChart";

export default PerformanceChart;
