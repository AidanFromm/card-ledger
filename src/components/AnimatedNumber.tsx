import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
  showChange?: boolean;
}

// Animated counter with spring physics
export const AnimatedNumber = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  duration = 0.8,
  className = "",
  formatOptions,
  showChange = false,
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [changeDirection, setChangeDirection] = useState<"up" | "down" | null>(null);
  const prevValueRef = useRef(value);

  // Spring animation for smooth counting
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  useEffect(() => {
    const prev = prevValueRef.current;
    if (value !== prev) {
      setChangeDirection(value > prev ? "up" : "down");
      prevValueRef.current = value;
      
      // Clear direction indicator after animation
      const timer = setTimeout(() => setChangeDirection(null), 600);
      return () => clearTimeout(timer);
    }
  }, [value]);

  useEffect(() => {
    spring.set(value);
    
    const unsubscribe = spring.on("change", (v) => {
      setDisplayValue(v);
    });

    return unsubscribe;
  }, [value, spring]);

  const formatNumber = (num: number): string => {
    if (formatOptions) {
      return new Intl.NumberFormat("en-US", formatOptions).format(num);
    }
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <motion.span
      className={`font-mono tabular-nums inline-flex items-center ${className}`}
      animate={
        showChange && changeDirection
          ? {
              color:
                changeDirection === "up"
                  ? "hsl(160 84% 39%)"
                  : "hsl(0 84% 60%)",
            }
          : {}
      }
      transition={{ duration: 0.3 }}
    >
      {prefix}
      <motion.span
        key={value}
        initial={showChange ? { y: changeDirection === "up" ? 10 : -10, opacity: 0.5 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {formatNumber(displayValue)}
      </motion.span>
      {suffix}
    </motion.span>
  );
};

// Compact currency display with animated counting
interface AnimatedCurrencyProps {
  value: number;
  showSign?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
}

export const AnimatedCurrency = ({
  value,
  showSign = false,
  className = "",
  size = "md",
}: AnimatedCurrencyProps) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-4xl",
    hero: "text-5xl sm:text-6xl",
  };

  const prefix = showSign && value >= 0 ? "+$" : value < 0 ? "-$" : "$";
  const absValue = Math.abs(value);

  return (
    <AnimatedNumber
      value={absValue}
      prefix={prefix}
      decimals={2}
      className={`${sizeClasses[size]} font-bold ${className}`}
      showChange
    />
  );
};

// Percentage display with color coding
interface AnimatedPercentProps {
  value: number;
  className?: string;
  showSign?: boolean;
  colorCode?: boolean;
}

export const AnimatedPercent = ({
  value,
  className = "",
  showSign = true,
  colorCode = true,
}: AnimatedPercentProps) => {
  const isPositive = value >= 0;
  const colorClass = colorCode
    ? isPositive
      ? "text-gain"
      : "text-loss"
    : "";

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`font-mono font-semibold ${colorClass} ${className}`}
    >
      <AnimatedNumber
        value={Math.abs(value)}
        prefix={showSign ? (isPositive ? "+" : "-") : ""}
        suffix="%"
        decimals={2}
        showChange
      />
    </motion.span>
  );
};

// Rolling digit animation (like a slot machine)
interface RollingDigitProps {
  digit: string;
  delay?: number;
}

const RollingDigit = ({ digit, delay = 0 }: RollingDigitProps) => {
  return (
    <motion.span
      key={digit}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        delay,
      }}
      className="inline-block"
    >
      {digit}
    </motion.span>
  );
};

// Full rolling number display (premium slot-machine style)
interface RollingNumberProps {
  value: number;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export const RollingNumber = ({
  value,
  prefix = "$",
  decimals = 2,
  className = "",
}: RollingNumberProps) => {
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const digits = formatted.split("");

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {digits.map((digit, i) => (
        <RollingDigit key={`${i}-${digit}`} digit={digit} delay={i * 0.02} />
      ))}
    </span>
  );
};

export default AnimatedNumber;
