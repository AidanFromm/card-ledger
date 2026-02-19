import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (term: string) => void;
  recentSearches: string[];
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
  suggestions?: string[];
  placeholder?: string;
}

export const SearchAutocomplete = ({
  value,
  onChange,
  onSearch,
  recentSearches,
  onRemoveRecent,
  onClearRecent,
  suggestions = [],
  placeholder = "Search cards...",
}: SearchAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    if (recentSearches.length > 0 || value) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay closing to allow click events on dropdown items
    setTimeout(() => {
      if (!isFocused) setIsOpen(false);
    }, 150);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0 || recentSearches.length > 0);
  };

  const handleSelectSuggestion = (term: string) => {
    onChange(term);
    onSearch(term);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value) {
      onSearch(value);
      setIsOpen(false);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  // Filter recent searches based on current input
  const filteredRecent = recentSearches.filter(
    term => term.toLowerCase().includes(value.toLowerCase())
  );

  // Show dropdown if focused and has content
  const showDropdown = isOpen && (filteredRecent.length > 0 || suggestions.length > 0);

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-10 h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary/50"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Recent Searches */}
            {filteredRecent.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearRecent();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-0.5">
                  {filteredRecent.slice(0, 5).map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer group"
                      onClick={() => handleSelectSuggestion(term)}
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
                      <span className="flex-1 text-sm truncate">{term}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRecent(term);
                        }}
                        className="p-1 rounded-full hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2 border-t border-border/30">
                <span className="text-xs font-medium text-muted-foreground px-2 py-1 block mb-1">
                  Suggestions
                </span>
                <div className="space-y-0.5">
                  {suggestions.slice(0, 5).map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer group"
                      onClick={() => handleSelectSuggestion(term)}
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
                      <span className="flex-1 text-sm truncate">{term}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchAutocomplete;
