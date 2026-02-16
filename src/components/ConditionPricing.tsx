import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConditionPrices } from '@/lib/justTcgApi';

// Condition labels and colors
const CONDITIONS = [
  { key: 'NM', label: 'Near Mint', shortLabel: 'NM', description: 'Mint to Near Mint condition', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  { key: 'LP', label: 'Lightly Played', shortLabel: 'LP', description: 'Minor wear, light scratches', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { key: 'MP', label: 'Moderately Played', shortLabel: 'MP', description: 'Noticeable wear, creases', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { key: 'HP', label: 'Heavily Played', shortLabel: 'HP', description: 'Major wear, damage visible', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { key: 'DMG', label: 'Damaged', shortLabel: 'DMG', description: 'Severe damage, tears, water damage', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
] as const;

interface ConditionPricingProps {
  /** Condition prices object */
  prices: ConditionPrices;
  /** Loading state */
  loading?: boolean;
  /** Current selected condition */
  selectedCondition?: string;
  /** Whether to show foil prices */
  showFoil?: boolean;
  /** Callback when condition is selected */
  onConditionSelect?: (condition: string) => void;
  /** Compact mode */
  compact?: boolean;
  /** Show as collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Custom className */
  className?: string;
}

export const ConditionPricing = memo(({
  prices,
  loading = false,
  selectedCondition,
  showFoil = false,
  onConditionSelect,
  compact = false,
  collapsible = false,
  defaultCollapsed = true,
  className,
}: ConditionPricingProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showingFoil, setShowingFoil] = useState(false);
  
  // Check if we have any prices
  const hasNormalPrices = CONDITIONS.some(c => prices[c.key as keyof ConditionPrices]);
  const hasFoilPrices = CONDITIONS.some(c => prices[`foil_${c.key}` as keyof ConditionPrices]);
  
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }
  
  if (!hasNormalPrices && !hasFoilPrices) {
    return (
      <div className={cn('text-center py-4 text-sm text-zinc-500', className)}>
        No pricing data available
      </div>
    );
  }
  
  const formatPrice = (price: number | undefined) => {
    if (!price) return '—';
    return `$${price.toFixed(2)}`;
  };
  
  const getPercentOfNM = (condition: string) => {
    const nmPrice = showingFoil ? prices.foil_NM : prices.NM;
    const conditionPrice = showingFoil 
      ? prices[`foil_${condition}` as keyof ConditionPrices] 
      : prices[condition as keyof ConditionPrices];
    
    if (!nmPrice || !conditionPrice) return null;
    return ((conditionPrice as number) / nmPrice * 100).toFixed(0);
  };
  
  const content = (
    <div className="space-y-2">
      {/* Foil toggle if we have both */}
      {hasFoilPrices && hasNormalPrices && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            onClick={() => setShowingFoil(false)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
              !showingFoil 
                ? 'bg-zinc-700 text-white' 
                : 'text-zinc-400 hover:text-white'
            )}
          >
            Normal
          </button>
          <button
            onClick={() => setShowingFoil(true)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1',
              showingFoil 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'text-zinc-400 hover:text-white'
            )}
          >
            <Sparkles className="h-3 w-3" />
            Foil
          </button>
        </div>
      )}
      
      {/* Condition grid */}
      {compact ? (
        // Compact horizontal layout
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CONDITIONS.map(condition => {
            const price = showingFoil 
              ? prices[`foil_${condition.key}` as keyof ConditionPrices]
              : prices[condition.key as keyof ConditionPrices];
            
            if (!price) return null;
            
            const isSelected = selectedCondition === condition.key;
            
            return (
              <motion.button
                key={condition.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => onConditionSelect?.(condition.key)}
                className={cn(
                  'flex-shrink-0 px-3 py-2 rounded-xl text-center transition-all border',
                  isSelected 
                    ? `${condition.bgColor} ${condition.borderColor} ${condition.color}` 
                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                )}
              >
                <div className={cn('text-xs font-bold', isSelected ? condition.color : 'text-white')}>
                  {condition.shortLabel}
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  {formatPrice(price as number)}
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        // Full grid layout
        <div className="grid grid-cols-1 gap-2">
          {CONDITIONS.map(condition => {
            const price = showingFoil 
              ? prices[`foil_${condition.key}` as keyof ConditionPrices]
              : prices[condition.key as keyof ConditionPrices];
            
            if (!price) return null;
            
            const isSelected = selectedCondition === condition.key;
            const percentOfNM = getPercentOfNM(condition.key);
            
            return (
              <motion.button
                key={condition.key}
                whileTap={{ scale: 0.98 }}
                onClick={() => onConditionSelect?.(condition.key)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl transition-all border',
                  isSelected 
                    ? `${condition.bgColor} ${condition.borderColor}` 
                    : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                    condition.bgColor,
                    condition.color
                  )}>
                    {condition.shortLabel}
                  </div>
                  <div className="text-left">
                    <div className={cn('font-medium text-sm', isSelected ? 'text-white' : 'text-zinc-300')}>
                      {condition.label}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {condition.description}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={cn('font-bold text-lg', isSelected ? 'text-white' : 'text-zinc-200')}>
                    {formatPrice(price as number)}
                  </div>
                  {percentOfNM && condition.key !== 'NM' && (
                    <div className="text-[10px] text-zinc-500">
                      {percentOfNM}% of NM
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
  
  if (collapsible) {
    return (
      <div className={cn('rounded-2xl border bg-zinc-900/50', className)}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-semibold text-sm text-white">Condition Pricing</span>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          )}
        </button>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {content}
    </div>
  );
});

ConditionPricing.displayName = 'ConditionPricing';

/**
 * Simple inline condition price display
 */
interface ConditionPriceBadgeProps {
  condition: string;
  price: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ConditionPriceBadge = memo(({
  condition,
  price,
  selected = false,
  onClick,
  className,
}: ConditionPriceBadgeProps) => {
  const conditionInfo = CONDITIONS.find(c => c.key === condition);
  
  if (!conditionInfo) return null;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all',
        selected 
          ? `${conditionInfo.bgColor} ${conditionInfo.color} ring-1 ring-offset-1 ring-offset-zinc-900 ${conditionInfo.borderColor.replace('border', 'ring')}`
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
        className
      )}
    >
      <span className="font-bold">{conditionInfo.shortLabel}</span>
      <span>${price.toFixed(2)}</span>
    </button>
  );
});

ConditionPriceBadge.displayName = 'ConditionPriceBadge';

export default ConditionPricing;
