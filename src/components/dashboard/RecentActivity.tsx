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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  type: 'added' | 'sold' | 'price_up' | 'price_down';
  item: InventoryItem;
  timestamp: Date;
  details?: {
    oldPrice?: number;
    newPrice?: number;
    salePrice?: number;
  };
}

interface RecentActivityProps {
  items: InventoryItem[];
  soldItems?: InventoryItem[];
  limit?: number;
  onViewAll?: () => void;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'added':
      return { icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
    case 'sold':
      return { icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/15' };
    case 'price_up':
      return { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
    case 'price_down':
      return { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/15' };
    default:
      return { icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-500/15' };
  }
};

const getActivityLabel = (activity: ActivityItem): string => {
  switch (activity.type) {
    case 'added':
      return 'Added to collection';
    case 'sold':
      return `Sold for $${activity.details?.salePrice?.toFixed(2) || '0.00'}`;
    case 'price_up':
      return `Price increased ${activity.details?.oldPrice && activity.details?.newPrice 
        ? `+$${(activity.details.newPrice - activity.details.oldPrice).toFixed(2)}`
        : ''
      }`;
    case 'price_down':
      return `Price dropped ${activity.details?.oldPrice && activity.details?.newPrice 
        ? `-$${(activity.details.oldPrice - activity.details.newPrice).toFixed(2)}`
        : ''
      }`;
    default:
      return 'Activity';
  }
};

interface ActivityRowProps {
  activity: ActivityItem;
  index: number;
}

const ActivityRow = memo(({ activity, index }: ActivityRowProps) => {
  const { icon: Icon, color, bg } = getActivityIcon(activity.type);
  const label = getActivityLabel(activity);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 py-3 group cursor-pointer hover:bg-zinc-800/30 -mx-4 px-4 rounded-xl transition-colors"
    >
      {/* Timeline dot and line */}
      <div className="relative flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {index < 4 && (
          <div className="absolute top-full w-px h-3 bg-zinc-800" />
        )}
      </div>

      {/* Card image */}
      {activity.item.card_image_url ? (
        <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-800/50 flex-shrink-0">
          <img 
            src={activity.item.card_image_url} 
            alt={activity.item.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-10 h-14 rounded-lg bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-zinc-600" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {activity.item.name}
        </p>
        <p className={`text-xs ${color} truncate`}>
          {label}
        </p>
      </div>

      {/* Timestamp */}
      <div className="text-right flex-shrink-0">
        <span className="text-xs text-zinc-500">
          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
        </span>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
});

ActivityRow.displayName = "ActivityRow";

export const RecentActivity = memo(({ 
  items, 
  soldItems = [],
  limit = 5,
  onViewAll,
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
        allActivities.push({
          id: `sold-${item.id}`,
          type: 'sold',
          item,
          timestamp: new Date(item.sale_date),
          details: { salePrice: item.sale_price || 0 },
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

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-5"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-zinc-800/50">
            <Clock className="h-4 w-4 text-zinc-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Recent Activity</h3>
        </div>

        <div className="py-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-zinc-800/50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-500">No recent activity</p>
          <p className="text-xs text-zinc-600 mt-1">Add cards to see your timeline</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-800/50">
            <Clock className="h-4 w-4 text-zinc-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Recent Activity</h3>
        </div>
        
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Activity List */}
      <AnimatePresence>
        <div className="divide-y divide-zinc-800/50">
          {activities.map((activity, index) => (
            <ActivityRow 
              key={activity.id} 
              activity={activity} 
              index={index}
            />
          ))}
        </div>
      </AnimatePresence>
    </motion.div>
  );
});

RecentActivity.displayName = "RecentActivity";

export default RecentActivity;
