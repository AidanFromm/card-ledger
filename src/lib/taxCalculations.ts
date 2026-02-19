// Tax Calculations Library for CardLedger
// Supports FIFO, LIFO, and Specific Lot cost basis methods

import { Sale } from "@/hooks/useSalesDb";

export type CostBasisMethod = "fifo" | "lifo" | "specific";
export type GainType = "short-term" | "long-term";

export interface TaxLot {
  id: string;
  itemName: string;
  purchaseDate: string;
  purchasePrice: number;
  quantity: number;
  remainingQuantity: number;
  saleDate?: string;
  salePrice?: number;
  gainLoss?: number;
  gainType?: GainType;
  holdingPeriodDays?: number;
}

export interface CapitalGain {
  itemName: string;
  purchaseDate: string;
  saleDate: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  gainLoss: number;
  gainType: GainType;
  holdingPeriodDays: number;
  fees?: number;
  costBasisMethod: CostBasisMethod;
}

export interface TaxSummary {
  year: number;
  totalProceeds: number;
  totalCostBasis: number;
  totalGainLoss: number;
  shortTermGains: number;
  shortTermLosses: number;
  longTermGains: number;
  longTermLosses: number;
  netShortTerm: number;
  netLongTerm: number;
  totalTransactions: number;
  transactions: CapitalGain[];
}

export interface ProfitLossSummary {
  period: string;
  startDate: string;
  endDate: string;
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  fees: number;
  netProfit: number;
  transactionCount: number;
  itemsSold: number;
  marginPercent: number;
}

