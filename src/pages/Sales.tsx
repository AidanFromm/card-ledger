import { useState, useMemo, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useSalesDb, Sale } from "@/hooks/useSalesDb";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { 
  Search, 
  DollarSign, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Pencil, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Trophy, 
  Image as ImageIcon, 
  Package,
  Plus,
  Download,
  Filter,
  Calendar,
  BarChart3,
  LineChart,
  X,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  ShoppingCart,
  Users,
  Percent
} from "lucide-react";
import { format, subDays, subMonths, subYears, isAfter, isBefore, startOfMonth, parseISO, isWithinInterval } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import RecordSaleDialog from "@/components/RecordSaleDialog";

// Sale Status type
type SaleStatus = "completed" | "pending" | "shipped";

// Platform options
const PLATFORMS = ["eBay", "TCGplayer", "Local", "Facebook", "Discord", "Other"] as const;
type Platform = typeof PLATFORMS[number];

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

// Animated value display component
const AnimatedValue = ({ 
  value, 
  formatFn, 
  prefix = "", 
  className = "" 
}: { 
  value: number; 
  formatFn: (n: number) => string;
  prefix?: string;
  className?: string;
}) => {
  const animatedValue = useCountUp(Math.abs(value), 800);
  const isPositive = value >= 0;

  return (
    <span className={className}>
      {prefix}{isPositive ? '' : '-'}${formatFn(animatedValue)}
    </span>
  );
};

