import { ReactNode, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CardImage, CardImageProps, SIZE_DIMENSIONS } from './CardImage';

interface CardImageGridProps {
  children?: ReactNode;
  items?: Array<CardImageProps & { id: string }>;
  size?: CardImageProps['size'];
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
  onItemClick?: (id: string) => void;
}

// Gap size mappings
const GAP_SIZES = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
} as const;

// Default columns based on card size
const DEFAULT_COLUMNS: Record<CardImageProps['size'], { mobile: number; tablet: number; desktop: number }> = {
  xs: { mobile: 6, tablet: 8, desktop: 12 },
  sm: { mobile: 4, tablet: 6, desktop: 10 },
  md: { mobile: 3, tablet: 4, desktop: 6 },
  lg: { mobile: 2, tablet: 3, desktop: 5 },
  xl: { mobile: 2, tablet: 3, desktop: 4 },
  '2xl': { mobile: 1, tablet: 2, desktop: 3 },
  full: { mobile: 1, tablet: 1, desktop: 2 },
};

export function CardImageGrid({
  children,
  items,
  size = 'md',
  gap = 'md',
  columns,
  className,
  onItemClick,
}: CardImageGridProps) {
  // Merge default columns with custom columns
  const gridColumns = useMemo(() => ({
    mobile: columns?.mobile ?? DEFAULT_COLUMNS[size].mobile,
    tablet: columns?.tablet ?? DEFAULT_COLUMNS[size].tablet,
    desktop: columns?.desktop ?? DEFAULT_COLUMNS[size].desktop,
  }), [columns, size]);

  // Generate responsive grid classes
  const gridClasses = cn(
    'grid',
    GAP_SIZES[gap],
    className
  );

  // Calculate grid template columns CSS
  const gridStyle = {
    gridTemplateColumns: `repeat(var(--card-grid-cols), minmax(0, 1fr))`,
    '--card-grid-cols-mobile': gridColumns.mobile,
    '--card-grid-cols-tablet': gridColumns.tablet,
    '--card-grid-cols-desktop': gridColumns.desktop,
  } as React.CSSProperties;

  // If items prop is provided, render CardImage components
  if (items) {
    return (
      <div className={gridClasses} style={gridStyle}>
        {items.map((item) => (
          <div key={item.id} className="flex justify-center">
            <CardImage
              {...item}
              size={size}
              onClick={() => {
                item.onClick?.();
                onItemClick?.(item.id);
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // Otherwise render children
  return (
    <div className={gridClasses} style={gridStyle}>
      {children}
    </div>
  );
}

// Responsive grid wrapper with built-in breakpoints
export function ResponsiveCardGrid({
  children,
  className,
  gap = 'md',
}: {
  children: ReactNode;
  className?: string;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}) {
  return (
    <div
      className={cn(
        'card-image-grid',
        GAP_SIZES[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// Grid item wrapper for consistent sizing
export function CardGridItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex justify-center items-start', className)}>
      {children}
    </div>
  );
}

export default CardImageGrid;
