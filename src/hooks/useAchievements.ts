import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInventoryDb } from './useInventoryDb';
import { useSalesDb } from './useSalesDb';
import { 
  Achievement, 
  UserAchievement, 
  ACHIEVEMENTS, 
  calculateUserLevel,
  RARITY_XP,
} from '@/lib/achievements';
import { useToast } from './use-toast';
import { triggerCelebration } from '@/components/Celebration';

const STORAGE_KEY = 'cardledger_achievements';
const NOTIFIED_KEY = 'cardledger_achievements_notified';
const STREAK_KEY = 'cardledger_streak';

interface StreakData {
  currentStreak: number;
  lastVisit: string; // ISO date string (YYYY-MM-DD)
  longestStreak: number;
}

interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  completed: boolean;
  completedAt?: string;
  percentComplete: number;
}

interface UseAchievementsReturn {
  achievements: AchievementProgress[];
  completedAchievements: AchievementProgress[];
  inProgressAchievements: AchievementProgress[];
  totalXp: number;
  level: { level: number; currentXp: number; nextLevelXp: number };
  recentUnlocks: AchievementProgress[];
  checkAchievements: () => void;
  getAchievementProgress: (id: string) => AchievementProgress | undefined;
  completionPercentage: number;
  streak: StreakData;
}

