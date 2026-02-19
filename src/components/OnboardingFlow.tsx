import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, PieChart, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";

const ONBOARDING_FLAG = "cardledger-onboarding-complete";

interface OnboardingScreen {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  gradientFrom: string;
  gradientTo: string;
  headline: string;
  description: string;
  image: string;
  imageAlt: string;
}

const screens: OnboardingScreen[] = [
  {
    icon: Search,
    iconColor: "text-primary",
    iconBg: "bg-primary/15",
    gradientFrom: "from-primary/20",
    gradientTo: "to-blue-600/5",
    headline: "Track Your Collection",
    description:
      "Add cards from any game — Pokemon, sports, Yu-Gi-Oh, Magic, and more. Import from CSV or search our database of thousands of cards.",
    image: "/assets/onboard-track.png",
    imageAlt: "Track your card collection",
  },
  {
    icon: TrendingUp,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/15",
    gradientFrom: "from-emerald-500/20",
    gradientTo: "to-green-600/5",
    headline: "Get Live Prices",
    description:
      "See real-time market values from TCGPlayer, eBay, and more. Know exactly what your collection is worth — updated every day.",
    image: "/assets/onboard-price.png",
    imageAlt: "Live card pricing",
  },
  {
    icon: PieChart,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/15",
    gradientFrom: "from-violet-500/20",
    gradientTo: "to-purple-600/5",
    headline: "Analyze Performance",
    description:
      "Track your wins, calculate FIFO profits, and see your portfolio over time. Understand which cards are making you money.",
    image: "/assets/onboard-profit.png",
    imageAlt: "Profit analytics",
  },
  {
    icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/15",
    gradientFrom: "from-amber-500/20",
    gradientTo: "to-yellow-600/5",
    headline: "Start Collecting",
    description:
      "You're all set! Search for your first card, import a CSV, or add one manually. Your collection journey starts now.",
    image: "/assets/onboard-scan.png",
    imageAlt: "Start scanning cards",
  },
];

export const markOnboardingComplete = () => {
  localStorage.setItem(ONBOARDING_FLAG, "true");
};

export const hasCompletedOnboarding = () => {
  return localStorage.getItem(ONBOARDING_FLAG) === "true";
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

  const goToScreen = (i: number) => {
    setDirection(i > currentScreen ? 1 : -1);
    setCurrentScreen(i);
  };

  const screen = screens[currentScreen];

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 60, scale: 0.96 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -60, scale: 0.96 }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated ambient glow — changes color per step */}
      <motion.div
        key={currentScreen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial ${screen.gradientFrom} ${screen.gradientTo} to-transparent rounded-full blur-[160px]`} />
      </motion.div>

      {/* Welcome background image on first screen */}
      {currentScreen === 0 && (
        <>
          <img
            src="/assets/onboard-welcome.png"
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-background/70 pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-12 text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-medium text-muted-foreground tracking-widest uppercase"
            >
              Welcome to
            </motion.p>
          </motion.div>
        </>
      )}

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center text-center flex-1 justify-center">
        {/* Skip button */}
        {!isLast && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleSkip}
            className="absolute top-0 right-0 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Skip onboarding"
          >
            Skip
          </motion.button>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentScreen}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center"
          >
            {/* Step image with icon fallback */}
            <motion.div
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/10 dark:to-white/5 rounded-3xl blur-xl scale-110" />
              <div
                className={`relative w-40 h-40 rounded-3xl ${screen.iconBg} flex items-center justify-center backdrop-blur-sm border border-white/10 dark:border-white/10 overflow-hidden`}
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)' }}
              >
                <img
                  src={screen.image}
                  alt={screen.imageAlt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <screen.icon className={`w-14 h-14 ${screen.iconColor} absolute`} style={{ display: 'none' }} />
              </div>
            </motion.div>

            {/* Headline */}
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {screen.headline}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground text-base leading-relaxed max-w-xs">
              {screen.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots — animated pill style */}
        <div className="flex items-center gap-2 mt-10 mb-8" role="tablist" aria-label="Onboarding progress">
          {screens.map((_, i) => (
            <button
              key={i}
              onClick={() => goToScreen(i)}
              role="tab"
              aria-selected={i === currentScreen}
              aria-label={`Go to step ${i + 1} of ${screens.length}`}
              className="relative rounded-full transition-all duration-300"
              style={{
                width: i === currentScreen ? 32 : 10,
                height: 10,
              }}
            >
              <motion.div
                layoutId={undefined}
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: i === currentScreen ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)',
                }}
                animate={{
                  scale: i === currentScreen ? 1 : 0.8,
                }}
                transition={{ duration: 0.3 }}
              />
            </button>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 w-full">
          {currentScreen > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="rounded-xl h-12 px-5 backdrop-blur-sm bg-secondary/30 border-border/30"
              aria-label="Go to previous step"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleNext}
            className="rounded-xl h-12 flex-1 text-base font-medium relative overflow-hidden"
            aria-label={isLast ? "Complete onboarding" : "Go to next step"}
          >
            <span className="relative z-10 flex items-center justify-center gap-1">
              {isLast ? "Let's Go!" : "Continue"}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
