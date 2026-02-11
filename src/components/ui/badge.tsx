import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Robinhood-style gain/loss variants
        gain: "border-transparent bg-gain/15 text-gain hover:bg-gain/25",
        loss: "border-transparent bg-loss/15 text-loss hover:bg-loss/25",
        "gain-solid": "border-transparent bg-gain text-gain-foreground hover:bg-gain/90",
        "loss-solid": "border-transparent bg-loss text-loss-foreground hover:bg-loss/90",
        "gain-outline": "border-gain text-gain bg-transparent hover:bg-gain/10",
        "loss-outline": "border-loss text-loss bg-transparent hover:bg-loss/10",
        // Success/Warning aliases for compatibility
        success: "border-transparent bg-success/15 text-success hover:bg-success/25",
        warning: "border-transparent bg-warning/15 text-warning hover:bg-warning/25",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Icon to display before the badge text
   */
  icon?: React.ReactNode;
  /**
   * Whether to use tabular numbers (for numeric badges)
   */
  tabular?: boolean;
}

function Badge({ className, variant, size, icon, tabular, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant, size }),
        tabular && "tabular-nums",
        className
      )}
      {...props}
    >
      {icon && <span className="mr-1 -ml-0.5">{icon}</span>}
      {children}
    </div>
  );
}

// Pre-built P&L badge that auto-colors based on value
interface PnLBadgeProps extends Omit<BadgeProps, "variant"> {
  value: number;
  prefix?: string;
  suffix?: string;
  showSign?: boolean;
  solid?: boolean;
}

function PnLBadge({
  value,
  prefix = "",
  suffix = "",
  showSign = true,
  solid = false,
  className,
  ...props
}: PnLBadgeProps) {
  const isPositive = value >= 0;
  const variant = solid
    ? isPositive
      ? "gain-solid"
      : "loss-solid"
    : isPositive
    ? "gain"
    : "loss";

  const sign = showSign ? (isPositive ? "+" : "") : "";
  const formattedValue = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Badge variant={variant} tabular className={className} {...props}>
      {prefix}
      {sign}
      {isPositive ? "" : "-"}
      {formattedValue}
      {suffix}
    </Badge>
  );
}

// Percentage change badge
interface PercentBadgeProps extends Omit<BadgeProps, "variant"> {
  value: number;
  solid?: boolean;
}

function PercentBadge({ value, solid = false, className, ...props }: PercentBadgeProps) {
  return (
    <PnLBadge
      value={value}
      suffix="%"
      solid={solid}
      className={className}
      {...props}
    />
  );
}

// Trend indicator with arrow
interface TrendBadgeProps extends Omit<BadgeProps, "variant" | "icon"> {
  value: number;
  showValue?: boolean;
  solid?: boolean;
}

function TrendBadge({
  value,
  showValue = true,
  solid = false,
  className,
  ...props
}: TrendBadgeProps) {
  const isPositive = value >= 0;
  const variant = solid
    ? isPositive
      ? "gain-solid"
      : "loss-solid"
    : isPositive
    ? "gain"
    : "loss";

  const Arrow = isPositive ? (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  const formattedValue = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Badge variant={variant} icon={Arrow} tabular className={className} {...props}>
      {showValue && `${formattedValue}%`}
    </Badge>
  );
}

export { Badge, badgeVariants, PnLBadge, PercentBadge, TrendBadge };