// Determine if a gain is short-term or long-term (1 year = 365 days)
export const determineGainType = (purchaseDate: string, saleDate: string): GainType => {
  const purchase = new Date(purchaseDate);
  const sale = new Date(saleDate);
  const holdingDays = Math.floor((sale.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
  return holdingDays > 365 ? "long-term" : "short-term";
};

// Calculate holding period in days
export const calculateHoldingPeriod = (purchaseDate: string, saleDate: string): number => {
  const purchase = new Date(purchaseDate);
  const sale = new Date(saleDate);
  return Math.floor((sale.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
};

// Generate tax lots from sales data
export const generateTaxLots = (
  sales: Sale[],
  method: CostBasisMethod = "fifo"
): TaxLot[] => {
  // Group sales by item
  const itemSales = new Map<string, Sale[]>();
  
  sales.forEach(sale => {
    const existing = itemSales.get(sale.item_name) || [];
    existing.push(sale);
    itemSales.set(sale.item_name, existing);
  });

  const taxLots: TaxLot[] = [];

  itemSales.forEach((itemSalesGroup, itemName) => {
    // Sort by date based on method
    const sortedSales = [...itemSalesGroup].sort((a, b) => {
      const dateA = new Date(a.sale_date).getTime();
      const dateB = new Date(b.sale_date).getTime();
      return method === "lifo" ? dateB - dateA : dateA - dateB;
    });

    sortedSales.forEach((sale, idx) => {
      const holdingDays = calculateHoldingPeriod(sale.created_at, sale.sale_date);
      const gainLoss = (sale.sale_price - sale.purchase_price) * sale.quantity_sold;
      
      taxLots.push({
        id: sale.id,
        itemName: sale.item_name,
        purchaseDate: sale.created_at,
        purchasePrice: sale.purchase_price,
        quantity: sale.quantity_sold,
        remainingQuantity: 0, // Sold
        saleDate: sale.sale_date,
        salePrice: sale.sale_price,
        gainLoss,
        gainType: determineGainType(sale.created_at, sale.sale_date),
        holdingPeriodDays: holdingDays,
      });
    });
  });

  return taxLots;
};

// Calculate capital gains from sales
export const calculateCapitalGains = (
  sales: Sale[],
  method: CostBasisMethod = "fifo"
): CapitalGain[] => {
  const gains: CapitalGain[] = [];

  sales.forEach(sale => {
    // Use the purchase date from the sale record or created_at as fallback
    const purchaseDate = sale.created_at;
    const saleDate = sale.sale_date;
    const holdingDays = calculateHoldingPeriod(purchaseDate, saleDate);
    const gainType = determineGainType(purchaseDate, saleDate);
    const gainLoss = (sale.sale_price - sale.purchase_price) * sale.quantity_sold;
    const fees = sale.fees || 0;

    gains.push({
      itemName: sale.item_name,
      purchaseDate,
      saleDate,
      purchasePrice: sale.purchase_price * sale.quantity_sold,
      salePrice: sale.sale_price * sale.quantity_sold,
      quantity: sale.quantity_sold,
      gainLoss: gainLoss - fees,
      gainType,
      holdingPeriodDays: holdingDays,
      fees,
      costBasisMethod: method,
    });
  });

  // Sort based on method
  return gains.sort((a, b) => {
    const dateA = new Date(a.saleDate).getTime();
    const dateB = new Date(b.saleDate).getTime();
    return method === "lifo" ? dateB - dateA : dateA - dateB;
  });
};

// Generate year-end tax summary
export const generateTaxSummary = (
  sales: Sale[],
  year: number,
  method: CostBasisMethod = "fifo"
): TaxSummary => {
  // Filter sales for the given year
  const yearSales = sales.filter(sale => {
    const saleYear = new Date(sale.sale_date).getFullYear();
    return saleYear === year;
  });

  const gains = calculateCapitalGains(yearSales, method);

  let shortTermGains = 0;
  let shortTermLosses = 0;
  let longTermGains = 0;
  let longTermLosses = 0;
  let totalProceeds = 0;
  let totalCostBasis = 0;

  gains.forEach(gain => {
    totalProceeds += gain.salePrice;
    totalCostBasis += gain.purchasePrice;

    if (gain.gainType === "short-term") {
      if (gain.gainLoss >= 0) {
        shortTermGains += gain.gainLoss;
      } else {
        shortTermLosses += Math.abs(gain.gainLoss);
      }
    } else {
      if (gain.gainLoss >= 0) {
        longTermGains += gain.gainLoss;
      } else {
        longTermLosses += Math.abs(gain.gainLoss);
      }
    }
  });

  return {
    year,
    totalProceeds,
    totalCostBasis,
    totalGainLoss: totalProceeds - totalCostBasis,
    shortTermGains,
    shortTermLosses,
    longTermGains,
    longTermLosses,
    netShortTerm: shortTermGains - shortTermLosses,
    netLongTerm: longTermGains - longTermLosses,
    totalTransactions: gains.length,
    transactions: gains,
  };
};

// Generate profit/loss summary by time period
export const generateProfitLossByPeriod = (
  sales: Sale[],
  periodType: "month" | "quarter" | "year"
): ProfitLossSummary[] => {
  const summaries = new Map<string, ProfitLossSummary>();

  sales.forEach(sale => {
    const saleDate = new Date(sale.sale_date);
    const year = saleDate.getFullYear();
    const month = saleDate.getMonth();
    
    let periodKey: string;
    let startDate: string;
    let endDate: string;

    switch (periodType) {
      case "month":
        periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        startDate = new Date(year, month, 1).toISOString().split('T')[0];
        endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
        break;
      case "quarter":
        const quarter = Math.floor(month / 3) + 1;
        periodKey = `${year} Q${quarter}`;
        startDate = new Date(year, (quarter - 1) * 3, 1).toISOString().split('T')[0];
        endDate = new Date(year, quarter * 3, 0).toISOString().split('T')[0];
        break;
      case "year":
        periodKey = `${year}`;
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
        break;
    }

    const existing = summaries.get(periodKey) || {
      period: periodKey,
      startDate,
      endDate,
      revenue: 0,
      costOfGoods: 0,
      grossProfit: 0,
      fees: 0,
      netProfit: 0,
      transactionCount: 0,
      itemsSold: 0,
      marginPercent: 0,
    };

    const revenue = sale.sale_price * sale.quantity_sold;
    const cost = sale.purchase_price * sale.quantity_sold;
    const fees = (sale.fees || 0) * sale.quantity_sold;

    existing.revenue += revenue;
    existing.costOfGoods += cost;
    existing.fees += fees;
    existing.transactionCount += 1;
    existing.itemsSold += sale.quantity_sold;

    summaries.set(periodKey, existing);
  });

  // Calculate derived values
  return Array.from(summaries.values())
    .map(summary => ({
      ...summary,
      grossProfit: summary.revenue - summary.costOfGoods,
      netProfit: summary.revenue - summary.costOfGoods - summary.fees,
      marginPercent: summary.revenue > 0 
        ? ((summary.revenue - summary.costOfGoods) / summary.revenue) * 100 
        : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
};

// Get available tax years from sales data
export const getAvailableTaxYears = (sales: Sale[]): number[] => {
  const years = new Set<number>();
  sales.forEach(sale => {
    const year = new Date(sale.sale_date).getFullYear();
    years.add(year);
  });
  return Array.from(years).sort((a, b) => b - a);
};

// Export tax report to CSV format
export const exportTaxReportToCSV = (summary: TaxSummary): string => {
  const headers = [
    "Sale Date",
    "Item Name",
    "Purchase Date",
    "Quantity",
    "Cost Basis",
    "Proceeds",
    "Gain/Loss",
    "Type",
    "Holding Period (Days)",
    "Fees",
    "Cost Basis Method"
  ];

  const rows = summary.transactions.map(tx => [
    tx.saleDate,
    `"${tx.itemName}"`,
    tx.purchaseDate,
    tx.quantity,
    tx.purchasePrice.toFixed(2),
    tx.salePrice.toFixed(2),
    tx.gainLoss.toFixed(2),
    tx.gainType,
    tx.holdingPeriodDays,
    tx.fees?.toFixed(2) || "0.00",
    tx.costBasisMethod.toUpperCase()
  ]);

  // Add summary section
  const summaryRows = [
    [],
    ["TAX SUMMARY"],
    [`Year`, summary.year],
    [`Total Proceeds`, summary.totalProceeds.toFixed(2)],
    [`Total Cost Basis`, summary.totalCostBasis.toFixed(2)],
    [`Total Gain/Loss`, summary.totalGainLoss.toFixed(2)],
    [],
    [`Short-Term Gains`, summary.shortTermGains.toFixed(2)],
    [`Short-Term Losses`, `(${summary.shortTermLosses.toFixed(2)})`],
    [`Net Short-Term`, summary.netShortTerm.toFixed(2)],
    [],
    [`Long-Term Gains`, summary.longTermGains.toFixed(2)],
    [`Long-Term Losses`, `(${summary.longTermLosses.toFixed(2)})`],
    [`Net Long-Term`, summary.netLongTerm.toFixed(2)],
    [],
    [`Total Transactions`, summary.totalTransactions],
  ];

  return [
    headers.join(","),
    ...rows.map(row => row.join(",")),
    ...summaryRows.map(row => row.join(","))
  ].join("\n");
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format percentage for display
export const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};
