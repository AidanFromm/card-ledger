import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PriceChangeProps {
  value: number; // Dollar amount change
  percent?: number; // Percentage change
  showIcon?: boolean;
  showValue?: boolean;
  showPercent?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

export function PriceChange({
  value,
  percent,
  showIcon = true,
  showValue = true,
  showPercent = true,
  size = "md",
  className = "",
  animate = true,
}: PriceChangeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const colorClass = isPositive
    ? "text-gain"
    : isNegative
    ? "text-loss"
    : "text-muted-foreground";

  const bgClass = isPositive
    ? "bg-gain/10"
    : isNegative
    ? "bg-loss/10"
    : "bg-muted/50";

  const sizeClasses = {
    sm: "text-xs gap-0.5",
    md: "text-sm gap-1",
    lg: "text-base gap-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const content = (
    <>
      {showIcon && <Icon className={iconSizes[size]} />}
      {showValue && (
        <span>
          {isPositive ? "+" : ""}${Math.abs(value).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      )}
      {showPercent && percent !== undefined && (
        <span className="opacity-80">
          ({isPositive ? "+" : ""}{percent.toFixed(2)}%)
        </span>
      )}
    </>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "inline-flex items-center font-medium",
          sizeClasses[size],
          colorClass,
          className
        )}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center font-medium",
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {content}
    </div>
  );
}

// Badge variant for use in cards
interface PriceChangeBadgeProps {
  value: number;
  percent?: number;
  size?: "sm" | "md";
  className?: string;
}

export function PriceChangeBadge({
  value,
  percent,
  size = "sm",
  className = "",
}: PriceChangeBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const colorClass = isPositive
    ? "text-gain bg-gain/10"
    : isNegative
    ? "text-loss bg-loss/10"
    : "text-muted-foreground bg-muted/50";

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const displayValue = percent !== undefined ? percent : value;
  const isPercent = percent !== undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium",
        size === "sm" ? "text-[10px]" : "text-xs",
        colorClass,
        className
      )}
    >
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      <span>
        {isPositive ? "+" : ""}{isPercent 
          ? `${displayValue.toFixed(1)}%`
          : `$${Math.abs(displayValue).toFixed(2)}`
        }
      </span>
    </span>
  );
}

// Inline text variant
export function PriceChangeInline({
  value,
  percent,
  className = "",
}: {
  value: number;
  percent?: number;
  className?: string;
}) {
  const isPositive = value >= 0;
  const colorClass = isPositive ? "text-gain" : "text-loss";

  return (
    <span className={cn("font-medium", colorClass, className)}>
      {isPositive ? "↑" : "↓"} {isPositive ? "+" : ""}
      {percent !== undefined
        ? `${percent.toFixed(2)}%`
        : `$${Math.abs(value).toFixed(2)}`}
    </span>
  );
}
