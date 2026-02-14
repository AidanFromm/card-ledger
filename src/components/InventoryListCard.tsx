import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Check, TrendingUp, TrendingDown, DollarSign, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";
import { getPlaceholderForItem } from "@/lib/cardNameUtils";
import { getGradeLabel } from "@/lib/gradingScales";
import { triggerSwipeHaptic, triggerSuccessHaptic, triggerDestructiveHaptic } from "@/lib/haptics";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface InventoryListCardProps {
  item: InventoryItem;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onSell: () => void;
  onDelete: () => void;
  onLongPress?: () => void;
}

// Swipe/long press thresholds
const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 400;
const LONG_PRESS_DURATION = 500;

// Grade color mapping
const getGradeStyles = (grade: string | null, gradingCompany: string | null): string => {
  if (!grade || gradingCompany === 'raw') {
    return 'bg-secondary/50 text-muted-foreground';
  }
  const numGrade = parseFloat(grade);
  if (numGrade >= 9.5) return 'bg-amber-500/15 text-amber-500';
  if (numGrade >= 9) return 'bg-emerald-500/15 text-emerald-500';
  if (numGrade >= 8) return 'bg-sky-500/15 text-sky-500';
  if (numGrade >= 7) return 'bg-violet-500/15 text-violet-500';
  return 'bg-slate-500/15 text-slate-400';
};

// Calculate P&L
const getPnLInfo = (item: InventoryItem) => {
  const marketPrice = item.market_price;
  const purchasePrice = item.purchase_price;
  
  if (!marketPrice || !purchasePrice || purchasePrice === 0) {
    return { hasData: false, gain: 0, percent: 0, isUp: false, isNeutral: true };
  }

  const gain = marketPrice - purchasePrice;
  const percent = ((gain / purchasePrice) * 100);
  const isUp = gain > 0;
  const isNeutral = Math.abs(percent) < 1;

  return { hasData: true, gain, percent, isUp, isNeutral };
};

export const InventoryListCard = ({
  item,
  selectionMode,
  isSelected,
  onSelect,
  onOpenDetail,
  onSell,
  onDelete,
  onLongPress,
}: InventoryListCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Swipe state
  const x = useMotionValue(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Transform x position to action visibility
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, -30], [1, 0]);
  const sellOpacity = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1]);

  const isGraded = item.grading_company !== "raw" && item.grade;
  const gradeDisplay = isGraded
    ? `${item.grading_company.toUpperCase()} ${item.grade}`
    : null;
  const gradeName = isGraded
    ? getGradeLabel(item.grading_company, parseFloat(item.grade!))
    : null;

  const price = item.market_price || item.purchase_price;
  const gradeColorClass = getGradeStyles(item.grade, item.grading_company);
  const pnl = getPnLInfo(item);

  // Swipe handlers
  const handleDrag = useCallback((_: any, info: PanInfo) => {
    const offset = info.offset.x;
    if (!hasTriggeredHaptic && Math.abs(offset) >= SWIPE_THRESHOLD) {
      triggerSwipeHaptic();
      setHasTriggeredHaptic(true);
    } else if (hasTriggeredHaptic && Math.abs(offset) < SWIPE_THRESHOLD) {
      setHasTriggeredHaptic(false);
    }
  }, [hasTriggeredHaptic]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setHasTriggeredHaptic(false);
    
    if (info.offset.x < -SWIPE_THRESHOLD || (info.offset.x < -30 && info.velocity.x < -SWIPE_VELOCITY_THRESHOLD)) {
      triggerDestructiveHaptic();
      setShowDeleteConfirm(true);
    } else if (info.offset.x > SWIPE_THRESHOLD || (info.offset.x > 30 && info.velocity.x > SWIPE_VELOCITY_THRESHOLD)) {
      triggerSuccessHaptic();
      onSell();
    }
  }, [onSell]);

  // Long press handlers
  const handleTouchStart = useCallback(() => {
    if (selectionMode) return;
    
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onLongPress?.();
    }, LONG_PRESS_DURATION);
  }, [selectionMode, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isLongPressing) {
      setIsLongPressing(false);
      return;
    }
    
    if (selectionMode) {
      onSelect();
    } else {
      onOpenDetail();
    }
  }, [isLongPressing, selectionMode, onSelect, onOpenDetail]);

  const handleDelete = () => {
    triggerDestructiveHaptic();
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        {/* Swipe backgrounds */}
        <motion.div
          style={{ opacity: deleteOpacity }}
          className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-end pr-4"
        >
          <div className="flex items-center gap-2 text-white">
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-medium">Delete</span>
          </div>
        </motion.div>
        <motion.div
          style={{ opacity: sellOpacity }}
          className="absolute inset-0 bg-gradient-to-l from-emerald-600 to-emerald-500 flex items-center justify-start pl-4"
        >
          <div className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5" />
            <span className="text-sm font-medium">Sell</span>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          style={{ x }}
          drag={!selectionMode ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          layout
          className={`flex items-center gap-3 p-3 bg-card border border-border/50 cursor-pointer
            hover:shadow-md hover:border-border transition-all touch-pan-y
            ${selectionMode && isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
            ${isLongPressing ? 'ring-2 ring-primary/50 scale-[0.98]' : ''}
          `}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          {/* Selection Checkbox */}
          <AnimatePresence>
            {selectionMode && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-shrink-0"
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-primary' : 'bg-secondary/80'
                }`}>
                  {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thumbnail */}
          <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted/30">
            {item.card_image_url && !imageError ? (
              <img
                src={item.card_image_url}
                alt={item.name}
                className="w-full h-full object-contain p-1"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <img
                src={getPlaceholderForItem({ category: item.category, grading_company: item.grading_company })}
                alt="Placeholder"
                className="w-full h-full object-contain opacity-50 p-1"
              />
            )}
            {/* Quantity badge */}
            {item.quantity > 1 && (
              <span className="absolute bottom-0.5 right-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-secondary rounded-full">
                x{item.quantity}
              </span>
            )}
          </div>

          {/* Card Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1">
              {item.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {item.set_name}
              {item.card_number && item.category !== 'sealed' && (
                <span className="opacity-60"> #{item.card_number}</span>
              )}
            </p>
            
            {/* Grade Badge */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {gradeDisplay ? (
                <span className={`text-[10px] py-0.5 px-2 rounded-full font-semibold ${gradeColorClass}`}>
                  {gradeDisplay}
                </span>
              ) : item.category === 'sealed' ? (
                <span className="text-[10px] py-0.5 px-2 rounded-full font-semibold bg-purple-500/15 text-purple-400">
                  Sealed
                </span>
              ) : (
                <span className="text-[10px] py-0.5 px-2 rounded-full font-medium bg-secondary/50 text-muted-foreground">
                  Raw
                </span>
              )}
            </div>
          </div>

          {/* Price & P&L */}
          <div className="flex-shrink-0 text-right">
            <p className="text-base font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
              ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {pnl.hasData && !pnl.isNeutral && (
              <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${
                pnl.isUp ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {pnl.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{pnl.isUp ? '+' : ''}{pnl.percent.toFixed(0)}%</span>
              </div>
            )}
          </div>

          {/* Swipe hint indicator (visible when not swiping) */}
          {!selectionMode && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-20">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-6 bg-muted-foreground rounded-full" />
                <div className="w-0.5 h-6 bg-muted-foreground rounded-full" />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{item.name}</span> will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InventoryListCard;
