import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Check, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
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

const getGradeStyles = (grade: string | null, gradingCompany: string | null): string => {
  if (!grade || gradingCompany === 'raw') return 'bg-secondary/60 text-muted-foreground';
  const numGrade = parseFloat(grade);
  if (numGrade >= 9.5) return 'bg-amber-500/15 text-amber-500';
  if (numGrade >= 9) return 'bg-emerald-500/15 text-emerald-500';
  if (numGrade >= 8) return 'bg-sky-500/15 text-sky-500';
  if (numGrade >= 7) return 'bg-violet-500/15 text-violet-500';
  return 'bg-slate-500/15 text-slate-400';
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

  const gradeName = isGraded
    ? getGradeLabel(item.grading_company, parseFloat(item.grade!))
    : null;

  const price = item.market_price || item.purchase_price;
  const gradeColorClass = getGradeStyles(item.grade, item.grading_company);

  const slabTemplatePath = isGraded && !slabError
    ? getSlabTemplatePath(item.grading_company, item.grade!)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.97 }}
      className="group"
    >
      <div
        className={`relative overflow-hidden rounded-[20px] bg-card cursor-pointer transition-shadow duration-300
          ${selectionMode && isSelected
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
            : ''
          }
        `}
        style={{
          boxShadow: 'var(--shadow-card)',
        }}
        onClick={() => selectionMode ? onSelect() : onOpenDetail()}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
        }}
      >
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute top-3 left-3 z-20">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? 'bg-primary shadow-lg shadow-primary/30'
                : 'bg-black/40 backdrop-blur-sm border border-white/20'
            }`}>
              {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
            </div>
          </div>
        )}

        {/* Hover actions */}
        {!selectionMode && (
          <>
            <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-emerald-500/30"
                onClick={(e) => { e.stopPropagation(); onSell(); }}
              >
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                Sell
              </Button>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-black/40 hover:bg-red-500 text-white rounded-full backdrop-blur-sm border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="font-semibold text-foreground">{item.name}</span> will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground rounded-xl">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {/* Image Area */}
        <div className="aspect-[3/4] w-full bg-gradient-to-br from-muted/5 to-muted/15 overflow-hidden relative flex items-center justify-center">
          {/* Slab overlay */}
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
                  <div className="w-6 h-6 border-2 border-muted-foreground/10 border-t-primary/50 rounded-full animate-spin" />
                </div>
              )}
              <img
                src={item.card_image_url}
                alt={item.name}
                className={`w-full h-full object-contain transition-all duration-500 ${
                  imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                } ${slabTemplatePath ? 'p-[15%] pt-[25%] pb-[12%]' : 'p-3'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/3 via-primary/5 to-primary/3">
              <img
                src={getPlaceholderForItem({ category: item.category, grading_company: item.grading_company })}
                alt="Placeholder"
                className={`w-full h-full object-contain opacity-50 ${slabTemplatePath ? 'p-[15%] pt-[25%] pb-[12%]' : 'p-4'}`}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-3 pt-2.5 pb-3">
          {/* Name */}
          <h3 className="font-semibold text-[13px] leading-tight line-clamp-2">
            {item.name}
          </h3>

          {/* Set + Number */}
          <p className="text-[11px] text-muted-foreground/60 line-clamp-1 mt-0.5">
            {item.set_name}
            {item.card_number && item.category !== 'sealed' && (
              <span className="opacity-60"> #{item.card_number}</span>
            )}
          </p>

          {/* Market Price — Hero Number */}
          <p className="text-[15px] font-bold text-emerald-500 mt-1.5 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ${formatPrice(item.market_price || item.purchase_price)}
          </p>

          {/* Cost basis + Profit/Loss — more prominent */}
          {item.market_price && item.purchase_price > 0 && item.market_price !== item.purchase_price && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-muted-foreground/50 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                Cost: ${formatPrice(item.purchase_price)}
              </span>
              {(() => {
                const pl = (item.market_price - item.purchase_price) * item.quantity;
                const plPct = ((item.market_price - item.purchase_price) / item.purchase_price) * 100;
                const isUp = pl >= 0;
                return (
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                    isUp ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
                  }`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isUp ? '+' : ''}{plPct.toFixed(1)}%
                  </span>
                );
              })()}
            </div>
          )}

          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {gradeDisplay ? (
              <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold ${gradeColorClass}`}>
                {gradeDisplay}
                {gradeName && <span className="opacity-60 ml-0.5 font-semibold">({gradeName})</span>}
              </span>
            ) : item.category === 'sealed' ? (
              <span className="text-[10px] py-0.5 px-2 rounded-full font-bold bg-purple-500/12 text-purple-400">
                Sealed
              </span>
            ) : (
              <span className="text-[10px] py-0.5 px-2 rounded-full font-medium bg-secondary/50 text-muted-foreground/60">
                Raw
              </span>
            )}
            {item.quantity > 1 && (
              <span className="text-[10px] py-0.5 px-2 rounded-full bg-secondary/40 text-muted-foreground/60 font-semibold">
                ×{item.quantity}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
