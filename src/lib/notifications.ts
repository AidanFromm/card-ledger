// Push Notifications Library for CardLedger
// Handles Web Push API integration, permission flow, and notification triggers

export interface NotificationSettings {
  enabled: boolean;
  priceAlerts: boolean;
  achievementUnlocks: boolean;
  dailySummary: boolean;
  marketUpdates: boolean;
  salesConfirmation: boolean;
}

export interface PriceAlert {
  itemId: string;
  itemName: string;
  targetPrice: number;
  direction: "above" | "below";
  currentPrice?: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  priceAlerts: true,
  achievementUnlocks: true,
  dailySummary: false,
  marketUpdates: false,
  salesConfirmation: true,
};

// Storage key for notification settings
const SETTINGS_KEY = "cardledger_notification_settings";
const PUSH_SUBSCRIPTION_KEY = "cardledger_push_subscription";

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
};

// Get current notification permission status
export const getNotificationPermission = (): NotificationPermission | "unsupported" => {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    throw new Error("Notifications are not supported in this browser");
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Get notification settings from localStorage
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error reading notification settings:", error);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
};

// Save notification settings to localStorage
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving notification settings:", error);
  }
};

// Register service worker for push notifications
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
};

// Get existing service worker registration
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error("Error getting service worker:", error);
    return null;
  }
};

// Subscribe to push notifications
export const subscribeToPush = async (
  vapidPublicKey?: string
): Promise<PushSubscription | null> => {
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    console.error("No service worker registration");
    return null;
  }

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return subscription;
    }

    // For now, we'll create a local subscription without VAPID
    // In production, you'd need a VAPID key from your server
    const options: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
    };

    if (vapidPublicKey) {
      options.applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    }

    subscription = await registration.pushManager.subscribe(options);
    
    // Store subscription
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subscription.toJSON()));
    
    return subscription;
  } catch (error) {
    console.error("Push subscription failed:", error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (): Promise<boolean> => {
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return false;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Push unsubscription failed:", error);
    return false;
  }
};

// Show a local notification (not push)
export const showLocalNotification = async (
  payload: NotificationPayload
): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled) {
    return;
  }

  const permission = getNotificationPermission();
  if (permission !== "granted") {
    return;
  }

  const registration = await getServiceWorkerRegistration();
  
  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || "/logo-icon.jpg",
    badge: payload.badge || "/logo-icon.jpg",
    tag: payload.tag,
    data: payload.data,
    requireInteraction: false,
    silent: false,
  };

  if (registration) {
    await registration.showNotification(payload.title, options);
  } else {
    // Fallback to regular notification
    new Notification(payload.title, options);
  }
};

// ===== Notification Triggers =====

// Price Alert Notification
export const triggerPriceAlert = async (alert: PriceAlert): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.priceAlerts) {
    return;
  }

  const direction = alert.direction === "above" ? "risen above" : "dropped below";
  
  await showLocalNotification({
    title: "💰 Price Alert!",
    body: `${alert.itemName} has ${direction} $${alert.targetPrice.toFixed(2)}`,
    tag: `price-alert-${alert.itemId}`,
    data: {
      type: "price_alert",
      itemId: alert.itemId,
    },
  });
};

// Achievement Unlock Notification
export const triggerAchievementUnlock = async (
  achievementName: string,
  achievementDescription: string
): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.achievementUnlocks) {
    return;
  }

  await showLocalNotification({
    title: "🏆 Achievement Unlocked!",
    body: `${achievementName}: ${achievementDescription}`,
    tag: `achievement-${achievementName.replace(/\s+/g, "-").toLowerCase()}`,
    data: {
      type: "achievement",
      name: achievementName,
    },
  });
};

// Daily Portfolio Summary Notification
export const triggerDailySummary = async (summary: {
  portfolioValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  topMover?: string;
}): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.dailySummary) {
    return;
  }

  const changeSign = summary.dailyChange >= 0 ? "+" : "";
  const emoji = summary.dailyChange >= 0 ? "📈" : "📉";

  let body = `Portfolio: $${summary.portfolioValue.toFixed(2)} (${changeSign}${summary.dailyChangePercent.toFixed(1)}%)`;
  if (summary.topMover) {
    body += `\nTop mover: ${summary.topMover}`;
  }

  await showLocalNotification({
    title: `${emoji} Daily Portfolio Update`,
    body,
    tag: "daily-summary",
    data: {
      type: "daily_summary",
    },
  });
};

// Sale Confirmation Notification
export const triggerSaleConfirmation = async (sale: {
  itemName: string;
  quantity: number;
  salePrice: number;
  profit: number;
}): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.salesConfirmation) {
    return;
  }

  const profitEmoji = sale.profit >= 0 ? "✅" : "⚠️";
  const profitText = sale.profit >= 0 
    ? `Profit: +$${sale.profit.toFixed(2)}` 
    : `Loss: -$${Math.abs(sale.profit).toFixed(2)}`;

  await showLocalNotification({
    title: `${profitEmoji} Sale Recorded`,
    body: `${sale.itemName} (x${sale.quantity}) sold for $${sale.salePrice.toFixed(2)}\n${profitText}`,
    tag: `sale-${Date.now()}`,
    data: {
      type: "sale_confirmation",
    },
  });
};

// Market Update Notification
export const triggerMarketUpdate = async (update: {
  message: string;
  trending?: string[];
}): Promise<void> => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.marketUpdates) {
    return;
  }

  let body = update.message;
  if (update.trending && update.trending.length > 0) {
    body += `\nTrending: ${update.trending.slice(0, 3).join(", ")}`;
  }

  await showLocalNotification({
    title: "📊 Market Update",
    body,
    tag: "market-update",
    data: {
      type: "market_update",
    },
  });
};

// ===== Helper Functions =====

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Initialize notification system
export const initializeNotifications = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn("Notifications not supported");
    return false;
  }

  // Register service worker
  await registerServiceWorker();

  // Check if we have permission and settings enabled
  const settings = getNotificationSettings();
  const permission = getNotificationPermission();

  if (settings.enabled && permission === "granted") {
    // Try to subscribe to push (won't work without VAPID key, but sets up local notifications)
    await subscribeToPush();
    return true;
  }

  return false;
};
