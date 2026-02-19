import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Package, LayoutDashboard, Receipt, UserCircle2, BarChart3, ChevronLeft, ChevronRight, TrendingUp, Flame } from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/scan", label: "Search", icon: Search },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/dashboard", label: "Analytics", icon: LayoutDashboard },
  { path: "/stats", label: "Statistics", icon: BarChart3 },
  { path: "/trends", label: "Trends", icon: Flame },
  { path: "/sales", label: "Sales", icon: Receipt },
  { path: "/profile", label: "Profile", icon: UserCircle2 },
];

export const DesktopSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`hidden md:flex flex-col sticky top-0 h-screen border-r border-border/20 bg-card/50 backdrop-blur-sm transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16">
        <Link to="/dashboard" className="flex items-center overflow-hidden">
          <Logo size={28} showText={!collapsed} />
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActive"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.75} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border/20">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-2 rounded-xl hover:bg-secondary/40 text-muted-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-xs ml-2">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
