"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparkleType {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

interface SparklesProps {
  children?: React.ReactNode;
  className?: string;
  sparkleColor?: string;
  sparkleCount?: number;
  minSize?: number;
  maxSize?: number;
}

function generateSparkle(
  sparkleColor: string,
  minSize: number,
  maxSize: number
): SparkleType {
  return {
    id: String(Math.random()),
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: minSize + Math.random() * (maxSize - minSize),
    color: sparkleColor,
    delay: Math.random() * 0.4,
    duration: 0.6 + Math.random() * 0.6,
  };
}

const SparkleInstance = ({ sparkle }: { sparkle: SparkleType }) => {
  return (
    <motion.svg
      key={sparkle.id}
      className="absolute pointer-events-none"
      style={{
        left: `${sparkle.x}%`,
        top: `${sparkle.y}%`,
        width: sparkle.size,
        height: sparkle.size,
      }}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0, opacity: 0, rotate: 0 }}
      animate={{
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration: sparkle.duration,
        delay: sparkle.delay,
        ease: "easeInOut",
      }}
    >
      <path
        d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
        fill={sparkle.color}
      />
    </motion.svg>
  );
};

export function Sparkles({
  children,
  className,
  sparkleColor = "#627d98",
  sparkleCount = 10,
  minSize = 10,
  maxSize = 20,
}: SparklesProps) {
  const [sparkles, setSparkles] = useState<SparkleType[]>([]);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion.current) return;

    const generateSparkles = () => {
      const newSparkles = Array.from({ length: sparkleCount }, () =>
        generateSparkle(sparkleColor, minSize, maxSize)
      );
      setSparkles(newSparkles);
    };

    generateSparkles();
    const interval = setInterval(generateSparkles, 1500);

    return () => clearInterval(interval);
  }, [sparkleColor, sparkleCount, minSize, maxSize]);

  return (
    <span className={cn("relative inline-block", className)}>
      {sparkles.map((sparkle) => (
        <SparkleInstance key={sparkle.id} sparkle={sparkle} />
      ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
}

// Sparkles text wrapper - adds sparkles around text
interface SparklesTextProps {
  children: string;
  className?: string;
  sparkleColor?: string;
}

export function SparklesText({
  children,
  className,
  sparkleColor = "#627d98",
}: SparklesTextProps) {
  return (
    <Sparkles sparkleColor={sparkleColor} sparkleCount={6} minSize={8} maxSize={16}>
      <span className={className}>{children}</span>
    </Sparkles>
  );
}

// Sparkles badge - floating sparkles on a badge/price
interface SparklesBadgeProps {
  children: React.ReactNode;
  className?: string;
  sparkleColor?: string;
}

export function SparklesBadge({
  children,
  className,
  sparkleColor = "#fbbf24",
}: SparklesBadgeProps) {
  return (
    <Sparkles
      sparkleColor={sparkleColor}
      sparkleCount={4}
      minSize={6}
      maxSize={12}
      className={className}
    >
      {children}
    </Sparkles>
  );
}

// Continuous sparkle rain effect
interface SparkleRainProps {
  className?: string;
  sparkleColor?: string;
  density?: number;
}

export function SparkleRain({
  className,
  sparkleColor = "#627d98",
  density = 20,
}: SparkleRainProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {[...Array(density)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: `${Math.random() * 100}%`,
            y: -20,
            opacity: 0,
          }}
          animate={{
            y: "120%",
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        >
          <motion.svg
            width={6 + Math.random() * 8}
            height={6 + Math.random() * 8}
            viewBox="0 0 160 160"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <path
              d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
              fill={sparkleColor}
              fillOpacity={0.3 + Math.random() * 0.4}
            />
          </motion.svg>
        </motion.div>
      ))}
    </div>
  );
}

// Shine effect - a subtle moving highlight
interface ShineEffectProps {
  children: React.ReactNode;
  className?: string;
}

export function ShineEffect({ children, className }: ShineEffectProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ x: "-100%", opacity: 0 }}
        whileHover={{ x: "100%", opacity: 0.3 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
        }}
      />
      {children}
    </div>
  );
}
