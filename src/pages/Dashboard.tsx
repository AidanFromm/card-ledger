import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, RefreshCw, Target, BarChart3, Clock, Eye, Star, Crown, Info, ScanLine, FileUp, DollarSign, Share2 } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useSalesDb } from "@/hooks/useSalesDb";
import { usePurchaseEntries } from "@/hooks/usePurchaseEntries";
import { useTodayChange } from "@/hooks/usePriceHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonDashboardCard, SkeletonChart } from "@/components/ui/skeleton-card";
import { MiniSparkline } from "@/components/dashboard/Sparkline";
import { PageTransition } from "@/components/PageTransition";
import { calculatePerformanceMetrics, calculateROI } from "@/lib/analytics";
import { recordPortfolioValue, getPortfolioChartData } from "@/lib/localPriceHistory";
import { calculateAdjustedCollectionValue } from "@/lib/conditionPricing";
import SmartRecommendations from "@/components/SmartRecommendations";

type TabType = 'overview' | 'performance' | 'breakdown';

// Count-up animation hook
const useCountUp = (end: number, duration: number = 1200) => {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(0);

  useEffect(() => {
    if (end === prevEnd.current) return;
    const start = prevEnd.current;
    prevEnd.current = end;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, duration]);

  return value;
};

const CountUpValue = ({ value, formatCurrency }: { value: number; formatCurrency: (n: number) => string }) => {
  const animated = useCountUp(value);
  return <>${formatCurrency(animated)}</>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { items, loading, refetch, isSyncing } = useInventoryDb();
  const { sales, loading: salesLoading } = useSalesDb();
  const { entries: purchaseEntries, loading: purchaseLoading } = usePurchaseEntries();
  const { items: watchlistItems } = useWatchlist();
  const [timeRange, setTimeRange] = useState<'7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [portfolioTimelineRange, setPortfolioTimelineRange] = useState<'7D' | '30D' | '90D'>('30D');
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  // Track last sync time
  useEffect(() => {
    if (!loading && !isSyncing) {
      setLastSyncTime(Date.now());
    }
  }, [loading, isSyncing]);

  const getTimeSinceSync = () => {
    const diff = Date.now() - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Force re-render every minute for the time display
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const unsoldItems = items.filter(item => !item.sale_price);

  // Use condition-adjusted pricing for accurate valuations
  const collectionStats = calculateAdjustedCollectionValue(
    unsoldItems.map(item => ({
      market_price: item.market_price,
      purchase_price: item.purchase_price,
      quantity: item.quantity,
      condition: item.condition,
      raw_condition: item.raw_condition,
      grading_company: item.grading_company,
    }))
  );

  const totalValue = collectionStats.totalValue;
  const totalPaid = collectionStats.totalCost;
  const unrealizedProfit = collectionStats.profit;
  const unrealizedProfitPercent = collectionStats.profitPercent;

  const { todayChange, todayChangePercent, hasHistoricalData, loading: todayChangeLoading } = useTodayChange(totalValue);

  // Record portfolio value to localStorage for timeline
  useEffect(() => {
    if (totalValue > 0 && !loading) {
      recordPortfolioValue(totalValue);
    }
  }, [totalValue, loading]);

  const portfolioTimeline = getPortfolioChartData(portfolioTimelineRange);

  const GRADING_COMPANIES = [
    { name: 'RAW', color: 'hsl(212, 100%, 49%)' },
    { name: 'PSA', color: 'hsl(142, 76%, 45%)' },
    { name: 'BGS', color: 'hsl(271, 81%, 56%)' },
    { name: 'CGC', color: 'hsl(47, 92%, 50%)' },
    { name: 'SGC', color: 'hsl(0, 84%, 60%)' },
    { name: 'ACE', color: 'hsl(180, 70%, 45%)' },
    { name: 'TAG', color: 'hsl(320, 70%, 50%)' },
  ];

  const gradingDistribution = unsoldItems.reduce((acc, item) => {
    const company = item.grading_company?.toUpperCase() || 'RAW';
    acc[company] = (acc[company] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const pieData = GRADING_COMPANIES.map(company => ({
    name: company.name,
    value: gradingDistribution[company.name] || 0,
    color: company.color,
  }));

  const gradeDistribution = unsoldItems
    .filter(item => item.grading_company !== 'raw' && item.grade)
    .reduce((acc, item) => {
      const grade = item.grade || 'Unknown';
      acc[grade] = (acc[grade] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

  const barData = Object.entries(gradeDistribution)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => (parseFloat(b.grade) || 0) - (parseFloat(a.grade) || 0));

  const getFilteredPurchases = () => {
    if (timeRange === 'ALL') return purchaseEntries;
    const now = new Date();
    const ranges = { '7D': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const daysAgo = ranges[timeRange];
    const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
    return purchaseEntries.filter(entry => new Date(entry.purchase_date) >= cutoffDate);
  };

  const filteredPurchases = getFilteredPurchases();

  const chartData = filteredPurchases
    .sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime())
    .reduce((acc, entry) => {
      const date = new Date(entry.purchase_date);
      const dateStr = date.toISOString().split('T')[0];
      const inventoryItem = items.find(item => item.name === entry.item_name && item.set_name === entry.set_name);
      const marketPrice = inventoryItem?.market_price || entry.purchase_price;
      const marketValue = marketPrice * entry.quantity;
      const existing = acc.find(item => item.date === dateStr);
      if (existing) {
        existing.value += marketValue;
      } else {
        acc.push({ date: dateStr, value: marketValue, displayDate: date });
      }
      return acc;
    }, [] as Array<{ date: string; value: number; displayDate: Date }>);

  let cumulativeValue = 0;
  const cumulativeChartData = chartData.map(item => {
    cumulativeValue += item.value;
    return { date: item.date, value: cumulativeValue, displayDate: item.displayDate };
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '7D' || timeRange === '1M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const timeRanges = ['7D', '1M', '3M', '6M', '1Y', 'ALL'] as const;
  const isLoading = loading || salesLoading || purchaseLoading;
  const hasPerformanceData = sales.length > 0;
  const hasPieData = pieData.some(d => d.value > 0);
  const hasBarData = barData.length > 0;
  const isPositive = unrealizedProfit >= 0;
  const chartColor = isPositive ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
          <div className="mb-8">
            <div className="h-6 w-24 bg-muted/30 rounded-lg animate-pulse mb-3" />
            <div className="h-12 w-56 bg-muted/40 rounded-xl animate-pulse mb-2" />
            <div className="h-5 w-40 bg-muted/25 rounded animate-pulse" />
          </div>
          <SkeletonChart className="mb-6" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
          {/* Hero Portfolio Value — Premium gradient card */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-1 relative"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground/70">Portfolio</p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground/50">Synced {getTimeSinceSync()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { refetch(); setLastSyncTime(Date.now()); }}
                  disabled={isSyncing}
                  className="gap-1.5 h-8 px-2 text-xs rounded-xl text-muted-foreground/60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Big Number — gradient text, count-up animated */}
            <motion.h2
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="text-display text-gradient-hero mb-1.5 font-mono"
            >
              <CountUpValue value={totalValue} formatCurrency={formatCurrency} />
            </motion.h2>

            {/* P&L Line */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="flex items-center gap-2.5"
            >
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold ${
                isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              }`}>
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {isPositive ? '+' : ''}${formatCurrency(Math.abs(unrealizedProfit))}
              </div>
              <span className={`text-sm font-medium ${isPositive ? 'text-success/70' : 'text-destructive/70'}`}>
                ({isPositive ? '+' : ''}{unrealizedProfitPercent.toFixed(2)}%)
              </span>
            </motion.div>

            {/* Today's Change */}
            {hasHistoricalData && !todayChangeLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mt-2"
              >
                <Clock className="h-3 w-3 text-muted-foreground/40" />
                <span className={`text-xs font-medium ${todayChange >= 0 ? 'text-success/70' : 'text-destructive/70'}`}>
                  {todayChange >= 0 ? '+' : ''}${formatCurrency(Math.abs(todayChange))} ({todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}%) today
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="grid grid-cols-4 gap-2 mb-5"
          >
            {[
              { icon: ScanLine, label: 'Scan Card', path: '/scan', color: 'bg-blue-500/10 text-blue-500' },
              { icon: FileUp, label: 'Import CSV', path: '/inventory', color: 'bg-emerald-500/10 text-emerald-500' },
              { icon: DollarSign, label: 'Record Sale', path: '/sales', color: 'bg-amber-500/10 text-amber-500' },
              { icon: Share2, label: 'Share List', path: '/inventory', color: 'bg-purple-500/10 text-purple-500' },
            ].map(({ icon: Icon, label, path, color }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl card-clean-elevated transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Chart — Full Width, Robinhood Style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="-mx-4 mb-6"
          >
            {/* Time Range Pills */}
            <div className="flex justify-center gap-0.5 mb-3 px-4">
              <div className="flex bg-secondary/30 rounded-full p-0.5">
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`text-[11px] px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                      timeRange === range
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground/60 hover:text-foreground'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {cumulativeChartData.length > 0 ? (
              <div className="h-[220px] w-full" role="img" aria-label={`Portfolio value chart showing cumulative value over time. Current value: $${formatCurrency(totalValue)}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                        <stop offset="40%" stopColor={chartColor} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                      interval="preserveStartEnd"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        fontSize: '13px',
                        padding: '10px 14px',
                      }}
                      labelFormatter={formatDate}
                      formatter={(value: number) => [`$${formatCurrency(value)}`, 'Value']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={chartColor}
                      strokeWidth={2.5}
                      fill="url(#valueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="h-6 w-6 text-muted-foreground/30" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm text-muted-foreground/50">Add items to see your chart</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Section Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-5"
          >
            <div className="ios-segment">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'performance', label: 'Performance' },
                { key: 'breakdown', label: 'Breakdown' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabType)}
                  data-active={activeTab === key}
                  className="ios-segment-item"
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="card-clean-elevated p-4 rounded-2xl">
                    <div className="flex items-center gap-1.5 mb-2">
                      <p className="label-metric">Invested</p>
                      <UITooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-muted-foreground/40 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Total amount you paid for all cards in your collection</TooltipContent></UITooltip>
                    </div>
                    <p className="text-display-xs">${formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="card-clean-elevated p-4 rounded-2xl">
                    <div className="flex items-center gap-1.5 mb-2">
                      <p className="label-metric">Unrealized P&L</p>
                      <UITooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-muted-foreground/40 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Paper profit or loss — the difference between current market value and what you paid. "Unrealized" because you haven't sold yet.</TooltipContent></UITooltip>
                    </div>
                    <p className={`text-display-xs ${isPositive ? 'change-positive' : 'change-negative'}`}>
                      {isPositive ? '+' : ''}${formatCurrency(Math.abs(unrealizedProfit))}
                    </p>
                  </div>
                </div>

                {/* Collection Breakdown */}
                <div className="card-clean-elevated p-4 rounded-2xl">
                  <p className="label-metric mb-4">Collection Breakdown</p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {pieData.map((item) => (
                      <div key={item.name} className="stat-compact text-center flex-shrink-0 min-w-[48px]">
                        <div
                          className="w-3.5 h-3.5 rounded-full mx-auto mb-1.5"
                          style={{ backgroundColor: item.value > 0 ? item.color : 'hsl(var(--muted))' }}
                        />
                        <p className={`stat-compact-value text-lg ${item.value === 0 ? 'text-muted-foreground/30' : ''}`}>
                          {item.value}
                        </p>
                        <p className={`stat-compact-label text-[10px] ${item.value === 0 ? 'opacity-30' : ''}`}>
                          {item.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portfolio Value Timeline */}
                {portfolioTimeline.length >= 2 && (
                  <div className="card-clean p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="label-metric">Collection Value Timeline</p>
                      <div className="flex gap-0.5 bg-secondary/30 rounded-full p-0.5">
                        {(['7D', '30D', '90D'] as const).map((range) => (
                          <button
                            key={range}
                            onClick={() => setPortfolioTimelineRange(range)}
                            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                              portfolioTimelineRange === range
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground/60 hover:text-foreground'
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[140px]" role="img" aria-label="Collection value timeline chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={portfolioTimeline} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                          <defs>
                            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(212, 100%, 49%)" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="hsl(212, 100%, 49%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                            interval="preserveStartEnd"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              fontSize: '12px',
                              padding: '8px 12px',
                            }}
                            labelFormatter={(d) => new Date(d).toLocaleDateString()}
                            formatter={(v: number) => [`$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
                          />
                          <Area type="monotone" dataKey="value" stroke="hsl(212, 100%, 49%)" strokeWidth={2} fill="url(#portfolioGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Analytics Summary Widget (Task 10) */}
                <div className="card-clean p-4">
                  <p className="label-metric mb-3 flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5" />
                    Top 5 Most Valuable
                  </p>
                  {unsoldItems.length > 0 ? (
                    <div className="space-y-2">
                      {[...unsoldItems]
                        .sort((a, b) => ((b.market_price || b.purchase_price) * b.quantity) - ((a.market_price || a.purchase_price) * a.quantity))
                        .slice(0, 5)
                        .map((item, i) => {
                          const val = (item.market_price || item.purchase_price) * item.quantity;
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                                <span className="text-sm truncate">{item.name}</span>
                              </div>
                              <span className="text-sm font-bold text-success flex-shrink-0">${formatCurrency(val)}</span>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Add items to see rankings</p>
                  )}
                </div>

                {/* Cards by Category */}
                {unsoldItems.length > 0 && (
                  <div className="card-clean p-4">
                    <p className="label-metric mb-3">Cards by Category</p>
                    <div className="space-y-2">
                      {(() => {
                        const cats: Record<string, number> = {};
                        unsoldItems.forEach(item => {
                          const cat = item.category === 'sealed' ? 'Sealed' : item.grading_company !== 'raw' ? 'Graded' : 'Raw';
                          cats[cat] = (cats[cat] || 0) + item.quantity;
                        });
                        const total = Object.values(cats).reduce((a, b) => a + b, 0);
                        const colors: Record<string, string> = { Raw: 'bg-blue-500', Graded: 'bg-emerald-500', Sealed: 'bg-purple-500' };
                        return Object.entries(cats).map(([cat, count]) => (
                          <div key={cat}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{cat}</span>
                              <span className="text-xs text-muted-foreground">{count} ({total > 0 ? ((count/total)*100).toFixed(0) : 0}%)</span>
                            </div>
                            <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                              <div className={`h-full ${colors[cat] || 'bg-primary'} rounded-full`} style={{ width: `${total > 0 ? (count/total)*100 : 0}%` }} />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Watchlist Section (Task 6) */}
                {watchlistItems.length > 0 && (
                  <div className="card-clean p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="label-metric flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Watchlist
                        <span className="text-[10px] text-muted-foreground/60">({watchlistItems.length}/25)</span>
                      </p>
                      <button onClick={() => navigate('/scan')} className="text-xs text-primary font-medium">View All</button>
                    </div>
                    <div className="space-y-2">
                      {watchlistItems.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/30 transition-colors">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.product_name} className="w-10 h-14 object-contain rounded-lg bg-secondary/20 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-14 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                              <Eye className="w-4 h-4 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.set_name}</p>
                          </div>
                          {/* Mini sparkline */}
                          {item.current_price && item.previous_price && (
                            <MiniSparkline
                              data={[
                                item.previous_price * 0.98,
                                item.previous_price,
                                (item.previous_price + item.current_price) / 2,
                                item.current_price * 0.99,
                                item.current_price,
                              ]}
                              width={48}
                              height={24}
                              color={item.price_change_percent && item.price_change_percent > 0 ? '#10b981' : '#ef4444'}
                            />
                          )}
                          <div className="text-right flex-shrink-0">
                            {item.current_price ? (
                              <>
                                <p className="text-sm font-bold text-success">${item.current_price.toFixed(2)}</p>
                                {item.price_change_percent !== null && item.price_change_percent !== 0 && (
                                  <div className="flex items-center gap-1 justify-end">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                      item.price_change_percent > 0 
                                        ? 'bg-success/15 text-success' 
                                        : 'bg-destructive/15 text-destructive'
                                    }`}>
                                      {item.price_change_percent > 0 ? '↑' : '↓'} {Math.abs(item.price_change_percent).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">—</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'performance' && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-3"
              >
                {hasPerformanceData ? (
                  (() => {
                    const metrics = calculatePerformanceMetrics(sales);
                    const roi = calculateROI(items, sales);
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Win Rate', tip: 'Percentage of your sales that made a profit', value: `${metrics.winRate.toFixed(1)}%`, sub: `${metrics.profitableTrades}/${metrics.totalTrades} trades` },
                          { label: 'Avg Profit', tip: 'Average dollar profit per individual sale', value: `$${formatCurrency(Math.abs(metrics.avgProfitPerSale))}`, sub: 'per trade', positive: metrics.avgProfitPerSale >= 0 },
                          { label: 'Avg Margin', tip: 'Average profit as a percentage of sale price', value: `${metrics.avgMargin.toFixed(1)}%`, sub: 'profit margin', positive: metrics.avgMargin >= 0 },
                          { label: 'Total ROI', tip: 'Return on investment across all sales and current holdings', value: `${roi.totalROI >= 0 ? '+' : ''}${roi.totalROI.toFixed(1)}%`, sub: 'all-time', positive: roi.totalROI >= 0 },
                        ].map((m) => (
                          <div key={m.label} className="card-clean-elevated p-4 rounded-2xl">
                            <div className="flex items-center gap-1.5 mb-2">
                              <p className="label-metric">{m.label}</p>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground/40 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px] text-xs">
                                  {m.tip}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className={`text-display-xs ${m.positive !== undefined ? (m.positive ? 'change-positive' : 'change-negative') : ''}`}>
                              {m.value}
                            </p>
                            <p className="text-[11px] text-muted-foreground/50 mt-1">{m.sub}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="card-clean-elevated p-10 text-center rounded-2xl">
                    <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" strokeWidth={1.75} />
                    <p className="text-base font-semibold text-muted-foreground/40 mb-1">No Performance Data Yet</p>
                    <p className="text-sm text-muted-foreground/50">Record sales to see performance metrics</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'breakdown' && (
              <motion.div
                key="breakdown"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-3"
              >
                {hasPieData && (
                  <div className="card-clean-elevated p-4 rounded-2xl">
                    <p className="label-metric mb-4">By Grading Company</p>
                    <div className="flex items-center gap-6">
                      <div className="w-28 h-28 flex-shrink-0" role="img" aria-label="Grading company distribution pie chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData.filter(d => d.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              paddingAngle={4}
                              dataKey="value"
                              strokeWidth={0}
                            >
                              {pieData.filter(d => d.value > 0).map((item) => (
                                <Cell key={`cell-${item.name}`} fill={item.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2.5 max-h-[120px] overflow-y-auto scrollbar-hide">
                        {pieData.filter(d => d.value > 0).map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-sm">{entry.name}</span>
                            </div>
                            <span className="text-sm value-financial">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {hasBarData && (
                  <div className="card-clean-elevated p-4 rounded-2xl">
                    <p className="label-metric mb-4">By Grade Level</p>
                    <div className="h-[160px]" role="img" aria-label="Grade level distribution bar chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(212, 100%, 49%)" stopOpacity={1} />
                              <stop offset="100%" stopColor="hsl(212, 100%, 49%)" stopOpacity={0.5} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '14px',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                              fontSize: '13px',
                            }}
                            formatter={(value: number) => [`${value} cards`, 'Count']}
                          />
                          <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {!hasPieData && !hasBarData && (
                  <div className="card-clean-elevated p-10 text-center rounded-2xl">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" strokeWidth={1.75} />
                    <p className="text-base font-semibold text-muted-foreground/40 mb-1">No Breakdown Data</p>
                    <p className="text-sm text-muted-foreground/50">Add items to see breakdown</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Smart Recommendations */}
          {items.length >= 3 && (
            <div className="mt-6">
              <SmartRecommendations
                inventory={items}
                maxItems={6}
                onAddToWishlist={(card) => {
                  navigate('/wishlist');
                }}
                onAddToInventory={(card) => {
                  navigate('/add');
                }}
              />
            </div>
          )}
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default Dashboard;


