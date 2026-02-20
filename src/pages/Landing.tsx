import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  motion, 
  useScroll, 
  useTransform, 
  useInView, 
  AnimatePresence,
  useMotionValue,
  useSpring,
  useAnimation
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  ChevronRight, 
  Sparkles as SparklesIcon,
  BarChart3,
  Bell,
  CheckCircle2,
  Star,
  ArrowRight,
  ChevronDown,
  PieChart,
  LineChart,
  Users,
  Package,
  ShoppingCart,
  Layers,
  Award,
  ChevronLeft,
  Download,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  ExternalLink,
  Zap,
  Shield,
  Scan,
  Target,
  Search,
  Play,
  X,
  Check,
  Minus,
  Camera,
  Clock,
  DollarSign,
  TrendingDown,
  Globe,
  Smartphone,
  CreditCard,
  Gift,
  ArrowUpRight,
  MousePointer
} from "lucide-react";

// Aceternity UI Premium Components
import {
  Spotlight,
  SpotlightCard,
} from "@/components/aceternity/spotlight";
import {
  CardHoverEffect,
} from "@/components/aceternity/card-hover-effect";
import {
  TextGenerateEffect,
  TypewriterEffect,
} from "@/components/aceternity/text-generate-effect";
import {
  BackgroundGradient,
  BackgroundBeams,
  GridBackground,
} from "@/components/aceternity/background-gradient";
import {
  Sparkles,
  SparklesBadge,
  ShineEffect,
} from "@/components/aceternity/sparkles";
import {
  NumberTicker,
  CurrencyTicker,
  PercentageTicker,
} from "@/components/aceternity/number-ticker";

// ============================================
// ANIMATED BACKGROUND - PARTICLES & GRADIENTS
// ============================================

const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      hue: number;
    }> = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    // Create particles - reduced count for subtlety
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2, // Slower movement
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 1.5 + 0.5, // Smaller particles
        opacity: Math.random() * 0.25 + 0.05, // Much more subtle
        hue: Math.random() * 30 + 155 // Teal range
      });
    }
    
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 50%, ${p.opacity})`;
        ctx.fill();
        
        // Connect nearby particles - very subtle lines
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) { // Shorter connection distance
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.04 * (1 - dist / 120)})`; // Much fainter
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        });
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{ zIndex: 0 }}
    />
  );
};

