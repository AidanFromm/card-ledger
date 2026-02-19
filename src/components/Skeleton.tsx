import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "card" | "text" | "circle" | "button";
  animate?: boolean;
}

// Base skeleton with shimmer animation
export const Skeleton = ({ className, variant = "default", animate = true }: SkeletonProps) => {
  const baseClasses = "bg-muted/60 relative overflow-hidden";
  
  const variantClasses = {
    default: "rounded-md",
    card: "rounded-xl",
    text: "rounded h-4",
    circle: "rounded-full",
    button: "rounded-lg h-10",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {animate && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ translateX: ["0%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
};

// Card skeleton - mimics InventoryCard
export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("bg-card border border-border rounded-xl p-4 space-y-3", className)}>
    {/* Image area */}
    <Skeleton className="aspect-[3/4] w-full rounded-lg" />
    
    {/* Title */}
    <Skeleton variant="text" className="w-3/4 h-5" />
    
    {/* Subtitle */}
    <Skeleton variant="text" className="w-1/2 h-3" />
    
    {/* Price */}
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="w-20 h-6 rounded-md" />
      <Skeleton variant="circle" className="w-8 h-8" />
    </div>
  </div>
);

// List item skeleton
export const ListItemSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-4 p-4 bg-card border border-border rounded-xl", className)}>
    {/* Avatar/Image */}
    <Skeleton className="w-16 h-20 rounded-lg flex-shrink-0" />
    
    {/* Content */}
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="w-3/4 h-5" />
      <Skeleton variant="text" className="w-1/2 h-3" />
      <Skeleton variant="text" className="w-1/3 h-3" />
    </div>
    
    {/* Price/Action */}
    <div className="text-right space-y-2">
      <Skeleton className="w-16 h-5 rounded-md ml-auto" />
      <Skeleton className="w-12 h-3 rounded ml-auto" />
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
  <div className="flex items-center gap-4 p-4 border-b border-border">
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton 
        key={i} 
        variant="text" 
        className={cn(
          i === 0 ? "w-8 h-8 rounded-lg" : "flex-1 h-4",
          i === columns - 1 && "w-20"
        )} 
      />
    ))}
  </div>
);

// Stats card skeleton (for dashboard)
export const StatsCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("bg-card border border-border rounded-xl p-6 space-y-4", className)}>
    <div className="flex items-center justify-between">
      <Skeleton variant="text" className="w-24 h-4" />
      <Skeleton variant="circle" className="w-10 h-10" />
    </div>
    <Skeleton className="w-32 h-8 rounded-md" />
    <div className="flex items-center gap-2">
      <Skeleton className="w-12 h-4 rounded" />
      <Skeleton variant="text" className="w-20 h-3" />
    </div>
  </div>
);

// Chart skeleton
export const ChartSkeleton = ({ className, height = 200 }: { className?: string; height?: number }) => (
  <div className={cn("bg-card border border-border rounded-xl p-6", className)}>
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <Skeleton variant="text" className="w-32 h-5" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-8 rounded-lg" />
        <Skeleton className="w-16 h-8 rounded-lg" />
      </div>
    </div>
    
    {/* Chart area */}
    <div className="relative" style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="text" className="w-8 h-3" />
        ))}
      </div>
      
      {/* Bars */}
      <div className="absolute left-12 right-0 top-0 bottom-8 flex items-end justify-around gap-2 px-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-md" 
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
      
      {/* X-axis labels */}
      <div className="absolute left-12 right-0 bottom-0 flex justify-around">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} variant="text" className="w-8 h-3" />
        ))}
      </div>
    </div>
  </div>
);

