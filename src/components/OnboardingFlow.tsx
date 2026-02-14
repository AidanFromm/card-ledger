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
  Check,
  Camera,
  User,
  Plus,
  PartyPopper,
  Layers,
  Trophy,
  Star,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentStep: number;
  onStepChange: (step: number) => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features?: { icon: React.ReactNode; text: string }[];
  gradient: string;
  illustration: React.ReactNode;
  interactive?: boolean;
}

// Collection Categories
const COLLECTION_CATEGORIES = [
  { id: "pokemon", label: "Pokémon", emoji: "⚡", color: "from-yellow-500 to-amber-500" },
  { id: "sports", label: "Sports Cards", emoji: "🏀", color: "from-orange-500 to-red-500" },
  { id: "mtg", label: "Magic: The Gathering", emoji: "🧙", color: "from-purple-500 to-indigo-500" },
  { id: "yugioh", label: "Yu-Gi-Oh!", emoji: "🃏", color: "from-blue-500 to-cyan-500" },
  { id: "one-piece", label: "One Piece", emoji: "🏴‍☠️", color: "from-red-500 to-pink-500" },
  { id: "lorcana", label: "Disney Lorcana", emoji: "✨", color: "from-indigo-500 to-purple-500" },
  { id: "other", label: "Other TCGs", emoji: "🎴", color: "from-gray-500 to-gray-600" },
];

