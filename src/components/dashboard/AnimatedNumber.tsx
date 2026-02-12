import { memo, useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

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
        <motion.span
          key={`${index}-${char}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: index * 0.03,
          }}
          className={digitClassName}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
});

AnimatedDigits.displayName = "AnimatedDigits";

export default AnimatedNumber;
