import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { TouchRipple } from "./touch-ripple";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden transition-all duration-200 ease-out active:scale-[0.97] tap-highlight",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // New Robinhood-style variants
        gain: "bg-gain text-gain-foreground hover:bg-gain/90",
        loss: "bg-loss text-loss-foreground hover:bg-loss/90",
        "gain-outline": "border border-gain text-gain hover:bg-gain/10",
        "loss-outline": "border border-loss text-loss hover:bg-loss/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // iOS-style sizes
        xl: "h-12 rounded-xl px-6 text-base",
        "2xl": "h-14 rounded-xl px-8 text-lg font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Enable Material-style touch ripple effect
   * @default true
   */
  ripple?: boolean;
  /**
   * Color of the ripple effect
   * @default "rgba(255, 255, 255, 0.3)"
   */
  rippleColor?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      ripple = true,
      rippleColor,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // Determine ripple color based on variant
    const defaultRippleColor = React.useMemo(() => {
      if (rippleColor) return rippleColor;
      switch (variant) {
        case "default":
        case "destructive":
        case "gain":
        case "loss":
          return "rgba(255, 255, 255, 0.3)";
        case "outline":
        case "ghost":
        case "gain-outline":
        case "loss-outline":
          return "rgba(0, 0, 0, 0.1)";
        case "secondary":
          return "rgba(0, 0, 0, 0.1)";
        default:
          return "rgba(255, 255, 255, 0.3)";
      }
    }, [variant, rippleColor]);

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {ripple && <TouchRipple color={defaultRippleColor} disabled={props.disabled} />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
