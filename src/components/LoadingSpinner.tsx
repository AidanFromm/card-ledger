import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeConfig = {
  sm: { spinner: "w-4 h-4", border: "border-2" },
  md: { spinner: "w-6 h-6", border: "border-2" },
  lg: { spinner: "w-8 h-8", border: "border-3" },
  xl: { spinner: "w-12 h-12", border: "border-3" },
};

// Simple spinner
export const LoadingSpinner = ({ 
  size = "md", 
  className = "",
  text 
}: LoadingSpinnerProps) => {
  const config = sizeConfig[size];
  
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div 
        className={`
          ${config.spinner} ${config.border}
          border-primary border-t-transparent 
          rounded-full animate-spin
        `}
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

// Premium animated dots loader
export const DotsLoader = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Pulse ring loader
export const PulseLoader = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        className="absolute w-8 h-8 rounded-full border-2 border-primary"
        animate={{
          scale: [1, 1.5, 1.5],
          opacity: [0.5, 0, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      <motion.div
        className="absolute w-8 h-8 rounded-full border-2 border-primary"
        animate={{
          scale: [1, 1.5, 1.5],
          opacity: [0.5, 0, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0.5,
          ease: "easeOut",
        }}
      />
      <div className="w-3 h-3 rounded-full bg-primary" />
    </div>
  );
};

// Full page loader
interface PageLoaderProps {
  message?: string;
}

export const PageLoader = ({ message = "Loading..." }: PageLoaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center bg-background gap-6"
    >
      {/* Animated logo/icon */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        {/* Glow */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-2xl bg-primary blur-xl"
        />
        
        {/* Icon container */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-600 flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-3xl">💎</span>
        </div>
      </motion.div>
      
      {/* Loading text */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <DotsLoader />
      </div>
    </motion.div>
  );
};

// Inline skeleton loading state for text
interface TextSkeletonProps {
  width?: string;
  className?: string;
}

export const TextSkeleton = ({ 
  width = "w-24", 
  className = "" 
}: TextSkeletonProps) => {
  return (
    <div 
      className={`
        h-4 ${width} rounded bg-muted/50 
        animate-pulse ${className}
      `}
    />
  );
};

// Card loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  blur?: boolean;
}

export const LoadingOverlay = ({ 
  isLoading, 
  children, 
  blur = true 
}: LoadingOverlayProps) => {
  return (
    <div className="relative">
      {children}
      
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`
            absolute inset-0 flex items-center justify-center
            bg-background/80 ${blur ? 'backdrop-blur-sm' : ''}
            z-10 rounded-inherit
          `}
        >
          <LoadingSpinner size="lg" />
        </motion.div>
      )}
    </div>
  );
};

// Progress bar loader
interface ProgressLoaderProps {
  progress: number; // 0 to 100
  className?: string;
  showPercent?: boolean;
}

export const ProgressLoader = ({ 
  progress, 
  className = "",
  showPercent = true
}: ProgressLoaderProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-navy-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      {showPercent && (
        <p className="text-xs text-muted-foreground text-center font-mono">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
