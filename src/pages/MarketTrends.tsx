import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Flame, DollarSign, Clock, RefreshCw,
  ArrowUpRight, ArrowDownRight, Package, Star, Sparkles, Filter
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketTrends, TrendingCard, PriceMover, RecentSale } from "@/hooks/useMarketTrends";
import { useInventoryDb } from "@/hooks/useInventoryDb";

// Category filter options
const TCG_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'mtg', label: 'MTG' },
  { value: 'sports', label: 'Sports' },
];

// Skeleton loader
const CardSkeleton = () => (
  <div className="flex-shrink-0 w-[140px] h-[200px] rounded-2xl bg-zinc-800/50 animate-pulse" />
);

const SectionSkeleton = () => (
  <div className="space-y-4">
    <div className="h-6 w-32 bg-zinc-800/50 rounded animate-pulse" />
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
    </div>
  </div>
);

// Hot Card Component
const HotCard = ({ card, index }: { card: TrendingCard; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.03, y: -4 }}
    className="flex-shrink-0 w-[140px] relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 cursor-pointer hover:shadow-lg hover:shadow-amber-500/10 transition-all"
  >
    {/* Rank Badge */}
    <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center">
      <Flame className="h-3.5 w-3.5 text-amber-400" />
    </div>
    
    {/* Image */}
    <div className="w-full h-[100px] bg-zinc-800/50 relative">
      {card.card_image_url ? (
        <img 
          src={card.card_image_url} 
          alt={card.card_name}
          className="w-full h-full object-contain p-2"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-amber-500/30" />
        </div>
      )}
    </div>
    
    {/* Info */}
    <div className="p-3">
      <p className="text-xs font-semibold text-white truncate leading-tight">
        {card.card_name}
      </p>
      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
        {card.set_name || 'Unknown Set'}
      </p>
      
      {/* Stats */}
      <div className="flex items-center justify-between mt-2">
        {card.latest_price && (
          <span className="text-sm font-bold text-amber-400">
            ${card.latest_price.toFixed(2)}
          </span>
        )}
        <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
          <Star className="h-2.5 w-2.5" />
          {card.activity_count}
        </span>
      </div>
    </div>
  </motion.div>
);

// Mover Card Component
const MoverCard = ({ mover, index, type }: { mover: PriceMover; index: number; type: 'gainer' | 'loser' }) => {
  const isGainer = type === 'gainer';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ scale: 1.03, y: -3 }}
      className={`
        flex-shrink-0 w-[150px] relative overflow-hidden rounded-2xl p-3
        border cursor-pointer transition-all
        ${isGainer 
          ? 'bg-gradient-to-br from-navy-500/10 via-navy-500/5 to-transparent border-navy-500/20 hover:shadow-navy-500/10' 
          : 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-red-500/20 hover:shadow-red-500/10'
        }
        hover:shadow-lg
      `}
    >
      {/* Rank */}
      <div className={`
        absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
        ${isGainer ? 'bg-navy-500/20 text-navy-400' : 'bg-red-500/20 text-red-400'}
      `}>
        #{index + 1}
      </div>
      
      {/* Image */}
      <div className="w-full h-[80px] rounded-xl overflow-hidden bg-zinc-800/50 mb-2">
        {mover.card_image_url ? (
          <img 
            src={mover.card_image_url} 
            alt={mover.item_name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isGainer ? (
              <TrendingUp className="h-6 w-6 text-navy-500/30" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-500/30" />
            )}
          </div>
        )}
      </div>
      
      {/* Name */}
      <p className="text-xs font-semibold text-white truncate mb-0.5">
        {mover.item_name}
      </p>
      <p className="text-[10px] text-zinc-500 truncate mb-2">
        {mover.set_name}
      </p>
      
      {/* Grade badge */}
      {mover.grade && mover.grading_company && mover.grading_company.toLowerCase() !== 'raw' && (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 mb-2 border-amber-500/30 text-amber-400">
          {mover.grading_company} {mover.grade}
        </Badge>
      )}
      
      {/* Price Change */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">
          ${mover.current_price.toFixed(2)}
        </span>
        <div className={`
          flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold
          ${isGainer ? 'bg-navy-500/20 text-navy-400' : 'bg-red-500/20 text-red-400'}
        `}>
          {isGainer ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(mover.change_percent).toFixed(1)}%
        </div>
      </div>
      
      {/* Dollar change */}
      <p className={`text-[10px] mt-1 ${isGainer ? 'text-navy-400/70' : 'text-red-400/70'}`}>
        {isGainer ? '+' : ''}${mover.price_change.toFixed(2)}
      </p>
    </motion.div>
  );
};

