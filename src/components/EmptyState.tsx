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
}

export const EmptyState = ({
  icon,
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
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="w-20 h-20 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center mb-6"
      >
        {icon || <Package className="h-10 w-10 text-muted-foreground/50" />}
      </motion.div>

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
        className="text-muted-foreground max-w-sm mb-6"
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

// Pre-configured empty states with encouraging tone
export const EmptyInventory = () => (
  <EmptyState
    icon={<Sparkles className="h-10 w-10 text-primary/60" />}
    title="Ready to start your collection!"
    description="Add your first card to begin tracking your portfolio value and potential profits."
    actionLabel="Add Your First Card"
    actionHref="/scan"
  />
);

export const EmptySales = () => (
  <EmptyState
    icon={<TrendingUp className="h-10 w-10 text-emerald-500/60" />}
    title="Ready to track your first sale!"
    description="When you sell cards from your collection, your profits and performance will appear here."
  />
);

export const EmptySearchResults = () => (
  <EmptyState
    icon={<Search className="h-10 w-10 text-muted-foreground/50" />}
    title="No matches found"
    description="Try a different search term or adjust your filters to find what you're looking for."
  />
);
