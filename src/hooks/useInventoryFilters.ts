import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

// Filter types
export type TCGType = 'all' | 'pokemon' | 'mtg' | 'yugioh' | 'sports' | 'onepiece' | 'other';
export type GradeFilter = 'all' | 'raw' | 'psa' | 'bgs' | 'cgc' | 'sgc';
export type ValueRange = 'all' | 'under10' | '10to50' | '50to100' | '100to500' | 'over500' | 'custom';
export type ConditionFilter = 'all' | 'mint' | 'near-mint' | 'excellent' | 'good' | 'poor';
export type DateRangeFilter = 'all' | '7days' | '30days' | '90days';
export type SortOption = 'value-desc' | 'value-asc' | 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc' | 'profit-desc' | 'profit-asc' | 'roi-desc' | 'roi-asc';
export type ViewMode = 'grid' | 'list' | 'table';
export type CategoryFilter = 'all' | 'raw' | 'graded' | 'sealed';
export type ProfitFilter = 'all' | 'profitable' | 'losing' | 'break-even';

export interface InventoryFilters {
  tcg: TCGType;
  grade: GradeFilter;
  valueRange: ValueRange;
  condition: ConditionFilter;
  dateRange: DateRangeFilter;
  category: CategoryFilter;
  sport: string;
  searchTerm: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  gradedOnly: boolean;
  profitFilter: ProfitFilter;
  setFilter: string;
  priceMin: number | null;
  priceMax: number | null;
}

const DEFAULT_FILTERS: InventoryFilters = {
  tcg: 'all',
  grade: 'all',
  valueRange: 'all',
  condition: 'all',
  dateRange: 'all',
  category: 'all',
  sport: 'all',
  searchTerm: '',
  sortBy: 'date-desc',
  viewMode: 'grid',
  gradedOnly: false,
  profitFilter: 'all',
  setFilter: 'all',
  priceMin: null,
  priceMax: null,
};

const STORAGE_KEY = 'cardledger-inventory-filters';
const RECENT_SEARCHES_KEY = 'cardledger-recent-searches';
const MAX_RECENT_SEARCHES = 10;

// Helper to detect TCG type from item data
const detectTCG = (item: InventoryItem): TCGType => {
  const name = item.name.toLowerCase();
  const setName = item.set_name.toLowerCase();
  const category = (item.category || '').toLowerCase();
  
  // Check for sports first (most specific)
  if ((item as any).sport || category === 'sports') return 'sports';
  
  // Pokemon detection
  if (setName.includes('pokemon') || name.includes('pokemon') || 
      setName.includes('paldea') || setName.includes('sv') || 
      setName.includes('swsh') || setName.includes('xy') ||
      setName.includes('scarlet') || setName.includes('violet') ||
      setName.includes('obsidian') || setName.includes('paradox')) return 'pokemon';
  
  // MTG detection
  if (setName.includes('mtg') || setName.includes('magic') || 
      name.includes('magic:') || setName.includes('dominaria') ||
      setName.includes('innistrad') || setName.includes('zendikar')) return 'mtg';
  
  // Yu-Gi-Oh detection
  if (setName.includes('yugioh') || setName.includes('yu-gi-oh') ||
      name.includes('yugioh') || name.includes('yu-gi-oh')) return 'yugioh';
  
  // One Piece detection
  if (setName.includes('one piece') || name.includes('one piece') ||
      setName.includes('op-') || setName.includes('op0')) return 'onepiece';
  
  return 'other';
};

// Map condition strings to filter values
const mapCondition = (condition: string | null): ConditionFilter => {
  if (!condition) return 'all';
  const c = condition.toLowerCase();
  if (c === 'mint') return 'mint';
  if (c === 'near-mint' || c === 'near mint' || c === 'nm') return 'near-mint';
  if (c.includes('excellent') || c === 'lightly-played' || c === 'lp') return 'excellent';
  if (c.includes('good') || c === 'moderately-played' || c === 'mp') return 'good';
  if (c.includes('poor') || c === 'heavily-played' || c === 'damaged' || c === 'hp') return 'poor';
  return 'all';
};

// Calculate profit/loss for an item
const calculatePnL = (item: InventoryItem) => {
  const marketPrice = item.market_price;
  const purchasePrice = item.purchase_price;
  
  if (!marketPrice || !purchasePrice || purchasePrice === 0) {
    return { gain: 0, roi: 0, isBreakEven: true, hasData: false };
  }

  const gain = marketPrice - purchasePrice;
  const roi = (gain / purchasePrice) * 100;
  const isBreakEven = Math.abs(roi) < 1; // Less than 1% is break-even

  return { gain, roi, isBreakEven, hasData: true };
};

