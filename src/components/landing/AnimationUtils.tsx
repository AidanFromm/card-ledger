import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { NumberTicker } from "@/components/aceternity/number-ticker";

// Animated counter with number ticker
export const AnimatedCounter = ({ 
  value, 
  duration = 2, 
  prefix = "", 
  suffix = "",
  decimals = 0
}: { 
  value: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string;
  decimals?: number;
}) => {
  return (
    <span className="tabular-nums">
      {prefix}
      <NumberTicker value={value} duration={duration} decimalPlaces={decimals} />
      {suffix}
    </span>
  );
};

// Floating animation wrapper with enhanced physics
export const FloatingElement = ({ 
  children, 
  className, 
  delay = 0,
  duration = 4,
  range = 8
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  duration?: number;
  range?: number;
}) => (
  <motion.div
    initial={{ y: 0, rotate: 0 }}
    animate={{ 
      y: [-range, range, -range],
      rotate: [-1, 1, -1]
    }}
    transition={{ 
      duration, 
      repeat: Infinity, 
      ease: "easeInOut", 
      delay,
      times: [0, 0.5, 1]
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Staggered reveal animation with enhanced easing
export const RevealOnScroll = ({ 
  children, 
  delay = 0,
  className = "",
  direction = "up"
}: { 
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}) => {
  const directionMap = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { x: 60, y: 0 },
    right: { x: -60, y: 0 }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ 
        duration: 0.8, 
        delay, 
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Magnetic button effect
export const MagneticButton = ({ children, className, onClick }: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

// Text reveal animation
export const TextReveal = ({ children, delay = 0 }: { children: string; delay?: number }) => (
  <motion.span className="inline-block overflow-hidden">
    <motion.span
      initial={{ y: "100%" }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="inline-block"
    >
      {children}
    </motion.span>
  </motion.span>
);

// 3D Tilt Card - Premium Hover Effect
export const TiltCard3D = ({ 
  children, 
  className = "",
  glowColor = "rgba(98, 125, 152, 0.3)"
}: { 
  children: React.ReactNode; 
  className?: string;
  glowColor?: string;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const brightness = useMotionValue(1);
  
  const smoothRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });
  const smoothBrightness = useSpring(brightness, { stiffness: 150, damping: 20 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const maxRotation = 6;
    const rotX = (mouseY / (rect.height / 2)) * -maxRotation;
    const rotY = (mouseX / (rect.width / 2)) * maxRotation;
    
    rotateX.set(rotX);
    rotateY.set(rotY);
    brightness.set(1.05);
  };
  
  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    brightness.set(1);
  };
  
  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: smoothRotateX,
        rotateY: smoothRotateY,
        filter: useTransform(smoothBrightness, (v) => `brightness(${v})`),
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      className={`relative ${className}`}
    >
      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 50%)`,
          filter: 'blur(20px)',
        }}
      />
      {children}
    </motion.div>
  );
};