// Dashboard skeleton (full page)
export const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="text" className="w-32 h-4" />
      </div>
      <div className="flex gap-3">
        <Skeleton variant="button" className="w-32" />
        <Skeleton variant="button" className="w-32" />
      </div>
    </div>
    
    {/* Stats row */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Chart and activity */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartSkeleton className="lg:col-span-2" height={280} />
      
      {/* Activity feed */}
      <div className="bg-card border border-border rounded-xl p-6">
        <Skeleton variant="text" className="w-32 h-5 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="circle" className="w-10 h-10" />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" className="w-full h-4" />
                <Skeleton variant="text" className="w-2/3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Inventory page skeleton
export const InventorySkeleton = ({ view = "grid" }: { view?: "grid" | "list" }) => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton variant="text" className="w-40 h-8" />
      <div className="flex gap-3">
        <Skeleton className="w-64 h-10 rounded-lg" /> {/* Search */}
        <Skeleton variant="button" className="w-24" />
        <Skeleton variant="button" className="w-24" />
      </div>
    </div>
    
    {/* Filters */}
    <div className="flex gap-3">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="w-28 h-9 rounded-lg" />
      ))}
    </div>
    
    {/* Content */}
    {view === "grid" ? (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    ) : (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    )}
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="p-6 space-y-8">
    {/* Header with avatar */}
    <div className="flex items-center gap-6">
      <Skeleton variant="circle" className="w-24 h-24" />
      <div className="space-y-3">
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="text" className="w-32 h-4" />
        <div className="flex gap-2">
          <Skeleton variant="button" className="w-24" />
          <Skeleton variant="button" className="w-24" />
        </div>
      </div>
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 text-center space-y-2">
          <Skeleton className="w-16 h-8 mx-auto rounded-md" />
          <Skeleton variant="text" className="w-20 h-3 mx-auto" />
        </div>
      ))}
    </div>
    
    {/* Achievements */}
    <div className="space-y-4">
      <Skeleton variant="text" className="w-32 h-6" />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton variant="circle" className="w-16 h-16" />
            <Skeleton variant="text" className="w-20 h-3" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Add item page skeleton
export const AddItemSkeleton = () => (
  <div className="p-6 space-y-6 max-w-4xl mx-auto">
    {/* Tabs */}
    <div className="flex gap-4 justify-center">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="w-28 h-12 rounded-lg" />
      ))}
    </div>
    
    {/* Search */}
    <Skeleton className="w-full h-14 rounded-xl" />
    
    {/* Category filters */}
    <div className="flex gap-3 justify-center">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="w-20 h-9 rounded-full" />
      ))}
    </div>
    
    {/* Results */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Detail dialog skeleton
export const DetailSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="grid md:grid-cols-2 gap-6">
      {/* Image */}
      <Skeleton className="aspect-[3/4] w-full rounded-xl" />
      
      {/* Info */}
      <div className="space-y-4">
        <Skeleton variant="text" className="w-3/4 h-8" />
        <Skeleton variant="text" className="w-1/2 h-4" />
        
        <div className="h-px bg-border my-4" />
        
        {/* Price info */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton variant="text" className="w-16 h-3" />
              <Skeleton className="w-24 h-6 rounded-md" />
            </div>
          ))}
        </div>
        
        <div className="h-px bg-border my-4" />
        
        {/* Actions */}
        <div className="flex gap-3">
          <Skeleton variant="button" className="flex-1" />
          <Skeleton variant="button" className="flex-1" />
        </div>
      </div>
    </div>
    
    {/* Price history chart */}
    <ChartSkeleton height={160} />
  </div>
);

// Analytics page skeleton
export const AnalyticsSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton variant="text" className="w-40 h-8" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="w-16 h-9 rounded-lg" />
        ))}
      </div>
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid lg:grid-cols-2 gap-6">
      <ChartSkeleton height={280} />
      <ChartSkeleton height={280} />
    </div>
    
    {/* Top cards table */}
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <Skeleton variant="text" className="w-32 h-5" />
      </div>
      {[...Array(5)].map((_, i) => (
        <TableRowSkeleton key={i} columns={6} />
      ))}
    </div>
  </div>
);

export default Skeleton;
