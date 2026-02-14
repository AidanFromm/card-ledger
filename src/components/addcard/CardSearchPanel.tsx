import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Clock, 
  TrendingUp, 
  X, 
  Filter,
  Loader2,
  ImageOff,
  DollarSign,
  Tag,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { 
  searchCards, 
  getSets,
  type CardSearchResult,
  type PokemonTcgSet,
} from "@/lib/pokemonTcgApi";
import { formatPrice, formatVariant } from "@/hooks/usePokemonTcgApi";

// Re-export for backwards compatibility
export type { CardSearchResult };

// Popular cards for suggestions
const POPULAR_CARDS = [
  "Charizard",
  "Pikachu",
  "Mew",
  "Mewtwo",
  "Lugia",
  "Umbreon",
  "Rayquaza",
  "Gengar",
];

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "pokemon", label: "Pokémon TCG" },
  { value: "sports", label: "Sports Cards" },
  { value: "mtg", label: "Magic: The Gathering" },
  { value: "yugioh", label: "Yu-Gi-Oh!" },
  { value: "other", label: "Other" },
];

interface CardSearchPanelProps {
  onSelectCard: (card: CardSearchResult) => void;
  category?: string;
  onCategoryChange?: (category: string) => void;
}

export const CardSearchPanel = ({
  onSelectCard,
  category = "all",
  onCategoryChange,
}: CardSearchPanelProps) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CardSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced filters
  const [selectedSet, setSelectedSet] = useState<string>("");
  const [selectedRarity, setSelectedRarity] = useState<string>("");
  const [sets, setSets] = useState<PokemonTcgSet[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

  // Load sets for filter dropdown
  useEffect(() => {
    let cancelled = false;
    
    async function loadSets() {
      setLoadingSets(true);
      try {
        const result = await getSets();
        if (!cancelled) {
          setSets(result.sets);
        }
      } catch (err) {
        console.warn('Failed to load sets:', err);
      } finally {
        if (!cancelled) {
          setLoadingSets(false);
        }
      }
    }
    
    loadSets();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search using the new API
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    setError(null);
    
    try {
      const result = await searchCards(searchQuery, {
        set: selectedSet || undefined,
        rarity: selectedRarity || undefined,
        pageSize: 25,
      });
      
      setResults(result.cards);
      setTotalCount(result.totalCount);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Search error:", err);
        setError("Failed to search. Please try again.");
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [selectedSet, selectedRarity]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleSelectCard = (card: CardSearchResult) => {
    addSearch(card.name);
    onSelectCard(card);
    setShowDropdown(false);
  };

  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    addSearch(term);
    setShowDropdown(true);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setTotalCount(0);
    inputRef.current?.focus();
  };

  const handleImageError = (cardId: string) => {
    setFailedImages(prev => new Set(prev).add(cardId));
  };

  const handleClearFilters = () => {
    setSelectedSet("");
    setSelectedRarity("");
  };

  // Filter recent searches based on query
  const filteredRecent = recentSearches.filter(
    s => s.query.toLowerCase().includes(query.toLowerCase())
  );

  // Show dropdown content
  const hasContent = query.length > 0 || filteredRecent.length > 0;
  const hasActiveFilters = selectedSet || selectedRarity;

  // Common rarities for quick filter
  const commonRarities = [
    "Common",
    "Uncommon", 
    "Rare",
    "Rare Holo",
    "Rare Holo V",
    "Rare Ultra",
    "Rare Rainbow",
    "Rare Secret",
    "Special Art Rare",
    "Illustration Rare",
  ];

  return (
    <div ref={containerRef} className="relative space-y-4">
      {/* Category & Filters Row */}
      <div className="flex gap-2 flex-wrap">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Popover */}
        {category === "all" || category === "pokemon" ? (
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button 
                variant={hasActiveFilters ? "default" : "outline"} 
                size="sm"
                className="gap-2"
              >
                <Tag className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {(selectedSet ? 1 : 0) + (selectedRarity ? 1 : 0)}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Set</label>
                  <Select value={selectedSet} onValueChange={setSelectedSet}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingSets ? "Loading..." : "Any set"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="">Any set</SelectItem>
                      {sets.map(set => (
                        <SelectItem key={set.id} value={set.name}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={set.images.symbol} 
                              alt="" 
                              className="w-4 h-4 object-contain"
                              onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                            <span className="truncate">{set.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rarity</label>
                  <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any rarity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any rarity</SelectItem>
                      {commonRarities.map(rarity => (
                        <SelectItem key={rarity} value={rarity}>
                          {rarity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="flex gap-1 items-center">
            {selectedSet && (
              <Badge variant="secondary" className="gap-1">
                {selectedSet}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedSet("")}
                />
              </Badge>
            )}
            {selectedRarity && (
              <Badge variant="secondary" className="gap-1">
                {selectedRarity}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedRarity("")}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by card name, set, or number..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          className="pl-12 pr-12 h-12 text-base rounded-xl bg-secondary/30 border-border/50 focus:border-primary/50"
        />
        <AnimatePresence>
          {(query || isSearching) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <button
                  onClick={handleClear}
                  className="p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results count */}
      {query.length >= 2 && !isSearching && results.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {results.length} of {totalCount} results
        </p>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && hasContent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-2 bg-card border border-border/50 rounded-xl shadow-xl z-50 max-h-[60vh] overflow-y-auto"
          >
            {/* Error Message */}
            {error && (
              <div className="p-4 text-center text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Recent Searches */}
            {filteredRecent.length > 0 && !results.length && !error && (
              <div className="p-3 border-b border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </span>
                  <button
                    onClick={clearSearches}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredRecent.slice(0, 5).map(search => (
                    <Badge
                      key={search.query}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleSelectSuggestion(search.query)}
                    >
                      {search.query}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearch(search.query);
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Suggestions (when no query) */}
            {!query && !results.length && !error && (
              <div className="p-3">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3 w-3" />
                  Popular Cards
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CARDS.map(card => (
                    <Badge
                      key={card}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleSelectSuggestion(card)}
                    >
                      {card}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="divide-y divide-border/30">
                {results.map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handleSelectCard(card)}
                    className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer transition-colors"
                  >
                    {/* Card Image */}
                    <div className="w-12 h-16 rounded-md overflow-hidden bg-secondary/50 flex-shrink-0 relative">
                      {card.image_url && !failedImages.has(card.id) ? (
                        <img
                          src={card.image_url}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => handleImageError(card.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {card.name}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {card.set_symbol && (
                          <img 
                            src={card.set_symbol} 
                            alt="" 
                            className="w-4 h-4 object-contain"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        )}
                        <span className="truncate">
                          {card.set_name}
                          {card.number && ` · #${card.number}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {card.rarity && (
                          <Badge variant="outline" className="text-xs py-0">
                            {card.rarity}
                          </Badge>
                        )}
                        {card.prices?.variant && (
                          <Badge variant="secondary" className="text-xs py-0">
                            {formatVariant(card.prices.variant)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      {card.prices ? (
                        <>
                          <p className="font-semibold text-primary flex items-center gap-1 justify-end">
                            <DollarSign className="h-3 w-3" />
                            {card.prices.market?.toFixed(2) || 'N/A'}
                          </p>
                          {card.prices.low && card.prices.high && (
                            <p className="text-xs text-muted-foreground">
                              ${card.prices.low.toFixed(2)} - ${card.prices.high.toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">TCGplayer</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No price</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Results */}
            {query.length >= 2 && !isSearching && results.length === 0 && !error && (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No cards found for "{query}"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different search or use manual entry
                </p>
                {hasActiveFilters && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={handleClearFilters}
                    className="mt-2"
                  >
                    Clear filters and try again
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardSearchPanel;
