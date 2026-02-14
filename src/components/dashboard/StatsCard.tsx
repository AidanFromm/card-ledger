import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { CountUp } from "./AnimatedNumber";

interface StatsCardProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  className?: string;
  index?: number;
  glowColor?: string;
  compact?: boolean;
  onClick?: () => void;
}

export const StatsCard = memo(({
  label,
  value,
  prefix = "",
  suffix = "",
  change,
  changeLabel,
  icon: Icon,
  iconColor = "text-zinc-400",
  iconBg = "bg-zinc-800/50",
  className = "",
  index = 0,
  glowColor,
  compact = false,
  onClick,
}: StatsCardProps) => {
  const isPositive = change !== undefined && change >= 0;
  const isNumeric = typeof value === 'number';
  
  const formattedValue = useMemo(() => {
    if (!isNumeric) return value;
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }, [value, isNumeric]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.06,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden group
        bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-900/60 
        backdrop-blur-xl border border-zinc-800/50 rounded-2xl
        transition-all duration-300 hover:border-zinc-700/70
        ${compact ? 'p-3' : 'p-4'}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{ 
        boxShadow: glowColor 
          ? `0 0 40px ${glowColor}, inset 0 1px 0 0 rgba(255,255,255,0.05)` 
          : 'inset 0 1px 0 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Background gradient overlay */}
      {glowColor && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: `radial-gradient(ellipse at top right, ${glowColor}, transparent 60%)` 
          }}
        />
      )}

      {/* Hover shine effect */}
      <motion.div
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '200%', opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
      />

      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-zinc-400 tracking-wider uppercase">
            {label}
          </span>
          {Icon && (
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-9 h-9 rounded-xl ${iconBg} border border-zinc-700/30 flex items-center justify-center shadow-lg`}
            >
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </motion.div>
          )}
        </div>

        {/* Value with animation */}
        <motion.div
          key={String(value)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-bold text-white tracking-tight tabular-nums ${compact ? 'text-xl' : 'text-2xl'}`}
        >
          {isNumeric ? (
            <CountUp 
              value={value as number} 
              prefix={prefix} 
              suffix={suffix}
              decimals={2}
              duration={1.2}
            />
          ) : (
            <span>{prefix}{formattedValue}{suffix}</span>
          )}
        </motion.div>

        {/* Change indicator */}
        {change !== undefined && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 + 0.3 }}
            className="flex items-center gap-2 mt-2"
          >
            <div className={`
              flex items-center gap-1 px-2 py-0.5 rounded-lg
              ${isPositive ? 'bg-navy-500/15' : 'bg-red-500/15'}
            `}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-navy-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`
                text-sm font-semibold
                ${isPositive ? 'text-navy-400' : 'text-red-400'}
              `}>
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
            {changeLabel && (
              <span className="text-[10px] text-zinc-500">{changeLabel}</span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

StatsCard.displayName = "StatsCard";

// Compact mini stat for rows
interface MiniStatProps {
  label: string;
  value: string | number;
  prefix?: string;
  change?: number;
  className?: string;
}

export const MiniStat = memo(({
  label,
  value,
  prefix = "",
  change,
  className = "",
}: MiniStatProps) => {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold text-white tabular-nums">
          {prefix}{typeof value === 'number' 
            ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : value
          }
        </span>
        {change !== undefined && (
          <span className={`text-xs font-semibold ${isPositive ? 'text-navy-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
});

MiniStat.displayName = "MiniStat";

// Best performer card with thumbnail
interface BestPerformerCardProps {
  name: string;
  imageUrl?: string | null;
  value: number;
  change: number;
  changePercent: number;
  index?: number;
  className?: string;
  onClick?: () => void;
}

export const BestPerformerCard = memo(({
  name,
  imageUrl,
  value,
  change,
  changePercent,
  index = 0,
  className = "",
  onClick,
}: BestPerformerCardProps) => {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.06,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden group cursor-pointer
        bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-900/60 
        backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4
        transition-all duration-300 hover:border-navy-400/40
        ${className}
      `}
      style={{ 
        boxShadow: isPositive 
          ? '0 0 30px rgba(16, 185, 129, 0.1), inset 0 1px 0 0 rgba(255,255,255,0.05)' 
          : 'inset 0 1px 0 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ 
          background: `radial-gradient(ellipse at top right, ${isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}, transparent 70%)` 
        }}
      />

      <div className="relative z-10 flex items-center gap-3">
        {/* Card thumbnail */}
        <div className="w-14 h-20 rounded-lg overflow-hidden bg-zinc-800/50 border border-zinc-700/50 flex-shrink-0">
          {imageUrl ? (
            <motion.img 
              src={imageUrl}
              alt={name}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide flex items-center gap-1">
            🔥 Best Performer
          </span>
          <p className="text-sm font-semibold text-white truncate mt-0.5">{name}</p>
          
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-lg font-bold text-white tabular-nums">
              ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`
              flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold
              ${isPositive ? 'bg-navy-500/20 text-navy-400' : 'bg-red-500/20 text-red-400'}
            `}>
              {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

BestPerformerCard.displayName = "BestPerformerCard";

export default StatsCard;
