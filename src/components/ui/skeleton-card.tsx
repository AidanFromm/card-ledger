import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className }: SkeletonCardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card overflow-hidden animate-pulse",
        className
      )}
    >
      {/* Image placeholder */}
      <div className="aspect-[3/4] bg-muted/30" />

      {/* Content placeholder */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <div className="h-3 bg-muted/40 rounded w-3/4" />
        {/* Subtitle */}
        <div className="h-2 bg-muted/30 rounded w-1/2" />

        {/* Badges */}
        <div className="flex gap-1 pt-1">
          <div className="h-4 w-12 bg-muted/30 rounded" />
        </div>

        {/* Price rows */}
        <div className="space-y-1 pt-2 border-t border-border/30">
          <div className="flex justify-between">
            <div className="h-2 w-10 bg-muted/30 rounded" />
            <div className="h-2 w-14 bg-muted/40 rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-2 w-12 bg-muted/30 rounded" />
            <div className="h-2 w-12 bg-muted/40 rounded" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-2 border-t border-border/30">
          <div className="h-2 w-8 bg-muted/30 rounded" />
          <div className="h-3 w-10 bg-muted/40 rounded" />
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
        "rounded-xl border border-border/40 bg-card p-4 animate-pulse",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted/40" />
        <div className="flex-1 space-y-2">
          <div className="h-2 bg-muted/30 rounded w-1/3" />
          <div className="h-4 bg-muted/40 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonChart = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card p-4 animate-pulse",
        className
      )}
    >
      <div className="h-4 bg-muted/30 rounded w-1/4 mb-4" />
      <div className="h-48 bg-muted/20 rounded flex items-end justify-around px-4 pb-4">
        {[40, 65, 45, 80, 55, 70, 60].map((height, i) => (
          <div
            key={i}
            className="w-8 bg-muted/40 rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
};
