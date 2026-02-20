/**
 * Sealed Product Search & Tracking
 * 
 * Enhanced sealed product functionality:
 * - Search booster boxes, ETBs, collection boxes
 * - Expected Value (EV) calculator
 * - Price history for sealed
 * - Open or Hold recommendations
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Box,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  Sparkles,
  Info,
  Plus,
  Heart,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Gift,
  Boxes,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface SealedProduct {
  id: string;
  name: string;
  setName: string;
  type: 'booster-box' | 'etb' | 'collection-box' | 'blister' | 'tin' | 'premium';
  packCount: number;
  cardsPerPack: number;
  msrp: number;
  marketPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  expectedValue?: number;
  pullRates?: PullRates;
  imageUrl?: string;
  releaseDate?: string;
  inStock?: boolean;
}

interface PullRates {
  hitRate: number; // % chance of valuable pull per pack
  ultraRareRate: number;
  secretRareRate: number;
  avgValuePull: number;
}

interface SealedProductSearchProps {
  onAddToInventory?: (product: SealedProduct) => void;
  onAddToWishlist?: (product: SealedProduct) => void;
  className?: string;
}

// ============================================
// Mock Data
// ============================================

const SEALED_PRODUCTS: SealedProduct[] = [
  {
    id: '1',
    name: 'Surging Sparks Booster Box',
    setName: 'Surging Sparks',
    type: 'booster-box',
    packCount: 36,
    cardsPerPack: 10,
    msrp: 144,
    marketPrice: 135,
    priceChange24h: -2.5,
    priceChange7d: 5.2,
    expectedValue: 162,
    pullRates: { hitRate: 33, ultraRareRate: 8, secretRareRate: 2, avgValuePull: 15 },
  },
  {
    id: '2',
    name: 'Prismatic Evolutions Elite Trainer Box',
    setName: 'Prismatic Evolutions',
    type: 'etb',
    packCount: 9,
    cardsPerPack: 10,
    msrp: 60,
    marketPrice: 120,
    priceChange24h: 8.3,
    priceChange7d: 25.0,
    expectedValue: 95,
    pullRates: { hitRate: 40, ultraRareRate: 12, secretRareRate: 3, avgValuePull: 18 },
  },
  {
    id: '3',
    name: '151 Booster Box (Japanese)',
    setName: 'Pokemon Card 151',
    type: 'booster-box',
    packCount: 20,
    cardsPerPack: 7,
    msrp: 70,
    marketPrice: 185,
    priceChange24h: -1.2,
    priceChange7d: -5.0,
    expectedValue: 210,
    pullRates: { hitRate: 50, ultraRareRate: 15, secretRareRate: 5, avgValuePull: 25 },
  },
  {
    id: '4',
    name: 'Evolving Skies Booster Box',
    setName: 'Evolving Skies',
    type: 'booster-box',
    packCount: 36,
    cardsPerPack: 10,
    msrp: 144,
    marketPrice: 320,
    priceChange24h: 1.5,
    priceChange7d: 8.0,
    expectedValue: 280,
    pullRates: { hitRate: 28, ultraRareRate: 6, secretRareRate: 2, avgValuePull: 35 },
  },
  {
    id: '5',
    name: 'Crown Zenith Elite Trainer Box',
    setName: 'Crown Zenith',
    type: 'etb',
    packCount: 10,
    cardsPerPack: 10,
    msrp: 50,
    marketPrice: 75,
    priceChange24h: 0,
    priceChange7d: -3.0,
    expectedValue: 68,
    pullRates: { hitRate: 35, ultraRareRate: 10, secretRareRate: 3, avgValuePull: 12 },
  },
  {
    id: '6',
    name: 'Lost Origin Booster Box',
    setName: 'Lost Origin',
    type: 'booster-box',
    packCount: 36,
    cardsPerPack: 10,
    msrp: 144,
    marketPrice: 125,
    priceChange24h: -0.5,
    priceChange7d: 2.0,
    expectedValue: 145,
    pullRates: { hitRate: 30, ultraRareRate: 7, secretRareRate: 2, avgValuePull: 18 },
  },
];

// ============================================
// EV Calculator
// ============================================

function calculateOpenVsHold(product: SealedProduct): {
  recommendation: 'open' | 'hold' | 'flip';
  confidence: number;
  reasoning: string;
  evRatio: number;
  projectedGrowth: number;
} {
  const evRatio = (product.expectedValue || 0) / product.marketPrice;
  const priceAboveMsrp = (product.marketPrice - product.msrp) / product.msrp;
  const projectedGrowth = product.priceChange7d * 4; // Rough monthly projection
  
  let recommendation: 'open' | 'hold' | 'flip';
  let confidence: number;
  let reasoning: string;
  
  if (evRatio >= 1.2) {
    recommendation = 'open';
    confidence = Math.min(90, 60 + (evRatio - 1) * 50);
    reasoning = `Expected value ($${product.expectedValue}) is ${Math.round((evRatio - 1) * 100)}% higher than market price. Good odds for profit if you open.`;
  } else if (priceAboveMsrp > 0.5 && projectedGrowth < 10) {
    recommendation = 'flip';
    confidence = 70;
    reasoning = `Price is ${Math.round(priceAboveMsrp * 100)}% above MSRP with slowing growth. Consider selling now.`;
  } else if (projectedGrowth > 15) {
    recommendation = 'hold';
    confidence = Math.min(85, 50 + projectedGrowth);
    reasoning = `Strong growth trend (+${projectedGrowth.toFixed(1)}% projected monthly). Hold for appreciation.`;
  } else if (evRatio < 0.85) {
    recommendation = 'hold';
    confidence = 60;
    reasoning = `EV below market price. Opening is -EV. Hold for price appreciation.`;
  } else {
    recommendation = 'open';
    confidence = 55;
    reasoning = `EV roughly matches market price. Open for the experience or hold - your call.`;
  }
  
  return { recommendation, confidence, reasoning, evRatio, projectedGrowth };
}

// ============================================
// Components
// ============================================

const ProductTypeIcon = ({ type }: { type: SealedProduct['type'] }) => {
  switch (type) {
    case 'booster-box': return <Boxes className="h-4 w-4" />;
    case 'etb': return <Box className="h-4 w-4" />;
    case 'collection-box': return <Gift className="h-4 w-4" />;
    case 'blister': return <Package className="h-4 w-4" />;
    case 'tin': return <ShoppingBag className="h-4 w-4" />;
    case 'premium': return <Sparkles className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

const SealedProductCard = ({
  product,
  onAdd,
  onWishlist,
  onViewDetails,
}: {
  product: SealedProduct;
  onAdd?: () => void;
  onWishlist?: () => void;
  onViewDetails?: () => void;
}) => {
  const analysis = useMemo(() => calculateOpenVsHold(product), [product]);
  
  const recommendationColors = {
    open: 'text-green-500 bg-green-500/10',
    hold: 'text-blue-500 bg-blue-500/10',
    flip: 'text-orange-500 bg-orange-500/10',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/50 overflow-hidden hover:border-primary/30 transition-colors"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ProductTypeIcon type={product.type} />
            </div>
            <div>
              <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
              <p className="text-xs text-muted-foreground">{product.setName}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {product.packCount} packs
          </Badge>
        </div>
        
        {/* Pricing */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted/20 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Market</p>
            <p className="font-bold">${product.marketPrice}</p>
            <div className={cn(
              "text-xs flex items-center gap-1",
              product.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {product.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {product.priceChange24h >= 0 ? '+' : ''}{product.priceChange24h}%
            </div>
          </div>
          
          <div className="bg-muted/20 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Est. EV</p>
            <p className={cn(
              "font-bold",
              (product.expectedValue || 0) > product.marketPrice ? "text-green-500" : "text-muted-foreground"
            )}>
              ${product.expectedValue || '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {analysis.evRatio >= 1 ? '+' : ''}{Math.round((analysis.evRatio - 1) * 100)}% vs price
            </p>
          </div>
        </div>
        
        {/* Recommendation */}
        <div className={cn(
          "rounded-lg p-2 mb-3",
          recommendationColors[analysis.recommendation]
        )}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium capitalize">
              {analysis.recommendation === 'open' ? '🎲 Open It' : 
               analysis.recommendation === 'hold' ? '📦 Hold It' : '💰 Flip It'}
            </span>
            <span className="text-xs opacity-75">{analysis.confidence}% confidence</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={onWishlist}
          >
            <Heart className="h-3 w-3 mr-1" />
            Watch
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={onAdd}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================

export const SealedProductSearch = ({
  onAddToInventory,
  onAddToWishlist,
  className,
}: SealedProductSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<SealedProduct | null>(null);
  
  // Filter products
  const filteredProducts = useMemo(() => {
    return SEALED_PRODUCTS.filter(product => {
      const matchesSearch = searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.setName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'all' || product.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);
  
  // Product types for filter
  const productTypes = [
    { value: 'all', label: 'All' },
    { value: 'booster-box', label: 'Booster Box' },
    { value: 'etb', label: 'ETB' },
    { value: 'collection-box', label: 'Collection' },
    { value: 'blister', label: 'Blister' },
    { value: 'tin', label: 'Tin' },
  ];
  
  return (
    <div className={className}>
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sealed products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-1 overflow-x-auto pb-1">
          {productTypes.map(type => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type.value)}
              className="text-xs whitespace-nowrap"
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <SealedProductCard
            key={product.id}
            product={product}
            onAdd={() => onAddToInventory?.(product)}
            onWishlist={() => onAddToWishlist?.(product)}
            onViewDetails={() => setSelectedProduct(product)}
          />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No sealed products found</p>
        </div>
      )}
      
      {/* EV Info Card */}
      <Card className="mt-6 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Understanding Expected Value (EV)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">EV (Expected Value)</strong> estimates what you'd 
            get on average if you opened the product and sold every card.
          </p>
          <p>
            <strong className="text-foreground">EV &gt; Price:</strong> Statistically profitable to open
          </p>
          <p>
            <strong className="text-foreground">EV &lt; Price:</strong> Better to hold sealed or flip
          </p>
          <p className="italic">
            Note: EV is an average - individual results vary wildly based on luck!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SealedProductSearch;
