import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  ChevronRight, 
  Sparkles,
  BarChart3,
  Bell,
  CheckCircle2,
  Star,
  ArrowRight,
  ChevronDown,
  PieChart,
  LineChart,
  Users,
  Package,
  ShoppingCart,
  Layers,
  Award,
  ChevronLeft,
  Download,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  ExternalLink
} from "lucide-react";

// ============================================
// ANIMATED COMPONENTS
// ============================================

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

// Floating animation wrapper
const FloatingElement = ({ 
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
    animate={{ y: [-8, 8, -8] }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// Staggered reveal animation
const RevealOnScroll = ({ 
  children, 
  delay = 0,
  className = ""
}: { 
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// FEATURE CARD
// ============================================

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
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="group relative p-6 rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden hover:border-[#10b981]/50 transition-all duration-300"
  >
    {/* Glow effect on hover */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${gradient}`} />
    
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// ============================================
// PRICING CARD
// ============================================

const PricingCard = ({ 
  name, 
  price, 
  period, 
  description,
  features, 
  popular = false,
  delay = 0,
  onSelect
}: { 
  name: string; 
  price: string; 
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  delay?: number;
  onSelect: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className={`relative p-8 rounded-2xl border transition-all duration-300 ${
      popular 
        ? 'bg-gradient-to-b from-[#10b981]/10 to-[#0a0a0a] border-[#10b981]/50 shadow-2xl shadow-[#10b981]/10 scale-105' 
        : 'bg-[#111111] border-[#1f1f1f] hover:border-[#2a2a2a]'
    }`}
  >
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#10b981] text-black text-xs font-bold uppercase tracking-wider">
        Most Popular
      </div>
    )}
    
    <div className="mb-6">
      <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    
    <div className="flex items-baseline gap-1 mb-6">
      <span className="text-5xl font-bold text-white">{price}</span>
      {period !== "forever" && <span className="text-gray-500">/{period}</span>}
    </div>
    
    <ul className="space-y-3 mb-8">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${popular ? 'text-[#10b981]' : 'text-gray-500'}`} />
          <span className="text-gray-300">{feature}</span>
        </li>
      ))}
    </ul>
    
    <Button 
      onClick={onSelect}
      className={`w-full h-12 font-semibold rounded-xl transition-all ${
        popular 
          ? 'bg-[#10b981] hover:bg-[#0ea472] text-black shadow-lg shadow-[#10b981]/30' 
          : 'bg-white/10 hover:bg-white/20 text-white border border-[#2a2a2a]'
      }`}
    >
      Get Started
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </motion.div>
);

// ============================================
// FAQ ACCORDION
// ============================================

const FAQItem = ({ question, answer, delay = 0 }: { question: string; answer: string; delay?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="border-b border-[#1f1f1f]"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-medium text-white group-hover:text-[#10b981] transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#10b981]' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-400 text-sm leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================
// TESTIMONIAL CARD
// ============================================

const TestimonialCard = ({ 
  name, 
  role, 
  text, 
  rating,
  avatar,
  delay = 0 
}: { 
  name: string; 
  role: string; 
  text: string;
  rating: number;
  avatar?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-6 rounded-2xl bg-[#111111] border border-[#1f1f1f] hover:border-[#2a2a2a] transition-all"
  >
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'fill-[#10b981] text-[#10b981]' : 'text-gray-700'}`} 
        />
      ))}
    </div>
    <p className="text-gray-300 mb-5 leading-relaxed">"{text}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-bold">
        {name.charAt(0)}
      </div>
      <div>
        <p className="font-medium text-white">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
  </motion.div>
);

// ============================================
// SCREENSHOT CAROUSEL
// ============================================

const ScreenshotCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const screenshots = [
    { title: "Dashboard", description: "See your entire collection at a glance with real-time valuations" },
    { title: "Inventory", description: "Browse, search, and filter your complete card inventory" },
    { title: "Analytics", description: "Track P&L, ROI, and portfolio performance over time" },
    { title: "Add Card", description: "Quickly add cards with smart search and auto-fill" }
  ];

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % screenshots.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Screenshot Display */}
      <div className="relative aspect-[16/10] rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#10b981]/5 to-[#0a0a0a]"
          >
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-[#10b981]/20 border border-[#10b981]/30 flex items-center justify-center mx-auto mb-6">
                <Layers className="w-10 h-10 text-[#10b981]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{screenshots[activeIndex].title}</h3>
              <p className="text-gray-400 max-w-md mx-auto">{screenshots[activeIndex].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 border border-[#2a2a2a] flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 border border-[#2a2a2a] flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {screenshots.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === activeIndex 
                ? 'w-8 bg-[#10b981]' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// MAIN LANDING COMPONENT
// ============================================

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
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      } else {
        setIsLoading(false);
      }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector((this as HTMLAnchorElement).getAttribute('href') || '');
        target?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  // ============================================
  // DATA
  // ============================================

  const features = [
    {
      icon: LineChart,
      title: "Portfolio Tracking",
      description: "Track your entire collection with real-time market prices from major marketplaces.",
      gradient: "bg-gradient-to-br from-[#10b981] to-[#059669]"
    },
    {
      icon: TrendingUp,
      title: "P&L Analytics",
      description: "See your profit & loss, ROI, and portfolio performance with beautiful charts.",
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-500"
    },
    {
      icon: Package,
      title: "Grading Pipeline",
      description: "Track cards through the grading process - from submission to slab in hand.",
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500"
    },
    {
      icon: Bell,
      title: "Price Alerts",
      description: "Get notified instantly when cards hit your target prices. Never miss a deal.",
      gradient: "bg-gradient-to-br from-orange-500 to-red-500"
    },
    {
      icon: Users,
      title: "Wholesale Client Lists",
      description: "Manage your buyers and sellers with integrated CRM for serious dealers.",
      gradient: "bg-gradient-to-br from-yellow-500 to-amber-500"
    },
    {
      icon: ShoppingCart,
      title: "eBay Integration",
      description: "Sync your eBay listings and sales. Auto-import purchases and track everything.",
      gradient: "bg-gradient-to-br from-indigo-500 to-violet-500"
    }
  ];

  const stats = [
    { value: 10, label: "Cards Tracked", suffix: "K+" },
    { value: 2, label: "Portfolio Value", prefix: "$", suffix: "M+" },
  ];

  const testimonials = [
    {
      name: "Jake Morrison",
      role: "Pokemon Collector",
      text: "CardLedger changed the game for me. I finally know exactly what my collection is worth and which cards are actually making me money.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Sports Card Investor",
      text: "The P&L tracking is incredible. I've been able to identify which card types give me the best ROI and focus my buying there.",
      rating: 5
    },
    {
      name: "Marcus Williams",
      role: "Card Shop Owner",
      text: "The wholesale client list feature alone is worth the Business plan. Managing hundreds of customers has never been easier.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for casual collectors",
      features: [
        "Track up to 100 cards",
        "Basic portfolio value",
        "Manual price lookup",
        "1 collection",
        "Community support"
      ]
    },
    {
      name: "Pro",
      price: "$6.99",
      period: "mo",
      description: "For serious collectors",
      popular: true,
      features: [
        "Unlimited cards",
        "Real-time price tracking",
        "P&L and ROI analytics",
        "Price alerts",
        "Export to CSV/PDF",
        "Grading pipeline tracker",
        "Unlimited collections",
        "Priority support"
      ]
    },
    {
      name: "Business",
      price: "$14.99",
      period: "mo",
      description: "For dealers & shops",
      features: [
        "Everything in Pro",
        "Wholesale client lists",
        "API access",
        "Team collaboration",
        "Custom branding",
        "Tax & inventory reports",
        "eBay integration",
        "Dedicated account manager"
      ]
    }
  ];

  const faqs = [
    {
      question: "What card types does CardLedger support?",
      answer: "We support all major TCGs including Pokémon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Dragon Ball, and all sports cards (baseball, basketball, football, hockey). New games and sets are added regularly."
    },
    {
      question: "How does price tracking work?",
      answer: "We aggregate prices from major marketplaces including eBay sold listings, TCGPlayer, and more. Prices update in real-time so you always know the current market value of your collection."
    },
    {
      question: "Can I track graded cards?",
      answer: "Absolutely! CardLedger supports all major grading companies including PSA, BGS, CGC, and SGC. You can track raw cards, submissions in progress, and graded slabs all in one place."
    },
    {
      question: "Is my collection data secure?",
      answer: "Yes. We use bank-level encryption for all data. Your collection information is stored securely and you can export or delete it anytime. We never share or sell your data."
    },
    {
      question: "What's included in the free tier?",
      answer: "Free users can track up to 100 cards, view basic portfolio value, and access price lookups. Upgrade to Pro for unlimited cards, analytics, price alerts, and more."
    },
    {
      question: "Do you have a mobile app?",
      answer: "Yes! CardLedger is available on iOS and Android. The mobile app includes all features plus barcode scanning for quick card entry."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden scroll-smooth">
      
      {/* ============================================ */}
      {/* ANIMATED BACKGROUND */}
      {/* ============================================ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[#10b981]/8 rounded-full blur-[150px]" />
        {/* Secondary glows */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* ============================================ */}
      {/* NAVIGATION */}
      {/* ============================================ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-[#1f1f1f]"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Card<span className="text-[#10b981]">Ledger</span>
            </span>
          </div>
          
          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#screenshots" className="text-sm text-gray-400 hover:text-white transition-colors">Screenshots</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</a>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")} 
              className="hidden sm:flex text-gray-300 hover:text-white hover:bg-white/10"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate("/auth")} 
              className="bg-[#10b981] hover:bg-[#0ea472] text-black font-semibold rounded-xl gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <motion.section 
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6"
      >
        <div className="max-w-6xl mx-auto text-center">
          
          {/* Badge */}
          <RevealOnScroll delay={0.1}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 mb-8">
              <Sparkles className="w-4 h-4 text-[#10b981]" />
              <span className="text-sm font-medium text-[#10b981]">#1 Card Collection Tracker</span>
            </div>
          </RevealOnScroll>

          {/* Main Headline */}
          <RevealOnScroll delay={0.2}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.05]">
              Your Cards
              <span className="text-gray-500 mx-2 md:mx-4">|</span>
              <span className="bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#6ee7b7] bg-clip-text text-transparent">
                One Ledger
              </span>
            </h1>
          </RevealOnScroll>

          {/* Subheadline */}
          <RevealOnScroll delay={0.3}>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              The smartest way to track, value, and profit from your card collection.
            </p>
          </RevealOnScroll>

          {/* CTA Buttons */}
          <RevealOnScroll delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="h-14 px-8 text-lg font-semibold rounded-2xl bg-[#10b981] hover:bg-[#0ea472] text-black gap-2 shadow-lg shadow-[#10b981]/30 hover:shadow-xl hover:shadow-[#10b981]/40 transition-all group"
              >
                Get Started Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg font-semibold rounded-2xl bg-transparent border-[#2a2a2a] hover:bg-white/5 hover:border-[#3a3a3a] text-white gap-2"
              >
                <Download className="w-5 h-5" />
                Download App
              </Button>
            </div>
          </RevealOnScroll>

          {/* Stats */}
          <RevealOnScroll delay={0.5}>
            <div className="flex flex-wrap items-center justify-center gap-12 mb-16">
              {stats.map((stat, i) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-white">
                    <AnimatedCounter 
                      value={stat.value} 
                      prefix={stat.prefix || ""} 
                      suffix={stat.suffix || ""} 
                    />
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          {/* Hero Mockup */}
          <RevealOnScroll delay={0.6} className="relative max-w-5xl mx-auto">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#10b981]/20 via-[#10b981]/5 to-transparent rounded-3xl blur-3xl scale-95 -z-10" />
            
            {/* Main Preview */}
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-[#1f1f1f] shadow-2xl bg-[#111111]">
              {/* Placeholder for app screenshot */}
              <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-[#10b981]/10 to-[#0a0a0a]">
                <div className="text-center p-8">
                  <div className="w-24 h-24 rounded-2xl bg-[#10b981]/20 border border-[#10b981]/30 flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-12 h-12 text-[#10b981]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">CardLedger Dashboard</h3>
                  <p className="text-gray-400">Your complete collection overview</p>
                </div>
              </div>
              {/* Bottom fade */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            </div>

            {/* Floating Elements */}
            <FloatingElement className="absolute -left-6 top-1/4 hidden lg:block" delay={0}>
              <div className="px-4 py-3 rounded-xl bg-[#111111] border border-[#1f1f1f] shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#10b981]/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">24h Change</p>
                    <p className="text-lg font-bold text-[#10b981]">+$847.50</p>
                  </div>
                </div>
              </div>
            </FloatingElement>

            <FloatingElement className="absolute -right-6 top-1/3 hidden lg:block" delay={0.5}>
              <div className="px-4 py-3 rounded-xl bg-[#111111] border border-[#1f1f1f] shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Portfolio ROI</p>
                    <p className="text-lg font-bold text-purple-400">+127.4%</p>
                  </div>
                </div>
              </div>
            </FloatingElement>
          </RevealOnScroll>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-gray-500"
          >
            <span className="text-xs">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ============================================ */}
      {/* FEATURES SECTION */}
      {/* ============================================ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to
              <br />
              <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
                master your portfolio
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful tools for collectors, investors, and dealers.
            </p>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SCREENSHOTS CAROUSEL */}
      {/* ============================================ */}
      <section id="screenshots" className="py-24 px-6 bg-[#050505] border-y border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto">
          <RevealOnScroll className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              See it in{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                action
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Built for speed and simplicity
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
            <ScreenshotCarousel />
          </RevealOnScroll>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                collectors
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Join thousands who trust CardLedger
            </p>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard key={i} {...testimonial} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING */}
      {/* ============================================ */}
      <section id="pricing" className="py-24 px-6 bg-[#050505] border-y border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple,{" "}
              <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
                transparent
              </span>{" "}
              pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free, upgrade when you're ready
            </p>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
            {pricingPlans.map((plan, i) => (
              <PricingCard 
                key={plan.name} 
                {...plan} 
                delay={i * 0.1} 
                onSelect={() => navigate("/auth")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ */}
      {/* ============================================ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently asked{" "}
              <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
                questions
              </span>
            </h2>
          </RevealOnScroll>

          <div className="space-y-1">
            {faqs.map((faq, i) => (
              <FAQItem key={i} {...faq} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
        <RevealOnScroll className="max-w-4xl mx-auto text-center">
          {/* Decorative glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[300px] bg-[#10b981]/10 rounded-full blur-[120px]" />
          </div>
          
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Ready to level up
              <br />
              <span className="bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#6ee7b7] bg-clip-text text-transparent">
                your collection?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join thousands of collectors who use CardLedger to track, analyze, and profit from their portfolios.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="h-16 px-12 text-lg font-bold rounded-2xl bg-[#10b981] hover:bg-[#0ea472] text-black gap-2 shadow-lg shadow-[#10b981]/30 hover:shadow-xl hover:shadow-[#10b981]/40 transition-all group"
            >
              Get Started Free
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required • Free forever plan
            </p>
          </div>
        </RevealOnScroll>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-12 px-6 border-t border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">
                  Card<span className="text-[#10b981]">Ledger</span>
                </span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs mb-4">
                The smartest way to track, value, and profit from your card collection.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a href="#" className="w-8 h-8 rounded-lg bg-[#111111] border border-[#1f1f1f] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-[#111111] border border-[#1f1f1f] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-[#111111] border border-[#1f1f1f] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-[#111111] border border-[#1f1f1f] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-gray-500 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-gray-500 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="text-sm text-gray-500 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1">Roadmap <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="pt-8 border-t border-[#1f1f1f] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              © 2026 CardLedger. All rights reserved.
            </p>
            <p className="text-xs text-gray-700">
              Made with ♥ for collectors everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
