import { useCallback, useRef } from "react";

interface CacheEntry {
  results: any[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useSearchCache() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const getCached = useCallback((query: string): any[] | null => {
    const key = query.toLowerCase().trim();
    const entry = cacheRef.current.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return entry.results;
  }, []);

  const setCache = useCallback((query: string, results: any[]) => {
    const key = query.toLowerCase().trim();
    cacheRef.current.set(key, {
      results,
      timestamp: Date.now(),
    });
    
    // Limit cache size to 50 entries
    if (cacheRef.current.size > 50) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey) cacheRef.current.delete(firstKey);
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { getCached, setCache, clearCache };
}
