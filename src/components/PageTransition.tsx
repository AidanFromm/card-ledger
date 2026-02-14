import { motion, AnimatePresence, Variants } from "framer-motion";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: "fade" | "slide" | "scale" | "slideUp" | "slideDown";
}

// Premium page transition variants
const transitionVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
    },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30,
      }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
    },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 25,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
      transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }
    },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30,
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
    },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30,
      }
    },
    exit: { 
      opacity: 0, 
      y: 10,
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
    },
  },
};

export const PageTransition = ({ 
  children, 
  className = "",
  variant = "slideUp"
}: PageTransitionProps) => {
  return (
    <motion.div
      variants={transitionVariants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated page wrapper with route-aware transitions
interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedPage = ({ children, className = "" }: AnimatedPageProps) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }
        }}
        exit={{ 
          opacity: 0, 
          y: -8,
          transition: {
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1],
          }
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Stagger children animation for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

// Fast stagger for grids
export const fastStaggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export const fastStaggerItem: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

// Pull to refresh spring animation
export const pullToRefreshSpring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

// Card hover animation (Robinhood-style)
export const cardHover = {
  scale: 1.02,
  y: -4,
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 25,
  },
};

export const cardTap = {
  scale: 0.98,
  transition: {
    duration: 0.1,
  },
};

// Premium button animations
export const buttonHover = {
  scale: 1.02,
  y: -1,
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 30,
  },
};

export const buttonTap = {
  scale: 0.97,
  transition: {
    type: "spring",
    stiffness: 600,
    damping: 35,
  },
};

// Modal/Dialog transitions
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 }
  },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { duration: 0.15 }
  },
};

// Bottom sheet transitions
export const bottomSheet: Variants = {
  initial: { y: "100%" },
  animate: { 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    }
  },
  exit: { 
    y: "100%",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
    }
  },
};

// Toast/notification transitions
export const toastVariants: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: { duration: 0.15 }
  },
};

// Success checkmark animation
export const checkmarkVariants: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1,
    transition: {
      pathLength: { duration: 0.3, ease: "easeOut" },
      opacity: { duration: 0.1 }
    }
  },
};

// Ripple effect for buttons
export const rippleVariants: Variants = {
  initial: { scale: 0, opacity: 0.5 },
  animate: { 
    scale: 4, 
    opacity: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
};

export default PageTransition;
