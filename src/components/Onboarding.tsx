import { useState, useEffect, useCallback } from "react";
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
  Play,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { OnboardingStep } from "@/components/OnboardingStep";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Storage keys
const ONBOARDING_KEY = "cardledger_onboarding_complete";
const ONBOARDING_STEP_KEY = "cardledger_onboarding_step";
const DEMO_MODE_KEY = "cardledger_demo_mode";

// Sample demo cards for "Try Demo Mode"
const DEMO_CARDS = [
  {
    name: "Charizard VMAX Rainbow Rare",
    set_name: "Champion's Path",
    game: "Pokemon",
    rarity: "Secret Rare",
    purchase_price: 250,
    market_price: 385,
    quantity: 1,
    card_image_url: "https://images.pokemontcg.io/swsh35/74_hires.png",
    condition: "Near Mint",
  },
  {
    name: "Pikachu VMAX",
    set_name: "Vivid Voltage",
    game: "Pokemon",
    rarity: "Ultra Rare",
    purchase_price: 45,
    market_price: 62,
    quantity: 2,
    card_image_url: "https://images.pokemontcg.io/swsh4/44_hires.png",
    condition: "Near Mint",
  },
  {
    name: "Black Lotus",
    set_name: "Alpha",
    game: "Magic: The Gathering",
    rarity: "Rare",
    purchase_price: 35000,
    market_price: 45000,
    quantity: 1,
    card_image_url: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg",
    condition: "Good",
  },
  {
    name: "Shiny Umbreon V",
    set_name: "Evolving Skies",
    game: "Pokemon",
    rarity: "Alt Art",
    purchase_price: 180,
    market_price: 220,
    quantity: 1,
    card_image_url: "https://images.pokemontcg.io/swsh7/215_hires.png",
    condition: "Near Mint",
  },
  {
    name: "Blue-Eyes White Dragon (1st Ed)",
    set_name: "Legend of Blue Eyes",
    game: "Yu-Gi-Oh!",
    rarity: "Ultra Rare",
    purchase_price: 1200,
    market_price: 1850,
    quantity: 1,
    card_image_url: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
    condition: "Light Play",
  },
];

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

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onDemoMode?: () => void;
}

