import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Trophy, Flame, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WHATS_NEW_VERSION = '2.1.0';
const STORAGE_KEY = 'cardledger_whats_new_seen';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const NEW_FEATURES: Feature[] = [
  {
    icon: Trophy,
    title: 'Leaderboards & Goals',
    description: 'Compete with collectors worldwide! Set collection goals and track your progress to the top.',
    color: 'text-amber-400',
  },
  {
    icon: Flame,
    title: '4 New Card Games',
    description: 'One Piece, Lorcana, Flesh and Blood, and Dragon Ball Super now supported with full pricing!',
    color: 'text-orange-500',
  },
  {
    icon: Sparkles,
    title: 'Tax Reports',
    description: 'Capital gains calculator with FIFO/LIFO support. Export CSV for your accountant!',
    color: 'text-cyan-400',
  },
  {
    icon: Gift,
    title: 'Public Profiles',
    description: 'Share your collection with a custom link. Generate QR codes and share to social media!',
    color: 'text-pink-400',
  },
];

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const seenVersion = localStorage.getItem(STORAGE_KEY);
    if (seenVersion !== WHATS_NEW_VERSION) {
      // Small delay before showing
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentIndex < NEW_FEATURES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const feature = NEW_FEATURES[currentIndex];
  const Icon = feature.icon;
  const isLast = currentIndex === NEW_FEATURES.length - 1;

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors z-10"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              {/* Header */}
              <div className="px-6 pt-8 pb-4 text-center relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy-600 to-navy-800 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-navy-500/30"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-1">What's New</h2>
                <p className="text-sm text-zinc-400">Version {WHATS_NEW_VERSION}</p>
              </div>

              {/* Feature content */}
              <div className="px-6 py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-center"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-zinc-800 mx-auto flex items-center justify-center mb-4 ${feature.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 pb-4">
                {NEW_FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentIndex 
                        ? 'bg-navy-500 w-6' 
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-navy-600 hover:bg-navy-500 text-white"
                >
                  {isLast ? 'Get Started' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default WhatsNewModal;
