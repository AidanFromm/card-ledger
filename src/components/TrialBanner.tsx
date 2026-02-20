import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Clock, Crown, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export const TrialBanner = () => {
  const navigate = useNavigate();
  const { plan, trialDaysLeft, isPro, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    // Only show for trial users with 3 or fewer days left
    if (plan === "trial" && trialDaysLeft !== null && trialDaysLeft <= 3) {
      // Check if dismissed today
      const lastDismissed = localStorage.getItem('trial_banner_dismissed');
      if (lastDismissed) {
        const today = new Date().toDateString();
        if (lastDismissed === today) {
          setDismissed(true);
          return;
        }
      }
      
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 2000);
    }
  }, [plan, trialDaysLeft, loading]);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('trial_banner_dismissed', new Date().toDateString());
  };

  const handleUpgrade = () => {
    handleDismiss();
    navigate('/settings');
  };

  if (loading || dismissed || !showBanner || isPro) return null;

  const urgencyColor = trialDaysLeft === 1 
    ? 'from-red-500/20 to-orange-500/20 border-red-500/30' 
    : trialDaysLeft === 2 
      ? 'from-orange-500/20 to-amber-500/20 border-orange-500/30'
      : 'from-amber-500/20 to-yellow-500/20 border-amber-500/30';

  const urgencyText = trialDaysLeft === 1 
    ? 'text-red-500' 
    : trialDaysLeft === 2 
      ? 'text-orange-500'
      : 'text-amber-500';

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 p-2 md:p-0"
        >
          <div className={`
            mx-auto max-w-4xl md:mt-2 md:rounded-xl
            bg-gradient-to-r ${urgencyColor} border
            backdrop-blur-xl shadow-lg
          `}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-background/50 ${urgencyText}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {trialDaysLeft === 1 
                      ? "Last day of your trial!" 
                      : `${trialDaysLeft} days left in your trial`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upgrade now to keep all Pro features
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleUpgrade}
                  className="h-8 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upgrade</span>
                </Button>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrialBanner;
