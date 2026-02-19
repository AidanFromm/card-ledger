import { Search, Package, LayoutDashboard, DollarSign, User } from "lucide-react";
import { NavLink } from "./NavLink";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const navItems = [
    { to: "/scan", icon: Search, label: "Search" },
    { to: "/inventory", icon: Package, label: "Inventory" },
    { to: "/dashboard", icon: LayoutDashboard, label: "Analytics" },
    { to: "/sales", icon: DollarSign, label: "Sales" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const currentIndex = navItems.findIndex(item => item.to === location.pathname);
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
    if (distance > minSwipeDistance && currentIndex < navItems.length - 1) {
      navigate(navItems[currentIndex + 1].to);
    } else if (distance < -minSwipeDistance && currentIndex > 0) {
      navigate(navItems[currentIndex - 1].to);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        aria-label="Main navigation"
        role="navigation"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          className="mx-3 mb-2 rounded-[22px] overflow-hidden"
          style={{
            background: 'hsl(var(--glass-bg))',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '0.5px solid hsl(var(--glass-border))',
            boxShadow: '0 8px 32px -4px hsl(0 0% 0% / 0.15), 0 2px 8px -2px hsl(0 0% 0% / 0.08)',
          }}
        >
          <div className="flex items-center justify-around px-2 pt-2.5 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}>
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;

              return (
                <NavLink
                  key={to}
                  to={to}
                  end
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-2xl transition-all duration-200 touch-target tap-highlight flex-1"
                >
                  {/* Active pill */}
                  {isActive && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute -top-0.5 w-8 h-1 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}

                  <motion.div
                    initial={false}
                    animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="relative z-10"
                  >
                    <Icon
                      className={`h-[22px] w-[22px] transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground/60'
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </motion.div>

                  <span
                    className={`text-[10px] font-semibold relative z-10 transition-all duration-200 ${
                      isActive ? 'text-primary' : 'text-muted-foreground/50'
                    }`}
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </motion.div>
      </nav>

      {/* Spacer */}
      <div className="md:hidden h-24" />
    </>
  );
};

export default BottomNav;
