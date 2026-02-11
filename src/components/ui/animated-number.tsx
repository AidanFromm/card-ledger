import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  /**
   * Number of decimal places to display
   * @default 2
   */
  decimals?: number;
  /**
   * Duration of the animation in milliseconds
   * @default 500
   */
  duration?: number;
  /**
   * Format the number with commas
   * @default true
   */
  formatWithCommas?: boolean;
  /**
   * Prefix to display before the number (e.g., "$")
   */
  prefix?: string;
  /**
   * Suffix to display after the number (e.g., "%")
   */
  suffix?: string;
  /**
   * Whether to show color based on value (green for positive, red for negative)
   * @default false
   */
  colorize?: boolean;
  /**
   * Whether to show + sign for positive numbers
   * @default false
   */
  showSign?: boolean;
  /**
   * Custom easing function
   */
  easing?: (t: number) => number;
}

// Easing functions
const easings = {
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  linear: (t: number) => t,
};

const AnimatedNumber = React.forwardRef<HTMLSpanElement, AnimatedNumberProps>(
  (
    {
      className,
      value,
      decimals = 2,
      duration = 500,
      formatWithCommas = true,
      prefix = "",
      suffix = "",
      colorize = false,
      showSign = false,
      easing = easings.easeOut,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState(value);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const previousValue = React.useRef(value);
    const animationRef = React.useRef<number>();
    const startTimeRef = React.useRef<number>();

    React.useEffect(() => {
      if (previousValue.current === value) return;

      const startValue = previousValue.current;
      const endValue = value;
      const diff = endValue - startValue;

      setIsAnimating(true);

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        const currentValue = startValue + diff * easedProgress;
        setDisplayValue(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          setIsAnimating(false);
          previousValue.current = endValue;
          startTimeRef.current = undefined;
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [value, duration, easing]);

    // Format the number
    const formatNumber = (num: number): string => {
      const fixed = num.toFixed(decimals);
      if (formatWithCommas) {
        const parts = fixed.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
      }
      return fixed;
    };

    const formattedValue = formatNumber(displayValue);
    const sign = showSign && displayValue > 0 ? "+" : "";

    // Determine color class
    const colorClass = colorize
      ? displayValue > 0
        ? "text-gain"
        : displayValue < 0
        ? "text-loss-red"
        : ""
      : "";

    return (
      <span
        ref={ref}
        className={cn(
          "tabular-nums transition-colors",
          colorClass,
          isAnimating && "transition-none",
          className
        )}
        {...props}
      >
        {prefix}
        {sign}
        {formattedValue}
        {suffix}
      </span>
    );
  }
);

AnimatedNumber.displayName = "AnimatedNumber";

// Simple counter that animates from 0 to target
interface CountUpProps extends Omit<AnimatedNumberProps, "value"> {
  end: number;
  start?: number;
  delay?: number;
}

const CountUp = React.forwardRef<HTMLSpanElement, CountUpProps>(
  ({ end, start = 0, delay = 0, duration = 1000, ...props }, ref) => {
    const [value, setValue] = React.useState(start);
    const [hasStarted, setHasStarted] = React.useState(false);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setHasStarted(true);
        setValue(end);
      }, delay);

      return () => clearTimeout(timer);
    }, [end, delay]);

    if (!hasStarted) {
      return (
        <AnimatedNumber
          ref={ref}
          value={start}
          duration={0}
          {...props}
        />
      );
    }

    return (
      <AnimatedNumber
        ref={ref}
        value={value}
        duration={duration}
        {...props}
      />
    );
  }
);

CountUp.displayName = "CountUp";

// Portfolio value display with change indicator
interface PortfolioValueProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  change: number;
  changePercent: number;
  animate?: boolean;
}

const PortfolioValue = React.forwardRef<HTMLDivElement, PortfolioValueProps>(
  ({ className, value, change, changePercent, animate = true, ...props }, ref) => {
    const isPositive = change >= 0;

    return (
      <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
        <AnimatedNumber
          value={value}
          prefix="$"
          decimals={2}
          duration={animate ? 500 : 0}
          className="text-hero"
        />
        <div className="flex items-center gap-2">
          <AnimatedNumber
            value={change}
            prefix={isPositive ? "+$" : "-$"}
            decimals={2}
            duration={animate ? 500 : 0}
            colorize
            className="text-lg font-semibold"
          />
          <AnimatedNumber
            value={Math.abs(changePercent)}
            prefix={isPositive ? "+" : "-"}
            suffix="%"
            decimals={2}
            duration={animate ? 500 : 0}
            className={cn(
              "text-lg font-semibold",
              isPositive ? "text-gain" : "text-loss-red"
            )}
          />
        </div>
      </div>
    );
  }
);

PortfolioValue.displayName = "PortfolioValue";

export { AnimatedNumber, CountUp, PortfolioValue };
