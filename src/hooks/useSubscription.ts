import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionState {
  isPro: boolean;
  plan: "free" | "trial" | "personal" | "business";
  trialDaysLeft: number | null;
  scanCount: number;
  scanLimit: number;
  loading: boolean;
}

const FREE_SCAN_LIMIT = 5;
const TRIAL_SCAN_LIMIT = 25;
const PRO_SCAN_LIMIT = Infinity;

export const useSubscription = () => {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    plan: "trial",
    trialDaysLeft: 7,
    scanCount: 0,
    scanLimit: TRIAL_SCAN_LIMIT,
    loading: true,
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

      // Get scan count from localStorage (or could be from Supabase)
      const scanKey = `ai_scan_count_${user.id}`;
      const scanResetKey = `ai_scan_reset_${user.id}`;
      
      // Reset scan count monthly
      const lastReset = localStorage.getItem(scanResetKey);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
      
      if (lastReset !== currentMonth) {
        localStorage.setItem(scanResetKey, currentMonth);
        localStorage.setItem(scanKey, "0");
      }
      
      const scanCount = parseInt(localStorage.getItem(scanKey) || "0");

      // Check subscription status (simplified - would normally check Supabase or Stripe)
      const createdAt = new Date(user.created_at);
      const trialEnd = new Date(createdAt);
      trialEnd.setDate(trialEnd.getDate() + 7);
      
      const isTrialActive = now < trialEnd;
      const trialDaysLeft = isTrialActive 
        ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // In a real app, check subscription table
      // For now, simulate trial status
      const plan = isTrialActive ? "trial" : "free";
      const isPro = plan === "personal" || plan === "business";
      
      setState({
        isPro,
        plan,
        trialDaysLeft: isTrialActive ? trialDaysLeft : null,
        scanCount,
        scanLimit: isPro ? PRO_SCAN_LIMIT : isTrialActive ? TRIAL_SCAN_LIMIT : FREE_SCAN_LIMIT,
        loading: false,
      });
    } catch (error) {
      console.error("Error loading subscription:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
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
    return Math.max(0, state.scanLimit - state.scanCount);
  };

  return {
    ...state,
    incrementScanCount,
    canScan,
    scansRemaining,
    refresh: loadSubscription,
  };
};
