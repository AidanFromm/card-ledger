import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Crown, Zap, Lock, X, Check, Sparkles, TrendingUp, Download, Bell, BarChart3 } from "lucide-react";
import { useSubscription, PRICING } from "@/hooks/useSubscription";

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  feature: "scan" | "cards" | "export" | "history" | "alerts" | "analytics";
  title?: string;
  description?: string;
}

const FEATURE_INFO: Record<string, { icon: React.ElementType; title: string; description: string }> = {
  scan: {
    icon: Zap,
    title: "Scan Limit Reached",
    description: "Upgrade to Pro for unlimited AI-powered card scanning.",
  },
  cards: {
    icon: TrendingUp,
    title: "Collection Limit Reached",
    description: "You've reached 100 cards. Upgrade to Pro for unlimited cards.",
  },
  export: {
    icon: Download,
    title: "Export Your Collection",
    description: "CSV export is a Pro feature. Upgrade to download your data.",
  },
  history: {
    icon: BarChart3,
    title: "View Price History",
    description: "Track price trends over time with Pro. See how your cards perform.",
  },
  alerts: {
    icon: Bell,
    title: "Price Alerts",
    description: "Get notified when prices change. Upgrade to Pro for alerts.",
  },
  analytics: {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Deep insights into your collection. Upgrade to Pro for full analytics.",
  },
};

export const Paywall = ({ isOpen, onClose, feature, title, description }: PaywallProps) => {
  const navigate = useNavigate();
  const { plan, trialDaysLeft } = useSubscription();
  
  const info = FEATURE_INFO[feature] || FEATURE_INFO.scan;
  const Icon = info.icon;
  
  const handleUpgrade = () => {
    onClose();
    navigate("/settings");
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-md z-50"
          >
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-12">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-primary/20">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-foreground">
                  {title || info.title}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {description || info.description}
                </p>
              </div>
              
              {/* Body */}
              <div className="p-6 -mt-6">
                {/* Trial banner if applicable */}
                {plan === "trial" && trialDaysLeft && trialDaysLeft > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-amber-500 font-medium">
                      <Sparkles className="w-4 h-4" />
                      {trialDaysLeft} days left in your trial
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Subscribe now to keep all Pro features.
                    </p>
                  </div>
                )}
                
                {/* What you get */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Pro includes:
                  </p>
                  {[
                    "Unlimited card scanning",
                    "Unlimited collection size",
                    "Full price history & charts",
                    "CSV export for backups",
                    "Price change alerts",
                    "Advanced analytics",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-primary/20">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                
                {/* Pricing */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    ${PRICING.pro.annual.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">/year</span>
                  <span className="ml-2 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                    Save {PRICING.pro.annualSavings}%
                  </span>
                </div>
                
                {/* CTA */}
                <Button
                  onClick={handleUpgrade}
                  className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Pro
                </Button>
                
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Cancel anytime. 7-day money-back guarantee.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook to easily show paywall
export const usePaywall = () => {
  const subscription = useSubscription();
  
  const checkFeature = (feature: keyof typeof FEATURE_INFO): boolean => {
    switch (feature) {
      case "scan":
        return subscription.canScan();
      case "cards":
        return subscription.canAddCards();
      case "export":
        return subscription.canExportCSV;
      case "history":
        return subscription.canViewHistory;
      case "alerts":
        return subscription.canSetAlerts;
      case "analytics":
        return subscription.canUseAdvancedAnalytics;
      default:
        return true;
    }
  };
  
  return {
    ...subscription,
    checkFeature,
  };
};

export default Paywall;
