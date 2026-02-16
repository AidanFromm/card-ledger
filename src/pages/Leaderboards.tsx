import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Medal, 
  TrendingUp, 
  Package, 
  Award,
  ChevronRight,
  Flame,
  Star,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

// Mock leaderboard data - will be replaced with Supabase later
const MOCK_LEADERBOARDS = {
  portfolioValue: [
    { id: '1', username: 'CardMaster99', value: 152340, avatar: 'CM', level: 42, streak: 156 },
    { id: '2', username: 'SlabKing', value: 98750, avatar: 'SK', level: 38, streak: 89 },
    { id: '3', username: 'PokéCollector', value: 87200, avatar: 'PC', level: 35, streak: 234 },
    { id: '4', username: 'VintageHunter', value: 65430, avatar: 'VH', level: 31, streak: 45 },
    { id: '5', username: 'GradedGems', value: 54200, avatar: 'GG', level: 28, streak: 67 },
    { id: '6', username: 'TCGTrader', value: 48900, avatar: 'TT', level: 26, streak: 23 },
    { id: '7', username: 'RareFinder', value: 42100, avatar: 'RF', level: 24, streak: 112 },
    { id: '8', username: 'CardShark', value: 38500, avatar: 'CS', level: 22, streak: 34 },
    { id: '9', username: 'SlabStacker', value: 35200, avatar: 'SS', level: 21, streak: 78 },
    { id: '10', username: 'MintCondition', value: 32800, avatar: 'MC', level: 20, streak: 56 },
  ],
  cardCount: [
    { id: '3', username: 'PokéCollector', cards: 4523, avatar: 'PC', level: 35, streak: 234 },
    { id: '1', username: 'CardMaster99', cards: 3847, avatar: 'CM', level: 42, streak: 156 },
    { id: '7', username: 'RareFinder', cards: 2956, avatar: 'RF', level: 24, streak: 112 },
    { id: '2', username: 'SlabKing', cards: 2341, avatar: 'SK', level: 38, streak: 89 },
    { id: '9', username: 'SlabStacker', cards: 1987, avatar: 'SS', level: 21, streak: 78 },
    { id: '4', username: 'VintageHunter', cards: 1654, avatar: 'VH', level: 31, streak: 45 },
    { id: '5', username: 'GradedGems', cards: 1432, avatar: 'GG', level: 28, streak: 67 },
    { id: '10', username: 'MintCondition', cards: 1298, avatar: 'MC', level: 20, streak: 56 },
    { id: '6', username: 'TCGTrader', cards: 1145, avatar: 'TT', level: 26, streak: 23 },
    { id: '8', username: 'CardShark', cards: 987, avatar: 'CS', level: 22, streak: 34 },
  ],
  monthlyRoi: [
    { id: '6', username: 'TCGTrader', roi: 34.5, avatar: 'TT', level: 26, streak: 23 },
    { id: '8', username: 'CardShark', roi: 28.2, avatar: 'CS', level: 22, streak: 34 },
    { id: '2', username: 'SlabKing', roi: 24.8, avatar: 'SK', level: 38, streak: 89 },
    { id: '4', username: 'VintageHunter', roi: 21.3, avatar: 'VH', level: 31, streak: 45 },
    { id: '1', username: 'CardMaster99', roi: 18.7, avatar: 'CM', level: 42, streak: 156 },
    { id: '5', username: 'GradedGems', roi: 15.2, avatar: 'GG', level: 28, streak: 67 },
    { id: '9', username: 'SlabStacker', roi: 12.9, avatar: 'SS', level: 21, streak: 78 },
    { id: '3', username: 'PokéCollector', roi: 10.4, avatar: 'PC', level: 35, streak: 234 },
    { id: '7', username: 'RareFinder', roi: 8.1, avatar: 'RF', level: 24, streak: 112 },
    { id: '10', username: 'MintCondition', roi: 5.6, avatar: 'MC', level: 20, streak: 56 },
  ],
  achievements: [
    { id: '1', username: 'CardMaster99', achievements: 38, avatar: 'CM', level: 42, streak: 156 },
    { id: '2', username: 'SlabKing', achievements: 35, avatar: 'SK', level: 38, streak: 89 },
    { id: '3', username: 'PokéCollector', achievements: 33, avatar: 'PC', level: 35, streak: 234 },
    { id: '4', username: 'VintageHunter', achievements: 29, avatar: 'VH', level: 31, streak: 45 },
    { id: '5', username: 'GradedGems', achievements: 27, avatar: 'GG', level: 28, streak: 67 },
    { id: '6', username: 'TCGTrader', achievements: 24, avatar: 'TT', level: 26, streak: 23 },
    { id: '7', username: 'RareFinder', achievements: 22, avatar: 'RF', level: 24, streak: 112 },
    { id: '8', username: 'CardShark', achievements: 20, avatar: 'CS', level: 22, streak: 34 },
    { id: '9', username: 'SlabStacker', achievements: 18, avatar: 'SS', level: 21, streak: 78 },
    { id: '10', username: 'MintCondition', achievements: 16, avatar: 'MC', level: 20, streak: 56 },
  ],
};

