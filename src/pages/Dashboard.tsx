import { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useTodayChange } from "@/hooks/usePriceHistory";
import { usePortfolioHistory, TimeRange } from "@/hooks/usePortfolioHistory";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

// Dashboard components
import {
  PortfolioHero,
  TimeRangeSelector,
  TopMovers,
  PerformanceChart,
  CategoryBreakdown,
  GradeDistribution,
} from "@/components/dashboard";
import AlertsWidget from "@/components/AlertsWidget";

const Dashboard = () => {
  const { items, loading, refetch, isSyncing } = useInventoryDb();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  // Separate sold and unsold items
  const unsoldItems = useMemo(() => 
    items.filter(item => !item.sale_price), 
    [items]
  );

  // Calculate portfolio totals
  const { totalValue, totalPaid, unrealizedProfit } = useMemo(() => {
    const value = unsoldItems.reduce((sum, item) => {
      const marketPrice = item.market_price || item.purchase_price;
      return sum + marketPrice * item.quantity;
    }, 0);

    const paid = unsoldItems.reduce((sum, item) => {
      return sum + item.purchase_price * item.quantity;
    }, 0);

    return {
      totalValue: value,
      totalPaid: paid,
      unrealizedProfit: value - paid,
    };
  }, [unsoldItems]);

  // Portfolio history for chart
  const { 
    data: portfolioHistory, 
    loading: historyLoading,
    periodChange,
    periodChangePercent,
  } = usePortfolioHistory(timeRange, totalValue);

  // Today's change from price history
  const { 
    todayChange, 
    todayChangePercent, 
    hasHistoricalData: hasTodayData, 
    loading: todayChangeLoading 
  } = useTodayChange(totalValue);

  // Sparkline data (last 20 points)
  const sparklineData = useMemo(() => 
    portfolioHistory.slice(-20).map(d => ({ value: d.value })),
    [portfolioHistory]
  );

  // Is portfolio positive overall?
  const isPositive = unrealizedProfit >= 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-24 bg-muted/30 rounded" />
            <div className="h-16 w-48 bg-muted/40 rounded-lg" />
            <div className="h-6 w-36 bg-muted/30 rounded" />
            <div className="h-[200px] bg-muted/20 rounded-xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Refresh Button (top right) */}
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isSyncing}
              className="gap-1.5 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Refresh'}
            </Button>
          </div>

          {/* Hero Section - MASSIVE Portfolio Value */}
          <PortfolioHero
            totalValue={totalValue}
            periodChange={periodChange}
            periodChangePercent={periodChangePercent}
            todayChange={todayChange}
            todayChangePercent={todayChangePercent}
            hasTodayData={hasTodayData && !todayChangeLoading}
            sparklineData={sparklineData}
            isPositive={isPositive}
          />

          {/* Time Range Selector */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="my-6"
          >
            <TimeRangeSelector
              selected={timeRange}
              onChange={setTimeRange}
            />
          </motion.div>

          {/* Main Performance Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="-mx-4 mb-8"
          >
            <PerformanceChart
              data={portfolioHistory}
              timeRange={timeRange}
              isPositive={isPositive}
              loading={historyLoading}
            />
          </motion.div>

          {/* Top Gainers */}
          <TopMovers 
            items={unsoldItems} 
            type="gainers" 
            limit={5} 
          />

          {/* Top Losers */}
          <TopMovers 
            items={unsoldItems} 
            type="losers" 
            limit={5} 
          />

          {/* Price Alerts Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <AlertsWidget maxItems={3} />
          </motion.div>

          {/* Analytics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4"
              >
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Invested</p>
                <p className="text-xl font-bold text-foreground">
                  ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4"
              >
                <p className="text-xs font-medium text-muted-foreground mb-1">Unrealized P&L</p>
                <p className={`text-xl font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : '-'}${Math.abs(unrealizedProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </motion.div>
            </div>

            {/* Category Breakdown (Pie Chart) */}
            <CategoryBreakdown items={unsoldItems} />

            {/* Grade Distribution (Bar Chart) */}
            <GradeDistribution items={unsoldItems} />
          </motion.div>

          {/* Empty State */}
          {unsoldItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Start Your Collection
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Add cards to your inventory to see your portfolio performance, gains, and analytics.
              </p>
            </motion.div>
          )}
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default Dashboard;
