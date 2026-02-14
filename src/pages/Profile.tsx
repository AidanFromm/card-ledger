import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Moon,
  Sun,
  Monitor,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  MessageSquare,
  CreditCard,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Lock,
  Trash2,
  Download,
  Star,
  Check,
  Crown,
  Sparkles,
  BookOpen,
  Heart,
  Layers,
  ArrowLeftRight,
  Settings,
  List,
  Trophy,
  Package,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useAchievements } from "@/hooks/useAchievements";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { OnboardingFlow } from "@/components/OnboardingFlow";

type SheetType = "notifications" | "privacy" | "help" | "feedback" | "subscription" | null;

// Bottom Sheet Component
const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-border/50">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// FAQ Item Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="px-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-medium pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground pb-4">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  
  // Inventory and achievements for stats
  const { items } = useInventoryDb();
  const { level, completedAchievements, totalXp } = useAchievements();
  
  // Calculate quick stats
  const stats = useMemo(() => {
    const unsoldItems = items.filter(item => !item.sale_price);
    const totalCards = unsoldItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = unsoldItems.reduce((sum, item) => {
      const price = item.market_price || item.purchase_price;
      return sum + (price * item.quantity);
    }, 0);
    return { totalCards, totalValue };
  }, [items]);
  
  // Onboarding state
  const {
    shouldShow: showOnboarding,
    currentStep: onboardingStep,
    setStep: setOnboardingStep,
    completeOnboarding,
    skipOnboarding,
    showOnboarding: triggerShowOnboarding,
    hideOnboarding,
  } = useOnboarding(1); // Pass 1 to prevent auto-trigger

  // Notification states
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [portfolioUpdates, setPortfolioUpdates] = useState(true);
  const [newFeatures, setNewFeatures] = useState(true);
  const [marketing, setMarketing] = useState(false);

  // Feedback state
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/auth");
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    }
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Contact Support",
      description: "To delete your account, please email cardledger.llc@gmail.com",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your data export will be ready shortly.",
    });
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      toast({
        variant: "destructive",
        title: "Feedback required",
        description: "Please enter your feedback.",
      });
      return;
    }

    toast({
      title: "Thank you!",
      description: "Your feedback has been submitted.",
    });
    setFeedbackText("");
    setFeedbackRating(0);
    setActiveSheet(null);
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const handleShowOnboarding = () => {
    triggerShowOnboarding();
    setOnboardingStep(0);
  };

  const menuItems = [
    {
      icon: Bell,
      label: "Notifications",
      description: "Manage alerts & updates",
      sheet: "notifications" as SheetType
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      description: "Account protection",
      sheet: "privacy" as SheetType
    },
    {
      icon: CreditCard,
      label: "Subscription",
      description: "Manage your plan",
      sheet: "subscription" as SheetType
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      description: "FAQs and contact us",
      sheet: "help" as SheetType
    },
    {
      icon: MessageSquare,
      label: "Send Feedback",
      description: "Help us improve",
      sheet: "feedback" as SheetType
    },
  ];

  const extraMenuItems = [
    {
      icon: Settings,
      label: "Settings",
      description: "Profile, preferences & data",
      action: () => navigate("/settings"),
    },
    {
      icon: List,
      label: "Client Lists",
      description: "Create shareable lists for buyers",
      action: () => navigate("/lists"),
    },
    {
      icon: Heart,
      label: "Wishlist",
      description: "Cards you want to collect",
      action: () => navigate("/wishlist"),
    },
    {
      icon: ArrowLeftRight,
      label: "Trading Hub",
      description: "Trade cards with other collectors",
      action: () => navigate("/trade"),
    },
    {
      icon: Layers,
      label: "Set Completion",
      description: "Track your set progress",
      action: () => navigate("/sets"),
    },
    {
      icon: BookOpen,
      label: "App Tutorial",
      description: "Replay the welcome guide",
      action: handleShowOnboarding,
    },
  ];

  const faqs = [
    {
      question: "How do I add cards to my collection?",
      answer: "Use the Search tab to find cards, then tap 'Add' to add them to your inventory. You can also manually add cards from the Inventory page."
    },
    {
      question: "How are card prices calculated?",
      answer: "We aggregate prices from multiple sources including TCGPlayer, eBay sold listings, and market data to provide accurate valuations."
    },
    {
      question: "Can I export my collection?",
      answer: "Yes! Go to Inventory, tap the menu icon, and select 'Export'. You can export as CSV or JSON."
    },
    {
      question: "How do I track sales and profits?",
      answer: "When you sell a card, use the 'Sell' option to record the sale. Your profits are automatically calculated and shown in Analytics."
    },
    {
      question: "What grading companies are supported?",
      answer: "We support PSA, BGS, CGC, SGC, TAG, and ACE grading companies, as well as raw (ungraded) cards."
    },
  ];

  const subscriptionPlans = [
    {
      name: "Free Trial",
      price: "$0",
      period: "7 days",
      features: ["Unlimited cards", "Price tracking", "Basic analytics", "Export to CSV"],
      current: true,
      badge: "Current"
    },
    {
      name: "Personal",
      price: "$4.99",
      period: "/month",
      features: ["Everything in Free", "Advanced analytics", "Price alerts", "Priority support"],
      recommended: true
    },
    {
      name: "Business",
      price: "$14.99",
      period: "/month",
      features: ["Everything in Personal", "Unlimited client lists", "Bulk import", "API access", "Team features"],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="ios-title-large">Profile</h1>
          </motion.div>

          {/* User Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5 mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {user?.email || "Loading..."}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Free Trial
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-medium">
                    6 days left
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Cards</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalCards.toLocaleString()}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Value</span>
              </div>
              <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Level</span>
              </div>
              <p className="text-2xl font-bold">{level.level}</p>
            </div>
            <button 
              onClick={() => navigate('/achievements')}
              className="glass-card p-4 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Achievements</span>
              </div>
              <p className="text-2xl font-bold">{completedAchievements.length}</p>
            </button>
          </motion.div>

          {/* Theme Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-5 mb-6"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Appearance
            </h3>
            <div className="ios-segment">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  data-active={theme === value}
                  className="ios-segment-item flex items-center justify-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Menu Items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card overflow-hidden mb-6"
          >
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => setActiveSheet(item.sheet)}
                className={`
                  w-full flex items-center gap-4 p-4 text-left
                  hover:bg-secondary/50 transition-colors tap-scale
                  ${index !== menuItems.length - 1 ? 'border-b border-border/50' : ''}
                `}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </motion.div>

          {/* Extra Menu Items (Tutorial, etc.) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="glass-card overflow-hidden mb-6"
          >
            {extraMenuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`
                  w-full flex items-center gap-4 p-4 text-left
                  hover:bg-secondary/50 transition-colors tap-scale
                  ${index !== extraMenuItems.length - 1 ? 'border-b border-border/50' : ''}
                `}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </motion.div>

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-14 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </motion.div>

          {/* App Version */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            Card Ledger v1.0.0
          </motion.p>
        </main>
      </PageTransition>

      {/* Notifications Sheet */}
      <BottomSheet
        isOpen={activeSheet === "notifications"}
        onClose={() => setActiveSheet(null)}
        title="Notifications"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Price Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when watchlist prices change</p>
            </div>
            <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Portfolio Updates</p>
              <p className="text-sm text-muted-foreground">Weekly portfolio summary</p>
            </div>
            <Switch checked={portfolioUpdates} onCheckedChange={setPortfolioUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Features</p>
              <p className="text-sm text-muted-foreground">Updates and new feature announcements</p>
            </div>
            <Switch checked={newFeatures} onCheckedChange={setNewFeatures} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing</p>
              <p className="text-sm text-muted-foreground">Tips, promotions, and offers</p>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} />
          </div>

          <Button
            className="w-full h-12 rounded-xl mt-4"
            onClick={() => {
              toast({ title: "Settings saved", description: "Your notification preferences have been updated." });
              setActiveSheet(null);
            }}
          >
            Save Preferences
          </Button>
        </div>
      </BottomSheet>

      {/* Privacy & Security Sheet */}
      <BottomSheet
        isOpen={activeSheet === "privacy"}
        onClose={() => setActiveSheet(null)}
        title="Privacy & Security"
      >
        <div className="space-y-4">
          <button
            onClick={handleChangePassword}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">Send password reset email</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={handleExportData}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-500/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-navy-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Export My Data</p>
              <p className="text-sm text-muted-foreground">Download all your data</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </BottomSheet>

      {/* Help & Support Sheet */}
      <BottomSheet
        isOpen={activeSheet === "help"}
        onClose={() => setActiveSheet(null)}
        title="Help & Support"
      >
        <div className="space-y-6">
          {/* Contact */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Contact Us</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Have a question? Send us an email and we'll get back to you.
            </p>
            <a
              href="mailto:cardledger.llc@gmail.com"
              className="text-primary text-sm font-medium hover:underline"
            >
              cardledger.llc@gmail.com
            </a>
          </div>

          {/* FAQs */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Frequently Asked Questions
            </h3>
            <div className="rounded-xl bg-secondary/30 border border-border/50 overflow-hidden">
              <div className="divide-y divide-border/50">
                {faqs.map((faq, index) => (
                  <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Send Feedback Sheet */}
      <BottomSheet
        isOpen={activeSheet === "feedback"}
        onClose={() => setActiveSheet(null)}
        title="Send Feedback"
      >
        <div className="space-y-6">
          {/* Rating */}
          <div>
            <Label className="text-sm font-medium">How would you rate Card Ledger?</Label>
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFeedbackRating(rating)}
                  className={`flex-1 h-12 rounded-xl border-2 transition-all ${
                    feedbackRating >= rating
                      ? "border-amber-500 bg-amber-500/20"
                      : "border-border/50 hover:border-primary/50"
                  }`}
                >
                  <Star
                    className={`w-5 h-5 mx-auto ${
                      feedbackRating >= rating
                        ? "text-amber-500 fill-amber-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm font-medium">
              What could we improve?
            </Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[120px] rounded-xl bg-secondary/30 border-border/50"
            />
          </div>

          <Button
            onClick={handleSubmitFeedback}
            className="w-full h-12 rounded-xl"
          >
            Submit Feedback
          </Button>
        </div>
      </BottomSheet>

      {/* Subscription Sheet */}
      <BottomSheet
        isOpen={activeSheet === "subscription"}
        onClose={() => setActiveSheet(null)}
        title="Subscription"
      >
        <div className="space-y-4">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                plan.current
                  ? "border-primary bg-primary/5"
                  : plan.recommended
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-border/50"
              }`}
            >
              {/* Badges */}
              {plan.badge && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                  {plan.badge}
                </span>
              )}
              {plan.recommended && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500 text-white flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Recommended
                </span>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                {plan.current && (
                  <div className="flex items-center gap-1 text-primary text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Active
                  </div>
                )}
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-navy-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {!plan.current && (
                <Button
                  className={`w-full h-10 mt-4 rounded-xl ${
                    plan.recommended
                      ? "bg-amber-500 hover:bg-amber-600"
                      : ""
                  }`}
                  variant={plan.recommended ? "default" : "outline"}
                >
                  {plan.recommended ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Upgrade to {plan.name}
                    </span>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              )}
            </div>
          ))}

          <p className="text-xs text-muted-foreground text-center pt-2">
            Cancel anytime. Prices in USD.
          </p>
        </div>
      </BottomSheet>

      <BottomNav />

      {/* Onboarding Flow Modal */}
      <OnboardingFlow
        isOpen={showOnboarding}
        onComplete={() => {
          completeOnboarding();
          hideOnboarding();
          toast({
            title: "Tutorial complete!",
            description: "You're all set to start using CardLedger.",
          });
        }}
        onSkip={() => {
          hideOnboarding();
        }}
        currentStep={onboardingStep}
        onStepChange={setOnboardingStep}
      />
    </div>
  );
};

export default Profile;
