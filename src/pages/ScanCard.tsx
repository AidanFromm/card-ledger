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
  Zap,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AddToInventoryDialog } from "@/components/AddToInventoryDialog";
import { PageTransition } from "@/components/PageTransition";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { formatPrice } from "@/lib/priceFormat";

// Filter types
type CategoryFilter = "all" | "raw" | "sealed";
type SearchMode = "inventory" | "pricecheck";

// Skeleton card for loading state
const SearchResultSkeleton = () => (
  <div className="rounded-[20px] overflow-hidden bg-card" style={{ boxShadow: 'var(--shadow-card)' }}>
    <Skeleton className="aspect-[3/4] w-full" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-5 w-1/3 mt-2" />
    </div>
  </div>
);

const ScanCard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocalSearching, setIsLocalSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("inventory");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentSearchRef = useRef<string>("");
  const { items: watchlistItems, removeFromWatchlist } = useWatchlist();
  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [setFilter, setSetFilter] = useState<string>("all");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");

  // Get unique sets and rarities from search results for dynamic filter
  const availableSets = useMemo(() => {
    const sets = new Set<string>();
    searchResults.forEach(product => {
      if (product.set_name) sets.add(product.set_name);
    });
    return Array.from(sets).sort();
  }, [searchResults]);

  const availableRarities = useMemo(() => {
    const rarities = new Set<string>();
    searchResults.forEach(product => {
      if (product.rarity) rarities.add(product.rarity);
    });
    return Array.from(rarities).sort();
  }, [searchResults]);

  // Detect game type for a product
  const detectGame = (product: any): string => {
    const combined = `${product.name || ''} ${product.set_name || ''}`.toLowerCase();
    if (/pokemon|pikachu|charizard|pok[eé]mon|vmax|vstar/i.test(combined)) return 'pokemon';
    if (/yu-?gi-?oh|dark magician|blue[- ]eyes|exodia/i.test(combined)) return 'yugioh';
    if (/topps|panini|prizm|donruss|bowman|rc\b|rookie|upper deck|fleer/i.test(combined) || product.sport) return 'sports';
    if (/\b(mtg|magic)\b|planeswalker/i.test(combined)) return 'mtg';
    if (/one piece|luffy|op-?\d{2}/i.test(combined)) return 'onepiece';
    return 'other';
  };

  // Filter search results
  const filteredResults = useMemo(() => {
    return searchResults.filter(product => {
      const productCategory = product.category?.toLowerCase() || "raw";
      if (categoryFilter !== "all") {
        if (categoryFilter === "sealed" && productCategory !== "sealed") return false;
        if (categoryFilter === "raw" && productCategory === "sealed") return false;
      }
      if (setFilter !== "all" && product.set_name !== setFilter) return false;
      // Game filter
      if (gameFilter !== "all" && detectGame(product) !== gameFilter) return false;
      // Price range filter
      if (priceRange !== "all" && product.market_price) {
        const price = product.market_price;
        if (priceRange === "under5" && price >= 5) return false;
        if (priceRange === "5to25" && (price < 5 || price > 25)) return false;
        if (priceRange === "25to100" && (price < 25 || price > 100)) return false;
        if (priceRange === "over100" && price < 100) return false;
      }
      if (priceRange !== "all" && !product.market_price) return false;
      // Rarity filter
      if (rarityFilter !== "all" && product.rarity !== rarityFilter) return false;
      return true;
    });
  }, [searchResults, categoryFilter, setFilter, gameFilter, priceRange, rarityFilter]);

  const clearFilters = () => { setCategoryFilter("all"); setSetFilter("all"); setGameFilter("all"); setPriceRange("all"); setRarityFilter("all"); };
  const hasActiveFilters = categoryFilter !== "all" || setFilter !== "all" || gameFilter !== "all" || priceRange !== "all" || rarityFilter !== "all";

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Progressive search: local first (immediate), then API (debounced at 300ms)
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    currentSearchRef.current = trimmedQuery;

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setIsLocalSearching(false);
      return;
    }

    // Stage 1: Immediate local search
    const doLocalSearch = async () => {
      setIsLocalSearching(true);
      const queryAtStart = trimmedQuery;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${queryAtStart}%,card_number.ilike.%${queryAtStart}%`)
          .limit(20);

        if (currentSearchRef.current !== queryAtStart) return;
        if (!error && data) setSearchResults(data);
      } catch (err) {
        console.error('Local search error:', err);
      } finally {
        if (currentSearchRef.current === queryAtStart) setIsLocalSearching(false);
      }
    };

    doLocalSearch();

    // Stage 2: Full API search after 300ms debounce (was 500ms)
    setIsSearching(true);
    const queryForApi = trimmedQuery;

    const debounceTimer = setTimeout(async () => {
      if (currentSearchRef.current !== queryForApi) { setIsSearching(false); return; }

      try {
        const { data, error } = await supabase.functions.invoke('products-search', {
          body: { query: queryForApi }
        });

        if (currentSearchRef.current !== queryForApi) return;
        if (error) throw error;

        const products = data?.products || [];
        setSearchResults(products);
        if (products.length > 0) addSearch(queryForApi);
      } catch (error: any) {
        console.error('API search error:', error);
      } finally {
        if (currentSearchRef.current === queryForApi) setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, addSearch]);

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
  };

  const handleAddToInventory = (product: any) => {
    if (searchMode === "pricecheck") return; // In price check mode, don't open dialog
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleProductClick = (product: any) => {
    if (searchMode === "pricecheck") {
      // In price check mode, just refocus search for rapid-fire checking
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    } else {
      handleAddToInventory(product);
    }
  };

  const quickActions = [
    { icon: Plus, label: "Add Manually", description: "Enter card details", action: () => navigate("/add"), color: "bg-primary/15 text-primary" },
    { icon: Package, label: "Inventory", description: "View collection", action: () => navigate("/inventory"), color: "bg-success/15 text-success" },
    { icon: TrendingUp, label: "Analytics", description: "Portfolio stats", action: () => navigate("/dashboard"), color: "bg-chart-4/15 text-chart-4" },
  ];

  const hasResults = filteredResults.length > 0;
  const showWelcome = searchResults.length === 0 && !searchQuery;
  const showLoadingSkeletons = isSearching && searchResults.length === 0 && searchQuery.trim().length >= 2;

  // Category badge helper
  const getCategoryBadge = (product: any) => {
    const name = (product.name || '').toLowerCase();
    const set = (product.set_name || '').toLowerCase();
    const combined = `${name} ${set}`;
    if (/pokemon|pikachu|charizard|pok[eé]mon/i.test(combined)) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/90 text-black">Pokémon</span>;
    if (/yu-?gi-?oh|dark magician|blue[- ]eyes|exodia/i.test(combined)) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-600/90 text-white">Yu-Gi-Oh</span>;
    if (/\b(mtg|magic)\b|planeswalker/i.test(combined)) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-600/90 text-white">MTG</span>;
    if (/one piece|luffy|zoro|op-?\d{2}/i.test(combined)) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-600/90 text-white">One Piece</span>;
    if (/topps|panini|prizm|donruss|bowman|rc\b|rookie|upper deck|fleer/i.test(combined) || product.sport) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-600/90 text-white">Sports</span>;
    return null;
  };

  // Price source badge
  const getPriceSourceBadge = (product: any) => {
    if (!product.price_source) return null;
    const styles: Record<string, string> = {
      pokemon_tcg: 'bg-emerald-500/20 text-emerald-500',
      tavily: 'bg-amber-500/20 text-amber-500',
      scrydex: 'bg-blue-500/20 text-blue-500',
    };
    const labels: Record<string, string> = {
      pokemon_tcg: 'TCGPlayer',
      tavily: 'AI Est.',
      scrydex: 'Market',
    };
    return (
      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${styles[product.price_source] || 'bg-blue-500/20 text-blue-500'}`}>
        {labels[product.price_source] || ''}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
          {/* Hero Search Section */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            {/* Welcome Header */}
            {showWelcome && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <h1 className="ios-title-large mb-1">Card Ledger</h1>
                <p className="text-muted-foreground/60 text-[15px]">Search, scan, and track your cards</p>
              </motion.div>
            )}

            {/* Search Mode Toggle — Task 9 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex bg-secondary/30 rounded-full p-0.5 flex-1 max-w-xs">
                <button
                  onClick={() => setSearchMode("inventory")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full font-semibold transition-all ${
                    searchMode === "inventory"
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground/60 hover:text-foreground'
                  }`}
                >
                  <Package className="h-3.5 w-3.5" />
                  Add to Inventory
                </button>
                <button
                  onClick={() => setSearchMode("pricecheck")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full font-semibold transition-all ${
                    searchMode === "pricecheck"
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-muted-foreground/60 hover:text-foreground'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Quick Price Check
                </button>
              </div>
            </div>

            {/* Hero Search Bar — premium glass with glow */}
            <div className="search-hero transition-shadow duration-300 focus-within:shadow-[0_0_0_3px_hsl(212_100%_49%/0.12),0_0_24px_hsl(212_100%_49%/0.08)]">
              <div className="relative flex items-center">
                <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchMode === "pricecheck"
                    ? "Quick price check — search and see values instantly..."
                    : "Search any card — Pokemon, sports, Yu-Gi-Oh, Magic..."}
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
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setSearchResults([]); searchInputRef.current?.focus(); }}
                    className="absolute right-14 text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {(isSearching || isLocalSearching) && (
                  <div className="absolute right-5 flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Recent Searches — Task 8 */}
            <AnimatePresence>
              {showRecentSearches && !searchQuery && recentSearches.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Recent searches
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); clearSearches(); }}
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
                        onMouseDown={(e) => { e.preventDefault(); handleRecentSearchClick(search.query); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-sm font-medium hover:bg-secondary/80 transition-colors group"
                      >
                        <Search className="h-3 w-3 text-muted-foreground" />
                        {search.query}
                        <button
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); removeSearch(search.query); }}
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
                Try: "Charizard VMAX", "LeBron Prizm RC", "One Piece Luffy OP01"
              </p>
            )}

            {/* Price check mode banner */}
            {searchMode === "pricecheck" && searchQuery && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <span className="font-semibold">Price Check Mode</span> — Tap a card to see its price, then search again. Perfect for card shows!
                </p>
              </motion.div>
            )}

            {/* Filter Chips */}
            {searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                        {availableSets.map(set => (<option key={set} value={set}>{set}</option>))}
                      </select>
                    </div>
                  )}

                  {/* Game Filter */}
                  <div className="flex-shrink-0">
                    <select
                      value={gameFilter}
                      onChange={(e) => setGameFilter(e.target.value)}
                      className={`h-9 px-3 pr-8 rounded-xl text-sm font-medium border transition-all appearance-none bg-no-repeat bg-right cursor-pointer ${
                        gameFilter !== "all"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                      }`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${gameFilter !== "all" ? "white" : "%236b7280"}' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 8px center" }}
                    >
                      <option value="all">All Games</option>
                      <option value="pokemon">Pokémon</option>
                      <option value="sports">Sports</option>
                      <option value="yugioh">Yu-Gi-Oh</option>
                      <option value="mtg">Magic</option>
                      <option value="onepiece">One Piece</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="flex-shrink-0">
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className={`h-9 px-3 pr-8 rounded-xl text-sm font-medium border transition-all appearance-none bg-no-repeat bg-right cursor-pointer ${
                        priceRange !== "all"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                      }`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${priceRange !== "all" ? "white" : "%236b7280"}' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 8px center" }}
                    >
                      <option value="all">Any Price</option>
                      <option value="under5">Under $5</option>
                      <option value="5to25">$5 – $25</option>
                      <option value="25to100">$25 – $100</option>
                      <option value="over100">$100+</option>
                    </select>
                  </div>

                  {/* Rarity Filter */}
                  {availableRarities.length > 1 && (
                    <div className="flex-shrink-0">
                      <select
                        value={rarityFilter}
                        onChange={(e) => setRarityFilter(e.target.value)}
                        className={`h-9 px-3 pr-8 rounded-xl text-sm font-medium border transition-all appearance-none bg-no-repeat bg-right cursor-pointer max-w-[160px] truncate ${
                          rarityFilter !== "all"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 text-foreground border-border/50 hover:border-primary/50"
                        }`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${rarityFilter !== "all" ? "white" : "%236b7280"}' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 8px center" }}
                      >
                        <option value="all">All Rarities</option>
                        {availableRarities.map(r => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                  )}

                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="flex-shrink-0 h-9 px-3 rounded-xl text-sm font-medium bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-all flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>

                {hasActiveFilters && (
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredResults.length} of {searchResults.length} results
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Quick Actions — only when no search */}
          <AnimatePresence mode="wait">
            {showWelcome && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: 0.1 }} className="space-y-6">
                {/* Scanner Options */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    onClick={() => navigate("/scan/ai")}
                    className="card-clean-elevated p-5 text-left relative overflow-hidden tap-scale transition-all hover:scale-[1.02] rounded-3xl"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/8 rounded-full blur-3xl" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-1">AI Scanner</h3>
                      <p className="text-sm text-muted-foreground">Identify any card with AI</p>
                    </div>
                  </motion.button>

                  <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    onClick={() => navigate("/scan/barcode")}
                    className="card-clean-elevated p-5 text-left relative overflow-hidden tap-scale transition-all hover:scale-[1.02] rounded-3xl"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-success/8 rounded-full blur-3xl" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-4">
                        <Scan className="w-7 h-7 text-success" />
                      </div>
                      <h3 className="font-semibold mb-1">Barcode</h3>
                      <p className="text-sm text-muted-foreground">Scan UPC or PSA cert</p>
                    </div>
                  </motion.button>
                </div>

                {/* Quick Actions Grid */}
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 ml-1">Quick Actions</h2>
                  <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
                    {quickActions.map((action, index) => (
                      <motion.button key={action.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + index * 0.05 }}
                        onClick={action.action}
                        className="card-clean-elevated p-4 text-center tap-scale transition-all hover:scale-[1.02] rounded-2xl"
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

                {/* Watchlist Section */}
                {watchlistItems.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <div className="flex items-center justify-between mb-3 ml-1">
                      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Watchlist
                        <span className="text-xs text-muted-foreground/70">({watchlistItems.length}/25)</span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {watchlistItems.map((item, index) => (
                        <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + index * 0.03 }}
                          className="card-clean-elevated overflow-hidden group cursor-pointer rounded-[20px]"
                          onClick={() => handleAddToInventory({
                            id: item.id, name: item.product_name, set_name: item.set_name,
                            card_number: item.card_number, image_url: item.image_url,
                            market_price: item.current_price, category: item.category,
                            grading_company: item.grading_company || undefined, grade: item.grade || undefined,
                          })}
                        >
                          <div className="relative aspect-[3/4] bg-secondary/30">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.product_name} className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30"><ImageIcon className="h-12 w-12" /></div>
                            )}
                            <Button size="sm" variant="ghost"
                              className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.id); }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            {item.grading_company && item.grade && (
                              <div className="absolute top-2 left-2">
                                <span className="ios-badge text-[10px] font-bold uppercase">{item.grading_company} {item.grade}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3 space-y-1.5">
                            <div>
                              <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{item.product_name}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.set_name}</p>
                            </div>
                            {item.current_price ? (
                              <div className="pt-1.5 border-t border-border/30">
                                <span className="text-sm font-bold text-emerald-500 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  ${formatPrice(item.current_price)}
                                </span>
                                {item.price_change_percent !== null && item.price_change_percent !== 0 && (
                                  <span className={`text-[10px] font-semibold ml-1.5 ${item.price_change_percent > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {item.price_change_percent > 0 ? '+' : ''}{item.price_change_percent.toFixed(1)}%
                                  </span>
                                )}
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

          {/* Loading Skeletons — Task 3 */}
          {showLoadingSkeletons && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (<SearchResultSkeleton key={i} />))}
            </motion.div>
          )}

          {/* Search Results — Task 4: Clean card layout */}
          <AnimatePresence mode="wait">
            {hasResults && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{filteredResults.length}</span> {filteredResults.length === 1 ? 'item' : 'items'}
                    {hasActiveFilters && ` (filtered from ${searchResults.length})`}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setSearchResults([]); clearFilters(); }} className="text-xs">Clear</Button>
                </div>

                {/* Results Grid — responsive columns with stagger */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 stagger-enter">
                  {filteredResults.map((product, index) => (
                    <motion.div key={product.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(index * 0.02, 0.3) }}
                      className="card-clean-elevated overflow-hidden group tap-scale cursor-pointer rounded-[20px]"
                      onClick={() => handleProductClick(product)}
                    >
                      {/* Card Image — large aspect ratio */}
                      <div className="relative aspect-[3/4] bg-secondary/30">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name}
                            className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                            loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30"><ImageIcon className="h-12 w-12" /></div>
                        )}

                        {/* Category + Game Badge — top left */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {product.category === 'sealed' && (
                            <span className="ios-badge-success text-[10px] font-bold">SEALED</span>
                          )}
                          {getCategoryBadge(product)}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary/90 px-4 py-2 rounded-xl">
                            {searchMode === "pricecheck" ? "Price Checked ✓" : "View Details"}
                          </span>
                        </div>
                      </div>

                      {/* Card Details — clean layout */}
                      <div className="p-3 space-y-1.5">
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.set_name}</p>
                        </div>

                        {/* Market Price — prominent, monospace */}
                        {product.market_price ? (
                          <div className="pt-1.5 border-t border-border/30">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] text-muted-foreground/60">Market</span>
                              {getPriceSourceBadge(product)}
                            </div>
                            <span className="text-[15px] font-bold text-emerald-500 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              ${formatPrice(product.market_price)}
                            </span>
                          </div>
                        ) : (
                          <div className="pt-1.5 border-t border-border/30">
                            <span className="text-xs text-muted-foreground/50">Price not available</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Results State — Task 3 */}
          {searchQuery && !hasResults && !isSearching && !showLoadingSkeletons && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">
                {hasActiveFilters && searchResults.length > 0 ? "No matches for these filters" : "No matches found"}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {hasActiveFilters && searchResults.length > 0
                  ? "Try adjusting your filters or clear them."
                  : "Try a different name or check the spelling."}
              </p>
              <div className="text-xs text-muted-foreground/60 mb-4 space-y-1">
                <p>Try searching with fewer words</p>
                <p>Check for typos in the card name</p>
                <p>Use set abbreviations like "SV" or "OP01"</p>
              </div>
              {hasActiveFilters && searchResults.length > 0 ? (
                <Button variant="outline" onClick={clearFilters} className="rounded-xl"><X className="w-4 h-4 mr-2" />Clear Filters</Button>
              ) : (
                <Button variant="outline" onClick={() => navigate("/add")} className="rounded-xl"><Plus className="w-4 h-4 mr-2" />Add Manually</Button>
              )}
            </motion.div>
          )}
        </main>
      </PageTransition>

      <AddToInventoryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} product={selectedProduct} />

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 md:bottom-8 right-4 z-40 h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center tap-scale"
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
