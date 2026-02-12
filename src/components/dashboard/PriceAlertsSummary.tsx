import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  BellRing, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

interface PriceAlert {
  id: string;
  cardName: string;
  targetPrice: number;
  currentPrice: number;
  type: 'above' | 'below';
  triggered: boolean;
  triggeredAt?: Date;
  cardImage?: string;
}

interface PriceAlertsSummaryProps {
  alerts?: PriceAlert[];
  activeCount?: number;
  triggeredCount?: number;
  className?: string;
}

export const PriceAlertsSummary = memo(({ 
  alerts = [],
  activeCount = 0,
  triggeredCount = 0,
  className = "",
}: PriceAlertsSummaryProps) => {
  const navigate = useNavigate();
  
  // Get recently triggered alerts
  const recentlyTriggered = alerts
    .filter(a => a.triggered)
    .sort((a, b) => {
      if (!a.triggeredAt || !b.triggeredAt) return 0;
      return b.triggeredAt.getTime() - a.triggeredAt.getTime();
    })
    .slice(0, 3);

  const hasAlerts = activeCount > 0 || triggeredCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/40 
        backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-5 
        relative overflow-hidden ${className}
      `}
    >
      {/* Background pulse for triggered alerts */}
      {triggeredCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className={`
            p-1.5 rounded-lg relative
            ${triggeredCount > 0 ? 'bg-amber-500/20' : 'bg-zinc-800/50'}
          `}>
            {triggeredCount > 0 ? (
              <>
                <BellRing className="h-4 w-4 text-amber-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
              </>
            ) : (
              <Bell className="h-4 w-4 text-zinc-400" />
            )}
          </div>
          <h3 className="text-base font-semibold text-white">Price Alerts</h3>
        </div>
        
        <button 
          onClick={() => navigate('/alerts')}
          className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
        >
          Manage
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {hasAlerts ? (
        <div className="space-y-4 relative z-10">
          {/* Stats Row */}
          <div className="flex items-center gap-3">
            {/* Active Alerts */}
            <div className="flex-1 bg-zinc-800/40 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400">Active</span>
              </div>
              <p className="text-xl font-bold text-white">{activeCount}</p>
            </div>

            {/* Triggered Alerts */}
            <div className={`
              flex-1 rounded-xl p-3
              ${triggeredCount > 0 ? 'bg-amber-500/15 border border-amber-500/20' : 'bg-zinc-800/40'}
            `}>
              <div className="flex items-center gap-2 mb-1">
                <BellRing className={`w-3.5 h-3.5 ${triggeredCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span className={`text-xs ${triggeredCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                  Triggered
                </span>
              </div>
              <p className={`text-xl font-bold ${triggeredCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                {triggeredCount}
              </p>
            </div>
          </div>

          {/* Recently Triggered List */}
          {recentlyTriggered.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 px-1">Recently Triggered</p>
              {recentlyTriggered.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 bg-zinc-800/30 rounded-xl p-2.5"
                >
                  {/* Card Image */}
                  {alert.cardImage ? (
                    <div className="w-8 h-11 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      <img 
                        src={alert.cardImage}
                        alt={alert.cardName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-11 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-zinc-600" />
                    </div>
                  )}

                  {/* Alert Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {alert.cardName}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {alert.type === 'above' ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-xs text-zinc-400">
                        {alert.type === 'above' ? 'Reached' : 'Dropped to'} ${alert.currentPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="py-6 text-center relative z-10">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-zinc-800/50 flex items-center justify-center">
            <Bell className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-400 mb-1">No price alerts set</p>
          <p className="text-xs text-zinc-600 mb-4">
            Get notified when cards reach your target price
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/alerts')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-xl"
          >
            Create Alert
          </motion.button>
        </div>
      )}
    </motion.div>
  );
});

PriceAlertsSummary.displayName = "PriceAlertsSummary";

export default PriceAlertsSummary;