type LeaderboardType = 'portfolioValue' | 'cardCount' | 'monthlyRoi' | 'achievements';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-amber-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-zinc-300" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-muted-foreground font-mono text-sm">#{rank}</span>;
  }
};

const getRankStyle = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/50';
    case 2:
      return 'bg-gradient-to-r from-zinc-400/20 to-zinc-500/10 border-zinc-400/50';
    case 3:
      return 'bg-gradient-to-r from-amber-700/20 to-amber-800/10 border-amber-700/50';
    default:
      return 'bg-card border-border';
  }
};

interface LeaderboardEntryProps {
  rank: number;
  username: string;
  avatar: string;
  level: number;
  streak: number;
  value: string;
  valueLabel: string;
  isCurrentUser?: boolean;
}

const LeaderboardEntry = ({ 
  rank, 
  username, 
  avatar, 
  level, 
  streak,
  value, 
  valueLabel,
  isCurrentUser 
}: LeaderboardEntryProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.05 }}
    className={`
      flex items-center gap-4 p-4 rounded-xl border transition-all
      ${getRankStyle(rank)}
      ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
      hover:scale-[1.01] cursor-pointer
    `}
  >
    <div className="w-8 flex justify-center">
      {getRankIcon(rank)}
    </div>
    
    <Avatar className="h-10 w-10">
      <AvatarFallback className="bg-primary/20 text-primary font-bold">
        {avatar}
      </AvatarFallback>
    </Avatar>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold truncate">{username}</span>
        {isCurrentUser && (
          <Badge variant="outline" className="text-xs">You</Badge>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          Level {level}
        </span>
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-400" />
          {streak} day streak
        </span>
      </div>
    </div>
    
    <div className="text-right">
      <div className="font-bold text-lg">{value}</div>
      <div className="text-xs text-muted-foreground">{valueLabel}</div>
    </div>
    
    <ChevronRight className="w-4 h-4 text-muted-foreground" />
  </motion.div>
);

const Leaderboards = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('portfolioValue');
  
  const formatValue = (type: LeaderboardType, entry: any): { value: string; label: string } => {
    switch (type) {
      case 'portfolioValue':
        return { 
          value: `$${entry.value.toLocaleString()}`, 
          label: 'portfolio' 
        };
      case 'cardCount':
        return { 
          value: entry.cards.toLocaleString(), 
          label: 'cards' 
        };
      case 'monthlyRoi':
        return { 
          value: `+${entry.roi}%`, 
          label: 'this month' 
        };
      case 'achievements':
        return { 
          value: entry.achievements.toString(), 
          label: 'unlocked' 
        };
      default:
        return { value: '', label: '' };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Leaderboards</h1>
          <p className="text-muted-foreground mt-2">
            See how you stack up against other collectors
          </p>
        </motion.div>

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Community Leaderboards Coming Soon!</p>
                  <p className="text-sm text-muted-foreground">
                    Compete with collectors worldwide. Opt-in when you're ready.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leaderboard Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardType)}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="portfolioValue" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="hidden sm:inline">Value</span>
            </TabsTrigger>
            <TabsTrigger value="cardCount" className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span className="hidden sm:inline">Cards</span>
            </TabsTrigger>
            <TabsTrigger value="monthlyRoi" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="hidden sm:inline">ROI</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {(['portfolioValue', 'cardCount', 'monthlyRoi', 'achievements'] as const).map((type) => (
              <TabsContent key={type} value={type} className="space-y-3">
                {MOCK_LEADERBOARDS[type].map((entry, index) => {
                  const { value, label } = formatValue(type, entry);
                  return (
                    <LeaderboardEntry
                      key={entry.id}
                      rank={index + 1}
                      username={entry.username}
                      avatar={entry.avatar}
                      level={entry.level}
                      streak={entry.streak}
                      value={value}
                      valueLabel={label}
                      isCurrentUser={entry.id === '7'} // Mock current user
                    />
                  );
                })}
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>

        {/* Your Ranking Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Your Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">#7</div>
                  <div className="text-xs text-muted-foreground">Portfolio Value</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">#3</div>
                  <div className="text-xs text-muted-foreground">Card Count</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">#9</div>
                  <div className="text-xs text-muted-foreground">Monthly ROI</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">#7</div>
                  <div className="text-xs text-muted-foreground">Achievements</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Leaderboards;
