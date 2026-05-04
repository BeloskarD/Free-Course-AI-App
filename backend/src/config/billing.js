import config from './env.js';

export const BILLING_PROVIDER = 'stripe';

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

export const BILLING_PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    interval: null,
    stripePriceId: null,
    limits: {
      validation_limit: 3,
    },
    features: {
      advancedInsights: false,
      billingPortal: false,
    },
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    interval: 'month',
    stripePriceId: config.stripeProPriceId || null,
    limits: {
      validation_limit: Number.POSITIVE_INFINITY,
    },
    features: {
      advancedInsights: true,
      billingPortal: true,
    },
  },
};

export const DEFAULT_PLAN_ID = 'free';

export function getPlanConfig(planId = DEFAULT_PLAN_ID) {
  return BILLING_PLANS[planId] || BILLING_PLANS[DEFAULT_PLAN_ID];
}

export function resolvePlanFromSubscription(status, priceId) {
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    return DEFAULT_PLAN_ID;
  }

  const matchedPlan = Object.values(BILLING_PLANS).find((plan) => plan.stripePriceId && plan.stripePriceId === priceId);
  return matchedPlan?.id || 'pro';
}

export function getFeatureLimit(planId, feature) {
  const plan = getPlanConfig(planId);
  return plan.limits?.[feature] ?? 0;
}

export function hasFeatureAccess(planId, feature) {
  const plan = getPlanConfig(planId);
  return Boolean(plan.features?.[feature]);
}

export function getPublicBillingPlans() {
  return Object.values(BILLING_PLANS).map((plan) => ({
    id: plan.id,
    label: plan.label,
    interval: plan.interval,
    limits: plan.limits,
    features: plan.features,
  }));
}
