"use client";

import { useRef, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface DockItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface DockProps {
  items: DockItem[];
  className?: string;
  magnification?: number;
  distance?: number;
  springConfig?: { stiffness: number; damping: number };
}

export function Dock({
  items,
  className,
  magnification = 70,
  distance = 150,
  springConfig = { stiffness: 300, damping: 30 },
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "flex h-16 items-end gap-3 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#1a1a1a] px-4 pb-3 shadow-2xl",
        className
      )}
    >
      {items.map((item, index) => (
        <DockIcon
          key={index}
          mouseX={mouseX}
          magnification={magnification}
          distance={distance}
          springConfig={springConfig}
          {...item}
        />
      ))}
    </motion.div>
  );
}

interface DockIconProps extends DockItem {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  magnification: number;
  distance: number;
  springConfig: { stiffness: number; damping: number };
}

function DockIcon({
  icon,
  label,
  href,
  onClick,
  mouseX,
  magnification,
  distance,
  springConfig,
}: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distanceCalc, [-distance, 0, distance], [40, magnification, 40]);
  const width = useSpring(widthSync, springConfig);

  const handleClick = useCallback(() => {
    if (onClick) onClick();
    if (href) window.location.href = href;
  }, [href, onClick]);

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className="relative flex aspect-square cursor-pointer items-center justify-center rounded-xl bg-[#141414] border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:border-[#2a2a2a] transition-colors"
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-1/2 h-1/2">{icon}</div>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 10, x: "-50%" }}
            className="absolute -top-12 left-1/2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] whitespace-nowrap shadow-xl"
          >
            <span className="text-sm text-white font-medium">{label}</span>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#1a1a1a] border-r border-b border-[#2a2a2a] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Floating dock that sticks to the bottom
interface FloatingDockProps extends DockProps {
  visible?: boolean;
}

export function FloatingDock({ items, className, visible = true, ...props }: FloatingDockProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-50", className)}
        >
          <Dock items={items} {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mobile dock (simplified, no magnification)
interface MobileDockProps {
  items: DockItem[];
  className?: string;
  activeIndex?: number;
}

export function MobileDock({ items, className, activeIndex = 0 }: MobileDockProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-around gap-1 rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#1a1a1a] p-2 shadow-2xl",
        className
      )}
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        return (
          <motion.button
            key={index}
            onClick={item.onClick}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors",
              isActive
                ? "bg-[#627d98]/20 text-[#627d98]"
                : "text-gray-500 hover:text-white hover:bg-[#1a1a1a]"
            )}
          >
            <div className="w-6 h-6">{item.icon}</div>
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl border border-[#627d98]/30"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// Tab bar variant (horizontal tabs)
interface TabBarProps {
  tabs: { label: string; icon?: React.ReactNode; onClick?: () => void }[];
  activeTab: number;
  onTabChange: (index: number) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a]",
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = index === activeTab;
        return (
          <button
            key={index}
            onClick={() => {
              onTabChange(index);
              tab.onClick?.();
            }}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive ? "text-white" : "text-gray-500 hover:text-white"
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 bg-[#627d98]/20 rounded-lg -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
