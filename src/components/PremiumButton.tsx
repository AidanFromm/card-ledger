import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, useState, useRef, ReactNode } from "react";
import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RippleProps {
  x: number;
  y: number;
  size: number;
}

interface PremiumButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive" | "success";
  size?: "sm" | "md" | "lg" | "xl" | "icon";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  ripple?: boolean;
  glow?: boolean;
}

const variantStyles = {
  primary: `
    bg-gradient-to-r from-primary to-emerald-600
    text-primary-foreground
    shadow-lg shadow-primary/25
    hover:shadow-xl hover:shadow-primary/30
    active:shadow-md
  `,
  secondary: `
    bg-secondary text-secondary-foreground
    hover:bg-secondary/80
  `,
  ghost: `
    bg-transparent text-foreground
    hover:bg-secondary/50
  `,
  outline: `
    bg-transparent border border-border
    text-foreground
    hover:bg-secondary/30
  `,
  destructive: `
    bg-gradient-to-r from-destructive to-red-600
    text-destructive-foreground
    shadow-lg shadow-destructive/25
    hover:shadow-xl hover:shadow-destructive/30
  `,
  success: `
    bg-gradient-to-r from-success to-emerald-600
    text-white
    shadow-lg shadow-success/25
    hover:shadow-xl hover:shadow-success/30
  `,
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
  xl: "h-14 px-8 text-lg rounded-2xl gap-3",
  icon: "h-10 w-10 rounded-xl p-0",
};

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      disabled = false,
      children,
      ripple = true,
      glow = false,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<RippleProps[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const addRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple || disabled || loading) return;

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const newRipple = { x, y, size };
      setRipples((prev) => [...prev, newRipple]);

      // Clean up ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 600);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      addRipple(event);
      onClick?.(event);
    };

    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={(node) => {
          (buttonRef as any).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        whileHover={!isDisabled ? { scale: 1.02, y: -1 } : undefined}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center justify-center font-semibold",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "overflow-hidden",
          variantStyles[variant],
          sizeStyles[size],
          glow && variant === "primary" && "animate-glow-pulse",
          className
        )}
        {...props}
      >
        {/* Ripple effects */}
        {ripple &&
          ripples.map((r, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute rounded-full bg-white/30 pointer-events-none"
              style={{
                left: r.x,
                top: r.y,
                width: r.size,
                height: r.size,
              }}
            />
          ))}

        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-inherit">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            Icon && <Icon className="w-4 h-4" />
          )}
          {size !== "icon" && children}
          {IconRight && !loading && <IconRight className="w-4 h-4" />}
        </span>
      </motion.button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

// Icon button variant
interface IconButtonProps extends Omit<PremiumButtonProps, "children"> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, ...props }, ref) => {
    return (
      <PremiumButton
        ref={ref}
        size="icon"
        icon={Icon}
        aria-label={label}
        {...props}
      />
    );
  }
);

IconButton.displayName = "IconButton";

// Floating Action Button
interface FABProps extends PremiumButtonProps {
  position?: "bottom-right" | "bottom-center" | "bottom-left";
}

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ position = "bottom-right", className, ...props }, ref) => {
    const positionStyles = {
      "bottom-right": "fixed bottom-24 right-4 md:bottom-8",
      "bottom-center": "fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8",
      "bottom-left": "fixed bottom-24 left-4 md:bottom-8",
    };

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={positionStyles[position]}
      >
        <PremiumButton
          ref={ref}
          size="xl"
          glow
          className={cn(
            "rounded-full h-14 w-14 p-0 shadow-2xl",
            className
          )}
          {...props}
        />
      </motion.div>
    );
  }
);

FAB.displayName = "FAB";

// Animated toggle switch
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  size = "md",
  label,
}: ToggleSwitchProps) => {
  const sizeConfig = {
    sm: { track: "w-8 h-4", thumb: "w-3 h-3", translate: 16 },
    md: { track: "w-11 h-6", thumb: "w-5 h-5", translate: 20 },
    lg: { track: "w-14 h-7", thumb: "w-6 h-6", translate: 28 },
  };

  const config = sizeConfig[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        config.track,
        checked ? "bg-primary" : "bg-muted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <motion.span
        animate={{
          x: checked ? config.translate : 2,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute rounded-full bg-white shadow-sm",
          config.thumb
        )}
      />
    </button>
  );
};

// Animated checkbox
interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const AnimatedCheckbox = ({
  checked,
  onChange,
  disabled = false,
  label,
}: AnimatedCheckboxProps) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative w-5 h-5 rounded-md border-2 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        checked ? "bg-primary border-primary" : "bg-transparent border-muted-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="w-full h-full p-0.5"
        fill="none"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 12l5 5L20 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </motion.svg>
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
};

export default PremiumButton;
