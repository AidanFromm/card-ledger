import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { 
  Zap, 
  Check, 
  X, 
  ChevronRight, 
  Plus,
  ImageOff,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CardSearchResult } from "./CardSearchPanel";
import { CONDITIONS } from "./ConditionSelector";
import { triggerSuccessHaptic, triggerSwipeHaptic } from "@/lib/haptics";

interface QuickAddDefaults {
  condition: string;
  quantity: number;
  folderId?: string;
}

interface QuickAddModeProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  defaults: QuickAddDefaults;
  onDefaultsChange: (defaults: QuickAddDefaults) => void;
  selectedCard: CardSearchResult | null;
  onConfirm: (card: CardSearchResult, overrides?: Partial<QuickAddDefaults>) => void;
  onSkip: () => void;
  onClear: () => void;
}

export const QuickAddMode = ({
  isEnabled,
  onToggle,
  defaults,
  onDefaultsChange,
  selectedCard,
  onConfirm,
  onSkip,
  onClear,
}: QuickAddModeProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const selectedCondition = CONDITIONS.find(c => c.value === defaults.condition);
  
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold && selectedCard) {
      // Swipe right - Confirm
      triggerSuccessHaptic();
      onConfirm(selectedCard);
    } else if (info.offset.x < -threshold) {
      // Swipe left - Skip
      triggerSwipeHaptic();
      onSkip();
    }
    
    setSwipeX(0);
  }, [selectedCard, onConfirm, onSkip]);

  return (
    <div className="space-y-4">
      {/* Quick Add Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-amber-500' : 'bg-secondary'}`}>
            <Zap className={`w-5 h-5 ${isEnabled ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="font-medium text-foreground">Quick Add Mode</p>
            <p className="text-xs text-muted-foreground">Swipe to confirm, add cards fast</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={showSettings ? 'bg-secondary' : ''}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
          />
        </div>
      </div>

      {/* Quick Settings */}
      <AnimatePresence>
        {showSettings && isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
              <h4 className="text-sm font-medium text-foreground">Default Settings</h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Default Condition */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Default Condition</label>
                  <div className="flex flex-wrap gap-1">
                    {CONDITIONS.map((condition) => (
                      <Badge
                        key={condition.value}
                        variant={defaults.condition === condition.value ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => onDefaultsChange({ ...defaults, condition: condition.value })}
                      >
                        {condition.abbrev}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Default Quantity */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Default Quantity</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDefaultsChange({ 
                        ...defaults, 
                        quantity: Math.max(1, defaults.quantity - 1) 
                      })}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={defaults.quantity}
                      onChange={(e) => onDefaultsChange({ 
                        ...defaults, 
                        quantity: Math.max(1, parseInt(e.target.value) || 1) 
                      })}
                      className="w-16 text-center h-8"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDefaultsChange({ 
                        ...defaults, 
                        quantity: defaults.quantity + 1 
                      })}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipeable Card Preview */}
      <AnimatePresence>
        {isEnabled && selectedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            {/* Background Actions */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl flex items-center justify-start pl-6">
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-6 w-6" />
                  <span className="font-semibold">Add Card</span>
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-l from-red-500 to-red-400 rounded-xl flex items-center justify-end pr-6">
                <div className="flex items-center gap-2 text-white">
                  <span className="font-semibold">Skip</span>
                  <X className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Draggable Card */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDrag={(_, info) => setSwipeX(info.offset.x)}
              onDragEnd={handleDragEnd}
              style={{ x: swipeX }}
              className="relative p-4 rounded-xl bg-card border border-border/50 shadow-lg cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-4">
                {/* Card Image */}
                <div className="w-20 h-28 rounded-lg overflow-hidden bg-secondary/50 flex-shrink-0">
                  {selectedCard.image_url ? (
                    <img
                      src={selectedCard.image_url}
                      alt={selectedCard.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {selectedCard.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {selectedCard.set_name}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className={selectedCondition?.color.replace('bg-', 'bg-')}>
                      {selectedCondition?.abbrev || 'NM'}
                    </Badge>
                    <Badge variant="outline">
                      Qty: {defaults.quantity}
                    </Badge>
                    {selectedCard.estimated_value && (
                      <Badge variant="outline" className="text-primary">
                        ${selectedCard.estimated_value.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Swipe Indicator */}
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <ChevronRight className="h-4 w-4 animate-pulse" />
                  <span className="text-[10px]">Swipe</span>
                </div>
              </div>

              {/* Quick Action Buttons (fallback) */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  onClick={onSkip}
                >
                  <X className="h-4 w-4 mr-2" />
                  Skip
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                  onClick={() => onConfirm(selectedCard)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </div>
            </motion.div>

            {/* Swipe Hint */}
            <p className="text-center text-xs text-muted-foreground mt-2">
              ← Swipe left to skip • Swipe right to add →
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {isEnabled && !selectedCard && (
        <div className="p-8 rounded-xl border-2 border-dashed border-border/50 text-center">
          <Zap className="h-10 w-10 mx-auto text-amber-500 mb-3" />
          <p className="text-muted-foreground">
            Search for a card to quick add
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cards will be added with your default settings
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickAddMode;
