import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { isOnline, onConnectivityChange } from "@/lib/cache";

interface OfflineIndicatorProps {
  isSyncing?: boolean;
  lastSyncTime?: number | null;
}

export const OfflineIndicator = ({ isSyncing, lastSyncTime }: OfflineIndicatorProps) => {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const cleanup = onConnectivityChange(setOnline);
    return cleanup;
  }, []);

  const formatLastSync = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (online && !isSyncing) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${
        online
          ? "bg-primary/90 text-primary-foreground"
          : "bg-amber-500/90 text-white"
      }`}
    >
      {online ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
          {lastSyncTime && (
            <span className="text-white/70">• Last sync: {formatLastSync(lastSyncTime)}</span>
          )}
        </>
      )}
    </div>
  );
};
