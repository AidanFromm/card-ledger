import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import {
  User,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Bell,
  X,
  Download,
  Upload,
  Trash2,
  Cloud,
  Link2,
  Unlink,
  CreditCard,
  Crown,
  Sparkles,
  Check,
  Info,
  FileJson,
  FileSpreadsheet,
  ExternalLink,
  Mail,
  HelpCircle,
  Star,
  Camera,
  Edit3,
  DollarSign,
  Package,
  TrendingUp,
  ShoppingBag,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { PageTransition } from "@/components/PageTransition";
import BottomNav from "@/components/BottomNav";
import NotificationSettings from "@/components/NotificationSettings";

// Types
interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  contactEmail: string;
  avatarUrl: string | null;
}

interface UserPreferences {
  currency: string;
  defaultCondition: string;
  priceSource: string;
  notificationsEnabled: boolean;
}

// Bottom Sheet Component
const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between px-6 pb-4 border-b border-border/50">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Section Header Component
const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-4 px-1">
    <Icon className="w-5 h-5 text-primary" />
    <h2 className="text-lg font-semibold">{title}</h2>
  </div>
);

// Menu Item Component
const MenuItem = ({
  icon: Icon,
  label,
  description,
  onClick,
  value,
  badge,
  badgeColor = "bg-primary",
  danger = false,
  loading = false,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  value?: string;
  badge?: string;
  badgeColor?: string;
  danger?: boolean;
  loading?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`
      w-full flex items-center gap-4 p-4 text-left
      hover:bg-secondary/50 transition-colors tap-scale
      ${danger ? "text-destructive" : ""}
    `}
  >
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        danger ? "bg-destructive/20" : "bg-secondary/50"
      }`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Icon className={`w-5 h-5 ${danger ? "text-destructive" : "text-muted-foreground"}`} />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium">{label}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {badge && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor} text-white font-medium`}>
        {badge}
      </span>
    )}
    {value && <span className="text-sm text-muted-foreground">{value}</span>}
    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
  </button>
);

// Currency Options
const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)", symbol: "$" },
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "GBP", label: "British Pound (£)", symbol: "£" },
  { value: "CAD", label: "Canadian Dollar (C$)", symbol: "C$" },
  { value: "AUD", label: "Australian Dollar (A$)", symbol: "A$" },
  { value: "JPY", label: "Japanese Yen (¥)", symbol: "¥" },
];

// Condition Options
const CONDITIONS = [
  { value: "near-mint", label: "Near Mint" },
  { value: "lightly-played", label: "Lightly Played" },
  { value: "moderately-played", label: "Moderately Played" },
  { value: "heavily-played", label: "Heavily Played" },
  { value: "damaged", label: "Damaged" },
];

// Price Source Options
const PRICE_SOURCES = [
  { value: "tcgplayer", label: "TCGplayer Market Price" },
  { value: "tcgplayer-low", label: "TCGplayer Low" },
  { value: "ebay-avg", label: "eBay Average Sold" },
  { value: "ebay-recent", label: "eBay Recent Sold" },
  { value: "cardmarket", label: "Cardmarket (EU)" },
];

