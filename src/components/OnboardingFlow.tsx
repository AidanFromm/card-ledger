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
  headline: string;
  description: string;
}

const screens: OnboardingScreen[] = [
  {
    icon: Search,
    iconColor: "text-primary",
    iconBg: "bg-primary/15",
    headline: "Track Your Collection",
    description:
      "Add cards from any game — Pokemon, sports, Yu-Gi-Oh, Magic, and more. Import from CSV or search our database of thousands of cards.",
  },
  {
    icon: TrendingUp,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/15",
    headline: "Get Live Prices",
    description:
      "See real-time market values from TCGPlayer, eBay, and more. Know exactly what your collection is worth — updated every day.",
  },
  {
    icon: PieChart,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/15",
    headline: "Analyze Performance",
    description:
      "Track your wins, calculate FIFO profits, and see your portfolio over time. Understand which cards are making you money.",
  },
  {
    icon: Sparkles,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/15",
    headline: "Start Collecting",
    description:
      "You're all set! Search for your first card, import a CSV, or add one manually. Your collection journey starts now.",
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
  const isLast = currentScreen === screens.length - 1;

  const handleNext = () => {
    if (isLast) {
      markOnboardingComplete();
      navigate("/auth");
    } else {
      setCurrentScreen((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentScreen > 0) setCurrentScreen((s) => s - 1);
  };

  const handleSkip = () => {
    markOnboardingComplete();
    navigate("/auth");
  };

  const screen = screens[currentScreen];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center text-center flex-1 justify-center">
        {/* Skip button */}
        {!isLast && (
          <button
            onClick={handleSkip}
            className="absolute top-0 right-0 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            {/* Illustration area */}
            <div
              className={`w-28 h-28 rounded-3xl ${screen.iconBg} flex items-center justify-center mb-8`}
            >
              <screen.icon className={`w-14 h-14 ${screen.iconColor}`} />
            </div>

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

        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-10 mb-8">
          {screens.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentScreen(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentScreen
                  ? "w-8 h-2.5 bg-primary"
                  : "w-2.5 h-2.5 bg-muted-foreground/30"
              }`}
              aria-label={`Go to screen ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 w-full">
          {currentScreen > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="rounded-xl h-12 px-5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleNext}
            className="rounded-xl h-12 flex-1 text-base font-medium"
          >
            {isLast ? "Let's Go!" : "Continue"}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
