import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronDown, ChevronUp, Target, Search, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSetCompletion } from "@/hooks/useSetCompletion";
import { useInventoryDb } from "@/hooks/useInventoryDb";

interface SetCompletionTrackerProps {
  compact?: boolean;
}

export const SetCompletionTracker = ({ compact = false }: SetCompletionTrackerProps) => {
  const { trackedSets, loading } = useSetCompletion();
  const { items } = useInventoryDb();
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Build set completion from inventory data
  const inventorySets = useMemo(() => {
    const sets: Record<string, { name: string; cards: Set<string>; totalCards: number; cardDetails: Array<{ name: string; number: string }> }> = {};
    const unsold = items.filter(item => !item.sale_price && item.quantity > 0);

    unsold.forEach(item => {
      const setName = item.set_name || "Unknown";
      if (!sets[setName]) {
        sets[setName] = { name: setName, cards: new Set(), totalCards: 0, cardDetails: [] };
      }
      if (item.card_number) {
        sets[setName].cards.add(item.card_number);
        sets[setName].cardDetails.push({ name: item.name, number: item.card_number });
      }
    });

    return Object.values(sets)
      .map(set => ({ ...set, uniqueCount: set.cards.size }))
      .sort((a, b) => b.uniqueCount - a.uniqueCount);
  }, [items]);

  // Merge tracked sets with inventory sets
  const completionData = useMemo(() => {
    const result: Array<{
      id: string;
      name: string;
      owned: number;
      total: number;
      percentage: number;
      isTracked: boolean;
      missingCards: string[];
      logoUrl?: string | null;
    }> = [];

    // Add tracked sets first
    trackedSets.forEach(ts => {
      const invSet = inventorySets.find(is => is.name.toLowerCase() === ts.set_name.toLowerCase());
      const owned = ts.owned_cards || (invSet?.uniqueCount || 0);
      const total = ts.total_cards || 1;
      const percentage = Math.min((owned / total) * 100, 100);

      // Find missing card numbers
      const ownedNumbers = new Set(ts.owned_card_ids || []);
      const missing: string[] = [];
      if (total > 0 && owned < total) {
        for (let i = 1; i <= Math.min(total, 300); i++) {
          const num = String(i);
          if (!ownedNumbers.has(num) && !ownedNumbers.has(`${ts.set_id}-${num}`)) {
            missing.push(`#${num}`);
          }
        }
      }

      result.push({
        id: ts.set_id,
        name: ts.set_name,
        owned,
        total,
        percentage,
        isTracked: true,
        missingCards: missing.slice(0, 20),
        logoUrl: ts.set_logo_url,
      });
    });

    // Add inventory-only sets not in tracked
    inventorySets.forEach(invSet => {
      const alreadyTracked = result.some(r => r.name.toLowerCase() === invSet.name.toLowerCase());
      if (!alreadyTracked && invSet.uniqueCount > 0) {
        result.push({
          id: invSet.name,
          name: invSet.name,
          owned: invSet.uniqueCount,
          total: invSet.uniqueCount, // unknown total, show as complete
          percentage: 100,
          isTracked: false,
          missingCards: [],
        });
      }
    });

    return result;
  }, [trackedSets, inventorySets]);

  const filtered = useMemo(() => {
    if (!searchTerm) return completionData;
    return completionData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [completionData, searchTerm]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted/20 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (completionData.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">No sets to track yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Add cards to your collection to see set progress</p>
      </div>
    );
  }

  const displaySets = compact ? filtered.slice(0, 5) : filtered;

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sets..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm rounded-xl bg-secondary/30 border-border/50"
          />
        </div>
      )}

      {displaySets.map((set, i) => {
        const isExpanded = expandedSet === set.id;
        const color = set.percentage >= 100 ? "bg-emerald-500" : set.percentage >= 50 ? "bg-primary" : "bg-amber-500";

        return (
          <motion.div
            key={set.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-border/20 bg-card/30 overflow-hidden"
          >
            <button
              onClick={() => setExpandedSet(isExpanded ? null : set.id)}
              className="w-full p-3 flex items-center gap-3 text-left hover:bg-secondary/20 transition-colors"
            >
              {set.logoUrl ? (
                <img src={set.logoUrl} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{set.name}</span>
                  <span className="text-xs font-bold flex-shrink-0 ml-2">
                    {set.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${set.percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${color} rounded-full`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {set.owned}/{set.total} cards
                  </span>
                  {set.isTracked && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      Tracked
                    </span>
                  )}
                </div>
              </div>
              {set.missingCards.length > 0 && (
                isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {isExpanded && set.missingCards.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 border-t border-border/10">
                    <p className="text-[11px] font-medium text-muted-foreground mt-2 mb-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Missing Cards ({set.total - set.owned})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {set.missingCards.map(card => (
                        <span key={card} className="text-[10px] px-2 py-0.5 rounded-md bg-destructive/10 text-destructive/70">
                          {card}
                        </span>
                      ))}
                      {set.total - set.owned > 20 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/30 text-muted-foreground">
                          +{set.total - set.owned - 20} more
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SetCompletionTracker;
