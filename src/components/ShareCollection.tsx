import { useState, useRef, useMemo } from 'react';
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
  Link2,
  QrCode,
  ExternalLink,
  Globe,
  Lock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventoryDb } from '@/hooks/useInventoryDb';
import { useAchievements } from '@/hooks/useAchievements';
import { useToast } from '@/hooks/use-toast';
import { useSharing } from '@/hooks/useSharing';
import {
  generateCollectionLink,
  socialShareUrls,
  openShareWindow,
  copyToClipboard,
  generateShareMessage,
  generateStatsImage,
  downloadImage,
  nativeShare,
  dataUrlToFile,
  isWebShareSupported,
} from '@/lib/shareUtils';

// Social platform icons
const TwitterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const RedditIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

interface ShareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareCollectionModal({ isOpen, onClose }: ShareCollectionModalProps) {
  const { items } = useInventoryDb();
  const { level, streak, completedAchievements } = useAchievements();
  const { toast } = useToast();
  const { shares, createShare, getShareUrl } = useSharing();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    showValues: true,
    showPurchasePrices: false,
    isPublic: false,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const unsoldItems = items.filter(item => !item.sale_price);
    const totalCards = unsoldItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = unsoldItems.reduce((sum, item) => {
      const price = item.market_price || item.purchase_price;
      return sum + (price * item.quantity);
    }, 0);
    return { totalCards, totalValue };
  }, [items]);

  // Get existing collection share
  const existingCollectionShare = useMemo(() => {
    return shares.find(s => s.share_type === 'collection' && s.is_active);
  }, [shares]);

  const shareUrl = existingCollectionShare 
    ? getShareUrl(existingCollectionShare.share_token)
    : null;

  const shareMessage = generateShareMessage({
    totalCards: stats.totalCards,
    totalValue: stats.totalValue,
    level: level.level,
    achievements: completedAchievements.length,
  });

  // Create shareable link
  const handleCreateLink = async () => {
    setCreatingLink(true);
    try {
      const share = await createShare({
        title: 'My Collection',
        description: `${stats.totalCards} cards worth $${stats.totalValue.toLocaleString()}`,
        shareType: 'collection',
        showValues: shareSettings.showValues,
        showPurchasePrices: shareSettings.showPurchasePrices,
        expiration: 'never',
      });
      
      if (share) {
        const url = getShareUrl(share.share_token);
        await copyToClipboard(url);
        toast({
          title: 'Link created & copied!',
          description: 'Share your collection with anyone.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive',
      });
    } finally {
      setCreatingLink(false);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    setCopying(true);
    const success = await copyToClipboard(shareUrl);
    
    if (success) {
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
    
    setTimeout(() => setCopying(false), 2000);
  };

  // Download stats image
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    
    setDownloading(true);
    try {
      const dataUrl = await generateStatsImage(cardRef.current);
      if (dataUrl) {
        downloadImage(dataUrl, 'cardledger-collection.png');
        toast({
          title: 'Downloaded!',
          description: 'Share your stats on social media!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  // Share to social platforms
  const handleShare = async (platform: 'twitter' | 'discord' | 'reddit' | 'whatsapp' | 'telegram') => {
    const url = shareUrl || 'https://usecardledger.com';
    const text = shareMessage;
    
    switch (platform) {
      case 'twitter':
        openShareWindow(socialShareUrls.twitter(url, text), 'twitter');
        break;
      case 'discord':
        // Copy Discord-formatted message
        const discordText = socialShareUrls.discord(url, text);
        await copyToClipboard(discordText);
        toast({
          title: 'Copied for Discord!',
          description: 'Paste this message in any Discord channel',
        });
        break;
      case 'reddit':
        openShareWindow(socialShareUrls.reddit(url, 'Check out my card collection!'), 'reddit');
        break;
      case 'whatsapp':
        window.open(socialShareUrls.whatsapp(url, text), '_blank');
        break;
      case 'telegram':
        window.open(socialShareUrls.telegram(url, text), '_blank');
        break;
    }
  };

  // Native share
  const handleNativeShare = async () => {
    const url = shareUrl || 'https://usecardledger.com';
    
    // Try to share with image
    if (cardRef.current) {
      try {
        const dataUrl = await generateStatsImage(cardRef.current);
        if (dataUrl) {
          const file = await dataUrlToFile(dataUrl, 'cardledger-stats.png');
          if (file && navigator.canShare?.({ files: [file] })) {
            const success = await nativeShare({
              title: 'My CardLedger Collection',
              text: shareMessage,
              url,
              files: [file],
            });
            if (success) return;
          }
        }
      } catch {
        // Fall through to share without image
      }
    }
    
    // Share without image
    const success = await nativeShare({
      title: 'My CardLedger Collection',
      text: shareMessage,
      url,
    });
    
    if (!success) {
      // Fallback to copying link
      await handleCopyLink();
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
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-zinc-900 rounded-3xl border border-zinc-700 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">Share Collection</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <Tabs defaultValue="link" className="p-6">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="link" className="gap-2">
                    <Link2 className="w-4 h-4" />
                    Link
                  </TabsTrigger>
                  <TabsTrigger value="social" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="gap-2">
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </TabsTrigger>
                </TabsList>

                {/* Link Tab */}
                <TabsContent value="link" className="space-y-6">
                  {/* Settings */}
                  <div className="space-y-4 p-4 rounded-xl bg-zinc-800/50">
                    <h3 className="font-medium text-sm text-zinc-400">Privacy Settings</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Show Values</Label>
                        <p className="text-xs text-zinc-500">Display market values on cards</p>
                      </div>
                      <Switch
                        checked={shareSettings.showValues}
                        onCheckedChange={(checked) =>
                          setShareSettings(s => ({ ...s, showValues: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Show Purchase Prices</Label>
                        <p className="text-xs text-zinc-500">Display what you paid</p>
                      </div>
                      <Switch
                        checked={shareSettings.showPurchasePrices}
                        onCheckedChange={(checked) =>
                          setShareSettings(s => ({ ...s, showPurchasePrices: checked }))
                        }
                      />
                    </div>
                  </div>

                  {/* Share Link */}
                  {shareUrl ? (
                    <div className="space-y-3">
                      <Label className="text-sm text-zinc-400">Your share link</Label>
                      <div className="flex gap-2">
                        <Input
                          value={shareUrl}
                          readOnly
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <Button
                          variant="outline"
                          onClick={handleCopyLink}
                          disabled={copying}
                        >
                          {copying ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(shareUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCreateLink}
                      disabled={creatingLink}
                      className="w-full"
                    >
                      {creatingLink ? (
                        <>Creating...</>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Create Share Link
                        </>
                      )}
                    </Button>
                  )}
                </TabsContent>

                {/* Social Tab */}
                <TabsContent value="social" className="space-y-6">
                  {/* Stats Card Preview */}
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
                          {stats.totalCards.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-zinc-400">Value</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          ${stats.totalValue.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-zinc-400">Level</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{level.level}</p>
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

                    <p className="text-xs text-zinc-500 text-center">
                      usecardledger.com
                    </p>
                  </div>

                  {/* Social Buttons */}
                  <div className="grid grid-cols-5 gap-3">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      <TwitterIcon />
                      <span className="text-xs text-zinc-400">Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare('discord')}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      <DiscordIcon />
                      <span className="text-xs text-zinc-400">Discord</span>
                    </button>
                    <button
                      onClick={() => handleShare('reddit')}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      <RedditIcon />
                      <span className="text-xs text-zinc-400">Reddit</span>
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      <WhatsAppIcon />
                      <span className="text-xs text-zinc-400">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleShare('telegram')}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      <TelegramIcon />
                      <span className="text-xs text-zinc-400">Telegram</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleDownloadImage}
                      className="flex-1"
                      disabled={downloading}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {downloading ? 'Saving...' : 'Save Image'}
                    </Button>
                    {isWebShareSupported() && (
                      <Button
                        onClick={handleNativeShare}
                        className="flex-1 bg-navy-600 hover:bg-navy-500"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    )}
                  </div>
                </TabsContent>

                {/* QR Code Tab */}
                <TabsContent value="qr" className="space-y-6">
                  <div className="flex flex-col items-center">
                    {shareUrl ? (
                      <>
                        <div className="p-6 bg-white rounded-2xl">
                          <QRCodeSVG
                            value={shareUrl}
                            size={200}
                            level="H"
                            includeMargin
                          />
                        </div>
                        <p className="text-sm text-zinc-400 mt-4 text-center">
                          Scan to view your collection
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleCopyLink}
                          className="mt-4"
                          disabled={copying}
                        >
                          {copying ? (
                            <Check className="w-4 h-4 mr-2" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          {copying ? 'Copied!' : 'Copy Link'}
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <QrCode className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-4">
                          Create a share link first to generate a QR code
                        </p>
                        <Button onClick={handleCreateLink} disabled={creatingLink}>
                          {creatingLink ? 'Creating...' : 'Create Share Link'}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Convenience button component
export function ShareCollectionButton() {
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
        Share Collection
      </Button>
      <ShareCollectionModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default ShareCollectionModal;
