import { useState, useMemo } from "react";
import { RefreshCw, Wallet, TrendingUp, Package, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useTodayChange } from "@/hooks/usePriceHistory";
import { usePortfolioHistory, TimeRange } from "@/hooks/usePortfolioHistory";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useSalesDb } from "@/hooks/useSalesDb";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { AchievementsWidget } from "@/components/Achievements";
import { SmartTips } from "@/components/SmartTips";
import { PortfolioInsights } from "@/components/PortfolioInsights";
import { MarketTrends } from "@/components/MarketTrends";

// Dashboard components - Premium V4
import {
  PortfolioHero,
  TimeRangeSelector,
  getTimeRangeLabel,
  TopMovers,
  PerformanceChart,
  CategoryBreakdown,
  GradeDistribution,
  QuickActions,
  RecentActivity,
  PriceAlertsSummary,
  StatsCard,
  BestPerformerCard,
} from "@/components/dashboard";

// Premium skeleton loader with shimmer
const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Hero skeleton */}
    <div className="space-y-3">
      <div className="h-4 w-28 bg-zinc-800/60 rounded-lg animate-pulse" />
      <div className="h-16 w-72 bg-zinc-800/80 rounded-xl animate-pulse relative overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
        />
      </div>
      <div className="h-8 w-48 bg-zinc-800/50 rounded-full animate-pulse" />
    </div>
    
    {/* Chart skeleton */}
    <div className="h-[120px] bg-gradient-to-t from-zinc-800/20 to-transparent rounded-3xl animate-pulse relative overflow-hidden">
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent"
      />
    </div>
    
    {/* Time selector skeleton */}
    <div className="flex justify-center">
      <div className="h-10 w-80 bg-zinc-800/40 rounded-2xl animate-pulse" />
    </div>
    
    {/* Stats skeleton */}
    <div className="grid grid-cols-2 gap-3">
      {[1, 2].map(i => (
        <div key={i} className="h-28 bg-zinc-800/40 rounded-2xl animate-pulse relative overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent"
          />
        </div>
      ))}
    </div>
    
    {/* Quick actions skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-zinc-800/30 rounded-2xl animate-pulse" />
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const { items, loading, refetch, isSyncing } = useInventoryDb();
  const { sales, loading: salesLoading } = useSalesDb();
  const { 
    alerts, 
    activeCount, 
    triggeredCount, 
    loading: alertsLoading 
  } = usePriceAlerts();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  
  // Onboarding hook - detect first-time users
  const {
    shouldShow: showOnboarding,
    currentStep: onboardingStep,
    setStep: setOnboardingStep,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding(items.length);

  // Separate sold and unsold items
  const { unsoldItems, soldItems } = useMemo(() => ({
    unsoldItems: items.filter(item => !item.sale_price),
    soldItems: items.filter(item => item.sale_price),
  }), [items]);

  // Calculate portfolio totals
  const { totalValue, totalPaid, unrealizedProfit, totalCards } = useMemo(() => {
    const value = unsoldItems.reduce((sum, item) => {
      const marketPrice = item.market_price || item.purchase_price;
      return sum + marketPrice * item.quantity;
    }, 0);

    const paid = unsoldItems.reduce((sum, item) => {
      return sum + item.purchase_price * item.quantity;
    }, 0);

    const cards = unsoldItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalValue: value,
      totalPaid: paid,
      unrealizedProfit: value - paid,
      totalCards: cards,
    };
  }, [unsoldItems]);

  // Find best performer
  const bestPerformer = useMemo(() => {
    const withChanges = unsoldItems
      .filter(item => item.market_price && item.market_price !== item.purchase_price)
      .map(item => {
        const marketValue = (item.market_price || item.purchase_price) * item.quantity;
        const costBasis = item.purchase_price * item.quantity;
        const change = marketValue - costBasis;
        const changePercent = costBasis > 0 ? (change / costBasis) * 100 : 0;
        return { item, change, changePercent };
      })
      .filter(m => m.change > 0)
      .sort((a, b) => b.changePercent - a.changePercent);

    return withChanges[0] || null;
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

  // Sparkline data (last 30 points for hero)
  const sparklineData = useMemo(() => 
    portfolioHistory.slice(-30).map(d => ({ value: d.value, date: d.date })),
    [portfolioHistory]
  );

  // Transform alerts data for PriceAlertsSummary component
  const formattedAlerts = useMemo(() => 
    alerts.map(alert => ({
      id: alert.id,
      cardName: alert.card_name,
      targetPrice: alert.target_price,
      currentPrice: alert.current_price || 0,
      type: alert.direction,
      triggered: !!alert.triggered_at,
      triggeredAt: alert.triggered_at ? new Date(alert.triggered_at) : undefined,
      cardImage: alert.card_image_url || undefined,
    })),
    [alerts]
  );

  // Transform sales data to work with RecentActivity (sold items format)
  const salesAsItems = useMemo(() => 
    sales.map(sale => ({
      id: sale.id,
      name: sale.item_name,
      card_image_url: sale.card_image_url,
      purchase_price: sale.purchase_price,
      market_price: sale.sale_price,
      quantity: sale.quantity_sold,
      sale_price: sale.sale_price,
      sale_date: sale.sale_date,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
    })),
    [sales]
  );

  // Is portfolio positive overall?
  const isPositive = unrealizedProfit >= 0;
  const profitPercent = totalPaid > 0 ? (unrealizedProfit / totalPaid) * 100 : 0;

  // Loading state with premium skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <DashboardSkeleton />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Refresh Button */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end mb-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isSyncing}
              className="gap-1.5 h-8 px-3 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl border border-transparent hover:border-zinc-700/50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Refresh'}
            </Button>
          </motion.div>

          {/* Portfolio Hero Section */}
          <PortfolioHero
            totalValue={totalValue}
            periodChange={periodChange}
            periodChangePercent={periodChangePercent}
            todayChange={todayChange}
            todayChangePercent={todayChangePercent}
            hasTodayData={hasTodayData && !todayChangeLoading}
            sparklineData={sparklineData}
            isPositive={isPositive}
            timeRangeLabel={getTimeRangeLabel(timeRange)}
          />

          {/* Time Range Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="my-6 flex justify-center"
          >
            <TimeRangeSelector
              selected={timeRange}
              onChange={setTimeRange}
            />
          </motion.div>

          {/* Performance Chart - Full Width */}
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

          {/* Quick Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <StatsCard
              label="Total Invested"
              value={totalPaid}
              prefix="$"
              icon={Wallet}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/15"
              index={0}
            />
            <StatsCard
              label="Unrealized P&L"
              value={Math.abs(unrealizedProfit)}
              prefix={isPositive ? '+$' : '-$'}
              change={profitPercent}
              icon={TrendingUp}
              iconColor={isPositive ? "text-navy-400" : "text-red-400"}
              iconBg={isPositive ? "bg-navy-500/15" : "bg-red-500/15"}
              glowColor={isPositive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}
              index={1}
            />
          </motion.div>

          {/* Best Performer & Total Cards Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
          >
            {bestPerformer ? (
              <BestPerformerCard
                name={bestPerformer.item.name}
                imageUrl={bestPerformer.item.card_image_url}
                value={(bestPerformer.item.market_price || bestPerformer.item.purchase_price) * bestPerformer.item.quantity}
                change={bestPerformer.change}
                changePercent={bestPerformer.changePercent}
                index={0}
              />
            ) : (
              <StatsCard
                label="Best Performer"
                value="--"
                icon={Sparkles}
                iconColor="text-amber-400"
                iconBg="bg-amber-500/15"
                index={0}
              />
            )}
            <StatsCard
              label="Total Cards"
              value={totalCards.toString()}
              icon={Package}
              iconColor="text-purple-400"
              iconBg="bg-purple-500/15"
              index={1}
            />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <QuickActions />
          </motion.div>

          {/* Smart Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="mb-6"
          >
            <SmartTips />
          </motion.div>

          {/* Portfolio Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.39 }}
            className="mb-6"
          >
            <PortfolioInsights 
              items={unsoldItems} 
              totalValue={totalPortfolioValue} 
            />
          </motion.div>

          {/* Achievements Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <AchievementsWidget />
          </motion.div>

          {/* Top Movers Section */}
          {unsoldItems.length > 0 && (
            <>
              <TopMovers 
                items={unsoldItems} 
                type="gainers" 
                limit={6} 
              />
              <TopMovers 
                items={unsoldItems} 
                type="losers" 
                limit={6} 
              />
            </>
          )}

          {/* Market Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="mb-6"
          >
            <MarketTrends />
          </motion.div>

          {/* Analytics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
          >
            {/* Category Breakdown */}
            <CategoryBreakdown items={unsoldItems} />
            
            {/* Grade Distribution */}
            <GradeDistribution items={unsoldItems} />
          </motion.div>

          {/* Recent Activity & Alerts Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Recent Activity Timeline */}
            <RecentActivity 
              items={unsoldItems}
              soldItems={salesAsItems}
              limit={5}
            />
            
            {/* Price Alerts Summary */}
            <PriceAlertsSummary 
              alerts={formattedAlerts}
              activeCount={activeCount}
              triggeredCount={triggeredCount}
            />
          </motion.div>

          {/* Empty State */}
          {unsoldItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center shadow-2xl"
              >
                <motion.span 
                  className="text-5xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  🃏
                </motion.span>
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">
                Start Your Collection
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
                Add cards to your inventory to track your portfolio performance, see gains & losses, and unlock powerful analytics.
              </p>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.href = '/scan'}
                className="px-6 py-3 bg-gradient-to-r from-navy-600 to-navy-500 text-white font-semibold rounded-xl shadow-lg shadow-navy-500/25 border border-navy-400/20"
              >
                Scan Your First Card
              </motion.button>
            </motion.div>
          )}

          {/* Bottom padding for mobile nav */}
          <div className="h-4 md:h-0" />
        </main>
      </PageTransition>
      <BottomNav />

      {/* Onboarding Flow Modal */}
      <OnboardingFlow
        isOpen={showOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
        currentStep={onboardingStep}
        onStepChange={setOnboardingStep}
      />
    </div>
  );
};

export default Dashboard;
