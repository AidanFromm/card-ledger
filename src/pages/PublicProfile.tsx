import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Package,
  DollarSign,
  Trophy,
  Star,
  Flame,
  Calendar,
  ExternalLink,
  Home,
  AlertCircle,
  Share2,
  Award,
  Box,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import CardImage from '@/components/CardImage';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

interface PublicProfileData {
  userId: string;
  shareToken: string;
  title: string;
  description: string | null;
  showValues: boolean;
  showPurchasePrices: boolean;
  viewCount: number;
  createdAt: string;
}

interface ProfileStats {
  totalCards: number;
  totalValue: number;
  uniqueCards: number;
  gradedCards: number;
  topSets: Array<{ name: string; count: number }>;
}

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats from items
  const stats = useMemo((): ProfileStats => {
    const unsoldItems = items.filter(item => !item.sale_price);
    const totalCards = unsoldItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = unsoldItems.reduce((sum, item) => {
      const price = item.market_price || item.purchase_price || 0;
      return sum + price * item.quantity;
    }, 0);
    const gradedCards = unsoldItems.filter(item => item.grading_company !== 'raw').length;
    
    // Count cards by set
    const setCounts: Record<string, number> = {};
    unsoldItems.forEach(item => {
      setCounts[item.set_name] = (setCounts[item.set_name] || 0) + item.quantity;
    });
    
    const topSets = Object.entries(setCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalCards,
      totalValue,
      uniqueCards: unsoldItems.length,
      gradedCards,
      topSets,
    };
  }, [items]);

  // Get top valuable cards
  const topCards = useMemo(() => {
    return items
      .filter(item => !item.sale_price && (item.market_price || item.purchase_price))
      .sort((a, b) => {
        const priceA = a.market_price || a.purchase_price || 0;
        const priceB = b.market_price || b.purchase_price || 0;
        return priceB - priceA;
      })
      .slice(0, 8);
  }, [items]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setError('Invalid profile URL');
        setLoading(false);
        return;
      }

      try {
        // For now, we use share tokens as "usernames" for public profiles
        // This queries the shared_collections table for a profile-type share
        // or falls back to any collection share with this token
        const { data: shareData, error: shareError } = await supabase
          .from('shared_collections')
          .select('*')
          .eq('share_token', username)
          .eq('is_active', true)
          .single();

        if (shareError) {
          if (shareError.code === 'PGRST116') {
            setError('Profile not found');
          } else {
            throw shareError;
          }
          setLoading(false);
          return;
        }

        // Check if expired
        if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
          setError('This profile link has expired');
          setLoading(false);
          return;
        }

        setProfile({
          userId: shareData.user_id,
          shareToken: shareData.share_token,
          title: shareData.title,
          description: shareData.description,
          showValues: shareData.show_values,
          showPurchasePrices: shareData.show_purchase_prices,
          viewCount: shareData.view_count,
          createdAt: shareData.created_at,
        });

        // Increment view count
        await supabase.rpc('increment_share_view_count', { token: username });

        // Fetch user's items based on share type
        let fetchedItems: InventoryItem[] = [];

        if (shareData.share_type === 'collection') {
          const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('user_id', shareData.user_id)
            .is('sale_price', null)
            .gt('quantity', 0)
            .order('market_price', { ascending: false, nullsFirst: false });

          if (error) throw error;
          fetchedItems = data || [];
        } else if (shareData.share_type === 'folder' && shareData.folder_id) {
          const { data: folderItems, error: fiError } = await supabase
            .from('folder_items')
            .select('inventory_item_id')
            .eq('folder_id', shareData.folder_id);

          if (fiError) throw fiError;

          if (folderItems && folderItems.length > 0) {
            const itemIds = folderItems.map(fi => fi.inventory_item_id);
            const { data, error } = await supabase
              .from('inventory_items')
              .select('*')
              .in('id', itemIds)
              .is('sale_price', null)
              .gt('quantity', 0)
              .order('market_price', { ascending: false, nullsFirst: false });

            if (error) throw error;
            fetchedItems = data || [];
          }
        } else if (shareData.share_type === 'selection') {
          const { data: selectionItems, error: siError } = await supabase
            .from('shared_collection_items')
            .select('inventory_item_id')
            .eq('shared_collection_id', shareData.id);

          if (siError) throw siError;

          if (selectionItems && selectionItems.length > 0) {
            const itemIds = selectionItems.map(si => si.inventory_item_id);
            const { data, error } = await supabase
              .from('inventory_items')
              .select('*')
              .in('id', itemIds)
              .is('sale_price', null)
              .gt('quantity', 0)
              .order('market_price', { ascending: false, nullsFirst: false });

            if (error) throw error;
            fetchedItems = data || [];
          }
        }

        setItems(fetchedItems);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-32 w-full rounded-2xl mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'This profile may have been removed or the link is invalid.'}
          </p>
          <Link to="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Go to CardLedger
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const getGradingBadge = (item: InventoryItem) => {
    if (item.grading_company === 'raw') {
      return (
        <Badge variant="secondary" className="text-xs">
          <Package className="h-3 w-3 mr-1" />
          Raw
        </Badge>
      );
    }
    return (
      <Badge className="text-xs bg-primary/80">
        <Award className="h-3 w-3 mr-1" />
        {item.grading_company.toUpperCase()} {item.grade}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo className="h-8 w-8" />
              <span className="font-semibold text-lg">CardLedger</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {profile.viewCount} views
              </span>
              <Link to="/">
                <Button size="sm" variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Start Collecting
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{profile.title}</h1>
                {profile.description && (
                  <p className="text-muted-foreground mt-1">{profile.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Collecting since {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Cards</span>
              </div>
              <p className="text-3xl font-bold">{stats.totalCards.toLocaleString()}</p>
            </div>

            {profile.showValues && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Portfolio Value</span>
                </div>
                <p className="text-3xl font-bold text-emerald-500">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
            )}

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">Unique Cards</span>
              </div>
              <p className="text-3xl font-bold">{stats.uniqueCards.toLocaleString()}</p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-muted-foreground">Graded Cards</span>
              </div>
              <p className="text-3xl font-bold">{stats.gradedCards.toLocaleString()}</p>
            </div>
          </motion.div>

          {/* Top Sets */}
          {stats.topSets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6 mb-8"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Top Sets
              </h2>
              <div className="space-y-3">
                {stats.topSets.map((set, index) => (
                  <div key={set.name} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">{set.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {set.count} cards
                        </span>
                      </div>
                      <Progress
                        value={(set.count / stats.topSets[0].count) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Cards */}
          {topCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                {profile.showValues ? 'Most Valuable Cards' : 'Featured Cards'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {topCards.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="group relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg"
                  >
                    {/* Card Image */}
                    <div className="aspect-[3/4] bg-secondary/30 relative overflow-hidden">
                      <CardImage
                        src={item.card_image_url}
                        alt={item.name}
                        size="lg"
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Rank Badge */}
                      {index < 3 && (
                        <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-amber-500 text-black' :
                          index === 1 ? 'bg-zinc-300 text-black' :
                          'bg-amber-700 text-white'
                        }`}>
                          {index + 1}
                        </div>
                      )}

                      {/* Quantity Badge */}
                      {item.quantity > 1 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-medium">
                          ×{item.quantity}
                        </div>
                      )}

                      {/* Grading Badge */}
                      <div className="absolute bottom-2 left-2">
                        {getGradingBadge(item)}
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {item.set_name}
                      </p>

                      {/* Price Info */}
                      {profile.showValues && (item.market_price || item.purchase_price) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-emerald-500">
                            ${(item.market_price || item.purchase_price || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {items.length === 0 && (
            <div className="text-center py-16">
              <Box className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Cards Yet</h2>
              <p className="text-muted-foreground">
                This collection doesn't have any cards to display.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Logo className="h-5 w-5" />
            <span>Powered by CardLedger</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Track, organize, and share your card collection
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicProfile;
