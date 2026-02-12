import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Scan,
  Plus,
  TrendingUp,
  TrendingDown,
  Package,
  ArrowUp,
  Sparkles,
  Image as ImageIcon,
  Eye,
  X,
  Clock,
  Trash2,
  ArrowUpDown,
  ChevronDown,
  Flame,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AddToInventoryDialog } from "@/components/AddToInventoryDialog";
import { PageTransition } from "@/components/PageTransition";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useSearchCache } from "@/hooks/useSearchCache";
import { PortfolioPreview } from "@/components/PortfolioPreview";
import { SkeletonGrid } from "@/components/SkeletonCard";

// Filter types
type CategoryFilter = "all" | "raw" | "sealed";
type TCGFilter = "all" | "pokemon" | "sports" | "onepiece" | "yugioh" | "mtg";
type SortOption = "relevance" | "price_low" | "price_high" | "name_asc";

// Popular searches - trending cards
const POPULAR_SEARCHES = [
  { query: "Charizard", icon: "🔥" },
  { query: "Pikachu VMAX", icon: "⚡" },
  { query: "Mew ex", icon: "✨" },
  { query: "PSA 10", icon: "💎" },
  { query: "Elite Trainer Box", icon: "📦" },
  { query: "Lugia", icon: "🌊" },
  { query: "Eevee", icon: "🦊" },
  { query: "Gengar", icon: "👻" },
];

// TCG type chips
const TCG_FILTERS: { value: TCGFilter; label: string; icon?: string }[] = [
  { value: "all", label: "All" },
  { value: "pokemon", label: "Pokémon", icon: "⚡" },
  { value: "sports", label: "Sports", icon: "🏀" },
  { value: "onepiece", label: "One Piece", icon: "🏴‍☠️" },
  { value: "yugioh", label: "Yu-Gi-Oh!", icon: "🎴" },
  { value: "mtg", label: "MTG", icon: "🧙" },
];

// Sort options
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
  { value: "name_asc", label: "Name: A → Z" },
];

const ITEMS_PER_PAGE = 20;

