import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Package,
  Filter,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Star,
  DollarSign,
  Layers,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useInventoryDb } from "@/hooks/useInventoryDb";

// Storage keys
const RECENT_SEARCHES_KEY = "cardledger_recent_searches";
const SEARCH_FILTERS_KEY = "cardledger_search_filters";

// Filter types
interface SearchFilters {
  game: string | null;
  set: string | null;
  rarity: string | null;
  priceMin: number | null;
  priceMax: number | null;
}

// Card item type
interface SearchResult {
  id: string;
  name: string;
  set_name?: string | null;
  game?: string | null;
  rarity?: string | null;
  market_price?: number | null;
  purchase_price?: number | null;
  card_image_url?: string | null;
  quantity?: number;
  source: "owned" | "market" | "trending";
}

// Trending cards mock data
const TRENDING_CARDS: SearchResult[] = [
  {
    id: "trend-1",
    name: "Charizard ex (Obsidian Flames)",
    set_name: "Obsidian Flames",
    game: "Pokemon",
    rarity: "Special Art Rare",
    market_price: 185,
    card_image_url: "https://images.pokemontcg.io/sv3/223_hires.png",
    source: "trending",
  },
  {
    id: "trend-2",
    name: "Pikachu with Grey Felt Hat",
    set_name: "Van Gogh Promo",
    game: "Pokemon",
    rarity: "Promo",
    market_price: 350,
    card_image_url: "https://images.pokemontcg.io/svp/85_hires.png",
    source: "trending",
  },
  {
    id: "trend-3",
    name: "Mewtwo VSTAR Rainbow",
    set_name: "Pokemon GO",
    game: "Pokemon",
    rarity: "Secret Rare",
    market_price: 45,
    card_image_url: "https://images.pokemontcg.io/pgo/79_hires.png",
    source: "trending",
  },
  {
    id: "trend-4",
    name: "Eevee Heroes Umbreon V Alt Art",
    set_name: "Eevee Heroes",
    game: "Pokemon",
    rarity: "Alt Art",
    market_price: 580,
    card_image_url: "https://images.pokemontcg.io/swsh7/215_hires.png",
    source: "trending",
  },
  {
    id: "trend-5",
    name: "Michael Jordan Rookie",
    set_name: "1986-87 Fleer",
    game: "Sports",
    rarity: "Base",
    market_price: 28500,
    source: "trending",
  },
];

// Game options
const GAME_OPTIONS = [
  "Pokemon",
  "Magic: The Gathering",
  "Yu-Gi-Oh!",
  "Sports",
  "One Piece",
  "Disney Lorcana",
];

