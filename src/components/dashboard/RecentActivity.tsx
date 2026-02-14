import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Activity,
  ChevronRight,
  Bell,
  Sparkles,
  Package,
  Zap
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface InventoryItem {
  id: string;
  name: string;
  card_image_url?: string | null;
  purchase_price: number;
  market_price?: number | null;
  created_at?: string;
  updated_at?: string;
  sale_price?: number | null;
  sale_date?: string | null;
  quantity: number;
}

interface ActivityItem {
  id: string;
  type: 'added' | 'sold' | 'price_up' | 'price_down' | 'alert';
  item: InventoryItem;
  timestamp: Date;
  details?: {
    oldPrice?: number;
    newPrice?: number;
    salePrice?: number;
    profit?: number;
  };
}

interface RecentActivityProps {
  items: InventoryItem[];
  soldItems?: InventoryItem[];
  limit?: number;
  onViewAll?: () => void;
  onActivityClick?: (activity: ActivityItem) => void;
}

const activityConfig = {
  added: { 
    icon: Plus, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    label: 'Added to collection',
    gradient: 'from-emerald-500/20 to-transparent'
  },
  sold: { 
    icon: DollarSign, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    label: 'Sold',
    gradient: 'from-amber-500/20 to-transparent'
  },
  price_up: { 
    icon: TrendingUp, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    label: 'Price increased',
    gradient: 'from-emerald-500/20 to-transparent'
  },
  price_down: { 
    icon: TrendingDown, 
    color: 'text-red-400', 
    bg: 'bg-red-500/15',
    borderColor: 'border-red-500/30',
    label: 'Price dropped',
    gradient: 'from-red-500/20 to-transparent'
  },
  alert: { 
    icon: Bell, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    label: 'Alert triggered',
    gradient: 'from-blue-500/20 to-transparent'
  },
};

const getActivityLabel = (activity: ActivityItem): string => {
  switch (activity.type) {
    case 'added':
      return 'Added to collection';
    case 'sold':
      const profit = activity.details?.profit;
      if (profit !== undefined) {
        return profit >= 0 
          ? `Sold • +$${profit.toFixed(2)} profit`
          : `Sold • -$${Math.abs(profit).toFixed(2)} loss`;
      }
      return `Sold for $${activity.details?.salePrice?.toFixed(2) || '0.00'}`;
    case 'price_up':
      return activity.details?.oldPrice && activity.details?.newPrice 
        ? `+$${(activity.details.newPrice - activity.details.oldPrice).toFixed(2)} increase`
        : 'Price increased';
    case 'price_down':
      return activity.details?.oldPrice && activity.details?.newPrice 
        ? `-$${(activity.details.oldPrice - activity.details.newPrice).toFixed(2)} decrease`
        : 'Price dropped';
    case 'alert':
      return 'Price alert triggered';
    default:
      return 'Activity';
  }
};

interface ActivityRowProps {
  activity: ActivityItem;
  index: number;
  isLast: boolean;
  onClick?: () => void;
}

