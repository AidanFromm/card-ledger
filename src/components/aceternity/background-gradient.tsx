"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundGradientProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
}: BackgroundGradientProps) {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };

  return (
    <div className={cn("relative p-[4px] group", containerClassName)}>
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "400% 400%" : undefined,
        }}
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-60 group-hover:opacity-100 blur-xl transition duration-500",
          "bg-[radial-gradient(circle_farthest-side_at_0_100%,#627d98,transparent),radial-gradient(circle_farthest-side_at_100%_0,#34d399,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#059669,transparent),radial-gradient(circle_farthest-side_at_0_0,#627d98,#141414)]"
        )}
      />
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "400% 400%" : undefined,
        }}
        className={cn(
          "absolute inset-0 rounded-3xl z-[1]",
          "bg-[radial-gradient(circle_farthest-side_at_0_100%,#627d98,transparent),radial-gradient(circle_farthest-side_at_100%_0,#34d399,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#059669,transparent),radial-gradient(circle_farthest-side_at_0_0,#627d98,#141414)]"
        )}
      />

      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}

// Background beams with animated gradient rays
export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent)]",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              rotate: i * 30,
              opacity: 0.1,
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="absolute h-[50rem] w-[1px] origin-center"
            style={{
              background: `linear-gradient(to top, transparent, ${
                i % 2 === 0 ? "#627d98" : "#34d399"
              }20, transparent)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Animated mesh gradient background
interface MeshGradientProps {
  className?: string;
  colors?: string[];
}

export function MeshGradient({
  className,
  colors = ["#627d98", "#34d399", "#3b82f6", "#8b5cf6"],
}: MeshGradientProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden opacity-30 pointer-events-none",
        className
      )}
    >
      {colors.map((color, i) => (
        <motion.div
          key={i}
          initial={{
            x: `${(i % 2) * 50}%`,
            y: `${Math.floor(i / 2) * 50}%`,
            scale: 1,
          }}
          animate={{
            x: [
              `${(i % 2) * 50}%`,
              `${((i + 1) % 2) * 50}%`,
              `${(i % 2) * 50}%`,
            ],
            y: [
              `${Math.floor(i / 2) * 50}%`,
              `${Math.floor((i + 2) / 2) * 50}%`,
              `${Math.floor(i / 2) * 50}%`,
            ],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{
            backgroundColor: color,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}

// Aurora background effect
export function AuroraBackground({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="
            absolute 
            -inset-[10px]
            opacity-50
            [--aurora:repeating-linear-gradient(100deg,#627d98_10%,#34d399_15%,#059669_20%,#3b82f6_25%,#627d98_30%)]
            [background-image:var(--aurora)]
            [background-size:300%]
            [background-position:50%_50%]
            animate-aurora
            filter
            blur-[10px]
            after:content-['']
            after:absolute
            after:inset-0
            after:[background-image:var(--aurora)]
            after:[background-size:200%]
            after:animate-aurora
            after:[background-attachment:fixed]
            after:mix-blend-difference
          "
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Grid background pattern
export function GridBackground({
  children,
  className,
  gridClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  gridClassName?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]",
          gridClassName
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
