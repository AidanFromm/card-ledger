import { motion } from "framer-motion";

interface SkeletonCardProps {
  count?: number;
}

export const SkeletonCard = () => (
  <div className="glass-card overflow-hidden animate-pulse">
    {/* Image skeleton */}
    <div className="aspect-[3/4] bg-secondary/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
    {/* Content skeleton */}
    <div className="p-3 space-y-2">
      <div className="space-y-1.5">
        <div className="h-4 bg-secondary/50 rounded w-4/5" />
        <div className="h-3 bg-secondary/30 rounded w-3/5" />
      </div>
      <div className="pt-1.5 border-t border-border/30">
        <div className="h-3 bg-secondary/30 rounded w-1/3 mb-1" />
        <div className="h-4 bg-secondary/50 rounded w-1/2" />
      </div>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }: SkeletonCardProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.05 }}
      >
        <SkeletonCard />
      </motion.div>
    ))}
  </div>
);