const ActivityRow = memo(({ activity, index, isLast, onClick }: ActivityRowProps) => {
  const config = activityConfig[activity.type];
  const Icon = config.icon;
  const label = getActivityLabel(activity);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        delay: index * 0.06,
        type: "spring",
        stiffness: 200,
        damping: 25
      }}
      whileHover={{ x: 4, backgroundColor: 'rgba(39, 39, 42, 0.3)' }}
      onClick={onClick}
      className="relative flex items-center gap-3 py-3 group cursor-pointer -mx-4 px-4 rounded-xl transition-colors"
    >
      {/* Timeline connector */}
      <div className="relative flex flex-col items-center">
        {/* Icon container with pulse effect */}
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className={`relative w-10 h-10 rounded-xl ${config.bg} border ${config.borderColor} flex items-center justify-center flex-shrink-0 z-10`}
        >
          <Icon className={`w-4 h-4 ${config.color}`} />
          
          {/* New item pulse */}
          {index === 0 && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 rounded-xl ${config.bg}`}
            />
          )}
        </motion.div>
        
        {/* Timeline line */}
        {!isLast && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-zinc-700 to-transparent" />
        )}
      </div>

      {/* Card image */}
      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-800/50 flex-shrink-0 border border-zinc-700/50">
        {activity.item.card_image_url ? (
          <motion.img 
            src={activity.item.card_image_url} 
            alt={activity.item.name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-zinc-600" />
          </div>
        )}
        
        {/* Hover gradient */}
        <div className={`absolute inset-0 bg-gradient-to-t ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-white/90">
          {activity.item.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-medium ${config.color}`}>
            {label}
          </span>
          {activity.type === 'sold' && activity.details?.profit !== undefined && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.06 + 0.2 }}
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                activity.details.profit >= 0 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {activity.details.profit >= 0 ? '💰' : '📉'}
            </motion.span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-zinc-500 font-medium">
          {formatDistanceToNow(activity.timestamp, { addSuffix: false })}
        </span>
        <span className="text-[9px] text-zinc-600">
          {format(activity.timestamp, 'h:mm a')}
        </span>
      </div>

      {/* Arrow indicator */}
      <ChevronRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
    </motion.div>
  );
});

ActivityRow.displayName = "ActivityRow";

// Empty state component
const EmptyActivity = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="py-10 text-center"
  >
    <motion.div 
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center"
    >
      <Activity className="w-8 h-8 text-zinc-600" />
    </motion.div>
    <p className="text-sm font-medium text-zinc-400">No recent activity</p>
    <p className="text-xs text-zinc-600 mt-1">Add cards to see your timeline</p>
    
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium text-zinc-300 transition-colors flex items-center gap-2 mx-auto"
    >
      <Plus className="w-4 h-4" />
      Add your first card
    </motion.button>
  </motion.div>
));

EmptyActivity.displayName = "EmptyActivity";

export const RecentActivity = memo(({ 
  items, 
  soldItems = [],
  limit = 5,
  onViewAll,
  onActivityClick,
}: RecentActivityProps) => {
  const activities = useMemo(() => {
    const allActivities: ActivityItem[] = [];

    // Recently added items
    items.forEach(item => {
      if (item.created_at) {
        allActivities.push({
          id: `added-${item.id}`,
          type: 'added',
          item,
          timestamp: new Date(item.created_at),
        });
      }
    });

    // Sold items
    soldItems.forEach(item => {
      if (item.sale_date) {
        const profit = (item.sale_price || 0) - item.purchase_price;
        allActivities.push({
          id: `sold-${item.id}`,
          type: 'sold',
          item,
          timestamp: new Date(item.sale_date),
          details: { 
            salePrice: item.sale_price || 0,
            profit,
          },
        });
      }
    });

    // Price changes (items with market_price different from purchase_price)
    items.forEach(item => {
      if (item.market_price && item.market_price !== item.purchase_price && item.updated_at) {
        const priceDiff = item.market_price - item.purchase_price;
        allActivities.push({
          id: `price-${item.id}`,
          type: priceDiff > 0 ? 'price_up' : 'price_down',
          item,
          timestamp: new Date(item.updated_at),
          details: {
            oldPrice: item.purchase_price,
            newPrice: item.market_price,
          },
        });
      }
    });

    // Sort by timestamp descending
    return allActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }, [items, soldItems, limit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-5 relative overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50"
          >
            <Clock className="h-4 w-4 text-zinc-400" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Recent Activity
              {activities.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                >
                  <Zap className="w-2.5 h-2.5" />
                  Live
                </motion.span>
              )}
            </h3>
            <p className="text-[10px] text-zinc-500">Your latest collection updates</p>
          </div>
        </div>
        
        {onViewAll && activities.length > 0 && (
          <motion.button 
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewAll}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        )}
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <EmptyActivity />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <ActivityRow 
                key={activity.id} 
                activity={activity} 
                index={index}
                isLast={index === activities.length - 1}
                onClick={() => onActivityClick?.(activity)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  );
});

RecentActivity.displayName = "RecentActivity";

export default RecentActivity;
