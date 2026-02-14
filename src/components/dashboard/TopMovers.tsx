import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Flame, 
  Snowflake,
  ChevronRight,
  Zap
} from "lucide-react";
import { MiniSparkline } from "./Sparkline";

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
  price_history?: number[];
}

interface TopMoversProps {
  items: InventoryItem[];
  type: 'gainers' | 'losers';
  limit?: number;
  onCardClick?: (item: InventoryItem) => void;
}

interface MoverCardProps {
  item: InventoryItem;
  change: number;
  changePercent: number;
  index: number;
  type: 'gainers' | 'losers';
  rank: number;
  onClick?: () => void;
}

const MoverCard = memo(({ item, change, changePercent, index, type, rank, onClick }: MoverCardProps) => {
  const isGainer = type === 'gainers';
  const accentColor = isGainer ? "#10b981" : "#ef4444";
  
  // Fake sparkline data based on change direction
  const sparklineData = useMemo(() => {
    const baseValue = item.purchase_price;
    const currentValue = item.market_price || baseValue;
    const trend = isGainer ? 1 : -1;
    
    // Generate 7 points trending in the right direction
    return Array(7).fill(0).map((_, i) => {
      const progress = i / 6;
      const noise = (Math.random() - 0.5) * 0.1;
      return baseValue + (currentValue - baseValue) * progress + baseValue * noise * (1 - progress);
    });
  }, [item.purchase_price, item.market_price, isGainer]);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.06,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex-shrink-0 w-[160px] relative overflow-hidden
        bg-gradient-to-br rounded-2xl p-3 cursor-pointer
        border backdrop-blur-md group
        transition-all duration-300
        ${isGainer 
          ? 'from-emerald-500/10 via-emerald-500/5 to-zinc-900/80 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-500/20 hover:shadow-xl' 
          : 'from-red-500/10 via-red-500/5 to-zinc-900/80 border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/20 hover:shadow-xl'
        }
      `}
    >
      {/* Rank badge with fire/ice effect */}
      <motion.div 
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.06 + 0.2, type: "spring" }}
        className={`
          absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center
          text-[10px] font-bold shadow-lg
          ${isGainer 
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' 
            : 'bg-gradient-to-br from-red-400 to-red-600 text-white'
          }
        `}
      >
        {rank <= 3 ? (
          isGainer ? (
            <Flame className="w-3.5 h-3.5" />
          ) : (
            <Snowflake className="w-3.5 h-3.5" />
          )
        ) : (
          `#${rank}`
        )}
      </motion.div>

      {/* Card Image with overlay gradient */}
      <div className="w-full h-[90px] mb-2 rounded-xl overflow-hidden bg-zinc-800/50 relative">
        {item.card_image_url ? (
          <>
            <motion.img 
              src={item.card_image_url} 
              alt={item.name}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            {/* Shine overlay on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isGainer ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="h-10 w-10 text-emerald-500/30" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Snowflake className="h-10 w-10 text-red-500/30" />
              </motion.div>
            )}
          </div>
        )}
        
        {/* Grade badge */}
        {item.grade && item.grading_company && item.grading_company.toLowerCase() !== 'raw' && (
          <div className="absolute bottom-1 left-1 bg-zinc-900/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-zinc-700/50">
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

      {/* Sparkline */}
      <div className="h-[24px] mb-2 opacity-70">
        <MiniSparkline 
          data={sparklineData} 
          width={134} 
          height={24}
          color={accentColor}
        />
      </div>

      {/* Change Display */}
      <div className="flex items-center justify-between">
        <div className={`
          flex items-center gap-1 px-2 py-1 rounded-lg
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
        
        {/* Dollar Change */}
        <span className={`text-[10px] font-semibold ${isGainer ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
          {change >= 0 ? '+' : '-'}${Math.abs(change).toFixed(2)}
        </span>
      </div>
    </motion.div>
  );
});

MoverCard.displayName = "MoverCard";

export const TopMovers = memo(({ items, type, limit = 6, onCardClick }: TopMoversProps) => {
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
  const subtitle = isGainer ? 'Best performing cards' : 'Underperforming cards';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: isGainer ? 15 : -15 }}
            className={`
              p-2 rounded-xl
              ${isGainer ? 'bg-emerald-500/15' : 'bg-red-500/15'}
            `}
          >
            <Icon className={`h-5 w-5 ${isGainer ? 'text-emerald-400' : 'text-red-400'}`} />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {title}
              {isGainer && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                </motion.span>
              )}
            </h3>
            <p className="text-[10px] text-zinc-500">{subtitle}</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        
        <div 
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory"
        >
          <AnimatePresence>
            {movers.map(({ item, change, changePercent }, index) => (
              <div key={item.id} className="snap-start">
                <MoverCard
                  item={item}
                  change={change}
                  changePercent={changePercent}
                  index={index}
                  type={type}
                  rank={index + 1}
                  onClick={() => onCardClick?.(item)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

TopMovers.displayName = "TopMovers";

export default TopMovers;
