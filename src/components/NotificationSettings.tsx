import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  DollarSign,
  Trophy,
  Calendar,
  TrendingUp,
  ShoppingBag,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  initializeNotifications,
  NotificationSettings as NotificationSettingsType,
} from "@/lib/notifications";

interface NotificationOptionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const NotificationOption = ({
  icon: Icon,
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: NotificationOptionProps) => (
  <div
    className={`flex items-center justify-between p-4 ${
      disabled ? "opacity-50" : ""
    }`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          enabled && !disabled ? "bg-primary/20" : "bg-secondary/50"
        }`}
      >
        <Icon
          className={`w-5 h-5 ${
            enabled && !disabled ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch
      checked={enabled}
      onCheckedChange={onChange}
      disabled={disabled}
      className="flex-shrink-0"
    />
  </div>
);

const NotificationSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [settings, setSettings] = useState<NotificationSettingsType>({
    enabled: false,
    priceAlerts: true,
    achievementUnlocks: true,
    dailySummary: false,
    marketUpdates: false,
    salesConfirmation: true,
  });
  const [permissionStatus, setPermissionStatus] = useState<
    NotificationPermission | "unsupported"
  >("default");

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const storedSettings = getNotificationSettings();
        setSettings(storedSettings);
        setPermissionStatus(getNotificationPermission());
      } catch (error) {
        console.error("Error loading notification settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings when they change
  const updateSettings = (newSettings: Partial<NotificationSettingsType>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  // Handle enabling/disabling all notifications
  const handleMasterToggle = async (enabled: boolean) => {
    if (enabled) {
      // Need to request permission first
      if (permissionStatus !== "granted") {
        setRequesting(true);
        try {
          const permission = await requestNotificationPermission();
          setPermissionStatus(permission);

          if (permission === "granted") {
            await initializeNotifications();
            updateSettings({ enabled: true });
            toast({
              title: "Notifications enabled",
              description: "You'll now receive notifications from CardLedger",
            });
          } else if (permission === "denied") {
            toast({
              variant: "destructive",
              title: "Permission denied",
              description:
                "Please enable notifications in your browser settings",
            });
          }
        } catch (error) {
          console.error("Error requesting permission:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to enable notifications",
          });
        } finally {
          setRequesting(false);
        }
      } else {
        updateSettings({ enabled: true });
      }
    } else {
      updateSettings({ enabled: false });
      toast({
        title: "Notifications disabled",
        description: "You won't receive notifications from CardLedger",
      });
    }
  };

  const isSupported = isNotificationSupported();
  const canEnable = permissionStatus === "granted" || permissionStatus === "default";
  const notificationTypes = [
    {
      key: "priceAlerts" as const,
      icon: DollarSign,
      label: "Price Alerts",
      description: "Get notified when cards hit your target prices",
    },
    {
      key: "achievementUnlocks" as const,
      icon: Trophy,
      label: "Achievement Unlocks",
      description: "Celebrate milestones and achievements",
    },
    {
      key: "dailySummary" as const,
      icon: Calendar,
      label: "Daily Summary",
      description: "Daily portfolio value updates",
    },
    {
      key: "marketUpdates" as const,
      icon: TrendingUp,
      label: "Market Updates",
      description: "Trending cards and market movements",
    },
    {
      key: "salesConfirmation" as const,
      icon: ShoppingBag,
      label: "Sale Confirmations",
      description: "Confirmation when you record a sale",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Browser Support Warning */}
      {!isSupported && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-500">Not Supported</p>
            <p className="text-muted-foreground mt-1">
              Push notifications are not supported in this browser. Try using
              Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      )}

      {/* Permission Denied Warning */}
      {isSupported && permissionStatus === "denied" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <BellOff className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-red-500">Permission Blocked</p>
            <p className="text-muted-foreground mt-1">
              Notifications are blocked for this site. Please enable them in
              your browser settings to receive updates.
            </p>
          </div>
        </div>
      )}

      {/* Master Toggle */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                settings.enabled ? "bg-primary/20" : "bg-secondary/50"
              }`}
            >
              {settings.enabled ? (
                <Bell className="w-6 h-6 text-primary" />
              ) : (
                <BellOff className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-semibold">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                {settings.enabled
                  ? "Receiving notifications"
                  : "Notifications disabled"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {requesting && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Switch
              checked={settings.enabled}
              onCheckedChange={handleMasterToggle}
              disabled={!isSupported || permissionStatus === "denied" || requesting}
            />
          </div>
        </div>

        {/* Permission Status Badge */}
        <div className="px-4 py-2 bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Permission Status</span>
          <div className="flex items-center gap-1.5">
            {permissionStatus === "granted" && (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium text-green-500">Granted</span>
              </>
            )}
            {permissionStatus === "denied" && (
              <>
                <X className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-medium text-red-500">Blocked</span>
              </>
            )}
            {permissionStatus === "default" && (
              <span className="text-xs font-medium text-muted-foreground">
                Not requested
              </span>
            )}
            {permissionStatus === "unsupported" && (
              <span className="text-xs font-medium text-muted-foreground">
                Unsupported
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/30">
          <h3 className="font-semibold">Notification Types</h3>
          <p className="text-sm text-muted-foreground">
            Choose which notifications you want to receive
          </p>
        </div>

        {notificationTypes.map((type, index) => (
          <div
            key={type.key}
            className={index < notificationTypes.length - 1 ? "border-b border-border/30" : ""}
          >
            <NotificationOption
              icon={type.icon}
              label={type.label}
              description={type.description}
              enabled={settings[type.key]}
              onChange={(enabled) => updateSettings({ [type.key]: enabled })}
              disabled={!settings.enabled}
            />
          </div>
        ))}
      </div>

      {/* Test Notification Button */}
      {settings.enabled && permissionStatus === "granted" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            className="w-full rounded-xl h-11"
            onClick={async () => {
              const { showLocalNotification } = await import("@/lib/notifications");
              await showLocalNotification({
                title: "Test Notification",
                body: "Push notifications are working correctly!",
                tag: "test",
              });
              toast({
                title: "Test sent",
                description: "Check your notifications",
              });
            }}
          >
            <Bell className="h-4 w-4 mr-2" />
            Send Test Notification
          </Button>
        </motion.div>
      )}

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center px-4">
        Notifications are sent through your browser and do not require an
        account. You can change these settings at any time.
      </p>
    </motion.div>
  );
};

export default NotificationSettings;