// ============================================
// AURORA ARC - Subtle Animated Gradient Sweep
// ============================================
const AuroraArc = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50" style={{ zIndex: 1 }}>
      {/* Single slow-rotating arc - very subtle */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: '200%', height: '200%' }}
      >
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 60, // Much slower - 60 seconds per rotation
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0"
          style={{
            background: `conic-gradient(
              from 180deg at 50% 50%,
              transparent 0deg,
              transparent 90deg,
              rgba(98, 125, 152, 0.04) 120deg,
              rgba(52, 211, 153, 0.06) 150deg,
              rgba(98, 125, 152, 0.04) 180deg,
              transparent 210deg,
              transparent 360deg
            )`,
          }}
        />
      </motion.div>
      
      {/* Subtle top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
        style={{
          background: `radial-gradient(
            ellipse 100% 100% at 50% 0%,
            rgba(98, 125, 152, 0.08) 0%,
            transparent 60%
          )`,
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
};

// ============================================
// CURSOR FOLLOWING GRADIENT - Subtle Interactive Glow
// ============================================
const CursorGradient = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Very smooth, slow spring for subtle movement
  const smoothX = useSpring(mouseX, { stiffness: 20, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 20, damping: 30 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Single subtle cursor glow - very faint */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-40"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          background: `radial-gradient(
            circle at center,
            rgba(98, 125, 152, 0.08) 0%,
            rgba(52, 211, 153, 0.04) 40%,
            transparent 70%
          )`,
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
};

// Animated gradient orbs - very subtle ambient movement
const GradientOrbs = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-60" style={{ zIndex: 0 }}>
    <motion.div
      animate={{
        x: [0, 50, 0], // Reduced movement
        y: [0, -25, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }} // Much slower
      className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#627d98]/5 rounded-full blur-[200px]"
    />
    <motion.div
      animate={{
        x: [0, -40, 0],
        y: [0, 40, 0],
        scale: [1, 0.95, 1],
      }}
      transition={{ duration: 50, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/4 rounded-full blur-[180px]"
    />
    {/* Removed the third orb and grid for cleaner look */}
    {/* Subtle radial gradient at top */}
    <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#627d98]/3 via-transparent to-transparent" />
  </div>
);

// ============================================
// ANIMATED COMPONENTS
// ============================================

// Using Aceternity's NumberTicker for smoother animations
const AnimatedCounter = ({ 
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
const FloatingElement = ({ 
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
const RevealOnScroll = ({ 
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
const MagneticButton = ({ children, className, onClick }: { 
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
const TextReveal = ({ children, delay = 0 }: { children: string; delay?: number }) => (
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

// ============================================
// 3D TILT CARD - Premium Hover Effect
// ============================================
const TiltCard3D = ({ 
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
    
    // Calculate rotation (max 15 degrees)
    const maxRotation = 6; // Subtle tilt
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
      {/* Glow effect */}
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

// ============================================
// FLOATING SHOWCASE CARDS - 3D Perspective Display
// ============================================
const FloatingShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const y3 = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const rotate = useTransform(scrollYProgress, [0, 1], [5, -5]);
  
  const showcaseCards = [
    {
      title: "Portfolio Dashboard",
      description: "Real-time value tracking",
      gradient: "from-[#627d98] to-[#34d399]",
      icon: <PieChart className="w-8 h-8" />,
      y: y1,
    },
    {
      title: "Price Alerts",
      description: "Never miss an opportunity",
      gradient: "from-[#34d399] to-[#06b6d4]",
      icon: <Bell className="w-8 h-8" />,
      y: y2,
    },
    {
      title: "Market Insights",
      description: "AI-powered analytics",
      gradient: "from-[#06b6d4] to-[#627d98]",
      icon: <TrendingUp className="w-8 h-8" />,
      y: y3,
    },
  ];
  
  return (
    <div ref={containerRef} className="relative h-[500px] flex items-center justify-center perspective-1000">
      <div className="relative w-full max-w-4xl flex justify-center items-center gap-8">
        {showcaseCards.map((card, i) => (
          <motion.div
            key={card.title}
            style={{ 
              y: card.y,
              rotateY: rotate,
              transformStyle: 'preserve-3d',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            className="group"
          >
            <TiltCard3D className="w-64">
              <div className={`
                relative p-6 rounded-2xl 
                bg-gradient-to-br ${card.gradient} bg-opacity-10
                border border-white/10
                backdrop-blur-xl
                shadow-2xl shadow-black/20
                overflow-hidden
              `}>
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className={`
                    w-14 h-14 rounded-xl mb-4
                    bg-gradient-to-br ${card.gradient}
                    flex items-center justify-center text-black
                    shadow-lg
                  `}>
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400">{card.description}</p>
                </div>
                
                {/* Shine effect on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, transparent 50%)',
                  }}
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                />
              </div>
            </TiltCard3D>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// BENTO GRID FEATURE CARDS
// ============================================

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  size?: "small" | "medium" | "large";
  delay?: number;
  accentColor?: string;
  visual?: React.ReactNode;
}

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  gradient,
  size = "small",
  delay = 0,
  accentColor = "#627d98",
  visual
}: FeatureCardProps) => {
  const sizeClasses = {
    small: "col-span-1 row-span-1",
    medium: "col-span-1 md:col-span-2 row-span-1",
    large: "col-span-1 md:col-span-2 row-span-2"
  };
  
  return (
    <CardHoverEffect
      rotationIntensity={8}
      scaleOnHover={1.02}
      glareEnabled={true}
      glareMaxOpacity={0.15}
      glareColor={accentColor}
      className={`rounded-3xl ${sizeClasses[size]}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="group relative h-full rounded-3xl bg-gradient-to-b from-[#141414] to-[#0d0d0d] border border-[#1a1a1a] overflow-hidden hover:border-[#2a2a2a] transition-all duration-500"
      >
        {/* SpotlightCard effect on hover */}
        <SpotlightCard spotlightColor={`${accentColor}20`} className="absolute inset-0 rounded-3xl" />
      
        {/* Border glow */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(180deg, ${accentColor}15 0%, transparent 50%)`,
          }}
        />
      
      <div className="relative z-10 p-6 md:p-8 h-full flex flex-col">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        {/* Content */}
        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#627d98] transition-colors duration-300">
          {title}
        </h3>
        <p className="text-[15px] text-gray-400 leading-relaxed flex-grow">
          {description}
        </p>
        
        {/* Visual element for larger cards */}
        {visual && (
          <div className="mt-6 flex-grow flex items-end">
            {visual}
          </div>
        )}
        
        {/* Arrow indicator */}
        <motion.div 
          className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          whileHover={{ scale: 1.1 }}
        >
          <ArrowUpRight className="w-4 h-4 text-[#627d98]" />
        </motion.div>
      </div>
      </motion.div>
    </CardHoverEffect>
  );
};

// Mini chart visual for feature cards
const MiniChart = ({ color = "#627d98" }: { color?: string }) => (
  <div className="w-full h-24 flex items-end gap-1">
    {[40, 65, 45, 80, 55, 90, 70, 100, 85].map((height, i) => (
      <motion.div
        key={i}
        initial={{ height: 0 }}
        whileInView={{ height: `${height}%` }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
        className="flex-1 rounded-t-sm"
        style={{ backgroundColor: `${color}${Math.floor(40 + (height / 100) * 60).toString(16)}` }}
      />
    ))}
  </div>
);

// Portfolio value visual
const PortfolioValueVisual = () => (
  <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-[#1a1a1a]">
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs text-gray-500">Total Value</span>
      <span className="text-xs text-[#627d98] font-medium">+12.4%</span>
    </div>
    <div className="text-3xl font-bold text-white mb-4">
      $24,847<span className="text-gray-500">.50</span>
    </div>
    <MiniChart />
  </div>
);

// ============================================
// HOW IT WORKS
// ============================================

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Add Your Cards",
      description: "Scan barcodes, search our database of millions, or import from a spreadsheet.",
      icon: Scan,
      color: "#627d98"
    },
    {
      number: "02",
      title: "Track Value",
      description: "Watch your portfolio value update in real-time with market prices.",
      icon: TrendingUp,
      color: "#3b82f6"
    },
    {
      number: "03",
      title: "Maximize Profit",
      description: "Make data-driven decisions with analytics, alerts, and insights.",
      icon: Target,
      color: "#8b5cf6"
    }
  ];
  
  return (
    <div className="relative">
      {/* Connection line */}
      <div className="absolute top-[60px] left-[60px] right-[60px] h-0.5 bg-gradient-to-r from-[#627d98] via-[#3b82f6] to-[#8b5cf6] hidden lg:block opacity-30" />
      <motion.div 
        className="absolute top-[60px] left-[60px] right-[60px] h-0.5 bg-gradient-to-r from-[#627d98] via-[#3b82f6] to-[#8b5cf6] hidden lg:block"
        initial={{ scaleX: 0, transformOrigin: "left" }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
      />
      
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        {steps.map((step, i) => (
          <RevealOnScroll key={i} delay={i * 0.2}>
            <div className="relative text-center lg:text-left">
              {/* Step number bubble */}
              <motion.div 
                className="relative z-10 w-[120px] h-[120px] rounded-full mx-auto lg:mx-0 mb-6 flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${step.color}15 0%, transparent 60%)`,
                  border: `1px solid ${step.color}30`
                }}
                whileHover={{ scale: 1.05 }}
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}80 100%)` }}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Step number */}
                <span 
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ 
                    background: '#0a0a0a',
                    border: `2px solid ${step.color}`,
                    color: step.color
                  }}
                >
                  {step.number}
                </span>
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed max-w-xs mx-auto lg:mx-0">
                {step.description}
              </p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  );
};

// ============================================
// PRICING SECTION
// ============================================

const PricingToggle = ({ 
  isAnnual, 
  setIsAnnual 
}: { 
  isAnnual: boolean; 
  setIsAnnual: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-center gap-4 mb-12">
    <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>
      Monthly
    </span>
    <button
      onClick={() => setIsAnnual(!isAnnual)}
      className="relative w-16 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] transition-colors"
    >
      <motion.div
        className="absolute top-1 w-6 h-6 rounded-full bg-[#627d98] shadow-lg"
        animate={{ left: isAnnual ? '34px' : '4px' }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
    <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
      Annual
    </span>
    <span className="px-2 py-1 rounded-full bg-[#627d98]/20 text-[#627d98] text-xs font-semibold">
      Save 40%
    </span>
  </div>
);

const PricingCard = ({ 
  name, 
  monthlyPrice,
  annualPrice,
  isAnnual,
  period, 
  description,
  features, 
  popular = false,
  delay = 0,
  onSelect
}: { 
  name: string; 
  monthlyPrice: number;
  annualPrice: number;
  isAnnual: boolean;
  period: string;
  description: string;
  features: Array<{ text: string; included: boolean }>;
  popular?: boolean;
  delay?: number;
  onSelect: () => void;
}) => {
  const price = isAnnual ? annualPrice : monthlyPrice;
  const displayPrice = price === 0 ? "Free" : `$${price.toFixed(2)}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`relative rounded-3xl border transition-all duration-500 ${
        popular 
          ? 'bg-gradient-to-b from-[#627d98]/10 via-[#0d0d0d] to-[#0d0d0d] border-[#627d98]/40 shadow-2xl shadow-[#627d98]/10 scale-[1.02] z-10' 
          : 'bg-gradient-to-b from-[#141414] to-[#0d0d0d] border-[#1a1a1a] hover:border-[#2a2a2a]'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#627d98] to-[#059669] text-black text-xs font-bold uppercase tracking-wider shadow-lg">
            Most Popular
          </div>
        </div>
      )}
      
      <div className="p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        
        <div className="flex items-baseline gap-1 mb-8">
          <motion.span 
            key={displayPrice}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white"
          >
            {displayPrice}
          </motion.span>
          {price > 0 && period !== "once" && (
            <span className="text-gray-500">/{isAnnual ? 'year' : 'month'}</span>
          )}
          {period === "once" && (
            <span className="text-gray-500">one-time</span>
          )}
        </div>
        
        <ul className="space-y-4 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              {feature.included ? (
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${popular ? 'text-[#627d98]' : 'text-gray-400'}`} />
              ) : (
                <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                  <Minus className="w-4 h-4 text-gray-700" />
                </div>
              )}
              <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
        
        <MagneticButton onClick={onSelect} className="w-full">
          <Button 
            className={`w-full h-14 text-base font-semibold rounded-2xl transition-all ${
              popular 
                ? 'bg-gradient-to-r from-[#627d98] to-[#059669] hover:from-[#0ea472] hover:to-[#059669] text-black shadow-lg shadow-[#627d98]/30 hover:shadow-xl hover:shadow-[#627d98]/40' 
                : 'bg-white/5 hover:bg-white/10 text-white border border-[#2a2a2a] hover:border-[#3a3a3a]'
            }`}
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </MagneticButton>
      </div>
    </motion.div>
  );
};

