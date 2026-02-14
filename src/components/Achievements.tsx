import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Package,
  DollarSign,
  Award,
  ShoppingBag,
  Layers,
  Users,
  ChevronRight,
  Lock,
  Sparkles,
  Crown,
  Zap,
  Gem,
  TrendingUp,
  Medal,
  CheckCircle,
  Share2,
  Link,
  Rocket,
  Moon,
  Flame,
  Camera,
  Wallet,
  Box,
  Archive,
  Receipt,
  Store,
  Banknote,
  BadgeDollarSign,
  Library,
} from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { 
  Achievement, 
  AchievementCategory, 
  RARITY_COLORS, 
  getCategoryIcon, 
  getCategoryLabel,
  ACHIEVEMENTS,
} from '@/lib/achievements';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Icon mapping
const ICONS: Record<string, React.ElementType> = {
  Trophy, Star, Package, DollarSign, Award, ShoppingBag, Layers, Users,
  Lock, Sparkles, Crown, Zap, Gem, TrendingUp, Medal, CheckCircle,
  Share2, Link, Rocket, Moon, Flame, Camera, Wallet, Box, Archive,
  Receipt, Store, Banknote, BadgeDollarSign, Library,
};

// Get icon component
const getIcon = (name: string) => ICONS[name] || Star;

// Achievement Card Component
interface AchievementCardProps {
  achievement: Achievement;
  progress: number;
  completed: boolean;
  completedAt?: string;
  percentComplete: number;
  onClick?: () => void;
}

