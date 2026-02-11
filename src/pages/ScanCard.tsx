import { useState, useRef, useEffect, useMemo } from "react";
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
  Trash2
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
import { PortfolioPreview } from "@/components/PortfolioPreview";

// Filter types
type CategoryFilter = "all" | "raw" | "sealed";

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentSearchRef = useRef<string>("");
  const { items: watchlistItems, removeFromWatchlist } = useWatchlist();
  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [setFilter, setSetFilter] = useState<string>("all");

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

  // Filter search results
  const filteredResults = useMemo(() => {
    return searchResults.filter(product => {
      const productCategory = product.category?.toLowerCase() || "raw";

      // Category filter (Raw vs Sealed)
      if (categoryFilter !== "all") {
        if (categoryFilter === "sealed" && productCategory !== "sealed") return false;
        if (categoryFilter === "raw" && productCategory === "sealed") return false;
      }

      // Set filter
      if (setFilter !== "all" && product.set_name !== setFilter) return false;

      return true;
    });
  }, [searchResults, categoryFilter, setFilter]);

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter("all");
    setSetFilter("all");
  };

  const hasActiveFilters = categoryFilter !== "all" || setFilter !== "all";

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

    // Stage 2: Full API search after 500ms debounce
    setIsSearching(true);
    const queryForApi = trimmedQuery;

    const debounceTimer = setTimeout(async () => {
      // Check if query is still current before making API call
      if (currentSearchRef.current !== queryForApi) {
        setIsSearching(false);
        return;
      }

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

        // Save to recent searches when we get API results
        if (products.length > 0) {
          addSearch(queryForApi);
        }
      } catch (error: any) {
        console.error('API search error:', error);
        // Only fall back to local results if this is still the current search
        if (currentSearchRef.current === queryForApi) {
          // Keep whatever results we have
        }
      } finally {
        if (currentSearchRef.current === queryForApi) {
          setIsSearching(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, addSearch]);

  // Handle recent search selection
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
    // Don't refocus - it triggers onFocus which shows recent searches again
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

  const hasResults = filteredResults.length > 0;
  const showWelcome = searchResults.length === 0 && !searchQuery;

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
                  onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                  className="search-hero-input pl-14"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {(isSearching || isLocalSearching) && (
                  <div className="absolute right-5 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {isLocalSearching && !isSearching ? 'Quick search...' : 'Searching...'}
                    </span>
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

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

            {/* Search hint */}
            {showWelcome && !showRecentSearches && (
              <p className="text-xs text-muted-foreground mt-3 ml-1">
                Try: "Charizard ex", "Stellar Crown #199", "Elite Trainer Box"
              </p>
            )}

            {/* Filter Chips - show when there are search results */}
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 space-y-3"
              >
                {/* Filter row with horizontal scroll */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {/* Category Filter (Cards vs Sealed) */}
                  <div className="flex-shrink-0">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                      className={`h-9 px-3 pr-8 rounded-xl text-sm font-medium border transition-all appearance-none bg-no-repeat bg-right cursor-pointer ${
                        categoryFilter !== "all"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                      }`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${categoryFilter !== "all" ? "white" : "%236b7280"}' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 8px center" }}
                    >
                      <option value="all">All Types</option>
                      <option value="raw">Cards</option>
                      <option value="sealed">Sealed Products</option>
                    </select>
                  </div>

                  {/* Set Filter (Dynamic) */}
                  {availableSets.length > 1 && (
                    <div className="flex-shrink-0">
                      <select
                        value={setFilter}
                        onChange={(e) => setSetFilter(e.target.value)}
                        className={`h-9 px-3 pr-8 rounded-xl text-sm font-medium border transition-all appearance-none bg-no-repeat bg-right cursor-pointer max-w-[180px] truncate ${
                          setFilter !== "all"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                        }`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${setFilter !== "all" ? "white" : "%236b7280"}' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 8px center" }}
                      >
                        <option value="all">All Sets</option>
                        {availableSets.map(set => (
                          <option key={set} value={set}>{set}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex-shrink-0 h-9 px-3 rounded-xl text-sm font-medium bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-all flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter summary */}
                {hasActiveFilters && (
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredResults.length} of {searchResults.length} results
                  </p>
                )}
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

          {/* Search Results */}
          <AnimatePresence mode="wait">
            {hasResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{filteredResults.length}</span> {filteredResults.length === 1 ? 'item' : 'items'}
                    {hasActiveFilters && ` (filtered from ${searchResults.length})`}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      clearFilters();
                    }}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredResults.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Results State */}
          {searchQuery && !hasResults && !isSearching && (
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
                  : "No results found"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters && searchResults.length > 0
                  ? "Try adjusting your filters or clear them to see all results"
                  : "Try different keywords or check spelling"}
              </p>
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

      <BottomNav />
    </div>
  );
};

export default ScanCard;