export function useAchievements(): UseAchievementsReturn {
  const { items, loading: inventoryLoading } = useInventoryDb();
  const { sales, loading: salesLoading } = useSalesDb();
  const { toast } = useToast();
  
  const [userAchievements, setUserAchievements] = useState<Record<string, UserAchievement>>({});
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, lastVisit: '', longestStreak: 0 });

  // Load saved achievements and update streak from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUserAchievements(JSON.parse(saved));
      }
      
      const notified = localStorage.getItem(NOTIFIED_KEY);
      if (notified) {
        setNotifiedIds(new Set(JSON.parse(notified)));
      }
      
      // Load and update streak
      const streakData = localStorage.getItem(STREAK_KEY);
      const today = new Date().toISOString().split('T')[0];
      
      if (streakData) {
        const parsed: StreakData = JSON.parse(streakData);
        const lastDate = new Date(parsed.lastVisit);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let newStreak = parsed.currentStreak;
        
        if (diffDays === 0) {
          // Same day, no change
          setStreak(parsed);
        } else if (diffDays === 1) {
          // Consecutive day, increment streak
          newStreak = parsed.currentStreak + 1;
          const newData: StreakData = {
            currentStreak: newStreak,
            lastVisit: today,
            longestStreak: Math.max(newStreak, parsed.longestStreak),
          };
          localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
          setStreak(newData);
        } else {
          // Streak broken, reset to 1
          const newData: StreakData = {
            currentStreak: 1,
            lastVisit: today,
            longestStreak: parsed.longestStreak,
          };
          localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
          setStreak(newData);
        }
      } else {
        // First visit
        const newData: StreakData = {
          currentStreak: 1,
          lastVisit: today,
          longestStreak: 1,
        };
        localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
        setStreak(newData);
      }
    } catch (e) {
      console.error('Error loading achievements:', e);
    }
  }, []);

  // Save achievements to localStorage
  const saveAchievements = useCallback((achievements: Record<string, UserAchievement>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
      setUserAchievements(achievements);
    } catch (e) {
      console.error('Error saving achievements:', e);
    }
  }, []);

  // Save notified IDs
  const saveNotified = useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids]));
      setNotifiedIds(ids);
    } catch (e) {
      console.error('Error saving notified:', e);
    }
  }, []);

  // Calculate current stats from inventory and sales
  const stats = useMemo(() => {
    if (inventoryLoading || salesLoading) return null;

    const unsoldItems = items.filter(item => !item.sale_price);
    const gradedItems = unsoldItems.filter(item => 
      item.grading_company && item.grading_company.toLowerCase() !== 'raw'
    );
    const psa10Items = gradedItems.filter(item => 
      item.grading_company?.toLowerCase() === 'psa' && item.grade === '10'
    );

    const totalValue = unsoldItems.reduce((sum, item) => {
      const price = item.market_price || item.purchase_price;
      return sum + (price * item.quantity);
    }, 0);

    const totalProfit = sales.reduce((sum, sale) => {
      const profit = (sale.sale_price - sale.purchase_price) * sale.quantity_sold;
      return sum + profit;
    }, 0);

    const hasHighValueCard = unsoldItems.some(item => 
      (item.market_price || item.purchase_price) >= 1000
    );

    const currentHour = new Date().getHours();
    const isNightOwl = currentHour >= 0 && currentHour < 5;

    return {
      totalCards: unsoldItems.reduce((sum, item) => sum + item.quantity, 0),
      totalValue,
      gradedCount: gradedItems.reduce((sum, item) => sum + item.quantity, 0),
      hasPsa10: psa10Items.length > 0,
      totalSales: sales.length,
      totalProfit,
      hasHighValueCard,
      isNightOwl,
      // Add more stats as needed
    };
  }, [items, sales, inventoryLoading, salesLoading]);

  // Check and update achievement progress
  const checkAchievements = useCallback(() => {
    if (!stats) return;

    const newAchievements = { ...userAchievements };
    const newlyCompleted: string[] = [];

    ACHIEVEMENTS.forEach(achievement => {
      let progress = 0;

      // Calculate progress based on achievement type
      switch (achievement.id) {
        // Collection achievements
        case 'first_card':
        case 'collector_10':
        case 'collector_50':
        case 'collector_100':
        case 'collector_500':
        case 'collector_1000':
        case 'collector_5000':
          progress = stats.totalCards;
          break;

        // Value achievements
        case 'value_100':
        case 'value_1000':
        case 'value_5000':
        case 'value_10000':
        case 'value_50000':
        case 'value_100000':
          progress = stats.totalValue;
          break;

        // Grading achievements
        case 'first_graded':
        case 'graded_10':
        case 'graded_50':
          progress = stats.gradedCount;
          break;

        case 'first_psa10':
          progress = stats.hasPsa10 ? 1 : 0;
          break;

        // Trading achievements
        case 'first_sale':
        case 'sales_10':
        case 'sales_100':
          progress = stats.totalSales;
          break;

        case 'profit_1000':
        case 'profit_10000':
          progress = stats.totalProfit;
          break;

        // Special achievements
        case 'big_spender':
          progress = stats.hasHighValueCard ? 1 : 0;
          break;

        case 'night_owl':
          progress = stats.isNightOwl && stats.totalCards > 0 ? 1 : 0;
          break;

        // Streak achievements
        case 'streak_3':
        case 'streak_7':
        case 'streak_30':
        case 'streak_100':
          progress = streak.currentStreak;
          break;

        case 'early_adopter':
          const year = new Date().getFullYear();
          progress = year === 2026 ? 1 : 0;
          break;

        default:
          // Keep existing progress for achievements we can't auto-calculate
          progress = newAchievements[achievement.id]?.progress || 0;
      }

      const wasCompleted = newAchievements[achievement.id]?.completed || false;
      const isNowCompleted = progress >= achievement.requirement;

      newAchievements[achievement.id] = {
        id: achievement.id,
        achievementId: achievement.id,
        progress,
        completed: isNowCompleted,
        completedAt: isNowCompleted && !wasCompleted 
          ? new Date().toISOString() 
          : newAchievements[achievement.id]?.completedAt,
      };

      // Track newly completed achievements
      if (isNowCompleted && !wasCompleted) {
        newlyCompleted.push(achievement.id);
      }
    });

    // Save updated achievements
    saveAchievements(newAchievements);

    // Show toast and confetti for newly completed achievements
    newlyCompleted.forEach(id => {
      if (!notifiedIds.has(id)) {
        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        if (achievement) {
          // Trigger confetti based on rarity
          const intensity = achievement.rarity === 'legendary' ? 'big' 
            : achievement.rarity === 'epic' ? 'medium' 
            : 'subtle';
          triggerCelebration(intensity);
          
          toast({
            title: "Achievement unlocked",
            description: `${achievement.name}: ${achievement.description}`,
          });
          
          const newNotified = new Set(notifiedIds);
          newNotified.add(id);
          saveNotified(newNotified);
        }
      }
    });
  }, [stats, userAchievements, notifiedIds, saveAchievements, saveNotified, toast]);

  // Check achievements when stats change
  useEffect(() => {
    if (stats) {
      checkAchievements();
    }
  }, [stats]); // Don't include checkAchievements to avoid loops

  // Calculate achievement progress for display
  const achievements = useMemo((): AchievementProgress[] => {
    return ACHIEVEMENTS.map(achievement => {
      const userProgress = userAchievements[achievement.id];
      const progress = userProgress?.progress || 0;
      const completed = userProgress?.completed || false;
      
      return {
        achievement,
        progress,
        completed,
        completedAt: userProgress?.completedAt,
        percentComplete: Math.min(100, (progress / achievement.requirement) * 100),
      };
    });
  }, [userAchievements]);

  const completedAchievements = useMemo(() => 
    achievements.filter(a => a.completed),
    [achievements]
  );

  const inProgressAchievements = useMemo(() => 
    achievements.filter(a => !a.completed && a.progress > 0),
    [achievements]
  );

  // Calculate total XP
  const totalXp = useMemo(() => {
    return completedAchievements.reduce((sum, a) => sum + a.achievement.xp, 0);
  }, [completedAchievements]);

  // Calculate level
  const level = useMemo(() => calculateUserLevel(totalXp), [totalXp]);

  // Get recent unlocks (last 3)
  const recentUnlocks = useMemo(() => {
    return completedAchievements
      .filter(a => a.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 3);
  }, [completedAchievements]);

  // Get specific achievement progress
  const getAchievementProgress = useCallback((id: string): AchievementProgress | undefined => {
    return achievements.find(a => a.achievement.id === id);
  }, [achievements]);

  // Calculate overall completion percentage
  const completionPercentage = useMemo(() => {
    return (completedAchievements.length / ACHIEVEMENTS.length) * 100;
  }, [completedAchievements.length]);

  return {
    achievements,
    completedAchievements,
    inProgressAchievements,
    totalXp,
    level,
    recentUnlocks,
    checkAchievements,
    getAchievementProgress,
    completionPercentage,
    streak,
  };
}
