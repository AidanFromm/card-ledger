import { getConditionLabel, getConditionColor, getConditionMultiplier } from "@/lib/conditionPricing";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ConditionBadgeProps {
  condition: string | null | undefined;
  showMultiplier?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ConditionBadge = ({ 
  condition, 
  showMultiplier = false,
  size = "sm",
  className 
}: ConditionBadgeProps) => {
  const label = getConditionLabel(condition);
  const colorClass = getConditionColor(condition);
  const multiplier = getConditionMultiplier(condition);
  
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-2.5 py-1.5",
  };
  
  // Short label for display
  const shortLabel = label.split(' ').map(w => w[0]).join('').toUpperCase();
  
  const badge = (
    <span 
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap",
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {size === "sm" ? shortLabel : label}
      {showMultiplier && multiplier !== 1.0 && (
        <span className="opacity-70">
          ({Math.round(multiplier * 100)}%)
        </span>
      )}
    </span>
  );
  
  // Add tooltip for small badges
  if (size === "sm") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="font-medium">{label}</div>
          {multiplier !== 1.0 && (
            <div className="text-muted-foreground">
              {Math.round((1 - multiplier) * 100)}% below NM price
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return badge;
};

// Price display with condition adjustment
interface AdjustedPriceProps {
  marketPrice: number;
  condition: string | null | undefined;
  isGraded?: boolean;
  className?: string;
  showOriginal?: boolean;
}

export const AdjustedPrice = ({
  marketPrice,
  condition,
  isGraded = false,
  className,
  showOriginal = false,
}: AdjustedPriceProps) => {
  const multiplier = isGraded ? 1.0 : getConditionMultiplier(condition);
  const adjustedPrice = Math.round(marketPrice * multiplier * 100) / 100;
  const hasDiscount = multiplier < 1.0 && !isGraded;
  
  const formatPrice = (price: number) => 
    price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className="font-semibold">${formatPrice(adjustedPrice)}</span>
      {showOriginal && hasDiscount && (
        <span className="text-muted-foreground line-through text-xs">
          ${formatPrice(marketPrice)}
        </span>
      )}
    </span>
  );
};

export default ConditionBadge;
