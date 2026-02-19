// CardLedger Achievement System
// Gamification to increase engagement and retention

export type AchievementCategory = 
  | 'collection'
  | 'value'
  | 'grading'
  | 'trading'
  | 'sets'
  | 'social'
  | 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string; // Lucide icon name
  requirement: number;
  secret?: boolean;
  xp: number;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
  notified?: boolean;
}

// XP per rarity
export const RARITY_XP: Record<AchievementRarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  epic: 100,
  legendary: 250,
};

// Rarity colors (CardLedger navy theme)
export const RARITY_COLORS: Record<AchievementRarity, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-zinc-800', border: 'border-zinc-600', text: 'text-zinc-300', glow: 'shadow-zinc-500/20' },
  uncommon: { bg: 'bg-green-900/40', border: 'border-green-500/50', text: 'text-green-400', glow: 'shadow-green-500/30' },
  rare: { bg: 'bg-blue-900/40', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
  epic: { bg: 'bg-purple-900/40', border: 'border-purple-500/50', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  legendary: { bg: 'bg-amber-900/40', border: 'border-amber-500/50', text: 'text-amber-400', glow: 'shadow-amber-500/40' },
};

// Collector tier badges based on total XP
export type CollectorTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export const COLLECTOR_TIERS: Record<CollectorTier, { minXp: number; name: string; color: string }> = {
  bronze: { minXp: 0, name: 'Bronze Collector', color: 'text-amber-700' },
  silver: { minXp: 500, name: 'Silver Collector', color: 'text-zinc-300' },
  gold: { minXp: 1500, name: 'Gold Collector', color: 'text-amber-400' },
  platinum: { minXp: 3500, name: 'Platinum Collector', color: 'text-cyan-300' },
  diamond: { minXp: 7500, name: 'Diamond Collector', color: 'text-purple-400' },
};

export const getCollectorTier = (totalXp: number): { tier: CollectorTier; data: typeof COLLECTOR_TIERS[CollectorTier] } => {
  const tiers = Object.entries(COLLECTOR_TIERS).reverse() as [CollectorTier, typeof COLLECTOR_TIERS[CollectorTier]][];
  for (const [tier, data] of tiers) {
    if (totalXp >= data.minXp) {
      return { tier, data };
    }
  }
  return { tier: 'bronze', data: COLLECTOR_TIERS.bronze };
};

// All achievements
export const ACHIEVEMENTS: Achievement[] = [
  // ============ COLLECTION ACHIEVEMENTS ============
  {
    id: 'first_card',
    name: 'First Steps',
    description: 'Add your first card to the collection',
    category: 'collection',
    rarity: 'common',
    icon: 'Sparkles',
    requirement: 1,
    xp: 10,
  },
  {
    id: 'collector_10',
    name: 'Getting Started',
    description: 'Build a collection of 10 cards',
    category: 'collection',
    rarity: 'common',
    icon: 'Package',
    requirement: 10,
    xp: 15,
  },
  {
    id: 'collector_50',
    name: 'Budding Collector',
    description: 'Build a collection of 50 cards',
    category: 'collection',
    rarity: 'uncommon',
    icon: 'Layers',
    requirement: 50,
    xp: 25,
  },
  {
    id: 'collector_100',
    name: 'Serious Collector',
    description: 'Build a collection of 100 cards',
    category: 'collection',
    rarity: 'uncommon',
    icon: 'Box',
    requirement: 100,
    xp: 50,
  },
  {
    id: 'collector_500',
    name: 'Dedicated Collector',
    description: 'Build a collection of 500 cards',
    category: 'collection',
    rarity: 'rare',
    icon: 'Archive',
    requirement: 500,
    xp: 100,
  },
  {
    id: 'collector_1000',
    name: 'Master Collector',
    description: 'Build a collection of 1,000 cards',
    category: 'collection',
    rarity: 'epic',
    icon: 'Crown',
    requirement: 1000,
    xp: 200,
  },
  {
    id: 'collector_5000',
    name: 'Legendary Hoarder',
    description: 'Build a collection of 5,000 cards',
    category: 'collection',
    rarity: 'legendary',
    icon: 'Trophy',
    requirement: 5000,
    xp: 500,
  },

  // ============ VALUE ACHIEVEMENTS ============
  {
    id: 'value_100',
    name: 'First Hundred',
    description: 'Reach $100 portfolio value',
    category: 'value',
    rarity: 'common',
    icon: 'DollarSign',
    requirement: 100,
    xp: 10,
  },
  {
    id: 'value_1000',
    name: 'Four Figures',
    description: 'Reach $1,000 portfolio value',
    category: 'value',
    rarity: 'uncommon',
    icon: 'Wallet',
    requirement: 1000,
    xp: 30,
  },
  {
    id: 'value_5000',
    name: 'Serious Investment',
    description: 'Reach $5,000 portfolio value',
    category: 'value',
    rarity: 'rare',
    icon: 'TrendingUp',
    requirement: 5000,
    xp: 75,
  },
  {
    id: 'value_10000',
    name: 'Five Figures',
    description: 'Reach $10,000 portfolio value',
    category: 'value',
    rarity: 'rare',
    icon: 'Gem',
    requirement: 10000,
    xp: 100,
  },
  {
    id: 'value_50000',
    name: 'High Roller',
    description: 'Reach $50,000 portfolio value',
    category: 'value',
    rarity: 'epic',
    icon: 'Crown',
    requirement: 50000,
    xp: 200,
  },
  {
    id: 'value_100000',
    name: 'Six Figure Club',
    description: 'Reach $100,000 portfolio value',
    category: 'value',
    rarity: 'legendary',
    icon: 'Trophy',
    requirement: 100000,
    xp: 500,
  },

  // ============ GRADING ACHIEVEMENTS ============
  {
    id: 'first_graded',
    name: 'First Slab',
    description: 'Add your first graded card',
    category: 'grading',
    rarity: 'common',
    icon: 'Award',
    requirement: 1,
    xp: 15,
  },
  {
    id: 'graded_10',
    name: 'Slab Collector',
    description: 'Collect 10 graded cards',
    category: 'grading',
    rarity: 'uncommon',
    icon: 'Medal',
    requirement: 10,
    xp: 40,
  },
  {
    id: 'graded_50',
    name: 'Slab Enthusiast',
    description: 'Collect 50 graded cards',
    category: 'grading',
    rarity: 'rare',
    icon: 'Star',
    requirement: 50,
    xp: 100,
  },
  {
    id: 'first_psa10',
    name: 'Perfect 10',
    description: 'Own a PSA 10 card',
    category: 'grading',
    rarity: 'rare',
    icon: 'Zap',
    requirement: 1,
    xp: 75,
  },
  {
    id: 'grading_roi_positive',
    name: 'Smart Grader',
    description: 'Have positive ROI on a grading submission',
    category: 'grading',
    rarity: 'uncommon',
    icon: 'TrendingUp',
    requirement: 1,
    xp: 50,
  },

  // ============ TRADING ACHIEVEMENTS ============
  {
    id: 'first_sale',
    name: 'First Sale',
    description: 'Record your first sale',
    category: 'trading',
    rarity: 'common',
    icon: 'ShoppingBag',
    requirement: 1,
    xp: 15,
  },
  {
    id: 'sales_10',
    name: 'Active Seller',
    description: 'Record 10 sales',
    category: 'trading',
    rarity: 'uncommon',
    icon: 'Receipt',
    requirement: 10,
    xp: 40,
  },
  {
    id: 'sales_100',
    name: 'Power Seller',
    description: 'Record 100 sales',
    category: 'trading',
    rarity: 'rare',
    icon: 'Store',
    requirement: 100,
    xp: 100,
  },
  {
    id: 'profit_1000',
    name: 'Thousand Dollar Profit',
    description: 'Earn $1,000 in total profit',
    category: 'trading',
    rarity: 'rare',
    icon: 'Banknote',
    requirement: 1000,
    xp: 100,
  },
  {
    id: 'profit_10000',
    name: 'Professional Trader',
    description: 'Earn $10,000 in total profit',
    category: 'trading',
    rarity: 'epic',
    icon: 'BadgeDollarSign',
    requirement: 10000,
    xp: 250,
  },

  // ============ SET ACHIEVEMENTS ============
  {
    id: 'first_set_complete',
    name: 'Set Complete!',
    description: 'Complete your first set',
    category: 'sets',
    rarity: 'rare',
    icon: 'CheckCircle',
    requirement: 1,
    xp: 100,
  },
  {
    id: 'sets_5',
    name: 'Set Collector',
    description: 'Complete 5 sets',
    category: 'sets',
    rarity: 'epic',
    icon: 'Library',
    requirement: 5,
    xp: 200,
  },
  {
    id: 'master_set',
    name: 'Master Set',
    description: 'Complete a master set (including variants)',
    category: 'sets',
    rarity: 'legendary',
    icon: 'Crown',
    requirement: 1,
    xp: 500,
  },

  // ============ SOCIAL ACHIEVEMENTS ============
  {
    id: 'first_share',
    name: 'Show Off',
    description: 'Share a card or collection',
    category: 'social',
    rarity: 'common',
    icon: 'Share2',
    requirement: 1,
    xp: 10,
  },
  {
    id: 'first_client_list',
    name: 'Business Minded',
    description: 'Create your first client list',
    category: 'social',
    rarity: 'uncommon',
    icon: 'Users',
    requirement: 1,
    xp: 25,
  },
  {
    id: 'ebay_connected',
    name: 'eBay Pro',
    description: 'Connect your eBay account',
    category: 'social',
    rarity: 'uncommon',
    icon: 'Link',
    requirement: 1,
    xp: 30,
  },

  // ============ SPECIAL ACHIEVEMENTS ============
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join CardLedger in 2026',
    category: 'special',
    rarity: 'epic',
    icon: 'Rocket',
    requirement: 1,
    xp: 100,
    secret: true,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Add a card after midnight',
    category: 'special',
    rarity: 'common',
    icon: 'Moon',
    requirement: 1,
    xp: 15,
    secret: true,
  },
  {
    id: 'big_spender',
    name: 'Big Spender',
    description: 'Add a card worth $1,000+',
    category: 'special',
    rarity: 'rare',
    icon: 'Flame',
    requirement: 1,
    xp: 75,
    secret: true,
  },
  {
    id: 'scanner_pro',
    name: 'Scanner Pro',
    description: 'Scan 50 cards using AI',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Camera',
    requirement: 50,
    xp: 50,
  },
  
  // ============ STREAK ACHIEVEMENTS ============
  {
    id: 'streak_3',
    name: 'Getting Consistent',
    description: 'Use CardLedger 3 days in a row',
    category: 'special',
    rarity: 'common',
    icon: 'Flame',
    requirement: 3,
    xp: 15,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Use CardLedger 7 days in a row',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Flame',
    requirement: 7,
    xp: 35,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Use CardLedger 30 days in a row',
    category: 'special',
    rarity: 'rare',
    icon: 'Flame',
    requirement: 30,
    xp: 100,
  },
  {
    id: 'streak_100',
    name: 'Legendary Dedication',
    description: 'Use CardLedger 100 days in a row',
    category: 'special',
    rarity: 'legendary',
    icon: 'Flame',
    requirement: 100,
    xp: 500,
    secret: true,
  },

  // ============ COLLECTOR TIER ACHIEVEMENTS ============
  {
    id: 'tier_bronze',
    name: 'Bronze Collector',
    description: 'Earn your first collector tier',
    category: 'special',
    rarity: 'common',
    icon: 'Medal',
    requirement: 1,
    xp: 10,
  },
  {
    id: 'tier_silver',
    name: 'Silver Collector',
    description: 'Reach Silver tier (500 XP)',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Medal',
    requirement: 500,
    xp: 50,
  },
  {
    id: 'tier_gold',
    name: 'Gold Collector',
    description: 'Reach Gold tier (1,500 XP)',
    category: 'special',
    rarity: 'rare',
    icon: 'Medal',
    requirement: 1500,
    xp: 100,
  },
  {
    id: 'tier_platinum',
    name: 'Platinum Collector',
    description: 'Reach Platinum tier (3,500 XP)',
    category: 'special',
    rarity: 'epic',
    icon: 'Medal',
    requirement: 3500,
    xp: 200,
  },
  {
    id: 'tier_diamond',
    name: 'Diamond Collector',
    description: 'Reach Diamond tier (7,500 XP)',
    category: 'special',
    rarity: 'legendary',
    icon: 'Diamond',
    requirement: 7500,
    xp: 500,
  },

  // ============ GAME-SPECIFIC BADGES ============
  {
    id: 'pokemon_master',
    name: 'Pokémon Master',
    description: 'Collect 100+ Pokémon cards',
    category: 'collection',
    rarity: 'rare',
    icon: 'Sparkles',
    requirement: 100,
    xp: 75,
  },
  {
    id: 'onepiece_captain',
    name: 'One Piece Captain',
    description: 'Collect 50+ One Piece cards',
    category: 'collection',
    rarity: 'rare',
    icon: 'Anchor',
    requirement: 50,
    xp: 75,
  },
  {
    id: 'yugioh_duelist',
    name: 'Yu-Gi-Oh! Duelist',
    description: 'Collect 100+ Yu-Gi-Oh! cards',
    category: 'collection',
    rarity: 'rare',
    icon: 'Swords',
    requirement: 100,
    xp: 75,
  },
  {
    id: 'mtg_planeswalker',
    name: 'Planeswalker',
    description: 'Collect 100+ Magic: The Gathering cards',
    category: 'collection',
    rarity: 'rare',
    icon: 'Wand',
    requirement: 100,
    xp: 75,
  },
  {
    id: 'sports_fanatic',
    name: 'Sports Fanatic',
    description: 'Collect 100+ sports cards',
    category: 'collection',
    rarity: 'rare',
    icon: 'Trophy',
    requirement: 100,
    xp: 75,
  },
  {
    id: 'multi_tcg',
    name: 'Multi-TCG Master',
    description: 'Own cards from 3+ different TCGs',
    category: 'collection',
    rarity: 'uncommon',
    icon: 'Layers',
    requirement: 3,
    xp: 50,
  },

  // ============ SOCIAL ACHIEVEMENTS ============
  {
    id: 'viral_collection',
    name: 'Viral Collection',
    description: 'Have a shared collection viewed 100+ times',
    category: 'social',
    rarity: 'rare',
    icon: 'TrendingUp',
    requirement: 100,
    xp: 75,
    secret: true,
  },
  {
    id: 'share_5',
    name: 'Sharing is Caring',
    description: 'Share 5 cards or collections',
    category: 'social',
    rarity: 'uncommon',
    icon: 'Share2',
    requirement: 5,
    xp: 25,
  },
  {
    id: 'client_lists_5',
    name: 'Professional Dealer',
    description: 'Create 5 client lists',
    category: 'social',
    rarity: 'rare',
    icon: 'Users',
    requirement: 5,
    xp: 75,
  },

  // ============ HIDDEN/EASTER EGG ACHIEVEMENTS ============
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Add cards on both Saturday and Sunday',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Calendar',
    requirement: 1,
    xp: 25,
    secret: true,
  },
  {
    id: 'midnight_collector',
    name: 'Midnight Collector',
    description: 'Add a card at exactly midnight',
    category: 'special',
    rarity: 'rare',
    icon: 'Clock',
    requirement: 1,
    xp: 50,
    secret: true,
  },
  {
    id: 'lucky_7',
    name: 'Lucky Seven',
    description: 'Own exactly 777 cards at any point',
    category: 'special',
    rarity: 'rare',
    icon: 'Clover',
    requirement: 777,
    xp: 77,
    secret: true,
  },
  {
    id: 'round_number',
    name: 'Perfectly Balanced',
    description: 'Have a portfolio value ending in 000',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Target',
    requirement: 1,
    xp: 30,
    secret: true,
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Log in on the 100th day of the year',
    category: 'special',
    rarity: 'rare',
    icon: 'CalendarCheck',
    requirement: 1,
    xp: 100,
    secret: true,
  },

  // ============ VALUE MILESTONE ACHIEVEMENTS (Additional) ============
  {
    id: 'value_250',
    name: 'Quarter Grand',
    description: 'Reach $250 portfolio value',
    category: 'value',
    rarity: 'common',
    icon: 'Coins',
    requirement: 250,
    xp: 15,
  },
  {
    id: 'value_2500',
    name: 'Halfway to Five',
    description: 'Reach $2,500 portfolio value',
    category: 'value',
    rarity: 'uncommon',
    icon: 'PiggyBank',
    requirement: 2500,
    xp: 40,
  },
  {
    id: 'value_25000',
    name: 'Twenty-Five Grand',
    description: 'Reach $25,000 portfolio value',
    category: 'value',
    rarity: 'epic',
    icon: 'Vault',
    requirement: 25000,
    xp: 150,
  },

  // ============ TRADING ACHIEVEMENTS (Additional) ============
  {
    id: 'first_profit',
    name: 'First Profit',
    description: 'Make your first profitable sale',
    category: 'trading',
    rarity: 'common',
    icon: 'ArrowUp',
    requirement: 1,
    xp: 20,
  },
  {
    id: 'flip_king',
    name: 'Flip King',
    description: 'Make 50+ profitable sales',
    category: 'trading',
    rarity: 'epic',
    icon: 'RefreshCw',
    requirement: 50,
    xp: 150,
  },
  {
    id: 'double_up',
    name: 'Double Up',
    description: 'Sell a card for 2x+ purchase price',
    category: 'trading',
    rarity: 'rare',
    icon: 'TrendingUp',
    requirement: 1,
    xp: 75,
  },
  {
    id: 'big_sale',
    name: 'Big Sale',
    description: 'Sell a single card for $500+',
    category: 'trading',
    rarity: 'rare',
    icon: 'DollarSign',
    requirement: 1,
    xp: 75,
  },

  // ============ GRADING ACHIEVEMENTS (Additional) ============
  {
    id: 'graded_25',
    name: 'Quarter Century',
    description: 'Collect 25 graded cards',
    category: 'grading',
    rarity: 'uncommon',
    icon: 'Award',
    requirement: 25,
    xp: 60,
  },
  {
    id: 'graded_100',
    name: 'Slab Hoarder',
    description: 'Collect 100 graded cards',
    category: 'grading',
    rarity: 'epic',
    icon: 'Crown',
    requirement: 100,
    xp: 150,
  },
  {
    id: 'multi_grader',
    name: 'Multi-Grader',
    description: 'Own cards from 3+ grading companies',
    category: 'grading',
    rarity: 'uncommon',
    icon: 'Layers',
    requirement: 3,
    xp: 40,
  },
  {
    id: 'gem_hunter',
    name: 'Gem Hunter',
    description: 'Own 10+ gem mint (9.5+) graded cards',
    category: 'grading',
    rarity: 'rare',
    icon: 'Gem',
    requirement: 10,
    xp: 100,
  },
  {
    id: 'black_label',
    name: 'Black Label Collector',
    description: 'Own a BGS Black Label 10 card',
    category: 'grading',
    rarity: 'legendary',
    icon: 'Star',
    requirement: 1,
    xp: 200,
    secret: true,
  },

  // ============ GOAL ACHIEVEMENTS ============
  {
    id: 'first_goal',
    name: 'Goal Setter',
    description: 'Create your first collection goal',
    category: 'special',
    rarity: 'common',
    icon: 'Target',
    requirement: 1,
    xp: 15,
  },
  {
    id: 'goal_achiever',
    name: 'Goal Achiever',
    description: 'Complete your first goal',
    category: 'special',
    rarity: 'uncommon',
    icon: 'CheckCircle',
    requirement: 1,
    xp: 35,
  },
  {
    id: 'goal_crusher',
    name: 'Goal Crusher',
    description: 'Complete 10 collection goals',
    category: 'special',
    rarity: 'rare',
    icon: 'Trophy',
    requirement: 10,
    xp: 100,
  },

  // ============ DAILY LOGIN ACHIEVEMENTS ============
  {
    id: 'daily_claimer',
    name: 'Daily Claimer',
    description: 'Claim daily bonus 10 times',
    category: 'special',
    rarity: 'common',
    icon: 'Gift',
    requirement: 10,
    xp: 20,
  },
  {
    id: 'streak_14',
    name: 'Two Weeks Strong',
    description: 'Use CardLedger 14 days in a row',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Flame',
    requirement: 14,
    xp: 50,
  },
  {
    id: 'streak_60',
    name: 'Two Month Hero',
    description: 'Use CardLedger 60 days in a row',
    category: 'special',
    rarity: 'rare',
    icon: 'Flame',
    requirement: 60,
    xp: 150,
  },
  {
    id: 'streak_365',
    name: 'Year of Dedication',
    description: 'Use CardLedger every day for a year',
    category: 'special',
    rarity: 'legendary',
    icon: 'Crown',
    requirement: 365,
    xp: 1000,
    secret: true,
  },
];

