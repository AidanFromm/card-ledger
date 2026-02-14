import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Package, TrendingUp, Search, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  illustration?: "cards" | "search" | "sales" | "none";
}

// Card stack illustration SVG
const CardStackIllustration = () => (
  <motion.svg
    width="200"
    height="160"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
  >
    {/* Background glow */}
    <motion.ellipse
      cx="100"
      cy="140"
      rx="80"
      ry="15"
      className="fill-primary/5"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    />
    
    {/* Back card */}
    <motion.g
      initial={{ x: -10, y: 10, rotate: -10, opacity: 0 }}
      animate={{ x: 0, y: 0, rotate: -8, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <rect
        x="40"
        y="25"
        width="70"
        height="95"
        rx="6"
        className="fill-secondary stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="47"
        y="32"
        width="56"
        height="40"
        rx="3"
        className="fill-muted/50"
      />
      <rect x="47" y="78" width="40" height="4" rx="2" className="fill-muted" />
      <rect x="47" y="86" width="30" height="3" rx="1.5" className="fill-muted/50" />
    </motion.g>
    
    {/* Middle card */}
    <motion.g
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <rect
        x="65"
        y="20"
        width="70"
        height="95"
        rx="6"
        className="fill-card stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="72"
        y="27"
        width="56"
        height="40"
        rx="3"
        className="fill-primary/10"
      />
      <rect x="72" y="73" width="45" height="4" rx="2" className="fill-muted" />
      <rect x="72" y="81" width="35" height="3" rx="1.5" className="fill-muted/50" />
      {/* Star sparkle */}
      <motion.path
        d="M115 35 L117 40 L122 40 L118 44 L120 49 L115 46 L110 49 L112 44 L108 40 L113 40 Z"
        className="fill-primary/60"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8, type: "spring" }}
      />
    </motion.g>
    
    {/* Front card (highlighted) */}
    <motion.g
      initial={{ x: 10, y: -10, rotate: 10, opacity: 0 }}
      animate={{ x: 0, y: 0, rotate: 6, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <rect
        x="90"
        y="15"
        width="70"
        height="95"
        rx="6"
        className="fill-card stroke-primary/50"
        strokeWidth="2"
      />
      <rect
        x="97"
        y="22"
        width="56"
        height="40"
        rx="3"
        className="fill-gradient-to-br from-primary/20 to-primary/5"
      />
      {/* Card image placeholder with gradient */}
      <defs>
        <linearGradient id="cardGradient" x1="97" y1="22" x2="153" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="97" y="22" width="56" height="40" rx="3" fill="url(#cardGradient)" />
      
      {/* Text lines */}
      <rect x="97" y="68" width="50" height="4" rx="2" className="fill-foreground/20" />
      <rect x="97" y="76" width="38" height="3" rx="1.5" className="fill-muted-foreground/30" />
      
      {/* Price badge */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.9, type: "spring" }}
      >
        <rect x="97" y="85" width="30" height="14" rx="4" className="fill-primary/20" />
        <text x="112" y="95" textAnchor="middle" className="fill-primary text-[8px] font-bold">
          $0.00
        </text>
      </motion.g>
    </motion.g>
    
    {/* Floating sparkles */}
    <motion.circle
      cx="170"
      cy="30"
      r="3"
      className="fill-primary/40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 0.8, 1], opacity: [0, 1, 0.8, 1] }}
      transition={{ duration: 1.5, delay: 1, repeat: Infinity, repeatDelay: 2 }}
    />
    <motion.circle
      cx="30"
      cy="50"
      r="2"
      className="fill-primary/30"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 0.8, 1], opacity: [0, 1, 0.8, 1] }}
      transition={{ duration: 1.5, delay: 1.3, repeat: Infinity, repeatDelay: 2.5 }}
    />
    <motion.circle
      cx="180"
      cy="90"
      r="2.5"
      className="fill-primary/35"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 0.8, 1], opacity: [0, 1, 0.8, 1] }}
      transition={{ duration: 1.5, delay: 1.6, repeat: Infinity, repeatDelay: 3 }}
    />
  </motion.svg>
);

