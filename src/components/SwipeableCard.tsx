import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode, useState } from "react";
import { Trash2, DollarSign } from "lucide-react";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;  // Delete
  onSwipeRight?: () => void; // Sell
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80;

export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
}: SwipeableCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);

  // Transform x position to action visibility
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);
  const rightOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0.8]);
  const rightScale = useTransform(x, [20, SWIPE_THRESHOLD], [0.8, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);

    if (info.offset.x < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    } else if (info.offset.x > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight();
    }
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete action background (left swipe) */}
      <motion.div
        style={{ opacity: leftOpacity, scale: leftScale }}
        className="absolute inset-0 bg-destructive/90 flex items-center justify-end pr-6 rounded-xl"
      >
        <div className="flex flex-col items-center gap-1 text-white">
          <Trash2 className="h-6 w-6" />
          <span className="text-xs font-medium">Delete</span>
        </div>
      </motion.div>

      {/* Sell action background (right swipe) */}
      <motion.div
        style={{ opacity: rightOpacity, scale: rightScale }}
        className="absolute inset-0 bg-success/90 flex items-center justify-start pl-6 rounded-xl"
      >
        <div className="flex flex-col items-center gap-1 text-white">
          <DollarSign className="h-6 w-6" />
          <span className="text-xs font-medium">Sell</span>
        </div>
      </motion.div>

      {/* Draggable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-card rounded-xl touch-pan-y"
        whileTap={{ cursor: "grabbing" }}
      >
        {children}
      </motion.div>
    </div>
  );
};
