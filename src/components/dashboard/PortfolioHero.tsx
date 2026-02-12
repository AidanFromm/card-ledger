import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { AnimatedNumber } from "./AnimatedNumber";

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
  const [hasAnimated, setHasAnimated] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  
  const displayValue = hoveredValue ?? totalValue;
  const changeColor = periodChange >= 0 ? "text-emerald-400" : "text-red-400";
  const todayColor = todayChange >= 0 ? "text-emerald-400" : "text-red-400";
  const chartColor = isPositive ? "#10b981" : "#ef4444";
  const glowColor = isPositive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden"
    >
      {/* Glow effect behind the value */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />

      {/* Portfolio Label */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 mb-2"
      >
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-zinc-400 tracking-wide uppercase">
          Portfolio Value
        </span>
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
        className="relative"
      >
        <h1 className="text-[56px] sm:text-[64px] md:text-[72px] font-bold tracking-tight leading-none text-white">
          <AnimatedNumber 
            value={displayValue} 
            prefix="$" 
            decimals={2}
            duration={1.5}
          />
        </h1>
        
        {/* Subtle shine effect */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ 
            duration: 2, 
            delay: 0.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 5
          }}
          className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        />
      </motion.div>

      {/* Period Change with animation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-3 mt-3 flex-wrap"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${periodChange}-${periodChangePercent}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            {/* Change pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
              periodChange >= 0 
                ? 'bg-emerald-500/15 border border-emerald-500/30' 
                : 'bg-red-500/15 border border-red-500/30'
            }`}>
              {periodChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-semibold ${changeColor}`}>
                {periodChange >= 0 ? '+' : ''}
                {periodChangePercent.toFixed(2)}%
              </span>
            </div>
            
            {/* Dollar change */}
            <span className={`text-base font-medium ${changeColor}`}>
              {periodChange >= 0 ? '+' : '-'}$
              {Math.abs(periodChange).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
            
            {/* Time range badge */}
            <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
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
          className="flex items-center gap-2 mt-2"
        >
          <span className="text-xs text-zinc-500">Today:</span>
          <span className={`text-sm font-medium ${todayColor}`}>
            {todayChange >= 0 ? '+' : '-'}$
            {Math.abs(todayChange).toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
            {' '}
            ({todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}%)
          </span>
        </motion.div>
      )}

      {/* Mini Sparkline Chart */}
      {sparklineData.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 h-[80px] -mx-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={sparklineData}
              onMouseMove={(e) => {
                if (e?.activePayload?.[0]?.value) {
                  setHoveredValue(e.activePayload[0].value);
                }
              }}
              onMouseLeave={() => setHoveredValue(null)}
            >
              <defs>
                <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip 
                content={() => null}
                cursor={{ 
                  stroke: chartColor, 
                  strokeWidth: 1,
                  strokeDasharray: "4 4"
                }} 
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#heroGradient)"
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  );
});

PortfolioHero.displayName = "PortfolioHero";

export default PortfolioHero;
