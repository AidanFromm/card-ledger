import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Check, DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
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
import { getSlabTemplatePath, getGradeLabel } from "@/lib/gradingScales";
import { triggerSwipeHaptic, triggerSuccessHaptic, triggerDestructiveHaptic } from "@/lib/haptics";
import CardImage from "@/components/CardImage";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface InventoryCardProps {
  item: InventoryItem;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onSell: () => void;
  onDelete: () => void;
  onLongPress?: () => void;
}

// Long press duration in ms
const LONG_PRESS_DURATION = 500;

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

// Grade color mapping - subtle tints
const getGradeStyles = (grade: string | null, gradingCompany: string | null): string => {
  if (!grade || gradingCompany === 'raw') {
    return 'bg-secondary/50 text-muted-foreground';
  }

  const numGrade = parseFloat(grade);

  // Handle half grades (9.5, 10, etc.)
  if (numGrade >= 9.5) return 'bg-amber-500/15 text-amber-500';    // Gem mint - gold
  if (numGrade >= 9) return 'bg-navy-500/15 text-navy-500';  // Mint - green
  if (numGrade >= 8) return 'bg-sky-500/15 text-sky-500';          // NM-MT - blue
  if (numGrade >= 7) return 'bg-violet-500/15 text-violet-500';    // NM - purple
  return 'bg-slate-500/15 text-slate-400';                         // Lower - neutral
};

// Calculate P&L display info
const getPnLInfo = (item: InventoryItem) => {
  const marketPrice = item.market_price;
  const purchasePrice = item.purchase_price;
  
  if (!marketPrice || !purchasePrice || purchasePrice === 0) {
    return { hasData: false, gain: 0, percent: 0, isUp: false, isNeutral: true };
  }

  const gain = marketPrice - purchasePrice;
  const percent = ((gain / purchasePrice) * 100);
  const isUp = gain > 0;
  const isNeutral = Math.abs(percent) < 1; // Less than 1% is neutral

  return { hasData: true, gain, percent, isUp, isNeutral };
};

