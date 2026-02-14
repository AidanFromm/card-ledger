import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getPlaceholderForItem } from '@/lib/cardNameUtils';

// Size dimensions (width classes)
const SIZE_CLASSES = {
  xs: 'w-10 h-14',    // 40x56 - thumbnail (5:7 aspect)
  sm: 'w-16 h-22',    // 64x88
  md: 'w-20 h-28',    // 80x112
  lg: 'w-28 h-40',    // 112x160
  xl: 'w-32 h-44',    // 128x176
  '2xl': 'w-40 h-56', // 160x224
  full: 'w-full h-full', // flexible
} as const;

// Rounded variants
const ROUNDED_VARIANTS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const;

// Grading company colors
const GRADING_COLORS: Record<string, { frame: string; badge: string; text: string }> = {
  psa: {
    frame: '#E31837', // PSA Red
    badge: '#E31837',
    text: '#FFFFFF',
  },
  cgc: {
    frame: '#1A1A1A', // CGC Black
    badge: '#1A1A1A',
    text: '#FFFFFF',
  },
  bgs: {
    frame: '#C5A028', // BGS Gold
    badge: '#1A1A1A',
    text: '#C5A028',
  },
  sgc: {
    frame: '#00A3A3', // SGC Teal
    badge: '#00A3A3',
    text: '#FFFFFF',
  },
  beckett: {
    frame: '#C5A028', // Same as BGS
    badge: '#1A1A1A',
    text: '#C5A028',
  },
};

// Condition badge colors
const CONDITION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  mint: { bg: 'bg-green-500', text: 'text-white', label: 'MT' },
  'near mint': { bg: 'bg-green-500', text: 'text-white', label: 'NM' },
  nm: { bg: 'bg-green-500', text: 'text-white', label: 'NM' },
  'lightly played': { bg: 'bg-yellow-500', text: 'text-black', label: 'LP' },
  lp: { bg: 'bg-yellow-500', text: 'text-black', label: 'LP' },
  'moderately played': { bg: 'bg-orange-500', text: 'text-white', label: 'MP' },
  mp: { bg: 'bg-orange-500', text: 'text-white', label: 'MP' },
  'heavily played': { bg: 'bg-red-500', text: 'text-white', label: 'HP' },
  hp: { bg: 'bg-red-500', text: 'text-white', label: 'HP' },
  damaged: { bg: 'bg-red-700', text: 'text-white', label: 'D' },
};

export interface CardImageProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  
  // Grading - accepts either object or separate props
  graded?: boolean | { company: string; grade: number | string };
  gradingCompany?: string;
  grade?: string | number | null;
  
  // Styling
  rounded?: keyof typeof ROUNDED_VARIANTS;
  border?: boolean;
  borderColor?: string;
  
  // Condition
  condition?: string;
  owned?: boolean;
  
  // Loading
  loading?: 'lazy' | 'eager';
  
  // Price display
  showPrice?: boolean;
  price?: number | null;
  priceChange?: number;
  
  // Container/class customization
  containerClassName?: string;
  className?: string;
  
  // Behavior
  onClick?: () => void;
  hoverScale?: boolean;
  showMissingText?: boolean;
  placeholder?: 'card' | 'sealed' | 'default';
}

export function CardImage({
  src,
  alt,
  size = 'md',
  graded,
  gradingCompany,
  grade,
  rounded = 'lg',
  border = false,
  borderColor = 'border-border',
  condition,
  owned = true,
  loading = 'lazy',
  showPrice = false,
  price,
  priceChange,
  containerClassName,
  className,
  onClick,
  hoverScale = true,
  showMissingText = false,
  placeholder = 'card',
}: CardImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize grading props
  const resolvedGradingCompany = typeof graded === 'object' 
    ? graded.company 
    : gradingCompany;
  const resolvedGrade = typeof graded === 'object' 
    ? graded.grade 
    : grade;
  const isGraded = !!(
    (typeof graded === 'boolean' && graded) ||
    (typeof graded === 'object' && graded) ||
    (resolvedGradingCompany && resolvedGradingCompany.toLowerCase() !== 'raw' && resolvedGrade)
  );

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

  // Get placeholder image
  const getPlaceholder = () => {
    try {
      return getPlaceholderForItem({
        category: placeholder === 'sealed' ? 'sealed' : 'raw',
        grading_company: 'raw',
      });
    } catch {
      return '/placeholders/pokemon-card.svg';
    }
  };

  // Get grading colors
  const gradingColors = resolvedGradingCompany 
    ? GRADING_COLORS[resolvedGradingCompany.toLowerCase()] 
    : null;

  // Get condition style
  const conditionStyle = condition 
    ? CONDITION_COLORS[condition.toLowerCase()] 
    : null;

  // Format price display
  const formatPrice = (p: number) => {
    if (p >= 1000) {
      return `$${(p / 1000).toFixed(1)}k`;
    }
    return `$${p.toFixed(2)}`;
  };

  // Format price change
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    if (Math.abs(change) >= 1000) {
      return `${sign}$${(change / 1000).toFixed(1)}k`;
    }
    return `${sign}$${change.toFixed(2)}`;
  };

  const sizeClass = SIZE_CLASSES[size];
  const roundedClass = ROUNDED_VARIANTS[rounded];

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-block overflow-hidden',
        size !== 'full' && sizeClass,
        roundedClass,
        border && `border ${borderColor}`,
        onClick && 'cursor-pointer',
        onClick && hoverScale && 'transition-transform hover:scale-105',
        !owned && 'grayscale opacity-50',
        containerClassName
      )}
      onClick={onClick}
    >
      {/* Skeleton Placeholder */}
      {(!isInView || !isLoaded) && !hasError && (
        <div className="absolute inset-0 bg-muted/50 overflow-hidden">
          {/* Shimmer Effect */}
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          ref={imgRef}
          src={hasError || !src ? getPlaceholder() : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-contain transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          draggable={false}
        />
      )}

      {/* Missing Overlay */}
      {!owned && showMissingText && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="text-white font-bold uppercase tracking-wider text-xs">
            Missing
          </span>
        </div>
      )}

      {/* Grading Badge - shown if graded */}
      {isGraded && resolvedGradingCompany && resolvedGrade && (
        <div
          className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm"
          style={{
            backgroundColor: gradingColors?.badge || '#333',
            color: gradingColors?.text || '#fff',
          }}
        >
          {resolvedGradingCompany.toUpperCase()} {resolvedGrade}
        </div>
      )}

      {/* Condition Badge */}
      {condition && conditionStyle && owned && !isGraded && (
        <div
          className={cn(
            'absolute top-1 right-1 px-1.5 py-0.5 rounded-full font-bold text-[9px]',
            conditionStyle.bg,
            conditionStyle.text
          )}
        >
          {conditionStyle.label}
        </div>
      )}

      {/* Price Overlay */}
      {showPrice && price !== undefined && price !== null && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-xs">
              {formatPrice(price)}
            </span>
            {priceChange !== undefined && (
              <span
                className={cn(
                  'font-semibold text-[10px]',
                  priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                )}
              >
                {formatChange(priceChange)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export for external use
export { SIZE_CLASSES, GRADING_COLORS, CONDITION_COLORS };

export default CardImage;
