import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { ReactNode, useState, useRef, useCallback } from "react";
import { RefreshCw, Check, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 150;

export const PullToRefresh = ({
  children,
  onRefresh,
  className = "",
  disabled = false,
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);

  // Motion values for smooth animations
  const y = useMotionValue(0);
  
  // Transform pull distance into visual feedback
  const rotation = useTransform(y, [0, PULL_THRESHOLD], [0, 180]);
  const scale = useTransform(y, [0, PULL_THRESHOLD], [0.6, 1]);
  const opacity = useTransform(y, [0, PULL_THRESHOLD / 3, PULL_THRESHOLD], [0, 0.5, 1]);
  
  // Progress indicator (0 to 1)
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isPastThreshold = pullDistance >= PULL_THRESHOLD;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY.current === null) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      startY.current = null;
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Rubber band effect - pull becomes harder as you pull more
      const dampedPull = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(dampedPull);
      y.set(dampedPull);
    }
  }, [disabled, isRefreshing, y]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || startY.current === null) return;
    
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep indicator visible during refresh
      
      try {
        await onRefresh();
        setIsComplete(true);
        
        // Show success state briefly
        await new Promise(resolve => setTimeout(resolve, 500));
      } finally {
        setIsRefreshing(false);
        setIsComplete(false);
      }
    }
    
    // Animate back
    setPullDistance(0);
    y.set(0);
    startY.current = null;
    currentY.current = null;
  }, [disabled, pullDistance, isRefreshing, onRefresh, y]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ 
              opacity: 1, 
              y: Math.min(pullDistance - 20, 40),
            }}
            exit={{ opacity: 0, y: -40, transition: { duration: 0.2 } }}
            className="absolute left-1/2 -translate-x-1/2 z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: isRefreshing ? 1 : scale.get(),
              }}
              className={`
                relative flex items-center justify-center
                w-10 h-10 rounded-full
                bg-card border border-border
                shadow-lg shadow-black/20
                ${isPastThreshold && !isRefreshing ? 'ring-2 ring-primary/50' : ''}
              `}
            >
              {/* Progress ring */}
              {!isRefreshing && !isComplete && (
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 40 40"
                >
                  <circle
                    className="text-border"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="transparent"
                    r="18"
                    cx="20"
                    cy="20"
                  />
                  <motion.circle
                    className="text-primary"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="transparent"
                    r="18"
                    cx="20"
                    cy="20"
                    strokeDasharray={`${progress * 113} 113`}
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* Icon states */}
              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-5 h-5 text-primary" strokeWidth={3} />
                  </motion.div>
                ) : isRefreshing ? (
                  <motion.div
                    key="refreshing"
                    animate={{ rotate: 360 }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1, 
                      ease: "linear" 
                    }}
                  >
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </motion.div>
                ) : isPastThreshold ? (
                  <motion.div
                    key="release"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-primary"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="pull"
                    style={{ rotate: rotation }}
                  >
                    <ArrowDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Pull hint text */}
            <AnimatePresence>
              {!isRefreshing && pullDistance > 20 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs text-muted-foreground whitespace-nowrap"
                >
                  {isPastThreshold ? "Release to refresh" : "Pull to refresh"}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with pull animation */}
      <motion.div
        animate={{ 
          y: isRefreshing ? 50 : 0,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
        }}
        style={{ 
          y: isRefreshing ? undefined : pullDistance * 0.5,
        }}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
