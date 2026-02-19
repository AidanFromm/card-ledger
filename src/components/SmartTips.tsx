import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  DollarSign,
  Award,
  AlertTriangle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useInventoryDb } from '@/hooks/useInventoryDb';
import { useSalesDb } from '@/hooks/useSalesDb';
import { useAchievements } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

interface Tip {
  id: string;
  type: 'insight' | 'suggestion' | 'warning' | 'celebration';
  icon: React.ElementType;
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

const DISMISSED_KEY = 'cardledger_dismissed_tips';

export function SmartTips() {
  const { items } = useInventoryDb();
  const { sales } = useSalesDb();
  const { level, streak, completedAchievements, inProgressAchievements } = useAchievements();
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Load dismissed tips
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_KEY);
      if (saved) {
        setDismissedTips(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error('Error loading dismissed tips:', e);
    }
  }, []);

  // Generate contextual tips based on user data
  const tips = useMemo((): Tip[] => {
    const generatedTips: Tip[] = [];
    const unsoldItems = items.filter(item => !item.sale_price);
    const totalValue = unsoldItems.reduce((sum, item) => {
      const price = item.market_price || item.purchase_price;
      return sum + (price * item.quantity);
    }, 0);

    // Streak tips
    if (streak.currentStreak >= 7) {
      generatedTips.push({
        id: 'streak-7',
        type: 'celebration',
        icon: Sparkles,
        title: '🔥 Week Warrior!',
        message: `Amazing! You've used CardLedger ${streak.currentStreak} days in a row. Keep it up!`,
      });
    } else if (streak.currentStreak >= 3) {
      generatedTips.push({
        id: 'streak-3',
        type: 'insight',
        icon: TrendingUp,
        title: 'Building momentum',
        message: `${streak.currentStreak} day streak! Come back tomorrow to keep it going.`,
      });
    }

    // Collection size tips
    if (unsoldItems.length === 0) {
      generatedTips.push({
        id: 'empty-collection',
        type: 'suggestion',
        icon: Target,
        title: 'Start your collection',
        message: 'Add your first card to begin tracking your portfolio value.',
        action: { label: 'Add Card', href: '/scan' },
      });
    } else if (unsoldItems.length < 10) {
      generatedTips.push({
        id: 'small-collection',
        type: 'suggestion',
        icon: Lightbulb,
        title: 'Grow your collection',
        message: 'Import cards from a spreadsheet to quickly build your inventory.',
        action: { label: 'Import', href: '/import' },
      });
    }

    // Value milestone tips
    if (totalValue >= 1000 && totalValue < 5000) {
      generatedTips.push({
        id: 'value-1k',
        type: 'insight',
        icon: DollarSign,
        title: 'Growing portfolio',
        message: `Your collection is worth $${totalValue.toLocaleString()}. You're on track to $5K!`,
      });
    } else if (totalValue >= 10000) {
      generatedTips.push({
        id: 'value-10k',
        type: 'celebration',
        icon: Award,
        title: 'Impressive collection!',
        message: `$${totalValue.toLocaleString()} portfolio value. Consider setting price alerts for key cards.`,
        action: { label: 'Set Alerts', href: '/alerts' },
      });
    }

    // Achievement tips
    const nearComplete = inProgressAchievements.find(a => a.percentComplete >= 80);
    if (nearComplete) {
      generatedTips.push({
        id: `near-${nearComplete.achievement.id}`,
        type: 'suggestion',
        icon: Target,
        title: 'Almost there!',
        message: `You're ${nearComplete.percentComplete.toFixed(0)}% to "${nearComplete.achievement.name}"`,
        action: { label: 'View Achievements', href: '/achievements' },
      });
    }

    // Level up tips
    if (level.currentXp > level.nextLevelXp * 0.8) {
      generatedTips.push({
        id: 'level-up-soon',
        type: 'insight',
        icon: TrendingUp,
        title: 'Level up incoming!',
        message: `You're ${Math.round((level.currentXp / level.nextLevelXp) * 100)}% to Level ${level.level + 1}!`,
      });
    }

    // Grading suggestion
    const ungraded = unsoldItems.filter(item => 
      item.grading_company?.toLowerCase() === 'raw' || !item.grading_company
    );
    const highValueRaw = ungraded.filter(item => (item.market_price || item.purchase_price) >= 50);
    if (highValueRaw.length > 0) {
      generatedTips.push({
        id: 'grade-suggestion',
        type: 'suggestion',
        icon: Award,
        title: 'Grading opportunity',
        message: `You have ${highValueRaw.length} high-value raw card${highValueRaw.length > 1 ? 's' : ''} worth grading.`,
        action: { label: 'View Grading', href: '/grading' },
      });
    }

    // Sales insights
    if (sales.length > 0) {
      const totalProfit = sales.reduce((sum, sale) => 
        sum + ((sale.sale_price - sale.purchase_price) * sale.quantity_sold), 0
      );
      if (totalProfit > 0) {
        generatedTips.push({
          id: 'profit-positive',
          type: 'celebration',
          icon: TrendingUp,
          title: 'Profitable trader!',
          message: `You've made $${totalProfit.toLocaleString()} profit. Keep up the good work!`,
        });
      }
    }

    // Filter out dismissed tips
    return generatedTips.filter(tip => !dismissedTips.has(tip.id));
  }, [items, sales, streak, level, inProgressAchievements, dismissedTips]);

  const dismissTip = (tipId: string) => {
    const newDismissed = new Set(dismissedTips);
    newDismissed.add(tipId);
    setDismissedTips(newDismissed);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...newDismissed]));
    
    // Move to next tip
    if (currentTipIndex >= tips.length - 1) {
      setCurrentTipIndex(0);
    }
  };

  // Rotate tips every 10 seconds
  useEffect(() => {
    if (tips.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [tips.length]);

  if (tips.length === 0) return null;

  const currentTip = tips[currentTipIndex];
  const Icon = currentTip.icon;

  const typeStyles = {
    insight: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    suggestion: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
    warning: 'from-red-500/10 to-red-600/5 border-red-500/20',
    celebration: 'from-green-500/10 to-green-600/5 border-green-500/20',
  };

  const iconColors = {
    insight: 'text-blue-400',
    suggestion: 'text-amber-400',
    warning: 'text-red-400',
    celebration: 'text-green-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 rounded-2xl border bg-gradient-to-br overflow-hidden",
        typeStyles[currentTip.type]
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={() => dismissTip(currentTip.id)}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-zinc-500" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentTip.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-start gap-3"
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            "bg-white/5"
          )}>
            <Icon className={cn("w-5 h-5", iconColors[currentTip.type])} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="font-medium text-sm mb-0.5">{currentTip.title}</p>
            <p className="text-xs text-zinc-400">{currentTip.message}</p>
            {currentTip.action && (
              <a
                href={currentTip.action.href}
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
              >
                {currentTip.action.label}
                <ChevronRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Tip indicators */}
      {tips.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {tips.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentTipIndex(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === currentTipIndex ? "bg-white w-4" : "bg-white/30"
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default SmartTips;
