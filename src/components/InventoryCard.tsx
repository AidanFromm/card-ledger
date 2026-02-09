import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Check, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";
import { getPlaceholderForItem } from "@/lib/cardNameUtils";
import { getSlabTemplatePath, getGradeLabel } from "@/lib/gradingScales";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface InventoryCardProps {
  item: InventoryItem;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onSell: () => void;
  onDelete: () => void;
}

// Grade color mapping - subtle tints
const getGradeStyles = (grade: string | null, gradingCompany: string | null): string => {
  if (!grade || gradingCompany === 'raw') {
    return 'bg-secondary/50 text-muted-foreground';
  }

  const numGrade = parseFloat(grade);

  // Handle half grades (9.5, 10, etc.)
  if (numGrade >= 9.5) return 'bg-amber-500/15 text-amber-500';    // Gem mint - gold
  if (numGrade >= 9) return 'bg-emerald-500/15 text-emerald-500';  // Mint - green
  if (numGrade >= 8) return 'bg-sky-500/15 text-sky-500';          // NM-MT - blue
  if (numGrade >= 7) return 'bg-violet-500/15 text-violet-500';    // NM - purple
  return 'bg-slate-500/15 text-slate-400';                         // Lower - neutral
};

export const InventoryCard = ({
  item,
  selectionMode,
  isSelected,
  onSelect,
  onOpenDetail,
  onSell,
  onDelete,
}: InventoryCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [slabError, setSlabError] = useState(false);

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

  // Get slab template path for graded cards
  const slabTemplatePath = isGraded && !slabError
    ? getSlabTemplatePath(item.grading_company, item.grade!)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileTap={{ scale: 0.98 }}
      className="group"
    >
      <div
        className={`relative overflow-hidden rounded-3xl bg-card cursor-pointer
          shadow-lg shadow-black/5 dark:shadow-black/20
          hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30
          transition-all duration-300
          ${selectionMode && isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        `}
        onClick={() => selectionMode ? onSelect() : onOpenDetail()}
      >
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute top-3 left-3 z-20">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
              isSelected ? 'bg-primary' : 'bg-black/50 backdrop-blur-sm'
            }`}>
              {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </div>
          </div>
        )}

        {/* Hover action buttons */}
        {!selectionMode && (
          <>
            <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs font-semibold rounded-full"
                onClick={(e) => { e.stopPropagation(); onSell(); }}
              >
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                Sell
              </Button>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-black/50 hover:bg-red-500 text-white rounded-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="font-semibold text-foreground">{item.name}</span> will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
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

          {item.card_image_url && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
                </div>
              )}
              <img
                src={item.card_image_url}
                alt={item.name}
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                } ${slabTemplatePath ? 'p-[15%] pt-[25%] pb-[12%]' : 'p-3'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/8 to-primary/5">
              <img
                src={getPlaceholderForItem({ category: item.category, grading_company: item.grading_company })}
                alt="Placeholder"
                className={`w-full h-full object-contain opacity-60 ${slabTemplatePath ? 'p-[15%] pt-[25%] pb-[12%]' : 'p-4'}`}
              />
            </div>
          )}
        </div>

        {/* Content - Below Image */}
        <div className="px-2.5 pt-2 pb-2">
          {/* Card Name - Primary */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {item.name}
          </h3>

          {/* Set & Number - Secondary */}
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {item.set_name}
            {item.card_number && item.category !== 'sealed' && (
              <span className="opacity-60"> #{item.card_number}</span>
            )}
          </p>

          {/* Price - Bold with tabular nums */}
          <p className="text-sm font-bold text-success mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>

          {/* Grade Badge Row */}
          <div className="flex items-center gap-1.5 mt-1">
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
  );
};
