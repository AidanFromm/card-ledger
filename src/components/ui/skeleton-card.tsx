import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

const ShimmerBlock = ({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden bg-muted/30 rounded", className)}>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
  </div>
);

export const SkeletonCard = ({ className }: SkeletonCardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/30 bg-card/50 overflow-hidden",
        className
      )}
    >
      {/* Image placeholder with shimmer */}
      <div className="aspect-[3/4] relative overflow-hidden bg-muted/20">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/8 to-transparent animate-shimmer" />
      </div>

      {/* Content placeholder */}
      <div className="p-3 space-y-2.5">
        <ShimmerBlock className="h-3.5 w-3/4 rounded-md" />
        <ShimmerBlock className="h-2.5 w-1/2 rounded-md" />

        <div className="flex gap-1.5 pt-1">
          <ShimmerBlock className="h-5 w-14 rounded-full" />
        </div>

        <div className="space-y-1.5 pt-2 border-t border-border/20">
          <div className="flex justify-between">
            <ShimmerBlock className="h-2.5 w-10" />
            <ShimmerBlock className="h-2.5 w-16" />
          </div>
          <div className="flex justify-between">
            <ShimmerBlock className="h-2.5 w-12" />
            <ShimmerBlock className="h-2.5 w-14" />
          </div>
        </div>

        <div className="flex justify-between pt-2 border-t border-border/20">
          <ShimmerBlock className="h-2.5 w-8" />
          <ShimmerBlock className="h-3.5 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export const SkeletonDashboardCard = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/30 bg-card/50 p-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <ShimmerBlock className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-2.5 w-1/3 rounded-md" />
          <ShimmerBlock className="h-4 w-1/2 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonChart = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/30 bg-card/50 p-4",
        className
      )}
    >
      <ShimmerBlock className="h-4 w-1/4 mb-4 rounded-md" />
      <div className="h-48 relative overflow-hidden bg-muted/15 rounded-xl flex items-end justify-around px-4 pb-4">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        {[40, 65, 45, 80, 55, 70, 60].map((height, i) => (
          <div
            key={i}
            className="w-8 bg-muted/25 rounded-t relative overflow-hidden"
            style={{ height: `${height}%` }}
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
          </div>
        ))}
      </div>
    </div>
  );
};
