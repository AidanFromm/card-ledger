import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Flame, Snowflake } from "lucide-react";

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
  type: 'gainers' | 'losers';
  rank: number;
}

const MoverCard = memo(({ item, change, changePercent, index, type, rank }: MoverCardProps) => {
  const isGainer = type === 'gainers';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.08,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`
        flex-shrink-0 w-[140px] relative overflow-hidden
        bg-gradient-to-br rounded-2xl p-3
        border backdrop-blur-sm cursor-pointer
        transition-shadow duration-300
        ${isGainer 
          ? 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 hover:shadow-emerald-500/10 hover:shadow-lg' 
          : 'from-red-500/10 via-red-500/5 to-transparent border-red-500/20 hover:shadow-red-500/10 hover:shadow-lg'
        }
      `}
    >
      {/* Rank badge */}
      <div className={`
        absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center
        text-[10px] font-bold
        ${isGainer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}
      `}>
        #{rank}
      </div>

      {/* Card Image */}
      <div className="w-full h-[80px] mb-2 rounded-xl overflow-hidden bg-zinc-800/50 relative">
        {item.card_image_url ? (
          <img 
            src={item.card_image_url} 
            alt={item.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isGainer ? (
              <Flame className="h-8 w-8 text-emerald-500/30" />
            ) : (
              <Snowflake className="h-8 w-8 text-red-500/30" />
            )}
          </div>
        )}
        
        {/* Grade badge */}
        {item.grade && item.grading_company && item.grading_company.toLowerCase() !== 'raw' && (
          <div className="absolute bottom-1 left-1 bg-zinc-900/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
            <span className="text-[9px] font-bold text-zinc-300">
              {item.grading_company} {item.grade}
            </span>
          </div>
        )}
      </div>

      {/* Card Name */}
      <p className="text-xs font-semibold text-white truncate mb-0.5 leading-tight">
        {item.name}
      </p>
      
      {/* Set Name */}
      <p className="text-[10px] text-zinc-500 truncate mb-2">
        {item.set_name}
      </p>

      {/* Change Display */}
      <div className="flex items-center gap-1.5">
        <div className={`
          flex items-center gap-0.5 px-2 py-1 rounded-lg
          ${isGainer ? 'bg-emerald-500/20' : 'bg-red-500/20'}
        `}>
          {isGainer ? (
            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-400" />
          )}
          <span className={`text-xs font-bold ${isGainer ? 'text-emerald-400' : 'text-red-400'}`}>
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
      </div>
      
      {/* Dollar Change */}
      <p className={`text-[10px] mt-1 font-medium ${isGainer ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
        {change >= 0 ? '+' : '-'}${Math.abs(change).toFixed(2)}
      </p>
    </motion.div>
  );
});

MoverCard.displayName = "MoverCard";

export const TopMovers = memo(({ items, type, limit = 5 }: TopMoversProps) => {
  const movers = useMemo(() => {
    const withChanges = items
      .filter(item => item.market_price && item.market_price !== item.purchase_price)
      .map(item => {
        const marketValue = (item.market_price || item.purchase_price) * item.quantity;
        const costBasis = item.purchase_price * item.quantity;
        const change = marketValue - costBasis;
        const changePercent = costBasis > 0 ? (change / costBasis) * 100 : 0;
        return { item, change, changePercent };
      });

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

  const isGainer = type === 'gainers';
  const Icon = isGainer ? TrendingUp : TrendingDown;
  const title = isGainer ? 'Top Gainers' : 'Top Losers';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <div className={`
          p-1.5 rounded-lg
          ${isGainer ? 'bg-emerald-500/15' : 'bg-red-500/15'}
        `}>
          <Icon className={`h-4 w-4 ${isGainer ? 'text-emerald-400' : 'text-red-400'}`} />
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
          {movers.length} cards
        </span>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {movers.map(({ item, change, changePercent }, index) => (
          <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
            <MoverCard
              item={item}
              change={change}
              changePercent={changePercent}
              index={index}
              type={type}
              rank={index + 1}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
});

TopMovers.displayName = "TopMovers";

export default TopMovers;
