import { useState, useEffect, useCallback } from 'react';

const DAILY_LOGIN_KEY = 'cardledger_daily_login';
const TIPS_SHOWN_KEY = 'cardledger_tips_shown';

// Collection tips and facts
const DAILY_TIPS = [
  { tip: "PSA 10s typically command a 2-3x premium over PSA 9s for modern cards", category: "Grading" },
  { tip: "Store cards in a cool, dry place away from direct sunlight to prevent warping", category: "Storage" },
  { tip: "Check sold listings, not current listings, to get accurate market values", category: "Pricing" },
  { tip: "Centering is the #1 reason for grade reductions on modern cards", category: "Grading" },
  { tip: "Consider raw card sales tax - graded cards may have different tax rules", category: "Selling" },
  { tip: "Japanese cards often have different centering standards than English", category: "Collecting" },
  { tip: "First edition cards aren't always worth more - condition is king", category: "Collecting" },
  { tip: "CGC slabs are thinner than PSA, useful for display cases with limited space", category: "Grading" },
  { tip: "Check the back corners for whitening - a common flaw in newer cards", category: "Grading" },
  { tip: "Penny sleeves + toploaders are the most cost-effective protection", category: "Storage" },
  { tip: "Holo bleed can add value to certain vintage cards", category: "Collecting" },
  { tip: "Track your cost basis for accurate profit/loss calculations", category: "Business" },
  { tip: "Pop reports show rarity - low population means potentially higher value", category: "Grading" },
  { tip: "Season matters - card values often peak during holidays and tax season", category: "Selling" },
  { tip: "Complete sets can be worth more than individual cards combined", category: "Collecting" },
  { tip: "One Touch magnetic cases are great for display but not long-term storage", category: "Storage" },
  { tip: "Research a card's print run before assuming it's rare", category: "Collecting" },
  { tip: "Authentication services catch fakes - consider for high-value purchases", category: "Buying" },
  { tip: "Sub-grades can significantly impact resale value", category: "Grading" },
  { tip: "Insurance your collection if it exceeds $5,000 in value", category: "Storage" },
  { tip: "Market trends follow content creators - stay informed on what's hot", category: "Trends" },
  { tip: "Bulk lots can hide gems - check carefully before dismissing", category: "Buying" },
  { tip: "Crossover submissions can upgrade grades between companies", category: "Grading" },
  { tip: "Keep receipts and certificates for provenance documentation", category: "Business" },
  { tip: "Watch for reprint announcements - they can crash single card values", category: "Trends" },
  { tip: "Gem mint vintage > Near mint modern for investment purposes", category: "Investing" },
  { tip: "Learn to spot pack fresh cards - whitening on pull is a red flag", category: "Buying" },
  { tip: "Diversify across TCGs to hedge against individual game declines", category: "Investing" },
  { tip: "Error cards and misprints can be surprisingly valuable", category: "Collecting" },
  { tip: "Always video record opening high-value sealed products", category: "Business" },
];

// Fun collector facts
const DAILY_FACTS = [
  { fact: "The most expensive Pokémon card ever sold was a PSA 10 Pikachu Illustrator for $5.275 million", category: "Records" },
  { fact: "Magic: The Gathering was the first trading card game, released in 1993", category: "History" },
  { fact: "The Pokémon TCG has printed over 52 billion cards worldwide", category: "Stats" },
  { fact: "A PSA 10 1st Edition Base Set Charizard sold for $420,000 in 2022", category: "Records" },
  { fact: "The rarest Yu-Gi-Oh! card is the Tournament Black Luster Soldier", category: "Rarity" },
  { fact: "One Piece TCG became the #2 selling TCG within 2 years of release", category: "Trends" },
  { fact: "The first sports card was a baseball card from 1860s", category: "History" },
  { fact: "PSA has graded over 50 million cards since 1991", category: "Stats" },
  { fact: "Japanese Pokémon cards were released before English ones", category: "History" },
  { fact: "The term 'chase card' originated from kids literally chasing each other for rare cards", category: "History" },
  { fact: "Holofoil technology in cards uses a similar process to holograms on credit cards", category: "Tech" },
  { fact: "A complete set of 1st Edition Base Set Pokémon cards (103) sold for over $650,000", category: "Records" },
  { fact: "The TCG industry is valued at over $13 billion globally", category: "Stats" },
  { fact: "BGS Black Label 10s are rarer than PSA 10s due to stricter standards", category: "Grading" },
  { fact: "Some vintage cards were cut from sheets by hand, causing centering issues", category: "History" },
];

export interface DailyLoginData {
  streak: number;
  lastLoginDate: string;
  longestStreak: number;
  totalLogins: number;
  streakBonusLevel: 'none' | 'week' | 'month' | 'legend';
  todaysClaimed: boolean;
  xpEarned: number;
}

export interface DailyContent {
  tip: { tip: string; category: string } | null;
  fact: { fact: string; category: string } | null;
}

export interface UseDailyLoginReturn {
  loginData: DailyLoginData;
  dailyContent: DailyContent;
  claimDailyBonus: () => number;
  getStreakXpBonus: () => number;
  isNewDay: boolean;
  nextBonusMilestone: { days: number; label: string } | null;
}

const getToday = () => new Date().toISOString().split('T')[0];

