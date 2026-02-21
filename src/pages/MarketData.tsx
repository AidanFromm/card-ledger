import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Flame, DollarSign, Clock, RefreshCw,
  ArrowUpRight, ArrowDownRight, Package, Star, Sparkles, Filter,
  Search, Bell, BellRing, BellOff, Plus, Trash2, Edit2, AlertTriangle,
  ChevronRight, LineChart, BarChart3, Newspaper, ExternalLink, X,
  ArrowUp, ArrowDown, Layers, Target, Activity, Zap
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import BottomNav from "@/components/BottomNav";
import CardImage from "@/components/CardImage";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketTrends, TrendingCard, PriceMover, RecentSale, useRecordActivity } from "@/hooks/useMarketTrends";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { usePriceAlerts, PriceAlert } from "@/hooks/usePriceAlerts";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart as RechartsLineChart, Line, BarChart, Bar, Cell
} from "recharts";

// Category filter options
const TCG_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'mtg', label: 'MTG' },
  { value: 'sports', label: 'Sports' },
  { value: 'vintage', label: 'Vintage' },
];

const TIME_RANGES = ['24h', '7d', '30d'] as const;
type TimeRange = typeof TIME_RANGES[number];

// Mock market indices data (would come from API in production)
const generateMockIndexData = (baseValue: number, volatility: number, trend: number) => {
  const data = [];
  let value = baseValue - (30 * trend * 0.3);
  for (let i = 30; i >= 0; i--) {
    const change = (Math.random() - 0.4) * volatility + trend;
    value = Math.max(0, value + change);
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: parseFloat(value.toFixed(2)),
    });
  }
  return data;
};

// Skeleton Loaders
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
const HotCard = ({ card, index, onClick }: { card: TrendingCard; index: number; onClick?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.03, y: -4 }}
    onClick={onClick}
    className="flex-shrink-0 w-[140px] relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 cursor-pointer hover:shadow-lg hover:shadow-amber-500/10 transition-all"
  >
    <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center">
      <Flame className="h-3.5 w-3.5 text-amber-400" />
    </div>
    
    <div className="w-full h-[100px] bg-zinc-800/50 relative">
      <CardImage 
        src={card.card_image_url} 
        alt={card.card_name}
        size="md"
        containerClassName="w-full h-full p-2"
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
    
    <div className="p-3">
      <p className="text-xs font-semibold text-white truncate leading-tight">
        {card.card_name}
      </p>
      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
        {card.set_name || 'Unknown Set'}
      </p>
      
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
const MoverCard = ({ mover, index, type, onClick }: { mover: PriceMover; index: number; type: 'gainer' | 'loser'; onClick?: () => void }) => {
  const isGainer = type === 'gainer';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ scale: 1.03, y: -3 }}
      onClick={onClick}
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
      <div className={`
        absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
        ${isGainer ? 'bg-navy-500/20 text-navy-400' : 'bg-red-500/20 text-red-400'}
      `}>
        #{index + 1}
      </div>
      
      <div className="w-full h-[80px] rounded-xl overflow-hidden bg-zinc-800/50 mb-2">
        <CardImage 
          src={mover.card_image_url} 
          alt={mover.item_name}
          size="md"
          rounded="xl"
          containerClassName="w-full h-full"
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
      
      <p className="text-xs font-semibold text-white truncate mb-0.5">
        {mover.item_name}
      </p>
      <p className="text-[10px] text-zinc-500 truncate mb-2">
        {mover.set_name}
      </p>
      
      {mover.grade && mover.grading_company && mover.grading_company.toLowerCase() !== 'raw' && (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 mb-2 border-amber-500/30 text-amber-400">
          {mover.grading_company} {mover.grade}
        </Badge>
      )}
      
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
      
      <p className={`text-[10px] mt-1 ${isGainer ? 'text-navy-400/70' : 'text-red-400/70'}`}>
        {isGainer ? '+' : ''}${mover.price_change.toFixed(2)}
      </p>
    </motion.div>
  );
};

// Hot Set Card Component
interface HotSet {
  name: string;
  category: string;
  avgChange: number;
  volume: number;
  cardCount: number;
  imageUrl?: string;
}

