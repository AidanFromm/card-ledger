import { Search, Package, LayoutDashboard, TrendingUp, User, BarChart3, Heart } from "lucide-react";
import { NavLink } from "./NavLink";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [lastTap, setLastTap] = useState<{ path: string; time: number } | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Navigation items - Search is the primary action
  const navItems = [
    { to: "/scan", icon: Search, label: "Search", isPrimary: true },
    { to: "/inventory", icon: Package, label: "Inventory" },
    { to: "/wishlist", icon: Heart, label: "Wishlist" },
    { to: "/dashboard", icon: BarChart3, label: "Analytics" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  // Get current tab index
  const currentIndex = navItems.findIndex(item => 
    location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  );

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
      navigate(navItems[currentIndex + 1].to);
    } else if (isRightSwipe && currentIndex > 0) {
      navigate(navItems[currentIndex - 1].to);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Double tap to scroll to top
  const handleNavItemClick = (to: string) => {
    const now = Date.now();
    if (lastTap && lastTap.path === to && now - lastTap.time < 300) {
      // Double tap - scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setLastTap(null);
    } else {
      setLastTap({ path: to, time: now });
    }
  };

  return (
    <>
      {/* Premium Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Gradient fade overlay */}
        <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        
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
          className="relative bg-card/95 backdrop-blur-xl border-t border-border/50 pb-safe"
          style={{
            boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div className="flex items-center justify-around px-1 pt-2 pb-1">
            {navItems.map(({ to, icon: Icon, label, isPrimary }, index) => {
              const isActive = currentIndex === index;

              return (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={() => handleNavItemClick(to)}
                  className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-2xl transition-all duration-200 touch-target tap-highlight flex-1"
                >
                  {/* Active pill indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavPill"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`
                          absolute inset-x-3 top-1 bottom-1 rounded-xl
                          ${isPrimary ? 'bg-primary/20' : 'bg-primary/10'}
                        `}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500, 
                          damping: 35 
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon with animation */}
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0,
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25 
                    }}
                    className="relative z-10"
                  >
                    <Icon
                      className={`
                        h-5 w-5 transition-colors duration-200
                        ${isActive ? 'text-primary' : 'text-muted-foreground'}
                      `}
                      strokeWidth={isActive ? 2.5 : 1.75}
                    />
                    
                    {/* Active dot indicator */}
                    <AnimatePresence>
                      {isActive && isPrimary && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Label */}
                  <motion.span
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0.6,
                      fontWeight: isActive ? 600 : 500,
                    }}
                    className={`
                      text-[10px] relative z-10 transition-colors duration-200
                      ${isActive ? 'text-primary' : 'text-muted-foreground'}
                    `}
                  >
                    {label}
                  </motion.span>
                </NavLink>
              );
            })}
          </div>
          
          {/* Home indicator line (iOS style) */}
          <div className="flex justify-center pb-1">
            <div className="w-32 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        </motion.div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-24" />
    </>
  );
};

export default BottomNav;
