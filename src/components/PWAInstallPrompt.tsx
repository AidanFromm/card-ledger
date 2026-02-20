import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed recently
    const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setDismissed(true);
        return;
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after user has been on site for a bit
      setTimeout(() => setShowPrompt(true), 30000); // 30 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show after delay if not installed
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 45000); // 45 seconds for iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    setDismissed(true);
  };

  if (dismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary/20 to-primary/10 p-4">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/20">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Install CardLedger</h3>
                  <p className="text-xs text-muted-foreground">Get the full app experience</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              {showIOSInstructions ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    To install on iOS:
                  </p>
                  <ol className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold">1</span>
                      <span>Tap the <Share className="inline w-4 h-4" /> Share button</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold">2</span>
                      <span>Scroll and tap <Plus className="inline w-4 h-4" /> "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold">3</span>
                      <span>Tap "Add" to confirm</span>
                    </li>
                  </ol>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="w-full mt-2"
                  >
                    Got it
                  </Button>
                </div>
              ) : (
                <>
                  <ul className="text-xs text-muted-foreground space-y-1.5 mb-4">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Works offline
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Faster performance
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Home screen icon
                    </li>
                  </ul>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className="flex-1"
                    >
                      Not now
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      className="flex-1 gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Install
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
