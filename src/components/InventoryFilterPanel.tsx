import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Filter, X, ChevronDown, ChevronUp, 
  Grid3x3, List, SortAsc, SortDesc,
  Package, Award, Box, RotateCcw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import type {
  InventoryFilters,
  TCGType,
  GradeFilter,
  ValueRange,
  ConditionFilter,
  DateRangeFilter,
  SortOption,
  ViewMode,
  CategoryFilter,
} from "@/hooks/useInventoryFilters";

interface InventoryFilterPanelProps {
  filters: InventoryFilters;
  onFilterChange: <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => void;
  onReset: () => void;
  activeFilterCount: number;
  resultCount: number;
  totalCount: number;
  hasSportsCards?: boolean;
}

const TCG_OPTIONS: { value: TCGType; label: string }[] = [
  { value: 'all', label: 'All TCGs' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'mtg', label: 'Magic: The Gathering' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'sports', label: 'Sports Cards' },
  { value: 'onepiece', label: 'One Piece' },
  { value: 'other', label: 'Other' },
];

const GRADE_OPTIONS: { value: GradeFilter; label: string }[] = [
  { value: 'all', label: 'All Grades' },
  { value: 'raw', label: 'Raw Only' },
  { value: 'psa', label: 'PSA' },
  { value: 'bgs', label: 'BGS' },
  { value: 'cgc', label: 'CGC' },
  { value: 'sgc', label: 'SGC' },
];

const VALUE_OPTIONS: { value: ValueRange; label: string }[] = [
  { value: 'all', label: 'Any Value' },
  { value: 'under10', label: 'Under $10' },
  { value: '10to50', label: '$10 - $50' },
  { value: '50to100', label: '$50 - $100' },
  { value: '100to500', label: '$100 - $500' },
  { value: 'over500', label: '$500+' },
];

const CONDITION_OPTIONS: { value: ConditionFilter; label: string }[] = [
  { value: 'all', label: 'Any Condition' },
  { value: 'mint', label: 'Mint' },
  { value: 'near-mint', label: 'Near Mint' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'poor', label: 'Poor' },
];

const DATE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'value-desc', label: 'Value: High to Low' },
  { value: 'value-asc', label: 'Value: Low to High' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'profit-desc', label: 'Profit: High to Low' },
  { value: 'profit-asc', label: 'Profit: Low to High' },
];

const SPORT_OPTIONS = [
  { value: 'all', label: 'All Sports' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'football', label: 'Football' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'soccer', label: 'Soccer' },
];

export const InventoryFilterPanel = ({
  filters,
  onFilterChange,
  onReset,
  activeFilterCount,
  resultCount,
  totalCount,
  hasSportsCards = false,
}: InventoryFilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Results Count & Controls Row */}
      <div className="flex items-center justify-between gap-3">
        <motion.div
          key={resultCount}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground"
        >
          <span className="font-semibold text-foreground">{resultCount.toLocaleString()}</span>
          {resultCount !== totalCount && (
            <span> of {totalCount.toLocaleString()}</span>
          )}
          {' '}{resultCount === 1 ? 'card' : 'cards'}
        </motion.div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-xl bg-secondary/50 p-1">
            <button
              onClick={() => onFilterChange('viewMode', 'grid')}
              className={`p-2 rounded-lg transition-all ${
                filters.viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onFilterChange('viewMode', 'list')}
              className={`p-2 rounded-lg transition-all ${
                filters.viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <Select
            value={filters.sortBy}
            onValueChange={(v) => onFilterChange('sortBy', v as SortOption)}
          >
            <SelectTrigger className="w-[140px] h-9 rounded-xl bg-secondary/50 border-0 text-xs">
              <SortDesc className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {SORT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 px-3 rounded-xl gap-1.5 relative ${
                  activeFilterCount > 0 ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter & Sort
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {/* TCG / Game */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Game / TCG</label>
                  <div className="flex flex-wrap gap-2">
                    {TCG_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFilterChange('tcg', opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          filters.tcg === opt.value
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category (Raw/Graded/Sealed) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all' as CategoryFilter, label: 'All', icon: Grid3x3 },
                      { value: 'raw' as CategoryFilter, label: 'Raw', icon: Package },
                      { value: 'graded' as CategoryFilter, label: 'Graded', icon: Award },
                      { value: 'sealed' as CategoryFilter, label: 'Sealed', icon: Box },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => onFilterChange('category', value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          filters.category === value
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grading Company */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Grading Company</label>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFilterChange('grade', opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          filters.grade === opt.value
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Value Range</label>
                  <div className="flex flex-wrap gap-2">
                    {VALUE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFilterChange('valueRange', opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          filters.valueRange === opt.value
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Condition</label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFilterChange('condition', opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          filters.condition === opt.value
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Added */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Date Added</label>
                  <div className="flex flex-wrap gap-2">
                    {DATE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onFilterChange('dateRange', opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          filters.dateRange === opt.value
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sport Filter (if applicable) */}
                {hasSportsCards && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Sport</label>
                    <div className="flex flex-wrap gap-2">
                      {SPORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => onFilterChange('sport', opt.value)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            filters.sport === opt.value
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="mt-8 flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={onReset}
                  className="flex-1 gap-2"
                  disabled={activeFilterCount === 0}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset All
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Apply ({resultCount})
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {filters.tcg !== 'all' && (
              <FilterChip
                label={TCG_OPTIONS.find(o => o.value === filters.tcg)?.label || ''}
                onRemove={() => onFilterChange('tcg', 'all')}
              />
            )}
            {filters.category !== 'all' && (
              <FilterChip
                label={filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}
                onRemove={() => onFilterChange('category', 'all')}
              />
            )}
            {filters.grade !== 'all' && (
              <FilterChip
                label={GRADE_OPTIONS.find(o => o.value === filters.grade)?.label || ''}
                onRemove={() => onFilterChange('grade', 'all')}
              />
            )}
            {filters.valueRange !== 'all' && (
              <FilterChip
                label={VALUE_OPTIONS.find(o => o.value === filters.valueRange)?.label || ''}
                onRemove={() => onFilterChange('valueRange', 'all')}
              />
            )}
            {filters.condition !== 'all' && (
              <FilterChip
                label={CONDITION_OPTIONS.find(o => o.value === filters.condition)?.label || ''}
                onRemove={() => onFilterChange('condition', 'all')}
              />
            )}
            {filters.dateRange !== 'all' && (
              <FilterChip
                label={DATE_OPTIONS.find(o => o.value === filters.dateRange)?.label || ''}
                onRemove={() => onFilterChange('dateRange', 'all')}
              />
            )}
            {filters.sport !== 'all' && (
              <FilterChip
                label={SPORT_OPTIONS.find(o => o.value === filters.sport)?.label || ''}
                onRemove={() => onFilterChange('sport', 'all')}
              />
            )}
            <button
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
  >
    {label}
    <button
      onClick={onRemove}
      className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
    >
      <X className="h-3 w-3" />
    </button>
  </motion.span>
);

export default InventoryFilterPanel;
