import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode, useState, useRef } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

const PULL_THRESHOLD = 80;

export const PullToRefresh = ({
  children,
  onRefresh,
  className = "",
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  const rotation = useTransform(y, [0, PULL_THRESHOLD], [0, 180]);
  const opacity = useTransform(y, [0, PULL_THRESHOLD / 2], [0, 1]);
  const scale = useTransform(y, [0, PULL_THRESHOLD], [0.8, 1]);

  const handleDrag = (_: any, info: PanInfo) => {
    // Only allow pull down when at top of scroll
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      setPullDistance(Math.max(0, info.offset.y));
    }
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (info.offset.y >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* Pull indicator */}
      <motion.div
        style={{
          opacity,
          scale,
          y: pullDistance > 0 ? pullDistance / 2 - 20 : -40,
        }}
        className="absolute left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-full p-2 shadow-lg"
      >
        <motion.div
          style={{ rotate: isRefreshing ? undefined : rotation }}
          animate={isRefreshing ? { rotate: 360 } : undefined}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : undefined}
        >
          <RefreshCw className="h-5 w-5 text-primary" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag={isRefreshing ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: isRefreshing ? 40 : undefined }}
        animate={{ y: isRefreshing ? 40 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};