const AchievementCard = ({
  achievement,
  progress,
  completed,
  completedAt,
  percentComplete,
  onClick,
}: AchievementCardProps) => {
  const Icon = getIcon(achievement.icon);
  const colors = RARITY_COLORS[achievement.rarity];
  const isSecret = achievement.secret && !completed;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-4 rounded-2xl border-2 text-left transition-all",
        colors.bg,
        colors.border,
        completed && "shadow-lg",
        completed && colors.glow,
        !completed && "opacity-70 hover:opacity-100"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          completed ? colors.bg : "bg-zinc-800",
          completed && "ring-2 ring-offset-2 ring-offset-background",
          completed && colors.border.replace('border-', 'ring-')
        )}>
          {isSecret ? (
            <Lock className="w-5 h-5 text-zinc-500" />
          ) : (
            <Icon className={cn("w-5 h-5", completed ? colors.text : "text-zinc-500")} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              "font-semibold truncate",
              completed ? colors.text : "text-zinc-400"
            )}>
              {isSecret ? "???" : achievement.name}
            </h3>
            {completed && (
              <CheckCircle className={cn("w-4 h-4 shrink-0", colors.text)} />
            )}
          </div>
          
          <p className="text-xs text-zinc-500 mb-2 line-clamp-2">
            {isSecret ? "Complete more achievements to unlock" : achievement.description}
          </p>

          {/* Progress bar */}
          {!isSecret && !completed && (
            <div className="space-y-1">
              <Progress 
                value={percentComplete} 
                className="h-1.5 bg-zinc-800"
              />
              <p className="text-xs text-zinc-500">
                {progress.toLocaleString()} / {achievement.requirement.toLocaleString()}
              </p>
            </div>
          )}

          {/* Completed date */}
          {completed && completedAt && (
            <p className="text-xs text-zinc-500">
              Unlocked {new Date(completedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* XP Badge */}
        <div className={cn(
          "px-2 py-1 rounded-lg text-xs font-bold shrink-0",
          completed ? colors.bg : "bg-zinc-800",
          completed ? colors.text : "text-zinc-500"
        )}>
          +{achievement.xp} XP
        </div>
      </div>
    </motion.button>
  );
};

// Level Display Component
interface LevelDisplayProps {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  totalXp: number;
}

const LevelDisplay = ({ level, currentXp, nextLevelXp, totalXp }: LevelDisplayProps) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative p-6 rounded-3xl bg-gradient-to-br from-navy-900/80 to-navy-950/90 border border-navy-700/50 overflow-hidden"
  >
    {/* Glow effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-navy-500/10 via-transparent to-navy-500/10" />
    
    <div className="relative flex items-center gap-6">
      {/* Level badge */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center border-2 border-navy-500/50 shadow-lg shadow-navy-500/30">
          <div className="text-center">
            <p className="text-xs text-navy-300 uppercase tracking-wider">Level</p>
            <p className="text-3xl font-bold text-white">{level}</p>
          </div>
        </div>
        {level >= 10 && (
          <Crown className="absolute -top-2 -right-2 w-6 h-6 text-amber-400" />
        )}
      </div>

      {/* XP Progress */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-zinc-400">Progress to Level {level + 1}</p>
          <p className="text-sm font-medium text-navy-300">
            {currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
          </p>
        </div>
        <Progress 
          value={(currentXp / nextLevelXp) * 100} 
          className="h-3 bg-navy-900"
        />
        <p className="text-xs text-zinc-500 mt-2">
          Total: {totalXp.toLocaleString()} XP
        </p>
      </div>
    </div>
  </motion.div>
);

// Category Tab
interface CategoryTabProps {
  category: AchievementCategory | 'all';
  selected: boolean;
  count: number;
  total: number;
  onClick: () => void;
}

const CategoryTab = ({ category, selected, count, total, onClick }: CategoryTabProps) => {
  const Icon = category === 'all' ? Trophy : getIcon(getCategoryIcon(category as AchievementCategory));
  const label = category === 'all' ? 'All' : getCategoryLabel(category as AchievementCategory);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
        selected
          ? "bg-navy-600 text-white"
          : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      <span className={cn(
        "px-1.5 py-0.5 rounded-md text-xs",
        selected ? "bg-navy-500/50" : "bg-zinc-700"
      )}>
        {count}/{total}
      </span>
    </button>
  );
};

// Main Achievements Component
export function AchievementsPanel() {
  const {
    achievements,
    completedAchievements,
    totalXp,
    level,
    completionPercentage,
  } = useAchievements();

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  // Filter achievements by category
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter(a => a.achievement.category === selectedCategory);
  }, [achievements, selectedCategory]);

  // Get category counts
  const categories: (AchievementCategory | 'all')[] = [
    'all', 'collection', 'value', 'grading', 'trading', 'sets', 'social', 'special'
  ];

  const getCategoryStats = (category: AchievementCategory | 'all') => {
    const filtered = category === 'all' 
      ? achievements 
      : achievements.filter(a => a.achievement.category === category);
    return {
      completed: filtered.filter(a => a.completed).length,
      total: filtered.length,
    };
  };

  return (
    <div className="space-y-6">
      {/* Level Display */}
      <LevelDisplay
        level={level.level}
        currentXp={level.currentXp}
        nextLevelXp={level.nextLevelXp}
        totalXp={totalXp}
      />

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800"
      >
        <div>
          <p className="text-sm text-zinc-400">Achievements Completed</p>
          <p className="text-2xl font-bold">
            {completedAchievements.length} / {ACHIEVEMENTS.length}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-400">Completion</p>
          <p className="text-2xl font-bold text-navy-400">
            {completionPercentage.toFixed(0)}%
          </p>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2">
          {categories.map(category => {
            const stats = getCategoryStats(category);
            return (
              <CategoryTab
                key={category}
                category={category}
                selected={selectedCategory === category}
                count={stats.completed}
                total={stats.total}
                onClick={() => setSelectedCategory(category)}
              />
            );
          })}
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAchievements
            .sort((a, b) => {
              // Completed first, then by rarity
              if (a.completed !== b.completed) return a.completed ? -1 : 1;
              const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
              return rarityOrder[a.achievement.rarity] - rarityOrder[b.achievement.rarity];
            })
            .map((achievementProgress) => (
              <motion.div
                key={achievementProgress.achievement.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <AchievementCard
                  achievement={achievementProgress.achievement}
                  progress={achievementProgress.progress}
                  completed={achievementProgress.completed}
                  completedAt={achievementProgress.completedAt}
                  percentComplete={achievementProgress.percentComplete}
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Compact achievements widget for dashboard
export function AchievementsWidget() {
  const {
    recentUnlocks,
    level,
    completionPercentage,
    inProgressAchievements,
    streak,
  } = useAchievements();

  // Show the closest to completion
  const nearestAchievement = inProgressAchievements
    .sort((a, b) => b.percentComplete - a.percentComplete)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-zinc-800/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold">Achievements</h3>
        </div>
        <div className="flex items-center gap-2">
          {streak.currentStreak > 0 && (
            <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
              🔥 {streak.currentStreak}
            </span>
          )}
          <span className="text-xs bg-navy-600 text-white px-2 py-1 rounded-lg font-medium">
            Lv. {level.level}
          </span>
        </div>
      </div>

      {/* Next achievement */}
      {nearestAchievement && (
        <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-zinc-400">Next Achievement</p>
            <p className="text-xs font-medium text-navy-400">
              {nearestAchievement.percentComplete.toFixed(0)}%
            </p>
          </div>
          <p className="text-sm font-medium mb-2">{nearestAchievement.achievement.name}</p>
          <Progress 
            value={nearestAchievement.percentComplete} 
            className="h-1.5 bg-zinc-700"
          />
        </div>
      )}

      {/* Recent unlocks */}
      {recentUnlocks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-400 mb-2">Recently Unlocked</p>
          <div className="flex gap-2">
            {recentUnlocks.map(unlock => {
              const Icon = getIcon(unlock.achievement.icon);
              const colors = RARITY_COLORS[unlock.achievement.rarity];
              return (
                <div
                  key={unlock.achievement.id}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    colors.bg,
                    "border",
                    colors.border
                  )}
                  title={unlock.achievement.name}
                >
                  <Icon className={cn("w-4 h-4", colors.text)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default AchievementsPanel;
