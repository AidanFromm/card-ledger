import { Search, Package, LayoutDashboard, DollarSign, User } from "lucide-react";
import { NavLink } from "./NavLink";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // 5 tabs: Scan/Search (hero), Inventory, Dashboard, Sales, Profile
  const navItems = [
    { to: "/scan", icon: Search, label: "Search" },
    { to: "/inventory", icon: Package, label: "Inventory" },
    { to: "/dashboard", icon: LayoutDashboard, label: "Analytics" },
    { to: "/sales", icon: DollarSign, label: "Sales" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  // Get current tab index
  const currentIndex = navItems.findIndex(item => item.to === location.pathname);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < navItems.length - 1) {
      // Swipe left = go to next tab
      navigate(navItems[currentIndex + 1].to);
    } else if (isRightSwipe && currentIndex > 0) {
      // Swipe right = go to previous tab
      navigate(navItems[currentIndex - 1].to);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <>
      {/* iOS-style Glassmorphism Bottom Navigation with Swipe Support */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <motion.div
          ref={navRef}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.1
          }}
          className="glass-nav pb-safe"
        >
          <div className="flex items-center justify-around px-1 pt-2 pb-1">
            {navItems.map(({ to, icon: Icon, label }, index) => {
              const isActive = location.pathname === to;
              const isSearch = index === 0; // Search is hero action

              return (
                <NavLink
                  key={to}
                  to={to}
                  end
                  className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-2xl transition-all duration-200 touch-target tap-highlight flex-1"
                >
                  {/* Active background indicator - centered behind icon and label */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavActive"
                      className={`absolute inset-x-2 top-1 bottom-1 rounded-xl ${
                        isSearch ? 'bg-primary/20' : 'bg-primary/10'
                      }`}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}

                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="relative z-10"
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors duration-200 ${
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                  </motion.div>

                  <motion.span
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0.7,
                    }}
                    className={`text-[10px] font-medium relative z-10 transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </motion.span>
                </NavLink>
              );
            })}
          </div>
        </motion.div>
      </nav>

      {/* Spacer for mobile bottom nav - accounts for safe area */}
      <div className="md:hidden h-20" />
    </>
  );
};

export default BottomNav;
