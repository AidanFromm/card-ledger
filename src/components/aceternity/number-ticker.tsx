"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useSpring, useInView, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  className?: string;
  duration?: number;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  decimalPlaces = 0,
  className,
  duration = 2,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hasStarted, setHasStarted] = useState(false);

  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
    duration: duration * 1000,
  });

  const displayValue = useTransform(springValue, (latest) => {
    return Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(latest);
  });

  useEffect(() => {
    if (isInView && !hasStarted) {
      const timeout = setTimeout(() => {
        setHasStarted(true);
        motionValue.set(direction === "down" ? 0 : value);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, hasStarted, delay, direction, motionValue, value]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {displayValue}
    </motion.span>
  );
}

// Animated counter with prefix/suffix
interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
  decimalPlaces?: number;
  delay?: number;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  className,
  duration = 2,
  decimalPlaces = 0,
  delay = 0,
}: AnimatedCounterProps) {
  return (
    <span className={className}>
      {prefix}
      <NumberTicker
        value={value}
        duration={duration}
        decimalPlaces={decimalPlaces}
        delay={delay}
      />
      {suffix}
    </span>
  );
}

// Slot machine style number animation
interface SlotCounterProps {
  value: number;
  className?: string;
  digitClassName?: string;
  duration?: number;
}

export function SlotCounter({
  value,
  className,
  digitClassName,
  duration = 1.5,
}: SlotCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const digits = value.toString().split("");

  return (
    <div ref={ref} className={cn("flex overflow-hidden", className)}>
      {digits.map((digit, index) => (
        <div
          key={index}
          className={cn("relative h-[1em] overflow-hidden", digitClassName)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={isInView ? { y: 0 } : { y: "100%" }}
            transition={{
              duration,
              delay: index * 0.1,
              type: "spring",
              damping: 25,
              stiffness: 120,
            }}
            className="relative"
          >
            {/* Scrolling numbers effect */}
            {Array.from({ length: parseInt(digit) + 1 }, (_, i) => (
              <motion.span
                key={i}
                className="block"
                style={{ height: "1em", lineHeight: "1em" }}
              >
                {i}
              </motion.span>
            )).reverse()}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

// Flip counter (like airport displays)
interface FlipCounterProps {
  value: number;
  className?: string;
  digitClassName?: string;
}

export function FlipCounter({ value, className, digitClassName }: FlipCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);
  const digits = displayValue.toString().padStart(value.toString().length, "0").split("");

  useEffect(() => {
    if (!isInView) return;

    let current = 0;
    const increment = value / 60;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isInView, value]);

  return (
    <div ref={ref} className={cn("flex gap-1", className)}>
      {digits.map((digit, index) => (
        <div
          key={index}
          className={cn(
            "relative bg-[#1a1a1a] rounded px-2 py-1 overflow-hidden",
            digitClassName
          )}
        >
          <motion.span
            key={digit}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="block font-bold text-white"
            style={{ transformOrigin: "center bottom" }}
          >
            {digit}
          </motion.span>
          {/* Split line effect */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/30" />
        </div>
      ))}
    </div>
  );
}

// Currency counter with animation
interface CurrencyTickerProps {
  value: number;
  currency?: string;
  className?: string;
  duration?: number;
  decimalPlaces?: number;
}

export function CurrencyTicker({
  value,
  currency = "$",
  className,
  duration = 2,
  decimalPlaces = 2,
}: CurrencyTickerProps) {
  return (
    <span className={className}>
      {currency}
      <NumberTicker value={value} duration={duration} decimalPlaces={decimalPlaces} />
    </span>
  );
}

// Percentage counter
interface PercentageTickerProps {
  value: number;
  className?: string;
  duration?: number;
  decimalPlaces?: number;
  showSign?: boolean;
}

export function PercentageTicker({
  value,
  className,
  duration = 2,
  decimalPlaces = 1,
  showSign = true,
}: PercentageTickerProps) {
  const sign = value > 0 ? "+" : "";
  const colorClass = value > 0 ? "text-[#627d98]" : value < 0 ? "text-red-400" : "text-gray-400";

  return (
    <span className={cn(colorClass, className)}>
      {showSign && sign}
      <NumberTicker value={value} duration={duration} decimalPlaces={decimalPlaces} />%
    </span>
  );
}
