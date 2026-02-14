import { usePriceAlerts, PriceAlert } from "@/hooks/usePriceAlerts";
import { Bell, BellRing, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface AlertsWidgetProps {
  maxItems?: number;
  className?: string;
}

const AlertsWidget = ({ maxItems = 3, className = '' }: AlertsWidgetProps) => {
  const navigate = useNavigate();
  const { activeAlerts, triggeredAlerts, activeCount, triggeredCount, loading } = usePriceAlerts();

  // Combine and sort: triggered first, then active by creation date
  const displayAlerts = [
    ...triggeredAlerts.slice(0, maxItems),
    ...activeAlerts.slice(0, maxItems - triggeredAlerts.length)
  ].slice(0, maxItems);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted/40 rounded" />
            <div className="h-5 w-24 bg-muted/40 rounded" />
          </div>
          <div className="h-16 bg-muted/20 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <BellRing className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="font-semibold text-sm">Price Alerts</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Active Count Badge */}
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-navy-500/10 text-navy-500">
              {activeCount} active
            </span>
          )}
          
          {/* Triggered Count Badge */}
          {triggeredCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 animate-pulse">
              {triggeredCount} triggered
            </span>
          )}
        </div>
      </div>

      {/* Alerts List */}
      {displayAlerts.length > 0 ? (
        <div className="space-y-2">
          {displayAlerts.map((alert, index) => (
            <AlertItem key={alert.id} alert={alert} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-muted/30 flex items-center justify-center">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">No active alerts</p>
        </div>
      )}

      {/* View All Button */}
      <motion.button
        onClick={() => navigate('/alerts')}
        className="w-full mt-3 py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/40 transition-all flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        whileTap={{ scale: 0.98 }}
      >
        View All Alerts
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
};

// Individual Alert Item
const AlertItem = ({ alert, index }: { alert: PriceAlert; index: number }) => {
  const isTriggered = !!alert.triggered_at;
  
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative p-2.5 rounded-xl border transition-all ${
        isTriggered
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-background/50 border-border/40 hover:border-primary/30'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Card Image */}
        {alert.card_image_url ? (
          <img
            src={alert.card_image_url}
            alt={alert.card_name}
            className="w-8 h-11 object-contain rounded border border-border/40 flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-11 rounded bg-muted/30 flex items-center justify-center flex-shrink-0">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}

        {/* Alert Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-xs truncate">{alert.card_name}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            {alert.direction === 'below' ? (
              <TrendingDown className="h-3 w-3 text-navy-500" />
            ) : (
              <TrendingUp className="h-3 w-3 text-amber-500" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {alert.direction} {formatCurrency(alert.target_price)}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {isTriggered && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500 text-white animate-pulse">
            TRIGGERED
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default AlertsWidget;
