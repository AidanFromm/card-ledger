import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Size dimensions (5:7 aspect ratio)
const SIZE_DIMENSIONS = {
  xs: { width: 40, height: 56 },
  sm: { width: 60, height: 84 },
  md: { width: 80, height: 112 },
  lg: { width: 120, height: 168 },
  xl: { width: 160, height: 224 },
  '2xl': { width: 200, height: 280 },
  full: { width: 300, height: 420 },
} as const;

// Grading company colors
const GRADING_COLORS = {
  PSA: {
    frame: '#E31837', // PSA Red
    badge: '#E31837',
    text: '#FFFFFF',
  },
  CGC: {
    frame: '#1A1A1A', // CGC Black
    badge: '#1A1A1A',
    text: '#FFFFFF',
  },
  BGS: {
    frame: '#C5A028', // BGS Gold
    badge: '#1A1A1A',
    text: '#C5A028',
  },
  SGC: {
    frame: '#00A3A3', // SGC Teal
    badge: '#00A3A3',
    text: '#FFFFFF',
  },
} as const;

// Condition badge colors
const CONDITION_COLORS = {
  mint: { bg: 'bg-green-500', text: 'text-white', label: 'MT' },
  nm: { bg: 'bg-green-500', text: 'text-white', label: 'NM' },
  lp: { bg: 'bg-yellow-500', text: 'text-black', label: 'LP' },
  mp: { bg: 'bg-orange-500', text: 'text-white', label: 'MP' },
  hp: { bg: 'bg-red-500', text: 'text-white', label: 'HP' },
  damaged: { bg: 'bg-red-700', text: 'text-white', label: 'D' },
} as const;

export interface CardImageProps {
  src: string;
  alt: string;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  graded?: {
    company: 'PSA' | 'CGC' | 'BGS' | 'SGC';
    grade: number;
  };
  condition?: 'mint' | 'nm' | 'lp' | 'mp' | 'hp' | 'damaged';
  owned?: boolean;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
  showPrice?: number;
  priceChange?: number;
  className?: string;
  showMissingText?: boolean;
}

export function CardImage({
  src,
  alt,
  size,
  graded,
  condition,
  owned = true,
  loading = 'lazy',
  onClick,
  showPrice,
  priceChange,
  className,
  showMissingText = false,
}: CardImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dimensions = SIZE_DIMENSIONS[size];

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading slightly before in view
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  // Calculate slab dimensions (slightly larger to wrap the card)
  const slabPadding = graded ? Math.max(4, dimensions.width * 0.08) : 0;
  const slabTopPadding = graded ? Math.max(16, dimensions.height * 0.12) : 0;
  const slabWidth = dimensions.width + slabPadding * 2;
  const slabHeight = dimensions.height + slabTopPadding + slabPadding;

  const gradingColors = graded ? GRADING_COLORS[graded.company] : null;
  const conditionStyle = condition ? CONDITION_COLORS[condition] : null;

  // Format price display
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}k`;
    }
    return `$${price.toFixed(2)}`;
  };

  // Format price change
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    if (Math.abs(change) >= 1000) {
      return `${sign}$${(change / 1000).toFixed(1)}k`;
    }
    return `${sign}$${change.toFixed(2)}`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-block',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={{
        width: graded ? slabWidth : dimensions.width,
        height: graded ? slabHeight : dimensions.height,
      }}
    >
      {/* Graded Slab Frame */}
      {graded && gradingColors && (
        <div
          className="absolute inset-0 rounded-lg shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${gradingColors.frame} 0%, ${gradingColors.frame}dd 100%)`,
            border: `2px solid ${gradingColors.frame}`,
          }}
        >
          {/* Slab Top Label */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-1.5"
            style={{ height: slabTopPadding - 2 }}
          >
            {/* Company Badge */}
            <div
              className="text-[8px] font-bold tracking-wider uppercase px-1 py-0.5 rounded"
              style={{
                backgroundColor: gradingColors.badge,
                color: gradingColors.text,
                fontSize: Math.max(6, dimensions.width * 0.08),
              }}
            >
              {graded.company}
            </div>
            {/* Grade Number */}
            <div
              className="font-bold"
              style={{
                color: gradingColors.text,
                fontSize: Math.max(10, dimensions.width * 0.14),
              }}
            >
              {graded.grade}
            </div>
          </div>
        </div>
      )}

      {/* Card Container */}
      <div
        className={cn(
          'relative overflow-hidden rounded-md transition-all duration-300',
          onClick && 'hover:scale-105 hover:shadow-xl',
          !owned && 'grayscale opacity-50'
        )}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          marginTop: graded ? slabTopPadding : 0,
          marginLeft: graded ? slabPadding : 0,
        }}
      >
        {/* Skeleton Placeholder */}
        {(!isInView || !isLoaded) && !hasError && (
          <div
            className="absolute inset-0 bg-muted/50 overflow-hidden rounded-md"
            style={{
              width: dimensions.width,
              height: dimensions.height,
            }}
          >
            {/* Shimmer Effect */}
            <div
              className="absolute inset-0 animate-shimmer"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
            />
            {/* Card shape hint */}
            <div className="absolute inset-2 rounded bg-muted/30" />
          </div>
        )}

        {/* Actual Image */}
        {isInView && (
          <img
            ref={imgRef}
            src={hasError ? '/card-placeholder.svg' : src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover rounded-md transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              width: dimensions.width,
              height: dimensions.height,
            }}
            draggable={false}
          />
        )}

        {/* Error Fallback Display */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-md">
            <div className="text-center text-muted-foreground">
              <svg
                className="mx-auto h-6 w-6 mb-1 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Missing Overlay */}
        {!owned && showMissingText && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
            <span
              className="text-white font-bold uppercase tracking-wider"
              style={{ fontSize: Math.max(8, dimensions.width * 0.1) }}
            >
              Missing
            </span>
          </div>
        )}

        {/* Condition Badge */}
        {condition && conditionStyle && owned && (
          <div
            className={cn(
              'absolute top-1 right-1 rounded-full font-bold flex items-center justify-center',
              conditionStyle.bg,
              conditionStyle.text
            )}
            style={{
              width: Math.max(16, dimensions.width * 0.22),
              height: Math.max(16, dimensions.width * 0.22),
              fontSize: Math.max(7, dimensions.width * 0.1),
            }}
          >
            {conditionStyle.label}
          </div>
        )}

        {/* Price Overlay */}
        {showPrice !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 rounded-b-md">
            <div className="flex items-center justify-between">
              <span
                className="text-white font-bold"
                style={{ fontSize: Math.max(8, dimensions.width * 0.1) }}
              >
                {formatPrice(showPrice)}
              </span>
              {priceChange !== undefined && (
                <span
                  className={cn(
                    'font-semibold',
                    priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                  )}
                  style={{ fontSize: Math.max(7, dimensions.width * 0.09) }}
                >
                  {formatChange(priceChange)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export size dimensions for external use
export { SIZE_DIMENSIONS, GRADING_COLORS, CONDITION_COLORS };

export default CardImage;
