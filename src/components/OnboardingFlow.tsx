import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  Scan,
  TrendingUp,
  Bell,
  ChevronRight,
  ChevronLeft,
  X,
  Package,
  BarChart3,
  Zap,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentStep: number;
  onStepChange: (step: number) => void;
}

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features?: { icon: React.ReactNode; text: string }[];
  gradient: string;
  illustration: React.ReactNode;
}

const STEPS: OnboardingStep[] = [
  {
    title: "Welcome to CardLedger",
    subtitle: "Your Premium Collection Manager",
    description:
      "Track your trading cards, monitor prices in real-time, and make smarter collecting decisions.",
    icon: <Sparkles className="w-8 h-8" />,
    gradient: "from-primary via-primary/80 to-chart-4",
    features: [
      { icon: <Package className="w-4 h-4" />, text: "Unlimited collection tracking" },
      { icon: <TrendingUp className="w-4 h-4" />, text: "Real-time price monitoring" },
      { icon: <Shield className="w-4 h-4" />, text: "Secure cloud backup" },
    ],
    illustration: (
      <div className="relative w-48 h-48 mx-auto">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/30 to-chart-4/30 rounded-3xl blur-2xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-4 bg-gradient-to-br from-primary to-chart-4 rounded-2xl flex items-center justify-center"
          initial={{ rotateY: -20, rotateX: 10 }}
          animate={{
            rotateY: [-20, 0, -20],
            rotateX: [10, 5, 10],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Logo size="lg" className="drop-shadow-2xl" />
        </motion.div>
        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    title: "Add Your First Card",
    subtitle: "Multiple Ways to Build Your Collection",
    description:
      "Use our AI-powered scanner, barcode reader, or search millions of cards to add them instantly.",
    icon: <Scan className="w-8 h-8" />,
    gradient: "from-emerald-500 via-emerald-400 to-teal-500",
    features: [
      { icon: <Sparkles className="w-4 h-4" />, text: "AI card recognition" },
      { icon: <Scan className="w-4 h-4" />, text: "Barcode & PSA cert scanner" },
      { icon: <Search className="w-4 h-4" />, text: "Search millions of cards" },
    ],
    illustration: (
      <div className="relative w-48 h-48 mx-auto">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-3xl blur-2xl"
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Card stack animation */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-xl border border-white/20"
            style={{
              width: 100 - i * 10,
              height: 140 - i * 10,
              left: `calc(50% - ${(100 - i * 10) / 2}px)`,
              top: `calc(50% - ${(140 - i * 10) / 2}px + ${i * 8}px)`,
              zIndex: 3 - i,
            }}
            initial={{ opacity: 0, y: 50, rotateZ: (i - 1) * 5 }}
            animate={{
              opacity: 1,
              y: 0,
              rotateZ: (i - 1) * 5,
            }}
            transition={{ delay: 0.2 + i * 0.15 }}
          >
            {i === 0 && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-10 h-10 text-emerald-400" />
              </motion.div>
            )}
          </motion.div>
        ))}
        {/* Scanner line */}
        <motion.div
          className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
          style={{ top: "50%" }}
          animate={{
            y: [-40, 40, -40],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    ),
  },
  {
    title: "Track Your Portfolio",
    subtitle: "Watch Your Collection Grow",
    description:
      "See your total value, daily changes, and performance over time with beautiful analytics.",
    icon: <BarChart3 className="w-8 h-8" />,
    gradient: "from-chart-4 via-violet-500 to-purple-600",
    features: [
      { icon: <TrendingUp className="w-4 h-4" />, text: "Portfolio performance" },
      { icon: <BarChart3 className="w-4 h-4" />, text: "Historical charts" },
      { icon: <Zap className="w-4 h-4" />, text: "Daily value updates" },
    ],
    illustration: (
      <div className="relative w-48 h-48 mx-auto">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-chart-4/30 to-purple-600/30 rounded-3xl blur-2xl"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Chart animation */}
        <svg
          viewBox="0 0 200 150"
          className="absolute inset-0 w-full h-full p-6"
          fill="none"
        >
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <motion.line
              key={i}
              x1="20"
              x2="180"
              y1={30 + i * 30}
              y2={30 + i * 30}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            />
          ))}
          {/* Chart line */}
          <motion.path
            d="M20,100 Q50,90 70,80 T100,50 T130,60 T160,30 L180,25"
            stroke="url(#chartGradient)"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />
          {/* Glow effect */}
          <motion.path
            d="M20,100 Q50,90 70,80 T100,50 T130,60 T160,30 L180,25"
            stroke="url(#chartGradient)"
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            opacity={0.3}
            filter="blur(4px)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          {/* End dot */}
          <motion.circle
            cx="180"
            cy="25"
            r="6"
            fill="#a855f7"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.8 }}
          />
          <motion.circle
            cx="180"
            cy="25"
            r="12"
            fill="#a855f7"
            opacity={0.3}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ delay: 1.8, duration: 1.5, repeat: Infinity }}
          />
        </svg>
        {/* Value badge */}
        <motion.div
          className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-success/20 border border-success/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          <span className="text-success font-bold text-sm">+24.5%</span>
        </motion.div>
      </div>
    ),
  },
  {
    title: "Set Price Alerts",
    subtitle: "Never Miss a Deal",
    description:
      "Get notified when card prices hit your targets. Buy low, sell high with confidence.",
    icon: <Bell className="w-8 h-8" />,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    features: [
      { icon: <Bell className="w-4 h-4" />, text: "Price drop alerts" },
      { icon: <TrendingUp className="w-4 h-4" />, text: "Price spike notifications" },
      { icon: <Zap className="w-4 h-4" />, text: "Instant push alerts" },
    ],
    illustration: (
      <div className="relative w-48 h-48 mx-auto">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-red-500/30 rounded-3xl blur-2xl"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Bell with ring animation */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            rotate: [0, -5, 5, -5, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <div className="relative">
            <motion.div
              className="absolute -inset-4 bg-amber-500/30 rounded-full"
              animate={{
                scale: [1, 1.4, 1.8],
                opacity: [0.6, 0.3, 0],
              }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            />
            <motion.div
              className="absolute -inset-2 bg-amber-500/40 rounded-full"
              animate={{
                scale: [1, 1.3, 1.6],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, repeatDelay: 1 }}
            />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl">
              <Bell className="w-10 h-10 text-white" />
            </div>
          </div>
        </motion.div>
        {/* Notification badges */}
        {[
          { text: "Charizard -15%", color: "bg-red-500", x: 10, y: 20, delay: 0.5 },
          { text: "Pikachu +8%", color: "bg-emerald-500", x: 130, y: 40, delay: 1 },
          { text: "Target hit!", color: "bg-primary", x: 30, y: 130, delay: 1.5 },
        ].map((notif, i) => (
          <motion.div
            key={i}
            className={`absolute px-2 py-1 rounded-lg ${notif.color} text-white text-xs font-medium shadow-lg`}
            style={{ left: notif.x, top: notif.y }}
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 1, 0.8],
              y: [10, 0, 0, -10],
            }}
            transition={{
              duration: 3,
              delay: notif.delay,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            {notif.text}
          </motion.div>
        ))}
      </div>
    ),
  },
];

