/**
 * Smart Recommendations Component
 * 
 * Analyzes user's collection and suggests:
 * - Cards to complete sets
 * - Similar cards they might like
 * - Hot cards in their price range
 * - Undervalued gems
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Target,
  Gem,
  RefreshCw,
  Plus,
  Heart,
  ChevronRight,
  Layers,
  DollarSign,
  Star,
  Lightbulb,
  Shuffle,
  Crown,
  Flame,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import CardImage from '@/components/CardImage';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

// ============================================
// Types
// ============================================

export interface Recommendation {
  id: string;
  type: 'set-completion' | 'similar' | 'trending' | 'undervalued' | 'budget-friendly';
  title: string;
  description: string;
  card: RecommendedCard;
  reason: string;
  confidence: number; // 0-100
  priority: number; // 1-5, higher = more important
}

interface RecommendedCard {
  name: string;
  setName: string;
  cardNumber?: string;
  imageUrl?: string;
  estimatedPrice: number;
  category: string;
}

interface SmartRecommendationsProps {
  inventory: InventoryItem[];
  className?: string;
  maxItems?: number;
  onAddToWishlist?: (card: RecommendedCard) => void;
  onAddToInventory?: (card: RecommendedCard) => void;
}

// ============================================
// Recommendation Engine
// ============================================

function analyzeCollection(inventory: InventoryItem[]): {
  favoriteSet: string | null;
  averagePrice: number;
  preferredCategory: 'raw' | 'graded';
  topArtists: string[];
  setProgress: Map<string, { owned: number; total: number }>;
  priceRange: { min: number; max: number };
} {
  if (inventory.length === 0) {
    return {
      favoriteSet: null,
      averagePrice: 50,
      preferredCategory: 'raw',
      topArtists: [],
      setProgress: new Map(),
      priceRange: { min: 5, max: 100 },
    };
  }
  
  // Analyze sets
  const setCounts = new Map<string, number>();
  inventory.forEach(item => {
    const count = setCounts.get(item.set_name) || 0;
    setCounts.set(item.set_name, count + (item.quantity || 1));
  });
  const favoriteSet = [...setCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  // Average price
  const prices = inventory.map(i => i.market_price || i.purchase_price || 0).filter(p => p > 0);
  const averagePrice = prices.length > 0 
    ? prices.reduce((a, b) => a + b, 0) / prices.length 
    : 50;
  
  // Category preference
  const graded = inventory.filter(i => i.grading_company !== 'raw').length;
  const raw = inventory.length - graded;
  const preferredCategory = graded > raw ? 'graded' : 'raw';
  
  // Price range
  const sortedPrices = prices.sort((a, b) => a - b);
  const priceRange = {
    min: sortedPrices[0] || 5,
    max: sortedPrices[sortedPrices.length - 1] || 100,
  };
  
  return {
    favoriteSet,
    averagePrice,
    preferredCategory,
    topArtists: [], // Would need artist data
    setProgress: setCounts as any,
    priceRange,
  };
}

// Mock card database for recommendations
const POPULAR_CARDS: RecommendedCard[] = [
  { name: 'Charizard ex', setName: '151', cardNumber: '6/165', estimatedPrice: 85, category: 'raw', imageUrl: '' },
  { name: 'Pikachu VMAX', setName: 'Vivid Voltage', cardNumber: '44/185', estimatedPrice: 45, category: 'raw', imageUrl: '' },
  { name: 'Umbreon VMAX (Alt Art)', setName: 'Evolving Skies', cardNumber: '215/203', estimatedPrice: 350, category: 'raw', imageUrl: '' },
  { name: 'Mew ex', setName: '151', cardNumber: '151/165', estimatedPrice: 120, category: 'raw', imageUrl: '' },
  { name: 'Mewtwo ex', setName: '151', cardNumber: '150/165', estimatedPrice: 75, category: 'raw', imageUrl: '' },
  { name: 'Gengar ex', setName: '151', cardNumber: '94/165', estimatedPrice: 40, category: 'raw', imageUrl: '' },
  { name: 'Rayquaza VMAX (Alt Art)', setName: 'Evolving Skies', cardNumber: '218/203', estimatedPrice: 280, category: 'raw', imageUrl: '' },
  { name: 'Moonbreon (Umbreon V Alt)', setName: 'Evolving Skies', cardNumber: '188/203', estimatedPrice: 200, category: 'raw', imageUrl: '' },
  { name: 'Blastoise ex', setName: '151', cardNumber: '9/165', estimatedPrice: 55, category: 'raw', imageUrl: '' },
  { name: 'Lugia V (Alt Art)', setName: 'Silver Tempest', cardNumber: '186/195', estimatedPrice: 150, category: 'raw', imageUrl: '' },
  { name: 'Giratina V (Alt Art)', setName: 'Lost Origin', cardNumber: '186/196', estimatedPrice: 120, category: 'raw', imageUrl: '' },
  { name: 'Dragonite V (Alt Art)', setName: 'Pokemon GO', cardNumber: '76/78', estimatedPrice: 90, category: 'raw', imageUrl: '' },
];

function generateRecommendations(
  inventory: InventoryItem[],
  maxItems: number = 6
): Recommendation[] {
  const analysis = analyzeCollection(inventory);
  const recommendations: Recommendation[] = [];
  const ownedNames = new Set(inventory.map(i => i.name.toLowerCase()));
  
  // 1. Set Completion recommendations
  if (analysis.favoriteSet) {
    const setCards = POPULAR_CARDS.filter(c => 
      c.setName === analysis.favoriteSet && 
      !ownedNames.has(c.name.toLowerCase())
    );
    setCards.slice(0, 2).forEach(card => {
      recommendations.push({
        id: `set-${card.name}`,
        type: 'set-completion',
        title: 'Complete Your Set',
        description: `Add to your ${analysis.favoriteSet} collection`,
        card,
        reason: `You own several ${analysis.favoriteSet} cards`,
        confidence: 85,
        priority: 5,
      });
    });
  }
  
  // 2. Budget-friendly recommendations
  const budgetCards = POPULAR_CARDS.filter(c => 
    c.estimatedPrice <= analysis.averagePrice * 1.5 &&
    c.estimatedPrice >= analysis.averagePrice * 0.3 &&
    !ownedNames.has(c.name.toLowerCase())
  );
  budgetCards.slice(0, 2).forEach(card => {
    recommendations.push({
      id: `budget-${card.name}`,
      type: 'budget-friendly',
      title: 'In Your Range',
      description: 'Matches your typical spending',
      card,
      reason: `Around your average price point of $${analysis.averagePrice.toFixed(0)}`,
      confidence: 75,
      priority: 3,
    });
  });
  
  // 3. Trending cards
  const trending = POPULAR_CARDS.filter(c => !ownedNames.has(c.name.toLowerCase()))
    .slice(0, 2);
  trending.forEach(card => {
    recommendations.push({
      id: `trending-${card.name}`,
      type: 'trending',
      title: 'Trending Now',
      description: 'Hot in the community',
      card,
      reason: 'Popular with collectors this week',
      confidence: 70,
      priority: 4,
    });
  });
  
  // 4. Undervalued gems
  const undervalued = POPULAR_CARDS.filter(c => 
    c.estimatedPrice < 100 && 
    !ownedNames.has(c.name.toLowerCase())
  ).slice(0, 2);
  undervalued.forEach(card => {
    recommendations.push({
      id: `gem-${card.name}`,
      type: 'undervalued',
      title: 'Hidden Gem',
      description: 'Potentially undervalued',
      card,
      reason: 'Low price relative to demand',
      confidence: 65,
      priority: 2,
    });
  });
  
  // Sort by priority and return top items
  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxItems);
}

// ============================================
// Recommendation Card Component
// ============================================

const RecommendationCard = ({
  rec,
  onAddToWishlist,
  onAddToInventory,
}: {
  rec: Recommendation;
  onAddToWishlist?: (card: RecommendedCard) => void;
  onAddToInventory?: (card: RecommendedCard) => void;
}) => {
  const typeConfig = {
    'set-completion': { icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    'similar': { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    'trending': { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    'undervalued': { icon: Gem, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    'budget-friendly': { icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
  };
  
  const config = typeConfig[rec.type];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 w-[280px] rounded-xl border border-border/50 bg-card/50 overflow-hidden hover:border-primary/30 transition-colors"
    >
      {/* Header */}
      <div className={cn("px-3 py-2 flex items-center gap-2", config.bg)}>
        <Icon className={cn("h-4 w-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>{rec.title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {rec.confidence}% match
        </Badge>
      </div>
      
      {/* Card Preview */}
      <div className="p-3">
        <div className="flex gap-3">
          <div className="w-16 h-22 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
            <CardImage
              src={rec.card.imageUrl}
              alt={rec.card.name}
              size="sm"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2">{rec.card.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{rec.card.setName}</p>
            <div className="flex items-center gap-1 mt-2">
              <DollarSign className="h-3 w-3 text-green-500" />
              <span className="text-sm font-semibold text-green-500">
                ${rec.card.estimatedPrice}
              </span>
            </div>
          </div>
        </div>
        
        {/* Reason */}
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
          💡 {rec.reason}
        </p>
        
        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {onAddToWishlist && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onAddToWishlist(rec.card)}
            >
              <Heart className="h-3 w-3 mr-1" />
              Watch
            </Button>
          )}
          {onAddToInventory && (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onAddToInventory(rec.card)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================

export const SmartRecommendations = ({
  inventory,
  className,
  maxItems = 6,
  onAddToWishlist,
  onAddToInventory,
}: SmartRecommendationsProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const recommendations = useMemo(
    () => generateRecommendations(inventory, maxItems),
    [inventory, maxItems, refreshKey]
  );
  
  const shuffle = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);
  
  if (recommendations.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border/50 p-6 text-center", className)}>
        <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <h3 className="font-medium">No recommendations yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add more cards to get personalized suggestions
        </p>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">For You</h3>
          <Badge variant="secondary" className="text-xs">
            AI Powered
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={shuffle}
          className="text-muted-foreground hover:text-foreground"
        >
          <Shuffle className="h-4 w-4 mr-1" />
          Shuffle
        </Button>
      </div>
      
      {/* Horizontal scroll of recommendations */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4">
          <AnimatePresence mode="popLayout">
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <RecommendationCard
                  rec={rec}
                  onAddToWishlist={onAddToWishlist}
                  onAddToInventory={onAddToInventory}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default SmartRecommendations;
