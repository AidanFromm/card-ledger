import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PremiumCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: "default" | "elevated" | "glass" | "outline" | "gradient";
  hover?: "lift" | "glow" | "scale" | "none";
  interactive?: boolean;
  glow?: boolean;
  children: ReactNode;
}

const variantStyles = {
  default: "bg-card border border-border",
  elevated: "bg-card shadow-card",
  glass: "bg-card/80 backdrop-blur-xl border border-border/50",
  outline: "bg-transparent border-2 border-border",
  gradient: "bg-gradient-to-br from-card to-muted border border-border/50",
};

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    {
      variant = "default",
      hover = "lift",
      interactive = true,
      glow = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const hoverAnimation = interactive
      ? {
          lift: {
            whileHover: { y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" },
            whileTap: { scale: 0.98 },
          },
          glow: {
            whileHover: { boxShadow: "0 0 30px hsl(160 84% 39% / 0.2)" },
            whileTap: { scale: 0.98 },
          },
          scale: {
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 },
          },
          none: {},
        }[hover]
      : {};

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        {...hoverAnimation}
        className={cn(
          "rounded-2xl p-4 transition-all duration-200",
          variantStyles[variant],
          glow && "animate-premium-glow",
          interactive && "cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";

// Stat card with value animation
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  iconColor?: string;
  iconBg?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  onClick?: () => void;
}

export const StatCard = ({
  label,
  value,
  change,
  icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/15",
  prefix = "",
  suffix = "",
  className,
  onClick,
}: StatCardProps) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <PremiumCard
      variant="default"
      hover={onClick ? "lift" : "none"}
      interactive={!!onClick}
      onClick={onClick}
      className={cn("space-y-3", className)}
    >
      {/* Header with icon */}
      <div className="flex items-center justify-between">
        {icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
            <div className={iconColor}>{icon}</div>
          </div>
        )}
        {change !== undefined && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "text-xs font-semibold font-mono px-2 py-1 rounded-lg",
              isPositive ? "text-gain bg-gain/15" : "text-loss bg-loss/15"
            )}
          >
            {isPositive ? "+" : ""}{change.toFixed(2)}%
          </motion.span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold font-mono tracking-tight"
        >
          {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </motion.p>
      </div>
    </PremiumCard>
  );
};

// Action card with icon and label
interface ActionCardProps {
  icon: ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  gradient?: string;
  disabled?: boolean;
  badge?: string;
}

export const ActionCard = ({
  icon,
  label,
  description,
  onClick,
  gradient = "from-navy-800 to-navy-600",
  disabled = false,
  badge,
}: ActionCardProps) => {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative w-full p-4 rounded-2xl text-left transition-all",
        "bg-card border border-border",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {badge && (
        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/15 text-primary">
          {badge}
        </span>
      )}

      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", gradient)}>
        <div className="text-white">{icon}</div>
      </div>

      <p className="font-semibold text-foreground">{label}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </motion.button>
  );
};

// Feature card with image
interface FeatureCardProps {
  image?: string;
  title: string;
  subtitle?: string;
  value?: string | number;
  valueColor?: "default" | "gain" | "loss";
  onClick?: () => void;
  aspectRatio?: "square" | "portrait" | "landscape";
}

export const FeatureCard = ({
  image,
  title,
  subtitle,
  value,
  valueColor = "default",
  onClick,
  aspectRatio = "portrait",
}: FeatureCardProps) => {
  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  const valueColorClasses = {
    default: "text-foreground",
    gain: "text-gain",
    loss: "text-loss",
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-card border border-border overflow-hidden cursor-pointer",
        "transition-shadow hover:shadow-lg hover:shadow-black/10 hover:border-primary/30"
      )}
    >
      {/* Image */}
      <div className={cn("bg-muted relative overflow-hidden", aspectClasses[aspectRatio])}>
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🎴
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm text-foreground line-clamp-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
        )}
        {value !== undefined && (
          <p className={cn("text-lg font-bold font-mono", valueColorClasses[valueColor])}>
            ${typeof value === "number" ? value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : value}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Info card with colored border
interface InfoCardProps {
  type?: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const InfoCard = ({
  type = "info",
  title,
  description,
  action,
}: InfoCardProps) => {
  const typeStyles = {
    info: "border-primary/30 bg-primary/5",
    success: "border-gain/30 bg-gain/5",
    warning: "border-warning/30 bg-warning/5",
    error: "border-loss/30 bg-loss/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4",
        typeStyles[type]
      )}
    >
      <p className="font-semibold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          {action.label} →
        </button>
      )}
    </motion.div>
  );
};

export default PremiumCard;
