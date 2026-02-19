import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { hasCompletedOnboarding } from "@/components/OnboardingFlow";

// Floating holographic card component
const FloatingCard = ({ delay, x, y, rotation, size }: { delay: number; x: string; y: string; rotation: number; size: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: x, top: y, width: size, height: size * 1.4 }}
    initial={{ opacity: 0, scale: 0.5, rotate: rotation - 15 }}
    animate={{
      opacity: [0, 0.2, 0.2, 0],
      scale: [0.5, 1, 1, 0.8],
      rotate: [rotation - 15, rotation, rotation + 5, rotation + 10],
      y: [0, -30, -60, -90],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <div
      className="w-full h-full rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(0,116,251,0.18), rgba(140,80,255,0.1), rgba(0,116,251,0.15))',
        border: '1px solid rgba(0,116,251,0.12)',
        backdropFilter: 'blur(4px)',
      }}
    />
  </motion.div>
);

// Animated ring component
const PulseRing = ({ delay, size }: { delay: number; size: number }) => (
  <motion.div
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
    style={{ width: size, height: size, border: '1px solid hsl(212 100% 49% / 0.08)' }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 1.6] }}
    transition={{ duration: 3, delay, repeat: Infinity, ease: "easeOut" }}
  />
);

const Index = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  const navigateAway = useCallback((target: string) => {
    setTimeout(() => navigate(target), 2000);
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigateAway("/dashboard");
      } else if (!hasCompletedOnboarding()) {
        navigateAway("/onboarding");
      } else {
        navigateAway("/auth");
      }
    });

    return () => clearTimeout(timer);
  }, [navigateAway]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Multi-layer ambient backgrounds */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(212 100% 49% / 0.14) 0%, transparent 65%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(260 80% 60% / 0.08) 0%, transparent 60%)' }}
          animate={{ scale: [1.1, 0.9, 1.1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent" />
      </div>

      {/* Pulse rings behind logo */}
      <PulseRing delay={0} size={200} />
      <PulseRing delay={1} size={300} />
      <PulseRing delay={2} size={400} />

      {/* Floating holographic cards */}
      <FloatingCard delay={0} x="8%" y="18%" rotation={-15} size={65} />
      <FloatingCard delay={1.5} x="78%" y="12%" rotation={12} size={55} />
      <FloatingCard delay={3} x="15%" y="65%" rotation={-8} size={48} />
      <FloatingCard delay={2} x="72%" y="55%" rotation={20} size={58} />
      <FloatingCard delay={4} x="42%" y="78%" rotation={-5} size={42} />
      <FloatingCard delay={0.5} x="88%" y="38%" rotation={10} size={50} />
      <FloatingCard delay={2.5} x="55%" y="10%" rotation={-12} size={44} />

      {/* Main content — Apple product reveal style */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        {/* Logo icon — scales in with spring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={showContent ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className="relative mb-8"
        >
          {/* Glow behind logo */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="w-44 h-44 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, hsl(212 100% 49% / 0.25), hsl(260 80% 60% / 0.1))' }} />
          </motion.div>
          <div className="relative">
            <Logo size={96} showText={false} animated />
          </div>
        </motion.div>

        {/* App name — gradient text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-4xl md:text-5xl font-bold tracking-tight mb-3"
        >
          <span className="text-foreground">Card</span>
          <span className="text-gradient-hero">Ledger</span>
        </motion.h1>

        {/* Tagline — fades in */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-muted-foreground text-base md:text-lg font-medium"
        >
          Track Your Cards. Know Your Worth.
        </motion.p>

        {/* Minimal loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 1, duration: 0.4 }}
          className="mt-12"
        >
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/60"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="absolute bottom-8 text-[11px] text-muted-foreground/40 tracking-widest uppercase"
        >
          CardLedger
        </motion.p>
      </div>
    </div>
  );
};

export default Index;
