import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Search, TrendingUp, PieChart, Sparkles, ChevronRight, ChevronLeft,
  Layers, Camera, Bell, Shield, BarChart3, Zap
} from "lucide-react";

const ONBOARDING_FLAG = "cardledger-onboarding-complete";

interface OnboardingScreen {
  icon: React.ElementType;
  accentIcon1: React.ElementType;
  accentIcon2: React.ElementType;
  color: string;
  colorBg: string;
  colorGlow: string;
  headline: string;
  subline: string;
}

const screens: OnboardingScreen[] = [
  {
    icon: Layers,
    accentIcon1: Search,
    accentIcon2: Camera,
    color: "text-blue-400",
    colorBg: "bg-blue-500/15",
    colorGlow: "rgba(59, 130, 246, 0.15)",
    headline: "Track Every Card",
    subline: "Pokémon · Sports · Yu-Gi-Oh · Magic · One Piece",
  },
  {
    icon: TrendingUp,
    accentIcon1: BarChart3,
    accentIcon2: Bell,
    color: "text-emerald-400",
    colorBg: "bg-emerald-500/15",
    colorGlow: "rgba(16, 185, 129, 0.15)",
    headline: "Live Market Prices",
    subline: "Real-time values from TCGPlayer, eBay & more",
  },
  {
    icon: PieChart,
    accentIcon1: Zap,
    accentIcon2: Shield,
    color: "text-violet-400",
    colorBg: "bg-violet-500/15",
    colorGlow: "rgba(139, 92, 246, 0.15)",
    headline: "Know Your P&L",
    subline: "Track profits, ROI, and portfolio performance",
  },
  {
    icon: Sparkles,
    accentIcon1: TrendingUp,
    accentIcon2: Layers,
    color: "text-amber-400",
    colorBg: "bg-amber-500/15",
    colorGlow: "rgba(245, 158, 11, 0.15)",
    headline: "Ready to Start",
    subline: "Search, scan, or import — your way",
  },
];

export const markOnboardingComplete = () => {
  localStorage.setItem(ONBOARDING_FLAG, "true");
};

export const hasCompletedOnboarding = () => {
  return localStorage.getItem(ONBOARDING_FLAG) === "true";
};

// Animated icon composition — clean, no AI images
const IconComposition = ({ screen, index }: { screen: OnboardingScreen; index: number }) => {
  const Icon = screen.icon;
  const Accent1 = screen.accentIcon1;
  const Accent2 = screen.accentIcon2;
  
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Glow ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 rounded-full"
        style={{ 
          background: `radial-gradient(circle, ${screen.colorGlow} 0%, transparent 70%)`,
        }}
      />
      
      {/* Orbiting accent icons */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute top-2 right-4"
        >
          <div className={`w-10 h-10 rounded-xl ${screen.colorBg} flex items-center justify-center backdrop-blur-sm border border-white/5`}>
            <Accent1 className={`w-5 h-5 ${screen.color}`} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute bottom-4 left-2"
        >
          <div className={`w-8 h-8 rounded-lg ${screen.colorBg} flex items-center justify-center backdrop-blur-sm border border-white/5`}>
            <Accent2 className={`w-4 h-4 ${screen.color}`} />
          </div>
        </motion.div>
      </motion.div>

      {/* Main icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className={`w-24 h-24 rounded-3xl ${screen.colorBg} flex items-center justify-center backdrop-blur-sm border border-white/10 relative z-10`}
        style={{ boxShadow: `0 8px 40px ${screen.colorGlow}` }}
      >
        <Icon className={`w-12 h-12 ${screen.color}`} strokeWidth={1.5} />
      </motion.div>

      {/* Floating dots */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0],
            y: [0, -20, -40],
            x: [(i - 1) * 30, (i - 1) * 40, (i - 1) * 30],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            delay: i * 0.8,
            ease: "easeOut"
          }}
          className={`absolute bottom-8 w-1.5 h-1.5 rounded-full`}
          style={{ backgroundColor: screen.colorGlow.replace('0.15', '0.6') }}
        />
      ))}
    </div>
  );
};

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [direction, setDirection] = useState(1);
  const isLast = currentScreen === screens.length - 1;

  const handleNext = () => {
    if (isLast) {
      markOnboardingComplete();
      navigate("/auth");
    } else {
      setDirection(1);
      setCurrentScreen((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentScreen > 0) {
      setDirection(-1);
      setCurrentScreen((s) => s - 1);
    }
  };

  const handleSkip = () => {
    markOnboardingComplete();
    navigate("/auth");
  };

  const screen = screens[currentScreen];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      {/* Animated ambient glow */}
      <motion.div
        key={currentScreen}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: screen.colorGlow }}
        />
      </motion.div>

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center text-center flex-1 justify-center">
        {/* Skip */}
        {!isLast && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleSkip}
            className="absolute top-0 right-0 text-sm text-muted-foreground/60 hover:text-foreground transition-colors font-medium"
          >
            Skip
          </motion.button>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentScreen}
            custom={direction}
            initial={(dir: number) => ({ opacity: 0, x: dir * 50 })}
            animate={{ opacity: 1, x: 0 }}
            exit={(dir: number) => ({ opacity: 0, x: dir * -50 })}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center"
          >
            {/* Icon composition */}
            <div className="mb-10">
              <IconComposition screen={screen} index={currentScreen} />
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              {screen.headline}
            </h1>

            {/* Subline — short and punchy */}
            <p className="text-muted-foreground text-base max-w-xs">
              {screen.subline}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-12 mb-8">
          {screens.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentScreen ? 1 : -1);
                setCurrentScreen(i);
              }}
              className="relative rounded-full transition-all duration-300"
              style={{
                width: i === currentScreen ? 28 : 8,
                height: 8,
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: i === currentScreen 
                    ? 'hsl(var(--primary))' 
                    : 'hsl(var(--muted-foreground) / 0.2)',
                }}
                animate={{ scale: i === currentScreen ? 1 : 0.85 }}
                transition={{ duration: 0.3 }}
              />
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 w-full">
          {currentScreen > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="rounded-2xl h-14 px-6 bg-secondary/20 border-border/20 hover:bg-secondary/40"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleNext}
            className="rounded-2xl h-14 flex-1 text-base font-semibold"
          >
            {isLast ? "Get Started" : "Continue"}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
