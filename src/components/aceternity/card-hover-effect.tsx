"use client";

import { useState, useRef, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardHoverEffectProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  rotationIntensity?: number;
  glareEnabled?: boolean;
  glareMaxOpacity?: number;
  glareColor?: string;
  scaleOnHover?: number;
  springConfig?: {
    stiffness?: number;
    damping?: number;
  };
}

export function CardHoverEffect({
  children,
  className,
  containerClassName,
  rotationIntensity = 15,
  glareEnabled = true,
  glareMaxOpacity = 0.3,
  glareColor = "rgba(255, 255, 255, 0.4)",
  scaleOnHover = 1.02,
  springConfig = { stiffness: 400, damping: 30 },
}: CardHoverEffectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateXValue = (mouseY / (rect.height / 2)) * -rotationIntensity;
    const rotateYValue = (mouseX / (rect.width / 2)) * rotationIntensity;

    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);

    // Glare position
    const glareXValue = ((e.clientX - rect.left) / rect.width) * 100;
    const glareYValue = ((e.clientY - rect.top) / rect.height) * 100;
    glareX.set(glareXValue);
    glareY.set(glareYValue);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div className={cn("perspective-1000", containerClassName)}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          scale: isHovered ? scaleOnHover : 1,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative rounded-xl transition-shadow duration-300",
          isHovered && "shadow-2xl",
          className
        )}
      >
        {children}

        {/* Glare effect */}
        {glareEnabled && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background: useTransform(
                [glareX, glareY],
                ([x, y]) =>
                  `radial-gradient(farthest-corner circle at ${x}% ${y}%, ${glareColor} 0%, transparent 80%)`
              ),
              opacity: isHovered ? glareMaxOpacity : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </div>
  );
}

// Simplified 3D card for hover effects on grid items
interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HoverCard({ children, className }: HoverCardProps) {
  return (
    <CardHoverEffect
      className={cn(
        "bg-gradient-to-b from-[#141414] to-[#0d0d0d] border border-[#1a1a1a] p-6",
        className
      )}
      rotationIntensity={10}
      scaleOnHover={1.03}
    >
      {children}
    </CardHoverEffect>
  );
}

// Card grid with staggered hover animations
interface HoverCardGridProps {
  items: {
    id: string | number;
    content: React.ReactNode;
  }[];
  className?: string;
  cardClassName?: string;
}

export function HoverCardGrid({ items, className, cardClassName }: HoverCardGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("grid gap-4", className)}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="relative"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <motion.div
            animate={{
              scale: hoveredIndex === idx ? 1.02 : 1,
              zIndex: hoveredIndex === idx ? 10 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <HoverCard className={cardClassName}>{item.content}</HoverCard>
          </motion.div>

          {/* Highlight when hovered */}
          {hoveredIndex === idx && (
            <motion.div
              layoutId="hoverHighlight"
              className="absolute inset-0 rounded-xl bg-[#627d98]/5 -z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
