import { Link, useLocation } from "react-router-dom";
import { Search, Package, LayoutDashboard, Receipt, UserCircle2, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState, useEffect } from "react";
import { NotificationCenter } from "./NotificationCenter";

// Page title mapping
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/scan": "Search Cards",
  "/inventory": "Inventory",
  "/sales": "Sales & P&L",
  "/analytics": "Analytics",
  "/stats": "Statistics",
  "/trends": "Market Trends",
  "/market-trends": "Price Tracker",
  "/wishlist": "Watchlist",
  "/grading": "Grading Center",
  "/trading": "Trading Hub",
  "/achievements": "Achievements",
  "/alerts": "Price Alerts",
  "/profile": "Profile",
  "/settings": "Settings",
  "/help": "Help & Support",
  "/leaderboards": "Leaderboards",
  "/import": "Import Cards",
  "/add-item": "Add Card",
};

const Navbar = () => {
  const location = useLocation();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const pageTitle = PAGE_TITLES[location.pathname] || "CardLedger";

  // Mobile bottom nav items (only shown on mobile via BottomNav)
  // Desktop uses DesktopSidebar instead

  return (
    <>
      {/* Desktop Top Bar — contextual header, not navigation */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden md:block sticky top-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? "hsl(var(--glass-bg))" : "hsl(var(--background) / 0.8)",
          backdropFilter: scrolled ? "blur(28px) saturate(180%)" : "blur(12px)",
          WebkitBackdropFilter: scrolled ? "blur(28px) saturate(180%)" : "blur(12px)",
          borderBottom: scrolled
            ? "0.5px solid hsl(var(--glass-border))"
            : "0.5px solid transparent",
        }}
      >
        <div className="px-6">
          <div className="flex h-14 items-center justify-between">
            {/* Page Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground">
                {pageTitle}
              </h1>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Search */}
              <button
                onClick={() => {
                  // Dispatch keyboard shortcut event to open CommandPalette
                  window.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", metaKey: true })
                  );
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/10 text-muted-foreground/50 hover:text-muted-foreground text-sm transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="text-xs">Search...</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] font-medium text-muted-foreground/40">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </button>

              {/* Notifications */}
              <NotificationCenter />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Top Bar — shows logo + minimal nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="md:hidden sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "hsl(var(--glass-bg))" : "transparent",
          backdropFilter: scrolled ? "blur(28px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(28px) saturate(180%)" : "none",
          borderBottom: scrolled
            ? "0.5px solid hsl(var(--glass-border))"
            : "0.5px solid transparent",
        }}
      >
        <div className="px-4">
          <div className="flex h-12 items-center justify-between">
            <Link to="/dashboard">
              <Logo size={24} showText={true} />
            </Link>
            <div className="flex items-center gap-2">
              <NotificationCenter />
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
