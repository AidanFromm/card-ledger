import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search, Package, LayoutDashboard, Receipt, UserCircle2, BarChart3,
  ChevronLeft, ChevronRight, TrendingUp, Flame, Heart, ArrowLeftRight,
  Award, Trophy, Bell, Settings, HelpCircle, Crown, Globe, Target,
  Layers, PieChart, FileText, Shield, Zap
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";

interface NavSection {
  label: string;
  items: { path: string; label: string; icon: React.ElementType; badge?: string }[];
}

const navSections: NavSection[] = [
  {
    label: "Core",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/scan", label: "Search Cards", icon: Search },
      { path: "/inventory", label: "Inventory", icon: Package },
      { path: "/sales", label: "Sales & P&L", icon: Receipt },
    ],
  },
  {
    label: "Analytics",
    items: [
      { path: "/analytics", label: "Analytics", icon: PieChart },
      { path: "/stats", label: "Statistics", icon: BarChart3 },
      { path: "/trends", label: "Market Trends", icon: TrendingUp },
      { path: "/market-trends", label: "Price Tracker", icon: Flame },
    ],
  },
  {
    label: "Collection",
    items: [
      { path: "/wishlist", label: "Watchlist", icon: Heart },
      { path: "/grading", label: "Grading Center", icon: Award },
      { path: "/trading", label: "Trading Hub", icon: ArrowLeftRight },
      { path: "/achievements", label: "Achievements", icon: Trophy },
    ],
  },
  {
    label: "Account",
    items: [
      { path: "/alerts", label: "Price Alerts", icon: Bell },
      { path: "/profile", label: "Profile", icon: UserCircle2 },
      { path: "/settings", label: "Settings", icon: Settings },
      { path: "/help", label: "Help & Support", icon: HelpCircle },
    ],
  },
];

export const DesktopSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex flex-col sticky top-0 h-screen border-r border-border/10 bg-card/30 backdrop-blur-xl transition-all duration-300 z-30 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border/10">
        <Link to="/dashboard" className="flex items-center overflow-hidden">
          <Logo size={28} showText={!collapsed} />
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.label}>
            {/* Section Label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-1.5"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                    {section.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items */}
            <div className="space-y-0.5">
              {section.items.map(({ path, label, icon: Icon, badge }) => {
                const isActive =
                  location.pathname === path ||
                  (path === "/analytics" && location.pathname === "/dashboard") ||
                  (path !== "/" && location.pathname.startsWith(path) && path.length > 1);

                return (
                  <Link key={path} to={path}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                      }`}
                      title={collapsed ? label : undefined}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActiveIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                      <Icon
                        className={`h-[18px] w-[18px] flex-shrink-0 ${
                          isActive ? "" : "group-hover:text-foreground/80"
                        }`}
                        strokeWidth={isActive ? 2 : 1.75}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className={`text-[13px] whitespace-nowrap overflow-hidden ${
                              isActive ? "font-semibold" : "font-medium"
                            }`}
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {badge && !collapsed && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                          {badge}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade CTA (for free users) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-3 mb-3"
          >
            <Link to="/profile">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-violet-500/10 border border-primary/10 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Upgrade to Pro
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Unlimited cards, price alerts, and advanced analytics
                </p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version */}
      <div className="px-4 py-2 border-t border-border/10">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500" title="v2.0" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/30">
              CardLedger v2.0
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground/30">Live</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
