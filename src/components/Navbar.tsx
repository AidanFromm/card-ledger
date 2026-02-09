import { Link, useLocation } from "react-router-dom";
import { Search, Package, LayoutDashboard, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

const Navbar = () => {
  const location = useLocation();

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
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="hidden md:block sticky top-0 z-50 glass-nav border-b border-border/30"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/scan" className="flex items-center">
              <Logo size={28} showText={true} />
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
                      whileTap={{ scale: 0.98 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNavTab"
                          className="absolute inset-0 bg-card rounded-xl shadow-sm"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
