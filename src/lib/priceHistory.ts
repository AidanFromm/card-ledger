/**
 * Price History Utilities
 * P&L calculation and analysis functions for price history data
 */

export interface PriceHistoryPoint {
  recorded_date: string;
  market_price: number;
  lowest_listed: number | null;
  price_source: string;
}

export interface PortfolioSnapshot {
  date: string;
  totalValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
}

export interface ItemPriceChange {
  itemId: string;
  itemName: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
}

/**
 * Calculate the change between two values
 */
export function calculateChange(current: number, previous: number): { change: number; changePercent: number } {
  const change = current - previous;
  const changePercent = previous > 0 ? ((change / previous) * 100) : 0;
  return { change, changePercent };
}

/**
 * Calculate portfolio value change from price history
 */
export function calculatePortfolioChange(
  currentValue: number,
  yesterdayValue: number
): PortfolioSnapshot {
  const { change, changePercent } = calculateChange(currentValue, yesterdayValue);

  return {
    date: new Date().toISOString().split('T')[0],
    totalValue: currentValue,
    previousValue: yesterdayValue,
    change,
    changePercent,
  };
}

/**
 * Get top movers (gainers and losers) from price history
 */
export function getTopMovers(
  items: Array<{
    id: string;
    name: string;
    market_price: number | null;
    quantity: number;
  }>,
  priceHistory: Map<string, { currentPrice: number; previousPrice: number }>,
  limit: number = 3
): { gainers: ItemPriceChange[]; losers: ItemPriceChange[] } {
  const changes: ItemPriceChange[] = [];

  for (const item of items) {
    const history = priceHistory.get(item.id);
    if (!history || history.previousPrice === 0) continue;

    const { change, changePercent } = calculateChange(
      history.currentPrice,
      history.previousPrice
    );

    changes.push({
      itemId: item.id,
      itemName: item.name,
      currentPrice: history.currentPrice,
      previousPrice: history.previousPrice,
      change,
      changePercent,
    });
  }

  // Sort by change percent
  const sorted = changes.sort((a, b) => b.changePercent - a.changePercent);

  return {
    gainers: sorted.filter(c => c.changePercent > 0).slice(0, limit),
    losers: sorted.filter(c => c.changePercent < 0).slice(-limit).reverse(),
  };
}

/**
 * Format price change for display
 */
export function formatPriceChange(
  change: number,
  changePercent: number,
  options: { showSign?: boolean; showPercent?: boolean } = {}
): string {
  const { showSign = true, showPercent = true } = options;

  const sign = showSign && change >= 0 ? '+' : '';
  const value = `${sign}$${Math.abs(change).toFixed(2)}`;

  if (showPercent) {
    const percentSign = showSign && changePercent >= 0 ? '+' : '';
    return `${value} (${percentSign}${changePercent.toFixed(2)}%)`;
  }

  return value;
}

/**
 * Get chart data from price history
 */
export function getChartData(
  priceHistory: PriceHistoryPoint[],
  timeRange: '7D' | '1M' | '30D' | '3M' | '90D' | '6M' | '1Y' | 'ALL' = '30D'
): Array<{ date: string; price: number }> {
  const now = new Date();
  const ranges: Record<string, number> = {
    '7D': 7,
    '1M': 30,
    '30D': 30,
    '3M': 90,
    '90D': 90,
    '6M': 180,
    '1Y': 365,
    'ALL': 365 * 10, // 10 years effectively means all
  };

  const daysAgo = ranges[timeRange];
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - daysAgo);

  return priceHistory
    .filter(point => new Date(point.recorded_date) >= cutoff)
    .map(point => ({
      date: point.recorded_date,
      price: point.market_price,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculate 80% or 90% of a price (common selling thresholds)
 */
export function calculateSellingPrice(
  marketPrice: number,
  percent: 80 | 90 | 100
): number {
  return marketPrice * (percent / 100);
}

/**
 * Format a selling price display
 */
export function formatSellingPrice(
  marketPrice: number,
  percent: 80 | 90 | 100
): string {
  const price = calculateSellingPrice(marketPrice, percent);
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Determine if we have enough price history data for charts
 */
export function hasEnoughHistory(
  priceHistory: PriceHistoryPoint[],
  minimumDays: number = 2
): boolean {
  if (priceHistory.length < 2) return false;

  const dates = new Set(priceHistory.map(p => p.recorded_date));
  return dates.size >= minimumDays;
}

/**
 * Get the first recorded date from price history
 */
export function getFirstRecordedDate(priceHistory: PriceHistoryPoint[]): Date | null {
  if (priceHistory.length === 0) return null;

  const sorted = [...priceHistory].sort(
    (a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime()
  );

  return new Date(sorted[0].recorded_date);
}
