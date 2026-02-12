import { memo } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

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
}: StatsCardProps) => {
  const isPositive = change && change >= 0;
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.08,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`
        relative overflow-hidden
        bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-900/50 
        backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4
        transition-shadow duration-300 hover:shadow-lg
        ${className}
      `}
      style={{ 
        boxShadow: glowColor ? `0 0 30px ${glowColor}` : undefined 
      }}
    >
      {/* Subtle gradient overlay */}
      {glowColor && (
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)` 
          }}
        />
      )}

      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
            {label}
          </span>
          {Icon && (
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
          )}
        </div>

        {/* Value */}
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white tracking-tight"
        >
          {prefix}{formattedValue}{suffix}
        </motion.p>

        {/* Change indicator */}
        {change !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <span className={`
              text-sm font-medium
              ${isPositive ? 'text-emerald-400' : 'text-red-400'}
            `}>
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </span>
            {changeLabel && (
              <span className="text-xs text-zinc-500">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

StatsCard.displayName = "StatsCard";

export default StatsCard;