// ============================================
// TESTIMONIALS CAROUSEL
// ============================================

const TestimonialCarousel = ({ testimonials }: { testimonials: Array<{
  name: string;
  role: string;
  text: string;
  rating: number;
  image?: string;
}> }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
  return (
    <div className="relative max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Quote */}
          <p className="text-2xl md:text-3xl text-white font-medium leading-relaxed mb-10">
            "{testimonials[activeIndex].text}"
          </p>
          
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-5 h-5 ${i < testimonials[activeIndex].rating ? 'fill-[#627d98] text-[#627d98]' : 'text-gray-700'}`} 
              />
            ))}
          </div>
          
          {/* Author */}
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#627d98] to-[#059669] flex items-center justify-center text-white text-xl font-bold">
              {testimonials[activeIndex].name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">{testimonials[activeIndex].name}</p>
              <p className="text-sm text-gray-500">{testimonials[activeIndex].role}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-10">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex 
                ? 'w-8 bg-[#627d98]' 
                : 'w-2 bg-gray-700 hover:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// FAQ ACCORDION
// ============================================

const FAQItem = ({ 
  question, 
  answer, 
  delay = 0,
  isOpen,
  onClick
}: { 
  question: string; 
  answer: string; 
  delay?: number;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="border-b border-[#1a1a1a]"
  >
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-6 text-left group"
    >
      <span className="text-lg font-medium text-white group-hover:text-[#627d98] transition-colors pr-8">
        {question}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isOpen ? 'bg-[#627d98] text-black' : 'bg-[#1a1a1a] text-gray-400'
        }`}
      >
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="overflow-hidden"
        >
          <p className="pb-6 text-gray-400 leading-relaxed pr-16">{answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ============================================
// NAVIGATION
// ============================================

const Navigation = ({ scrolled }: { scrolled: boolean }) => {
  const navigate = useNavigate();
  
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${
        scrolled 
          ? 'backdrop-blur-xl bg-[#0a0a0a]/90 border-b border-[#1a1a1a]' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#627d98] via-[#059669] to-[#047857] flex items-center justify-center shadow-lg shadow-[#627d98]/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Card<span className="text-[#627d98]">Ledger</span>
          </span>
        </motion.div>
        
        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-10">
          {['Features', 'How It Works', 'Pricing', 'FAQ'].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} 
              className="text-sm text-gray-400 hover:text-white transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#627d98] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>
        
        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/auth")} 
            className="hidden sm:flex text-gray-300 hover:text-white hover:bg-white/5"
          >
            Sign In
          </Button>
          <MagneticButton onClick={() => navigate("/auth")}>
            <Button 
              className="bg-gradient-to-r from-[#627d98] to-[#059669] hover:from-[#0ea472] hover:to-[#059669] text-black font-semibold rounded-xl gap-2 shadow-lg shadow-[#627d98]/20 hover:shadow-[#627d98]/30 transition-all"
            >
              Start Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </MagneticButton>
        </div>
      </div>
    </motion.nav>
  );
};

// ============================================
// LIVE ACTIVITY TOAST - Social Proof
// ============================================

const ACTIVITY_MESSAGES = [
  { name: "Mike R.", location: "California", action: "added a PSA 10 Charizard", icon: "✨" },
  { name: "Sarah T.", location: "New York", action: "completed a set", icon: "🎉" },
  { name: "Jake M.", location: "Texas", action: "sold a card for $450", icon: "💰" },
  { name: "Emma L.", location: "Florida", action: "reached $10K portfolio", icon: "🚀" },
  { name: "Chris P.", location: "Ohio", action: "added 25 cards", icon: "📦" },
  { name: "Alex K.", location: "Washington", action: "graded a BGS 9.5", icon: "⭐" },
  { name: "Jordan W.", location: "Colorado", action: "earned 'Master Collector'", icon: "🏆" },
  { name: "Sam D.", location: "Georgia", action: "tracked $5K profit", icon: "📈" },
];

const LiveActivityToast = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showToast = () => {
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 4000);
    };

    // Initial delay
    const initialTimer = setTimeout(() => {
      showToast();
    }, 5000);

    // Recurring
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ACTIVITY_MESSAGES.length);
      showToast();
    }, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const activity = ACTIVITY_MESSAGES[currentIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 20 }}
          className="fixed bottom-24 left-4 z-50 max-w-xs"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-xl">
            <div className="w-10 h-10 rounded-full bg-navy-600/30 flex items-center justify-center text-lg">
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {activity.name} from {activity.location}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                just {activity.action}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// MAIN LANDING COMPONENT
// ============================================

