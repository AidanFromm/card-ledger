import { memo, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles, Eye, EyeOff } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { CountUp } from "./AnimatedNumber";

interface PortfolioHeroProps {
  totalValue: number;
  periodChange: number;
  periodChangePercent: number;
  todayChange?: number;
  todayChangePercent?: number;
  hasTodayData?: boolean;
  sparklineData?: Array<{ value: number; date?: string }>;
  isPositive: boolean;
  timeRangeLabel?: string;
}

export const PortfolioHero = memo(({
  totalValue,
  periodChange,
  periodChangePercent,
  todayChange = 0,
  todayChangePercent = 0,
  hasTodayData = false,
  sparklineData = [],
  isPositive,
  timeRangeLabel = "All Time",
}: PortfolioHeroProps) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [isValueHidden, setIsValueHidden] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const displayValue = hoveredValue ?? totalValue;
  const isPeriodPositive = periodChange >= 0;
  const isTodayPositive = todayChange >= 0;
  const chartColor = isPositive ? "#627d98" : "#ef4444";
  const glowColor = isPositive ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)";

  // Gradient ID for this instance
  const gradientId = useMemo(() => `heroGradient-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate min/max for proper chart scaling
  const chartDomain = useMemo(() => {
    if (sparklineData.length < 2) return [0, 100];
    const values = sparklineData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [sparklineData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative"
    >
      {/* Background glow effects */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute -top-20 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none bg-navy-500/10"
      />

      {/* Portfolio Label with hide toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </motion.div>
          <span className="text-sm font-medium text-zinc-400 tracking-wide uppercase">
            Portfolio Value
          </span>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsValueHidden(!isValueHidden)}
          className="p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
        >
          {isValueHidden ? (
            <EyeOff className="w-4 h-4 text-zinc-500" />
          ) : (
            <Eye className="w-4 h-4 text-zinc-500" />
          )}
        </motion.button>
      </motion.div>

      {/* MASSIVE Animated Portfolio Value */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          delay: 0.15, 
          type: "spring", 
          stiffness: 100,
          damping: 15 
        }}
        className="relative mb-1"
      >
        <AnimatePresence mode="wait">
          {isValueHidden ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-[56px] sm:text-[64px] md:text-[72px] font-bold tracking-tight leading-none text-white"
            >
              $••••••
            </motion.div>
          ) : (
            <motion.h1
              key="visible"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-[56px] sm:text-[64px] md:text-[72px] font-bold tracking-tight leading-none text-white tabular-nums"
            >
              <CountUp 
                value={displayValue} 
                prefix="$" 
                decimals={2}
                duration={2}
              />
            </motion.h1>
          )}
        </AnimatePresence>
        
        {/* Subtle shine effect */}
        {!isValueHidden && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ 
              duration: 2, 
              delay: 1,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 8
            }}
            className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
          />
        )}
      </motion.div>

      {/* Hovered date indicator */}
      <AnimatePresence>
        {hoveredDate && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-zinc-500 mb-2"
          >
            {hoveredDate}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Period Change with animation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${periodChange}-${periodChangePercent}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 flex-wrap"
          >
            {/* Change pill with gradient border */}
            <div className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-full overflow-hidden
              ${isPeriodPositive 
                ? 'bg-navy-500/10' 
                : 'bg-red-500/10'
              }
            `}>
              {/* Animated border gradient */}
              <div className={`
                absolute inset-0 rounded-full
                ${isPeriodPositive 
                  ? 'bg-gradient-to-r from-navy-500/30 via-navy-400/20 to-navy-500/30' 
                  : 'bg-gradient-to-r from-red-500/30 via-red-400/20 to-red-500/30'
                }
              `} style={{ padding: '1px' }}>
                <div className="w-full h-full rounded-full bg-[#0a0a0a]" />
              </div>
              
              <div className="relative z-10 flex items-center gap-1.5">
                {isPeriodPositive ? (
                  <TrendingUp className="h-4 w-4 text-navy-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-sm font-bold ${isPeriodPositive ? 'text-navy-400' : 'text-red-400'}`}>
                  {isPeriodPositive ? '+' : ''}{periodChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            
            {/* Dollar change */}
            <span className={`text-base font-semibold ${isPeriodPositive ? 'text-navy-400' : 'text-red-400'}`}>
              {isPeriodPositive ? '+' : '-'}$
              {Math.abs(periodChange).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
            
            {/* Time range badge */}
            <span className="text-xs font-medium text-zinc-500 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700/50">
              {timeRangeLabel}
            </span>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Today's Change */}
      {hasTodayData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-2 mt-3"
        >
          <span className="text-xs text-zinc-500 font-medium">Today:</span>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${
            isTodayPositive ? 'bg-navy-500/10' : 'bg-red-500/10'
          }`}>
            <span className={`text-sm font-semibold ${isTodayPositive ? 'text-navy-400' : 'text-red-400'}`}>
              {isTodayPositive ? '+' : '-'}$
              {Math.abs(todayChange).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
            <span className={`text-xs ${isTodayPositive ? 'text-navy-400/70' : 'text-red-400/70'}`}>
              ({isTodayPositive ? '+' : ''}{todayChangePercent.toFixed(2)}%)
            </span>
          </div>
        </motion.div>
      )}

      {/* Interactive Sparkline Chart */}
      {sparklineData.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 h-[100px] -mx-2 relative"
        >
          {/* Chart glow */}
          <div 
            className="absolute inset-x-0 bottom-0 h-1/2 blur-2xl pointer-events-none opacity-50"
            style={{ 
              background: `linear-gradient(to top, ${chartColor}20, transparent)` 
            }}
          />

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={sparklineData}
              onMouseMove={(e) => {
                if (e?.activePayload?.[0]) {
                  const payload = e.activePayload[0].payload;
                  setHoveredValue(payload.value);
                  setHoveredDate(payload.date || null);
                }
              }}
              onMouseLeave={() => {
                setHoveredValue(null);
                setHoveredDate(null);
              }}
              margin={{ top: 10, right: 10, bottom: 0, left: 10 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="50%" stopColor={chartColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
                <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Tooltip 
                content={() => null}
                cursor={{ 
                  stroke: chartColor, 
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                  opacity: 0.6
                }} 
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                animationDuration={1500}
                animationEasing="ease-out"
                filter="url(#chartGlow)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: chartColor,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Live pulse indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-4 right-4 flex items-center gap-2"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: chartColor }}
            />
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">Live</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
});

PortfolioHero.displayName = "PortfolioHero";

export default PortfolioHero;
