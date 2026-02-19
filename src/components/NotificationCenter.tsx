import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, TrendingUp, FileDown, Eye, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Notification {
  id: string;
  type: "price_alert" | "import_complete" | "watchlist_trigger" | "info";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY = "cardledger-notifications";

const getStoredNotifications = (): Notification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

export const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
  const notifications = getStoredNotifications();
  const newNotif: Notification = {
    ...notification,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    read: false,
  };
  notifications.unshift(newNotif);
  // Keep max 50
  saveNotifications(notifications.slice(0, 50));
  window.dispatchEvent(new CustomEvent("cardledger-notification"));
};

const ICON_MAP = {
  price_alert: TrendingUp,
  import_complete: FileDown,
  watchlist_trigger: Eye,
  info: Bell,
};

const COLOR_MAP = {
  price_alert: "text-emerald-500 bg-emerald-500/10",
  import_complete: "text-blue-500 bg-blue-500/10",
  watchlist_trigger: "text-purple-500 bg-purple-500/10",
  info: "text-muted-foreground bg-secondary/30",
};

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>(getStoredNotifications);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    setNotifications(getStoredNotifications());
  }, []);

  useEffect(() => {
    window.addEventListener("cardledger-notification", refresh);
    return () => window.removeEventListener("cardledger-notification", refresh);
  }, [refresh]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    setNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
    setNotifications([]);
  };

  const removeOne = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
    setNotifications(updated);
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) refresh(); }}
        className="relative p-2 rounded-xl hover:bg-secondary/50 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 max-h-[400px] z-50 rounded-2xl bg-card border border-border/30 shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 px-2 text-[11px] gap-1" aria-label="Mark all as read">
                      <Check className="h-3 w-3" /> Read all
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 px-2 text-[11px] gap-1 text-muted-foreground" aria-label="Clear all notifications">
                      <Trash2 className="h-3 w-3" /> Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-[340px]">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground/50">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const Icon = ICON_MAP[notif.type];
                    const colorClass = COLOR_MAP[notif.type];
                    return (
                      <div
                        key={notif.id}
                        className={`flex gap-3 px-4 py-3 border-b border-border/10 last:border-0 transition-colors ${
                          notif.read ? "opacity-60" : "bg-primary/[0.02]"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">{formatTime(notif.timestamp)}</p>
                        </div>
                        <button
                          onClick={() => removeOne(notif.id)}
                          className="p-1 rounded-lg hover:bg-secondary/50 transition-colors flex-shrink-0 self-start"
                          aria-label={`Remove notification: ${notif.title}`}
                        >
                          <X className="h-3 w-3 text-muted-foreground/40" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
