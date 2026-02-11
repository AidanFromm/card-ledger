import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode, useState, useCallback } from "react";
import { Trash2, DollarSign } from "lucide-react";
import { triggerSwipeHaptic, triggerSuccessHaptic, triggerDestructiveHaptic } from "@/lib/haptics";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;  // Delete
  onSwipeRight?: () => void; // Sell
  disabled?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftColor?: string;
  rightColor?: string;
  swipeThreshold?: number;
  velocityThreshold?: number;
}

const DEFAULT_SWIPE_THRESHOLD = 100;
const DEFAULT_VELOCITY_THRESHOLD = 500;

export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  leftLabel = "Delete",
  rightLabel = "Sell",
  leftIcon = <Trash2 className="h-6 w-6" />,
  rightIcon = <DollarSign className="h-6 w-6" />,
  leftColor = "bg-gradient-to-r from-red-600 to-red-500",
  rightColor = "bg-gradient-to-l from-emerald-600 to-emerald-500",
  swipeThreshold = DEFAULT_SWIPE_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
}: SwipeableCardProps) => {
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  const x = useMotionValue(0);

  // Transform x position to action visibility
  const leftOpacity = useTransform(x, [-swipeThreshold, -40], [1, 0]);
  const rightOpacity = useTransform(x, [40, swipeThreshold], [0, 1]);
  const leftScale = useTransform(x, [-swipeThreshold, -40], [1.1, 0.8]);
  const rightScale = useTransform(x, [40, swipeThreshold], [0.8, 1.1]);
  const cardRotation = useTransform(x, [-200, 0, 200], [-2, 0, 2]);
  const cardScale = useTransform(x, [-200, 0, 200], [0.98, 1, 0.98]);

  const handleDrag = useCallback((_: any, info: PanInfo) => {
    const offset = info.offset.x;
    
    // Trigger haptic when crossing threshold
    if (!hasTriggeredHaptic && (Math.abs(offset) >= swipeThreshold)) {
      triggerSwipeHaptic();
      setHasTriggeredHaptic(true);
    } else if (hasTriggeredHaptic && (Math.abs(offset) < swipeThreshold)) {
      setHasTriggeredHaptic(false);
    }
  }, [hasTriggeredHaptic, swipeThreshold]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setHasTriggeredHaptic(false);
    
    const triggersLeft = info.offset.x < -swipeThreshold || 
      (info.offset.x < -40 && info.velocity.x < -velocityThreshold);
    const triggersRight = info.offset.x > swipeThreshold || 
      (info.offset.x > 40 && info.velocity.x > velocityThreshold);

    if (triggersLeft && onSwipeLeft) {
      triggerDestructiveHaptic();
      onSwipeLeft();
    } else if (triggersRight && onSwipeRight) {
      triggerSuccessHaptic();
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight, swipeThreshold, velocityThreshold]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-visible">
      {/* Left action background (swipe left) */}
      <motion.div
        style={{ opacity: leftOpacity, scale: leftScale }}
        className={`absolute inset-0 rounded-xl ${leftColor} flex items-center justify-end pr-6 shadow-lg`}
      >
        <div className="flex flex-col items-center gap-1 text-white">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            {leftIcon}
          </div>
          <span className="text-xs font-semibold">{leftLabel}</span>
        </div>
      </motion.div>

      {/* Right action background (swipe right) */}
      <motion.div
        style={{ opacity: rightOpacity, scale: rightScale }}
        className={`absolute inset-0 rounded-xl ${rightColor} flex items-center justify-start pl-6 shadow-lg`}
      >
        <div className="flex flex-col items-center gap-1 text-white">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            {rightIcon}
          </div>
          <span className="text-xs font-semibold">{rightLabel}</span>
        </div>
      </motion.div>

      {/* Draggable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, rotate: cardRotation, scale: cardScale }}
        className="relative bg-card rounded-xl touch-pan-y"
        whileTap={{ cursor: "grabbing" }}
      >
        {children}
      </motion.div>
    </div>
  );
};