// Animated profit display component
const AnimatedProfit = ({ value, formatCurrency }: { value: number; formatCurrency: (n: number) => string }) => {
  const animatedValue = useCountUp(Math.abs(value), 800);
  const isProfit = value >= 0;

  return (
    <span className={`text-2xl font-bold ${isProfit ? 'text-navy-500' : 'text-red-500'}`}>
      {isProfit ? '+' : '-'}${formatCurrency(animatedValue)}
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: SaleStatus }) => {
  const config = {
    completed: { icon: CheckCircle2, label: "Completed", className: "bg-navy-500/20 text-navy-500 border-navy-500/30" },
    pending: { icon: Clock, label: "Pending", className: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
    shipped: { icon: Truck, label: "Shipped", className: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge variant="outline" className={`text-[10px] font-semibold px-1.5 py-0.5 ${className}`}>
      <Icon className="h-2.5 w-2.5 mr-1" />
      {label}
    </Badge>
  );
};

// Platform Badge Component
const PlatformBadge = ({ platform }: { platform: string | null }) => {
  const platformIcons: Record<string, React.ElementType> = {
    "eBay": ShoppingCart,
    "TCGplayer": Store,
    "Local": Users,
    "Facebook": Users,
    "Discord": Users,
    "Other": Store,
  };

  const Icon = platformIcons[platform || "Other"] || Store;

  return platform ? (
    <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 bg-secondary/50 border-border/50">
      <Icon className="h-2.5 w-2.5 mr-1" />
      {platform}
    </Badge>
  ) : null;
};

// Time range type
type TimeRange = "7D" | "1M" | "3M" | "6M" | "1Y" | "ALL";

// Filter state type
interface FilterState {
  dateRange: TimeRange;
  platform: string;
  profitFilter: "all" | "profit" | "loss";
  status: string;
  searchTerm: string;
}

// Chart view type
type ChartView = "profit" | "revenue";

const Sales = () => {
  const { sales, loading, deleteSale, deleteBulkSale, updateSale } = useSalesDb();
  const { items: inventoryItems } = useInventoryDb();
  const { toast } = useToast();
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "ALL",
    platform: "all",
    profitFilter: "all",
    status: "all",
    searchTerm: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [chartView, setChartView] = useState<ChartView>("profit");

  // UI state
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
    platform: "",
    status: "completed" as SaleStatus,
  });
  
  // Record Sale Dialog state
  const [recordSaleOpen, setRecordSaleOpen] = useState(false);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<any[]>([]);

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

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Date range filter
      const startDate = getStartDate(filters.dateRange);
      if (startDate && !isAfter(new Date(sale.sale_date), startDate)) {
        return false;
      }

      // Platform filter
      if (filters.platform !== "all" && sale.platform !== filters.platform) {
        return false;
      }

      // Profit/Loss filter
      const profit = (sale.profit || 0) * sale.quantity_sold;
      if (filters.profitFilter === "profit" && profit < 0) {
        return false;
      }
      if (filters.profitFilter === "loss" && profit >= 0) {
        return false;
      }

      // Status filter
      const saleStatus = (sale as any).status || "completed";
      if (filters.status !== "all" && saleStatus !== filters.status) {
        return false;
      }

      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesItemName = sale.item_name.toLowerCase().includes(searchLower);
        const matchesTag = sale.notes?.toLowerCase().includes(searchLower);
        const matchesClient = sale.client_name?.toLowerCase().includes(searchLower);
        if (!matchesItemName && !matchesTag && !matchesClient) {
          return false;
        }
      }

      return true;
    });
  }, [sales, filters]);

  // Calculate profit over time data for chart
  const profitChartData = useMemo(() => {
    if (filteredSales.length === 0) return [];

    // Group sales by date and calculate cumulative profit
    const salesByDate = new Map<string, { profit: number; revenue: number }>();

    // Sort sales by date
    const sortedSales = [...filteredSales].sort(
      (a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
    );

    let cumulativeProfit = 0;
    let cumulativeRevenue = 0;
    sortedSales.forEach(sale => {
      const dateKey = format(new Date(sale.sale_date), "MMM d");
      cumulativeProfit += (sale.profit || 0) * sale.quantity_sold;
      cumulativeRevenue += sale.sale_price * sale.quantity_sold;
      salesByDate.set(dateKey, { 
        profit: Number(cumulativeProfit.toFixed(2)),
        revenue: Number(cumulativeRevenue.toFixed(2))
      });
    });

    return Array.from(salesByDate.entries()).map(([date, data]) => ({
      date,
      profit: data.profit,
      revenue: data.revenue,
    }));
  }, [filteredSales]);

  // Monthly revenue bar chart data
  const monthlyRevenueData = useMemo(() => {
    if (filteredSales.length === 0) return [];

    const monthlyData = new Map<string, { revenue: number; profit: number; count: number }>();

    filteredSales.forEach(sale => {
      const monthKey = format(new Date(sale.sale_date), "MMM yyyy");
      const existing = monthlyData.get(monthKey) || { revenue: 0, profit: 0, count: 0 };
      existing.revenue += sale.sale_price * sale.quantity_sold;
      existing.profit += (sale.profit || 0) * sale.quantity_sold;
      existing.count += sale.quantity_sold;
      monthlyData.set(monthKey, existing);
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        revenue: Number(data.revenue.toFixed(2)),
        profit: Number(data.profit.toFixed(2)),
        count: data.count,
      }))
      .slice(-12); // Last 12 months
  }, [filteredSales]);

  // Calculate best sellers (top 10 by total profit)
  const bestSellers = useMemo(() => {
    const itemProfits = new Map<string, {
      name: string;
      totalProfit: number;
      quantitySold: number;
      imageUrl?: string;
      setName?: string;
    }>();

    filteredSales.forEach(sale => {
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
  }, [filteredSales]);

  const timeRanges: TimeRange[] = ["7D", "1M", "3M", "6M", "1Y", "ALL"];

  // Group sales by client
  const salesByClient = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const clientName = sale.notes || "Untagged";
      if (!acc[clientName]) {
        acc[clientName] = [];
      }
      acc[clientName].push(sale);
      return acc;
    }, {} as Record<string, typeof sales>);
  }, [filteredSales]);
  
  // Helper function to group sales by sale_group_id within a client
  const groupClientSales = (clientSales: typeof sales) => {
    const grouped: Array<{ isBulk: boolean; groupId?: string; sales: typeof sales }> = [];
    const processedGroups = new Set<string>();
    
    clientSales.forEach(sale => {
      const groupId = sale.sale_group_id;
      
      if (groupId && !processedGroups.has(groupId)) {
        const bulkSales = clientSales.filter(s => s.sale_group_id === groupId);
        grouped.push({ isBulk: true, groupId, sales: bulkSales });
        processedGroups.add(groupId);
      } else if (!groupId) {
        grouped.push({ isBulk: false, sales: [sale] });
      }
    });
    
    return grouped;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Summary calculations
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
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

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

  const clearFilters = () => {
    setFilters({
      dateRange: "ALL",
      platform: "all",
      profitFilter: "all",
      status: "all",
      searchTerm: "",
    });
  };

  const hasActiveFilters = filters.platform !== "all" || 
    filters.profitFilter !== "all" || 
    filters.status !== "all" ||
    filters.dateRange !== "ALL";

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;

    try {
      await deleteSale(saleToDelete);
      toast({
        title: "Sale deleted",
        description: "The sale record has been removed successfully",
      });
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast({
        title: "Error",
        description: "Failed to delete sale",
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
        title: "Error",
        description: "Failed to delete bulk sale",
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
      platform: sale.platform || "",
      status: sale.status || "completed",
    });
    setEditDialogOpen(true);
  };

  const handleEditSale = async () => {
    if (!saleToEdit) return;

    const quantityNum = parseInt(editFormData.quantity_sold);
    const salePriceNum = parseFloat(editFormData.sale_price);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(salePriceNum) || salePriceNum < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid sale price",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSale(saleToEdit.id, {
        quantity_sold: quantityNum,
        sale_price: salePriceNum,
        notes: editFormData.notes || null,
        platform: editFormData.platform || null,
        profit: salePriceNum - saleToEdit.purchase_price,
      } as any);
      
      toast({
        title: "Sale updated",
        description: "The sale record has been updated successfully",
      });
      
      setEditDialogOpen(false);
      setSaleToEdit(null);
    } catch (error) {
      console.error("Error updating sale:", error);
      toast({
        title: "Error",
        description: "Failed to update sale",
        variant: "destructive",
      });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Sale Date",
      "Item Name",
      "Set Name",
      "Quantity",
      "Purchase Price",
      "Sale Price",
      "Profit",
      "Platform",
      "Client/Tag",
      "Status",
      "Grading",
      "Grade"
    ];

    const rows = filteredSales.map(sale => [
      format(new Date(sale.sale_date), "yyyy-MM-dd"),
      sale.item_name,
      (sale as any).set_name || "",
      sale.quantity_sold,
      sale.purchase_price.toFixed(2),
      sale.sale_price.toFixed(2),
      ((sale.profit || 0) * sale.quantity_sold).toFixed(2),
      sale.platform || "",
      sale.notes || sale.client_name || "",
      (sale as any).status || "completed",
      (sale as any).grading_company || "raw",
      (sale as any).grade || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales-export-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export complete",
      description: `Exported ${filteredSales.length} sales to CSV`,
    });
  };

  // Open record sale dialog with inventory items
  const openRecordSale = () => {
    // Filter available inventory items (quantity > 0)
    const availableItems = inventoryItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        id: item.id,
        name: item.name,
        set_name: item.set_name,
        card_number: item.card_number,
        purchase_price: item.purchase_price,
        quantity: item.quantity,
        market_price: item.market_price,
        card_image_url: item.card_image_url,
        condition: item.condition || "NM",
        grading_company: item.grading_company || "raw",
        grade: item.grade,
      }));
    
    setSelectedInventoryItems(availableItems);
    setRecordSaleOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-safe pt-safe">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
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
      <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">Sales</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="h-9 text-xs"
              disabled={filteredSales.length === 0}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={openRecordSale}
              className="h-9 text-xs shadow-gold hover:shadow-gold-strong"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Record Sale
            </Button>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5"
        >
          {/* Total Revenue */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="glass-card p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Revenue</span>
              <div className="p-1.5 rounded-lg bg-primary/20">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <div className="text-xl font-bold text-foreground">
              <AnimatedValue value={totalRevenue} formatFn={formatCurrency} prefix="$" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              all time
            </p>
          </motion.div>

          {/* Total Profit */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="glass-card p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Profit</span>
              <div className={`p-1.5 rounded-lg ${totalProfit >= 0 ? 'bg-navy-500/20' : 'bg-red-500/20'}`}>
                {totalProfit >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-navy-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
              </div>
            </div>
            <div className={`text-xl font-bold ${totalProfit >= 0 ? 'text-navy-500' : 'text-red-500'}`}>
              {totalProfit >= 0 ? '+' : '-'}$<AnimatedValue value={Math.abs(totalProfit)} formatFn={formatCurrency} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              revenue - cost
            </p>
          </motion.div>

          {/* Average Margin */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="glass-card p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Avg Margin</span>
              <div className={`p-1.5 rounded-lg ${averageMargin >= 0 ? 'bg-navy-500/20' : 'bg-red-500/20'}`}>
                <Percent className="h-3.5 w-3.5" style={{ color: averageMargin >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)' }} />
              </div>
            </div>
            <div className={`text-xl font-bold ${averageMargin >= 0 ? 'text-navy-500' : 'text-red-500'}`}>
              {averageMargin >= 0 ? '+' : ''}{averageMargin.toFixed(1)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              profit / revenue
            </p>
          </motion.div>

          {/* Number of Sales */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="glass-card p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Items Sold</span>
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
              </div>
            </div>
            <div className="text-xl font-bold text-foreground">
              {totalItemsSold.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {filteredSales.length} transactions
            </p>
          </motion.div>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          {/* Chart Toggle & Time Range */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1 bg-secondary/30 rounded-full p-1">
              <button
                onClick={() => setChartView("profit")}
                className={`text-[11px] px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                  chartView === "profit"
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LineChart className="h-3 w-3" />
                Profit Trend
              </button>
              <button
                onClick={() => setChartView("revenue")}
                className={`text-[11px] px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                  chartView === "revenue"
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                Monthly Revenue
              </button>
            </div>
            <div className="flex gap-1 bg-secondary/30 rounded-full p-1">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setFilters(f => ({ ...f, dateRange: range }))}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                    filters.dateRange === range
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="glass-card rounded-2xl p-4">
            {chartView === "profit" ? (
              // Profit Trend Line Chart
              profitChartData.length > 0 ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={profitChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                          fontSize: "13px",
                          padding: "10px 14px",
                        }}
                        labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "11px", marginBottom: "4px" }}
                        formatter={(value: number) => [
                          <span className={`font-bold ${value >= 0 ? 'text-navy-500' : 'text-red-500'}`}>
                            ${formatCurrency(value)}
                          </span>,
                          "Cumulative Profit"
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
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No data for this period</p>
                  </div>
                </div>
              )
            ) : (
              // Monthly Revenue Bar Chart
              monthlyRevenueData.length > 0 ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="month"
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
                        tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                          fontSize: "13px",
                          padding: "10px 14px",
                        }}
                        formatter={(value: number, name: string) => [
                          <span className={`font-bold ${name === 'profit' ? (value >= 0 ? 'text-navy-500' : 'text-red-500') : 'text-primary'}`}>
                            ${formatCurrency(value)}
                          </span>,
                          name === 'revenue' ? 'Revenue' : 'Profit'
                        ]}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px' }}
                        formatter={(value) => value === 'revenue' ? 'Revenue' : 'Profit'}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" fill="rgb(16, 185, 129)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No data for this period</p>
                  </div>
                </div>
              )
            )}
          </div>
        </motion.div>

        {/* Best Sellers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top Performers
            </h3>
            <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
              {filters.dateRange === "ALL" ? "All time" : filters.dateRange}
            </span>
          </div>

          {bestSellers.length > 0 ? (
            <div className="space-y-2">
              {bestSellers.slice(0, 5).map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  {/* Rank Badge */}
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
                  <div className={`text-base font-bold flex-shrink-0 ${item.totalProfit >= 0 ? 'text-navy-500' : 'text-red-500'}`}>
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

        {/* Sales History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Sales History
              </h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-7 px-2 text-xs ${hasActiveFilters ? 'border-primary/50 text-primary' : ''}`}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                      {[
                        filters.platform !== "all",
                        filters.profitFilter !== "all",
                        filters.status !== "all",
                        filters.dateRange !== "ALL"
                      ].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-secondary/20 rounded-xl border border-border/30">
                    {/* Platform Filter */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Platform</Label>
                      <Select
                        value={filters.platform}
                        onValueChange={(value) => setFilters(f => ({ ...f, platform: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Platforms</SelectItem>
                          {PLATFORMS.map(platform => (
                            <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Profit Filter */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Profit</Label>
                      <Select
                        value={filters.profitFilter}
                        onValueChange={(value: any) => setFilters(f => ({ ...f, profitFilter: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="profit">Profitable Only</SelectItem>
                          <SelectItem value="loss">Loss Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category/Date - keeping simple for now */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Date Range</Label>
                      <Select
                        value={filters.dateRange}
                        onValueChange={(value: TimeRange) => setFilters(f => ({ ...f, dateRange: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7D">Last 7 Days</SelectItem>
                          <SelectItem value="1M">Last Month</SelectItem>
                          <SelectItem value="3M">Last 3 Months</SelectItem>
                          <SelectItem value="6M">Last 6 Months</SelectItem>
                          <SelectItem value="1Y">Last Year</SelectItem>
                          <SelectItem value="ALL">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sales, clients, items..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                className="pl-9 h-10 text-sm rounded-xl bg-secondary/30 border-border/50"
              />
              {filters.searchTerm && (
                <button
                  onClick={() => setFilters(f => ({ ...f, searchTerm: "" }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sales List */}
          <div className="pb-4 px-3">
            {filteredSales.length === 0 ? (
              <div className="text-center py-8 border border-border/30 rounded-lg bg-muted/10">
                <p className="text-sm text-muted-foreground/70">
                  {sales.length === 0
                    ? "No sales yet"
                    : "No matches"}
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
                            <User className="h-4 w-4 text-primary" />
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
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/20 bg-muted/5 overflow-hidden"
                          >
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
                                      {/* Bulk Sale Header */}
                                      <div
                                        className="group relative p-3 border border-primary/40 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-all cursor-pointer"
                                        onClick={() => toggleBulkSale(group.groupId!)}
                                      >
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
                                      <AnimatePresence>
                                        {isBulkExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-2 space-y-1 pl-2 border-l-2 border-primary/30 overflow-hidden"
                                          >
                                            {group.sales.map((sale) => (
                                              <div
                                                key={sale.id}
                                                className="group flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                                              >
                                                <img
                                                  src={(sale as any).card_image_url || '/placeholders/pokemon-card.svg'}
                                                  alt={sale.item_name}
                                                  className="w-8 h-11 object-contain rounded border border-border/30 flex-shrink-0"
                                                />
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
                                                <span className={`text-xs font-bold flex-shrink-0 ${(sale.profit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                                  {(sale.profit || 0) >= 0 ? '+' : ''}${formatCurrency(Math.abs((sale.profit || 0) * sale.quantity_sold))}
                                                </span>
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
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                } else {
                                  // Single Sale
                                  const sale = group.sales[0];
                                  const saleStatus = ((sale as any).status || "completed") as SaleStatus;
                                  
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
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                                          <span>{(sale as any).set_name}</span>
                                          {(sale as any).grading_company && (sale as any).grading_company !== 'raw' && (
                                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                                              {(sale as any).grading_company.toUpperCase()} {(sale as any).grade}
                                            </span>
                                          )}
                                          <PlatformBadge platform={sale.platform} />
                                          <StatusBadge status={saleStatus} />
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Delete Sale Dialog */}
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

                {/* Platform */}
                <div className="space-y-2">
                  <Label htmlFor="edit-platform" className="text-sm font-semibold">Platform</Label>
                  <Select
                    value={editFormData.platform}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(platform => (
                        <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sale Tag */}
                <div className="space-y-2">
                  <Label htmlFor="edit-sale-tag" className="text-sm font-semibold">Sale Tag / Client</Label>
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

        {/* Record Sale Dialog */}
        <RecordSaleDialog
          open={recordSaleOpen}
          onOpenChange={setRecordSaleOpen}
          preselectedItems={selectedInventoryItems}
          onSaleComplete={() => {
            setRecordSaleOpen(false);
          }}
        />
      </main>
      <BottomNav />
    </div>
  );
};

export default Sales;
