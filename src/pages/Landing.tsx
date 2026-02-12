import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Scan, 
  TrendingUp, 
  Package, 
  ChevronRight, 
  Sparkles,
  Shield,
  Zap,
  BarChart3,
  Camera,
  Bell,
  Share2,
  Layers,
  CheckCircle2,
  Star,
  ArrowRight,
  Play,
  ChevronDown,
  Image as ImageIcon,
  PieChart,
  LineChart,
  Smartphone,
  Globe,
  Lock,
  Users,
  Award,
  Target
} from "lucide-react";

// Animated counter component
const AnimatedCounter = ({ value, duration = 2000, prefix = "", suffix = "" }: { 
  value: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// Typewriter effect
const TypewriterText = ({ words, className }: { words: string[]; className?: string }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[currentWordIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(word.substring(0, currentText.length + 1));
        if (currentText === word) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setCurrentText(word.substring(0, currentText.length - 1));
        if (currentText === "") {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// Floating card component for hero
const FloatingCard = ({ 
  children, 
  className, 
  delay = 0,
  duration = 4
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  duration?: number;
}) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-10, 10, -10] }}
    transition={{ 
      duration, 
      repeat: Infinity, 
      ease: "easeInOut",
      delay
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// TCG Logo component
const TCGLogos = () => {
  const logos = [
    { name: "Pokémon", color: "#FFCB05" },
    { name: "Magic: The Gathering", color: "#F0A500" },
    { name: "Yu-Gi-Oh!", color: "#9B59B6" },
    { name: "One Piece", color: "#E74C3C" },
    { name: "Sports Cards", color: "#3498DB" },
    { name: "Dragon Ball", color: "#F39C12" },
    { name: "Digimon", color: "#2ECC71" },
    { name: "Flesh & Blood", color: "#E91E63" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
      {logos.map((logo, i) => (
        <motion.div
          key={logo.name}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="px-4 py-2 rounded-full bg-card/30 border border-border/30 backdrop-blur-sm"
        >
          <span className="text-sm font-medium text-muted-foreground">{logo.name}</span>
        </motion.div>
      ))}
    </div>
  );
};

// Feature card component
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  gradient,
  delay = 0 
}: { 
  icon: any; 
  title: string; 
  description: string;
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="group relative p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm overflow-hidden"
  >
    {/* Gradient glow on hover */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient} blur-xl`} />
    
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// Pricing card component
const PricingCard = ({ 
  name, 
  price, 
  period, 
  features, 
  popular = false,
  delay = 0
}: { 
  name: string; 
  price: string; 
  period: string;
  features: string[];
  popular?: boolean;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className={`relative p-6 rounded-2xl border backdrop-blur-sm ${
      popular 
        ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/10' 
        : 'bg-card/50 border-border/50'
    }`}
  >
    {popular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
        Most Popular
      </div>
    )}
    
    <div className="text-center mb-6">
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground">/{period}</span>
      </div>
    </div>
    
    <ul className="space-y-3 mb-6">
      {features.map((feature, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    
    <Button 
      className={`w-full ${popular ? '' : 'variant-outline'}`}
      variant={popular ? "default" : "outline"}
    >
      Get Started
    </Button>
  </motion.div>
);

// FAQ item component
const FAQItem = ({ question, answer, delay = 0 }: { question: string; answer: string; delay?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="border-b border-border/50"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-medium">{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-muted-foreground text-sm leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Landing component
const Landing = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      } else {
        setIsLoading(false);
      }
    });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  const features = [
    {
      icon: Camera,
      title: "AI Card Scanner",
      description: "Snap a photo and instantly identify any card. Our AI recognizes sets, variants, and conditions with 99%+ accuracy.",
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-500"
    },
    {
      icon: TrendingUp,
      title: "Real-Time Prices",
      description: "Track market values across all major marketplaces. See price history, trends, and get alerts when values change.",
      gradient: "bg-gradient-to-br from-emerald-500 to-green-500"
    },
    {
      icon: ImageIcon,
      title: "Slab Generator",
      description: "Generate professional graded slab mockups for PSA, BGS, CGC, and more. Perfect for listings and social media.",
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500"
    },
    {
      icon: PieChart,
      title: "Portfolio Analytics",
      description: "Beautiful dashboards showing your collection's performance, category breakdown, and top movers.",
      gradient: "bg-gradient-to-br from-orange-500 to-red-500"
    },
    {
      icon: Bell,
      title: "Price Alerts",
      description: "Set custom alerts for any card. Get notified instantly when prices hit your targets.",
      gradient: "bg-gradient-to-br from-yellow-500 to-amber-500"
    },
    {
      icon: Share2,
      title: "Easy Sharing",
      description: "Share your collection with beautiful public pages, QR codes, or export for insurance and taxes.",
      gradient: "bg-gradient-to-br from-indigo-500 to-violet-500"
    }
  ];

  const stats = [
    { value: 50000, label: "Cards Tracked", suffix: "+" },
    { value: 99, label: "Scan Accuracy", suffix: "%" },
    { value: 2, label: "Portfolio Value", prefix: "$", suffix: "M+" },
    { value: 15, label: "TCGs Supported", suffix: "+" }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Pokemon Collector",
      text: "Finally an app that actually understands card variants. The slab generator alone is worth it.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Sports Card Vendor",
      text: "Switched from spreadsheets to CardLedger. My inventory management is 10x faster now.",
      rating: 5
    },
    {
      name: "Sarah Williams",
      role: "MTG Investor",
      text: "The price alerts have helped me catch so many deals. Best investment tracking app I've used.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "What card types does CardLedger support?",
      answer: "We support all major TCGs including Pokémon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Dragon Ball, sports cards (baseball, basketball, football, hockey), and many more. We're constantly adding new sets and games."
    },
    {
      question: "How accurate is the card scanner?",
      answer: "Our AI-powered scanner achieves 99%+ accuracy on card identification. It can recognize sets, variants, parallel versions, and even estimate card condition. For graded cards, simply enter the cert number for instant verification."
    },
    {
      question: "How does the slab generator work?",
      answer: "Add any card to your collection with a grade (PSA, BGS, CGC, SGC, etc.) and we'll generate a photorealistic slab mockup image. Perfect for social media, listings, or visualizing your collection."
    },
    {
      question: "Is my collection data secure?",
      answer: "Absolutely. We use bank-level encryption and never share your data. Your collection information is stored securely and you can export or delete it anytime."
    },
    {
      question: "Can I track purchase prices and profits?",
      answer: "Yes! Track what you paid for each card, and we'll calculate your profit/loss based on current market values. Perfect for collectors who also flip cards."
    },
    {
      question: "What's included in the free tier?",
      answer: "Free users can track up to 100 cards, use basic scanning, and access market prices. Pro users get unlimited cards, price alerts, the slab generator, and advanced analytics."
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "Track up to 100 cards",
        "Basic card scanning",
        "Market price lookup",
        "1 collection",
        "Community support"
      ]
    },
    {
      name: "Pro",
      price: "$6.99",
      period: "month",
      popular: true,
      features: [
        "Unlimited cards",
        "AI-powered scanning",
        "Price alerts",
        "Slab generator",
        "Portfolio analytics",
        "Unlimited collections",
        "Export to CSV/PDF",
        "Priority support"
      ]
    },
    {
      name: "Business",
      price: "$14.99",
      period: "month",
      features: [
        "Everything in Pro",
        "Bulk import/export",
        "Team collaboration",
        "API access",
        "Custom branding",
        "Tax reports",
        "Dedicated support"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[200px]" />
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[200px]" />
      </div>

      {/* Grid pattern */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-xl bg-background/80 border-b border-border/30"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/brand/logo-dark.jpg" 
              alt="CardLedger" 
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="text-xl font-bold tracking-tight">
              Card<span className="text-primary">Ledger</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:flex">
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center pt-20 px-6"
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">The #1 Collectibles Portfolio App</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.05]"
          >
            Your Cards.
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              One Ledger.
            </span>
          </motion.h1>

          {/* Subheadline with typewriter */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8"
          >
            Track{" "}
            <TypewriterText 
              words={["Pokémon", "Magic", "Yu-Gi-Oh!", "Sports Cards", "One Piece"]} 
              className="text-foreground font-semibold"
            />{" "}
            and know exactly what your collection is worth—in real time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="h-14 px-8 text-lg font-semibold rounded-2xl gap-2 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all group"
            >
              Start Free Today
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold rounded-2xl border-border/50 hover:bg-card/50 gap-2"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Live stats counter */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-16"
          >
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold">
                  <AnimatedCounter 
                    value={stat.value} 
                    prefix={stat.prefix || ""} 
                    suffix={stat.suffix || ""} 
                  />
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Hero image with floating elements */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="relative max-w-5xl mx-auto"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-primary/10 to-transparent rounded-3xl blur-3xl scale-95" />
            
            {/* Main app preview */}
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-border/30 shadow-2xl">
              <img
                src="/brand/marketing-hero.jpg"
                alt="CardLedger Dashboard"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            {/* Floating cards */}
            <FloatingCard 
              className="absolute -left-8 top-1/4 hidden lg:block"
              delay={0}
            >
              <div className="glass-card px-4 py-3 rounded-xl border border-border/50 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">24h Change</p>
                    <p className="text-lg font-bold text-emerald-500">+$1,247.50</p>
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard 
              className="absolute -right-8 top-1/3 hidden lg:block"
              delay={0.5}
            >
              <div className="glass-card px-4 py-3 rounded-xl border border-border/50 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Scan className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Just Scanned</p>
                    <p className="text-sm font-bold">Charizard VMAX</p>
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard 
              className="absolute left-1/4 -bottom-4 hidden lg:block"
              delay={1}
              duration={5}
            >
              <div className="glass-card px-4 py-3 rounded-xl border border-primary/30 shadow-xl bg-primary/10">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">Price alert triggered!</p>
                </div>
              </div>
            </FloatingCard>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* TCG Logos Section */}
      <section className="py-20 px-6 border-y border-border/30 bg-card/20">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground mb-8"
          >
            Supporting all major trading card games
          </motion.p>
          <TCGLogos />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to
              <br />
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                master your collection
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools for collectors, investors, and vendors. Track, analyze, and grow your portfolio.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Slab Generator Showcase */}
      <section className="py-24 px-6 bg-card/20 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-medium mb-4">
                <Award className="w-4 h-4" />
                Exclusive Feature
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Generate{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Slab Mockups
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Add any card with a grade and instantly generate photorealistic slab images. Perfect for listings, social media, or visualizing future grading results.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: CheckCircle2, text: "PSA, BGS, CGC, SGC & more" },
                  { icon: CheckCircle2, text: "All grades from 1-10" },
                  { icon: CheckCircle2, text: "Subgrade support for BGS/CGC" },
                  { icon: CheckCircle2, text: "Export as PNG for sharing" }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <item.icon className="w-5 h-5 text-purple-400" />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Placeholder for slab mockup preview */}
              <div className="relative aspect-[3/4] rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-border/50 flex items-center justify-center">
                <div className="text-center p-8">
                  <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <p className="text-lg font-medium">Slab Generator Preview</p>
                  <p className="text-sm text-muted-foreground">Coming in V3</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                collectors
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of collectors who trust CardLedger
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card/50 border border-border/50"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-card/20 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple,{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                transparent
              </span>{" "}
              pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you're ready
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, i) => (
              <PricingCard key={plan.name} {...plan} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently asked{" "}
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                questions
              </span>
            </h2>
          </motion.div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <FAQItem key={i} {...faq} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to track your
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              collection?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of collectors who use CardLedger to track, analyze, and grow their portfolios.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="h-16 px-10 text-lg font-semibold rounded-2xl gap-2 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all group"
          >
            Get Started Free
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required • Free forever plan available
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/brand/logo-dark.jpg" 
                alt="CardLedger" 
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="font-bold">CardLedger</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2026 CardLedger. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
