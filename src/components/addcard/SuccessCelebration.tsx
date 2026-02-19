import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerCelebration } from "@/components/Celebration";

interface SuccessCelebrationProps {
  isVisible: boolean;
  cardName: string;
  cardImage?: string;
  value?: number;
  onAddAnother: () => void;
  onViewInventory: () => void;
  onClose: () => void;
}

export const SuccessCelebration = ({
  isVisible,
  cardName,
  cardImage,
  value,
  onAddAnother,
  onViewInventory,
  onClose,
}: SuccessCelebrationProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      
      // Trigger confetti based on value
      const intensity = value && value >= 100 
        ? value >= 500 
          ? 'big' 
          : 'medium' 
        : 'subtle';
      
      triggerCelebration(intensity);
      
      // Auto-close after 5 seconds if no interaction
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, value]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm mx-4"
          >
            {/* Success Card */}
            <div className="bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Success Header */}
              <div className="relative bg-gradient-to-br from-navy-500 to-navy-600 p-6 text-center">
                {/* Animated Background Elements */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 1.5],
                        x: Math.cos((i * 45 * Math.PI) / 180) * 60,
                        y: Math.sin((i * 45 * Math.PI) / 180) * 60,
                      }}
                      transition={{
                        delay: 0.2 + i * 0.05,
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                      className="absolute"
                    >
                      <Sparkles className="h-4 w-4 text-white/60" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Check Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.1, damping: 10 }}
                  className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="h-10 w-10 text-navy-500" strokeWidth={3} />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white text-xl font-bold mt-4"
                >
                  Card Added! 🎉
                </motion.h2>
              </div>

              {/* Card Preview */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  {/* Card Image */}
                  {cardImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="w-16 h-22 rounded-lg overflow-hidden shadow-md flex-shrink-0"
                    >
                      <img
                        src={cardImage}
                        alt={cardName}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}

                  {/* Card Info */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-semibold text-foreground truncate">
                      {cardName}
                    </p>
                    {value && (
                      <p className="text-lg font-bold text-primary">
                        ${value.toFixed(2)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Added to your collection
                    </p>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={onAddAnother}
                    >
                      <Plus className="h-4 w-4" />
                      Add Another
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex-1"
                  >
                    <Button
                      className="w-full gap-2 shadow-gold"
                      onClick={onViewInventory}
                    >
                      View Inventory
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-4 -left-4"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="h-8 w-8 text-amber-400" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-4 -right-4"
            >
              <motion.div
                animate={{
                  y: [0, 10, 0],
                  rotate: [0, -10, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="h-6 w-6 text-primary" />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessCelebration;
