import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Gift, 
  Lightbulb, 
  BookOpen, 
  ChevronRight,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDailyLogin } from '@/hooks/useDailyLogin';
import { triggerCelebration } from './Celebration';
import { useToast } from '@/hooks/use-toast';

interface DailyLoginWidgetProps {
  compact?: boolean;
}

export const DailyLoginWidget = ({ compact = false }: DailyLoginWidgetProps) => {
  const { 
    loginData, 
    dailyContent, 
    claimDailyBonus, 
    getStreakXpBonus,
    isNewDay,
    nextBonusMilestone 
  } = useDailyLogin();
  
  const [showContent, setShowContent] = useState<'tip' | 'fact' | null>('tip');
  const [justClaimed, setJustClaimed] = useState(false);
  const { toast } = useToast();

  const handleClaimBonus = () => {
    const xpEarned = claimDailyBonus();
    if (xpEarned > 0) {
      triggerCelebration('subtle');
      setJustClaimed(true);
      toast({
        title: `+${xpEarned} XP Earned!`,
        description: `Day ${loginData.streak} streak bonus claimed`,
      });
      
      setTimeout(() => setJustClaimed(false), 3000);
    }
  };

  // Auto-show claim button briefly on new day
  useEffect(() => {
    if (isNewDay && !loginData.todaysClaimed) {
      // Could auto-show modal or highlight here
    }
  }, [isNewDay, loginData.todaysClaimed]);

  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Flame className={`w-6 h-6 ${loginData.streak >= 7 ? 'text-orange-400' : 'text-muted-foreground'}`} />
                {loginData.streak >= 7 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"
                  />
                )}
              </div>
              <div>
                <div className="font-bold">{loginData.streak} Day Streak</div>
                <div className="text-xs text-muted-foreground">
                  Longest: {loginData.longestStreak} days
                </div>
              </div>
            </div>
            
            {!loginData.todaysClaimed ? (
              <Button 
                size="sm" 
                onClick={handleClaimBonus}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                <Gift className="w-4 h-4 mr-1" />
                +{getStreakXpBonus()} XP
              </Button>
            ) : (
              <Badge variant="outline" className="text-green-400 border-green-400">
                <Check className="w-3 h-3 mr-1" />
                Claimed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Streak & Bonus Card */}
      <Card className="bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-orange-500/30 overflow-hidden">
        <CardContent className="p-0">
          {/* Streak Header */}
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <motion.div
                    animate={loginData.streak >= 7 ? { 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`
                      p-3 rounded-xl
                      ${loginData.streakBonusLevel === 'legend' 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : loginData.streakBonusLevel === 'month'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                        : loginData.streakBonusLevel === 'week'
                        ? 'bg-gradient-to-br from-orange-400 to-amber-400'
                        : 'bg-orange-500/20'
                      }
                    `}
                  >
                    <Flame className={`w-6 h-6 ${loginData.streak >= 7 ? 'text-white' : 'text-orange-400'}`} />
                  </motion.div>
                  {loginData.streakBonusLevel !== 'none' && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </motion.div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{loginData.streak}</span>
                    <span className="text-muted-foreground">day streak</span>
                    {loginData.streakBonusLevel !== 'none' && (
                      <Badge className={`
                        ${loginData.streakBonusLevel === 'legend' 
                          ? 'bg-purple-500' 
                          : loginData.streakBonusLevel === 'month'
                          ? 'bg-amber-500'
                          : 'bg-orange-500'
                        }
                      `}>
                        {loginData.streakBonusLevel === 'legend' ? '🔥 Legend' 
                          : loginData.streakBonusLevel === 'month' ? '⚡ Monthly'
                          : '✨ Weekly'}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {nextBonusMilestone ? (
                      <span>{nextBonusMilestone.days} days to {nextBonusMilestone.label}</span>
                    ) : (
                      <span>Legendary status achieved!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Claim Button */}
              <AnimatePresence mode="wait">
                {!loginData.todaysClaimed ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Button 
                      onClick={handleClaimBonus}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Claim +{getStreakXpBonus()} XP
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 text-green-400"
                  >
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Claimed!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-px bg-border">
            <div className="bg-background/50 p-3 text-center">
              <div className="text-lg font-bold">{loginData.longestStreak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
            <div className="bg-background/50 p-3 text-center">
              <div className="text-lg font-bold">{loginData.totalLogins}</div>
              <div className="text-xs text-muted-foreground">Total Logins</div>
            </div>
            <div className="bg-background/50 p-3 text-center">
              <div className="text-lg font-bold">{loginData.xpEarned}</div>
              <div className="text-xs text-muted-foreground">XP Earned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Tip/Fact Card */}
      <Card>
        <CardContent className="p-4">
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={showContent === 'tip' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowContent('tip')}
              className="flex-1"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Daily Tip
            </Button>
            <Button
              variant={showContent === 'fact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowContent('fact')}
              className="flex-1"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Did You Know?
            </Button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {showContent === 'tip' && dailyContent.tip && (
              <motion.div
                key="tip"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <Badge variant="outline" className="text-xs">
                  {dailyContent.tip.category}
                </Badge>
                <p className="text-sm leading-relaxed">
                  💡 {dailyContent.tip.tip}
                </p>
              </motion.div>
            )}
            
            {showContent === 'fact' && dailyContent.fact && (
              <motion.div
                key="fact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <Badge variant="outline" className="text-xs">
                  {dailyContent.fact.category}
                </Badge>
                <p className="text-sm leading-relaxed">
                  📚 {dailyContent.fact.fact}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyLoginWidget;