const calculateStreakBonusLevel = (streak: number): DailyLoginData['streakBonusLevel'] => {
  if (streak >= 100) return 'legend';
  if (streak >= 30) return 'month';
  if (streak >= 7) return 'week';
  return 'none';
};

const getStreakXp = (streak: number, bonusLevel: DailyLoginData['streakBonusLevel']): number => {
  let baseXp = 5; // Base daily XP
  
  // Bonus XP for streaks
  switch (bonusLevel) {
    case 'legend':
      baseXp += 50; // 100-day streak bonus
      break;
    case 'month':
      baseXp += 25; // 30-day streak bonus
      break;
    case 'week':
      baseXp += 10; // 7-day streak bonus
      break;
  }
  
  // Small incremental bonus based on streak
  baseXp += Math.min(streak, 30); // Cap at +30 XP for long streaks
  
  return baseXp;
};

export function useDailyLogin(): UseDailyLoginReturn {
  const [loginData, setLoginData] = useState<DailyLoginData>({
    streak: 0,
    lastLoginDate: '',
    longestStreak: 0,
    totalLogins: 0,
    streakBonusLevel: 'none',
    todaysClaimed: false,
    xpEarned: 0,
  });
  
  const [dailyContent, setDailyContent] = useState<DailyContent>({
    tip: null,
    fact: null,
  });
  
  const [isNewDay, setIsNewDay] = useState(false);

  // Load and process login data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DAILY_LOGIN_KEY);
      const today = getToday();
      
      if (saved) {
        const parsed: DailyLoginData = JSON.parse(saved);
        const lastDate = parsed.lastLoginDate;
        
        // Calculate days between last login and today
        const lastDateTime = new Date(lastDate).getTime();
        const todayTime = new Date(today).getTime();
        const diffDays = Math.floor((todayTime - lastDateTime) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          // Same day - no changes needed
          setLoginData(parsed);
          setIsNewDay(false);
        } else if (diffDays === 1) {
          // Consecutive day - increment streak
          const newStreak = parsed.streak + 1;
          const newData: DailyLoginData = {
            streak: newStreak,
            lastLoginDate: today,
            longestStreak: Math.max(newStreak, parsed.longestStreak),
            totalLogins: parsed.totalLogins + 1,
            streakBonusLevel: calculateStreakBonusLevel(newStreak),
            todaysClaimed: false,
            xpEarned: parsed.xpEarned,
          };
          localStorage.setItem(DAILY_LOGIN_KEY, JSON.stringify(newData));
          setLoginData(newData);
          setIsNewDay(true);
        } else {
          // Streak broken - reset to 1
          const newData: DailyLoginData = {
            streak: 1,
            lastLoginDate: today,
            longestStreak: parsed.longestStreak,
            totalLogins: parsed.totalLogins + 1,
            streakBonusLevel: 'none',
            todaysClaimed: false,
            xpEarned: parsed.xpEarned,
          };
          localStorage.setItem(DAILY_LOGIN_KEY, JSON.stringify(newData));
          setLoginData(newData);
          setIsNewDay(true);
        }
      } else {
        // First login ever
        const newData: DailyLoginData = {
          streak: 1,
          lastLoginDate: today,
          longestStreak: 1,
          totalLogins: 1,
          streakBonusLevel: 'none',
          todaysClaimed: false,
          xpEarned: 0,
        };
        localStorage.setItem(DAILY_LOGIN_KEY, JSON.stringify(newData));
        setLoginData(newData);
        setIsNewDay(true);
      }
      
      // Load daily tip/fact based on a deterministic index for the day
      const shownTips = JSON.parse(localStorage.getItem(TIPS_SHOWN_KEY) || '[]');
      const dayIndex = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
      
      // Cycle through tips/facts
      const tipIndex = dayIndex % DAILY_TIPS.length;
      const factIndex = (dayIndex + Math.floor(DAILY_TIPS.length / 2)) % DAILY_FACTS.length;
      
      setDailyContent({
        tip: DAILY_TIPS[tipIndex],
        fact: DAILY_FACTS[factIndex],
      });
      
    } catch (e) {
      console.error('Error loading daily login data:', e);
    }
  }, []);

  // Claim daily bonus
  const claimDailyBonus = useCallback((): number => {
    if (loginData.todaysClaimed) return 0;
    
    const xp = getStreakXp(loginData.streak, loginData.streakBonusLevel);
    
    const newData: DailyLoginData = {
      ...loginData,
      todaysClaimed: true,
      xpEarned: loginData.xpEarned + xp,
    };
    
    localStorage.setItem(DAILY_LOGIN_KEY, JSON.stringify(newData));
    setLoginData(newData);
    
    return xp;
  }, [loginData]);

  // Get current streak XP bonus
  const getStreakXpBonus = useCallback((): number => {
    return getStreakXp(loginData.streak, loginData.streakBonusLevel);
  }, [loginData]);

  // Calculate next bonus milestone
  const nextBonusMilestone = (() => {
    const { streak } = loginData;
    
    if (streak < 7) {
      return { days: 7 - streak, label: '7-day streak bonus' };
    } else if (streak < 30) {
      return { days: 30 - streak, label: '30-day streak bonus' };
    } else if (streak < 100) {
      return { days: 100 - streak, label: 'Legendary 100-day bonus' };
    }
    return null;
  })();

  return {
    loginData,
    dailyContent,
    claimDailyBonus,
    getStreakXpBonus,
    isNewDay,
    nextBonusMilestone,
  };
}
