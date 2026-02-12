import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Scan, 
  TrendingUp, 
  Package, 
  ChevronRight, 
  Sparkles,
  Shield,
  Zap,
  BarChart3
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      } else {
        setIsLoading(false);
      }
    });
  }, [navigate]);

  // Preload hero image
  useEffect(() => {
    const img = new Image();
    img.src = "/brand/marketing-hero.jpg";
    img.onload = () => setImageLoaded(true);
  }, []);

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
      icon: Scan,
      title: "Scan",
      description: "AI-powered card recognition"
    },
    {
      icon: TrendingUp,
      title: "Track",
      description: "Real-time market prices"
    },
    {
      icon: Package,
      title: "Inventory",
      description: "Organize your collection"
    }
  ];

  const stats = [
    { value: "50K+", label: "Cards Tracked" },
    { value: "99.2%", label: "Scan Accuracy" },
    { value: "$2M+", label: "Portfolio Value" }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between px-6 py-4 md:px-12 md:py-6"
        >
          <div className="flex items-center gap-3">
            <img 
              src="/brand/logo-dark.jpg" 
              alt="CardLedger" 
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover"
            />
            <span className="text-xl md:text-2xl font-bold tracking-tight">
              Card<span className="text-primary">Ledger</span>
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="text-sm font-medium"
          >
            Sign In
          </Button>
        </motion.header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The #1 Collectibles Portfolio App</span>
            </motion.div>

            {/* Main headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 leading-[1.1]">
              Your Cards.
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                One Ledger.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Track Pokémon, sports cards, Magic, and more. Know exactly what your collection is worth—in real time.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="h-14 px-8 text-base font-semibold rounded-2xl gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                Get Started Free
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="h-14 px-8 text-base font-semibold rounded-2xl border-border/50 hover:bg-secondary/50"
              >
                I Have an Account
              </Button>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-12"
            >
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm"
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{feature.title}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {feature.description}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image / App Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: imageLoaded ? 1 : 0, y: imageLoaded ? 0 : 40 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative w-full max-w-5xl mx-auto"
          >
            {/* Glow effect behind image */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent rounded-3xl blur-3xl transform scale-95" />
            
            {/* Image container */}
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-border/30 shadow-2xl shadow-black/20">
              <img
                src="/brand/marketing-hero.jpg"
                alt="CardLedger App"
                className="w-full h-auto"
                onLoad={() => setImageLoaded(true)}
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>

            {/* Floating stats cards */}
            <AnimatePresence>
              {imageLoaded && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="absolute -left-4 md:left-8 top-1/4 glass-card px-4 py-3 rounded-xl border border-border/50 shadow-xl hidden md:block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Portfolio Value</p>
                        <p className="text-lg font-bold text-emerald-500">+12.4%</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="absolute -right-4 md:right-8 top-1/3 glass-card px-4 py-3 rounded-xl border border-border/50 shadow-xl hidden md:block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cards Scanned</p>
                        <p className="text-lg font-bold">2,847</p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </main>

        {/* Trust indicators */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="px-6 py-8 border-t border-border/30"
        >
          <div className="max-w-4xl mx-auto">
            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="w-4 h-4" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4" />
                <span>Real-time Sync</span>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default Landing;
