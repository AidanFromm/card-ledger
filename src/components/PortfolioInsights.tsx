/**
 * Portfolio Insights Widget
 * 
 * AI-powered portfolio analysis showing:
 * - Top performers
 * - Underperformers
 * - Grading opportunities
 * - Market alerts
 * - Collection health
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Trophy,
  Target,
  Lightbulb,
  ArrowUpRight,
  Gem,
  Shield,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface InventoryItem {
  id: string;
  name: string;
  set_name: string;
  current_value?: number;
  purchase_price?: number;
  grading_company?: string;
  condition?: string;
  quantity: number;
}

interface Insight {
  id: string;
  type: 'opportunity' | 'alert' | 'achievement' | 'tip';
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string;
  action?: string;
  priority: number;
}

interface PortfolioInsightsProps {
  items: InventoryItem[];
  totalValue: number;
  className?: string;
}

// ============================================
// Insight Generation
// ============================================

function generateInsights(items: InventoryItem[], totalValue: number): Insight[] {
  const insights: Insight[] = [];
  
  if (items.length === 0) {
    return [{
      id: 'empty',
      type: 'tip',
      icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
      title: 'Start Your Collection',
      description: 'Add your first card to begin tracking your portfolio!',
      priority: 1,
    }];
  }

  // Calculate stats
  const itemsWithValue = items.filter(i => i.current_value && i.current_value > 0);
  const itemsWithPurchasePrice = items.filter(i => i.purchase_price && i.purchase_price > 0);
  const rawCards = items.filter(i => !i.grading_company || i.grading_company === 'raw');
  const gradedCards = items.filter(i => i.grading_company && i.grading_company !== 'raw');
  
  // Find top performers (highest value cards)
  const topValueCards = [...itemsWithValue]
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
    .slice(0, 3);

  // Find cards with best ROI
  const cardsWithROI = itemsWithPurchasePrice
    .filter(i => i.current_value && i.purchase_price)
    .map(i => ({
      ...i,
      roi: ((i.current_value! - i.purchase_price!) / i.purchase_price!) * 100,
    }))
    .sort((a, b) => b.roi - a.roi);

  const topGainers = cardsWithROI.filter(c => c.roi > 0).slice(0, 3);
  const topLosers = cardsWithROI.filter(c => c.roi < 0).slice(0, 3);

  // Find grading opportunities (high value raw cards)
  const gradingOpportunities = rawCards
    .filter(i => i.current_value && i.current_value > 50)
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
    .slice(0, 3);

  // Generate insights

  // Top performer
  if (topValueCards.length > 0) {
    const topCard = topValueCards[0];
    insights.push({
      id: 'top-value',
      type: 'achievement',
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      title: 'Most Valuable Card',
      description: topCard.name,
      value: `$${topCard.current_value?.toFixed(2)}`,
      priority: 10,
    });
  }

  // Best ROI
  if (topGainers.length > 0) {
    const bestGainer = topGainers[0];
    insights.push({
      id: 'best-roi',
      type: 'achievement',
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      title: 'Best Investment',
      description: bestGainer.name,
      value: `+${bestGainer.roi.toFixed(0)}% ROI`,
      priority: 9,
    });
  }

  // Worst performer alert
  if (topLosers.length > 0 && topLosers[0].roi < -20) {
    const worstCard = topLosers[0];
    insights.push({
      id: 'worst-roi',
      type: 'alert',
      icon: <TrendingDown className="h-5 w-5 text-red-500" />,
      title: 'Underperformer',
      description: `${worstCard.name} is down ${Math.abs(worstCard.roi).toFixed(0)}%`,
      action: 'Consider holding or selling',
      priority: 8,
    });
  }

  // Grading opportunities
  if (gradingOpportunities.length > 0) {
    insights.push({
      id: 'grading-opp',
      type: 'opportunity',
      icon: <Gem className="h-5 w-5 text-purple-500" />,
      title: 'Grading Opportunity',
      description: `${gradingOpportunities.length} high-value cards could benefit from grading`,
      action: 'Send to PSA/BGS',
      priority: 7,
    });
  }

  // Portfolio concentration alert
  if (topValueCards.length > 0 && totalValue > 0) {
    const topCardValue = topValueCards[0].current_value || 0;
    const concentration = (topCardValue / totalValue) * 100;
    if (concentration > 40) {
      insights.push({
        id: 'concentration',
        type: 'alert',
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        title: 'Portfolio Concentration',
        description: `${concentration.toFixed(0)}% of value in one card`,
        action: 'Consider diversifying',
        priority: 6,
      });
    }
  }

  // Collection milestone
  const totalCards = items.reduce((sum, i) => sum + i.quantity, 0);
  const milestones = [10, 25, 50, 100, 250, 500, 1000];
  const nextMilestone = milestones.find(m => m > totalCards);
  const prevMilestone = milestones.filter(m => m <= totalCards).pop();
  
  if (prevMilestone && prevMilestone >= 10) {
    insights.push({
      id: 'milestone',
      type: 'achievement',
      icon: <Target className="h-5 w-5 text-blue-500" />,
      title: 'Collection Milestone',
      description: `You've collected ${totalCards} cards!`,
      value: nextMilestone ? `${nextMilestone - totalCards} to ${nextMilestone}` : 'Max reached!',
      priority: 5,
    });
  }

  // Graded vs raw ratio tip
  if (items.length >= 10) {
    const gradedRatio = (gradedCards.length / items.length) * 100;
    if (gradedRatio < 10 && rawCards.length > 5) {
      insights.push({
        id: 'grading-tip',
        type: 'tip',
        icon: <Shield className="h-5 w-5 text-blue-500" />,
        title: 'Protect Your Value',
        description: 'Only ' + gradedRatio.toFixed(0) + '% of cards are graded',
        action: 'Grading protects and increases value',
        priority: 4,
      });
    }
  }

  // Sort by priority and limit
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

// ============================================
// Component
// ============================================

export function PortfolioInsights({
  items,
  totalValue,
  className,
}: PortfolioInsightsProps) {
  const insights = useMemo(
    () => generateInsights(items, totalValue),
    [items, totalValue]
  );

  if (insights.length === 0) {
    return null;
  }

  const insightTypeColors = {
    opportunity: 'border-purple-500/30 bg-purple-500/5',
    alert: 'border-amber-500/30 bg-amber-500/5',
    achievement: 'border-emerald-500/30 bg-emerald-500/5',
    tip: 'border-blue-500/30 bg-blue-500/5',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Portfolio Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'p-3 rounded-lg border flex items-start gap-3',
              insightTypeColors[insight.type]
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {insight.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-sm">{insight.title}</h4>
                {insight.value && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs whitespace-nowrap"
                  >
                    {insight.value}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {insight.description}
              </p>
              {insight.action && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {insight.action}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

export default PortfolioInsights;
