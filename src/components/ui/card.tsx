import * as React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the card can be expanded
   * @default false
   */
  expandable?: boolean;
  /**
   * Whether the card is currently expanded
   * @default false
   */
  expanded?: boolean;
  /**
   * Callback when expanded state changes
   */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Apply iOS-style hover/active effects
   * @default false
   */
  interactive?: boolean;
  /**
   * Card style variant
   * @default "default"
   */
  variant?: "default" | "glass" | "float" | "clean" | "elevated";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      expandable = false,
      expanded = false,
      onExpandedChange,
      interactive = false,
      variant = "default",
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(expanded);

    React.useEffect(() => {
      setIsExpanded(expanded);
    }, [expanded]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (expandable) {
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);
        onExpandedChange?.(newExpanded);
      }
      onClick?.(e);
    };

    const variantClasses = {
      default: "rounded-lg border bg-card text-card-foreground shadow-sm",
      glass: "glass-card text-card-foreground",
      float: "card-float text-card-foreground",
      clean: "card-clean text-card-foreground",
      elevated: "card-clean-elevated text-card-foreground",
    };

    const interactiveClasses = interactive
      ? "cursor-pointer transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 active:shadow-card tap-highlight"
      : "";

    const expandableClasses = expandable ? "cursor-pointer" : "";

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          interactiveClasses,
          expandableClasses,
          className
        )}
        onClick={expandable || onClick ? handleClick : undefined}
        data-expanded={isExpanded}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

// Expandable card content that animates
interface ExpandableContentProps extends React.HTMLAttributes<HTMLDivElement> {
  expanded: boolean;
}

const ExpandableContent = React.forwardRef<HTMLDivElement, ExpandableContentProps>(
  ({ className, expanded, children, ...props }, ref) => {
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [height, setHeight] = React.useState<number | undefined>(undefined);

    React.useEffect(() => {
      if (contentRef.current) {
        setHeight(expanded ? contentRef.current.scrollHeight : 0);
      }
    }, [expanded, children]);

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          className
        )}
        style={{ height: height ?? 0 }}
        {...props}
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    );
  }
);
ExpandableContent.displayName = "ExpandableContent";

// Card with P&L indicator
interface PnLCardProps extends CardProps {
  value: number;
  showGlow?: boolean;
}

const PnLCard = React.forwardRef<HTMLDivElement, PnLCardProps>(
  ({ className, value, showGlow = false, children, ...props }, ref) => {
    const isPositive = value >= 0;
    const glowClass = showGlow
      ? isPositive
        ? "glow-gain"
        : "glow-loss"
      : "";

    return (
      <Card
        ref={ref}
        className={cn(
          glowClass,
          isPositive ? "border-gain/20" : "border-loss/20",
          className
        )}
        {...props}
      >
        {children}
      </Card>
    );
  }
);
PnLCard.displayName = "PnLCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  ExpandableContent,
  PnLCard,
};
