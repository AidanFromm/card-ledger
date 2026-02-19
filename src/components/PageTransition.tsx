import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger children animation for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Pull to refresh spring animation
export const pullToRefreshSpring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// Card hover animation
export const cardHover = {
  scale: 1.02,
  y: -4,
  transition: {
    duration: 0.2,
    ease: [0.25, 0.1, 0.25, 1],
  },
};

// Premium tap/press — scale down slightly
export const cardTap = {
  scale: 0.97,
  transition: {
    duration: 0.1,
  },
};

// Spring pop for adding items
export const springPop = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  },
};

// Success celebration scale
export const celebrationPop = {
  initial: { scale: 0 },
  animate: {
    scale: [0, 1.15, 1],
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};