export function OnboardingFlow({
  isOpen,
  onComplete,
  onSkip,
  currentStep,
  onStepChange,
}: OnboardingFlowProps) {
  const [direction, setDirection] = useState(1);
  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setDirection(1);
      onStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setDirection(-1);
      onStepChange(currentStep - 1);
    }
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    onStepChange(index);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onSkip}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-md mx-4 bg-card rounded-3xl overflow-hidden shadow-2xl border border-border/50"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Skip button */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="p-8 pt-12"
                >
                  {/* Illustration */}
                  <div className="mb-8">{step.illustration}</div>

                  {/* Text content */}
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h2 className="text-2xl font-bold tracking-tight">
                        {step.title}
                      </h2>
                      <p
                        className={`text-sm font-medium bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}
                      >
                        {step.subtitle}
                      </p>
                    </motion.div>

                    <motion.p
                      className="text-muted-foreground text-sm leading-relaxed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {step.description}
                    </motion.p>

                    {/* Features */}
                    {step.features && (
                      <motion.div
                        className="flex flex-wrap justify-center gap-2 pt-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {step.features.map((feature, i) => (
                          <motion.div
                            key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-xs font-medium"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                          >
                            <span className="text-primary">{feature.icon}</span>
                            {feature.text}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom section */}
            <div className="p-6 pt-0 space-y-4">
              {/* Progress dots */}
              <div className="flex justify-center gap-2">
                {STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className="relative p-1"
                  >
                    <motion.div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep
                          ? "bg-primary"
                          : index < currentStep
                          ? "bg-primary/50"
                          : "bg-muted"
                      }`}
                      animate={{
                        scale: index === currentStep ? 1.2 : 1,
                      }}
                    />
                    {index === currentStep && (
                      <motion.div
                        className="absolute inset-0 m-auto w-4 h-4 rounded-full border-2 border-primary"
                        layoutId="activeDot"
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={isFirstStep}
                  className="flex-1 h-12 rounded-xl gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className={`flex-1 h-12 rounded-xl gap-2 bg-gradient-to-r ${step.gradient} hover:opacity-90 transition-opacity text-white border-0`}
                >
                  {isLastStep ? (
                    <>
                      Get Started
                      <Sparkles className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
