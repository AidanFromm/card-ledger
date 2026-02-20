import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// ============================================
// PARTICLE FIELD - Subtle Floating Particles
// ============================================
export const ParticleField = () => {
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
    
    // Create particles - reduced count for performance
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.25 + 0.05,
        hue: Math.random() * 30 + 155
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
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 50%, ${p.opacity})`;
        ctx.fill();
        
        // Connect nearby particles
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.04 * (1 - dist / 120)})`;
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
// AURORA ARC - Animated Gradient Sweep
// ============================================
export const AuroraArc = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50" style={{ zIndex: 1 }}>
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: '200%', height: '200%' }}
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
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
// CURSOR GRADIENT - Interactive Glow
// ============================================
export const CursorGradient = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
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

// ============================================
// GRADIENT ORBS - Ambient Background
// ============================================
export const GradientOrbs = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-60" style={{ zIndex: 0 }}>
    <motion.div
      animate={{
        x: [0, 50, 0],
        y: [0, -25, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full"
      style={{
        background: `radial-gradient(circle, rgba(98, 125, 152, 0.12) 0%, transparent 60%)`,
        filter: 'blur(60px)',
      }}
    />
    <motion.div
      animate={{
        x: [0, -30, 0],
        y: [0, 40, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full"
      style={{
        background: `radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 60%)`,
        filter: 'blur(60px)',
      }}
    />
  </div>
);