export function Onboarding({
  isOpen,
  onComplete,
  onSkip,
  currentStep,
  onStepChange,
  onDemoMode,
}: OnboardingProps) {
  const navigate = useNavigate();
  const [direction, setDirection] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [featureTourIndex, setFeatureTourIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const TOTAL_STEPS = 6;

  // Auto-cycle feature tour
  useEffect(() => {
    if (currentStep === 4 && isOpen) {
      const interval = setInterval(() => {
        setFeatureTourIndex((prev) => (prev + 1) % FEATURE_TOUR.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentStep, isOpen]);

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

  // Try Demo Mode - Load sample cards into the collection
  const handleDemoMode = useCallback(async () => {
    setIsLoadingDemo(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Insert demo cards into database
        const demoItems = DEMO_CARDS.map((card) => ({
          user_id: session.user.id,
          name: card.name,
          set_name: card.set_name,
          game: card.game,
          rarity: card.rarity,
          purchase_price: card.purchase_price,
          market_price: card.market_price,
          quantity: card.quantity,
          card_image_url: card.card_image_url,
          condition: card.condition,
          purchase_date: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("inventory_items")
          .insert(demoItems);

        if (error) {
          console.error("Failed to insert demo cards:", error);
          // Still mark demo mode
        }
      }

      // Mark demo mode in localStorage
      localStorage.setItem(DEMO_MODE_KEY, "true");
      localStorage.setItem(ONBOARDING_KEY, "true");

      // Callback if provided
      onDemoMode?.();
      
      // Complete onboarding
      onComplete();

    } catch (error) {
      console.error("Demo mode error:", error);
    } finally {
      setIsLoadingDemo(false);
    }
  }, [onComplete, onDemoMode]);

  const handleNext = () => {
    if (currentStep === TOTAL_STEPS - 1) {
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
    if (currentStep > 0) {
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
      default:
        return true;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;

  if (!isOpen) return null;

  // Step content renderer
  const renderStepContent = () => {
    switch (currentStep) {
      // Step 0: Welcome with Demo Mode option
      case 0:
        return (
          <div className="p-8 pt-12">
            {/* Illustration */}
            <div className="relative w-48 h-48 mx-auto mb-6">
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

            {/* Content */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome to CardLedger
                </h2>
                <p className="text-sm font-medium bg-gradient-to-r from-primary via-primary/80 to-chart-4 bg-clip-text text-transparent">
                  Your Cards | One Ledger
                </p>
              </motion.div>

              <motion.p
                className="text-muted-foreground text-sm leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Track your trading cards, monitor prices in real-time, and make smarter collecting decisions.
              </motion.p>

              {/* Key Features */}
              <motion.div
                className="flex flex-wrap justify-center gap-2 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { icon: <Package className="w-4 h-4" />, text: "Unlimited collection tracking" },
                  { icon: <TrendingUp className="w-4 h-4" />, text: "Real-time price monitoring" },
                  { icon: <Shield className="w-4 h-4" />, text: "Secure cloud backup" },
                ].map((feature, i) => (
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

              {/* Try Demo Mode Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="pt-4"
              >
                <Button
                  variant="outline"
                  onClick={handleDemoMode}
                  disabled={isLoadingDemo}
                  className="gap-2 h-11 px-6 rounded-xl border-dashed border-primary/50 hover:border-primary hover:bg-primary/10"
                >
                  {isLoadingDemo ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="w-4 h-4" />
                      </motion.div>
                      Loading Demo...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Try Demo Mode
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Load 5 sample cards to explore the app instantly
                </p>
              </motion.div>
            </div>
          </div>
        );

      // Step 1: Categories
      case 1:
        return (
          <div className="p-8 pt-12">
            <div className="text-center mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold tracking-tight">What do you collect?</h2>
                <p className="text-sm font-medium bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Select your card types
                </p>
              </motion.div>
            </div>
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
        );

      // Step 2: Profile setup
      case 2:
        return (
          <div className="p-8 pt-12">
            <div className="text-center mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold tracking-tight">Quick Profile Setup</h2>
                <p className="text-sm font-medium bg-gradient-to-r from-navy-700 via-navy-500 to-navy-400 bg-clip-text text-transparent">
                  Let's personalize your experience
                </p>
              </motion.div>
            </div>

            <div className="space-y-6">
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
          </div>
        );

      // Step 3: Add First Card
      case 3:
        return (
          <div className="p-8 pt-12">
            <div className="relative w-48 h-48 mx-auto mb-6">
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

            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold tracking-tight">Add Your First Card</h2>
                <p className="text-sm font-medium bg-gradient-to-r from-navy-600 via-navy-500 to-navy-400 bg-clip-text text-transparent">
                  Get started in seconds
                </p>
              </motion.div>

              <motion.p
                className="text-muted-foreground text-sm leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Use our AI scanner, search by name, or scan a barcode. It only takes a moment!
              </motion.p>

              <motion.div
                className="flex flex-wrap justify-center gap-2 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {[
                  { icon: <Sparkles className="w-4 h-4" />, text: "AI card recognition" },
                  { icon: <Scan className="w-4 h-4" />, text: "Barcode & PSA cert scanner" },
                  { icon: <Search className="w-4 h-4" />, text: "Search millions of cards" },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-xs font-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <span className="text-primary">{feature.icon}</span>
                    {feature.text}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        );

      // Step 4: Features Tour
      case 4:
        return (
          <div className="p-8 pt-12">
            <div className="text-center mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold tracking-tight">Powerful Features</h2>
                <p className="text-sm font-medium bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Everything you need
                </p>
              </motion.div>
            </div>

            <div className="relative">
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
                        {(() => {
                          const Icon = FEATURE_TOUR[featureTourIndex].icon;
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
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

              <div className="flex justify-center gap-2 mt-4">
                {FEATURE_TOUR.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFeatureTourIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === featureTourIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      // Step 5: Ready!
      case 5:
        return (
          <div className="p-8 pt-12">
            <div className="relative w-48 h-48 mx-auto mb-6">
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

            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold tracking-tight">You're All Set!</h2>
                <p className="text-sm font-medium bg-gradient-to-r from-navy-700 via-navy-600 to-navy-500 bg-clip-text text-transparent">
                  Let's start collecting
                </p>
              </motion.div>

              <motion.p
                className="text-muted-foreground text-sm leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Your CardLedger is ready. Start building your collection today!
              </motion.p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Get gradient for current step
  const getStepGradient = () => {
    const gradients = [
      "from-primary via-primary/80 to-chart-4",
      "from-violet-500 via-purple-500 to-fuchsia-500",
      "from-navy-700 via-navy-500 to-navy-400",
      "from-navy-600 via-navy-500 to-navy-400",
      "from-amber-500 via-orange-500 to-red-500",
      "from-navy-700 via-navy-600 to-navy-500",
    ];
    return gradients[currentStep] || gradients[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onSkip}
          />

          {/* Modal */}
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
                {renderStepContent()}
              </AnimatePresence>
            </div>

            {/* Bottom section */}
            <div className="p-6 pt-0 space-y-4">
              {/* Progress dots */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
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
                  className={`flex-1 h-12 rounded-xl gap-2 bg-gradient-to-r ${getStepGradient()} hover:opacity-90 transition-opacity text-white border-0`}
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
              {currentStep < TOTAL_STEPS - 1 && (
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

export default Onboarding;