// Feature Tour Items
const FEATURE_TOUR = [
  {
    icon: Scan,
    title: "AI Card Scanner",
    description: "Snap a photo and we'll identify your card instantly",
    color: "from-navy-600 to-navy-500",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Prices",
    description: "Track market values from TCGplayer, eBay, and more",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: BarChart3,
    title: "Portfolio Analytics",
    description: "Beautiful charts showing your collection's growth",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Bell,
    title: "Price Alerts",
    description: "Get notified when cards hit your target price",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Layers,
    title: "Set Completion",
    description: "Track your progress completing entire sets",
    color: "from-cyan-500 to-blue-500",
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [featureTourIndex, setFeatureTourIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Auto-cycle feature tour
  useEffect(() => {
    if (currentStep === 4) {
      const interval = setInterval(() => {
        setFeatureTourIndex((prev) => (prev + 1) % FEATURE_TOUR.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  // Confetti effect on final step
  useEffect(() => {
    if (currentStep === 5 && isOpen) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, isOpen]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const STEPS: OnboardingStep[] = [
    // Step 0: Welcome
    {
      id: "welcome",
      title: "Welcome to CardLedger",
      subtitle: "Your Cards | One Ledger",
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
    // Step 1: What do you collect?
    {
      id: "categories",
      title: "What do you collect?",
      subtitle: "Select your card types",
      description: "Choose the types of cards you collect. You can always change this later.",
      icon: <Layers className="w-8 h-8" />,
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      interactive: true,
      illustration: (
        <div className="w-full px-4">
          <div className="grid grid-cols-2 gap-3">
            {COLLECTION_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <motion.button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`
                    relative p-4 rounded-2xl border-2 transition-all
                    ${
                      isSelected
                        ? `border-primary bg-gradient-to-br ${category.color} bg-opacity-20`
                        : "border-border/50 bg-secondary/30 hover:border-primary/50"
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSelected && (
                    <motion.div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                  <span className="text-2xl mb-2 block">{category.emoji}</span>
                  <span className="text-sm font-medium">{category.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ),
    },
    // Step 2: Quick Profile
    {
      id: "profile",
      title: "Quick Profile Setup",
      subtitle: "Let's personalize your experience",
      description: "Add your name and an optional avatar to get started.",
      icon: <User className="w-8 h-8" />,
      gradient: "from-navy-700 via-navy-500 to-navy-400",
      interactive: true,
      illustration: (
        <div className="w-full px-4 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <motion.label
              className="relative cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-dashed border-primary/50 flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </motion.label>
            <p className="text-xs text-muted-foreground mt-2">Tap to add photo</p>
          </div>

          {/* Display Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              className="h-12 rounded-xl text-center text-lg"
            />
          </div>
        </div>
      ),
    },
    // Step 3: Add First Card
    {
      id: "first-card",
      title: "Add Your First Card",
      subtitle: "Get started in seconds",
      description:
        "Use our AI scanner, search by name, or scan a barcode. It only takes a moment!",
      icon: <Scan className="w-8 h-8" />,
      gradient: "from-navy-600 via-navy-500 to-navy-400",
      features: [
        { icon: <Sparkles className="w-4 h-4" />, text: "AI card recognition" },
        { icon: <Scan className="w-4 h-4" />, text: "Barcode & PSA cert scanner" },
        { icon: <Search className="w-4 h-4" />, text: "Search millions of cards" },
      ],
      illustration: (
        <div className="relative w-48 h-48 mx-auto">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-navy-500/30 to-navy-500/30 rounded-3xl blur-2xl"
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
                  <Plus className="w-10 h-10 text-navy-400" />
                </motion.div>
              )}
            </motion.div>
          ))}
          {/* Scan line */}
          <motion.div
            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-navy-400 to-transparent"
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
    // Step 4: Features Tour
    {
      id: "features",
      title: "Powerful Features",
      subtitle: "Everything you need",
      description: "Discover the tools that make CardLedger your ultimate collection companion.",
      icon: <Star className="w-8 h-8" />,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      illustration: (
        <div className="w-full px-4">
          <div className="relative">
            {/* Feature Cards */}
            <div className="relative h-40 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featureTourIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-0 p-6 rounded-2xl bg-gradient-to-br ${FEATURE_TOUR[featureTourIndex].color}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      {(() => { const Icon = FEATURE_TOUR[featureTourIndex].icon; return <Icon className="w-6 h-6 text-white" />; })()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {FEATURE_TOUR[featureTourIndex].title}
                      </h3>
                      <p className="text-sm text-white/80 mt-1">
                        {FEATURE_TOUR[featureTourIndex].description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {FEATURE_TOUR.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeatureTourIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === featureTourIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Step 5: You're Ready!
    {
      id: "ready",
      title: "You're All Set!",
      subtitle: "Let's start collecting",
      description: "Your CardLedger is ready. Start building your collection today!",
      icon: <Trophy className="w-8 h-8" />,
      gradient: "from-navy-700 via-navy-600 to-navy-500",
      illustration: (
        <div className="relative w-48 h-48 mx-auto">
          {/* Confetti Effect */}
          {showConfetti && (
            <>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: [
                      "#FFD700",
                      "#FF6B6B",
                      "#4ECDC4",
                      "#A78BFA",
                      "#F472B6",
                    ][i % 5],
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 20) * (80 + Math.random() * 40),
                    y: Math.sin((i * Math.PI * 2) / 20) * (80 + Math.random() * 40),
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}

          {/* Trophy/Success Illustration */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-navy-500/30 rounded-3xl blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-4 bg-gradient-to-br from-navy-600 to-navy-500 rounded-2xl flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <motion.div
              animate={{
                y: [0, -5, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <PartyPopper className="w-20 h-20 text-white drop-shadow-lg" />
            </motion.div>
          </motion.div>

          {/* Floating hearts */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${20 + i * 30}%`,
                bottom: "20%",
              }}
              animate={{
                y: [-20, -60],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: i * 0.5,
                repeat: Infinity,
              }}
            >
              <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
            </motion.div>
          ))}
        </div>
      ),
    },
  ];

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      // Save onboarding data
      const onboardingData = {
        categories: selectedCategories,
        displayName,
        avatarUrl: avatarPreview,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem("cardledger_onboarding_data", JSON.stringify(onboardingData));
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

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Categories
        return selectedCategories.length > 0;
      case 2: // Profile
        return true; // Optional
      default:
        return true;
    }
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
            className="relative w-full max-w-md mx-4 bg-card rounded-3xl overflow-hidden shadow-2xl border border-border/50 max-h-[90vh] flex flex-col"
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
            <div className="relative overflow-hidden flex-1">
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
                  <div className="mb-6">{step.illustration}</div>

                  {/* Text content */}
                  <div className="text-center space-y-3">
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

                    {!step.interactive && (
                      <motion.p
                        className="text-muted-foreground text-sm leading-relaxed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {step.description}
                      </motion.p>
                    )}

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
                  disabled={!canProceed()}
                  className={`flex-1 h-12 rounded-xl gap-2 bg-gradient-to-r ${step.gradient} hover:opacity-90 transition-opacity text-white border-0`}
                >
                  {isLastStep ? (
                    <>
                      Let's Go!
                      <Sparkles className="w-4 h-4" />
                    </>
                  ) : currentStep === 3 ? (
                    <>
                      Skip for Now
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      {currentStep === 1 && selectedCategories.length === 0
                        ? "Select at least one"
                        : "Continue"}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Skip text */}
              {currentStep < STEPS.length - 1 && (
                <button
                  onClick={onSkip}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip onboarding
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
