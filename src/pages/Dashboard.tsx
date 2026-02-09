import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Percent, Award, Target, RefreshCw, PieChart as PieChartIcon, BarChart3, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useSalesDb } from "@/hooks/useSalesDb";
import { usePurchaseEntries } from "@/hooks/usePurchaseEntries";
import { useTodayChange } from "@/hooks/usePriceHistory";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { SkeletonDashboardCard, SkeletonChart } from "@/components/ui/skeleton-card";
import { PageTransition } from "@/components/PageTransition";
import { calculatePerformanceMetrics, calculateROI } from "@/lib/analytics";

type TabType = 'overview' | 'performance' | 'breakdown';

const Dashboard = () => {
  const { items, loading, refetch, isSyncing } = useInventoryDb();
  const { sales, loading: salesLoading } = useSalesDb();
  const { entries: purchaseEntries, loading: purchaseLoading } = usePurchaseEntries();
  const [timeRange, setTimeRange] = useState<'7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Separate sold and unsold items
  const unsoldItems = items.filter(item => !item.sale_price);

  // Calculate stats
  const totalValue = unsoldItems.reduce((sum, item) => {
    const marketPrice = item.market_price || item.purchase_price;
    return sum + marketPrice * item.quantity;
  }, 0);

  const totalPaid = unsoldItems.reduce((sum, item) => {
    return sum + item.purchase_price * item.quantity;
  }, 0);

  const unrealizedProfit = totalValue - totalPaid;
  const unrealizedProfitPercent = totalPaid > 0 ? ((unrealizedProfit / totalPaid) * 100) : 0;

  // Today's change from price history
  const { todayChange, todayChangePercent, hasHistoricalData, loading: todayChangeLoading } = useTodayChange(totalValue);

  // All supported grading companies with their colors
  const GRADING_COMPANIES = [
    { name: 'RAW', color: 'hsl(212, 100%, 49%)' },
    { name: 'PSA', color: 'hsl(142, 76%, 45%)' },
    { name: 'BGS', color: 'hsl(271, 81%, 56%)' },
    { name: 'CGC', color: 'hsl(47, 92%, 50%)' },
    { name: 'SGC', color: 'hsl(0, 84%, 60%)' },
    { name: 'ACE', color: 'hsl(180, 70%, 45%)' },
    { name: 'TAG', color: 'hsl(320, 70%, 50%)' },
  ];

  const COLORS = GRADING_COMPANIES.map(g => g.color);

  // Grading company distribution for pie chart
  const gradingDistribution = unsoldItems.reduce((acc, item) => {
    const company = item.grading_company?.toUpperCase() || 'RAW';
    acc[company] = (acc[company] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Create pieData with all grading companies (show 0 for empty ones)
  const pieData = GRADING_COMPANIES.map(company => ({
    name: company.name,
    value: gradingDistribution[company.name] || 0,
    color: company.color,
  }));

  // Grade distribution for bar chart
  const gradeDistribution = unsoldItems
    .filter(item => item.grading_company !== 'raw' && item.grade)
    .reduce((acc, item) => {
      const grade = item.grade || 'Unknown';
      acc[grade] = (acc[grade] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

  const barData = Object.entries(gradeDistribution)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => {
      const gradeA = parseFloat(a.grade) || 0;
      const gradeB = parseFloat(b.grade) || 0;
      return gradeB - gradeA;
    });

  // Filter purchase entries based on time range
  const getFilteredPurchases = () => {
    if (timeRange === 'ALL') return purchaseEntries;
    const now = new Date();
    const ranges = { '7D': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const daysAgo = ranges[timeRange];
    const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
    return purchaseEntries.filter(entry => new Date(entry.purchase_date) >= cutoffDate);
  };

  const filteredPurchases = getFilteredPurchases();

  // Create chart data
  const chartData = filteredPurchases
    .sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime())
    .reduce((acc, entry) => {
      const date = new Date(entry.purchase_date);
      const dateStr = date.toISOString().split('T')[0];
      const inventoryItem = items.find(item => item.name === entry.item_name && item.set_name === entry.set_name);
      const marketPrice = inventoryItem?.market_price || entry.purchase_price;
      const marketValue = marketPrice * entry.quantity;
      const costBasis = entry.purchase_price * entry.quantity;
      const existing = acc.find(item => item.date === dateStr);
      if (existing) {
        existing.value += marketValue;
      } else {
        acc.push({ date: dateStr, value: marketValue, displayDate: date });
      }
      return acc;
    }, [] as Array<{ date: string; value: number; displayDate: Date }>);

  // Calculate cumulative values
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

  // Check if we have data for each section
  const hasPerformanceData = sales.length > 0;
  const hasPieData = pieData.some(d => d.value > 0);
  const hasBarData = barData.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <div className="mb-8">
            <div className="h-10 w-48 bg-muted/40 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-64 bg-muted/30 rounded animate-pulse" />
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
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Robinhood-style Hero */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-muted-foreground">Portfolio</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isSyncing}
                className="gap-1.5 h-8 px-2 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Large Portfolio Value */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-1"
            >
              <h2 className="text-display">
                ${formatCurrency(totalValue)}
              </h2>
            </motion.div>

            {/* Profit/Loss Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className={`text-lg ${unrealizedProfit >= 0 ? 'change-positive' : 'change-negative'}`}>
                {unrealizedProfit >= 0 ? '+' : ''}${formatCurrency(Math.abs(unrealizedProfit))} ({unrealizedProfitPercent >= 0 ? '+' : ''}{unrealizedProfitPercent.toFixed(2)}%)
              </span>
              {unrealizedProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </motion.div>

            {/* Today's Change */}
            {hasHistoricalData && !todayChangeLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-2 mt-1"
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className={`text-sm ${todayChange >= 0 ? 'change-positive' : 'change-negative'}`}>
                  {todayChange >= 0 ? '+' : ''}${formatCurrency(Math.abs(todayChange))} ({todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}%) today
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Full-width Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="-mx-4 mb-6"
          >
            {/* Time Range Pills */}
            <div className="flex justify-center gap-1 mb-4 px-4">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Chart */}
            {cumulativeChartData.length > 0 ? (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={unrealizedProfit >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={unrealizedProfit >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      interval="preserveStartEnd"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        fontSize: '13px',
                      }}
                      labelFormatter={formatDate}
                      formatter={(value: number) => [`$${formatCurrency(value)}`, 'Value']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={unrealizedProfit >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"}
                      strokeWidth={2}
                      fill="url(#valueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Add items to see chart
              </div>
            )}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-5"
          >
            <div className="flex gap-1 bg-secondary/30 rounded-xl p-1">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'performance', label: 'Performance' },
                { key: 'breakdown', label: 'Breakdown' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabType)}
                  className={`flex-1 text-sm py-2.5 rounded-lg font-medium transition-all ${
                    activeTab === key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="card-clean p-4">
                    <p className="label-metric mb-2">Invested</p>
                    <p className="text-display-xs">${formatCurrency(totalPaid)}</p>
                  </div>

                  <div className="card-clean p-4">
                    <p className="label-metric mb-2">Potential Profit</p>
                    <p className={`text-display-xs ${unrealizedProfit >= 0 ? 'change-positive' : 'change-negative'}`}>
                      {unrealizedProfit >= 0 ? '+' : ''}${formatCurrency(Math.abs(unrealizedProfit))}
                    </p>
                  </div>
                </div>

                {/* Item Counts - All Grading Companies */}
                <div className="card-clean p-4">
                  <p className="label-metric mb-3">Collection Breakdown</p>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {pieData.map((item) => (
                      <div key={item.name} className="stat-compact text-center flex-shrink-0 min-w-[42px]">
                        <div
                          className="w-3 h-3 rounded-full mx-auto mb-1"
                          style={{ backgroundColor: item.color }}
                        />
                        <p className={`stat-compact-value ${item.value === 0 ? 'text-muted-foreground/50' : ''}`}>
                          {item.value}
                        </p>
                        <p className={`stat-compact-label ${item.value === 0 ? 'opacity-50' : ''}`}>
                          {item.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'performance' && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {hasPerformanceData ? (
                  <>
                    {(() => {
                      const metrics = calculatePerformanceMetrics(sales);
                      const roi = calculateROI(items, sales);
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="card-clean p-4">
                            <p className="label-metric mb-2">Win Rate</p>
                            <p className="text-display-xs">{metrics.winRate.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground mt-1">{metrics.profitableTrades}/{metrics.totalTrades} trades</p>
                          </div>

                          <div className="card-clean p-4">
                            <p className="label-metric mb-2">Avg Profit</p>
                            <p className={`text-display-xs ${metrics.avgProfitPerSale >= 0 ? 'change-positive' : 'change-negative'}`}>
                              ${formatCurrency(Math.abs(metrics.avgProfitPerSale))}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">per trade</p>
                          </div>

                          <div className="card-clean p-4">
                            <p className="label-metric mb-2">Avg Margin</p>
                            <p className={`text-display-xs ${metrics.avgMargin >= 0 ? 'change-positive' : 'change-negative'}`}>
                              {metrics.avgMargin.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">profit margin</p>
                          </div>

                          <div className="card-clean p-4">
                            <p className="label-metric mb-2">Total ROI</p>
                            <p className={`text-display-xs ${roi.totalROI >= 0 ? 'change-positive' : 'change-negative'}`}>
                              {roi.totalROI >= 0 ? '+' : ''}{roi.totalROI.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">all-time</p>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="card-clean p-8 text-center">
                    <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Record sales to see performance metrics</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'breakdown' && (
              <motion.div
                key="breakdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Pie Chart - Collection by Grading Company */}
                {hasPieData && (
                  <div className="card-clean p-4">
                    <p className="label-metric mb-4">By Grading Company</p>
                    <div className="flex items-center gap-6">
                      <div className="w-28 h-28 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData.filter(d => d.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={28}
                              outerRadius={48}
                              paddingAngle={3}
                              dataKey="value"
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
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm text-foreground">{entry.name}</span>
                            </div>
                            <span className="text-sm value-financial">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bar Chart - Grade Distribution */}
                {hasBarData && (
                  <div className="card-clean p-4">
                    <p className="label-metric mb-4">By Grade Level</p>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(212, 100%, 49%)" stopOpacity={1} />
                              <stop offset="100%" stopColor="hsl(212, 100%, 49%)" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="grade"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              fontSize: '13px',
                            }}
                            formatter={(value: number) => [`${value} cards`, 'Count']}
                          />
                          <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {!hasPieData && !hasBarData && (
                  <div className="card-clean p-8 text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Add items to see breakdown</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default Dashboard;
