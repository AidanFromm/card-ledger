import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  set_name: string;
  purchase_price: number;
  market_price: number | null;
  quantity: number;
  card_image_url?: string | null;
  grading_company?: string | null;
  grade?: string | null;
}

interface TopMoversProps {
  items: InventoryItem[];
  type: 'gainers' | 'losers';
  limit?: number;
}

interface MoverCardProps {
  item: InventoryItem;
  change: number;
  changePercent: number;
  index: number;
}

const MoverCard = memo(({ item, change, changePercent, index }: MoverCardProps) => {
  const isPositive = change >= 0;
  const bgColor = isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10';
  const textColor = isPositive ? 'text-emerald-500' : 'text-red-500';
  const borderColor = isPositive ? 'border-emerald-500/20' : 'border-red-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex-shrink-0 w-36 p-3 rounded-xl border ${borderColor} ${bgColor} backdrop-blur-sm`}
    >
      {/* Card Image or Placeholder */}
      {item.card_image_url ? (
        <div className="w-full h-14 mb-2 rounded-lg overflow-hidden bg-black/20">
          <img 
            src={item.card_image_url} 
            alt={item.name}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="w-full h-14 mb-2 rounded-lg bg-muted/30 flex items-center justify-center">
          {isPositive ? (
            <TrendingUp className="h-6 w-6 text-emerald-500/50" />
          ) : (
            <TrendingDown className="h-6 w-6 text-red-500/50" />
          )}
        </div>
      )}

      {/* Card Name */}
      <p className="text-xs font-medium text-foreground truncate mb-0.5">
        {item.name}
      </p>
      
      {/* Set Name */}
      <p className="text-[10px] text-muted-foreground truncate mb-2">
        {item.set_name}
      </p>

      {/* Change */}
      <div className="flex items-center gap-1">
        {isPositive ? (
          <ArrowUpRight className={`h-3.5 w-3.5 ${textColor}`} />
        ) : (
          <ArrowDownRight className={`h-3.5 w-3.5 ${textColor}`} />
        )}
        <span className={`text-xs font-semibold ${textColor}`}>
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
      </div>
      
      {/* Dollar Change */}
      <p className={`text-[10px] ${textColor} opacity-80`}>
        {change >= 0 ? '+' : '-'}${Math.abs(change).toFixed(2)}
      </p>
    </motion.div>
  );
});

MoverCard.displayName = "MoverCard";

export const TopMovers = memo(({ items, type, limit = 5 }: TopMoversProps) => {
  const movers = useMemo(() => {
    // Calculate change for each item
    const withChanges = items
      .filter(item => item.market_price && item.market_price !== item.purchase_price)
      .map(item => {
        const marketValue = (item.market_price || item.purchase_price) * item.quantity;
        const costBasis = item.purchase_price * item.quantity;
        const change = marketValue - costBasis;
        const changePercent = costBasis > 0 ? (change / costBasis) * 100 : 0;
        return { item, change, changePercent };
      });

    // Sort by change
    if (type === 'gainers') {
      return withChanges
        .filter(m => m.change > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit);
    } else {
      return withChanges
        .filter(m => m.change < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, limit);
    }
  }, [items, type, limit]);

  if (movers.length === 0) {
    return null;
  }

  const title = type === 'gainers' ? 'Top Gainers' : 'Top Losers';
  const Icon = type === 'gainers' ? TrendingUp : TrendingDown;
  const iconColor = type === 'gainers' ? 'text-emerald-500' : 'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {movers.map(({ item, change, changePercent }, index) => (
          <MoverCard
            key={item.id}
            item={item}
            change={change}
            changePercent={changePercent}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
});

TopMovers.displayName = "TopMovers";

export default TopMovers;
