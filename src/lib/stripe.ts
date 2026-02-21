/**
 * Stripe Integration for CardLedger
 * 
 * Handles subscription management, checkout, and portal sessions.
 * 
 * SETUP: Add these to .env:
 *   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
 * 
 * And create a Supabase Edge Function for server-side:
 *   supabase/functions/stripe-checkout/index.ts
 *   supabase/functions/stripe-webhook/index.ts
 * 
 * Stripe Products (create in Stripe Dashboard):
 *   - CardLedger Pro Monthly: $7.99/mo
 *   - CardLedger Pro Annual: $59.99/yr  
 *   - CardLedger Lifetime: $149 one-time
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type PlanId = 'free' | 'pro_monthly' | 'pro_annual' | 'lifetime';

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  price: number;
  period: 'month' | 'year' | 'once' | 'free';
  stripePriceId: string | null;
  features: string[];
  limits: {
    maxCards: number;
    maxScansPerDay: number;
    priceHistory: boolean;
    priceAlerts: boolean;
    exportCsv: boolean;
    advancedAnalytics: boolean;
    conditionPricing: boolean;
    unlimitedCollections: boolean;
  };
}

export interface UserSubscription {
  plan: PlanId;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

// ============================================
// Plans Configuration
// ============================================

export const PLANS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'free',
    stripePriceId: null,
    features: [
      'Track up to 100 cards',
      '5 AI scans per day',
      'Current prices only',
      'Basic portfolio value',
      'Community support',
    ],
    limits: {
      maxCards: 100,
      maxScansPerDay: 5,
      priceHistory: false,
      priceAlerts: false,
      exportCsv: false,
      advancedAnalytics: false,
      conditionPricing: false,
      unlimitedCollections: false,
    },
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro',
    price: 7.99,
    period: 'month',
    // Replace with actual Stripe Price IDs after creating products
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || null,
    features: [
      'Unlimited cards & scans',
      'Full price history',
      'P&L and ROI analytics',
      'Price alerts',
      'Export to CSV',
      'Condition-based pricing',
      'Unlimited collections',
      'Priority support',
    ],
    limits: {
      maxCards: Infinity,
      maxScansPerDay: Infinity,
      priceHistory: true,
      priceAlerts: true,
      exportCsv: true,
      advancedAnalytics: true,
      conditionPricing: true,
      unlimitedCollections: true,
    },
  },
  pro_annual: {
    id: 'pro_annual',
    name: 'Pro (Annual)',
    price: 59.99,
    period: 'year',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL || null,
    features: [
      'Everything in Pro',
      'Save 37% vs monthly',
    ],
    limits: {
      maxCards: Infinity,
      maxScansPerDay: Infinity,
      priceHistory: true,
      priceAlerts: true,
      exportCsv: true,
      advancedAnalytics: true,
      conditionPricing: true,
      unlimitedCollections: true,
    },
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    price: 149,
    period: 'once',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_LIFETIME || null,
    features: [
      'Everything in Pro',
      'All future updates',
      'Priority support forever',
      'Early access to features',
      'Founding member badge',
      'No recurring payments',
    ],
    limits: {
      maxCards: Infinity,
      maxScansPerDay: Infinity,
      priceHistory: true,
      priceAlerts: true,
      exportCsv: true,
      advancedAnalytics: true,
      conditionPricing: true,
      unlimitedCollections: true,
    },
  },
};

// ============================================
// Subscription State
// ============================================

/**
 * Get the current user's subscription from Supabase
 */
export async function getUserSubscription(): Promise<UserSubscription> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plan: 'free', status: 'none' };

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return { plan: 'free', status: 'none' };
  }

  return {
    plan: data.plan_id as PlanId,
    status: data.status,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(subscription: UserSubscription, feature: keyof SubscriptionPlan['limits']): boolean {
  const plan = PLANS[subscription.plan];
  if (!plan) return false;
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return PLANS.free.limits[feature] as boolean;
  }
  return plan.limits[feature] as boolean;
}

/**
 * Check if user is within card limit
 */
export function isWithinCardLimit(subscription: UserSubscription, currentCardCount: number): boolean {
  const plan = PLANS[subscription.plan];
  if (!plan) return false;
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return currentCardCount < PLANS.free.limits.maxCards;
  }
  return currentCardCount < plan.limits.maxCards;
}

/**
 * Check daily scan limit
 */
export function isWithinScanLimit(subscription: UserSubscription, todayScans: number): boolean {
  const plan = PLANS[subscription.plan];
  if (!plan) return false;
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return todayScans < PLANS.free.limits.maxScansPerDay;
  }
  return todayScans < plan.limits.maxScansPerDay;
}

// ============================================
// Checkout & Portal
// ============================================

/**
 * Create a Stripe Checkout session for a plan
 */
export async function createCheckoutSession(planId: PlanId): Promise<string | null> {
  const plan = PLANS[planId];
  if (!plan?.stripePriceId) {
    console.error('No Stripe price ID configured for plan:', planId);
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      priceId: plan.stripePriceId,
      planId: planId,
      mode: plan.period === 'once' ? 'payment' : 'subscription',
      successUrl: `${window.location.origin}/profile?checkout=success`,
      cancelUrl: `${window.location.origin}/profile?checkout=canceled`,
    },
  });

  if (error) {
    console.error('Checkout session error:', error);
    return null;
  }

  return data?.url || null;
}

/**
 * Open the Stripe Customer Portal for subscription management
 */
export async function createPortalSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase.functions.invoke('stripe-portal', {
    body: {
      returnUrl: `${window.location.origin}/profile`,
    },
  });

  if (error) {
    console.error('Portal session error:', error);
    return null;
  }

  return data?.url || null;
}
