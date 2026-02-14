import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  X,
  Download,
  Copy,
  Check,
  Trophy,
  Package,
  DollarSign,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInventoryDb } from '@/hooks/useInventoryDb';
import { useAchievements } from '@/hooks/useAchievements';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ShareStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareStatsModal({ isOpen, onClose }: ShareStatsModalProps) {
  const { items } = useInventoryDb();
  const { level, streak, completedAchievements } = useAchievements();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Calculate stats
  const unsoldItems = items.filter(item => !item.sale_price);
  const totalCards = unsoldItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = unsoldItems.reduce((sum, item) => {
    const price = item.market_price || item.purchase_price;
    return sum + (price * item.quantity);
  }, 0);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = 'cardledger-stats.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "Downloaded!",
        description: "Share your stats on social media!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const copyStats = async () => {
    setCopying(true);
    const text = `📊 My CardLedger Stats\n\n📦 ${totalCards.toLocaleString()} cards\n💰 $${totalValue.toLocaleString()} portfolio value\n🏆 Level ${level.level}\n⭐ ${completedAchievements.length} achievements\n🔥 ${streak.currentStreak} day streak\n\nTrack your collection at usecardledger.com`;
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Stats copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setCopying(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-zinc-900 rounded-3xl border border-zinc-700 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">Share Your Stats</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Share Card Preview */}
              <div className="p-6">
                <div
                  ref={cardRef}
                  className="p-6 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-950 to-zinc-950 border border-navy-700/50"
                >
                  {/* Logo */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-navy-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">CL</span>
                    </div>
                    <span className="font-bold text-white">CardLedger</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-xs text-zinc-400">Cards</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {totalCards.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-zinc-400">Value</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ${totalValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-zinc-400">Level</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {level.level}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-xs text-zinc-400">Streak</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {streak.currentStreak} days
                      </p>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-sm text-zinc-400">Achievements</span>
                    <span className="text-sm font-medium text-white">
                      {completedAchievements.length} unlocked
                    </span>
                  </div>

                  {/* Footer */}
                  <p className="text-xs text-zinc-500 text-center mt-4">
                    usecardledger.com
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={copyStats}
                  className="flex-1"
                  disabled={copying}
                >
                  {copying ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copying ? 'Copied!' : 'Copy Text'}
                </Button>
                <Button
                  onClick={downloadImage}
                  className="flex-1 bg-navy-600 hover:bg-navy-500"
                  disabled={downloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? 'Saving...' : 'Save Image'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Button to open share modal
export function ShareStatsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share Stats
      </Button>
      <ShareStatsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default ShareStatsModal;
