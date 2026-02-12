import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, TrendingUp, TrendingDown, MoreVertical, DollarSign, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { triggerSuccessHaptic, triggerDestructiveHaptic } from "@/lib/haptics";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface InventoryListCardProps {
  item: InventoryItem;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onSell: () => void;
  onDelete: () => void;
}

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
}: InventoryListCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDelete = () => {
    triggerDestructiveHaptic();
    onDelete();
    setShowDeleteConfirm(false);
  };

  const handleSell = () => {
    triggerSuccessHaptic();
    onSell();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        layout
        className={`flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 cursor-pointer
          hover:shadow-md hover:border-border transition-all
          ${selectionMode && isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        `}
        onClick={() => selectionMode ? onSelect() : onOpenDetail()}
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

        {/* Actions Menu (hidden in selection mode) */}
        {!selectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-2 rounded-lg hover:bg-secondary/80 transition-colors">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={handleSell} className="gap-2 text-emerald-600">
                <DollarSign className="h-4 w-4" />
                Sell
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteConfirm(true)} 
                className="gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>

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
