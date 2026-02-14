/**
 * Smart Card Search Component
 * 
 * Premium search experience with:
 * - Fuzzy/typo-tolerant search
 * - Instant suggestions
 * - Keyboard navigation
 * - Match highlighting
 * - Multi-source results
 * - Query parsing indicators
 */

import { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Loader2,
  Clock,
  TrendingUp,
  Sparkles,
  Tag,
  Hash,
  Calendar,
  ImageOff,
  DollarSign,
  ChevronRight,
  Filter,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useSmartSearch,
  useSearchKeyboard,
  type SmartSearchResult,
  type CardCategory,
} from '@/hooks/useSmartSearch';
import { type HighlightedMatch } from '@/lib/smartSearch';

// ============================================
// Props
// ============================================

interface SmartCardSearchProps {
  onSelectCard: (card: SmartSearchResult) => void;
  category?: CardCategory;
  onCategoryChange?: (category: CardCategory) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

// ============================================
// Highlighted Text Component
// ============================================

const HighlightedText = ({ parts }: { parts?: HighlightedMatch[] }) => {
  if (!parts || parts.length === 0) {
    return null;
  }
  
  return (
    <>
      {parts.map((part, i) => (
        part.highlighted ? (
          <mark
            key={i}
            className="bg-primary/30 text-foreground rounded-sm px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      ))}
    </>
  );
};

// ============================================
// Category Badges
// ============================================

const CATEGORY_CONFIG: Record<CardCategory, { label: string; color: string; icon?: string }> = {
  all: { label: 'All', color: 'bg-muted' },
  pokemon: { label: 'Pokémon', color: 'bg-yellow-500/20 text-yellow-500', icon: '⚡' },
  mtg: { label: 'MTG', color: 'bg-purple-500/20 text-purple-500', icon: '🔮' },
  yugioh: { label: 'Yu-Gi-Oh!', color: 'bg-orange-500/20 text-orange-500', icon: '🃏' },
  lorcana: { label: 'Lorcana', color: 'bg-blue-500/20 text-blue-500', icon: '✨' },
  onepiece: { label: 'One Piece', color: 'bg-red-500/20 text-red-500', icon: '🏴‍☠️' },
  digimon: { label: 'Digimon', color: 'bg-cyan-500/20 text-cyan-500', icon: '🦖' },
  sports: { label: 'Sports', color: 'bg-green-500/20 text-green-500', icon: '🏀' },
};

// ============================================
// Main Component
// ============================================

export const SmartCardSearch = forwardRef<HTMLInputElement, SmartCardSearchProps>(({
  onSelectCard,
  category = 'all',
  onCategoryChange,
  placeholder = 'Search cards (e.g., "Charizard ex SV" or "#25/102")...',
  autoFocus = false,
  className,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Smart search hook
  const {
    query,
    setQuery,
    results,
    suggestions,
    loading,
    error,
    parsedQuery,
    selectedIndex,
    setSelectedIndex,
    selectResult,
    clear,
    totalCount,
    searchTime,
  } = useSmartSearch({ category });
  
  // Handle card selection
  const handleSelect = useCallback((result: SmartSearchResult) => {
    onSelectCard(result);
    setIsOpen(false);
    clear();
  }, [onSelectCard, clear]);
  
  // Keyboard navigation
  const handleKeyDown = useSearchKeyboard(
    results,
    selectedIndex,
    setSelectedIndex,
    handleSelect,
    () => setIsOpen(false)
  );
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-result-item]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);
  
  // Image error handler
  const handleImageError = (id: string) => {
    setFailedImages(prev => new Set(prev).add(id));
  };
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };
  
  // Handle clear
  const handleClear = () => {
    clear();
    inputRef.current?.focus();
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    setIsOpen(true);
    inputRef.current?.focus();
  };
  
  // Has content to show in dropdown
  const hasContent = query.length > 0 || suggestions.length > 0;
  
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          )}
        </div>
        
        <Input
          ref={(node) => {
            (inputRef as any).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-12 pr-12 h-14 text-lg rounded-2xl bg-secondary/30 border-border/50 
                     focus:border-primary/50 focus:ring-2 focus:ring-primary/20 
                     transition-all duration-200"
        />
        
        {/* Clear button */}
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 
                         rounded-full hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      
      {/* Parsed Query Indicators */}
      <AnimatePresence>
        {parsedQuery && (parsedQuery.setName || parsedQuery.cardNumber || parsedQuery.year) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 mt-2 px-1"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground">Detected:</span>
            
            {parsedQuery.setName && (
              <Badge variant="secondary" className="text-xs py-0 gap-1">
                <Tag className="h-3 w-3" />
                {parsedQuery.setName}
              </Badge>
            )}
            
            {parsedQuery.cardNumber && (
              <Badge variant="secondary" className="text-xs py-0 gap-1">
                <Hash className="h-3 w-3" />
                #{parsedQuery.cardNumber}
              </Badge>
            )}
            
            {parsedQuery.year && (
              <Badge variant="secondary" className="text-xs py-0 gap-1">
                <Calendar className="h-3 w-3" />
                {parsedQuery.year}
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && hasContent && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 
                       bg-card border border-border/50 rounded-2xl shadow-2xl 
                       z-50 overflow-hidden max-h-[70vh]"
          >
            {/* Error */}
            {error && (
              <div className="p-4 text-center text-destructive text-sm">
                {error}
              </div>
            )}
            
            {/* Suggestions (when no query or no results) */}
            {(!query || (query.length > 0 && results.length === 0 && !loading)) && suggestions.length > 0 && (
              <div className="p-3 border-b border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  {query ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Suggestions
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Recent & Popular
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <Badge
                      key={`${s.type}-${s.text}-${i}`}
                      variant={s.type === 'recent' ? 'secondary' : 'outline'}
                      className="cursor-pointer hover:bg-primary/20 transition-colors gap-1"
                      onClick={() => handleSuggestionClick(s.text)}
                    >
                      {s.type === 'recent' && <Clock className="h-3 w-3" />}
                      {s.type === 'popular' && <TrendingUp className="h-3 w-3" />}
                      {s.text}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Results */}
            {results.length > 0 && (
              <>
                {/* Results header */}
                <div className="px-4 py-2 bg-secondary/30 border-b border-border/30 
                              flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {results.length} of {totalCount} results
                    {searchTime > 0 && (
                      <span className="ml-2 opacity-50">
                        ({Math.round(searchTime)}ms)
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3 text-primary" />
                    <span>Press ↑↓ to navigate, Enter to select</span>
                  </div>
                </div>
                
                {/* Results list */}
                <div ref={resultsRef} className="overflow-y-auto max-h-[50vh] divide-y divide-border/30">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      data-result-item
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelect(result)}
                      className={cn(
                        'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                        selectedIndex === index
                          ? 'bg-primary/10'
                          : 'hover:bg-secondary/50'
                      )}
                    >
                      {/* Card Image */}
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-secondary/50 
                                    flex-shrink-0 relative shadow-sm">
                        {result.imageUrl && !failedImages.has(result.id) ? (
                          <img
                            src={result.imageUrl}
                            alt={result.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => handleImageError(result.id)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Category indicator */}
                        {result.category && result.category !== 'pokemon' && (
                          <div className={cn(
                            'absolute bottom-0 left-0 right-0 text-center text-[10px] py-0.5',
                            CATEGORY_CONFIG[result.category]?.color || 'bg-muted'
                          )}>
                            {CATEGORY_CONFIG[result.category]?.icon}
                          </div>
                        )}
                      </div>
                      
                      {/* Card Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {result.nameHighlight ? (
                            <HighlightedText parts={result.nameHighlight} />
                          ) : (
                            result.name
                          )}
                        </p>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span className="truncate">
                            {result.setName}
                            {result.number && ` · #${result.number}`}
                          </span>
                        </div>
                        
                        {/* Badges */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {result.rarity && (
                            <Badge variant="outline" className="text-xs py-0 h-5">
                              {result.rarity}
                            </Badge>
                          )}
                          
                          {result.priceVariant && (
                            <Badge variant="secondary" className="text-xs py-0 h-5">
                              {result.priceVariant}
                            </Badge>
                          )}
                          
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs py-0 h-5',
                              result.source === 'justtcg' ? 'border-primary/50' : ''
                            )}
                          >
                            {result.source === 'justtcg' ? 'JustTCG' : 'TCGplayer'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        {result.price ? (
                          <>
                            <p className="font-bold text-primary flex items-center gap-1 justify-end">
                              <DollarSign className="h-4 w-4" />
                              {result.price.toFixed(2)}
                            </p>
                            {result.priceLow && result.priceHigh && (
                              <p className="text-xs text-muted-foreground">
                                ${result.priceLow.toFixed(2)} - ${result.priceHigh.toFixed(2)}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No price</p>
                        )}
                      </div>
                      
                      {/* Arrow indicator for selected */}
                      {selectedIndex === index && (
                        <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
            
            {/* Loading state */}
            {loading && results.length === 0 && (
              <div className="p-8 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Searching across all sources...
                </p>
              </div>
            )}
            
            {/* No results */}
            {!loading && query.length >= 2 && results.length === 0 && !error && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  No cards found for "<span className="text-foreground">{query}</span>"
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different search or check your spelling
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SmartCardSearch.displayName = 'SmartCardSearch';

export default SmartCardSearch;
