/**
 * Subscription Hook
 * 
 * Provides subscription state and feature gating throughout the app.
 * Caches subscription data for 5 minutes to avoid excessive DB reads.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getUserSubscription, 
  hasFeatureAccess, 
  isWithinCardLimit, 
  isWithinScanLimit,
  createCheckoutSession,
  createPortalSession,
  PLANS,
  type UserSubscription, 
  type PlanId,
  type SubscriptionPlan
} from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CACHE_KEY = 'cl_subscription_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedSub {
  data: UserSubscription;
  timestamp: number;
}

// Legacy PRICING export for Paywall component compatibility
export const PRICING = {
  pro: {
    monthly: 7.99,
    annual: 59.99,
    annualSavings: 37,
  },
  lifetime: 149,
  free: {
    maxCards: 100,
    maxScansPerDay: 5,
  },
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription>({ plan: 'free', status: 'none' });
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { toast } = useToast();

  const fetchSubscription = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedSub = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_TTL) {
            setSubscription(parsed.data);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }

    try {
      const sub = await getUserSubscription();
      setSubscription(sub);
      
      // Cache the result
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: sub,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription(true);
    });

    return () => authSub.unsubscribe();
  }, [fetchSubscription]);

  // Feature checks
  const canUseFeature = useCallback((feature: keyof SubscriptionPlan['limits']): boolean => {
    return hasFeatureAccess(subscription, feature);
  }, [subscription]);

  const canAddCard = useCallback((currentCount: number): boolean => {
    return isWithinCardLimit(subscription, currentCount);
  }, [subscription]);

  const canScan = useCallback((todayScans: number): boolean => {
    return isWithinScanLimit(subscription, todayScans);
  }, [subscription]);

  const isPro = subscription.status === 'active' && subscription.plan !== 'free';
  const isLifetime = subscription.plan === 'lifetime' && subscription.status === 'active';
  const isFree = subscription.plan === 'free' || subscription.status === 'none';

  // Checkout
  const checkout = useCallback(async (planId: PlanId) => {
    setCheckoutLoading(true);
    try {
      const url = await createCheckoutSession(planId);
      if (url) {
        window.location.href = url;
      } else {
        toast({
          variant: 'destructive',
          title: 'Checkout Error',
          description: 'Could not create checkout session. Stripe may not be configured yet.',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Checkout Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setCheckoutLoading(false);
    }
  }, [toast]);

  // Portal (manage subscription)
  const manageSubscription = useCallback(async () => {
    try {
      const url = await createPortalSession();
      if (url) {
        window.location.href = url;
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not open subscription management.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    }
  }, [toast]);

  return {
    subscription,
    loading,
    checkoutLoading,
    isPro,
    isLifetime,
    isFree,
    canUseFeature,
    canAddCard,
    canScan,
    checkout,
    manageSubscription,
    refresh: () => fetchSubscription(true),
    plans: PLANS,
  };
}
