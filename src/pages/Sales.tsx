import { useState, useMemo, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useSalesDb } from "@/hooks/useSalesDb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, DollarSign, UserCircle2, ChevronDown, ChevronUp, Pencil, Trash2, TrendingUp, TrendingDown, Trophy, Image as ImageIcon, Package, BarChart3, Calendar } from "lucide-react";
import { format, subDays, subMonths, subYears, isAfter } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Animated counter hook for count-up effect
const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = easeOut * end;

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

// Animated profit display component - compact version
const AnimatedProfit = ({ value, formatCurrency }: { value: number; formatCurrency: (n: number) => string }) => {
  const animatedValue = useCountUp(Math.abs(value), 800);
  const isProfit = value >= 0;

  return (
    <span className={`text-2xl font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
      {isProfit ? '+' : '-'}${formatCurrency(animatedValue)}
    </span>
  );
};

// Time range type
type TimeRange = "7D" | "1M" | "3M" | "6M" | "1Y" | "ALL";

const Sales = () => {
  const { sales, loading, deleteSale, deleteBulkSale, updateSale } = useSalesDb();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedBulkSales, setExpandedBulkSales] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [deleteBulkDialogOpen, setDeleteBulkDialogOpen] = useState(false);
  const [bulkSaleToDelete, setBulkSaleToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    quantity_sold: "",
    sale_price: "",
    notes: "",
  });
  const [renameTagDialogOpen, setRenameTagDialogOpen] = useState(false);
  const [tagToRename, setTagToRename] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");

  // Get start date based on time range
  const getStartDate = (range: TimeRange): Date | null => {
    const now = new Date();
    switch (range) {
      case "7D": return subDays(now, 7);
      case "1M": return subMonths(now, 1);
      case "3M": return subMonths(now, 3);
      case "6M": return subMonths(now, 6);
      case "1Y": return subYears(now, 1);
      case "ALL": return null;
    }
  };

  // Filter sales by time range for chart
  const salesInRange = useMemo(() => {
    const startDate = getStartDate(timeRange);
    if (!startDate) return sales;
    return sales.filter(sale => isAfter(new Date(sale.sale_date), startDate));
  }, [sales, timeRange]);

  // Calculate profit over time data for chart
  const profitChartData = useMemo(() => {
    if (salesInRange.length === 0) return [];

    // Group sales by date and calculate cumulative profit
    const salesByDate = new Map<string, number>();

    // Sort sales by date
    const sortedSales = [...salesInRange].sort(
      (a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
    );

    let cumulativeProfit = 0;
    sortedSales.forEach(sale => {
      const dateKey = format(new Date(sale.sale_date), "MMM d");
      cumulativeProfit += (sale.profit || 0) * sale.quantity_sold;
      salesByDate.set(dateKey, cumulativeProfit);
    });

    return Array.from(salesByDate.entries()).map(([date, profit]) => ({
      date,
      profit: Number(profit.toFixed(2)),
    }));
  }, [salesInRange]);

  // Calculate best sellers (top 10 by total profit)
  const bestSellers = useMemo(() => {
    const itemProfits = new Map<string, {
      name: string;
      totalProfit: number;
      quantitySold: number;
      imageUrl?: string;
      setName?: string;
    }>();

    salesInRange.forEach(sale => {
      const key = sale.item_name;
      const existing = itemProfits.get(key);
      const profit = (sale.profit || 0) * sale.quantity_sold;

      if (existing) {
        existing.totalProfit += profit;
        existing.quantitySold += sale.quantity_sold;
      } else {
        itemProfits.set(key, {
          name: sale.item_name,
          totalProfit: profit,
          quantitySold: sale.quantity_sold,
          imageUrl: (sale as any).card_image_url,
          setName: (sale as any).set_name,
        });
      }
    });

    return Array.from(itemProfits.values())
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10);
  }, [salesInRange]);

  // Worst performers (bottom 5 by profit)
  const worstSellers = useMemo(() => {
    const itemProfits = new Map<string, {
      name: string;
      totalProfit: number;
      quantitySold: number;
      imageUrl?: string;
    }>();

    salesInRange.forEach(sale => {
      const key = sale.item_name;
      const existing = itemProfits.get(key);
      const profit = (sale.profit || 0) * sale.quantity_sold;

      if (existing) {
        existing.totalProfit += profit;
        existing.quantitySold += sale.quantity_sold;
      } else {
        itemProfits.set(key, {
          name: sale.item_name,
          totalProfit: profit,
          quantitySold: sale.quantity_sold,
          imageUrl: (sale as any).card_image_url,
        });
      }
    });

    return Array.from(itemProfits.values())
      .sort((a, b) => a.totalProfit - b.totalProfit)
      .slice(0, 5);
  }, [salesInRange]);

  // Sales by category breakdown
  const salesByCategory = useMemo(() => {
    const categories: Record<string, { count: number; revenue: number; profit: number }> = {};
    salesInRange.forEach(sale => {
      const cat = (sale as any).grading_company && (sale as any).grading_company !== 'raw' 
        ? 'Graded' 
        : (sale as any).category === 'sealed' ? 'Sealed' : 'Raw';
      if (!categories[cat]) categories[cat] = { count: 0, revenue: 0, profit: 0 };
      categories[cat].count += sale.quantity_sold;
      categories[cat].revenue += sale.sale_price * sale.quantity_sold;
      categories[cat].profit += (sale.profit || 0) * sale.quantity_sold;
    });
    const COLORS = ['hsl(212, 100%, 49%)', 'hsl(142, 76%, 45%)', 'hsl(271, 81%, 56%)'];
    return Object.entries(categories).map(([name, data], i) => ({
      name,
      ...data,
      color: COLORS[i % COLORS.length],
    }));
  }, [salesInRange]);

  // Monthly comparison
  const monthlyComparison = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; profit: number; count: number }> = {};
    sales.forEach(sale => {
      const d = new Date(sale.sale_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = format(d, 'MMM yy');
      if (!months[key]) months[key] = { month: label, revenue: 0, profit: 0, count: 0 };
      months[key].revenue += sale.sale_price * sale.quantity_sold;
      months[key].profit += (sale.profit || 0) * sale.quantity_sold;
      months[key].count += sale.quantity_sold;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, d]) => d)
      .slice(-12);
  }, [sales]);

  // Profit margin over time (per-sale margin %)
  const marginOverTime = useMemo(() => {
    if (salesInRange.length === 0) return [];
    const sorted = [...salesInRange].sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());
    return sorted.map(sale => {
      const margin = sale.sale_price > 0 ? ((sale.profit || 0) / sale.sale_price) * 100 : 0;
      return {
        date: format(new Date(sale.sale_date), "MMM d"),
        margin: Number(margin.toFixed(1)),
        name: sale.item_name,
      };
    });
  }, [salesInRange]);

  const timeRanges: TimeRange[] = ["7D", "1M", "3M", "6M", "1Y", "ALL"];

  const filteredSales = sales.filter((sale) => {
    if (!searchTerm) return true;
    
    // Search in both item name and tag (notes)
    const matchesItemName = sale.item_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTag = sale.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesItemName || matchesTag;
  });

  
  // Group sales by client, then further group by sale_group_id for bulk sales
  const salesByClient = filteredSales.reduce((acc, sale) => {
    const clientName = sale.notes || "Untagged";
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(sale);
    return acc;
  }, {} as Record<string, typeof sales>);
  
  // Helper function to group sales by sale_group_id within a client
  const groupClientSales = (clientSales: typeof sales) => {
    const grouped: Array<{ isBulk: boolean; groupId?: string; sales: typeof sales }> = [];
    const processedGroups = new Set<string>();
    
    clientSales.forEach(sale => {
      const groupId = sale.sale_group_id;
      
      if (groupId && !processedGroups.has(groupId)) {
        // This is part of a bulk sale - group all sales with this group_id
        const bulkSales = clientSales.filter(s => s.sale_group_id === groupId);
        grouped.push({ isBulk: true, groupId, sales: bulkSales });
        processedGroups.add(groupId);
      } else if (!groupId) {
        // Single sale (no group_id)
        grouped.push({ isBulk: false, sales: [sale] });
      }
    });
    
    return grouped;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + sale.sale_price * sale.quantity_sold,
    0
  );
  const totalProfit = filteredSales.reduce(
    (sum, sale) => sum + (sale.profit || 0) * sale.quantity_sold,
    0
  );
  const totalItemsSold = filteredSales.reduce(
    (sum, sale) => sum + sale.quantity_sold,
    0
  );

  const toggleClient = (clientName: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName);
    } else {
      newExpanded.add(clientName);
    }
    setExpandedClients(newExpanded);
  };
  
  const toggleBulkSale = (groupId: string) => {
    const newExpanded = new Set(expandedBulkSales);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedBulkSales(newExpanded);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;

    try {
      await deleteSale(saleToDelete);
      toast({
        title: "Sale removed",
        description: "That sale record has been deleted.",
      });
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast({
        title: "Couldn't delete sale",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (saleId: string) => {
    setSaleToDelete(saleId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBulkSale = (groupId: string) => {
    setBulkSaleToDelete(groupId);
    setDeleteBulkDialogOpen(true);
  };

  const handleDeleteBulkSale = async () => {
    if (!bulkSaleToDelete) return;

    try {
      await deleteBulkSale(bulkSaleToDelete);
      setDeleteBulkDialogOpen(false);
      setBulkSaleToDelete(null);
    } catch (error) {
      console.error("Error deleting bulk sale:", error);
      toast({
        title: "Couldn't delete bulk sale",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (sale: any) => {
    setSaleToEdit(sale);
    setEditFormData({
      quantity_sold: sale.quantity_sold.toString(),
      sale_price: sale.sale_price.toString(),
      notes: sale.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSale = async () => {
    if (!saleToEdit) return;

    const quantityNum = parseInt(editFormData.quantity_sold);
    const salePriceNum = parseFloat(editFormData.sale_price);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Enter a number greater than zero.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(salePriceNum) || salePriceNum < 0) {
      toast({
        title: "Invalid price",
        description: "Enter a valid sale price.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSale(saleToEdit.id, {
        quantity_sold: quantityNum,
        sale_price: salePriceNum,
        notes: editFormData.notes || null,
        profit: salePriceNum - saleToEdit.purchase_price,
      });
      
      toast({
        title: "Sale updated ✓",
        description: "Your changes have been saved.",
      });
      
      setEditDialogOpen(false);
      setSaleToEdit(null);
    } catch (error) {
      console.error("Error updating sale:", error);
      toast({
        title: "Couldn't update sale",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const openRenameTagDialog = (tagName: string) => {
    setTagToRename(tagName);
    setNewTagName(tagName === "Untagged" ? "" : tagName);
    setRenameTagDialogOpen(true);
  };

  const handleRenameTag = async () => {
    if (!tagToRename) return;

    const trimmedNewTag = newTagName.trim();

    if (!trimmedNewTag && tagToRename !== "Untagged") {
      toast({
        title: "Tag name required",
        description: "Enter a name for this tag.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find all sales with the old tag
      const salesToUpdate = sales.filter(sale => {
        const currentTag = sale.notes || "Untagged";
        return currentTag === tagToRename;
      });

      // Update each sale with the new tag
      await Promise.all(
        salesToUpdate.map(sale =>
          updateSale(sale.id, {
            notes: trimmedNewTag || null,
          })
        )
      );

      toast({
        title: "Tag updated ✓",
        description: `Renamed to "${trimmedNewTag || 'Untagged'}" across ${salesToUpdate.length} sale(s).`,
      });

      setRenameTagDialogOpen(false);
      setTagToRename(null);
      setNewTagName("");
    } catch (error) {
      console.error("Error renaming tag:", error);
      toast({
        title: "Couldn't rename tag",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading sales...</p>
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
      <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
        {/* Compact Stats Grid - Robinhood Style */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 mb-5"
        >
          {/* Profit Card - Primary */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="card-clean-elevated p-5 rounded-3xl col-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Profit</span>
                <div className="mt-1">
                  <AnimatedProfit value={totalProfit} formatCurrency={formatCurrency} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  from {totalItemsSold.toLocaleString()} items sold
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${totalProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <TrendingUp className={`h-5 w-5 ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
            </div>
          </motion.div>

          {/* Revenue */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="card-clean-elevated p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Revenue</span>
              <div className="p-1.5 rounded-lg bg-primary/20">
                <DollarSign className="h-3 w-3 text-primary" />
              </div>
            </div>
            <div className="text-xl font-bold text-foreground">
              ${formatCurrency(totalRevenue)}
            </div>
          </motion.div>

          {/* Margin */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="card-clean-elevated p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Margin</span>
              <div className={`p-1.5 rounded-lg ${totalRevenue > 0 && (totalProfit / totalRevenue) >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <TrendingUp className={`h-3 w-3 ${totalRevenue > 0 && (totalProfit / totalRevenue) >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
            </div>
            <div className={`text-xl font-bold ${totalRevenue > 0 && (totalProfit / totalRevenue) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : '0%'}
            </div>
          </motion.div>

          {/* Items Sold */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="card-clean-elevated p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sold</span>
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <Trophy className="h-3 w-3 text-amber-500" />
              </div>
            </div>
            <div className="text-xl font-bold text-foreground">
              {totalItemsSold.toLocaleString()}
            </div>
          </motion.div>

          {/* Transactions */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="card-clean-elevated p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Transactions</span>
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <UserCircle2 className="h-3 w-3 text-purple-500" />
              </div>
            </div>
            <div className="text-xl font-bold text-foreground">
              {filteredSales.length}
            </div>
          </motion.div>
        </motion.div>

        {/* Full-width Gradient Chart - Robinhood Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 -mx-4"
        >
          {/* Time Range Selector */}
          <div className="flex items-center justify-between px-4 mb-3">
            <span className="text-sm font-semibold text-foreground">Performance</span>
            <div className="flex gap-1 bg-secondary/30 rounded-full p-1">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`text-[11px] px-3 py-1 rounded-full font-medium transition-all ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Full-width Chart */}
          {profitChartData.length > 0 ? (
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={totalProfit >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor={totalProfit >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      fontSize: "13px",
                      padding: "10px 14px",
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "11px", marginBottom: "4px" }}
                    formatter={(value: number) => [
                      <span className={`font-bold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        ${formatCurrency(value)}
                      </span>,
                      "Profit"
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke={totalProfit >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"}
                    strokeWidth={2.5}
                    fill="url(#profitGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground px-4">
              <div className="text-center">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No data for this period</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Best Sellers - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-clean-elevated rounded-3xl p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top Performers
            </h3>
            <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
              {timeRange === "ALL" ? "All time" : timeRange}
            </span>
          </div>

          {bestSellers.length > 0 ? (
            <div className="space-y-2">
              {bestSellers.slice(0, 5).map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  {/* Rank Badge - Medal style for top 3 */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30" :
                    index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-400/30" :
                    index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>

                  {/* Item Image */}
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-secondary/50 flex-shrink-0 shadow-sm">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      {item.quantitySold} sold
                    </p>
                  </div>

                  {/* Profit */}
                  <div className={`text-base font-bold flex-shrink-0 ${item.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.totalProfit >= 0 ? '+' : ''}${formatCurrency(Math.abs(item.totalProfit))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No sales data</p>
            </div>
          )}
        </motion.div>

        {/* Profit Margin Over Time */}
        {marginOverTime.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="card-clean-elevated rounded-3xl p-5 mb-6"
          >
            <h3 className="text-base font-bold flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              Profit Margin Trend
            </h3>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marginOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} interval="preserveStartEnd" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}%`, 'Margin']} />
                  <Line type="monotone" dataKey="margin" stroke="hsl(212, 100%, 49%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Worst Performers */}
        {worstSellers.length > 0 && worstSellers[0].totalProfit < 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.47 }}
            className="card-clean-elevated rounded-3xl p-5 mb-6"
          >
            <h3 className="text-base font-bold flex items-center gap-2 mb-4">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Worst Performers
            </h3>
            <div className="space-y-2">
              {worstSellers.filter(s => s.totalProfit < 0).map((item, i) => (
                <div key={item.name} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/30">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.quantitySold} sold</p>
                  </div>
                  <span className="text-sm font-bold text-destructive">
                    -${formatCurrency(Math.abs(item.totalProfit))}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sales by Category */}
        {salesByCategory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="card-clean-elevated rounded-3xl p-5 mb-6"
          >
            <h3 className="text-base font-bold flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-purple-500" />
              Sales by Category
            </h3>
            <div className="space-y-3">
              {salesByCategory.map(cat => {
                const totalRev = salesByCategory.reduce((s, c) => s + c.revenue, 0);
                const pct = totalRev > 0 ? (cat.revenue / totalRev) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{cat.count} items · ${formatCurrency(cat.revenue)}</span>
                    </div>
                    <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Monthly Comparison */}
        {monthlyComparison.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.49 }}
            className="card-clean-elevated rounded-3xl p-5 mb-6"
          >
            <h3 className="text-base font-bold flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-amber-500" />
              Monthly Comparison
            </h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: number, name: string) => [`$${formatCurrency(value)}`, name === 'revenue' ? 'Revenue' : 'Profit']} />
                  <Bar dataKey="revenue" fill="hsl(212, 100%, 49%)" radius={[4, 4, 0, 0]} opacity={0.4} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {monthlyComparison.map((entry, index) => (
                      <Cell key={index} fill={entry.profit >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary/40" /><span className="text-[10px] text-muted-foreground">Revenue</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500" /><span className="text-[10px] text-muted-foreground">Profit</span></div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-clean-elevated rounded-3xl overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-primary" />
                Clients
              </h3>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sales, clients, or cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm rounded-xl bg-secondary/30 border-border/50"
              />
            </div>
          </div>
          <div className="pb-4 px-3">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12 border border-border/30 rounded-2xl bg-muted/5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-7 w-7 text-emerald-500/40" strokeWidth={1.75} />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">
                  {sales.length === 0 ? "No Sales Yet" : "No Matches"}
                </p>
                <p className="text-sm text-muted-foreground/60 max-w-[220px] mx-auto">
                  {sales.length === 0
                    ? "Record your first sale from your inventory to start tracking profits."
                    : "Try a different search term."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(salesByClient).map(([clientName, clientSales]) => {
                  const clientTotal = clientSales.reduce((sum, sale) => sum + sale.sale_price * sale.quantity_sold, 0);
                  const clientProfit = clientSales.reduce((sum, sale) => sum + (sale.profit || 0) * sale.quantity_sold, 0);
                  const isExpanded = expandedClients.has(clientName);

                  return (
                    <div key={clientName} className="border border-border/30 rounded-xl bg-card/30 overflow-hidden">
                      {/* Client Header */}
                      <button
                        onClick={() => toggleClient(clientName)}
                        className="w-full p-3 flex items-center justify-between hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <UserCircle2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm truncate">{clientName}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{clientSales.reduce((sum, sale) => sum + sale.quantity_sold, 0)} items</span>
                              <span>·</span>
                              <span>${formatCurrency(clientTotal)} rev</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-lg ${clientProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                            <p className={`text-sm font-bold ${clientProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {clientProfit >= 0 ? '+' : ''}${formatCurrency(Math.abs(clientProfit))}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Client Sales List */}
                      {isExpanded && (
                        <div className="border-t border-border/20 bg-muted/5">
                          <div className="p-2 space-y-2">
                            {groupClientSales(clientSales).map((group, groupIndex) => {
                              if (group.isBulk && group.groupId) {
                                // Bulk Sale Group
                                const isBulkExpanded = expandedBulkSales.has(group.groupId);
                                const bulkTotal = group.sales.reduce((sum, sale) => sum + sale.sale_price * sale.quantity_sold, 0);
                                const bulkQuantity = group.sales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
                                const bulkProfit = group.sales.reduce((sum, sale) => sum + (sale.profit || 0) * sale.quantity_sold, 0);
                                const bulkDate = group.sales[0].sale_date;
                                
                                return (
                                  <div key={group.groupId} className="space-y-1.5">
                                    {/* Bulk Sale Header - Mobile Friendly */}
                                    <div
                                      className="group relative p-3 border border-primary/40 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-all cursor-pointer"
                                      onClick={() => toggleBulkSale(group.groupId!)}
                                    >
                                      {/* Top row: Icon, Title, Expand */}
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-lg bg-primary/20">
                                            <Package className="h-4 w-4 text-primary" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <h4 className="font-bold text-sm">Bulk Sale</h4>
                                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                                                {group.sales.length} items
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                              {format(new Date(bulkDate), "MMM d, yyyy · h:mm a")}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              confirmDeleteBulkSale(group.groupId!);
                                            }}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                          {isBulkExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </div>
                                      </div>

                                      {/* Stats row: 2x2 grid on mobile */}
                                      <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-background/50 rounded-lg p-2">
                                          <p className="text-[9px] text-muted-foreground uppercase">Qty</p>
                                          <p className="text-sm font-bold">{bulkQuantity}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-lg p-2">
                                          <p className="text-[9px] text-muted-foreground uppercase">Cost</p>
                                          <p className="text-sm font-semibold text-muted-foreground">${formatCurrency(group.sales.reduce((sum, sale) => sum + (sale.purchase_price * sale.quantity_sold), 0))}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-lg p-2">
                                          <p className="text-[9px] text-muted-foreground uppercase">Sale</p>
                                          <p className="text-sm font-bold">${formatCurrency(bulkTotal)}</p>
                                        </div>
                                        <div className="bg-background/50 rounded-lg p-2">
                                          <p className="text-[9px] text-muted-foreground uppercase">Profit</p>
                                          <p className={`text-sm font-bold ${bulkProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                            {bulkProfit >= 0 ? '+' : ''}${formatCurrency(Math.abs(bulkProfit))}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Bulk Sale Items */}
                                    {isBulkExpanded && (
                                      <div className="mt-2 space-y-1 pl-2 border-l-2 border-primary/30">
                                        {group.sales.map((sale) => (
                                          <div
                                            key={sale.id}
                                            className="group flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                                          >
                                            {/* Small Image */}
                                            <img
                                              src={(sale as any).card_image_url || '/placeholders/pokemon-card.svg'}
                                              alt={sale.item_name}
                                              className="w-8 h-11 object-contain rounded border border-border/30 flex-shrink-0"
                                            />

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-semibold truncate">{sale.item_name}</p>
                                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                <span>×{sale.quantity_sold}</span>
                                                <span>${formatCurrency(sale.sale_price)}</span>
                                                {(sale as any).grading_company && (sale as any).grading_company !== 'raw' && (
                                                  <span className="text-primary font-semibold">
                                                    {(sale as any).grading_company.toUpperCase()} {(sale as any).grade}
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            {/* Profit */}
                                            <span className={`text-xs font-bold flex-shrink-0 ${(sale.profit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                              {(sale.profit || 0) >= 0 ? '+' : ''}${formatCurrency(Math.abs((sale.profit || 0) * sale.quantity_sold))}
                                            </span>

                                            {/* Actions */}
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                onClick={(e) => { e.stopPropagation(); openEditDialog(sale); }}
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              } else {
                                // Single Sale
                                const sale = group.sales[0];
                                return (
                                  <div
                                    key={sale.id}
                                    className="group flex items-center gap-3 p-2.5 border border-border/30 rounded-xl bg-card/50 hover:bg-card transition-colors"
                                  >
                                    {/* Card Image */}
                                    <img
                                      src={(sale as any).card_image_url || '/placeholders/pokemon-card.svg'}
                                      alt={sale.item_name}
                                      className="w-12 h-16 object-contain rounded-lg border border-border/30 flex-shrink-0"
                                    />

                                    {/* Sale Details */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm truncate">{sale.item_name}</h4>
                                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                        <span>{(sale as any).set_name}</span>
                                        {(sale as any).grading_company && (sale as any).grading_company !== 'raw' && (
                                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                                            {(sale as any).grading_company.toUpperCase()} {(sale as any).grade}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                                        <span>×{sale.quantity_sold}</span>
                                        <span>${formatCurrency(sale.purchase_price)} → ${formatCurrency(sale.sale_price)}</span>
                                        <span>{format(new Date(sale.sale_date), "MMM d")}</span>
                                      </div>
                                    </div>

                                    {/* Profit */}
                                    <div className="text-right flex-shrink-0">
                                      <p className={`text-sm font-bold ${(sale.profit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {(sale.profit || 0) >= 0 ? '+' : ''}${formatCurrency(Math.abs((sale.profit || 0) * sale.quantity_sold))}
                                      </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                        onClick={() => openEditDialog(sale)}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => confirmDelete(sale.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </div>
                      )}
                      
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="border-2 border-border/40 bg-card backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-destructive/60 to-transparent" />
            
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Sale
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete this sale? This action cannot be undone and the inventory will not be restored.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11 px-6">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSale}
                className="h-11 px-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete Sale
              </AlertDialogAction>
            </AlertDialogFooter>
            
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Bulk Sale Dialog */}
        <AlertDialog open={deleteBulkDialogOpen} onOpenChange={setDeleteBulkDialogOpen}>
          <AlertDialogContent className="border-2 border-border/40 bg-card backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-destructive/60 to-transparent" />
            
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Bulk Sale
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete this entire bulk sale? All items in this bulk sale will be permanently removed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11 px-6">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBulkSale}
                className="h-11 px-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete Bulk Sale
              </AlertDialogAction>
            </AlertDialogFooter>
            
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Sale Dialog */}
        <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <AlertDialogContent className="border-2 border-border/40 bg-card backdrop-blur-sm max-w-md">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Sale
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Update the sale details below
              </AlertDialogDescription>
            </AlertDialogHeader>

            {saleToEdit && (
              <div className="space-y-4 py-4">
                {/* Item Info */}
                <div className="p-3 bg-muted/30 rounded-lg border border-border/40">
                  <h4 className="font-semibold text-sm mb-1">{saleToEdit.item_name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Purchase Price: ${formatCurrency(saleToEdit.purchase_price)} each
                  </p>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity" className="text-sm font-semibold">Quantity Sold</Label>
                  <Input
                    id="edit-quantity"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editFormData.quantity_sold}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditFormData(prev => ({ ...prev, quantity_sold: value }));
                    }}
                    placeholder="1"
                    className="h-11 font-semibold"
                  />
                </div>

                {/* Sale Price */}
                <div className="space-y-2">
                  <Label htmlFor="edit-sale-price" className="text-sm font-semibold">Sale Price (each)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="edit-sale-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editFormData.sale_price}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                      placeholder="0.00"
                      className="h-11 pl-7 font-semibold"
                    />
                  </div>
                </div>

                {/* Sale Tag */}
                <div className="space-y-2">
                  <Label htmlFor="edit-sale-tag" className="text-sm font-semibold">Sale Tag</Label>
                  <Input
                    id="edit-sale-tag"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Tag this sale"
                    className="h-11"
                  />
                </div>

                {/* Profit Preview */}
                {editFormData.sale_price && editFormData.quantity_sold && (
                  <div className="p-3 bg-gradient-to-br from-muted/40 to-muted/20 border-2 border-primary/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-medium">New Profit:</span>
                      <span className={`text-lg font-bold ${
                        (parseFloat(editFormData.sale_price) - saleToEdit.purchase_price) * parseInt(editFormData.quantity_sold) >= 0 
                          ? 'text-success' 
                          : 'text-destructive'
                      }`}>
                        {(parseFloat(editFormData.sale_price) - saleToEdit.purchase_price) * parseInt(editFormData.quantity_sold) >= 0 ? '+' : ''}
                        ${formatCurrency(Math.abs((parseFloat(editFormData.sale_price) - saleToEdit.purchase_price) * parseInt(editFormData.quantity_sold)))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel className="h-11 px-6">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEditSale}
                className="h-11 px-6 shadow-gold hover:shadow-gold-strong"
              >
                Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
            
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </AlertDialogContent>
        </AlertDialog>

        {/* Rename Tag Dialog */}
        <AlertDialog open={renameTagDialogOpen} onOpenChange={setRenameTagDialogOpen}>
          <AlertDialogContent className="border-2 border-border/40 bg-card backdrop-blur-sm max-w-md">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Rename Client Tag
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will update all sales with the tag "{tagToRename}" to use the new name
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-tag-name" className="text-sm font-semibold">New Tag Name</Label>
                <Input
                  id="new-tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter new tag name..."
                  className="h-11 font-semibold"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to mark sales as untagged
                </p>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel className="h-11 px-6">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRenameTag}
                className="h-11 px-6 shadow-gold hover:shadow-gold-strong"
              >
                Rename Tag
              </AlertDialogAction>
            </AlertDialogFooter>
            
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </AlertDialogContent>
      </AlertDialog>
      </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default Sales;

