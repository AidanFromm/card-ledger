/**
 * Condition-Based Pricing
 * 
 * This is a KEY DIFFERENTIATOR for CardLedger.
 * Competitors like Collectr show the same price regardless of condition.
 * We adjust prices based on actual condition, giving users accurate valuations.
 * 
 * Based on TCG market research:
 * - NM (Near Mint): 100% of market price
 * - LP (Lightly Played): 85-90% of market price
 * - MP (Moderately Played): 70-80% of market price
 * - HP (Heavily Played): 50-60% of market price
 * - DMG (Damaged): 30-40% of market price
 */

// Condition multipliers (percentage of NM price)
export const CONDITION_MULTIPLIERS: Record<string, number> = {
  // Standard conditions
  'near-mint': 1.0,
  'nm': 1.0,
  'mint': 1.05, // Mint can be slightly higher
  'm': 1.05,
  
  'lightly-played': 0.87,
  'lp': 0.87,
  'excellent': 0.90,
  'ex': 0.90,
  
  'moderately-played': 0.75,
  'mp': 0.75,
  'good': 0.75,
  'gd': 0.75,
  'played': 0.75,
  
  'heavily-played': 0.55,
  'hp': 0.55,
  'poor': 0.50,
  'pr': 0.50,
  
  'damaged': 0.35,
  'dmg': 0.35,
  'd': 0.35,
  
  // Default for unknown conditions
  'raw': 0.90, // Assume LP for unspecified raw cards
  'unknown': 0.85,
};

// Get the appropriate multiplier for a condition string
export function getConditionMultiplier(condition: string | null | undefined): number {
  if (!condition) return 0.90; // Default to LP if not specified
  
  const normalized = condition.toLowerCase().replace(/[_\s-]/g, '-');
  
  // Direct match
  if (CONDITION_MULTIPLIERS[normalized] !== undefined) {
    return CONDITION_MULTIPLIERS[normalized];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(CONDITION_MULTIPLIERS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  return 0.85; // Default
}

// Adjust a price based on condition
export function adjustPriceForCondition(
  price: number,
  condition: string | null | undefined
): number {
  const multiplier = getConditionMultiplier(condition);
  return Math.round(price * multiplier * 100) / 100;
}

// Get human-readable condition name
export function getConditionLabel(condition: string | null | undefined): string {
  if (!condition) return 'Near Mint';
  
  const normalized = condition.toLowerCase().replace(/[_\s-]/g, '-');
  
  const labels: Record<string, string> = {
    'near-mint': 'Near Mint',
    'nm': 'Near Mint',
    'mint': 'Mint',
    'm': 'Mint',
    'lightly-played': 'Lightly Played',
    'lp': 'Lightly Played',
    'excellent': 'Excellent',
    'ex': 'Excellent',
    'moderately-played': 'Moderately Played',
    'mp': 'Moderately Played',
    'good': 'Good',
    'gd': 'Good',
    'played': 'Played',
    'heavily-played': 'Heavily Played',
    'hp': 'Heavily Played',
    'poor': 'Poor',
    'pr': 'Poor',
    'damaged': 'Damaged',
    'dmg': 'Damaged',
    'd': 'Damaged',
    'raw': 'Raw',
  };
  
  return labels[normalized] || condition;
}

// Get color for condition badge
export function getConditionColor(condition: string | null | undefined): string {
  const multiplier = getConditionMultiplier(condition);
  
  if (multiplier >= 1.0) return 'bg-emerald-500/20 text-emerald-500';
  if (multiplier >= 0.85) return 'bg-green-500/20 text-green-500';
  if (multiplier >= 0.70) return 'bg-amber-500/20 text-amber-500';
  if (multiplier >= 0.50) return 'bg-orange-500/20 text-orange-500';
  return 'bg-red-500/20 text-red-500';
}

// Calculate total adjusted value for a collection
export function calculateAdjustedCollectionValue(
  items: Array<{
    market_price: number | null;
    purchase_price: number;
    quantity: number;
    condition?: string | null;
    raw_condition?: string | null;
    grading_company?: string | null;
  }>
): {
  totalValue: number;
  totalCost: number;
  profit: number;
  profitPercent: number;
} {
  let totalValue = 0;
  let totalCost = 0;
  
  for (const item of items) {
    const basePrice = item.market_price ?? item.purchase_price;
    
    // If graded, don't adjust for condition (grade is built into price)
    const isGraded = item.grading_company && item.grading_company.toLowerCase() !== 'raw';
    
    const adjustedPrice = isGraded 
      ? basePrice 
      : adjustPriceForCondition(basePrice, item.raw_condition || item.condition);
    
    totalValue += adjustedPrice * item.quantity;
    totalCost += item.purchase_price * item.quantity;
  }
  
  const profit = totalValue - totalCost;
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  
  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    profitPercent: Math.round(profitPercent * 10) / 10,
  };
}

// Get condition-adjusted price with explanation
export function getAdjustedPriceWithExplanation(
  marketPrice: number,
  condition: string | null | undefined,
  isGraded: boolean
): {
  adjustedPrice: number;
  multiplier: number;
  explanation: string;
} {
  if (isGraded) {
    return {
      adjustedPrice: marketPrice,
      multiplier: 1.0,
      explanation: 'Graded cards use the graded price directly',
    };
  }
  
  const multiplier = getConditionMultiplier(condition);
  const adjustedPrice = Math.round(marketPrice * multiplier * 100) / 100;
  const label = getConditionLabel(condition);
  
  if (multiplier === 1.0) {
    return {
      adjustedPrice,
      multiplier,
      explanation: `${label} condition (full market price)`,
    };
  }
  
  const discount = Math.round((1 - multiplier) * 100);
  return {
    adjustedPrice,
    multiplier,
    explanation: `${label} condition (${discount}% below NM)`,
  };
}
