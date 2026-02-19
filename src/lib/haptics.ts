/**
 * Haptic Feedback Utilities
 * Provides vibration feedback on supported devices
 */

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticFeedbackType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [40],
  success: [10, 50, 10],
  warning: [20, 50, 20],
  error: [30, 50, 30, 50, 30],
};

/**
 * Trigger haptic feedback if available
 */
export function triggerHaptic(type: HapticFeedbackType = 'medium'): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(HAPTIC_PATTERNS[type]);
    }
  } catch (e) {
    // Silently fail - haptics are optional
  }
}

/**
 * Trigger haptic on swipe threshold
 */
export function triggerSwipeHaptic(): void {
  triggerHaptic('medium');
}

/**
 * Trigger haptic on successful action
 */
export function triggerSuccessHaptic(): void {
  triggerHaptic('success');
}

/**
 * Trigger haptic on destructive action
 */
export function triggerDestructiveHaptic(): void {
  triggerHaptic('error');
}
