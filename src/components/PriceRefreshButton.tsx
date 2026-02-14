/**
 * Price Refresh Button Component
 * 
 * Shows a button to refresh prices with progress indicator.
 * Can be used in inventory header or as a floating action.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { usePriceRefresh, type InventoryItem, type PriceUpdate } from '@/hooks/usePriceRefresh';

// ============================================
// Props
// ============================================

interface PriceRefreshButtonProps {
  items: InventoryItem[];
  onRefreshComplete?: (updates: PriceUpdate[]) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

// ============================================
// Component
// ============================================

export function PriceRefreshButton({
  items,
  onRefreshComplete,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
}: PriceRefreshButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [updates, setUpdates] = useState<PriceUpdate[]>([]);
  const { refreshPrices, progress, loading, cancel } = usePriceRefresh();

  const handleRefresh = async () => {
    setShowDialog(true);
    const results = await refreshPrices(items);
    setUpdates(results);
    onRefreshComplete?.(results);
  };

  const handleClose = () => {
    if (loading) {
      cancel();
    }
    setShowDialog(false);
    setUpdates([]);
  };

  // Calculate summary stats
  const successful = updates.filter(u => u.source !== 'failed').length;
  const failed = updates.filter(u => u.source === 'failed').length;
  const priceChanges = updates.filter(u => u.change !== 0 && u.newPrice !== null);
  const totalChange = priceChanges.reduce((sum, u) => sum + u.change, 0);
  const gainers = priceChanges.filter(u => u.change > 0);
  const losers = priceChanges.filter(u => u.change < 0);

  const progressPercent = progress 
    ? (progress.completed / progress.total) * 100 
    : 0;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleRefresh}
        disabled={loading || items.length === 0}
        className={cn('gap-2', className)}
      >
        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        {showLabel && (
          <span>
            {loading ? 'Refreshing...' : `Refresh Prices${items.length > 0 ? ` (${items.length})` : ''}`}
          </span>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin text-primary')} />
              Price Refresh
            </DialogTitle>
            <DialogDescription>
              {loading 
                ? 'Updating card prices from market data...'
                : 'Price refresh complete'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Progress bar */}
            {loading && progress && (
              <div className="space-y-2">
                <Progress value={progressPercent} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {progress.completed} / {progress.total} cards
                  </span>
                  <span>
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              </div>
            )}

            {/* Results summary */}
            {!loading && updates.length > 0 && (
              <div className="space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold text-primary">
                      {successful}
                    </div>
                    <div className="text-xs text-muted-foreground">Updated</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className={cn(
                      'text-2xl font-bold',
                      totalChange >= 0 ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">$ Change</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {failed}
                    </div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>

                {/* Top movers */}
                {priceChanges.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Top Movers
                    </h4>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {priceChanges
                        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
                        .slice(0, 5)
                        .map((update, i) => (
                          <div
                            key={update.itemId}
                            className="flex items-center justify-between p-2 rounded-lg bg-secondary/20"
                          >
                            <div className="flex items-center gap-2">
                              {update.change > 0 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm truncate max-w-[150px]">
                                Card #{i + 1}
                              </span>
                            </div>
                            <span className={cn(
                              'text-sm font-medium',
                              update.change > 0 ? 'text-emerald-500' : 'text-red-500'
                            )}>
                              {update.change >= 0 ? '+' : ''}${update.change.toFixed(2)}
                              <span className="text-xs ml-1">
                                ({update.changePercent >= 0 ? '+' : ''}{update.changePercent.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Quick stats */}
                <div className="flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-1 text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                    <span>{gainers.length} up</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-500">
                    <TrendingDown className="h-4 w-4" />
                    <span>{losers.length} down</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Check className="h-4 w-4" />
                    <span>{updates.length - priceChanges.length} unchanged</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {loading ? (
              <Button variant="destructive" onClick={cancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            ) : (
              <Button onClick={handleClose}>
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PriceRefreshButton;
