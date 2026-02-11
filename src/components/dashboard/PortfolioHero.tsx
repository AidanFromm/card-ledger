import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface PortfolioHeroProps {
  totalValue: number;
  periodChange: number;
  periodChangePercent: number;
  todayChange?: number;
  todayChangePercent?: number;
  hasTodayData?: boolean;
  sparklineData?: Array<{ value: number }>;
  isPositive: boolean;
}

const AnimatedNumber = memo(({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const formatted = value.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  return (
    <motion.span
      key={formatted}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {prefix}{formatted}{suffix}
    </motion.span>
  );
});

AnimatedNumber.displayName = "AnimatedNumber";

export const PortfolioHero = memo(({
  totalValue,
  periodChange,
  periodChangePercent,
  todayChange = 0,
  todayChangePercent = 0,
  hasTodayData = false,
  sparklineData = [],
  isPositive,
}: PortfolioHeroProps) => {
  const changeColor = periodChange >= 0 ? "text-emerald-500" : "text-red-500";
  const todayColor = todayChange >= 0 ? "text-emerald-500" : "text-red-500";
  const chartColor = isPositive ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Portfolio Label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm font-medium text-muted-foreground mb-1"
      >
        Investing
      </motion.p>

      {/* MASSIVE Portfolio Value */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 150 }}
        className="text-[48px] md:text-[56px] font-bold tracking-tight leading-none mb-2"
      >
        <AnimatedNumber value={totalValue} prefix="$" />
      </motion.h1>

      {/* Period Change */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={`${periodChange}-${periodChangePercent}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`text-lg font-semibold ${changeColor}`}
          >
            {periodChange >= 0 ? '+' : '-'}$
            {Math.abs(periodChange).toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
            {' '}
            ({periodChangePercent >= 0 ? '+' : ''}{periodChangePercent.toFixed(2)}%)
          </motion.span>
        </AnimatePresence>
        
        {periodChange >= 0 ? (
          <TrendingUp className="h-5 w-5 text-emerald-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-500" />
        )}

        {/* Sparkline Preview */}
        {sparklineData.length > 2 && (
          <div className="w-16 h-6 ml-2 opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={1.5}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Today's Change (if available) */}
      {hasTodayData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 mt-1"
        >
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={`text-sm font-medium ${todayColor}`}>
            {todayChange >= 0 ? '+' : '-'}$
            {Math.abs(todayChange).toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
            {' '}
            ({todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}%) today
          </span>
        </motion.div>
      )}
    </motion.div>
  );
});

PortfolioHero.displayName = "PortfolioHero";

export default PortfolioHero;