export const useInventoryFilters = (items: InventoryItem[]) => {
  const [filters, setFilters] = useState<InventoryFilters>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_FILTERS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load filters from localStorage:', e);
    }
    return DEFAULT_FILTERS;
  });

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load recent searches:', e);
    }
    return [];
  });

  // Extract unique sets from items for the set filter
  const availableSets = useMemo(() => {
    const sets = new Map<string, number>();
    items.forEach(item => {
      if (item.set_name) {
        sets.set(item.set_name, (sets.get(item.set_name) || 0) + 1);
      }
    });
    return Array.from(sets.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [items]);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      console.warn('Failed to save filters to localStorage:', e);
    }
  }, [filters]);

  // Persist recent searches
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    } catch (e) {
      console.warn('Failed to save recent searches:', e);
    }
  }, [recentSearches]);

  const updateFilter = useCallback(<K extends keyof InventoryFilters>(
    key: K,
    value: InventoryFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(prev => ({
      ...DEFAULT_FILTERS,
      viewMode: prev.viewMode, // Preserve view mode preference
    }));
  }, []);

  const addRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches(prev => prev.filter(s => s !== term));
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.tcg !== 'all') count++;
    if (filters.grade !== 'all') count++;
    if (filters.valueRange !== 'all') count++;
    if (filters.condition !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.sport !== 'all') count++;
    if (filters.gradedOnly) count++;
    if (filters.profitFilter !== 'all') count++;
    if (filters.setFilter !== 'all') count++;
    if (filters.priceMin !== null || filters.priceMax !== null) count++;
    return count;
  }, [filters]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter(item => {
      // Always filter out 0 quantity
      if (item.quantity === 0) return false;

      // Search term filter
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(search) ||
          item.set_name.toLowerCase().includes(search) ||
          (item.category && item.category.toLowerCase().includes(search)) ||
          ((item as any).player && (item as any).player.toLowerCase().includes(search)) ||
          ((item as any).team && (item as any).team.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Graded only toggle (quick filter)
      if (filters.gradedOnly) {
        if (item.grading_company === 'raw' || !item.grade) return false;
      }

      // Category filter (raw/graded/sealed)
      if (filters.category !== 'all') {
        if (filters.category === 'raw') {
          if (item.grading_company !== 'raw' || item.category?.toLowerCase() === 'sealed') return false;
        } else if (filters.category === 'graded') {
          if (item.grading_company === 'raw' || item.category?.toLowerCase() === 'sealed') return false;
        } else if (filters.category === 'sealed') {
          if (item.category?.toLowerCase() !== 'sealed') return false;
        }
      }

      // TCG filter
      if (filters.tcg !== 'all') {
        const itemTCG = detectTCG(item);
        if (itemTCG !== filters.tcg) return false;
      }

      // Grade filter (grading company)
      if (filters.grade !== 'all') {
        if (filters.grade === 'raw') {
          if (item.grading_company !== 'raw') return false;
        } else {
          if (item.grading_company !== filters.grade) return false;
        }
      }

      // Set filter
      if (filters.setFilter !== 'all') {
        if (item.set_name !== filters.setFilter) return false;
      }

      // Value range filter (preset or custom)
      const price = item.market_price || item.purchase_price;
      if (filters.valueRange !== 'all' && filters.valueRange !== 'custom') {
        switch (filters.valueRange) {
          case 'under10': if (price >= 10) return false; break;
          case '10to50': if (price < 10 || price >= 50) return false; break;
          case '50to100': if (price < 50 || price >= 100) return false; break;
          case '100to500': if (price < 100 || price >= 500) return false; break;
          case 'over500': if (price < 500) return false; break;
        }
      }

      // Custom price range (slider)
      if (filters.priceMin !== null && price < filters.priceMin) return false;
      if (filters.priceMax !== null && price > filters.priceMax) return false;

      // Profit/Loss filter
      if (filters.profitFilter !== 'all') {
        const pnl = calculatePnL(item);
        if (!pnl.hasData) {
          // No market data - only show in 'all' or 'break-even'
          if (filters.profitFilter !== 'break-even') return false;
        } else {
          if (filters.profitFilter === 'profitable' && pnl.gain <= 0) return false;
          if (filters.profitFilter === 'losing' && pnl.gain >= 0) return false;
          if (filters.profitFilter === 'break-even' && !pnl.isBreakEven) return false;
        }
      }

      // Condition filter
      if (filters.condition !== 'all') {
        const itemCondition = mapCondition(item.condition || item.raw_condition);
        // For graded cards, infer condition from grade
        if (item.grading_company !== 'raw' && item.grade) {
          const grade = parseFloat(item.grade);
          const gradeCondition: ConditionFilter = 
            grade >= 9.5 ? 'mint' :
            grade >= 8 ? 'near-mint' :
            grade >= 6 ? 'excellent' :
            grade >= 4 ? 'good' : 'poor';
          if (gradeCondition !== filters.condition) return false;
        } else if (itemCondition !== 'all' && itemCondition !== filters.condition) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const createdAt = new Date(item.created_at);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        switch (filters.dateRange) {
          case '7days': if (diffDays > 7) return false; break;
          case '30days': if (diffDays > 30) return false; break;
          case '90days': if (diffDays > 90) return false; break;
        }
      }

      // Sport filter (for sports cards)
      if (filters.sport !== 'all') {
        if ((item as any).sport !== filters.sport) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      const priceA = a.market_price || a.purchase_price;
      const priceB = b.market_price || b.purchase_price;
      const profitA = (a.market_price || a.purchase_price) - a.purchase_price;
      const profitB = (b.market_price || b.purchase_price) - b.purchase_price;
      const roiA = a.purchase_price > 0 ? (profitA / a.purchase_price) * 100 : 0;
      const roiB = b.purchase_price > 0 ? (profitB / b.purchase_price) * 100 : 0;

      switch (filters.sortBy) {
        case 'value-desc':
          return priceB - priceA;
        case 'value-asc':
          return priceA - priceB;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'profit-desc':
          return profitB - profitA;
        case 'profit-asc':
          return profitA - profitB;
        case 'roi-desc':
          return roiB - roiA;
        case 'roi-asc':
          return roiA - roiB;
        default:
          return 0;
      }
    });

    return result;
  }, [items, filters]);

  // Get min/max prices for slider range
  const priceRange = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 1000 };
    const prices = items.map(item => item.market_price || item.purchase_price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [items]);

  return {
    filters,
    updateFilter,
    resetFilters,
    activeFilterCount,
    filteredItems: filteredAndSortedItems,
    totalItems: items.length,
    resultCount: filteredAndSortedItems.length,
    availableSets,
    priceRange,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
};
