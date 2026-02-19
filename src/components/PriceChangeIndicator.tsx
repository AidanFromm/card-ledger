import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceChangeIndicatorProps {
  /** Price change percentage (e.g., 5.5 for +5.5%) */
  changePercent?: number | null;
  /** Price change in dollars */
  changeDollars?: number | null;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show dollar amount */
  showDollars?: boolean;
  /** Show percent */
  showPercent?: boolean;
  /** Compact mode - just icon and number */
  compact?: boolean;
  /** Animate on mount */
  animate?: boolean;
  /** Custom className */
  className?: string;
}

const sizeClasses = {
  xs: {
    container: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    icon: 'h-2.5 w-2.5',
  },
  sm: {
    container: 'px-2 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    container: 'px-3 py-1.5 text-base gap-2',
    icon: 'h-5 w-5',
  },
};

export const PriceChangeIndicator = memo(({
  changePercent,
  changeDollars,
  size = 'sm',
  showDollars = false,
  showPercent = true,
  compact = false,
  animate = true,
  className,
}: PriceChangeIndicatorProps) => {
  // Determine if we have valid data
  const hasPercentData = changePercent !== undefined && changePercent !== null && !isNaN(changePercent);
  const hasDollarData = changeDollars !== undefined && changeDollars !== null && !isNaN(changeDollars);
  
  if (!hasPercentData && !hasDollarData) {
    return null;
  }
  
  // Calculate state based on change
  const change = hasPercentData ? changePercent : (changeDollars || 0);
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = Math.abs(change) < 0.01;
  
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  
  const colorClasses = isNeutral 
    ? 'text-zinc-400 bg-zinc-400/10'
    : isPositive 
      ? 'text-emerald-500 bg-emerald-500/10'
      : 'text-red-500 bg-red-500/10';
  
  const { container, icon } = sizeClasses[size];
  
  const formatPercent = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    
    if (absValue >= 100) {
      return `${sign}${absValue.toFixed(0)}%`;
    }
    if (absValue >= 10) {
      return `${sign}${absValue.toFixed(1)}%`;
    }
    return `${sign}${absValue.toFixed(2)}%`;
  };
  
  const formatDollars = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value > 0 ? '+$' : value < 0 ? '-$' : '$';
    
    if (absValue >= 1000) {
      return `${sign}${(absValue / 1000).toFixed(1)}k`;
    }
    if (absValue >= 100) {
      return `${sign}${absValue.toFixed(0)}`;
    }
    return `${sign}${absValue.toFixed(2)}`;
  };
  
  const Wrapper = animate ? motion.span : 'span';
  const wrapperProps = animate ? {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring', stiffness: 500, damping: 30 }
  } : {};
  
  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        colorClasses,
        container,
        className
      )}
    >
      <Icon className={icon} />
      {!compact && (
        <>
          {showDollars && hasDollarData && (
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatDollars(changeDollars!)}
            </span>
          )}
          {showPercent && hasPercentData && (
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatPercent(changePercent!)}
            </span>
          )}
        </>
      )}
      {compact && hasPercentData && (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {changePercent! > 0 ? '+' : ''}{changePercent!.toFixed(1)}%
        </span>
      )}
    </Wrapper>
  );
});

PriceChangeIndicator.displayName = 'PriceChangeIndicator';

/**
 * Inline price change text (no background)
 */
interface PriceChangeTextProps {
  changePercent?: number | null;
  changeDollars?: number | null;
  showDollars?: boolean;
  showPercent?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const PriceChangeText = memo(({
  changePercent,
  changeDollars,
  showDollars = true,
  showPercent = true,
  size = 'sm',
  className,
}: PriceChangeTextProps) => {
  const hasPercentData = changePercent !== undefined && changePercent !== null && !isNaN(changePercent);
  const hasDollarData = changeDollars !== undefined && changeDollars !== null && !isNaN(changeDollars);
  
  if (!hasPercentData && !hasDollarData) {
    return null;
  }
  
  const change = hasPercentData ? changePercent : (changeDollars || 0);
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  const colorClass = isPositive 
    ? 'text-emerald-500' 
    : isNegative 
      ? 'text-red-500' 
      : 'text-zinc-400';
  
  const formatValue = () => {
    const parts: string[] = [];
    
    if (showDollars && hasDollarData) {
      const absValue = Math.abs(changeDollars!);
      const sign = changeDollars! >= 0 ? '+$' : '-$';
      parts.push(`${sign}${absValue.toFixed(2)}`);
    }
    
    if (showPercent && hasPercentData) {
      const sign = changePercent! >= 0 ? '+' : '';
      parts.push(`(${sign}${changePercent!.toFixed(1)}%)`);
    }
    
    return parts.join(' ');
  };
  
  return (
    <span 
      className={cn(
        'font-semibold',
        textSizes[size],
        colorClass,
        className
      )}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {formatValue()}
    </span>
  );
});

PriceChangeText.displayName = 'PriceChangeText';

export default PriceChangeIndicator;
