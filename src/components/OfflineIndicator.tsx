import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { isOnline, onConnectivityChange } from "@/lib/cache";
import { motion, AnimatePresence } from "framer-motion";

export const OfflineIndicator = () => {
  const [online, setOnline] = useState(isOnline());
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const cleanup = onConnectivityChange((isNowOnline) => {
      if (!isNowOnline) setWasOffline(true);
      if (isNowOnline && wasOffline) {
        // Brief "reconnected" flash then hide
        setOnline(true);
        setTimeout(() => setWasOffline(false), 2500);
      }
      setOnline(isNowOnline);
    });
    return cleanup;
  }, [wasOffline]);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium bg-amber-500/90 text-white backdrop-blur-sm"
        >
          <WifiOff className="h-4 w-4" />
          <span>You're offline — changes will sync when connected</span>
        </motion.div>
      )}
      {online && wasOffline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium bg-emerald-500/90 text-white backdrop-blur-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Back online — syncing changes</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