// Search illustration SVG
const SearchIllustration = () => (
  <motion.svg
    width="160"
    height="140"
    viewBox="0 0 160 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Magnifying glass */}
    <motion.circle
      cx="65"
      cy="60"
      r="35"
      className="stroke-muted-foreground/30"
      strokeWidth="8"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    />
    <motion.line
      x1="92"
      y1="88"
      x2="125"
      y2="121"
      className="stroke-muted-foreground/30"
      strokeWidth="10"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: 0.8 }}
    />
    
    {/* Card inside magnifier */}
    <motion.rect
      x="50"
      y="42"
      width="30"
      height="40"
      rx="3"
      className="fill-muted/50 stroke-muted-foreground/20"
      strokeWidth="1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1 }}
    />
    <motion.rect
      x="54"
      y="46"
      width="22"
      height="16"
      rx="2"
      className="fill-primary/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 1.1 }}
    />
    <motion.rect
      x="54"
      y="66"
      width="16"
      height="2"
      rx="1"
      className="fill-muted-foreground/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 1.2 }}
    />
    
    {/* Question marks */}
    <motion.text
      x="125"
      y="45"
      className="fill-muted-foreground/30 text-lg font-bold"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.3 }}
    >
      ?
    </motion.text>
    <motion.text
      x="20"
      y="95"
      className="fill-muted-foreground/20 text-sm font-bold"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.5 }}
    >
      ?
    </motion.text>
  </motion.svg>
);

// Sales/trending illustration
const SalesIllustration = () => (
  <motion.svg
    width="180"
    height="140"
    viewBox="0 0 180 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Chart axes */}
    <motion.line
      x1="30"
      y1="110"
      x2="150"
      y2="110"
      className="stroke-muted-foreground/30"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    <motion.line
      x1="30"
      y1="110"
      x2="30"
      y2="20"
      className="stroke-muted-foreground/30"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
    
    {/* Trend line going up */}
    <motion.path
      d="M40 90 L70 70 L100 75 L130 40"
      className="stroke-navy-500/60"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    />
    
    {/* Data points */}
    {[
      { cx: 40, cy: 90, delay: 0.6 },
      { cx: 70, cy: 70, delay: 0.7 },
      { cx: 100, cy: 75, delay: 0.8 },
      { cx: 130, cy: 40, delay: 0.9 },
    ].map((point, i) => (
      <motion.circle
        key={i}
        cx={point.cx}
        cy={point.cy}
        r="5"
        className="fill-navy-500/80"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: point.delay, type: "spring" }}
      />
    ))}
    
    {/* Arrow at end */}
    <motion.path
      d="M130 40 L140 35 M130 40 L140 50"
      className="stroke-navy-500/60"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 1 }}
    />
    
    {/* Dollar signs */}
    <motion.text
      x="150"
      y="25"
      className="fill-navy-500/40 text-lg font-bold"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.1 }}
    >
      $
    </motion.text>
  </motion.svg>
);

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  illustration = "none",
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      {/* Illustration */}
      {illustration === "cards" && <CardStackIllustration />}
      {illustration === "search" && <SearchIllustration />}
      {illustration === "sales" && <SalesIllustration />}
      
      {/* Icon fallback */}
      {illustration === "none" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="w-20 h-20 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center mb-6"
        >
          {icon || <Package className="h-10 w-10 text-muted-foreground/50" />}
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: illustration !== "none" ? 0.6 : 0.2, duration: 0.3 }}
        className="text-xl font-semibold text-foreground mb-2 mt-4"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: illustration !== "none" ? 0.7 : 0.25, duration: 0.3 }}
        className="text-muted-foreground max-w-sm mb-6"
      >
        {description}
      </motion.p>

      {(actionLabel && (actionHref || onAction)) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: illustration !== "none" ? 0.8 : 0.3, duration: 0.3 }}
        >
          {actionHref ? (
            <Link to={actionHref}>
              <Button className="gap-2 h-11 px-6 rounded-xl">
                <Plus className="h-4 w-4" />
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button onClick={onAction} className="gap-2 h-11 px-6 rounded-xl">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// Pre-configured empty states with illustrations
export const EmptyInventory = () => (
  <EmptyState
    illustration="cards"
    title="Ready to start your collection!"
    description="Add your first card to begin tracking your portfolio value and potential profits."
    actionLabel="Add Your First Card"
    actionHref="/scan"
  />
);

export const EmptySales = () => (
  <EmptyState
    illustration="sales"
    title="Ready to track your first sale!"
    description="When you sell cards from your collection, your profits and performance will appear here."
  />
);

export const EmptySearchResults = () => (
  <EmptyState
    illustration="search"
    title="No matches found"
    description="Try a different search term or adjust your filters to find what you're looking for."
  />
);
