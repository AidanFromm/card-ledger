import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useTodayChange } from "@/hooks/usePriceHistory";
import { AnimatedNumber } from "@/components/ui/animated-number";

export function PortfolioPreview() {
  const navigate = useNavigate();
  const { items, loading } = useInventoryDb();

  // Calculate portfolio value from unsold items
  const unsoldItems = items.filter(item => !item.sale_price);
  const totalValue = unsoldItems.reduce((sum, item) => {
    const marketPrice = item.market_price || item.purchase_price;
    return sum + marketPrice * item.quantity;
  }, 0);

  // Get today's change
  const { todayChange, todayChangePercent, hasHistoricalData, loading: changeLoading } = useTodayChange(totalValue);

  const isPositive = todayChange >= 0;

  // Don't show if no items
  if (items.length === 0 && !loading) {
    return null;
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate("/dashboard")}
      className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-r from-card/80 to-card/50 border border-border/50 backdrop-blur-sm text-left group tap-scale"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Label */}
          <p className="text-xs text-muted-foreground mb-1">Portfolio Value</p>
          
          {/* Big Number */}
          {loading ? (
            <div className="h-9 w-32 bg-muted/20 rounded animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={totalValue}
                prefix="$"
                decimals={2}
                className="text-2xl font-bold tracking-tight"
              />
              
              {/* Daily Change */}
              {hasHistoricalData && !changeLoading && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`flex items-center gap-0.5 text-sm font-medium ${
                    isPositive ? "text-navy-500" : "text-red-500"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {todayChangePercent.toFixed(2)}%
                  </span>
                </motion.div>
              )}
            </div>
          )}
          
          {/* Subtitle */}
          <p className="text-xs text-muted-foreground mt-0.5">
            {unsoldItems.length} {unsoldItems.length === 1 ? "item" : "items"} • Tap for details
          </p>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/20 group-hover:bg-primary/20 transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Mini Sparkline Placeholder */}
      {hasHistoricalData && (
        <div className="mt-3 h-8 w-full relative overflow-hidden rounded-lg">
          <div className={`absolute inset-0 opacity-20 ${isPositive ? 'bg-gradient-to-t from-navy-500/40' : 'bg-gradient-to-t from-red-500/40'}`} />
          {/* TODO: Add actual sparkline chart here */}
        </div>
      )}
    </motion.button>
  );
}
