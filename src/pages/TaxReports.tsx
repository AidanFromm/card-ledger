import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  PieChart,
  BarChart3,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalesDb } from "@/hooks/useSalesDb";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import BottomNav from "@/components/BottomNav";
import {
  generateTaxSummary,
  generateProfitLossByPeriod,
  getAvailableTaxYears,
  exportTaxReportToCSV,
  formatCurrency,
  formatPercent,
  CostBasisMethod,
  TaxSummary,
  CapitalGain,
  ProfitLossSummary,
} from "@/lib/taxCalculations";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Summary Card Component
const SummaryCard = ({
  label,
  value,
  icon: Icon,
  subtext,
  positive,
  className = "",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  subtext?: string;
  positive?: boolean;
  className?: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`glass-card p-4 rounded-2xl ${className}`}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
      <div
        className={`p-1.5 rounded-lg ${
          positive === undefined
            ? "bg-primary/20"
            : positive
            ? "bg-green-500/20"
            : "bg-red-500/20"
        }`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${
            positive === undefined
              ? "text-primary"
              : positive
              ? "text-green-500"
              : "text-red-500"
          }`}
        />
      </div>
    </div>
    <div
      className={`text-xl font-bold ${
        positive === undefined
          ? "text-foreground"
          : positive
          ? "text-green-500"
          : "text-red-500"
      }`}
    >
      {value}
    </div>
    {subtext && (
      <p className="text-[10px] text-muted-foreground mt-0.5">{subtext}</p>
    )}
  </motion.div>
);

// Transaction Row Component
const TransactionRow = ({
  transaction,
  expanded,
  onToggle,
}: {
  transaction: CapitalGain;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const isProfit = transaction.gainLoss >= 0;

  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/10 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{transaction.itemName}</h4>
          <p className="text-xs text-muted-foreground">
            {format(new Date(transaction.saleDate), "MMM d, yyyy")} · x{transaction.quantity}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`text-[10px] ${
              transaction.gainType === "long-term"
                ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                : "bg-amber-500/20 text-amber-500 border-amber-500/30"
            }`}
          >
            {transaction.gainType === "long-term" ? "Long" : "Short"}
          </Badge>
          <span
            className={`font-bold text-sm ${
              isProfit ? "text-green-500" : "text-red-500"
            }`}
          >
            {isProfit ? "+" : ""}
            {formatCurrency(transaction.gainLoss)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-muted/5"
          >
            <div className="p-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Purchase Date</p>
                <p className="font-medium">
                  {format(new Date(transaction.purchaseDate), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Holding Period</p>
                <p className="font-medium">{transaction.holdingPeriodDays} days</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Cost Basis</p>
                <p className="font-medium">{formatCurrency(transaction.purchasePrice)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Proceeds</p>
                <p className="font-medium">{formatCurrency(transaction.salePrice)}</p>
              </div>
              {transaction.fees && transaction.fees > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs">Fees</p>
                  <p className="font-medium">-{formatCurrency(transaction.fees)}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs">Method</p>
                <p className="font-medium uppercase">{transaction.costBasisMethod}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TaxReports = () => {
  const navigate = useNavigate();
  const { sales, loading } = useSalesDb();
  const { toast } = useToast();

  // State
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    return currentYear;
  });
  const [costBasisMethod, setCostBasisMethod] = useState<CostBasisMethod>("fifo");
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [profitPeriod, setProfitPeriod] = useState<"month" | "quarter" | "year">("month");

  // Get available years
  const availableYears = useMemo(() => {
    const years = getAvailableTaxYears(sales);
    if (years.length === 0) {
      years.push(new Date().getFullYear());
    }
    return years;
  }, [sales]);

  // Update selected year if not in available years
  useMemo(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || new Date().getFullYear());
    }
  }, [availableYears, selectedYear]);

  // Generate tax summary
  const taxSummary = useMemo((): TaxSummary => {
    return generateTaxSummary(sales, selectedYear, costBasisMethod);
  }, [sales, selectedYear, costBasisMethod]);

  // Generate profit/loss by period
  const profitLossByPeriod = useMemo((): ProfitLossSummary[] => {
    return generateProfitLossByPeriod(sales, profitPeriod);
  }, [sales, profitPeriod]);

  // Pie chart data for gains distribution
  const gainsDistribution = useMemo(() => {
    const data = [];
    if (taxSummary.shortTermGains > 0) {
      data.push({ name: "Short-Term Gains", value: taxSummary.shortTermGains, color: "#f59e0b" });
    }
    if (taxSummary.shortTermLosses > 0) {
      data.push({ name: "Short-Term Losses", value: taxSummary.shortTermLosses, color: "#ef4444" });
    }
    if (taxSummary.longTermGains > 0) {
      data.push({ name: "Long-Term Gains", value: taxSummary.longTermGains, color: "#3b82f6" });
    }
    if (taxSummary.longTermLosses > 0) {
      data.push({ name: "Long-Term Losses", value: taxSummary.longTermLosses, color: "#dc2626" });
    }
    return data;
  }, [taxSummary]);

  // Export handler
  const handleExport = () => {
    const csv = exportTaxReportToCSV(taxSummary);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tax-report-${selectedYear}-${costBasisMethod}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Tax report exported for ${selectedYear}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <div className="flex">
          <DesktopSidebar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading tax data...</p>
          </div>
        </main>
        </div>
      <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
        <div className="flex">
          <DesktopSidebar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Tax Reports</h1>
                <p className="text-sm text-muted-foreground">
                  Capital gains & profit/loss tracking
                </p>
              </div>
            </div>
            <Button onClick={handleExport} size="sm" className="h-9">
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <Select
                value={costBasisMethod}
                onValueChange={(v) => setCostBasisMethod(v as CostBasisMethod)}
              >
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fifo">FIFO</SelectItem>
                  <SelectItem value="lifo">LIFO</SelectItem>
                  <SelectItem value="specific">Specific Lot</SelectItem>
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px]">
                  <p className="text-xs">
                    <strong>FIFO:</strong> First In, First Out - oldest purchases sold first
                    <br />
                    <strong>LIFO:</strong> Last In, First Out - newest purchases sold first
                    <br />
                    <strong>Specific Lot:</strong> Choose which purchase to sell
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full justify-start bg-secondary/30">
              <TabsTrigger value="summary" className="flex items-center gap-1.5">
                <PieChart className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="profitloss" className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" />
                P&L
              </TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              {/* Main Summary Cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
              >
                <SummaryCard
                  label="Total Proceeds"
                  value={formatCurrency(taxSummary.totalProceeds)}
                  icon={DollarSign}
                  subtext={`${taxSummary.totalTransactions} transactions`}
                />
                <SummaryCard
                  label="Cost Basis"
                  value={formatCurrency(taxSummary.totalCostBasis)}
                  icon={Layers}
                  subtext={`${costBasisMethod.toUpperCase()} method`}
                />
                <SummaryCard
                  label="Net Gain/Loss"
                  value={formatCurrency(taxSummary.totalGainLoss)}
                  icon={taxSummary.totalGainLoss >= 0 ? TrendingUp : TrendingDown}
                  positive={taxSummary.totalGainLoss >= 0}
                />
                <SummaryCard
                  label="Transactions"
                  value={taxSummary.totalTransactions.toString()}
                  icon={FileText}
                  subtext={`In ${selectedYear}`}
                />
              </motion.div>

              {/* Short-Term vs Long-Term */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid md:grid-cols-2 gap-4"
              >
                {/* Short-Term Card */}
                <div className="glass-card p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Short-Term (≤1 year)</h3>
                      <p className="text-xs text-muted-foreground">
                        Taxed as ordinary income
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Gains</span>
                      <span className="font-medium text-green-500">
                        +{formatCurrency(taxSummary.shortTermGains)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Losses</span>
                      <span className="font-medium text-red-500">
                        -{formatCurrency(taxSummary.shortTermLosses)}
                      </span>
                    </div>
                    <div className="border-t border-border/50 pt-3 flex justify-between">
                      <span className="font-medium">Net Short-Term</span>
                      <span
                        className={`font-bold ${
                          taxSummary.netShortTerm >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {taxSummary.netShortTerm >= 0 ? "+" : ""}
                        {formatCurrency(taxSummary.netShortTerm)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Long-Term Card */}
                <div className="glass-card p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Long-Term (&gt;1 year)</h3>
                      <p className="text-xs text-muted-foreground">
                        Lower capital gains rates
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Gains</span>
                      <span className="font-medium text-green-500">
                        +{formatCurrency(taxSummary.longTermGains)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Losses</span>
                      <span className="font-medium text-red-500">
                        -{formatCurrency(taxSummary.longTermLosses)}
                      </span>
                    </div>
                    <div className="border-t border-border/50 pt-3 flex justify-between">
                      <span className="font-medium">Net Long-Term</span>
                      <span
                        className={`font-bold ${
                          taxSummary.netLongTerm >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {taxSummary.netLongTerm >= 0 ? "+" : ""}
                        {formatCurrency(taxSummary.netLongTerm)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Distribution Chart */}
              {gainsDistribution.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="glass-card p-5 rounded-2xl"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Gains Distribution
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={gainsDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {gainsDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* Tax Notice */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
              >
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-500">Tax Disclaimer</p>
                  <p className="text-muted-foreground mt-1">
                    This report is for informational purposes only. Please consult a
                    qualified tax professional for accurate tax advice. Tax rates and
                    rules vary by jurisdiction.
                  </p>
                </div>
              </motion.div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-border/30">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {selectedYear} Transactions
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {taxSummary.totalTransactions} capital gains transactions
                  </p>
                </div>

                {taxSummary.transactions.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">
                      No transactions found for {selectedYear}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    {taxSummary.transactions.map((tx, idx) => (
                      <TransactionRow
                        key={`${tx.itemName}-${tx.saleDate}-${idx}`}
                        transaction={tx}
                        expanded={
                          expandedTransaction ===
                          `${tx.itemName}-${tx.saleDate}-${idx}`
                        }
                        onToggle={() =>
                          setExpandedTransaction(
                            expandedTransaction ===
                              `${tx.itemName}-${tx.saleDate}-${idx}`
                              ? null
                              : `${tx.itemName}-${tx.saleDate}-${idx}`
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* Profit/Loss Tab */}
            <TabsContent value="profitloss" className="space-y-6">
              {/* Period Selector */}
              <div className="flex justify-end">
                <div className="flex gap-1 bg-secondary/30 rounded-full p-1">
                  {(["month", "quarter", "year"] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setProfitPeriod(period)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all capitalize ${
                        profitPeriod === period
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {period}ly
                    </button>
                  ))}
                </div>
              </div>

              {/* P&L Chart */}
              {profitLossByPeriod.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 rounded-2xl"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Profit & Loss by {profitPeriod.charAt(0).toUpperCase() + profitPeriod.slice(1)}
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={profitLossByPeriod.slice(-12)}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="period"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            fontSize: "13px",
                          }}
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name === "netProfit" ? "Net Profit" : name === "revenue" ? "Revenue" : "Cost",
                          ]}
                        />
                        <Legend formatter={(value) => value === "netProfit" ? "Net Profit" : value === "revenue" ? "Revenue" : "Cost"} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="netProfit" fill="rgb(34, 197, 94)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* P&L Table */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-3 font-medium">Period</th>
                        <th className="text-right p-3 font-medium">Revenue</th>
                        <th className="text-right p-3 font-medium">Cost</th>
                        <th className="text-right p-3 font-medium">Fees</th>
                        <th className="text-right p-3 font-medium">Net Profit</th>
                        <th className="text-right p-3 font-medium">Margin</th>
                        <th className="text-right p-3 font-medium">Txns</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitLossByPeriod.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            No sales data available
                          </td>
                        </tr>
                      ) : (
                        profitLossByPeriod.map((row) => (
                          <tr
                            key={row.period}
                            className="border-t border-border/30 hover:bg-muted/10"
                          >
                            <td className="p-3 font-medium">{row.period}</td>
                            <td className="p-3 text-right">{formatCurrency(row.revenue)}</td>
                            <td className="p-3 text-right text-muted-foreground">
                              {formatCurrency(row.costOfGoods)}
                            </td>
                            <td className="p-3 text-right text-muted-foreground">
                              {formatCurrency(row.fees)}
                            </td>
                            <td
                              className={`p-3 text-right font-medium ${
                                row.netProfit >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {row.netProfit >= 0 ? "+" : ""}
                              {formatCurrency(row.netProfit)}
                            </td>
                            <td
                              className={`p-3 text-right ${
                                row.marginPercent >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {formatPercent(row.marginPercent)}
                            </td>
                            <td className="p-3 text-right text-muted-foreground">
                              {row.transactionCount}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </main>
      </PageTransition>
      </div>
      <BottomNav />
    </div>
  );
};

export default TaxReports;
