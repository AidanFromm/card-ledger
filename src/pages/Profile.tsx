import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Moon,
  Sun,
  Monitor,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  MessageSquare,
  CreditCard,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Lock,
  Trash2,
  Download,
  Star,
  Check,
  Crown,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useSalesDb } from "@/hooks/useSalesDb";

type SheetType = "notifications" | "privacy" | "help" | "feedback" | "subscription" | null;

const BottomSheet = ({
  isOpen, onClose, title, children
}: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) => (
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
          className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-[28px] max-h-[85vh] overflow-hidden flex flex-col"
          style={{ boxShadow: '0 -8px 40px hsl(0 0% 0% / 0.15)' }}
        >
          <div className="flex justify-center py-3">
            <div className="w-9 h-1 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="flex items-center justify-between px-6 pb-4 border-b border-border/30">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/40 transition-colors">
              <X className="w-5 h-5 text-muted-foreground/60" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 pb-safe">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="px-4">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="font-medium pr-4 text-[15px]">{question}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="text-sm text-muted-foreground/70 pb-4 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [portfolioUpdates, setPortfolioUpdates] = useState(true);
  const [newFeatures, setNewFeatures] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const { items: inventoryItems } = useInventoryDb();
  const { sales } = useSalesDb();

  // Settings state from localStorage
  const [defaultCurrency, setDefaultCurrency] = useState(() => localStorage.getItem('cl_currency') || 'USD');
  const [preferredGrading, setPreferredGrading] = useState(() => localStorage.getItem('cl_grading') || 'psa');
  const [defaultLocation, setDefaultLocation] = useState(() => localStorage.getItem('cl_location') || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('cl_notifications') !== 'false');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Collection stats
  const unsoldItems = inventoryItems.filter(i => !i.sale_price && i.quantity > 0);
  const totalCards = unsoldItems.reduce((s, i) => s + i.quantity, 0);
  const totalValue = unsoldItems.reduce((s, i) => s + (i.market_price || i.purchase_price) * i.quantity, 0);
  const totalSalesProfit = sales.reduce((s, sale) => s + (sale.profit || 0) * sale.quantity_sold, 0);
  const uniqueSets = new Set(unsoldItems.map(i => i.set_name).filter(Boolean)).size;
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;

  // Achievement badges
  const achievements = [
    { id: 'first', label: 'First Card', desc: 'Added your first card', unlocked: inventoryItems.length > 0, icon: '🎉' },
    { id: '10cards', label: '10 Cards', desc: 'Collection of 10+', unlocked: totalCards >= 10, icon: '📦' },
    { id: '100cards', label: '100 Club', desc: 'Collection of 100+', unlocked: totalCards >= 100, icon: '💯' },
    { id: '1ksale', label: 'First Sale', desc: 'Recorded your first sale', unlocked: sales.length > 0, icon: '💰' },
    { id: '1kvalue', label: '$1K Portfolio', desc: 'Portfolio worth $1,000+', unlocked: totalValue >= 1000, icon: '🏆' },
    { id: '5kvalue', label: '$5K Portfolio', desc: 'Portfolio worth $5,000+', unlocked: totalValue >= 5000, icon: '👑' },
    { id: '10sets', label: 'Set Collector', desc: 'Cards from 10+ sets', unlocked: uniqueSets >= 10, icon: '🗂️' },
    { id: 'profit', label: 'In the Green', desc: 'Profitable sales total', unlocked: totalSalesProfit > 0, icon: '📈' },
  ];

  const formatCurrency = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleExportAllData = async () => {
    try {
      const exportData = {
        inventory: inventoryItems,
        sales: sales,
        exportedAt: new Date().toISOString(),
        email: user?.email,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cardledger-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export complete', description: 'Your data has been downloaded.' });
    } catch {
      toast({ variant: 'destructive', title: 'Export failed', description: 'Could not export your data.' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
    navigate("/auth");
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/auth` });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else toast({ title: "Check your email", description: "We've sent you a password reset link." });
  };

  const handleDeleteAccount = () => toast({ title: "Contact Support", description: "To delete your account, please email cardledger.llc@gmail.com" });
  const handleExportData = () => toast({ title: "Export Started", description: "Your data export will be ready shortly." });

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) { toast({ variant: "destructive", title: "Feedback required", description: "Please enter your feedback." }); return; }
    toast({ title: "Thank you!", description: "Your feedback has been submitted." });
    setFeedbackText(""); setFeedbackRating(0); setActiveSheet(null);
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const menuItems = [
    { icon: Bell, label: "Notifications", description: "Manage alerts & updates", sheet: "notifications" as SheetType },
    { icon: Shield, label: "Privacy & Security", description: "Account protection", sheet: "privacy" as SheetType },
    { icon: CreditCard, label: "Subscription", description: "Manage your plan", sheet: "subscription" as SheetType },
    { icon: HelpCircle, label: "Help & Support", description: "FAQs and contact us", sheet: "help" as SheetType },
    { icon: MessageSquare, label: "Send Feedback", description: "Help us improve", sheet: "feedback" as SheetType },
  ];

  const faqs = [
    { question: "How do I add cards to my collection?", answer: "Use the Search tab to find cards, then tap 'Add' to add them to your inventory. You can also manually add cards from the Inventory page." },
    { question: "How are card prices calculated?", answer: "We aggregate prices from multiple sources including TCGPlayer, eBay sold listings, and market data to provide accurate valuations." },
    { question: "Can I export my collection?", answer: "Yes! Go to Inventory, tap the menu icon, and select 'Export'. You can export as CSV or JSON." },
    { question: "How do I track sales and profits?", answer: "When you sell a card, use the 'Sell' option to record the sale. Your profits are automatically calculated and shown in Analytics." },
    { question: "What grading companies are supported?", answer: "We support PSA, BGS, CGC, SGC, TAG, and ACE grading companies, as well as raw (ungraded) cards." },
  ];

  const subscriptionPlans = [
    { name: "Free Trial", price: "$0", period: "7 days", features: ["Unlimited cards", "Price tracking", "Basic analytics", "Export to CSV"], current: true, badge: "Current" },
    { name: "Personal", price: "$4.99", period: "/month", features: ["Everything in Free", "Advanced analytics", "Price alerts", "Priority support"], recommended: true },
    { name: "Business", price: "$14.99", period: "/month", features: ["Everything in Personal", "Unlimited client lists", "Bulk import", "API access", "Team features"] },
  ];

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="ios-title-large">Profile</h1>
          </motion.div>

          {/* User Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-clean-elevated p-5 rounded-3xl mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold truncate">{user?.email || "Loading..."}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[13px] text-muted-foreground/60">Free Trial</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold">6 days left</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Collection Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            className="card-clean-elevated p-5 rounded-3xl mb-5"
          >
            <h3 className="label-metric mb-3">Collection Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-secondary/20 rounded-2xl">
                <p className="text-lg font-bold">{totalCards.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Cards</p>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-2xl">
                <p className="text-lg font-bold">${formatCurrency(totalValue)}</p>
                <p className="text-[10px] text-muted-foreground">Portfolio Value</p>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-2xl">
                <p className="text-lg font-bold">{uniqueSets}</p>
                <p className="text-[10px] text-muted-foreground">Unique Sets</p>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-2xl">
                <p className="text-lg font-bold">{sales.length}</p>
                <p className="text-[10px] text-muted-foreground">Sales Recorded</p>
              </div>
            </div>
            {memberSince && (
              <p className="text-[11px] text-muted-foreground/50 text-center mt-3">
                Member since {memberSince}
              </p>
            )}
          </motion.div>

          {/* Achievement Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card-clean-elevated p-5 rounded-3xl mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="label-metric">Achievements</h3>
              <span className="text-[10px] text-muted-foreground">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {achievements.map(a => (
                <div
                  key={a.id}
                  className={`text-center p-2 rounded-xl transition-all ${
                    a.unlocked 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-muted/20 opacity-40 grayscale'
                  }`}
                >
                  <span className="text-xl">{a.icon}</span>
                  <p className="text-[9px] font-medium mt-1 leading-tight">{a.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Export All Data */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.09 }}
            className="mb-5"
          >
            <Button
              onClick={handleExportAllData}
              variant="outline"
              className="w-full h-12 rounded-2xl gap-2 font-semibold"
            >
              <Download className="w-4 h-4" />
              Export All Data
            </Button>
          </motion.div>

          {/* Theme Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-clean-elevated p-5 rounded-3xl mb-5"
          >
            <h3 className="label-metric mb-4">Appearance</h3>
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
          </motion.div>

          {/* Settings / Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="card-clean-elevated p-5 rounded-3xl mb-5"
          >
            <h3 className="label-metric mb-4">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[14px]">Default Currency</p>
                  <p className="text-[12px] text-muted-foreground/50">For price display</p>
                </div>
                <select
                  value={defaultCurrency}
                  onChange={(e) => { setDefaultCurrency(e.target.value); localStorage.setItem('cl_currency', e.target.value); }}
                  className="h-9 px-3 rounded-xl text-sm font-medium bg-secondary/30 border border-border/30"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[14px]">Preferred Grading</p>
                  <p className="text-[12px] text-muted-foreground/50">Default grading company</p>
                </div>
                <select
                  value={preferredGrading}
                  onChange={(e) => { setPreferredGrading(e.target.value); localStorage.setItem('cl_grading', e.target.value); }}
                  className="h-9 px-3 rounded-xl text-sm font-medium bg-secondary/30 border border-border/30"
                >
                  <option value="psa">PSA</option>
                  <option value="bgs">BGS</option>
                  <option value="cgc">CGC</option>
                  <option value="sgc">SGC</option>
                  <option value="ace">ACE</option>
                  <option value="tag">TAG</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[14px]">Default Purchase Location</p>
                  <p className="text-[12px] text-muted-foreground/50">Auto-fill when adding cards</p>
                </div>
                <Input
                  value={defaultLocation}
                  onChange={(e) => { setDefaultLocation(e.target.value); localStorage.setItem('cl_location', e.target.value); }}
                  placeholder="e.g., Local Card Shop"
                  className="h-9 w-40 text-sm rounded-xl"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[14px]">Notifications</p>
                  <p className="text-[12px] text-muted-foreground/50">Price alerts & updates</p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={(v) => { setNotificationsEnabled(v); localStorage.setItem('cl_notifications', String(v)); }}
                />
              </div>
            </div>

            {/* Data Management */}
            <div className="mt-5 pt-4 border-t border-border/20">
              <p className="label-metric mb-3">Data Management</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const keys = Object.keys(localStorage).filter(k => k.startsWith('cl_price_') || k === 'cl_portfolio_history');
                    keys.forEach(k => localStorage.removeItem(k));
                    toast({ title: "Cache cleared", description: `Removed ${keys.length} cached items` });
                  }}
                  className="flex-1 rounded-xl text-xs h-9"
                >
                  Clear Cache
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAllData}
                  className="flex-1 rounded-xl text-xs h-9"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export All
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Menu Items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-clean-elevated overflow-hidden rounded-3xl mb-6"
          >
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => setActiveSheet(item.sheet)}
                className={`w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/30 transition-colors tap-scale
                  ${index !== menuItems.length - 1 ? 'border-b border-border/20' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/40 flex items-center justify-center">
                  <item.icon className="w-[18px] h-[18px] text-muted-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px]">{item.label}</p>
                  <p className="text-[13px] text-muted-foreground/50">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              </button>
            ))}
          </motion.div>

          {/* Logout */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-14 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/8 gap-2 font-semibold"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-center mt-8 space-y-2">
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => navigate("/help")} className="text-xs text-muted-foreground/40 hover:text-primary transition-colors">Help & FAQ</button>
              <span className="text-muted-foreground/20">·</span>
              <button onClick={() => navigate("/legal")} className="text-xs text-muted-foreground/40 hover:text-primary transition-colors">Terms & Privacy</button>
            </div>
            <p className="text-[11px] text-muted-foreground/30 tracking-wider">CardLedger v1.0.0</p>
          </motion.div>
        </main>
      </PageTransition>

      {/* Sheets */}
      <BottomSheet isOpen={activeSheet === "notifications"} onClose={() => setActiveSheet(null)} title="Notifications">
        <div className="space-y-6">
          {[
            { label: "Price Alerts", desc: "Get notified when watchlist prices change", state: priceAlerts, set: setPriceAlerts },
            { label: "Portfolio Updates", desc: "Weekly portfolio summary", state: portfolioUpdates, set: setPortfolioUpdates },
            { label: "New Features", desc: "Updates and new feature announcements", state: newFeatures, set: setNewFeatures },
            { label: "Marketing", desc: "Tips, promotions, and offers", state: marketing, set: setMarketing },
          ].map(({ label, desc, state, set }) => (
            <div key={label} className="flex items-center justify-between">
              <div><p className="font-semibold text-[15px]">{label}</p><p className="text-[13px] text-muted-foreground/50">{desc}</p></div>
              <Switch checked={state} onCheckedChange={set} />
            </div>
          ))}
          <Button className="w-full h-12 rounded-2xl mt-4 font-semibold" onClick={() => { toast({ title: "Settings saved" }); setActiveSheet(null); }}>
            Save Preferences
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={activeSheet === "privacy"} onClose={() => setActiveSheet(null)} title="Privacy & Security">
        <div className="space-y-3">
          {[
            { icon: Lock, color: "primary", label: "Change Password", desc: "Send password reset email", onClick: handleChangePassword },
            { icon: Download, color: "emerald-500", label: "Export My Data", desc: "Download all your data", onClick: handleExportData },
          ].map(({ icon: Icon, color, label, desc, onClick }) => (
            <button key={label} onClick={onClick} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary/25 hover:bg-secondary/40 transition-colors">
              <div className={`w-10 h-10 rounded-xl bg-${color}/15 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}`} />
              </div>
              <div className="flex-1 text-left"><p className="font-semibold text-[15px]">{label}</p><p className="text-[13px] text-muted-foreground/50">{desc}</p></div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </button>
          ))}
          <button onClick={handleDeleteAccount} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-destructive/8 hover:bg-destructive/15 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center"><Trash2 className="w-5 h-5 text-destructive" /></div>
            <div className="flex-1 text-left"><p className="font-semibold text-destructive text-[15px]">Delete Account</p><p className="text-[13px] text-muted-foreground/50">Permanently delete your account</p></div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
          </button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={activeSheet === "help"} onClose={() => setActiveSheet(null)} title="Help & Support">
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-secondary/25 border border-border/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><Mail className="w-5 h-5 text-primary" /></div>
              <span className="font-semibold">Contact Us</span>
            </div>
            <p className="text-[13px] text-muted-foreground/60 mb-3">Have a question? Send us an email and we'll get back to you.</p>
            <a href="mailto:cardledger.llc@gmail.com" className="text-primary text-sm font-semibold hover:underline">cardledger.llc@gmail.com</a>
          </div>
          <div>
            <h3 className="label-metric mb-3">FAQs</h3>
            <div className="rounded-2xl bg-secondary/25 border border-border/20 overflow-hidden">
              <div className="divide-y divide-border/20">{faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}</div>
            </div>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={activeSheet === "feedback"} onClose={() => setActiveSheet(null)} title="Send Feedback">
        <div className="space-y-6">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How would you rate Card Ledger?</Label>
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} onClick={() => setFeedbackRating(rating)}
                  className={`flex-1 h-12 rounded-2xl border-2 transition-all ${feedbackRating >= rating ? "border-amber-500 bg-amber-500/15" : "border-border/30 hover:border-primary/30"}`}>
                  <Star className={`w-5 h-5 mx-auto ${feedbackRating >= rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What could we improve?</Label>
            <Textarea id="feedback" placeholder="Tell us what you think..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[120px] rounded-2xl bg-secondary/25 border-border/30" />
          </div>
          <Button onClick={handleSubmitFeedback} className="w-full h-12 rounded-2xl font-semibold">Submit Feedback</Button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={activeSheet === "subscription"} onClose={() => setActiveSheet(null)} title="Subscription">
        <div className="space-y-4">
          {subscriptionPlans.map((plan) => (
            <div key={plan.name} className={`relative p-5 rounded-3xl border-2 transition-all ${
              plan.current ? "border-primary bg-primary/4" : plan.recommended ? "border-amber-500 bg-amber-500/4" : "border-border/30"
            }`}>
              {plan.badge && <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">{plan.badge}</span>}
              {plan.recommended && <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white flex items-center gap-1"><Crown className="w-3 h-3" />Recommended</span>}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1"><span className="text-2xl font-bold">{plan.price}</span><span className="text-sm text-muted-foreground/50">{plan.period}</span></div>
                </div>
                {plan.current && <div className="flex items-center gap-1 text-primary text-sm font-semibold"><Check className="w-4 h-4" />Active</div>}
              </div>
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /><span className="text-muted-foreground/70">{f}</span></li>
                ))}
              </ul>
              {!plan.current && (
                <Button className={`w-full h-11 mt-4 rounded-2xl font-semibold ${plan.recommended ? "bg-amber-500 hover:bg-amber-600" : ""}`} variant={plan.recommended ? "default" : "outline"}>
                  {plan.recommended ? <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Upgrade to {plan.name}</span> : `Choose ${plan.name}`}
                </Button>
              )}
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground/30 text-center pt-2">Cancel anytime. Prices in USD.</p>
        </div>
      </BottomSheet>

      <BottomNav />
    </div>
  );
};

export default Profile;
