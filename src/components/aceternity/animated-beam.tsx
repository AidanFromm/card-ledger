"use client";

import { forwardRef, useRef, useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement>;
  fromRef: React.RefObject<HTMLElement>;
  toRef: React.RefObject<HTMLElement>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export const AnimatedBeam = forwardRef<SVGSVGElement, AnimatedBeamProps>(
  (
    {
      className,
      containerRef,
      fromRef,
      toRef,
      curvature = 0,
      reverse = false,
      duration = Math.random() * 3 + 4,
      delay = 0,
      pathColor = "gray",
      pathWidth = 2,
      pathOpacity = 0.2,
      gradientStartColor = "#627d98",
      gradientStopColor = "#34d399",
      startXOffset = 0,
      startYOffset = 0,
      endXOffset = 0,
      endYOffset = 0,
    },
    ref
  ) => {
    const id = useId();
    const [pathD, setPathD] = useState("");
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

    const gradientCoordinates = reverse
      ? {
          x1: ["90%", "-10%"],
          x2: ["100%", "0%"],
          y1: ["0%", "0%"],
          y2: ["0%", "0%"],
        }
      : {
          x1: ["-10%", "90%"],
          x2: ["0%", "100%"],
          y1: ["0%", "0%"],
          y2: ["0%", "0%"],
        };

    useEffect(() => {
      const updatePath = () => {
        if (containerRef.current && fromRef.current && toRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const fromRect = fromRef.current.getBoundingClientRect();
          const toRect = toRef.current.getBoundingClientRect();

          const svgWidth = containerRect.width;
          const svgHeight = containerRect.height;
          setSvgDimensions({ width: svgWidth, height: svgHeight });

          const startX =
            fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset;
          const startY =
            fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset;
          const endX =
            toRect.left - containerRect.left + toRect.width / 2 + endXOffset;
          const endY =
            toRect.top - containerRect.top + toRect.height / 2 + endYOffset;

          const controlY = startY - curvature;
          const d = `M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`;
          setPathD(d);
        }
      };

      const resizeObserver = new ResizeObserver(() => {
        updatePath();
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      updatePath();

      return () => {
        resizeObserver.disconnect();
      };
    }, [
      containerRef,
      fromRef,
      toRef,
      curvature,
      startXOffset,
      startYOffset,
      endXOffset,
      endYOffset,
    ]);

    return (
      <svg
        ref={ref}
        fill="none"
        width={svgDimensions.width}
        height={svgDimensions.height}
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "pointer-events-none absolute left-0 top-0 transform-gpu stroke-2",
          className
        )}
        viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      >
        <path
          d={pathD}
          stroke={pathColor}
          strokeWidth={pathWidth}
          strokeOpacity={pathOpacity}
          strokeLinecap="round"
        />
        <path
          d={pathD}
          strokeWidth={pathWidth}
          stroke={`url(#${id})`}
          strokeOpacity="1"
          strokeLinecap="round"
        />
        <defs>
          <motion.linearGradient
            className="transform-gpu"
            id={id}
            gradientUnits="userSpaceOnUse"
            initial={{
              x1: "0%",
              x2: "0%",
              y1: "0%",
              y2: "0%",
            }}
            animate={{
              x1: gradientCoordinates.x1,
              x2: gradientCoordinates.x2,
              y1: gradientCoordinates.y1,
              y2: gradientCoordinates.y2,
            }}
            transition={{
              delay,
              duration,
              ease: [0.16, 1, 0.3, 1],
              repeat: Infinity,
              repeatDelay: 0,
            }}
          >
            <stop stopColor={gradientStartColor} stopOpacity="0" />
            <stop stopColor={gradientStartColor} />
            <stop offset="32.5%" stopColor={gradientStopColor} />
            <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
          </motion.linearGradient>
        </defs>
      </svg>
    );
  }
);

AnimatedBeam.displayName = "AnimatedBeam";

// Circle node that can be used as beam endpoints
interface CircleProps {
  className?: string;
  children?: React.ReactNode;
}

export const Circle = forwardRef<HTMLDivElement, CircleProps>(
  ({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-[#0a0a0a] border-[#1a1a1a] p-3 shadow-[0_0_20px_-12px_rgba(98,125,152,0.8)]",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Circle.displayName = "Circle";
