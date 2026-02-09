import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type Sale = Database["public"]["Tables"]["sales"]["Row"];
type PurchaseEntry = Database["public"]["Tables"]["purchase_entries"]["Row"];

// FIFO Cost Basis Calculation
export interface CostBasisResult {
  totalCost: number;
  totalQuantity: number;
  averageCost: number;
  lots: CostLot[];
}

export interface CostLot {
  date: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  remainingQuantity: number;
}

export const calculateFIFOCostBasis = (
  purchases: PurchaseEntry[],
  sales: Sale[]
): CostBasisResult => {
  // Sort purchases by date (oldest first for FIFO)
  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()
  );

  // Create lots from purchases
  const lots: CostLot[] = sortedPurchases.map((p) => ({
    date: p.purchase_date,
    quantity: p.quantity,
    pricePerUnit: p.purchase_price,
    totalCost: p.purchase_price * p.quantity,
    remainingQuantity: p.quantity,
  }));

  // Sort sales by date
  const sortedSales = [...sales].sort(
    (a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
  );

  // Apply FIFO: deduct sold quantities from oldest lots first
  for (const sale of sortedSales) {
    let remainingToSell = sale.quantity_sold;

    for (const lot of lots) {
      if (remainingToSell <= 0) break;
      if (lot.remainingQuantity <= 0) continue;

      const deduct = Math.min(lot.remainingQuantity, remainingToSell);
      lot.remainingQuantity -= deduct;
      remainingToSell -= deduct;
    }
  }

  // Calculate remaining cost basis
  const remainingLots = lots.filter((lot) => lot.remainingQuantity > 0);
  const totalCost = remainingLots.reduce(
    (sum, lot) => sum + lot.pricePerUnit * lot.remainingQuantity,
    0
  );
  const totalQuantity = remainingLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);

  return {
    totalCost,
    totalQuantity,
    averageCost: totalQuantity > 0 ? totalCost / totalQuantity : 0,
    lots: remainingLots,
  };
};

// ROI Calculation
export interface ROIResult {
  totalInvested: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedROI: number;
  realizedGain: number;
  realizedROI: number;
  totalROI: number;
}

export const calculateROI = (
  items: InventoryItem[],
  sales: Sale[]
): ROIResult => {
  // Unrealized calculations (current inventory)
  const unsoldItems = items.filter((item) => !item.sale_price && item.quantity > 0);
  const totalInvested = unsoldItems.reduce(
    (sum, item) => sum + item.purchase_price * item.quantity,
    0
  );
  const currentValue = unsoldItems.reduce((sum, item) => {
    const price = item.market_price || item.purchase_price;
    return sum + price * item.quantity;
  }, 0);
  const unrealizedGain = currentValue - totalInvested;
  const unrealizedROI = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0;

  // Realized calculations (from sales)
  const totalSalesRevenue = sales.reduce(
    (sum, sale) => sum + sale.sale_price * sale.quantity_sold,
    0
  );
  const totalSalesCost = sales.reduce(
    (sum, sale) => sum + sale.purchase_price * sale.quantity_sold,
    0
  );
  const realizedGain = totalSalesRevenue - totalSalesCost;
  const realizedROI = totalSalesCost > 0 ? (realizedGain / totalSalesCost) * 100 : 0;

  // Total ROI
  const totalCost = totalInvested + totalSalesCost;
  const totalValue = currentValue + totalSalesRevenue;
  const totalGain = totalValue - totalCost;
  const totalROI = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return {
    totalInvested,
    currentValue,
    unrealizedGain,
    unrealizedROI,
    realizedGain,
    realizedROI,
    totalROI,
  };
};

// Top Gainers/Losers
export interface GainerLoser {
  item: InventoryItem;
  purchasePrice: number;
  currentPrice: number;
  gain: number;
  gainPercent: number;
}

export const getTopGainersLosers = (
  items: InventoryItem[],
  limit: number = 5
): { gainers: GainerLoser[]; losers: GainerLoser[] } => {
  const itemsWithGains = items
    .filter((item) => item.quantity > 0 && item.market_price && item.market_price !== item.purchase_price)
    .map((item) => {
      const currentPrice = item.market_price || item.purchase_price;
      const gain = (currentPrice - item.purchase_price) * item.quantity;
      const gainPercent =
        item.purchase_price > 0
          ? ((currentPrice - item.purchase_price) / item.purchase_price) * 100
          : 0;

      return {
        item,
        purchasePrice: item.purchase_price,
        currentPrice,
        gain,
        gainPercent,
      };
    });

  // Sort by gain percent descending for gainers
  const gainers = [...itemsWithGains]
    .filter((g) => g.gainPercent > 0)
    .sort((a, b) => b.gainPercent - a.gainPercent)
    .slice(0, limit);

  // Sort by gain percent ascending for losers
  const losers = [...itemsWithGains]
    .filter((g) => g.gainPercent < 0)
    .sort((a, b) => a.gainPercent - b.gainPercent)
    .slice(0, limit);

  return { gainers, losers };
};

// Performance Metrics
export interface PerformanceMetrics {
  winRate: number;
  avgProfitPerSale: number;
  avgMargin: number;
  bestPerformingSet: { name: string; profit: number } | null;
  totalTrades: number;
  profitableTrades: number;
  unprofitableTrades: number;
}

export const calculatePerformanceMetrics = (sales: Sale[]): PerformanceMetrics => {
  if (sales.length === 0) {
    return {
      winRate: 0,
      avgProfitPerSale: 0,
      avgMargin: 0,
      bestPerformingSet: null,
      totalTrades: 0,
      profitableTrades: 0,
      unprofitableTrades: 0,
    };
  }

  const profitableTrades = sales.filter((s) => (s.profit || 0) > 0).length;
  const unprofitableTrades = sales.filter((s) => (s.profit || 0) < 0).length;
  const totalTrades = sales.length;
  const winRate = (profitableTrades / totalTrades) * 100;

  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0) * s.quantity_sold, 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.sale_price * s.quantity_sold, 0);
  const totalCost = sales.reduce((sum, s) => sum + s.purchase_price * s.quantity_sold, 0);

  const avgProfitPerSale = totalProfit / totalTrades;
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Best performing set
  const setProfit: Record<string, number> = {};
  sales.forEach((sale) => {
    const setName = sale.set_name || "Unknown";
    setProfit[setName] = (setProfit[setName] || 0) + (sale.profit || 0) * sale.quantity_sold;
  });

  const bestSet = Object.entries(setProfit).sort((a, b) => b[1] - a[1])[0];

  return {
    winRate,
    avgProfitPerSale,
    avgMargin,
    bestPerformingSet: bestSet ? { name: bestSet[0], profit: bestSet[1] } : null,
    totalTrades,
    profitableTrades,
    unprofitableTrades,
  };
};

// Monthly performance data for charts
export interface MonthlyPerformance {
  month: string;
  revenue: number;
  profit: number;
  itemsSold: number;
}

export const getMonthlyPerformance = (sales: Sale[]): MonthlyPerformance[] => {
  const monthlyData: Record<string, MonthlyPerformance> = {};

  sales.forEach((sale) => {
    const date = new Date(sale.sale_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthLabel,
        revenue: 0,
        profit: 0,
        itemsSold: 0,
      };
    }

    monthlyData[monthKey].revenue += sale.sale_price * sale.quantity_sold;
    monthlyData[monthKey].profit += (sale.profit || 0) * sale.quantity_sold;
    monthlyData[monthKey].itemsSold += sale.quantity_sold;
  });

  return Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, data]) => data);
};
