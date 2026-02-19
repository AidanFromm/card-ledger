import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Package, TrendingUp, Search, Plus, Sparkles, BarChart3, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: ReactNode;
  image?: string;
  imageAlt?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

// Animated floating dots background for empty states
const FloatingDots = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/20"
        style={{
          left: `${20 + i * 15}%`,
          top: `${30 + (i % 3) * 20}%`,
        }}
        animate={{
          y: [0, -12, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 2.5 + i * 0.3,
          repeat: Infinity,
          delay: i * 0.4,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

export const EmptyState = ({
  icon,
  image,
  imageAlt,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <FloatingDots />

      {image ? (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
          className="mb-6 relative"
        >
          <img
            src={image}
            alt={imageAlt || title}
            loading="lazy"
            className="w-[200px] h-auto object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-3xl bg-primary/8 border border-primary/10 flex items-center justify-center mb-6 relative"
        >
          {icon || <Package className="h-9 w-9 text-primary/40" />}
          <motion.div
            className="absolute inset-0 rounded-3xl border border-primary/10"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-xl font-semibold text-foreground mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed"
      >
        {description}
      </motion.p>

      {(actionLabel && (actionHref || onAction)) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {actionHref ? (
            <Link to={actionHref}>
              <Button className="gap-2 h-11 px-6 rounded-2xl active:scale-[0.97] transition-all">
                <Plus className="h-4 w-4" />
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button onClick={onAction} className="gap-2 h-11 px-6 rounded-2xl active:scale-[0.97] transition-all">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// Pre-configured empty states
export const EmptyInventory = () => (
  <EmptyState
    image="/assets/empty-inventory.png"
    imageAlt="Empty card inventory"
    icon={<Sparkles className="h-9 w-9 text-primary/50" />}
    title="Your collection starts here"
    description="Search for your first card and add it to start tracking your portfolio value and potential profits."
    actionLabel="Find Your First Card"
    actionHref="/scan"
  />
);

export const EmptySales = () => (
  <EmptyState
    image="/assets/empty-sales.png"
    imageAlt="No sales recorded"
    icon={<TrendingUp className="h-9 w-9 text-emerald-500/50" />}
    title="Your first sale awaits"
    description="When you sell cards from your collection, your profits, performance metrics, and best sellers will appear here."
  />
);

export const EmptySearchResults = () => (
  <EmptyState
    image="/assets/empty-search.png"
    imageAlt="No search results"
    icon={<Search className="h-9 w-9 text-muted-foreground/40" />}
    title="No matches found"
    description="Try a different name or check the spelling. We search Pokemon, sports cards, Yu-Gi-Oh, Magic, and more."
  />
);

export const EmptyWatchlist = () => (
  <EmptyState
    image="/assets/empty-watchlist.png"
    imageAlt="Empty watchlist"
    icon={<Heart className="h-9 w-9 text-pink-500/50" />}
    title="Your watchlist is empty"
    description="Add cards you're eyeing to your watchlist and track their prices before you buy."
    actionLabel="Browse Cards"
    actionHref="/scan"
  />
);

export const EmptyAnalytics = () => (
  <EmptyState
    icon={<BarChart3 className="h-9 w-9 text-primary/40" />}
    title="Analytics unlock with data"
    description="Add cards and record sales to see detailed performance metrics, charts, and breakdowns."
    actionLabel="Add Your First Card"
    actionHref="/scan"
  />
);