// Rarity options
const RARITY_OPTIONS = [
  "Common",
  "Uncommon",
  "Rare",
  "Ultra Rare",
  "Secret Rare",
  "Alt Art",
  "Full Art",
  "Illustration Rare",
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { items: inventoryItems } = useInventoryDb();

  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    game: null,
    set: null,
    rarity: null,
    priceMin: null,
    priceMax: null,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error);
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Save search to recent
  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, 10);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Remove from recent
  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== term);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear all recent
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Get unique sets from inventory
  const availableSets = useMemo(() => {
    const sets = new Set<string>();
    inventoryItems.forEach((item) => {
      if (item.set_name) sets.add(item.set_name);
    });
    return Array.from(sets).sort();
  }, [inventoryItems]);

  // Convert inventory items to search results
  const ownedCards: SearchResult[] = useMemo(() => {
    return inventoryItems.map((item) => ({
      id: item.id,
      name: item.name,
      set_name: item.set_name,
      game: item.game,
      rarity: item.rarity,
      market_price: item.market_price,
      purchase_price: item.purchase_price,
      card_image_url: item.card_image_url,
      quantity: item.quantity,
      source: "owned" as const,
    }));
  }, [inventoryItems]);

  // Filter and search
  const searchResults = useMemo(() => {
    let results: SearchResult[] = [];

    // Search owned cards
    const filteredOwned = ownedCards.filter((card) => {
      // Text search
      const searchLower = query.toLowerCase();
      const matchesQuery =
        !query ||
        card.name.toLowerCase().includes(searchLower) ||
        card.set_name?.toLowerCase().includes(searchLower) ||
        card.game?.toLowerCase().includes(searchLower);

      // Filter matches
      const matchesGame = !filters.game || card.game === filters.game;
      const matchesSet = !filters.set || card.set_name === filters.set;
      const matchesRarity = !filters.rarity || card.rarity === filters.rarity;
      const price = card.market_price || card.purchase_price || 0;
      const matchesPriceMin = !filters.priceMin || price >= filters.priceMin;
      const matchesPriceMax = !filters.priceMax || price <= filters.priceMax;

      return matchesQuery && matchesGame && matchesSet && matchesRarity && matchesPriceMin && matchesPriceMax;
    });

    // Search trending/market cards
    const filteredTrending = TRENDING_CARDS.filter((card) => {
      const searchLower = query.toLowerCase();
      const matchesQuery =
        !query ||
        card.name.toLowerCase().includes(searchLower) ||
        card.set_name?.toLowerCase().includes(searchLower);

      const matchesGame = !filters.game || card.game === filters.game;
      const matchesRarity = !filters.rarity || card.rarity === filters.rarity;
      const price = card.market_price || 0;
      const matchesPriceMin = !filters.priceMin || price >= filters.priceMin;
      const matchesPriceMax = !filters.priceMax || price <= filters.priceMax;

      return matchesQuery && matchesGame && matchesRarity && matchesPriceMin && matchesPriceMax;
    });

    // Combine results
    results = [...filteredOwned, ...filteredTrending];

    // Sort: owned first, then by name
    results.sort((a, b) => {
      if (a.source === "owned" && b.source !== "owned") return -1;
      if (a.source !== "owned" && b.source === "owned") return 1;
      return a.name.localeCompare(b.name);
    });

    return results;
  }, [query, filters, ownedCards]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      if (e.key === "Enter" && searchResults[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(searchResults[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onClose]);

  // Handle result selection
  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      saveRecentSearch(result.name);
      onClose();

      if (result.source === "owned") {
        // Navigate to inventory with item selected
        navigate(`/inventory?highlight=${result.id}`);
      } else {
        // Navigate to market/add page
        navigate(`/add?search=${encodeURIComponent(result.name)}`);
      }
    },
    [navigate, onClose, saveRecentSearch]
  );

  // Handle search submit
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      saveRecentSearch(query);
      onClose();
      navigate(`/inventory?search=${encodeURIComponent(query)}`);
    }
  }, [query, navigate, onClose, saveRecentSearch]);

  // Clear single filter
  const clearFilter = (key: keyof SearchFilters) => {
    setFilters((prev) => ({ ...prev, [key]: null }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      game: null,
      set: null,
      rarity: null,
      priceMin: null,
      priceMax: null,
    });
  };

  // Active filter count
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Show trending when no query
  const showTrending = !query && recentSearches.length === 0;
  const showRecent = !query && recentSearches.length > 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed inset-x-4 top-16 z-50 max-w-2xl mx-auto"
          >
            <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden">
              {/* Search Header */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Search your collection & market..."
                    className="flex-1 bg-transparent border-0 text-white placeholder-zinc-500 outline-none text-lg focus-visible:ring-0"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
                    >
                      <X className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "gap-1.5 h-8 px-3 rounded-lg transition-colors",
                      showFilters || activeFilterCount > 0
                        ? "bg-primary/20 text-primary"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-primary text-white">
                        {activeFilterCount}
                      </Badge>
                    )}
                    {showFilters ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 space-y-4">
                        {/* Game Filter */}
                        <div>
                          <label className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                            <Layers className="w-3 h-3" /> Game
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {GAME_OPTIONS.map((game) => (
                              <button
                                key={game}
                                onClick={() =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    game: prev.game === game ? null : game,
                                  }))
                                }
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                  filters.game === game
                                    ? "bg-primary text-white"
                                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                )}
                              >
                                {game}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rarity Filter */}
                        <div>
                          <label className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                            <Star className="w-3 h-3" /> Rarity
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {RARITY_OPTIONS.map((rarity) => (
                              <button
                                key={rarity}
                                onClick={() =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    rarity: prev.rarity === rarity ? null : rarity,
                                  }))
                                }
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                  filters.rarity === rarity
                                    ? "bg-primary text-white"
                                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                )}
                              >
                                {rarity}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Price Range */}
                        <div>
                          <label className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3" /> Price Range
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={filters.priceMin || ""}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  priceMin: e.target.value ? Number(e.target.value) : null,
                                }))
                              }
                              className="w-24 h-8 text-sm bg-zinc-800 border-zinc-700"
                            />
                            <span className="text-zinc-500">—</span>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={filters.priceMax || ""}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  priceMax: e.target.value ? Number(e.target.value) : null,
                                }))
                              }
                              className="w-24 h-8 text-sm bg-zinc-800 border-zinc-700"
                            />
                          </div>
                        </div>

                        {/* Set Filter (if items exist) */}
                        {availableSets.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                              <Tag className="w-3 h-3" /> Set
                            </label>
                            <select
                              value={filters.set || ""}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  set: e.target.value || null,
                                }))
                              }
                              className="w-full h-8 text-sm bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-zinc-300"
                            >
                              <option value="">All Sets</option>
                              {availableSets.map((set) => (
                                <option key={set} value={set}>
                                  {set}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Clear Filters */}
                        {activeFilterCount > 0 && (
                          <button
                            onClick={clearAllFilters}
                            className="text-xs text-zinc-400 hover:text-white transition-colors"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Results Area */}
              <div className="max-h-[60vh] overflow-y-auto">
                {/* Recent Searches */}
                {showRecent && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Recent Searches
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.slice(0, 8).map((term, index) => (
                        <motion.div
                          key={term}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer group"
                          onClick={() => {
                            setQuery(term);
                            saveRecentSearch(term);
                          }}
                        >
                          <Clock className="w-4 h-4 text-zinc-500" />
                          <span className="flex-1 text-sm text-zinc-300">{term}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(term);
                            }}
                            className="p-1 rounded-full hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-zinc-400" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Cards */}
                {showTrending && (
                  <div className="p-4">
                    <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5 mb-3">
                      <Flame className="w-3 h-3 text-orange-500" />
                      Trending Cards
                    </span>
                    <div className="space-y-1">
                      {TRENDING_CARDS.map((card, index) => (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                            selectedIndex === index
                              ? "bg-navy-600/30"
                              : "hover:bg-zinc-800/50"
                          )}
                          onClick={() => handleSelectResult(card)}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          {card.card_image_url && (
                            <img
                              src={card.card_image_url}
                              alt={card.name}
                              className="w-10 h-14 object-cover rounded-md"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{card.name}</p>
                            <p className="text-xs text-zinc-400 truncate">
                              {card.set_name} • {card.game}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-400">
                              ${card.market_price?.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-1 text-orange-400">
                              <TrendingUp className="w-3 h-3" />
                              <span className="text-xs">Hot</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {query && (
                  <div className="p-4">
                    {searchResults.length === 0 ? (
                      <div className="py-8 text-center">
                        <Search className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">No results found for "{query}"</p>
                        <p className="text-xs text-zinc-500 mt-1">Try different keywords or filters</p>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-zinc-400 mb-3 block">
                          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                        </span>
                        <div className="space-y-1">
                          {searchResults.slice(0, 20).map((result, index) => (
                            <motion.div
                              key={result.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                                selectedIndex === index
                                  ? "bg-navy-600/30"
                                  : "hover:bg-zinc-800/50"
                              )}
                              onClick={() => handleSelectResult(result)}
                              onMouseEnter={() => setSelectedIndex(index)}
                            >
                              {result.card_image_url ? (
                                <img
                                  src={result.card_image_url}
                                  alt={result.name}
                                  className="w-10 h-14 object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-10 h-14 bg-zinc-800 rounded-md flex items-center justify-center">
                                  <Package className="w-5 h-5 text-zinc-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-white truncate">{result.name}</p>
                                  {result.source === "owned" && (
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-green-500/20 text-green-400">
                                      Owned
                                    </Badge>
                                  )}
                                  {result.source === "trending" && (
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-orange-500/20 text-orange-400">
                                      <Flame className="w-2.5 h-2.5 mr-0.5" />
                                      Trending
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-400 truncate">
                                  {result.set_name}
                                  {result.game && ` • ${result.game}`}
                                  {result.quantity && result.quantity > 1 && ` • ×${result.quantity}`}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {result.market_price ? (
                                  <p className="text-sm font-semibold text-white">
                                    ${result.market_price.toLocaleString()}
                                  </p>
                                ) : result.purchase_price ? (
                                  <p className="text-sm text-zinc-400">
                                    ${result.purchase_price.toLocaleString()}
                                  </p>
                                ) : null}
                              </div>
                              <ArrowRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                            </motion.div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800">↑↓</kbd> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800">↵</kbd> Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800">Esc</kbd> Close
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Global Search</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default GlobalSearch;
