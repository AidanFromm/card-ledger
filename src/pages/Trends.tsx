import { useState, useEffect } from "react";
import { TrendingUp, Flame, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { PageTransition } from "@/components/PageTransition";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type TrendCategory = 'pokemon' | 'sports' | 'yugioh' | 'onepiece';

interface TrendResult {
  title: string;
  url: string;
  content: string;
  image?: string;
}

const CATEGORIES: { key: TrendCategory; label: string; query: string; emoji: string }[] = [
  { key: 'pokemon', label: 'Pokémon', query: 'trending pokemon cards this week prices', emoji: '⚡' },
  { key: 'sports', label: 'Sports', query: 'trending sports cards this week most valuable', emoji: '🏈' },
  { key: 'yugioh', label: 'Yu-Gi-Oh', query: 'trending yu-gi-oh cards this week prices', emoji: '🃏' },
  { key: 'onepiece', label: 'One Piece', query: 'trending one piece tcg cards this week', emoji: '🏴‍☠️' },
];

const Trends = () => {
  const [category, setCategory] = useState<TrendCategory>('pokemon');
  const [results, setResults] = useState<Record<TrendCategory, TrendResult[]>>({
    pokemon: [], sports: [], yugioh: [], onepiece: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async (cat: TrendCategory) => {
    setLoading(true);
    setError(null);
    try {
      const catInfo = CATEGORIES.find(c => c.key === cat)!;
      const { data, error: fnError } = await supabase.functions.invoke('ai-price-search', {
        body: { query: catInfo.query, includeImages: true },
      });
      if (fnError) throw fnError;

      const trendResults: TrendResult[] = (data?.results || []).slice(0, 12).map((r: any) => ({
        title: r.title || r.name || 'Unknown',
        url: r.url || '',
        content: r.content || r.snippet || '',
        image: r.image || r.thumbnail || null,
      }));

      setResults(prev => ({ ...prev, [cat]: trendResults }));
    } catch (err: any) {
      console.error('Trend fetch error:', err);
      setError('Failed to fetch trends. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (results[category].length === 0) {
      fetchTrends(category);
    }
  }, [category]);

  const currentResults = results[category];
  const currentCat = CATEGORIES.find(c => c.key === category)!;

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <div className="flex">
        <DesktopSidebar />
        <PageTransition>
          <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 flex-1">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Flame className="h-6 w-6 text-orange-500" /> Market Trends
                </h1>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => fetchTrends(category)}
                  disabled={loading}
                  className="gap-1.5 h-8 px-2 text-xs rounded-xl"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground/60 mb-5">See what's hot right now</p>
            </motion.div>

            {/* Category Pills */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    category === cat.key
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary/30 text-muted-foreground/60 hover:bg-secondary/50'
                  }`}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="card-clean-elevated rounded-2xl p-4 animate-pulse">
                    <div className="h-40 bg-muted/20 rounded-xl mb-3" />
                    <div className="h-4 bg-muted/30 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted/20 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : currentResults.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground/50">No trends found for {currentCat.label}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentResults.map((result, i) => (
                  <motion.a
                    key={i}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-clean-elevated rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform"
                  >
                    {result.image && (
                      <div className="h-40 bg-secondary/20 overflow-hidden">
                        <img src={result.image} alt={result.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold line-clamp-2 mb-1">{result.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-3">{result.content}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </main>
        </PageTransition>
      </div>
      <BottomNav />
    </div>
  );
};

export default Trends;