const HotSetCard = ({ set, index }: { set: HotSet; index: number }) => {
  const isPositive = set.avgChange >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/30 hover:bg-zinc-800/50 transition-colors cursor-pointer"
    >
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
        <Layers className="h-6 w-6 text-purple-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{set.name}</p>
        <p className="text-[11px] text-zinc-500">{set.cardCount} cards • {set.category}</p>
      </div>
      
      <div className="text-right flex-shrink-0">
        <div className={`flex items-center gap-1 ${isPositive ? 'text-navy-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          <span className="text-sm font-bold">{Math.abs(set.avgChange).toFixed(1)}%</span>
        </div>
        <p className="text-[10px] text-zinc-500">{set.volume} trades</p>
      </div>
    </motion.div>
  );
};

// Market Index Card Component
interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  data: Array<{ date: string; value: number }>;
  icon: React.ElementType;
  color: string;
}

const MarketIndexCard = ({ index: marketIndex, onClick }: { index: MarketIndex; onClick?: () => void }) => {
  const isPositive = marketIndex.change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 border cursor-pointer transition-all ${
        isPositive 
          ? 'bg-gradient-to-br from-navy-500/5 to-transparent border-navy-500/20' 
          : 'bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${marketIndex.color}`}>
            <marketIndex.icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-white">{marketIndex.name}</span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
          isPositive ? 'bg-navy-500/20 text-navy-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(marketIndex.changePercent).toFixed(2)}%
        </div>
      </div>
      
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-white">${marketIndex.value.toFixed(2)}</span>
        <span className={`text-sm ${isPositive ? 'text-navy-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}${marketIndex.change.toFixed(2)}
        </span>
      </div>
      
      {/* Mini Chart */}
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={marketIndex.data.slice(-14)}>
            <defs>
              <linearGradient id={`gradient-${marketIndex.name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#627d98' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? '#627d98' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isPositive ? '#627d98' : '#ef4444'} 
              strokeWidth={2}
              fill={`url(#gradient-${marketIndex.name})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

// Search Result Card Component
interface SearchResult {
  id: string;
  name: string;
  setName: string;
  imageUrl?: string;
  rawPrice: number;
  gradedPrices: {
    psa10: number;
    psa9: number;
    bgs10: number;
    cgc10: number;
  };
  priceHistory: Array<{ date: string; price: number }>;
  thirtyDayHigh: number;
  thirtyDayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  recentSales: Array<{
    date: string;
    price: number;
    platform: string;
    condition: string;
  }>;
}

// Card Detail Panel Component
const CardDetailPanel = ({ 
  card, 
  onClose, 
  onCreateAlert 
}: { 
  card: SearchResult | null; 
  onClose: () => void;
  onCreateAlert: (card: SearchResult) => void;
}) => {
  if (!card) return null;
  
  const priceChangePercent = card.priceHistory.length >= 2 
    ? ((card.rawPrice - card.priceHistory[0].price) / card.priceHistory[0].price) * 100 
    : 0;
  const isPositive = priceChangePercent >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
    >
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {card.imageUrl && (
            <CardImage 
              src={card.imageUrl} 
              alt={card.name} 
              size="lg"
              rounded="md"
              containerClassName="w-12 h-16"
              className="w-full h-full object-contain" 
            />
          )}
          <div>
            <h3 className="font-bold text-white">{card.name}</h3>
            <p className="text-sm text-zinc-400">{card.setName}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Current Price */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Raw Market Price</p>
            <span className="text-3xl font-bold text-white">${card.rawPrice.toFixed(2)}</span>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
            isPositive ? 'bg-navy-500/20 text-navy-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(priceChangePercent).toFixed(2)}%
          </div>
        </div>
        
        {/* Graded Prices */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-400 mb-3">Graded Prices</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'PSA 10', value: card.gradedPrices.psa10 },
              { label: 'PSA 9', value: card.gradedPrices.psa9 },
              { label: 'BGS 10', value: card.gradedPrices.bgs10 },
              { label: 'CGC 10', value: card.gradedPrices.cgc10 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="text-lg font-bold text-white">${value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Price Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">30-Day Range</p>
            <div className="flex justify-between text-sm">
              <span className="text-red-400">${card.thirtyDayLow.toFixed(2)}</span>
              <span className="text-navy-400">${card.thirtyDayHigh.toFixed(2)}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ 
                  width: `${((card.rawPrice - card.thirtyDayLow) / (card.thirtyDayHigh - card.thirtyDayLow)) * 100}%` 
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">52-Week Range</p>
            <div className="flex justify-between text-sm">
              <span className="text-red-400">${card.fiftyTwoWeekLow.toFixed(2)}</span>
              <span className="text-navy-400">${card.fiftyTwoWeekHigh.toFixed(2)}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ 
                  width: `${((card.rawPrice - card.fiftyTwoWeekLow) / (card.fiftyTwoWeekHigh - card.fiftyTwoWeekLow)) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Price History Chart */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-400 mb-3">Price History</h4>
          <div className="h-32 bg-zinc-800/30 rounded-xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={card.priceHistory}>
                <defs>
                  <linearGradient id="searchCardGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? '#627d98' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={isPositive ? '#627d98' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                        <p className="text-sm font-bold text-white">${payload[0].value}</p>
                        <p className="text-xs text-zinc-400">{payload[0].payload.date}</p>
                      </div>
                    );
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? '#627d98' : '#ef4444'}
                  strokeWidth={2}
                  fill="url(#searchCardGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Sales */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-400 mb-3">Recent Sales</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {card.recentSales.map((sale, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">${sale.price.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-500">{sale.condition}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">{sale.platform}</p>
                  <p className="text-[10px] text-zinc-500">{sale.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onCreateAlert(card)}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Bell className="h-4 w-4 mr-2" />
            Set Alert
          </Button>
          <Button variant="outline" className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Add to Inventory
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Alert Management Card
const AlertCard = ({ 
  alert, 
  onToggle, 
  onDelete,
  onEdit 
}: { 
  alert: PriceAlert; 
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) => {
  const isTriggered = !!alert.triggered_at;
  const isPaused = !alert.is_active;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`relative p-3 rounded-xl border transition-all ${
        isTriggered
          ? 'bg-amber-500/10 border-amber-500/40'
          : isPaused
            ? 'bg-zinc-800/30 border-zinc-700/30 opacity-60'
            : 'bg-zinc-800/50 border-zinc-700/40'
      }`}
    >
      {isTriggered && (
        <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
          TRIGGERED
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <CardImage 
          src={alert.card_image_url} 
          alt={alert.card_name}
          size="sm"
          rounded="md"
          border
          borderColor="border-zinc-700"
          containerClassName="w-10 h-14"
          className="w-full h-full object-contain"
        />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{alert.card_name}</p>
          <div className="flex items-center gap-2 mt-1">
            {alert.direction === 'below' ? (
              <TrendingDown className="h-3 w-3 text-navy-400" />
            ) : (
              <TrendingUp className="h-3 w-3 text-amber-400" />
            )}
            <span className="text-xs text-zinc-400">
              {alert.direction} ${alert.target_price.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${alert.is_active ? 'text-primary' : 'text-zinc-500'}`}
            onClick={onToggle}
          >
            {alert.is_active ? <BellRing className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-400 hover:text-red-300"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Empty State Component
const EmptySection = ({ title, icon: Icon, description }: { title: string; icon: any; description?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-zinc-600" />
    </div>
    <p className="text-sm text-zinc-500">No {title.toLowerCase()} yet</p>
    <p className="text-xs text-zinc-600 mt-1">{description || 'Check back soon!'}</p>
  </div>
);

// Main Component
const MarketData = () => {
  const { trendingCards, gainers, losers, recentSales, loading, refetch } = useMarketTrends();
  const { items } = useInventoryDb();
  const { 
    alerts, 
    activeCount, 
    triggeredCount, 
    toggleAlert, 
    deleteAlert,
    createAlert,
    refetch: refetchAlerts 
  } = usePriceAlerts();
  const { recordActivity } = useRecordActivity();
  
  const [activeTab, setActiveTab] = useState<'trending' | 'search' | 'indices' | 'alerts' | 'news'>('trending');
  const [tcgFilter, setTcgFilter] = useState('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCard, setSelectedCard] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('below');
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [cardForAlert, setCardForAlert] = useState<SearchResult | null>(null);

  // Filter function
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
      case 'vintage':
        return true; // Would filter by year in production
      default:
        return true;
    }
  };

  // Generate user's inventory-based gainers/losers
  const { userGainers, userLosers } = useMemo(() => {
    if (gainers.length > 0 || losers.length > 0) {
      return { userGainers: gainers, userLosers: losers };
    }

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

  // Mock hot sets data
  const hotSets: HotSet[] = useMemo(() => [
    { name: 'Prismatic Evolutions', category: 'Pokémon', avgChange: 12.5, volume: 1234, cardCount: 186 },
    { name: 'Scarlet & Violet 151', category: 'Pokémon', avgChange: 8.3, volume: 892, cardCount: 207 },
    { name: '2024 Topps Chrome', category: 'Sports', avgChange: -2.1, volume: 567, cardCount: 300 },
    { name: 'Modern Horizons 3', category: 'MTG', avgChange: 5.7, volume: 445, cardCount: 303 },
    { name: 'Rage of the Abyss', category: 'Yu-Gi-Oh!', avgChange: 3.2, volume: 234, cardCount: 100 },
  ], []);

  // Market indices data
  const marketIndices: MarketIndex[] = useMemo(() => {
    const pokemonData = generateMockIndexData(245.67, 8, 2.5);
    const sportsData = generateMockIndexData(178.34, 12, -1.2);
    const vintageData = generateMockIndexData(892.45, 15, 4.8);
    
    // Calculate user's portfolio index
    const portfolioValue = items.reduce((sum, item) => sum + (item.market_price || 0) * item.quantity, 0);
    const portfolioData = generateMockIndexData(portfolioValue || 100, 5, 1.5);
    
    return [
      {
        name: 'Pokémon Index',
        value: pokemonData[pokemonData.length - 1].value,
        change: pokemonData[pokemonData.length - 1].value - pokemonData[pokemonData.length - 2].value,
        changePercent: ((pokemonData[pokemonData.length - 1].value - pokemonData[0].value) / pokemonData[0].value) * 100,
        data: pokemonData,
        icon: Sparkles,
        color: 'bg-amber-500/20 text-amber-400',
      },
      {
        name: 'Sports Index',
        value: sportsData[sportsData.length - 1].value,
        change: sportsData[sportsData.length - 1].value - sportsData[sportsData.length - 2].value,
        changePercent: ((sportsData[sportsData.length - 1].value - sportsData[0].value) / sportsData[0].value) * 100,
        data: sportsData,
        icon: Activity,
        color: 'bg-blue-500/20 text-blue-400',
      },
      {
        name: 'Vintage Index',
        value: vintageData[vintageData.length - 1].value,
        change: vintageData[vintageData.length - 1].value - vintageData[vintageData.length - 2].value,
        changePercent: ((vintageData[vintageData.length - 1].value - vintageData[0].value) / vintageData[0].value) * 100,
        data: vintageData,
        icon: Clock,
        color: 'bg-purple-500/20 text-purple-400',
      },
      {
        name: 'My Portfolio',
        value: portfolioData[portfolioData.length - 1].value,
        change: portfolioData[portfolioData.length - 1].value - portfolioData[portfolioData.length - 2].value,
        changePercent: ((portfolioData[portfolioData.length - 1].value - portfolioData[0].value) / portfolioData[0].value) * 100,
        data: portfolioData,
        icon: Target,
        color: 'bg-navy-500/20 text-navy-400',
      },
    ];
  }, [items]);

  // Mock search function
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    recordActivity(searchQuery, 'search');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate mock results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        name: searchQuery,
        setName: 'Base Set',
        imageUrl: 'https://images.pokemontcg.io/base1/4.png',
        rawPrice: 125.00,
        gradedPrices: { psa10: 450.00, psa9: 220.00, bgs10: 650.00, cgc10: 380.00 },
        priceHistory: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: 100 + Math.random() * 50,
        })),
        thirtyDayHigh: 148.50,
        thirtyDayLow: 98.25,
        fiftyTwoWeekHigh: 210.00,
        fiftyTwoWeekLow: 75.00,
        recentSales: [
          { date: '2024-02-10', price: 128.50, platform: 'eBay', condition: 'Near Mint' },
          { date: '2024-02-08', price: 121.00, platform: 'TCGplayer', condition: 'Lightly Played' },
          { date: '2024-02-05', price: 135.00, platform: 'eBay', condition: 'Mint' },
        ],
      },
    ];
    
    setSearchResults(mockResults);
    setIsSearching(false);
  }, [searchQuery, recordActivity]);

  // Handle alert creation
  const handleCreateAlert = useCallback((card: SearchResult) => {
    setCardForAlert(card);
    setAlertTargetPrice(card.rawPrice.toFixed(2));
    setAlertDialogOpen(true);
  }, []);

  const submitAlert = useCallback(async () => {
    if (!cardForAlert || !alertTargetPrice) return;
    
    await createAlert({
      card_id: cardForAlert.id,
      card_name: cardForAlert.name,
      set_name: cardForAlert.setName,
      card_image_url: cardForAlert.imageUrl,
      current_price: cardForAlert.rawPrice,
      target_price: parseFloat(alertTargetPrice),
      direction: alertDirection,
    });
    
    setAlertDialogOpen(false);
    setCardForAlert(null);
    setAlertTargetPrice('');
  }, [cardForAlert, alertTargetPrice, alertDirection, createAlert]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-safe pt-safe">
      <Navbar />
        <div className="flex">
          <DesktopSidebar />
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
                <LineChart className="h-6 w-6 text-primary" />
                Market Data
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Real-time trends, prices & insights
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refetch();
                refetchAlerts();
              }}
              disabled={loading}
              className="gap-1.5 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="bg-zinc-800/50 p-1 h-auto flex-wrap">
                <TabsTrigger value="trending" className="gap-1.5 data-[state=active]:bg-primary/20">
                  <Flame className="h-4 w-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="search" className="gap-1.5 data-[state=active]:bg-primary/20">
                  <Search className="h-4 w-4" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="indices" className="gap-1.5 data-[state=active]:bg-primary/20">
                  <BarChart3 className="h-4 w-4" />
                  Indices
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1.5 data-[state=active]:bg-primary/20 relative">
                  <Bell className="h-4 w-4" />
                  Alerts
                  {activeCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-bold flex items-center justify-center text-white">
                      {activeCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="news" className="gap-1.5 data-[state=active]:bg-primary/20">
                  <Newspaper className="h-4 w-4" />
                  News
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* TRENDING TAB */}
          {activeTab === 'trending' && (
            <div className="space-y-8">
              {/* Time Range + Filter */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-0.5">
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                        timeRange === range 
                          ? 'bg-white/10 text-white' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {TCG_FILTERS.map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setTcgFilter(filter.value)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                        tcgFilter === filter.value 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                      }`}
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
                <>
                  {/* Hot Cards */}
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

                  {/* Biggest Gainers */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-1.5 rounded-lg bg-navy-500/15">
                        <TrendingUp className="h-4 w-4 text-navy-400" />
                      </div>
                      <h2 className="text-base font-semibold text-white">Top Gainers</h2>
                      <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                        {timeRange}
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

                  {/* Biggest Losers */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-1.5 rounded-lg bg-red-500/15">
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      </div>
                      <h2 className="text-base font-semibold text-white">Top Losers</h2>
                      <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                        {timeRange}
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

                  {/* Hot Sets */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-1.5 rounded-lg bg-purple-500/15">
                        <Layers className="h-4 w-4 text-purple-400" />
                      </div>
                      <h2 className="text-base font-semibold text-white">Hot Sets</h2>
                      <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                        Trending
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {hotSets.map((set, index) => (
                        <HotSetCard key={set.name} set={set} index={index} />
                      ))}
                    </div>
                  </motion.section>
                </>
              )}
            </div>
          )}

          {/* SEARCH TAB */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  placeholder="Search any card..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 pr-20 h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8"
                >
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </motion.div>

              {/* Selected Card Detail or Search Results */}
              <AnimatePresence mode="wait">
                {selectedCard ? (
                  <CardDetailPanel
                    key="detail"
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                    onCreateAlert={handleCreateAlert}
                  />
                ) : searchResults.length > 0 ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-zinc-400">{searchResults.length} results found</p>
                    {searchResults.map((result) => (
                      <motion.div
                        key={result.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedCard(result)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 cursor-pointer hover:border-primary/30 transition-all"
                      >
                        {result.imageUrl && (
                          <CardImage 
                            src={result.imageUrl} 
                            alt={result.name}
                            size="lg"
                            rounded="md"
                            containerClassName="w-12 h-16"
                            className="w-full h-full object-contain"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{result.name}</h3>
                          <p className="text-sm text-zinc-400">{result.setName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">${result.rawPrice.toFixed(2)}</p>
                          <p className="text-xs text-zinc-500">Raw</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-500" />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800/50 flex items-center justify-center">
                      <Search className="h-10 w-10 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Search Any Card</h3>
                    <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                      Get detailed price info, graded values, price history, and recent sales
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* INDICES TAB */}
          {activeTab === 'indices' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {marketIndices.map((index, i) => (
                  <motion.div
                    key={index.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <MarketIndexCard index={index} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Market Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/30"
              >
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Market Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">24h Volume</p>
                    <p className="text-lg font-bold text-white">$2.4M</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Active Listings</p>
                    <p className="text-lg font-bold text-white">156K</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Avg. Sale Price</p>
                    <p className="text-lg font-bold text-white">$48.50</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Market Trend</p>
                    <p className="text-lg font-bold text-navy-400 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Bullish
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Alert Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <BellRing className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-amber-400">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{activeCount}</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-navy-500/10 border border-navy-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-navy-400" />
                    <span className="text-xs text-navy-400">Triggered</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{triggeredCount}</p>
                </div>
              </motion.div>

              {/* Alerts List */}
              {alerts.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <AnimatePresence>
                    {alerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onToggle={() => toggleAlert(alert.id)}
                        onDelete={() => deleteAlert(alert.id)}
                        onEdit={() => {
                          // Could open edit dialog
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Bell className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Price Alerts</h3>
                  <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-6">
                    Set alerts on cards to get notified when prices hit your targets
                  </p>
                  <Button
                    onClick={() => setActiveTab('search')}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Cards
                  </Button>
                </motion.div>
              )}
            </div>
          )}

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Coming Soon Placeholder */}
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Newspaper className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Market News & Updates</h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-6">
                  Stay updated with the latest market news, new set releases, and industry updates
                </p>
                <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                  Coming Soon
                </Badge>
              </div>

              {/* Placeholder News Cards */}
              <div className="space-y-3 opacity-50 pointer-events-none">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-zinc-700/50" />
                      <div className="flex-1">
                        <div className="h-4 w-3/4 bg-zinc-700/50 rounded mb-2" />
                        <div className="h-3 w-1/2 bg-zinc-700/50 rounded mb-2" />
                        <div className="h-3 w-1/4 bg-zinc-700/50 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="h-4" />
        </main>
      </PageTransition>
      </div>
      <BottomNav />

      {/* Create Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create Price Alert</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Get notified when {cardForAlert?.name} hits your target price
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Alert Direction</Label>
              <Select value={alertDirection} onValueChange={(v) => setAlertDirection(v as 'above' | 'below')}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="below">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-navy-400" />
                      Price drops below
                    </div>
                  </SelectItem>
                  <SelectItem value="above">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-400" />
                      Price rises above
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-300">Target Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type="number"
                  step="0.01"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                  className="pl-9 bg-zinc-800 border-zinc-700"
                  placeholder="0.00"
                />
              </div>
              {cardForAlert && (
                <p className="text-xs text-zinc-500">
                  Current price: ${cardForAlert.rawPrice.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitAlert}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketData;
