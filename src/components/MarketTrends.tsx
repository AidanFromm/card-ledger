/**
 * Market Trends Widget
 * 
 * Shows real-time market trends:
 * - Hot cards (biggest gainers)
 * - Cooling down (biggest losers)
 * - Trading volume indicators
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Snowflake,
  ExternalLink,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { justTcgApi, type JustTcgGameInfo } from '@/lib/justTcgApi';

// ============================================
// Types
// ============================================

interface MarketTrendsProps {
  className?: string;
}

interface GameTrend {
  id: string;
  name: string;
  cardsCount: number;
  valueUsd: number;
  change7d: number;
  change30d: number;
  gainers7d: number;
  losers7d: number;
}

// ============================================
// Component
// ============================================

export function MarketTrends({ className }: MarketTrendsProps) {
  const [games, setGames] = useState<GameTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const gamesData = await justTcgApi.getGames();
      
      const trends: GameTrend[] = gamesData
        .filter(g => g.game_value_index_cents && g.game_value_index_cents > 0)
        .map(g => ({
          id: g.id,
          name: g.name,
          cardsCount: g.cards_count,
          valueUsd: g.game_value_index_cents / 100,
          change7d: g.game_value_change_7d_pct,
          change30d: g.game_value_change_30d_pct,
          gainers7d: g.cards_pos_7d_count,
          losers7d: g.cards_neg_7d_count,
        }))
        .sort((a, b) => b.valueUsd - a.valueUsd);

      setGames(trends);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch market trends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
    // Refresh every 30 minutes
    const interval = setInterval(fetchTrends, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format large numbers
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Get top movers
  const topGainers = [...games].sort((a, b) => b.change7d - a.change7d).slice(0, 5);
  const topLosers = [...games].sort((a, b) => a.change7d - b.change7d).slice(0, 5);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Market Trends
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchTrends}
              disabled={loading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hot" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="hot" className="gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              Hot
            </TabsTrigger>
            <TabsTrigger value="cold" className="gap-1">
              <Snowflake className="h-4 w-4 text-blue-500" />
              Cold
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1">
              <TrendingUp className="h-4 w-4" />
              All
            </TabsTrigger>
          </TabsList>

          {/* Hot Games (biggest gainers) */}
          <TabsContent value="hot" className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-secondary/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              topGainers.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-sm font-bold text-emerald-500">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{game.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {game.cardsCount.toLocaleString()} cards · {formatValue(game.valueUsd)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-0">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{game.change7d.toFixed(1)}%
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {game.gainers7d.toLocaleString()} 📈
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Cold Games (biggest losers) */}
          <TabsContent value="cold" className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-secondary/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              topLosers.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-sm font-bold text-red-500">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{game.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {game.cardsCount.toLocaleString()} cards · {formatValue(game.valueUsd)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-500/20 text-red-500 border-0">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {game.change7d.toFixed(1)}%
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {game.losers7d.toLocaleString()} 📉
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* All Games */}
          <TabsContent value="all" className="space-y-2 max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-secondary/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-2 rounded-lg bg-secondary/20 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-4">{index + 1}</span>
                    <span className="font-medium truncate">{game.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-muted-foreground text-xs">
                      {formatValue(game.valueUsd)}
                    </span>
                    <span className={cn(
                      'text-xs font-medium w-14 text-right',
                      game.change7d >= 0 ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {game.change7d >= 0 ? '+' : ''}{game.change7d.toFixed(1)}%
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            Data from JustTCG · Updates every 6 hours
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default MarketTrends;