const ScanCard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [localResults, setLocalResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocalSearching, setIsLocalSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentSearchRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const { items: watchlistItems, removeFromWatchlist } = useWatchlist();
  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();
  const { getCached, setCache } = useSearchCache();

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [tcgFilter, setTcgFilter] = useState<TCGFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const [setFilter, setSetFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  // Get unique sets from search results for dynamic filter
  const availableSets = useMemo(() => {
    const sets = new Set<string>();
    searchResults.forEach(product => {
      if (product.set_name) {
        sets.add(product.set_name);
      }
    });
    return Array.from(sets).sort();
  }, [searchResults]);

  // Generate autocomplete suggestions from results and recent searches
  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const suggestionSet = new Set<string>();
    
    // Add from recent searches
    recentSearches.forEach(s => {
      if (s.query.toLowerCase().includes(query) && s.query.toLowerCase() !== query) {
        suggestionSet.add(s.query);
      }
    });
    
    // Add from current results (product names)
    localResults.slice(0, 10).forEach(product => {
      const name = product.name?.toLowerCase() || "";
      if (name.includes(query) && name !== query) {
        // Extract a reasonable suggestion from the name
        const words = product.name.split(' ').slice(0, 4).join(' ');
        suggestionSet.add(words);
      }
    });
    
    // Add from popular searches
    POPULAR_SEARCHES.forEach(p => {
      if (p.query.toLowerCase().includes(query)) {
        suggestionSet.add(p.query);
      }
    });
    
    return Array.from(suggestionSet).slice(0, 5);
  }, [searchQuery, recentSearches, localResults]);

  // Filter and sort search results
  const filteredResults = useMemo(() => {
    let results = searchResults.filter(product => {
      const productCategory = product.category?.toLowerCase() || "raw";
      const productTcg = product.tcg_type?.toLowerCase() || "pokemon";
      const productPrice = product.market_price || 0;

      // Category filter (Raw vs Sealed)
      if (categoryFilter !== "all") {
        if (categoryFilter === "sealed" && productCategory !== "sealed") return false;
        if (categoryFilter === "raw" && productCategory === "sealed") return false;
      }

      // TCG filter
      if (tcgFilter !== "all" && productTcg !== tcgFilter) return false;

      // Set filter
      if (setFilter !== "all" && product.set_name !== setFilter) return false;

      // Price range filter
      if (priceRange[0] > 0 || priceRange[1] < 10000) {
        if (productPrice < priceRange[0] || productPrice > priceRange[1]) return false;
      }

      return true;
    });

    // Sort results
    switch (sortOption) {
      case "price_low":
        results = [...results].sort((a, b) => (a.market_price || 0) - (b.market_price || 0));
        break;
      case "price_high":
        results = [...results].sort((a, b) => (b.market_price || 0) - (a.market_price || 0));
        break;
      case "name_asc":
        results = [...results].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      // relevance - keep original order from API
    }

    return results;
  }, [searchResults, categoryFilter, tcgFilter, setFilter, sortOption, priceRange]);

  // Paginated results for display
  const displayedResults = useMemo(() => {
    return filteredResults.slice(0, displayCount);
  }, [filteredResults, displayCount]);

  const hasMoreResults = displayCount < filteredResults.length;

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter("all");
    setTcgFilter("all");
    setSetFilter("all");
    setSortOption("relevance");
    setPriceRange([0, 10000]);
  };

  const hasActiveFilters = categoryFilter !== "all" || tcgFilter !== "all" || setFilter !== "all" || sortOption !== "relevance" || priceRange[0] > 0 || priceRange[1] < 10000;

  // Clear search input
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setLocalResults([]);
    setDisplayCount(ITEMS_PER_PAGE);
    clearFilters();
    searchInputRef.current?.focus();
  }, []);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset display count when results change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchResults]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load more results
  const loadMore = useCallback(() => {
    setIsLoadingMore(true);
    // Simulate a small delay for UX
    setTimeout(() => {
      setDisplayCount(prev => prev + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 300);
  }, []);

  // Progressive search: local first (immediate), then API (debounced)
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    // Update the current search ref immediately
    currentSearchRef.current = trimmedQuery;

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setLocalResults([]);
      setIsSearching(false);
      setIsLocalSearching(false);
      setShowSuggestions(false);
      return;
    }

    // Cancel any pending API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    const cached = getCached(trimmedQuery);
    if (cached) {
      setSearchResults(cached);
      setLocalResults(cached);
      setIsSearching(false);
      setIsLocalSearching(false);
      return;
    }

    // Stage 1: Immediate local search from products table
    const doLocalSearch = async () => {
      setIsLocalSearching(true);
      const queryAtStart = trimmedQuery;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${queryAtStart}%,card_number.ilike.%${queryAtStart}%`)
          .limit(20);

        // Only update if this is still the current search
        if (currentSearchRef.current !== queryAtStart) {
          return; // Stale results, ignore
        }

        if (!error && data) {
          setLocalResults(data);
          setSearchResults(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Local search error:', err);
      } finally {
        if (currentSearchRef.current === queryAtStart) {
          setIsLocalSearching(false);
        }
      }
    };

    doLocalSearch();

    // Stage 2: Full API search after 300ms debounce
    setIsSearching(true);
    const queryForApi = trimmedQuery;

    const debounceTimer = setTimeout(async () => {
      // Check if query is still current before making API call
      if (currentSearchRef.current !== queryForApi) {
        setIsSearching(false);
        return;
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const { data, error } = await supabase.functions.invoke('products-search', {
          body: { query: queryForApi }
        });

        // Check again after API returns
        if (currentSearchRef.current !== queryForApi) {
          return; // Stale results, ignore
        }

        if (error) throw error;

        const products = data?.products || [];
        setSearchResults(products);
        setShowSuggestions(false);

        // Cache results
        setCache(queryForApi, products);

        // Save to recent searches when we get API results
        if (products.length > 0) {
          addSearch(queryForApi);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return; // Request was cancelled
        }
        console.error('API search error:', error);
        // Keep whatever results we have
      } finally {
        if (currentSearchRef.current === queryForApi) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, addSearch, getCached, setCache]);

  // Handle recent search selection
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
    setShowSuggestions(false);
  };

  // Handle popular search click
  const handlePopularSearchClick = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleAddToInventory = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const quickActions = [
    {
      icon: Plus,
      label: "Add Manually",
      description: "Enter card details",
      action: () => navigate("/add"),
      color: "bg-primary/15 text-primary",
    },
    {
      icon: Package,
      label: "Inventory",
      description: "View collection",
      action: () => navigate("/inventory"),
      color: "bg-success/15 text-success",
    },
    {
      icon: TrendingUp,
      label: "Analytics",
      description: "Portfolio stats",
      action: () => navigate("/dashboard"),
      color: "bg-chart-4/15 text-chart-4",
    },
  ];

  const hasResults = displayedResults.length > 0;
  const showWelcome = searchResults.length === 0 && !searchQuery;
  const showSkeletons = isSearching && searchResults.length === 0 && searchQuery.length >= 2;

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Hero Search Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {/* Welcome Header - only show when no search */}
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <h1 className="text-3xl font-bold tracking-tight mb-1">Card Ledger</h1>
                <p className="text-muted-foreground">
                  Search, scan, and track your collection
                </p>
              </motion.div>
            )}
            
            {/* Portfolio Preview - Robinhood style summary */}
            {showWelcome && <PortfolioPreview />}

            {/* Hero Search Bar */}
            <div className="search-hero">
              <div className="relative flex items-center">
                <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search cards, sets, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowRecentSearches(true)}
                  onBlur={() => setTimeout(() => {
                    setShowRecentSearches(false);
                    setShowSuggestions(false);
                  }, 200)}
                  className="search-hero-input pl-14 pr-24"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                <div className="absolute right-4 flex items-center gap-2">
                  {/* Loading indicator */}
                  {(isSearching || isLocalSearching) && (
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}
                  {/* Clear button */}
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="h-7 w-7 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Autocomplete Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && searchQuery.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(suggestion);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-secondary/50 transition-colors flex items-center gap-3 border-b border-border/50 last:border-0"
                    >
                      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Searches - show when input focused and empty */}
            <AnimatePresence>
              {showRecentSearches && !searchQuery && recentSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Recent searches
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        clearSearches();
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search.query}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur from firing
                          handleRecentSearchClick(search.query);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm font-medium hover:bg-secondary/80 transition-colors group"
                      >
                        <Search className="h-3 w-3 text-muted-foreground" />
                        {search.query}
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeSearch(search.query);
                          }}
                          className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Popular Searches - show when no search query */}
            {showWelcome && !showRecentSearches && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  Popular searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((search) => (
                    <button
                      key={search.query}
                      onClick={() => handlePopularSearchClick(search.query)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-secondary/50 to-secondary/30 text-sm font-medium hover:from-secondary/80 hover:to-secondary/50 transition-all border border-border/30"
                    >
                      <span>{search.icon}</span>
                      {search.query}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Filter Chips - show when there are search results (STICKY) */}
            {(searchResults.length > 0 || showSkeletons) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/30 mt-4"
              >
                <div className="space-y-3">
                  {/* TCG Type Filter Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {TCG_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setTcgFilter(filter.value)}
                        className={`flex-shrink-0 h-8 px-3 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
                          tcgFilter === filter.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                        }`}
                      >
                        {filter.icon && <span className="text-xs">{filter.icon}</span>}
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {/* Second row: Category, Set, Sort */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {/* Category Filter (Cards vs Sealed) */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                      className={`h-8 px-3 pr-7 rounded-xl text-sm font-medium border transition-all appearance-none bg-no-repeat cursor-pointer ${
                        categoryFilter !== "all"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                      }`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='${categoryFilter !== "all" ? "white" : "%236b7280"}' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 6px center" }}
                    >
                      <option value="all">All Types</option>
                      <option value="raw">Cards</option>
                      <option value="sealed">Sealed</option>
                    </select>

                    {/* Set Filter (Dynamic) */}
                    {availableSets.length > 1 && (
                      <select
                        value={setFilter}
                        onChange={(e) => setSetFilter(e.target.value)}
                        className={`h-8 px-3 pr-7 rounded-xl text-sm font-medium border transition-all appearance-none bg-no-repeat cursor-pointer max-w-[160px] truncate ${
                          setFilter !== "all"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                        }`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='${setFilter !== "all" ? "white" : "%236b7280"}' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 6px center" }}
                      >
                        <option value="all">All Sets</option>
                        {availableSets.map(set => (
                          <option key={set} value={set}>{set}</option>
                        ))}
                      </select>
                    )}

                    {/* Price Range Filter */}
                    <div className="relative">
                      <button
                        onClick={() => setShowPriceFilter(!showPriceFilter)}
                        className={`h-8 px-3 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5 ${
                          priceRange[0] > 0 || priceRange[1] < 10000
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <span className="text-xs">$</span>
                        <span className="hidden sm:inline">Price</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <AnimatePresence>
                        {showPriceFilter && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-30 p-4 min-w-[200px]"
                          >
                            <p className="text-xs text-muted-foreground mb-3">Price Range</p>
                            <div className="space-y-3">
                              {[
                                { label: "Any", min: 0, max: 10000 },
                                { label: "Under $10", min: 0, max: 10 },
                                { label: "$10 - $50", min: 10, max: 50 },
                                { label: "$50 - $100", min: 50, max: 100 },
                                { label: "$100 - $500", min: 100, max: 500 },
                                { label: "$500+", min: 500, max: 10000 },
                              ].map((range) => (
                                <button
                                  key={range.label}
                                  onClick={() => {
                                    setPriceRange([range.min, range.max]);
                                    setShowPriceFilter(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
                                    priceRange[0] === range.min && priceRange[1] === range.max
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "hover:bg-secondary/50"
                                  }`}
                                >
                                  {range.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative ml-auto">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className={`h-8 px-3 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5 ${
                          sortOption !== "relevance"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Sort</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <AnimatePresence>
                        {showSortDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-30 min-w-[180px]"
                          >
                            {SORT_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setSortOption(option.value);
                                  setShowSortDropdown(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                                  sortOption === option.value
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-secondary/50"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="flex-shrink-0 h-8 px-3 rounded-xl text-sm font-medium bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-all flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Quick Actions - only show when no search */}
          <AnimatePresence mode="wait">
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {/* Scanner Options */}
                <div className="grid grid-cols-2 gap-4">
                  {/* AI Scanner Card */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => navigate("/scan/ai")}
                    className="glass-card p-5 text-left relative overflow-hidden tap-scale transition-all hover:scale-[1.02]"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                        <Sparkles className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-1">AI Scanner</h3>
                      <p className="text-sm text-muted-foreground">
                        Identify any card with AI
                      </p>
                    </div>
                  </motion.button>

                  {/* Barcode Scanner Card */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    onClick={() => navigate("/scan/barcode")}
                    className="glass-card p-5 text-left relative overflow-hidden tap-scale transition-all hover:scale-[1.02]"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-3xl" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center mb-4">
                        <Scan className="w-7 h-7 text-success" />
                      </div>
                      <h3 className="font-semibold mb-1">Barcode</h3>
                      <p className="text-sm text-muted-foreground">
                        Scan UPC or PSA cert
                      </p>
                    </div>
                  </motion.button>
                </div>

                {/* Quick Actions Grid */}
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 ml-1">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        onClick={action.action}
                        className="glass-card p-4 text-center tap-scale transition-all hover:scale-[1.02]"
                      >
                        <div className={`w-12 h-12 mx-auto rounded-2xl ${action.color} flex items-center justify-center mb-3`}>
                          <action.icon className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-sm">{action.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Watchlist Section - Grid View */}
                {watchlistItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="flex items-center justify-between mb-3 ml-1">
                      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Watchlist
                        <span className="text-xs text-muted-foreground/70">({watchlistItems.length}/25)</span>
                      </h2>
                    </div>

                    {/* Grid Layout like Inventory */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {watchlistItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + index * 0.03 }}
                          className="glass-card overflow-hidden group cursor-pointer"
                          onClick={() => handleAddToInventory({
                            id: item.id,
                            name: item.product_name,
                            set_name: item.set_name,
                            card_number: item.card_number,
                            image_url: item.image_url,
                            market_price: item.current_price,
                            category: item.category,
                            grading_company: item.grading_company || undefined,
                            grade: item.grade || undefined,
                          })}
                        >
                          {/* Card Image */}
                          <div className="relative aspect-[3/4] bg-secondary/30">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                                <ImageIcon className="h-12 w-12" />
                              </div>
                            )}

                            {/* Remove Button - top right */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromWatchlist(item.id);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>

                            {/* Grading Badge - top left */}
                            {item.grading_company && item.grade && (
                              <div className="absolute top-2 left-2">
                                <span className="ios-badge text-[10px] font-bold uppercase">
                                  {item.grading_company} {item.grade}
                                </span>
                              </div>
                            )}

                            {/* Raw Condition Badge - top left */}
                            {!item.grading_company && item.raw_condition && (
                              <div className="absolute top-2 left-2">
                                <span className="ios-badge-warning text-[10px] font-bold">
                                  {item.raw_condition}
                                </span>
                              </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary/90 px-4 py-2 rounded-xl">
                                View Details
                              </span>
                            </div>
                          </div>

                          {/* Card Details */}
                          <div className="p-3 space-y-2">
                            <div>
                              <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                                {item.product_name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {item.set_name}
                              </p>
                            </div>

                            {/* Price row */}
                            {item.current_price ? (
                              <div className="pt-1.5 border-t border-border/30">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Price</span>
                                  {item.price_change_percent !== null && (
                                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                                      item.price_change_percent > 0 ? 'text-success' : item.price_change_percent < 0 ? 'text-destructive' : 'text-muted-foreground'
                                    }`}>
                                      {item.price_change_percent > 0 ? (
                                        <TrendingUp className="w-3 h-3" />
                                      ) : item.price_change_percent < 0 ? (
                                        <TrendingDown className="w-3 h-3" />
                                      ) : null}
                                      {item.price_change_percent > 0 ? '+' : ''}{item.price_change_percent.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-success">
                                  ${item.current_price.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <div className="pt-1.5 border-t border-border/30">
                                <span className="text-xs text-muted-foreground">No price data</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skeleton Loading State */}
          <AnimatePresence>
            {showSkeletons && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Searching for "{searchQuery}"...
                  </p>
                </div>
                <SkeletonGrid count={6} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Results */}
          <AnimatePresence mode="wait">
            {hasResults && !showSkeletons && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Result count with clear messaging */}
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    <span className="font-semibold text-foreground">{filteredResults.length}</span>
                    <span className="text-muted-foreground">
                      {" "}{filteredResults.length === 1 ? 'card' : 'cards'} matching "
                      <span className="font-medium text-foreground">{searchQuery}</span>"
                    </span>
                    {hasActiveFilters && filteredResults.length !== searchResults.length && (
                      <span className="text-muted-foreground/70">
                        {" "}(filtered from {searchResults.length})
                      </span>
                    )}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {displayedResults.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className="glass-card overflow-hidden group tap-scale cursor-pointer"
                      onClick={() => handleAddToInventory(product)}
                    >
                      {/* Card Image - Clickable to open details */}
                      <div className="relative aspect-[3/4] bg-secondary/30">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                            <ImageIcon className="h-12 w-12" />
                          </div>
                        )}

                        {/* Sealed Badge */}
                        {product.category === 'sealed' && (
                          <div className="absolute top-2 left-2">
                            <span className="ios-badge-success text-[10px] font-bold">
                              SEALED
                            </span>
                          </div>
                        )}

                        {/* Hover overlay with "View Details" */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary/90 px-4 py-2 rounded-xl">
                            View Details
                          </span>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="p-3 space-y-2">
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {product.set_name}
                          </p>
                        </div>

                        {/* Price row */}
                        {product.market_price ? (
                          <div className="pt-1.5 border-t border-border/30">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">Market</span>
                              {/* Price Source Badge */}
                              {product.price_source && (
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  product.price_source === 'pokemon_tcg'
                                    ? 'bg-emerald-500/20 text-emerald-500'
                                    : product.price_source === 'tavily'
                                    ? 'bg-amber-500/20 text-amber-500'
                                    : 'bg-blue-500/20 text-blue-500'
                                }`}>
                                  {product.price_source === 'pokemon_tcg'
                                    ? 'TCGPlayer'
                                    : product.price_source === 'tavily'
                                    ? 'AI Est.'
                                    : product.price_source === 'scrydex'
                                    ? 'Market'
                                    : ''}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-success">
                              ${product.market_price.toFixed(2)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMoreResults && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center pt-4"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="rounded-xl min-w-[200px]"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load more ({filteredResults.length - displayCount} remaining)
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Results State - Enhanced */}
          {searchQuery && !hasResults && !isSearching && !showSkeletons && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">
                {hasActiveFilters && searchResults.length > 0
                  ? "No matches for current filters"
                  : `No results for "${searchQuery}"`}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {hasActiveFilters && searchResults.length > 0
                  ? "Try adjusting your filters or clear them to see all results"
                  : "Try different keywords, check spelling, or search for a set name"}
              </p>
              
              {/* Helpful suggestions */}
              {!hasActiveFilters && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Try one of these popular searches:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {POPULAR_SEARCHES.slice(0, 4).map((search) => (
                      <button
                        key={search.query}
                        onClick={() => handlePopularSearchClick(search.query)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm font-medium hover:bg-secondary/80 transition-colors"
                      >
                        <span>{search.icon}</span>
                        {search.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-center gap-3">
                {hasActiveFilters && searchResults.length > 0 ? (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="rounded-xl"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/add")}
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manually
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </main>
      </PageTransition>

      <AddToInventoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
      />

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 md:bottom-8 right-4 z-40 h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center tap-scale"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdowns */}
      {(showSortDropdown || showPriceFilter) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowSortDropdown(false);
            setShowPriceFilter(false);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default ScanCard;