// Recent Sale Card Component
const SaleCard = ({ sale, index }: { sale: RecentSale; index: number }) => {
  const isProfit = sale.profit >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/30 hover:bg-zinc-800/50 transition-colors cursor-pointer"
    >
      {/* Image */}
      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden">
        {sale.card_image_url ? (
          <img 
            src={sale.card_image_url} 
            alt={sale.item_name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-zinc-600" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {sale.item_name}
        </p>
        <p className="text-[11px] text-zinc-500 truncate">
          {sale.set_name}
          {sale.grade && sale.grading_company && sale.grading_company !== 'raw' && (
            <span className="text-amber-400 ml-1">
              • {sale.grading_company} {sale.grade}
            </span>
          )}
        </p>
      </div>
      
      {/* Sale Info */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-white">
          ${sale.sale_price.toFixed(2)}
        </p>
        <p className={`text-[11px] font-medium ${isProfit ? 'text-navy-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}${sale.profit.toFixed(2)}
        </p>
      </div>
    </motion.div>
  );
};

// Empty State Component
const EmptySection = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-zinc-600" />
    </div>
    <p className="text-sm text-zinc-500">No {title.toLowerCase()} yet</p>
    <p className="text-xs text-zinc-600 mt-1">Check back soon!</p>
  </div>
);

const MarketTrends = () => {
  const { trendingCards, gainers, losers, recentSales, loading, refetch } = useMarketTrends();
  const { items } = useInventoryDb();
  const [tcgFilter, setTcgFilter] = useState('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // Filter function (simple name-based filtering)
  const filterByTcg = (name: string) => {
    if (tcgFilter === 'all') return true;
    const nameLower = name.toLowerCase();
    switch (tcgFilter) {
      case 'pokemon':
        return nameLower.includes('pokemon') || nameLower.includes('charizard') || 
               nameLower.includes('pikachu') || nameLower.includes('mewtwo');
      case 'yugioh':
        return nameLower.includes('yu-gi-oh') || nameLower.includes('yugioh') ||
               nameLower.includes('dark magician') || nameLower.includes('blue-eyes');
      case 'mtg':
        return nameLower.includes('magic') || nameLower.includes('mtg');
      case 'sports':
        return nameLower.includes('baseball') || nameLower.includes('basketball') ||
               nameLower.includes('football') || nameLower.includes('topps') ||
               nameLower.includes('panini');
      default:
        return true;
    }
  };

  // Use user's own inventory items for gainers/losers if no market data
  const { userGainers, userLosers } = useMemo(() => {
    if (gainers.length > 0 || losers.length > 0) {
      return { userGainers: gainers, userLosers: losers };
    }

    // Fall back to user's inventory
    const withChanges = items
      .filter(item => item.market_price && item.market_price !== item.purchase_price)
      .map(item => ({
        inventory_item_id: item.id,
        item_name: item.name,
        set_name: item.set_name,
        card_image_url: item.card_image_url,
        grading_company: item.grading_company,
        grade: item.grade,
        current_price: item.market_price || item.purchase_price,
        previous_price: item.purchase_price,
        price_change: (item.market_price || 0) - item.purchase_price,
        change_percent: item.purchase_price > 0 
          ? (((item.market_price || 0) - item.purchase_price) / item.purchase_price) * 100 
          : 0,
        quantity: item.quantity,
      }));

    return {
      userGainers: withChanges.filter(m => m.change_percent > 0).sort((a, b) => b.change_percent - a.change_percent).slice(0, 10),
      userLosers: withChanges.filter(m => m.change_percent < 0).sort((a, b) => a.change_percent - b.change_percent).slice(0, 10),
    };
  }, [items, gainers, losers]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Market Trends
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Discover what's hot in the market
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="gap-1.5 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </motion.div>

          {/* Time Range + Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            {/* Time Range */}
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <TabsList className="bg-zinc-800/50 h-9">
                <TabsTrigger value="24h" className="text-xs h-7 px-3">24h</TabsTrigger>
                <TabsTrigger value="7d" className="text-xs h-7 px-3">7 Days</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs h-7 px-3">30 Days</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* TCG Filter */}
            <div className="flex gap-1.5 flex-wrap">
              {TCG_FILTERS.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setTcgFilter(filter.value)}
                  className={`
                    text-xs px-3 py-1.5 rounded-full font-medium transition-all
                    ${tcgFilter === filter.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                    }
                  `}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="space-y-8">
              <SectionSkeleton />
              <SectionSkeleton />
              <SectionSkeleton />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Hot Cards Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-amber-500/15">
                    <Flame className="h-4 w-4 text-amber-400" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Hot Cards</h2>
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                    Most searched
                  </Badge>
                </div>
                
                {trendingCards.length > 0 ? (
                  <div 
                    className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
                    style={{ scrollSnapType: 'x mandatory' }}
                  >
                    {trendingCards
                      .filter(card => filterByTcg(card.card_name))
                      .map((card, index) => (
                        <div key={`${card.card_name}-${index}`} style={{ scrollSnapAlign: 'start' }}>
                          <HotCard card={card} index={index} />
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptySection title="Hot Cards" icon={Flame} />
                )}
              </motion.section>

              {/* Biggest Gainers Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-navy-500/15">
                    <TrendingUp className="h-4 w-4 text-navy-400" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Biggest Gainers</h2>
                  <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                    {userGainers.length} cards
                  </span>
                </div>
                
                {userGainers.length > 0 ? (
                  <div 
                    className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
                    style={{ scrollSnapType: 'x mandatory' }}
                  >
                    {userGainers
                      .filter(mover => filterByTcg(mover.item_name))
                      .map((mover, index) => (
                        <div key={mover.inventory_item_id} style={{ scrollSnapAlign: 'start' }}>
                          <MoverCard mover={mover} index={index} type="gainer" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptySection title="Gainers" icon={TrendingUp} />
                )}
              </motion.section>

              {/* Biggest Losers Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-red-500/15">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Biggest Losers</h2>
                  <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                    {userLosers.length} cards
                  </span>
                </div>
                
                {userLosers.length > 0 ? (
                  <div 
                    className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
                    style={{ scrollSnapType: 'x mandatory' }}
                  >
                    {userLosers
                      .filter(mover => filterByTcg(mover.item_name))
                      .map((mover, index) => (
                        <div key={mover.inventory_item_id} style={{ scrollSnapAlign: 'start' }}>
                          <MoverCard mover={mover} index={index} type="loser" />
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptySection title="Losers" icon={TrendingDown} />
                )}
              </motion.section>

              {/* Recently Sold Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-blue-500/15">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Recently Sold</h2>
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                    Comps
                  </Badge>
                </div>
                
                {recentSales.length > 0 ? (
                  <div className="space-y-2">
                    {recentSales
                      .filter(sale => filterByTcg(sale.item_name))
                      .slice(0, 10)
                      .map((sale, index) => (
                        <SaleCard key={sale.sale_id} sale={sale} index={index} />
                      ))}
                  </div>
                ) : (
                  <EmptySection title="Sales" icon={DollarSign} />
                )}
              </motion.section>

              {/* New Releases Placeholder */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-purple-500/15">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  </div>
                  <h2 className="text-base font-semibold text-white">New Releases</h2>
                  <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                    Coming Soon
                  </Badge>
                </div>
                
                <div className="p-6 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/20 text-center">
                  <Package className="h-10 w-10 text-purple-500/30 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">
                    New set releases and product drops
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Stay tuned for upcoming releases!
                  </p>
                </div>
              </motion.section>
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-4" />
        </main>
      </PageTransition>
      <BottomNav />
    </div>
  );
};

export default MarketTrends;