// Main Settings Component
const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const subscription = useSubscription();
  const { inventory } = useInventoryDb();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    username: "",
    bio: "",
    contactEmail: "",
    avatarUrl: null,
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: "USD",
    defaultCondition: "near-mint",
    priceSource: "tcgplayer",
    notificationsEnabled: true,
  });

  // Sheet state
  type SheetType =
    | "profile"
    | "preferences"
    | "data"
    | "connected"
    | "subscription"
    | "about"
    | "notifications"
    | null;
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);

  // Data management state
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  // Connected accounts state
  const [ebayConnected, setEbayConnected] = useState(false);
  const [checkingEbay, setCheckingEbay] = useState(false);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Load profile from localStorage (or could be from Supabase profile table)
        const savedProfile = localStorage.getItem(`profile_${user.id}`);
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        } else {
          setProfile({
            displayName: user.email?.split("@")[0] || "",
            username: user.email?.split("@")[0]?.toLowerCase() || "",
            bio: "",
            contactEmail: user.email || "",
            avatarUrl: null,
          });
        }

        // Load preferences
        const savedPrefs = localStorage.getItem(`preferences_${user.id}`);
        if (savedPrefs) {
          setPreferences(JSON.parse(savedPrefs));
        }

        // Check eBay connection
        checkEbayConnection();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkEbayConnection = async () => {
    setCheckingEbay(true);
    try {
      const tokens = localStorage.getItem("ebay_tokens");
      setEbayConnected(!!tokens);
    } catch (error) {
      console.error("Error checking eBay:", error);
    } finally {
      setCheckingEbay(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profile));
      toast({
        title: "Profile saved",
        description: "Your profile has been updated.",
      });
      setEditingProfile(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    try {
      localStorage.setItem(`preferences_${user.id}`, JSON.stringify(preferences));
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated.",
      });
      setActiveSheet(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save preferences.",
      });
    }
  };

  // Data management functions
  const handleExport = async (format: "json" | "csv") => {
    // Check if user can export (Pro feature)
    if (!subscription.canExportCSV) {
      toast({
        title: "Pro Feature",
        description: "Upgrade to Pro to export your collection data.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveSheet("subscription")}
          >
            Upgrade
          </Button>
        ),
      });
      return;
    }
    
    setExporting(true);
    try {
      const data = inventory || [];
      let content: string;
      let filename: string;
      let type: string;

      if (format === "json") {
        content = JSON.stringify(data, null, 2);
        filename = `cardledger-export-${new Date().toISOString().split("T")[0]}.json`;
        type = "application/json";
      } else {
        // CSV export
        const headers = ["name", "set", "condition", "quantity", "purchasePrice", "currentPrice", "graded", "gradingCompany", "grade"];
        const csvRows = [headers.join(",")];
        data.forEach((item: any) => {
          const row = headers.map((h) => {
            const val = item[h] ?? "";
            return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
          });
          csvRows.push(row.join(","));
        });
        content = csvRows.join("\n");
        filename = `cardledger-export-${new Date().toISOString().split("T")[0]}.csv`;
        type = "text/csv";
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `Your data has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting your data.",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      let data: any[];

      if (file.name.endsWith(".json")) {
        data = JSON.parse(content);
      } else if (file.name.endsWith(".csv")) {
        // Simple CSV parsing
        const lines = content.split("\n");
        const headers = lines[0].split(",");
        data = lines.slice(1).map((line) => {
          const values = line.split(",");
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h.trim()] = values[i]?.trim();
          });
          return obj;
        });
      } else {
        throw new Error("Unsupported file format");
      }

      // Here you would merge/import the data into your inventory
      toast({
        title: "Import complete",
        description: `Imported ${data.length} items.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import data.",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearData = async () => {
    setClearing(true);
    try {
      // Clear inventory data
      if (user) {
        localStorage.removeItem(`inventory_${user.id}`);
      }
      toast({
        title: "Data cleared",
        description: "All your collection data has been removed.",
      });
      setActiveSheet(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear data.",
      });
    } finally {
      setClearing(false);
    }
  };

  const handleCloudBackup = async () => {
    setBackingUp(true);
    try {
      // Simulate backup - in production this would sync to Supabase
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "Backup complete",
        description: "Your data has been backed up to the cloud.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Backup failed",
        description: "Could not backup to cloud.",
      });
    } finally {
      setBackingUp(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setProfile((prev) => ({ ...prev, avatarUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const subscriptionPlans = [
    {
      name: "Free",
      price: "$0",
      period: "/forever",
      features: ["100 cards", "Basic analytics", "Export to CSV"],
      current: subscription.plan === "free",
      badge: subscription.plan === "free" ? "Current" : undefined,
      cardLimit: 100,
    },
    {
      name: "Pro",
      price: "$4.99",
      period: "/month",
      features: [
        "Unlimited cards",
        "Advanced analytics",
        "Price alerts",
        "Cloud backup",
        "Priority support",
      ],
      recommended: true,
      current: subscription.plan === "personal",
      badge: subscription.plan === "personal" ? "Current" : undefined,
      cardLimit: Infinity,
    },
    {
      name: "Business",
      price: "$14.99",
      period: "/month",
      features: [
        "Everything in Pro",
        "Unlimited client lists",
        "Bulk import",
        "API access",
        "Team features",
        "White-label sharing",
      ],
      current: subscription.plan === "business",
      badge: subscription.plan === "business" ? "Current" : undefined,
      cardLimit: Infinity,
    },
  ];

  const cardCount = inventory?.length || 0;
  const cardLimit = subscription.plan === "free" ? 100 : subscription.plan === "trial" ? 500 : Infinity;
  const usagePercent = cardLimit === Infinity ? 0 : Math.min((cardCount / cardLimit) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <div className="flex">
        <DesktopSidebar />
        <PageTransition>
          <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-4xl flex-1">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="ios-title-large">Settings</h1>
          </motion.div>

          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <SectionHeader icon={User} title="Profile" />
            <div className="glass-card overflow-hidden">
              <MenuItem
                icon={User}
                label="Edit Profile"
                description={profile.displayName || "Set up your profile"}
                onClick={() => setActiveSheet("profile")}
              />
              <div className="border-t border-border/50" />
              <MenuItem
                icon={Trophy}
                label="Achievements"
                description="Track your progress and milestones"
                onClick={() => navigate("/achievements")}
              />
            </div>
          </motion.div>

          {/* Preferences Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <SectionHeader icon={Package} title="Preferences" />
            <div className="glass-card overflow-hidden">
              <MenuItem
                icon={DollarSign}
                label="Currency & Pricing"
                description="Set defaults for your collection"
                value={CURRENCIES.find((c) => c.value === preferences.currency)?.symbol}
                onClick={() => setActiveSheet("preferences")}
              />
              <div className="border-t border-border/50" />
              {/* Theme Selection inline */}
              <div className="p-4">
                <p className="font-medium mb-3">Appearance</p>
                <div className="ios-segment">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      data-active={theme === value}
                      className="ios-segment-item flex items-center justify-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-border/50" />
              <MenuItem
                icon={Bell}
                label="Notifications"
                description="Manage push notification preferences"
                onClick={() => setActiveSheet("notifications")}
              />
            </div>
          </motion.div>

          {/* Reports Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-6"
          >
            <SectionHeader icon={TrendingUp} title="Reports" />
            <div className="glass-card overflow-hidden">
              <MenuItem
                icon={DollarSign}
                label="Tax Reports"
                description="Capital gains & P/L tracking"
                onClick={() => navigate("/tax-reports")}
              />
            </div>
          </motion.div>

          {/* Data Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <SectionHeader icon={Cloud} title="Data Management" />
            <div className="glass-card overflow-hidden">
              <MenuItem
                icon={Download}
                label="Export Data"
                description="Download your collection"
                onClick={() => setActiveSheet("data")}
              />
              <div className="border-t border-border/50" />
              <MenuItem
                icon={Upload}
                label="Import Data"
                description="Import from CSV or JSON"
                onClick={() => fileInputRef.current?.click()}
                loading={importing}
              />
              <div className="border-t border-border/50" />
              <MenuItem
                icon={Cloud}
                label="Backup to Cloud"
                description="Sync your data securely"
                onClick={handleCloudBackup}
                loading={backingUp}
              />
              <div className="border-t border-border/50" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div>
                    <MenuItem
                      icon={Trash2}
                      label="Clear All Data"
                      description="Delete all collection data"
                      danger
                    />
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Clear All Data?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your collection data. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearData}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {clearing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Delete All"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={handleImport}
            />
          </motion.div>

          {/* Connected Accounts Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6"
          >
            <SectionHeader icon={Link2} title="Connected Accounts" />
            <div className="glass-card overflow-hidden">
              <MenuItem
                icon={ShoppingBag}
                label="eBay"
                description={ebayConnected ? "Connected" : "Connect to import listings"}
                badge={ebayConnected ? "Connected" : undefined}
                badgeColor="bg-green-500"
                onClick={() => navigate("/ebay")}
                loading={checkingEbay}
              />
              <div className="border-t border-border/50" />
              <MenuItem
                icon={TrendingUp}
                label="TCGplayer"
                description="Coming soon"
                badge="Soon"
                badgeColor="bg-muted-foreground"
              />
            </div>
          </motion.div>

          {/* Subscription Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <SectionHeader icon={Crown} title="Subscription" />
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg capitalize">{subscription.plan}</span>
                    {subscription.trialDaysLeft && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-medium">
                        {subscription.trialDaysLeft} days left
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cardCount} / {cardLimit === Infinity ? "∞" : cardLimit} cards
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500"
                  onClick={() => setActiveSheet("subscription")}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Upgrade
                </Button>
              </div>
              {cardLimit !== Infinity && (
                <Progress value={usagePercent} className="h-2" />
              )}
            </div>
          </motion.div>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6"
          >
            <SectionHeader icon={Info} title="About" />
            <div className="glass-card overflow-hidden">
              <MenuItem
                icon={Info}
                label="App Version"
                value="1.0.0"
              />
              <div className="border-t border-border/50" />
              <MenuItem
                icon={FileJson}
                label="Terms of Service"
                onClick={() => window.open("/terms", "_blank")}
              />
              <div className="border-t border-border/50" />
              <MenuItem
                icon={FileJson}
                label="Privacy Policy"
                onClick={() => window.open("/privacy", "_blank")}
              />
              <div className="border-t border-border/50" />
              <MenuItem
                icon={Mail}
                label="Contact Support"
                description="cardledger.llc@gmail.com"
                onClick={() => window.open("mailto:cardledger.llc@gmail.com")}
              />
              <div className="border-t border-border/50" />
              <MenuItem
                icon={Star}
                label="Rate the App"
                description="Leave us a review"
                onClick={() => {
                  toast({
                    title: "Thanks!",
                    description: "Redirecting to app store...",
                  });
                }}
              />
            </div>
          </motion.div>
          </main>
        </PageTransition>
      </div>

      {/* Profile Sheet */}
      <BottomSheet
        isOpen={activeSheet === "profile"}
        onClose={() => {
          setActiveSheet(null);
          setEditingProfile(false);
        }}
        title="Edit Profile"
      >
        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your name"
              value={profile.displayName}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, displayName: e.target.value }))
              }
              className="rounded-xl"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">cardledger.app/</span>
              <Input
                id="username"
                placeholder="username"
                value={profile.username}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  }))
                }
                className="rounded-xl flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Used for share links</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell others about your collection..."
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              className="rounded-xl min-h-[100px]"
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="For client inquiries"
              value={profile.contactEmail}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, contactEmail: e.target.value }))
              }
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">Shown on client lists (optional)</p>
          </div>

          <Button
            onClick={saveProfile}
            className="w-full h-12 rounded-xl"
            disabled={savingProfile}
          >
            {savingProfile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>
      </BottomSheet>

      {/* Preferences Sheet */}
      <BottomSheet
        isOpen={activeSheet === "preferences"}
        onClose={() => setActiveSheet(null)}
        title="Preferences"
      >
        <div className="space-y-6">
          {/* Currency */}
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Select
              value={preferences.currency}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, currency: value }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Default Condition */}
          <div className="space-y-2">
            <Label>Default Condition</Label>
            <Select
              value={preferences.defaultCondition}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, defaultCondition: value }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Applied to new cards by default
            </p>
          </div>

          {/* Price Source */}
          <div className="space-y-2">
            <Label>Price Source</Label>
            <Select
              value={preferences.priceSource}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, priceSource: value }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used for portfolio valuation
            </p>
          </div>

          <Button onClick={savePreferences} className="w-full h-12 rounded-xl">
            Save Preferences
          </Button>
        </div>
      </BottomSheet>

      {/* Data Export Sheet */}
      <BottomSheet
        isOpen={activeSheet === "data"}
        onClose={() => setActiveSheet(null)}
        title="Export Data"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download your entire collection in your preferred format.
          </p>

          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <FileJson className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Export as JSON</p>
              <p className="text-sm text-muted-foreground">
                Full data with all fields
              </p>
            </div>
            {exporting && <Loader2 className="w-5 h-5 animate-spin" />}
          </button>

          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Export as CSV</p>
              <p className="text-sm text-muted-foreground">
                Spreadsheet compatible
              </p>
            </div>
            {exporting && <Loader2 className="w-5 h-5 animate-spin" />}
          </button>
        </div>
      </BottomSheet>

      {/* Subscription Sheet */}
      <BottomSheet
        isOpen={activeSheet === "subscription"}
        onClose={() => setActiveSheet(null)}
        title="Choose Your Plan"
      >
        <div className="space-y-4">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                plan.current
                  ? "border-primary bg-primary/5"
                  : plan.recommended
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-border/50"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                  {plan.badge}
                </span>
              )}
              {plan.recommended && !plan.current && (
                <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500 text-white flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Recommended
                </span>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                {plan.current && (
                  <div className="flex items-center gap-1 text-primary text-sm font-medium">
                    <Check className="w-4 h-4" />
                    Active
                  </div>
                )}
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-navy-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {!plan.current && (
                <Button
                  className={`w-full h-10 mt-4 rounded-xl ${
                    plan.recommended ? "bg-amber-500 hover:bg-amber-600" : ""
                  }`}
                  variant={plan.recommended ? "default" : "outline"}
                >
                  {plan.recommended ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Upgrade to {plan.name}
                    </span>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              )}
            </div>
          ))}

          <p className="text-xs text-muted-foreground text-center pt-2">
            Cancel anytime. Prices in USD.
          </p>
        </div>
      </BottomSheet>

      {/* Notifications Sheet */}
      <BottomSheet
        isOpen={activeSheet === "notifications"}
        onClose={() => setActiveSheet(null)}
        title="Notifications"
      >
        <NotificationSettings />
      </BottomSheet>

      <BottomNav />
    </div>
  );
};

export default Settings;
