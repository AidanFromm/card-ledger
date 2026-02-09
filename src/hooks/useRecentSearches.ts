import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "cardledger_recent_searches";
const MAX_SEARCHES = 4;

export interface RecentSearch {
  query: string;
  timestamp: number;
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        // Filter out any expired searches (older than 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter((s) => s.timestamp > thirtyDaysAgo);
        setRecentSearches(filtered.slice(0, MAX_SEARCHES));
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error);
    }
  }, []);

  // Save to localStorage whenever searches change
  const saveToStorage = useCallback((searches: RecentSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error("Failed to save recent searches:", error);
    }
  }, []);

  // Add a new search query
  const addSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery || trimmedQuery.length < 2) return;

      setRecentSearches((prev) => {
        // Remove duplicate if exists
        const filtered = prev.filter(
          (s) => s.query.toLowerCase() !== trimmedQuery.toLowerCase()
        );

        // Add new search at the beginning
        const newSearches = [
          { query: trimmedQuery, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_SEARCHES);

        saveToStorage(newSearches);
        return newSearches;
      });
    },
    [saveToStorage]
  );

  // Remove a specific search
  const removeSearch = useCallback(
    (query: string) => {
      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (s) => s.query.toLowerCase() !== query.toLowerCase()
        );
        saveToStorage(filtered);
        return filtered;
      });
    },
    [saveToStorage]
  );

  // Clear all searches
  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear recent searches:", error);
    }
  }, []);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  };
}