export const InventoryCard = ({
  item,
  selectionMode,
  isSelected,
  onSelect,
  onOpenDetail,
  onSell,
  onDelete,
  onLongPress,
}: InventoryCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [slabError, setSlabError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Swipe state
  const x = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Transform x position to action visibility
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40], [1, 0]);
  const sellOpacity = useTransform(x, [40, SWIPE_THRESHOLD], [0, 1]);
  const deleteScale = useTransform(x, [-SWIPE_THRESHOLD, -40], [1.1, 0.8]);
  const sellScale = useTransform(x, [40, SWIPE_THRESHOLD], [0.8, 1.1]);
  const cardRotation = useTransform(x, [-200, 0, 200], [-3, 0, 3]);
  const cardScale = useTransform(x, [-200, 0, 200], [0.98, 1, 0.98]);

  const isGraded = item.grading_company !== "raw" && item.grade;
  const gradeDisplay = isGraded
    ? `${item.grading_company.toUpperCase()} ${item.grade}`
    : null;

  // Get grade name for display
  const gradeName = isGraded
    ? getGradeLabel(item.grading_company, parseFloat(item.grade!))
    : null;

  const price = item.market_price || item.purchase_price;
  const gradeColorClass = getGradeStyles(item.grade, item.grading_company);
  const pnl = getPnLInfo(item);

  // Get slab template path for graded cards
  const slabTemplatePath = isGraded && !slabError
    ? getSlabTemplatePath(item.grading_company, item.grade!)
    : null;

  // Handle swipe with haptic feedback
  const handleDrag = useCallback((_: any, info: PanInfo) => {
    const offset = info.offset.x;
    
    // Trigger haptic when crossing threshold
    if (!hasTriggeredHaptic && (Math.abs(offset) >= SWIPE_THRESHOLD)) {
      triggerSwipeHaptic();
      setHasTriggeredHaptic(true);
    } else if (hasTriggeredHaptic && (Math.abs(offset) < SWIPE_THRESHOLD)) {
      setHasTriggeredHaptic(false);
    }
  }, [hasTriggeredHaptic]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setHasTriggeredHaptic(false);
    
    const shouldTriggerAction = 
      Math.abs(info.offset.x) >= SWIPE_THRESHOLD || 
      Math.abs(info.velocity.x) >= SWIPE_VELOCITY_THRESHOLD;

    if (info.offset.x < -SWIPE_THRESHOLD || (info.offset.x < -40 && info.velocity.x < -SWIPE_VELOCITY_THRESHOLD)) {
      // Swipe left - Delete
      triggerDestructiveHaptic();
      setShowDeleteConfirm(true);
    } else if (info.offset.x > SWIPE_THRESHOLD || (info.offset.x > 40 && info.velocity.x > SWIPE_VELOCITY_THRESHOLD)) {
      // Swipe right - Sell
      triggerSuccessHaptic();
      onSell();
    }
  }, [onSell]);

  const handleConfirmDelete = () => {
    triggerDestructiveHaptic();
    onDelete();
    setShowDeleteConfirm(false);
  };

  // Long press handlers for entering selection mode
  const handleTouchStart = useCallback(() => {
    if (selectionMode) return; // Already in selection mode
    
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      // Haptic feedback
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
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    // Don't trigger click if we just did a long press
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

  return (
    <>
      <div className="relative overflow-visible">
        {/* Delete action background (swipe left) */}
        <motion.div
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-end pr-6 shadow-lg"
        >
          <div className="flex flex-col items-center gap-1 text-white">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Trash2 className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold">Delete</span>
          </div>
        </motion.div>

        {/* Sell action background (swipe right) */}
        <motion.div
          style={{ opacity: sellOpacity, scale: sellScale }}
          className="absolute inset-0 rounded-3xl bg-gradient-to-l from-navy-700 to-navy-500 flex items-center justify-start pl-6 shadow-lg"
        >
          <div className="flex flex-col items-center gap-1 text-white">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold">Sell</span>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{ x, rotate: cardRotation, scale: cardScale }}
          drag={!selectionMode ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: selectionMode ? 1 : 0.97 }}
          className="group relative touch-pan-y"
        >
          <div
            className={`relative overflow-hidden rounded-3xl bg-card cursor-pointer
              shadow-lg shadow-black/5 dark:shadow-black/20
              hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30
              transition-shadow duration-300
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
            {/* Selection checkbox */}
            <AnimatePresence>
              {selectionMode && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-3 left-3 z-20"
                >
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-primary' : 'bg-black/50 backdrop-blur-sm'
                  }`}>
                    {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* P&L Badge - Top Right - Shows both dollar and percent */}
            {!selectionMode && pnl.hasData && !pnl.isNeutral && (
              <div className="absolute top-3 right-3 z-10">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm
                  ${pnl.isUp 
                    ? 'bg-navy-500/20 text-navy-500' 
                    : 'bg-red-500/20 text-red-500'
                  }
                `}>
                  {pnl.isUp ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {pnl.isUp ? '+' : '-'}${Math.abs(pnl.gain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="opacity-80 ml-0.5">({pnl.isUp ? '+' : ''}{pnl.percent.toFixed(0)}%)</span>
                  </span>
                </div>
              </div>
            )}

            {/* LARGE IMAGE - Hero area with optional slab overlay */}
            <div className="aspect-[3/4] w-full bg-muted/10 overflow-hidden relative flex items-center justify-center">
              {/* Slab template overlay for graded cards */}
              {slabTemplatePath && (
                <img
                  src={slabTemplatePath}
                  alt={`${item.grading_company?.toUpperCase()} slab`}
                  className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
                  onError={() => setSlabError(true)}
                />
              )}

              <CardImage
                src={item.card_image_url}
                alt={item.name}
                size="full"
                rounded="none"
                containerClassName={`w-full h-full ${slabTemplatePath ? 'p-[15%] pt-[25%] pb-[12%]' : 'p-3'}`}
                className="w-full h-full object-contain"
                loading="lazy"
                graded={isGraded}
                gradingCompany={item.grading_company || undefined}
                grade={item.grade}
                placeholder="card"
              />
            </div>

            {/* Content - Below Image - Robinhood-style hierarchy */}
            <div className="px-3 pt-2.5 pb-3">
              {/* Card Name - Primary, larger */}
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
                {item.name}
              </h3>

              {/* Set & Number - Secondary, muted */}
              <p className="text-xs text-muted-foreground line-clamp-1">
                {item.set_name}
                {item.card_number && item.category !== 'sealed' && (
                  <span className="opacity-60"> #{item.card_number}</span>
                )}
              </p>

              {/* Price Row - Big, bold, with gain/loss */}
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-lg font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {pnl.hasData && !pnl.isNeutral && (
                  <p className={`text-xs font-semibold ${pnl.isUp ? 'text-navy-500' : 'text-red-500'}`}
                     style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {pnl.isUp ? '+' : ''}${pnl.gain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              {/* Grade Badge Row */}
              <div className="flex items-center gap-1.5 mt-2">
                {gradeDisplay ? (
                  <span className={`text-[10px] py-0.5 px-2 rounded-full font-semibold ${gradeColorClass}`}>
                    {gradeDisplay}
                    {gradeName && <span className="opacity-70 ml-0.5">({gradeName})</span>}
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
                {item.quantity > 1 && (
                  <span className="text-[10px] py-0.5 px-2 rounded-full bg-secondary/50 text-muted-foreground">
                    x{item.quantity}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{item.name}</span> will be permanently removed from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