// Helper functions
export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

export const calculateUserLevel = (totalXp: number): { level: number; currentXp: number; nextLevelXp: number } => {
  // Level formula: each level requires progressively more XP
  // Level 1: 0-100, Level 2: 100-250, Level 3: 250-450, etc.
  let level = 1;
  let xpNeeded = 100;
  let totalNeeded = 0;
  
  while (totalXp >= totalNeeded + xpNeeded) {
    totalNeeded += xpNeeded;
    level++;
    xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
  }
  
  return {
    level,
    currentXp: totalXp - totalNeeded,
    nextLevelXp: xpNeeded,
  };
};

export const getCategoryIcon = (category: AchievementCategory): string => {
  const icons: Record<AchievementCategory, string> = {
    collection: 'Package',
    value: 'DollarSign',
    grading: 'Award',
    trading: 'ShoppingBag',
    sets: 'Layers',
    social: 'Users',
    special: 'Star',
  };
  return icons[category];
};

export const getCategoryLabel = (category: AchievementCategory): string => {
  const labels: Record<AchievementCategory, string> = {
    collection: 'Collection',
    value: 'Value',
    grading: 'Grading',
    trading: 'Trading',
    sets: 'Sets',
    social: 'Social',
    special: 'Special',
  };
  return labels[category];
};