const Landing = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 150]);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      } else {
        setIsLoading(false);
      }
    });
    
    // Scroll listener
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector((this as HTMLAnchorElement).getAttribute('href') || '');
        target?.scrollIntoView({ behavior: 'smooth' });
      });
    });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#627d98] to-[#059669] flex items-center justify-center">
            <Layers className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="w-48 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#627d98] to-[#059669]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // DATA
  // ============================================

  const features = [
    {
      icon: LineChart,
      title: "Real-time Portfolio Value",
      description: "Watch your collection's worth update instantly with prices from eBay, TCGPlayer, and major marketplaces.",
      gradient: "bg-gradient-to-br from-[#627d98] to-[#059669]",
      size: "medium" as const,
      accentColor: "#627d98",
      visual: <PortfolioValueVisual />
    },
    {
      icon: TrendingUp,
      title: "P&L Analytics",
      description: "Track profit & loss, ROI, and performance with beautiful visualizations.",
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
      size: "small" as const,
      accentColor: "#3b82f6"
    },
    {
      icon: Bell,
      title: "Price Alerts",
      description: "Get notified when cards hit your target price. Never miss a deal.",
      gradient: "bg-gradient-to-br from-orange-500 to-red-500",
      size: "small" as const,
      accentColor: "#f97316"
    },
    {
      icon: Package,
      title: "Grading Pipeline",
      description: "Track submissions through PSA, BGS, CGC - from raw to slab.",
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
      size: "small" as const,
      accentColor: "#a855f7"
    },
    {
      icon: Users,
      title: "Wholesale Client Lists",
      description: "Built-in CRM for dealers. Manage buyers, sellers, and transactions.",
      gradient: "bg-gradient-to-br from-yellow-500 to-amber-500",
      size: "small" as const,
      accentColor: "#eab308"
    },
    {
      icon: ShoppingCart,
      title: "eBay Integration",
      description: "Sync listings, track sales, auto-import purchases. Everything in one place.",
      gradient: "bg-gradient-to-br from-indigo-500 to-violet-500",
      size: "small" as const,
      accentColor: "#6366f1"
    },
    {
      icon: Camera,
      title: "AI Card Scanner",
      description: "Snap a photo and let AI identify your card. Add to your collection in seconds.",
      gradient: "bg-gradient-to-br from-rose-500 to-pink-500",
      size: "small" as const,
      accentColor: "#f43f5e"
    },
    {
      icon: Award,
      title: "Set Completion",
      description: "Track your progress on completing sets. See what you need at a glance.",
      gradient: "bg-gradient-to-br from-navy-600 to-navy-400",
      size: "small" as const,
      accentColor: "#14b8a6"
    }
  ];

  const stats = [
    { value: 5, label: "Portfolio Value Tracked", prefix: "$", suffix: "M+", decimals: 0 },
    { value: 50, label: "Cards Managed", suffix: "K+" },
    { value: 4.9, label: "App Store Rating", suffix: "★", decimals: 1 },
  ];

  const testimonials = [
    {
      name: "Jake Morrison",
      role: "Pokémon Collector, 15k+ cards",
      text: "CardLedger is a game-changer. I finally know exactly what my collection is worth and which cards are actually making me money. The P&L tracking alone is worth the subscription.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Sports Card Investor",
      text: "I've tried every tracking app out there. CardLedger's analytics helped me identify which card types give me the best ROI. My returns have increased 40% since I started using it.",
      rating: 5
    },
    {
      name: "Marcus Williams",
      role: "Card Shop Owner",
      text: "The wholesale client list feature alone is worth the Business plan. Managing hundreds of customers has never been easier. This is built by people who actually understand the business.",
      rating: 5
    },
    {
      name: "Alex Rodriguez",
      role: "MTG Collector",
      text: "The grading pipeline tracker saved me from losing track of my PSA submissions. I know exactly where every card is and when to expect it back. Incredible attention to detail.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      period: "forever",
      description: "Perfect for getting started",
      features: [
        { text: "Track up to 100 cards", included: true },
        { text: "5 AI scans per day", included: true },
        { text: "Current prices only", included: true },
        { text: "Basic portfolio value", included: true },
        { text: "Community support", included: true },
        { text: "Price history & trends", included: false },
        { text: "Export & alerts", included: false },
        { text: "Advanced analytics", included: false },
      ]
    },
    {
      name: "Pro",
      monthlyPrice: 7.99,
      annualPrice: 59.99,
      period: "mo",
      description: "For serious collectors",
      popular: true,
      features: [
        { text: "Unlimited cards & scans", included: true },
        { text: "Full price history", included: true },
        { text: "P&L and ROI analytics", included: true },
        { text: "Price alerts", included: true },
        { text: "Export to CSV", included: true },
        { text: "Condition-based pricing", included: true },
        { text: "Unlimited collections", included: true },
        { text: "Priority support", included: true },
      ]
    },
    {
      name: "Lifetime",
      monthlyPrice: 149,
      annualPrice: 149,
      period: "once",
      description: "Pay once, own forever",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "All future updates", included: true },
        { text: "Priority support forever", included: true },
        { text: "Early access to features", included: true },
        { text: "Founding member badge", included: true },
        { text: "No recurring payments", included: true },
        { text: "Best value", included: true },
        { text: "Support indie dev ❤️", included: true },
      ]
    }
  ];

  const faqs = [
    {
      question: "What card types does CardLedger support?",
      answer: "We support all major TCGs including Pokémon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Dragon Ball, Lorcana, and all sports cards (baseball, basketball, football, hockey, soccer). New games and sets are added within 24-48 hours of release."
    },
    {
      question: "How accurate are the price estimates?",
      answer: "Our prices are sourced from real-time eBay sold listings, TCGPlayer market prices, and other major marketplaces. We use a weighted algorithm that prioritizes recent sales to give you the most accurate current market value. Prices update every 15 minutes for Pro users."
    },
    {
      question: "Can I track graded cards from different companies?",
      answer: "Absolutely! CardLedger supports all major grading companies including PSA, BGS/Beckett, CGC, and SGC. You can track raw cards, pending submissions, and graded slabs all in one place. We even adjust valuations based on grade."
    },
    {
      question: "Is my collection data secure?",
      answer: "Yes. We use bank-level AES-256 encryption for all data, both in transit and at rest. Your collection information is stored securely on AWS servers with daily backups. You own your data and can export or delete it anytime. We never share or sell your information."
    },
    {
      question: "What's included in the free tier?",
      answer: "Free users can track up to 100 cards, view basic portfolio value, and access manual price lookups. It's perfect for casual collectors or anyone who wants to try CardLedger before upgrading. No credit card required."
    },
    {
      question: "Is there a mobile app?",
      answer: "Yes! CardLedger is available on iOS and Android. The mobile app includes all features plus barcode scanning for quick card entry, camera-based card recognition, and push notifications for price alerts."
    },
    {
      question: "Can I import my existing collection?",
      answer: "Yes! We support CSV imports from most popular tracking apps and spreadsheets. Our import wizard walks you through mapping your columns to our fields. Most collections can be imported in under 5 minutes."
    },
    {
      question: "What if I'm not satisfied?",
      answer: "We offer a 30-day money-back guarantee on all paid plans. If CardLedger isn't right for you, just email us and we'll refund your purchase, no questions asked. We're confident you'll love it though."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden scroll-smooth">
      
      {/* ============================================ */}
      {/* ANIMATED BACKGROUND */}
      {/* ============================================ */}
      <ParticleField />
      <GradientOrbs />
      <CursorGradient />

      {/* ============================================ */}
      {/* NAVIGATION */}
      {/* ============================================ */}
      <Navigation scrolled={scrolled} />

      {/* ============================================ */}
      {/* LIVE ACTIVITY TOAST - Social Proof */}
      {/* ============================================ */}
      <LiveActivityToast />

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <motion.section 
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-6"
      >
        {/* Aurora Arc - Premium Animated Gradient */}
        <AuroraArc />
        
        {/* Aceternity Spotlight Effect */}
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#627d98"
        />
        
        {/* Background Beams */}
        <BackgroundBeams className="opacity-40" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          {/* Badge with Sparkles */}
          <RevealOnScroll delay={0}>
            <SparklesBadge sparkleColor="#627d98">
              <motion.div 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#627d98]/20 to-[#627d98]/5 border border-[#627d98]/30 mb-8 backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
              >
                <SparklesIcon className="w-4 h-4 text-[#627d98]" />
                <span className="text-sm font-semibold text-[#627d98]">The #1 Portfolio Tracker for Collectors</span>
                <ChevronRight className="w-4 h-4 text-[#627d98]/60" />
              </motion.div>
            </SparklesBadge>
          </RevealOnScroll>

          {/* Main Headline with Text Generate Effect */}
          <RevealOnScroll delay={0.1}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.05]">
              <TextGenerateEffect 
                words="Your Cards"
                className="block text-white"
                duration={0.5}
                staggerDelay={0.08}
              />
              <span className="block mt-2">
                <Sparkles sparkleColor="#34d399" sparkleCount={8}>
                  <span className="bg-gradient-to-r from-[#627d98] via-[#34d399] to-[#6ee7b7] bg-clip-text text-transparent">
                    One Ledger
                  </span>
                </Sparkles>
              </span>
            </h1>
          </RevealOnScroll>

          {/* Subheadline */}
          <RevealOnScroll delay={0.2}>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              <span className="text-white">Track.</span>{" "}
              <span className="text-white">Value.</span>{" "}
              <span className="text-white">Profit.</span>{" "}
              <span className="block mt-2">The smartest portfolio tracker for collectors.</span>
            </p>
          </RevealOnScroll>

          {/* CTA Buttons */}
          <RevealOnScroll delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <MagneticButton onClick={() => navigate("/auth")}>
                <ShineEffect>
                  <Button
                    size="lg"
                    className="h-16 px-10 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#627d98] to-[#059669] hover:from-[#0ea472] hover:to-[#059669] text-black gap-3 shadow-2xl shadow-[#627d98]/30 hover:shadow-[#627d98]/50 transition-all group"
                  >
                    Start Free
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </motion.div>
                  </Button>
                </ShineEffect>
              </MagneticButton>
              
              <Button
                size="lg"
                variant="outline"
                className="h-16 px-10 text-lg font-semibold rounded-2xl bg-white/5 border-[#2a2a2a] hover:bg-white/10 hover:border-[#3a3a3a] text-white gap-3 backdrop-blur-sm"
              >
                <Play className="w-5 h-5 fill-current" />
                See How It Works
              </Button>
            </div>
          </RevealOnScroll>
          
          {/* Social Proof */}
          <RevealOnScroll delay={0.4}>
            <p className="text-sm text-gray-500 mb-12">
              <span className="text-[#627d98] font-semibold">Join 10,000+ collectors</span> who trust CardLedger
            </p>
          </RevealOnScroll>

          {/* Stats */}
          <RevealOnScroll delay={0.5}>
            <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-20 mb-20">
              {stats.map((stat, i) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                    <AnimatedCounter 
                      value={stat.value} 
                      prefix={stat.prefix || ""} 
                      suffix={stat.suffix || ""} 
                      decimals={stat.decimals || 0}
                    />
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          {/* 3D Floating Feature Showcase */}
          <RevealOnScroll delay={0.55}>
            <div className="mb-16">
              <FloatingShowcase />
            </div>
          </RevealOnScroll>

          {/* Hero Mockup */}
          <RevealOnScroll delay={0.6}>
            <div className="relative max-w-5xl mx-auto perspective-1000">
              {/* Main preview window */}
              <motion.div
                initial={{ rotateX: 10 }}
                whileInView={{ rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-[#1a1a1a] shadow-2xl shadow-black/50"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Browser chrome */}
                <div className="bg-[#141414] border-b border-[#1a1a1a] px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-xs text-gray-500 flex items-center gap-2">
                      <Shield className="w-3 h-3 text-[#627d98]" />
                      cardledger.app
                    </div>
                  </div>
                </div>
                
                {/* App preview */}
                <div className="aspect-[16/9] bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                  {/* Dashboard mockup */}
                  <div className="absolute inset-4 md:inset-8 grid grid-cols-12 gap-4 opacity-80">
                    {/* Sidebar */}
                    <div className="col-span-2 bg-[#111111] rounded-xl border border-[#1a1a1a] p-3 hidden md:block">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#627d98] to-[#059669] mb-6" />
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-8 rounded-lg mb-2 ${i === 1 ? 'bg-[#627d98]/20 border border-[#627d98]/30' : 'bg-[#1a1a1a]'}`} />
                      ))}
                    </div>
                    
                    {/* Main content */}
                    <div className="col-span-12 md:col-span-10 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-8 w-48 bg-[#1a1a1a] rounded-lg" />
                          <div className="h-4 w-32 bg-[#141414] rounded-lg" />
                        </div>
                        <div className="h-10 w-32 bg-gradient-to-r from-[#627d98] to-[#059669] rounded-xl" />
                      </div>
                      
                      {/* Stats row */}
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: 'Portfolio Value', value: '$24,847', change: '+12.4%', positive: true },
                          { label: 'Total Cards', value: '847', change: '+23', positive: true },
                          { label: "Today's P&L", value: '+$847', change: '+3.4%', positive: true },
                          { label: 'ROI', value: '+127%', change: 'All time', positive: true },
                        ].map((stat, i) => (
                          <div key={i} className="bg-[#111111] rounded-xl border border-[#1a1a1a] p-4">
                            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                            <div className="text-xl font-bold text-white">{stat.value}</div>
                            <div className={`text-xs ${stat.positive ? 'text-[#627d98]' : 'text-red-400'}`}>{stat.change}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Chart area */}
                      <div className="bg-[#111111] rounded-xl border border-[#1a1a1a] p-4 h-48 flex items-end">
                        <div className="w-full flex items-end gap-2">
                          {[35, 45, 60, 40, 75, 55, 80, 65, 90, 70, 95, 85, 100].map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              whileInView={{ height: `${h}%` }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                              className="flex-1 bg-gradient-to-t from-[#627d98] to-[#34d399] rounded-t"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <FloatingElement 
                className="absolute -left-4 lg:-left-16 top-1/4 hidden md:block" 
                delay={0}
                duration={5}
              >
                <div className="px-5 py-4 rounded-2xl bg-[#111111]/90 border border-[#1a1a1a] shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#627d98] to-[#059669] flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Portfolio Change</p>
                      <p className="text-2xl font-bold text-[#627d98]">+$2,847</p>
                    </div>
                  </div>
                </div>
              </FloatingElement>

              <FloatingElement 
                className="absolute -right-4 lg:-right-16 top-1/3 hidden md:block" 
                delay={0.5}
                duration={4}
              >
                <div className="px-5 py-4 rounded-2xl bg-[#111111]/90 border border-[#1a1a1a] shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <PieChart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">All-time ROI</p>
                      <p className="text-2xl font-bold text-purple-400">+127.4%</p>
                    </div>
                  </div>
                </div>
              </FloatingElement>

              <FloatingElement 
                className="absolute -left-8 lg:-left-20 bottom-1/4 hidden lg:block" 
                delay={1}
                duration={6}
              >
                <div className="px-4 py-3 rounded-xl bg-[#111111]/90 border border-[#1a1a1a] shadow-2xl backdrop-blur-xl flex items-center gap-3">
                  <Bell className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-xs font-medium text-white">Price Alert!</p>
                    <p className="text-xs text-gray-500">Base Set Charizard hit $350</p>
                  </div>
                </div>
              </FloatingElement>

              {/* Glow effect under the preview */}
              <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-[#627d98]/20 rounded-full blur-[100px] pointer-events-none" />
            </div>
          </RevealOnScroll>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-gray-500"
          >
            <MousePointer className="w-5 h-5" />
            <span className="text-xs">Scroll to explore</span>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ============================================ */}
      {/* FEATURES BENTO GRID */}
      {/* ============================================ */}
      <section id="features" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll className="text-center mb-20">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#627d98]/10 border border-[#627d98]/30 mb-6"
            >
              <Zap className="w-4 h-4 text-[#627d98]" />
              <span className="text-sm font-semibold text-[#627d98]">Powerful Features</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-[#627d98] via-[#34d399] to-[#6ee7b7] bg-clip-text text-transparent">
                master your portfolio
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built by collectors, for collectors. Every feature designed to help you make smarter decisions.
            </p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <section id="how-it-works" className="py-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="text-center mb-20">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6"
            >
              <Play className="w-4 h-4 text-blue-400 fill-current" />
              <span className="text-sm font-semibold text-blue-400">How It Works</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Start tracking in{" "}
              <span className="bg-gradient-to-r from-navy-400 via-navy-300 to-navy-400 bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get up and running in under 5 minutes. No complex setup required.
            </p>
          </RevealOnScroll>

          <HowItWorks />
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================ */}
      <section className="py-32 px-6 relative z-10 bg-gradient-to-b from-transparent via-[#080808] to-transparent">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="text-center mb-16">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-6"
            >
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-semibold text-yellow-400">Testimonials</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Loved by{" "}
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                collectors worldwide
              </span>
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
            <TestimonialCarousel testimonials={testimonials} />
          </RevealOnScroll>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING */}
      {/* ============================================ */}
      <section id="pricing" className="py-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#627d98]/10 border border-[#627d98]/30 mb-6"
            >
              <CreditCard className="w-4 h-4 text-[#627d98]" />
              <span className="text-sm font-semibold text-[#627d98]">Simple Pricing</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              One price,{" "}
              <span className="bg-gradient-to-r from-[#627d98] via-[#34d399] to-[#6ee7b7] bg-clip-text text-transparent">
                unlimited value
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start free. Upgrade when you're ready. No hidden fees, ever.
            </p>
          </RevealOnScroll>

          <PricingToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} />

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
            {pricingPlans.map((plan, i) => (
              <PricingCard 
                key={plan.name} 
                {...plan} 
                isAnnual={isAnnual}
                delay={i * 0.1} 
                onSelect={() => navigate("/auth")}
              />
            ))}
          </div>
          
          {/* Trust badges */}
          <RevealOnScroll className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#627d98]" />
              <span className="text-sm">30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#627d98]" />
              <span className="text-sm">No credit card for free tier</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#627d98]" />
              <span className="text-sm">Cancel anytime</span>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ */}
      {/* ============================================ */}
      <section id="faq" className="py-32 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Frequently asked{" "}
              <span className="bg-gradient-to-r from-[#627d98] via-[#34d399] to-[#6ee7b7] bg-clip-text text-transparent">
                questions
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Got questions? We've got answers.
            </p>
          </RevealOnScroll>

          <div className="space-y-1">
            {faqs.map((faq, i) => (
              <FAQItem 
                key={i} 
                {...faq} 
                delay={i * 0.05}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto relative">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[400px] bg-gradient-to-r from-[#627d98]/20 via-[#627d98]/10 to-[#627d98]/20 rounded-full blur-[150px]" />
          </div>
          
          <RevealOnScroll className="relative">
            <BackgroundGradient containerClassName="rounded-3xl" className="rounded-3xl">
            <div className="text-center p-8 md:p-16 rounded-3xl bg-gradient-to-b from-[#111111] to-[#0d0d0d] overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-[#627d98]/50 to-transparent" />
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Ready to upgrade your{" "}
                <span className="bg-gradient-to-r from-[#627d98] via-[#34d399] to-[#6ee7b7] bg-clip-text text-transparent">
                  collection game?
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Join thousands of collectors who trust CardLedger to track, analyze, and profit from their portfolios.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <MagneticButton onClick={() => navigate("/auth")}>
                  <Button
                    size="lg"
                    className="h-16 px-12 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#627d98] to-[#059669] hover:from-[#0ea472] hover:to-[#059669] text-black gap-3 shadow-2xl shadow-[#627d98]/30 hover:shadow-[#627d98]/50 transition-all"
                  >
                    Get Started Free
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </MagneticButton>
              </div>
              
              <p className="text-sm text-gray-500">
                No credit card required • Free forever plan • Setup in 2 minutes
              </p>
              
              {/* App store badges */}
              <div className="flex items-center justify-center gap-4 mt-10">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center gap-3 cursor-pointer"
                >
                  <Smartphone className="w-6 h-6 text-white" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 leading-tight">Download on the</p>
                    <p className="text-sm font-semibold text-white">App Store</p>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center gap-3 cursor-pointer"
                >
                  <Globe className="w-6 h-6 text-white" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 leading-tight">Get it on</p>
                    <p className="text-sm font-semibold text-white">Google Play</p>
                  </div>
                </motion.div>
              </div>
            </div>
            </BackgroundGradient>
          </RevealOnScroll>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-16 px-6 border-t border-[#1a1a1a] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#627d98] via-[#059669] to-[#047857] flex items-center justify-center shadow-lg shadow-[#627d98]/20">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">
                  Card<span className="text-[#627d98]">Ledger</span>
                </span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs mb-6 leading-relaxed">
                The smartest way to track, value, and profit from your card collection. Built by collectors, for collectors.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Twitter, href: "#" },
                  { icon: Instagram, href: "#" },
                  { icon: Youtube, href: "#" },
                  { icon: Mail, href: "#" }
                ].map(({ icon: Icon, href }, i) => (
                  <motion.a 
                    key={i}
                    href={href} 
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 rounded-xl bg-[#111111] border border-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#2a2a2a] hover:bg-[#1a1a1a] transition-all"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'FAQ', 'Changelog'].map(item => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className="text-sm text-gray-500 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                {['Privacy', 'Terms', 'Security', 'Cookies'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Newsletter */}
          <div className="py-8 border-y border-[#1a1a1a] mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-white mb-1">Stay in the loop</h4>
                <p className="text-sm text-gray-500">Get the latest updates on new features and releases.</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 md:w-64 h-12 px-4 rounded-xl bg-[#111111] border border-[#1a1a1a] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#627d98] transition-colors"
                />
                <Button className="h-12 px-6 rounded-xl bg-[#627d98] hover:bg-[#0ea472] text-black font-semibold">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              © 2026 CardLedger. All rights reserved.
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-2">
              Made with <span className="text-red-400">♥</span> for collectors everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
