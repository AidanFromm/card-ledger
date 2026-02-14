import { memo, useEffect, useRef, useState } from "react";
import { motion, useSpring, animate, useMotionValue, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

export const AnimatedNumber = memo(({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  duration = 1.2,
  className = "",
  onComplete,
}: AnimatedNumberProps) => {
  const prevValue = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);
  
  const spring = useSpring(prevValue.current, {
    stiffness: 50,
    damping: 20,
    mass: 1,
  });

  useEffect(() => {
    spring.set(value);
    prevValue.current = value;
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [spring]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete?.();
    }, duration * 1000);
    return () => clearTimeout(timeout);
  }, [value, duration, onComplete]);

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
});

AnimatedNumber.displayName = "AnimatedNumber";

// Premium slot-machine style digit animation
interface RollingDigitProps {
  digit: string;
  delay?: number;
}

const RollingDigit = memo(({ digit, delay = 0 }: RollingDigitProps) => {
  const isNumber = /\d/.test(digit);
  
  if (!isNumber) {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay }}
        className="inline-block"
      >
        {digit}
      </motion.span>
    );
  }

  return (
    <motion.span
      key={digit}
      initial={{ opacity: 0, y: 30, rotateX: -90 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay,
      }}
      className="inline-block"
      style={{ perspective: 100 }}
    >
      {digit}
    </motion.span>
  );
});

RollingDigit.displayName = "RollingDigit";

// Digit-by-digit animated number for extra premium feel
interface AnimatedDigitsProps {
  value: number;
  prefix?: string;
  decimals?: number;
  className?: string;
  digitClassName?: string;
}

export const AnimatedDigits = memo(({
  value,
  prefix = "$",
  decimals = 2,
  className = "",
  digitClassName = "",
}: AnimatedDigitsProps) => {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  const chars = (prefix + formatted).split('');
  
  return (
    <span className={`inline-flex ${className}`}>
      {chars.map((char, index) => (
        <RollingDigit
          key={`${index}-${char}`}
          digit={char}
          delay={index * 0.04}
        />
      ))}
    </span>
  );
});

AnimatedDigits.displayName = "AnimatedDigits";

// Robinhood-style counting animation with easing
interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export const CountUp = memo(({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  duration = 2,
  className = "",
}: CountUpProps) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(prevValue.current, value, {
      duration,
      ease: [0.32, 0.72, 0, 1], // Custom easing like Robinhood
      onUpdate(latest) {
        node.textContent = prefix + latest.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) + suffix;
      },
    });

    prevValue.current = value;

    return () => controls.stop();
  }, [value, prefix, suffix, decimals, duration]);

  return (
    <span ref={nodeRef} className={className}>
      {prefix}{value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}{suffix}
    </span>
  );
});

CountUp.displayName = "CountUp";

// Compact animated value for cards
interface AnimatedValueProps {
  value: number;
  previousValue?: number;
  prefix?: string;
  decimals?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showChange?: boolean;
}

export const AnimatedValue = memo(({
  value,
  previousValue,
  prefix = "$",
  decimals = 2,
  size = 'md',
  className = "",
  showChange = false,
}: AnimatedValueProps) => {
  const motionValue = useMotionValue(previousValue ?? value);
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest),
    });
    return () => controls.stop();
  }, [value, motionValue]);

  const change = previousValue !== undefined ? value - previousValue : 0;
  const changePercent = previousValue && previousValue !== 0 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;
  const isPositive = change >= 0;

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div className={`flex flex-col ${className}`}>
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-bold text-white tabular-nums ${sizeClasses[size]}`}
      >
        {prefix}{formatted}
      </motion.span>
      
      {showChange && change !== 0 && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-sm font-medium mt-1 ${
            isPositive ? 'text-navy-400' : 'text-red-400'
          }`}
        >
          {isPositive ? '+' : ''}{change.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </motion.span>
      )}
    </div>
  );
});

AnimatedValue.displayName = "AnimatedValue";

export default AnimatedNumber;
