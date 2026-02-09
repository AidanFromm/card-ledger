import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Shield, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

const Index = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'loading' | 'verifying' | 'ready'>('loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is logged in, go to dashboard
        setPhase('ready');
        setTimeout(() => navigate("/dashboard"), 600);
      } else {
        // Start the loading sequence
        startLoadingSequence();
      }
    });
  }, [navigate]);

  const startLoadingSequence = () => {
    // Phase 1: Loading animation (0-70%)
    const loadingDuration = 800;
    const startTime = Date.now();

    const animateLoading = () => {
      const elapsed = Date.now() - startTime;
      const loadProgress = Math.min((elapsed / loadingDuration) * 70, 70);
      setProgress(loadProgress);

      if (elapsed < loadingDuration) {
        requestAnimationFrame(animateLoading);
      } else {
        // Phase 2: Verifying (70-100%)
        setPhase('verifying');
        animateVerifying();
      }
    };

    requestAnimationFrame(animateLoading);
  };

  const animateVerifying = () => {
    const verifyDuration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const verifyProgress = 70 + Math.min((elapsed / verifyDuration) * 30, 30);
      setProgress(verifyProgress);

      if (elapsed < verifyDuration) {
        requestAnimationFrame(animate);
      } else {
        // Phase 3: Ready
        setPhase('ready');
        setTimeout(() => navigate("/auth"), 400);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient gradient backgrounds */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-primary/8 rounded-full blur-[100px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-12"
        >
          {/* Logo with glow effect */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-32 h-32 rounded-full transition-all duration-700 ${
                phase === 'ready'
                  ? 'bg-primary/30 blur-3xl scale-150'
                  : 'bg-primary/15 blur-2xl scale-100'
              }`} />
            </div>
            <div className="relative flex justify-center">
              <Logo size={80} showText={false} />
            </div>
          </motion.div>

          {/* App Name */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2"
          >
            Card Ledger
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-muted-foreground text-sm md:text-base"
          >
            Track Your Cards. Know Your Worth.
          </motion.p>
        </motion.div>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="w-full max-w-xs"
        >
          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full
                glass-card border border-border/50 text-sm font-medium
                transition-all duration-500
              `}
            >
              {phase === 'ready' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500">Ready</span>
                </>
              ) : (
                <>
                  <Shield className={`w-4 h-4 ${phase === 'verifying' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={phase === 'verifying' ? 'text-primary' : 'text-muted-foreground'}>
                    {phase === 'verifying' ? 'Securing...' : 'Loading...'}
                  </span>
                </>
              )}
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-1.5 bg-secondary/50 rounded-full overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full transition-colors duration-300 ${
                phase === 'ready' ? 'bg-emerald-500' : 'bg-primary'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
            {/* Shimmer effect */}
            {phase !== 'ready' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
          </div>

          {/* Progress Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground mt-3 tabular-nums"
          >
            {Math.round(progress)}%
          </motion.p>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="absolute bottom-8 text-center"
        >
          <p className="text-[11px] text-muted-foreground/60 tracking-wide">
            Your collection, secured
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
