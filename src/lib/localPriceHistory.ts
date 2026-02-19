/**
 * Local Price History - localStorage-based price snapshots for items and portfolio
 */

export interface LocalPriceSnapshot {
  date: string; // YYYY-MM-DD
  price: number;
}

export interface PortfolioSnapshot {
  date: string;
  value: number;
}

const ITEM_PREFIX = 'cl_price_';
const PORTFOLIO_KEY = 'cl_portfolio_history';
const MAX_SNAPSHOTS = 365;

// --- Item Price History ---

export function getItemPriceHistory(itemId: string): LocalPriceSnapshot[] {
  try {
    const raw = localStorage.getItem(`${ITEM_PREFIX}${itemId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordItemPrice(itemId: string, price: number): void {
  if (!price || price <= 0) return;
  const today = new Date().toISOString().split('T')[0];
  const history = getItemPriceHistory(itemId);
  
  // Only one snapshot per day
  const existing = history.findIndex(s => s.date === today);
  if (existing >= 0) {
    history[existing].price = price;
  } else {
    history.push({ date: today, price });
  }
  
  // Keep only last MAX_SNAPSHOTS
  const trimmed = history.slice(-MAX_SNAPSHOTS);
  try {
    localStorage.setItem(`${ITEM_PREFIX}${itemId}`, JSON.stringify(trimmed));
  } catch {
    // localStorage full, ignore
  }
}

export function getItemSparklineData(itemId: string, days: number = 30): number[] {
  const history = getItemPriceHistory(itemId);
  if (history.length === 0) return [];
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  
  return history
    .filter(s => s.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => s.price);
}

// --- Portfolio Value History ---

export function getPortfolioHistory(): PortfolioSnapshot[] {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordPortfolioValue(value: number): void {
  if (value <= 0) return;
  const today = new Date().toISOString().split('T')[0];
  const history = getPortfolioHistory();
  
  const existing = history.findIndex(s => s.date === today);
  if (existing >= 0) {
    history[existing].value = value;
  } else {
    history.push({ date: today, value });
  }
  
  const trimmed = history.slice(-MAX_SNAPSHOTS);
  try {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function getPortfolioChartData(range: '7D' | '30D' | '90D'): PortfolioSnapshot[] {
  const days = range === '7D' ? 7 : range === '30D' ? 30 : 90;
  const history = getPortfolioHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  
  return history
    .filter(s => s.date >= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function clearPriceCache(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(ITEM_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem(PORTFOLIO_KEY);
}
