import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { TouchRipple } from "@/components/ui/touch-ripple";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  color: string;
  onClick: () => void;
  delay?: number;
  size?: "default" | "large";
}

export function QuickActionCard({
  icon: Icon,
  label,
  description,
  color,
  onClick,
  delay = 0,
  size = "default",
}: QuickActionCardProps) {
  const isLarge = size === "large";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <TouchRipple
        onClick={onClick}
        className={`
          relative overflow-hidden rounded-2xl bg-card border border-border/50
          shadow-sm hover:shadow-md transition-shadow duration-200
          ${isLarge ? "p-5" : "p-4"}
        `}
        color="rgba(0, 116, 251, 0.2)"
      >
        {/* Gradient glow effect */}
        <div
          className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-30`}
          style={{
            background: `radial-gradient(circle, ${color.replace("/", " / ")} 0%, transparent 70%)`,
          }}
        />

        <div className="relative">
          {/* Icon */}
          <div
            className={`
              rounded-xl flex items-center justify-center mb-3
              ${isLarge ? "w-14 h-14" : "w-12 h-12"}
              ${color}
            `}
          >
            <Icon className={isLarge ? "w-7 h-7" : "w-6 h-6"} />
          </div>

          {/* Label */}
          <h3 className={`font-semibold ${isLarge ? "text-base" : "text-sm"}`}>
            {label}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </TouchRipple>
    </motion.div>
  );
}

// Grid wrapper for quick actions
interface QuickActionsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function QuickActionsGrid({ children, columns = 3 }: QuickActionsGridProps) {
  return (
    <div
      className={`grid gap-3 ${
        columns === 2
          ? "grid-cols-2"
          : columns === 4
          ? "grid-cols-2 sm:grid-cols-4"
          : "grid-cols-3"
      }`}
    >
      {children}
    </div>
  );
}
