import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, TrendingUp, Search, Palette, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const APP_VERSION = "2.0.0";
const WHATS_NEW_KEY = "cardledger_whats_new_seen";

interface ChangelogEntry {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const changelog: ChangelogEntry[] = [
  {
    icon: <Palette className="w-5 h-5 text-primary" />,
    title: "Complete Desktop Redesign",
    description: "New sidebar navigation, contextual top bar, and proper desktop layouts on every page.",
  },
  {
    icon: <Search className="w-5 h-5 text-emerald-500" />,
    title: "Smarter Search",
    description: "Better image fallbacks, priority sorting, and condition-based pricing from JustTCG.",
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
    title: "Auto Price Refresh",
    description: "Prices update automatically when stale. No more manually refreshing — your portfolio stays current.",
  },
  {
    icon: <Zap className="w-5 h-5 text-purple-500" />,
    title: "AI Recommendations",
    description: "Personalized card suggestions based on your collection with real images and market data.",
  },
];

export const WhatsNew = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(WHATS_NEW_KEY);
    if (seen !== APP_VERSION) {
      // Small delay so it doesn't show instantly on load
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(WHATS_NEW_KEY, APP_VERSION);
    setIsOpen(false);
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
          >
            <div className="glass-card rounded-3xl overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 text-center">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3"
                >
                  <Sparkles className="w-7 h-7 text-primary" />
                </motion.div>
                <h2 className="text-xl font-bold">What&apos;s New</h2>
                <p className="text-sm text-muted-foreground mt-1">v{APP_VERSION}</p>
              </div>

              {/* Changelog */}
              <div className="px-6 pb-2 space-y-3 max-h-[50vh] overflow-y-auto">
                {changelog.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex gap-3 p-3 rounded-2xl bg-secondary/20"
                  >
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center flex-shrink-0">
                      {entry.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">{entry.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{entry.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-5">
                <Button
                  onClick={handleClose}
                  className="w-full h-12 rounded-2xl font-semibold active:scale-[0.97] transition-all"
                >
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WhatsNew;
