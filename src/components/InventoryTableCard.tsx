import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Check, TrendingUp, TrendingDown, Trash2, DollarSign, Award, Package, Box } from "lucide-react";
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
import CardImage from "@/components/CardImage";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface InventoryTableCardProps {
  item: InventoryItem;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onSell: () => void;
  onDelete: () => void;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 400;

// Calculate P&L with ROI
const getPnLInfo = (item: InventoryItem) => {
  const marketPrice = item.market_price;
  const purchasePrice = item.purchase_price;
  
  if (!marketPrice || !purchasePrice || purchasePrice === 0) {
    return { hasData: false, gain: 0, percent: 0, roi: 0, isUp: false, isNeutral: true };
  }

  const gain = marketPrice - purchasePrice;
  const percent = ((gain / purchasePrice) * 100);
  const roi = percent;
  const isUp = gain > 0;
  const isNeutral = Math.abs(percent) < 1;

  return { hasData: true, gain, percent, roi, isUp, isNeutral };
};

// Condition badge component
const ConditionBadge = ({ condition, grade, gradingCompany }: { 
  condition: string | null; 
  grade: string | null;
  gradingCompany: string | null;
}) => {
  // For graded cards, infer condition from grade
  let displayCondition = condition;
  let badgeColor = "bg-secondary/50 text-muted-foreground";

  if (gradingCompany !== 'raw' && grade) {
    const numGrade = parseFloat(grade);
    if (numGrade >= 9.5) {
      displayCondition = "Gem Mint";
      badgeColor = "bg-amber-500/15 text-amber-500";
    } else if (numGrade >= 9) {
      displayCondition = "Mint";
      badgeColor = "bg-navy-500/15 text-navy-500";
    } else if (numGrade >= 8) {
      displayCondition = "NM-MT";
      badgeColor = "bg-sky-500/15 text-sky-500";
    } else if (numGrade >= 7) {
      displayCondition = "NM";
      badgeColor = "bg-violet-500/15 text-violet-500";
    } else if (numGrade >= 5) {
      displayCondition = "EX";
      badgeColor = "bg-orange-500/15 text-orange-500";
    } else {
      displayCondition = "Good";
      badgeColor = "bg-slate-500/15 text-slate-400";
    }
  } else if (condition) {
    const c = condition.toLowerCase();
    if (c.includes('mint') && !c.includes('near')) {
      badgeColor = "bg-amber-500/15 text-amber-500";
    } else if (c.includes('near') || c === 'nm') {
      badgeColor = "bg-navy-500/15 text-navy-500";
    } else if (c.includes('excellent') || c === 'lp' || c.includes('lightly')) {
      badgeColor = "bg-sky-500/15 text-sky-500";
    } else if (c.includes('good') || c === 'mp') {
      badgeColor = "bg-orange-500/15 text-orange-500";
    } else {
      badgeColor = "bg-slate-500/15 text-slate-400";
    }
    displayCondition = condition;
  }

  if (!displayCondition) return null;

  return (
    <span className={`text-[9px] py-0.5 px-1.5 rounded font-medium whitespace-nowrap ${badgeColor}`}>
      {displayCondition}
    </span>
  );
};

export const InventoryTableCard = ({
  item,
  selectionMode,
  isSelected,
  onSelect,
  onOpenDetail,
  onSell,
  onDelete,
}: InventoryTableCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);

  // Swipe state
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, -30], [1, 0]);
  const sellOpacity = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1]);

  const isGraded = item.grading_company !== "raw" && item.grade;
  const gradeDisplay = isGraded
    ? `${item.grading_company?.toUpperCase()} ${item.grade}`
    : "Raw";

  const price = item.market_price || item.purchase_price;
  const costBasis = item.purchase_price;
  const pnl = getPnLInfo(item);

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

  const handleDelete = () => {
    triggerDestructiveHaptic();
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Swipe backgrounds */}
        <motion.div
          style={{ opacity: deleteOpacity }}
          className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-end pr-4"
        >
          <Trash2 className="h-5 w-5 text-white" />
        </motion.div>
        <motion.div
          style={{ opacity: sellOpacity }}
          className="absolute inset-0 bg-gradient-to-l from-navy-700 to-navy-500 flex items-center justify-start pl-4"
        >
          <DollarSign className="h-5 w-5 text-white" />
        </motion.div>

        {/* Table Row */}
        <motion.div
          style={{ x }}
          drag={!selectionMode ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 items-center px-3 py-2 bg-card border-b border-border/30 cursor-pointer
            hover:bg-secondary/30 transition-colors text-sm
            ${selectionMode && isSelected ? 'bg-primary/5' : ''}
          `}
          onClick={() => selectionMode ? onSelect() : onOpenDetail()}
        >
          {/* Selection */}
          <AnimatePresence>
            {selectionMode && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                <div className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-primary' : 'bg-secondary/80 border border-border'
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image + Name Column */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-12 flex-shrink-0 rounded overflow-hidden bg-muted/30">
              <CardImage
                src={item.card_image_url}
                alt={item.name}
                size="xs"
                rounded="md"
                containerClassName="w-full h-full"
                className="w-full h-full object-contain"
                loading="lazy"
                graded={isGraded}
                gradingCompany={item.grading_company || undefined}
                grade={item.grade}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">{item.set_name}</p>
            </div>
          </div>

          {/* Condition */}
          <div className="text-center w-16">
            <ConditionBadge 
              condition={item.condition || item.raw_condition} 
              grade={item.grade}
              gradingCompany={item.grading_company}
            />
          </div>

          {/* Grade */}
          <div className="text-center w-16">
            {isGraded ? (
              <span className="text-xs font-semibold text-primary">
                {item.grading_company?.toUpperCase()} {item.grade}
              </span>
            ) : item.category === 'sealed' ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">Sealed</span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>

          {/* Cost Basis */}
          <div className="text-right w-20 tabular-nums text-muted-foreground">
            ${costBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Current Value */}
          <div className="text-right w-20 tabular-nums font-semibold">
            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Profit/ROI */}
          <div className={`text-right w-24 tabular-nums font-medium ${
            pnl.hasData && !pnl.isNeutral 
              ? pnl.isUp ? 'text-navy-500' : 'text-red-500'
              : 'text-muted-foreground'
          }`}>
            {pnl.hasData && !pnl.isNeutral ? (
              <div className="flex items-center justify-end gap-1">
                {pnl.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>
                  {pnl.isUp ? '+' : ''}${pnl.gain.toFixed(2)}
                  <span className="text-[10px] ml-0.5 opacity-70">({pnl.roi.toFixed(0)}%)</span>
                </span>
              </div>
            ) : (
              <span>—</span>
            )}
          </div>
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

export default InventoryTableCard;
