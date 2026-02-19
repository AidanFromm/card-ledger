/**
 * Centralized price formatting utilities for consistent display across the app.
 * Task 1: Consistent pricing display
 */

/**
 * Format a number as currency with consistent alignment.
 * Uses tabular-nums for monospace number display.
 */
export const formatPrice = (amount: number | null | undefined): string => {
  if (amount == null || isNaN(amount)) return '—';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format a price with $ prefix
 */
export const formatDollar = (amount: number | null | undefined): string => {
  if (amount == null || isNaN(amount)) return '—';
  return `$${formatPrice(amount)}`;
};

/**
 * Format profit/loss with sign and color class
 */
export const formatProfitLoss = (amount: number): {
  text: string;
  colorClass: string;
  isPositive: boolean;
} => {
  const isPositive = amount >= 0;
  return {
    text: `${isPositive ? '+' : ''}$${formatPrice(Math.abs(amount))}`,
    colorClass: isPositive ? 'text-emerald-500' : 'text-red-500',
    isPositive,
  };
};

/**
 * Get the CSS classes for price display (monospace numbers)
 */
export const priceClasses = "font-mono tabular-nums";

/**
 * CSS classes for different price types
 */
export const marketPriceClasses = `${priceClasses} text-emerald-500 font-bold`;
export const costPriceClasses = `${priceClasses} text-muted-foreground`;
export const profitClasses = (isPositive: boolean) =>
  `${priceClasses} font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`;
