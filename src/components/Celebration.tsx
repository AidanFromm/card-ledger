import { useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// Celebration threshold - cards worth this much or more trigger confetti
const VALUE_THRESHOLD = 100;

// Portfolio milestones that trigger celebration
const PORTFOLIO_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000];

interface CelebrationOptions {
  type?: 'card-added' | 'milestone' | 'sale';
  value?: number;
}

// Premium confetti configuration - tasteful, not circus-level
const fireConfetti = (intensity: 'subtle' | 'medium' | 'big' = 'subtle') => {
  const configs = {
    subtle: {
      particleCount: 50,
      spread: 60,
      startVelocity: 25,
      decay: 0.94,
      scalar: 0.8,
    },
    medium: {
      particleCount: 80,
      spread: 80,
      startVelocity: 35,
      decay: 0.92,
      scalar: 1,
    },
    big: {
      particleCount: 120,
      spread: 100,
      startVelocity: 45,
      decay: 0.9,
      scalar: 1.2,
    },
  };

  const config = configs[intensity];

  // Primary burst - brand blue
  confetti({
    ...config,
    origin: { x: 0.5, y: 0.7 },
    colors: ['#0074fb', '#3d9bff', '#0055cc'],
    shapes: ['circle', 'square'],
    ticks: 200,
  });

  // Secondary burst with slight delay - gold accents
  setTimeout(() => {
    confetti({
      ...config,
      particleCount: Math.floor(config.particleCount * 0.6),
      origin: { x: 0.3, y: 0.8 },
      colors: ['#ffd700', '#ffb700', '#fff'],
      shapes: ['circle'],
      ticks: 150,
    });
    confetti({
      ...config,
      particleCount: Math.floor(config.particleCount * 0.6),
      origin: { x: 0.7, y: 0.8 },
      colors: ['#ffd700', '#ffb700', '#fff'],
      shapes: ['circle'],
      ticks: 150,
    });
  }, 100);
};

// Hook to trigger celebrations
export const useCelebration = () => {
  const lastMilestoneRef = useRef<number>(0);

  const celebrate = useCallback((options: CelebrationOptions = {}) => {
    const { type = 'card-added', value = 0 } = options;

    switch (type) {
      case 'card-added':
        if (value >= VALUE_THRESHOLD) {
          // Scale intensity based on value
          if (value >= 1000) {
            fireConfetti('big');
          } else if (value >= 500) {
            fireConfetti('medium');
          } else {
            fireConfetti('subtle');
          }
        }
        break;

      case 'milestone':
        fireConfetti('big');
        break;

      case 'sale':
        if (value > 0) {
          fireConfetti('medium');
        }
        break;
    }
  }, []);

  const checkMilestone = useCallback((portfolioValue: number) => {
    // Find the highest milestone achieved
    const achievedMilestone = [...PORTFOLIO_MILESTONES]
      .reverse()
      .find(m => portfolioValue >= m);

    if (achievedMilestone && achievedMilestone > lastMilestoneRef.current) {
      lastMilestoneRef.current = achievedMilestone;
      celebrate({ type: 'milestone' });
      return achievedMilestone;
    }

    return null;
  }, [celebrate]);

  return { celebrate, checkMilestone, VALUE_THRESHOLD };
};

// Standalone function for one-off celebrations
export const triggerCelebration = (intensity: 'subtle' | 'medium' | 'big' = 'subtle') => {
  fireConfetti(intensity);
};

export default useCelebration;
