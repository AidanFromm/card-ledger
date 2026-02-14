import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Clock, 
  TrendingUp, 
  X, 
  Filter,
  Loader2,
  ImageOff
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
import { useRecentSearches } from "@/hooks/useRecentSearches";

export interface CardSearchResult {
  id: string;
  name: string;
  set_name: string;
  number?: string;
  rarity?: string;
  image_url?: string;
  estimated_value?: number;
  category?: string;
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();

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

  // Debounced search
  const searchCards = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Pokemon TCG API search
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:"${searchQuery}*"&pageSize=20&select=id,name,set,number,rarity,images,tcgplayer`
      );
      
      if (response.ok) {
        const data = await response.json();
        const cards: CardSearchResult[] = (data.data || []).map((card: any) => ({
          id: card.id,
          name: card.name,
          set_name: card.set?.name || "Unknown Set",
          number: card.number,
          rarity: card.rarity,
          image_url: card.images?.small,
          estimated_value: card.tcgplayer?.prices?.holofoil?.market || 
                          card.tcgplayer?.prices?.normal?.market ||
                          card.tcgplayer?.prices?.reverseHolofoil?.market,
          category: "pokemon",
        }));
        setResults(cards);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchCards(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchCards]);

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
    inputRef.current?.focus();
  };

  const handleImageError = (cardId: string) => {
    setFailedImages(prev => new Set(prev).add(cardId));
  };

  // Filter recent searches based on query
  const filteredRecent = recentSearches.filter(
    s => s.query.toLowerCase().includes(query.toLowerCase())
  );

  // Show dropdown content
  const hasContent = query.length > 0 || filteredRecent.length > 0;

  return (
    <div ref={containerRef} className="relative space-y-4">
      {/* Category Filter */}
      <div className="flex gap-2">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px]">
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

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && hasContent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-2 bg-card border border-border/50 rounded-xl shadow-xl z-50 max-h-[60vh] overflow-y-auto"
          >
            {/* Recent Searches */}
            {filteredRecent.length > 0 && !results.length && (
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
            {!query && !results.length && (
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
                    <div className="w-12 h-16 rounded-md overflow-hidden bg-secondary/50 flex-shrink-0">
                      {card.image_url && !failedImages.has(card.id) ? (
                        <img
                          src={card.image_url}
                          alt={card.name}
                          className="w-full h-full object-cover"
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
                      <p className="text-sm text-muted-foreground truncate">
                        {card.set_name}
                        {card.number && ` #${card.number}`}
                      </p>
                      {card.rarity && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {card.rarity}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    {card.estimated_value && (
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-primary">
                          ${card.estimated_value.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Market</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Results */}
            {query.length >= 2 && !isSearching && results.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No cards found for "{query}"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different search or use manual entry
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardSearchPanel;
