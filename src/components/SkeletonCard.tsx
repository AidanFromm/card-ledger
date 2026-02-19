import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

// Premium shimmer skeleton with gradient animation
export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div 
    className={`
      relative overflow-hidden rounded-lg bg-muted/50
      before:absolute before:inset-0
      before:translate-x-[-100%]
      before:animate-[shimmer_2s_infinite]
      before:bg-gradient-to-r
      before:from-transparent before:via-white/10 before:to-transparent
      ${className}
    `}
  />
);

// Card skeleton for inventory items
export const SkeletonCard = () => (
  <div className="rounded-2xl bg-card border border-border overflow-hidden">
    {/* Image skeleton */}
    <div className="aspect-[3/4] relative overflow-hidden bg-muted/30">
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent"
      />
    </div>
    
    {/* Content skeleton */}
    <div className="p-3 space-y-2">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <div className="pt-1.5 border-t border-border/30">
        <Skeleton className="h-3 w-1/3 mb-1" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
  </div>
);

// Grid of skeleton cards
interface SkeletonGridProps {
  count?: number;
  columns?: 2 | 3 | 4 | 5;
}

export const SkeletonGrid = ({ count = 6, columns = 2 }: SkeletonGridProps) => {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </div>
  );
};

// List item skeleton
export const SkeletonListItem = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
    {/* Avatar/Image */}
    <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
    
    {/* Content */}
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    
    {/* Right side value */}
    <div className="text-right space-y-1">
      <Skeleton className="h-4 w-16 ml-auto" />
      <Skeleton className="h-3 w-12 ml-auto" />
    </div>
  </div>
);

// List skeleton
interface SkeletonListProps {
  count?: number;
}

export const SkeletonList = ({ count = 5 }: SkeletonListProps) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
      >
        <SkeletonListItem />
      </motion.div>
    ))}
  </div>
);

// Stats card skeleton (for dashboard)
export const SkeletonStats = () => (
  <div className="rounded-2xl bg-card border border-border p-4">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-8 w-32 mb-1" />
    <Skeleton className="h-3 w-20" />
  </div>
);

// Chart skeleton
export const SkeletonChart = ({ height = 280 }: { height?: number }) => (
  <div 
    className="rounded-2xl bg-card border border-border overflow-hidden relative"
    style={{ height }}
  >
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent"
    />
    
    {/* Fake chart lines */}
    <div className="absolute inset-x-4 bottom-8 top-4 flex items-end justify-between gap-1 opacity-20">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-muted rounded-t"
          style={{ height: `${30 + Math.random() * 50}%` }}
        />
      ))}
    </div>
  </div>
);

// Hero/Portfolio value skeleton
export const SkeletonHero = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-32" />
    <div className="space-y-2">
      <Skeleton className="h-14 w-64" />
      <Skeleton className="h-6 w-40" />
    </div>
  </div>
);

// Full dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Hero skeleton */}
    <SkeletonHero />
    
    {/* Chart skeleton */}
    <SkeletonChart />
    
    {/* Stats row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <SkeletonStats />
        </motion.div>
      ))}
    </div>
    
    {/* Quick actions */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
  </div>
);

// Table skeleton
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable = ({ rows = 5, columns = 4 }: SkeletonTableProps) => (
  <div className="rounded-xl border border-border overflow-hidden">
    {/* Header */}
    <div className="flex gap-4 p-4 bg-muted/30 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, row) => (
      <div
        key={row}
        className="flex gap-4 p-4 border-b border-border last:border-0"
      >
        {Array.from({ length: columns }).map((_, col) => (
          <Skeleton key={col} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Input/Form skeleton
export const SkeletonInput = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-full rounded-xl" />
  </div>
);

export const SkeletonForm = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <SkeletonInput key={i} />
    ))}
    <Skeleton className="h-12 w-full rounded-xl mt-6" />
  </div>
);

// Profile skeleton
export const SkeletonProfile = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center gap-4">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center space-y-1">
          <Skeleton className="h-6 w-12 mx-auto" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      ))}
    </div>
    
    {/* Menu items */}
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="w-5 h-5 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonCard;
