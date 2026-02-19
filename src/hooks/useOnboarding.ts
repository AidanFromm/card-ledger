import { useState, useEffect, useCallback } from "react";

const ONBOARDING_KEY = "cardledger_onboarding_complete";
const ONBOARDING_STEP_KEY = "cardledger_onboarding_step";

export interface OnboardingState {
  isComplete: boolean;
  currentStep: number;
  shouldShow: boolean;
}

export function useOnboarding(inventoryCount: number) {
  const [state, setState] = useState<OnboardingState>({
    isComplete: true, // Default to complete until we check
    currentStep: 0,
    shouldShow: false,
  });

  // Check localStorage on mount
  useEffect(() => {
    try {
      const isComplete = localStorage.getItem(ONBOARDING_KEY) === "true";
      const savedStep = parseInt(localStorage.getItem(ONBOARDING_STEP_KEY) || "0", 10);

      // Show onboarding if:
      // 1. User hasn't completed it AND
      // 2. User has no inventory items (first-time user)
      const shouldShow = !isComplete && inventoryCount === 0;

      setState({
        isComplete,
        currentStep: savedStep,
        shouldShow,
      });
    } catch (error) {
      console.error("Failed to load onboarding state:", error);
    }
  }, [inventoryCount]);

  // Save step progress
  const setStep = useCallback((step: number) => {
    try {
      localStorage.setItem(ONBOARDING_STEP_KEY, step.toString());
      setState((prev) => ({ ...prev, currentStep: step }));
    } catch (error) {
      console.error("Failed to save onboarding step:", error);
    }
  }, []);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      setState({
        isComplete: true,
        currentStep: 0,
        shouldShow: false,
      });
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  }, []);

  // Skip onboarding (same as complete)
  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Reset onboarding (for "Show onboarding" in settings)
  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
      localStorage.setItem(ONBOARDING_STEP_KEY, "0");
      setState({
        isComplete: false,
        currentStep: 0,
        shouldShow: true,
      });
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
    }
  }, []);

  // Manually show onboarding (for replay)
  const showOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, shouldShow: true, currentStep: 0 }));
  }, []);

  // Hide onboarding without completing
  const hideOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, shouldShow: false }));
  }, []);

  return {
    ...state,
    setStep,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    showOnboarding,
    hideOnboarding,
  };
}
