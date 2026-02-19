import { useState } from "react";
import { X, GitCompareArrows, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";
import { motion } from "framer-motion";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

interface CompareCardsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  allItems: InventoryItem[];
}

export const CompareCards = ({ open, onOpenChange, items, allItems }: CompareCardsProps) => {
  const [compareItems, setCompareItems] = useState<InventoryItem[]>(items.slice(0, 3));
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  const removeItem = (id: string) => setCompareItems(prev => prev.filter(i => i.id !== id));
  const addItem = (item: InventoryItem) => {
    if (compareItems.length < 3 && !compareItems.find(i => i.id === item.id)) {
      setCompareItems(prev => [...prev, item]);
      setShowPicker(false);
      setPickerSearch("");
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filteredPicker = allItems
    .filter(i => !compareItems.find(c => c.id === i.id))
    .filter(i => i.name.toLowerCase().includes(pickerSearch.toLowerCase()) || i.set_name.toLowerCase().includes(pickerSearch.toLowerCase()))
    .slice(0, 20);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/30 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            Compare Cards ({compareItems.length}/3)
          </DialogTitle>
        </DialogHeader>

        <div className={`grid gap-4 ${compareItems.length === 1 ? 'grid-cols-1' : compareItems.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {compareItems.map((item) => {
            const marketVal = (item.market_price || item.purchase_price) * item.quantity;
            const costVal = item.purchase_price * item.quantity;
            const profit = marketVal - costVal;
            const margin = costVal > 0 ? (profit / costVal) * 100 : 0;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-clean-elevated rounded-2xl p-3 relative"
              >
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-destructive/20 transition-colors z-10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Image */}
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-secondary/20 mb-3">
                  {item.card_image_url ? (
                    <img src={item.card_image_url} alt={item.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3 className="text-sm font-bold truncate mb-0.5">{item.name}</h3>
                <p className="text-[11px] text-muted-foreground truncate mb-3">{item.set_name}</p>

                {/* Stats */}
                <div className="space-y-2 text-xs">
                  <Row label="Grade" value={item.grading_company !== 'raw' ? `${item.grading_company?.toUpperCase()} ${item.grade}` : 'Raw'} />
                  <Row label="Qty" value={item.quantity.toString()} />
                  <Row label="Cost" value={`$${fmt(costVal)}`} />
                  <Row label="Market" value={`$${fmt(marketVal)}`} highlight />
                  <Row label="P&L" value={`${profit >= 0 ? '+' : ''}$${fmt(Math.abs(profit))}`} positive={profit >= 0} />
                  <Row label="Margin" value={`${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%`} positive={margin >= 0} />
                </div>
              </motion.div>
            );
          })}

          {/* Add Card Slot */}
          {compareItems.length < 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-clean rounded-2xl p-3 flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-border/30 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setShowPicker(true)}
            >
              <Plus className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <span className="text-sm text-muted-foreground/50">Add Card</span>
            </motion.div>
          )}
        </div>

        {/* Picker */}
        {showPicker && (
          <div className="mt-4 p-4 card-clean-elevated rounded-2xl">
            <input
              type="text"
              placeholder="Search cards to compare..."
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              className="w-full p-3 rounded-xl bg-secondary/25 border border-border/25 text-sm mb-3 focus:outline-none focus:border-primary/40"
              autoFocus
            />
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {filteredPicker.map(item => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-secondary/30 transition-colors text-left"
                >
                  {item.card_image_url && <img src={item.card_image_url} alt="" className="w-8 h-11 object-contain rounded" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.set_name}</p>
                  </div>
                  <span className="text-xs font-bold text-success">${fmt((item.market_price || item.purchase_price) * item.quantity)}</span>
                </button>
              ))}
              {filteredPicker.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No cards found</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Package = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
);

const Row = ({ label, value, highlight, positive }: { label: string; value: string; highlight?: boolean; positive?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-semibold ${highlight ? 'text-primary' : positive !== undefined ? (positive ? 'text-success' : 'text-destructive') : ''}`}>
      {value}
    </span>
  </div>
);

export default CompareCards;
