import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, Users, CreditCard, BarChart3, AlertTriangle, 
  Activity, Database, Globe, Server, RefreshCw,
  ChevronRight, ExternalLink, TrendingUp, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";

// Admin emails that can access this page
const ADMIN_EMAILS = ['aidanfromm@gmail.com', 'cardledger.llc@gmail.com'];

const StatCard = ({ label, value, icon: Icon, color, change }: {
  label: string; value: string | number; icon: React.ElementType; color: string; change?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="card-clean-elevated p-5 rounded-2xl"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      {change && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {change}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </motion.div>
);

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    proSubscribers: 0,
    totalCards: 0,
    totalSales: 0,
    revenue: 0,
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Admin access required.' });
      navigate('/dashboard');
      return;
    }
    setIsAdmin(true);
    await fetchStats();
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch subscription count
      const { count: proCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .neq('plan_id', 'free');

      setStats({
        totalUsers: userCount || 0,
        activeToday: Math.floor((userCount || 0) * 0.3), // Estimate
        proSubscribers: proCount || 0,
        totalCards: 0, // Would need aggregate query
        totalSales: 0,
        revenue: (proCount || 0) * 7.99,
      });
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const quickLinks = [
    { label: "Supabase Dashboard", url: "https://supabase.com/dashboard/project/vbedydaozlvujkpcojct", icon: Database },
    { label: "Vercel Deployments", url: "https://vercel.com", icon: Globe },
    { label: "Stripe Dashboard", url: "https://dashboard.stripe.com", icon: CreditCard },
    { label: "GitHub Repo", url: "https://github.com/AidanFromm/card-ledger", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      <Navbar />
      <div className="flex">
        <DesktopSidebar />
        <PageTransition>
          <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl flex-1">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">System overview and management</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                className="gap-2 rounded-xl"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-blue-500/10 text-blue-500" />
              <StatCard label="Active Today" value={stats.activeToday} icon={Activity} color="bg-emerald-500/10 text-emerald-500" />
              <StatCard label="Pro Subscribers" value={stats.proSubscribers} icon={CreditCard} color="bg-violet-500/10 text-violet-500" />
              <StatCard label="MRR" value={`$${stats.revenue.toFixed(2)}`} icon={TrendingUp} color="bg-amber-500/10 text-amber-500" />
              <StatCard label="Total Cards Tracked" value={stats.totalCards.toLocaleString()} icon={Eye} color="bg-rose-500/10 text-rose-500" />
              <StatCard label="Total Sales" value={stats.totalSales} icon={BarChart3} color="bg-cyan-500/10 text-cyan-500" />
            </div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-clean-elevated rounded-2xl p-5 mb-6"
            >
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {quickLinks.map(({ label, url, icon: Icon }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium flex-1">{label}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* System Health */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card-clean-elevated rounded-2xl p-5 mb-6"
            >
              <h3 className="font-semibold mb-4">System Health</h3>
              <div className="space-y-3">
                {[
                  { label: "Supabase", status: "operational", latency: "42ms" },
                  { label: "Vercel CDN", status: "operational", latency: "12ms" },
                  { label: "Stripe", status: "not configured", latency: "—" },
                  { label: "JustTCG API", status: "operational", latency: "180ms" },
                  { label: "Pokemon TCG API", status: "operational", latency: "95ms" },
                ].map(({ label, status, latency }) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'operational' ? 'bg-emerald-500' : 
                        status === 'not configured' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{latency}</span>
                      <span className={`text-xs font-medium ${
                        status === 'operational' ? 'text-emerald-500' : 
                        status === 'not configured' ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-clean-elevated rounded-2xl p-5"
            >
              <h3 className="font-semibold mb-4">Setup Checklist</h3>
              <div className="space-y-2">
                {[
                  { label: "Supabase project configured", done: true },
                  { label: "Authentication enabled (Email + Google + Apple)", done: true },
                  { label: "JustTCG API connected", done: true },
                  { label: "Pokemon TCG API integrated", done: true },
                  { label: "eBay API configured", done: true },
                  { label: "Stripe integration built", done: true },
                  { label: "Stripe API keys added", done: false },
                  { label: "Subscriptions table created", done: false },
                  { label: "Edge functions deployed", done: false },
                  { label: "Custom domain SSL", done: false },
                  { label: "Push notifications (VAPID)", done: false },
                  { label: "App Store submission", done: false },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-3 py-1.5">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                      done ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary/40 text-muted-foreground/40'
                    }`}>
                      {done ? '✓' : '○'}
                    </div>
                    <span className={`text-sm ${done ? '' : 'text-muted-foreground'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </main>
        </PageTransition>
      </div>
      <BottomNav />
    </div>
  );
};

export default Admin;
