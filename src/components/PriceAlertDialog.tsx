import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePriceAlerts, CreateAlertParams } from "@/hooks/usePriceAlerts";
import { Bell, BellRing, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PriceAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: {
    id: string;
    name: string;
    set_name?: string;
    card_image_url?: string | null;
    market_price?: number | null;
  };
  onAlertCreated?: () => void;
}

const PriceAlertDialog = ({ open, onOpenChange, card, onAlertCreated }: PriceAlertDialogProps) => {
  const { createAlert, hasAlert, loading: alertsLoading } = usePriceAlerts();
  const [direction, setDirection] = useState<'above' | 'below'>('below');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default target price based on market price
  useEffect(() => {
    if (open && card.market_price) {
      // Default: 10% below for "below" alerts, 10% above for "above" alerts
      const defaultPrice = direction === 'below' 
        ? card.market_price * 0.9 
        : card.market_price * 1.1;
      setTargetPrice(defaultPrice.toFixed(2));
    }
  }, [open, card.market_price, direction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice) return;

    setLoading(true);
    try {
      const params: CreateAlertParams = {
        card_id: card.id,
        card_name: card.name,
        set_name: card.set_name,
        card_image_url: card.card_image_url,
        current_price: card.market_price,
        target_price: parseFloat(targetPrice),
        direction,
      };

      const success = await createAlert(params);
      if (success) {
        onOpenChange(false);
        onAlertCreated?.();
        setTargetPrice('');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Quick price options based on market price
  const quickPrices = card.market_price ? (
    direction === 'below' 
      ? [
          { label: '-5%', value: card.market_price * 0.95 },
          { label: '-10%', value: card.market_price * 0.90 },
          { label: '-15%', value: card.market_price * 0.85 },
          { label: '-20%', value: card.market_price * 0.80 },
        ]
      : [
          { label: '+5%', value: card.market_price * 1.05 },
          { label: '+10%', value: card.market_price * 1.10 },
          { label: '+15%', value: card.market_price * 1.15 },
          { label: '+20%', value: card.market_price * 1.20 },
        ]
  ) : [];

  const alreadyHasAlert = hasAlert(card.id, direction);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md border-2 border-border/40 bg-card backdrop-blur-sm p-4 sm:p-6">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <BellRing className="h-5 w-5 text-amber-500" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Get notified when the price changes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Card Preview */}
          <div className="flex gap-3 p-3 bg-muted/30 border border-border/40 rounded-xl">
            {card.card_image_url && (
              <img
                src={card.card_image_url}
                alt={card.name}
                className="w-14 h-20 object-contain rounded-lg border border-border/40"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{card.name}</h3>
              {card.set_name && (
                <p className="text-xs text-muted-foreground truncate">{card.set_name}</p>
              )}
              {card.market_price && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground">Current Price: </span>
                  <span className="text-sm font-bold text-primary">${formatCurrency(card.market_price)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Direction Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Alert when price goes</Label>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                onClick={() => setDirection('below')}
                className={`relative p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                  direction === 'below'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-emerald-500/50'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <TrendingDown className="h-4 w-4" />
                <span className="font-semibold">Below</span>
                {direction === 'below' && (
                  <motion.div
                    layoutId="directionIndicator"
                    className="absolute inset-0 border-2 border-emerald-500 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setDirection('above')}
                className={`relative p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                  direction === 'above'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                    : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-amber-500/50'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">Above</span>
                {direction === 'above' && (
                  <motion.div
                    layoutId="directionIndicator"
                    className="absolute inset-0 border-2 border-amber-500 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            </div>
          </div>

          {/* Target Price Input */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice" className="text-sm font-semibold">Target Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                min="0"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                className="h-12 pl-7 text-lg font-bold"
                required
              />
            </div>
          </div>

          {/* Quick Price Buttons */}
          {quickPrices.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quickPrices.map((option) => {
                const isSelected = targetPrice === option.value.toFixed(2);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setTargetPrice(option.value.toFixed(2))}
                    className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? direction === 'below'
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-amber-500 text-white border-amber-500'
                        : direction === 'below'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:border-emerald-500/60'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:border-amber-500/60'
                    }`}
                  >
                    {option.label} · ${option.value.toFixed(2)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Alert Already Exists Warning */}
          <AnimatePresence>
            {alreadyHasAlert && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 text-sm"
              >
                <Bell className="h-4 w-4 inline mr-2" />
                You already have an active "{direction}" alert for this card.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary */}
          {targetPrice && !alreadyHasAlert && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border ${
                direction === 'below'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <p className="text-sm">
                <Bell className={`h-4 w-4 inline mr-1.5 ${
                  direction === 'below' ? 'text-emerald-500' : 'text-amber-500'
                }`} />
                You'll be notified when the price goes{' '}
                <span className="font-bold">{direction}</span>{' '}
                <span className="font-bold">${parseFloat(targetPrice).toFixed(2)}</span>
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-11 flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !targetPrice || alreadyHasAlert}
              className={`h-11 flex-1 font-semibold ${
                direction === 'below'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {loading ? (
                "Creating..."
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-1.5" />
                  Set Alert
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </DialogContent>
    </Dialog>
  );
};

export default PriceAlertDialog;
