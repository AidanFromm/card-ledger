import { Link, useLocation } from "react-router-dom";
import { Search, Package, LayoutDashboard, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { NotificationCenter } from "./NotificationCenter";

const Navbar = () => {
  const location = useLocation();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const navItems = [
    { path: "/scan", label: "Search", icon: Search },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/dashboard", label: "Analytics", icon: LayoutDashboard },
    { path: "/sales", label: "Sales", icon: DollarSign },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="hidden md:block sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'hsl(var(--glass-bg))'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'none',
        borderBottom: scrolled
          ? '0.5px solid hsl(var(--glass-border))'
          : '0.5px solid transparent',
      }}
    >
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/scan" className="flex items-center" aria-label="Home">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Logo size={28} showText={true} />
              </motion.div>
            </Link>

            <div className="hidden md:flex gap-1 bg-secondary/30 p-1.5 rounded-2xl">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNavTab"
                          className="absolute inset-0 bg-card rounded-xl"
                          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                        />
                      )}
                      <Button
                        variant="ghost"
                        className={`relative z-10 gap-2 h-10 px-4 font-medium transition-colors rounded-xl ${
                          isActive
                            ? "text-primary hover:bg-transparent"
                            : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side — notifications + shortcuts hint */}
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/40 text-[11px] text-muted-foreground/50 font-mono border border-border/20" aria-label="Press Command+K for quick search">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
