import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "free" | "trial" | "pro" | "lifetime";

export interface SubscriptionState {
  isPro: boolean;
  plan: PlanType;
  trialDaysLeft: number | null;
  scanCount: number;
  scanLimit: number;
  cardCount: number;
  cardLimit: number;
  loading: boolean;
  // Feature flags
  canExportCSV: boolean;
  canViewHistory: boolean;
  canSetAlerts: boolean;
  canUseAdvancedAnalytics: boolean;
}

// Limits per tier (based on competitor research)
const LIMITS: Record<PlanType, {
  scans: number;
  cards: number;
  exportCSV: boolean;
  viewHistory: boolean;
  setAlerts: boolean;
  advancedAnalytics: boolean;
}> = {
  free: {
    scans: 5,        // 5 scans per day
    cards: 100,      // 100 cards max
    exportCSV: false,
    viewHistory: false,  // Only current prices
    setAlerts: false,
    advancedAnalytics: false,
  },
  trial: {
    scans: 25,       // 25 scans per day during trial
    cards: 500,      // 500 cards during trial
    exportCSV: true,
    viewHistory: true,
    setAlerts: true,
    advancedAnalytics: true,
  },
  pro: {
    scans: Infinity,
    cards: Infinity,
    exportCSV: true,
    viewHistory: true,
    setAlerts: true,
    advancedAnalytics: true,
  },
  lifetime: {
    scans: Infinity,
    cards: Infinity,
    exportCSV: true,
    viewHistory: true,
    setAlerts: true,
    advancedAnalytics: true,
  },
};

// Pricing info for UI
export const PRICING = {
  pro: {
    monthly: 7.99,
    annual: 59.99,      // ~$5/mo
    annualSavings: 40,  // 40% savings
  },
  lifetime: {
    price: 149,
  },
};

export const useSubscription = () => {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    plan: "free",
    trialDaysLeft: null,
    scanCount: 0,
    scanLimit: LIMITS.free.scans,
    cardCount: 0,
    cardLimit: LIMITS.free.cards,
    loading: true,
    canExportCSV: LIMITS.free.exportCSV,
    canViewHistory: LIMITS.free.viewHistory,
    canSetAlerts: LIMITS.free.setAlerts,
    canUseAdvancedAnalytics: LIMITS.free.advancedAnalytics,
  });

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      // Get scan count from localStorage (resets daily)
      const scanKey = `ai_scan_count_${user.id}`;
      const scanResetKey = `ai_scan_reset_${user.id}`;
      
      // Reset scan count daily
      const lastReset = localStorage.getItem(scanResetKey);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      if (lastReset !== today) {
        localStorage.setItem(scanResetKey, today);
        localStorage.setItem(scanKey, "0");
      }
      
      const scanCount = parseInt(localStorage.getItem(scanKey) || "0");

      // Check trial status (7 days from account creation)
      const createdAt = new Date(user.created_at);
      const trialEnd = new Date(createdAt);
      trialEnd.setDate(trialEnd.getDate() + 7);
      
      const isTrialActive = now < trialEnd;
      const trialDaysLeft = isTrialActive 
        ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Check for stored subscription (would be Stripe in production)
      const storedPlan = localStorage.getItem(`subscription_plan_${user.id}`) as PlanType | null;
      
      let plan: PlanType;
      if (storedPlan === "pro" || storedPlan === "lifetime") {
        plan = storedPlan;
      } else if (isTrialActive) {
        plan = "trial";
      } else {
        plan = "free";
      }

      const limits = LIMITS[plan];
      const isPro = plan === "pro" || plan === "lifetime";
      
      setState({
        isPro,
        plan,
        trialDaysLeft: plan === "trial" ? trialDaysLeft : null,
        scanCount,
        scanLimit: limits.scans,
        cardCount: 0, // Will be updated by inventory hook
        cardLimit: limits.cards,
        loading: false,
        canExportCSV: limits.exportCSV,
        canViewHistory: limits.viewHistory,
        canSetAlerts: limits.setAlerts,
        canUseAdvancedAnalytics: limits.advancedAnalytics,
      });
    } catch (error) {
      console.error("Error loading subscription:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const updateCardCount = (count: number) => {
    setState(prev => ({ ...prev, cardCount: count }));
  };

  const incrementScanCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const scanKey = `ai_scan_count_${user.id}`;
    const newCount = state.scanCount + 1;
    localStorage.setItem(scanKey, newCount.toString());
    setState(prev => ({ ...prev, scanCount: newCount }));
  };

  const canScan = () => {
    return state.scanCount < state.scanLimit;
  };

  const scansRemaining = () => {
    if (state.scanLimit === Infinity) return Infinity;
    return Math.max(0, state.scanLimit - state.scanCount);
  };

  const canAddCards = (count: number = 1) => {
    if (state.cardLimit === Infinity) return true;
    return state.cardCount + count <= state.cardLimit;
  };

  const cardsRemaining = () => {
    if (state.cardLimit === Infinity) return Infinity;
    return Math.max(0, state.cardLimit - state.cardCount);
  };

  // Simulate upgrade (in production, this would call Stripe)
  const upgradeToPro = async (annual: boolean = true) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // In production: redirect to Stripe checkout
    // For now, just simulate upgrade
    localStorage.setItem(`subscription_plan_${user.id}`, "pro");
    await loadSubscription();
    return true;
  };

  const upgradeToLifetime = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    localStorage.setItem(`subscription_plan_${user.id}`, "lifetime");
    await loadSubscription();
    return true;
  };

  return {
    ...state,
    incrementScanCount,
    canScan,
    scansRemaining,
    canAddCards,
    cardsRemaining,
    updateCardCount,
    upgradeToPro,
    upgradeToLifetime,
    refresh: loadSubscription,
    pricing: PRICING,
  };
};
