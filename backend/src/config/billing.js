import config from './env.js';

export const BILLING_PROVIDER = 'stripe';

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

export const BILLING_PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    interval: null,
    stripePriceId: null,
    entitlements: {
      chatDepth: 'basic',
      insightDetail: 'partial',
      resumeAccess: 'limited',
      searchLimit: 10, // daily
      chatLimit: 5, // daily
      validationLimit: 3, // weekly
    },
    features: {
      advancedInsights: false,
      billingPortal: false,
      radarAccess: false,
    },
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    interval: 'month',
    stripePriceId: config.stripeProPriceId || null,
    entitlements: {
      chatDepth: 'full',
      insightDetail: 'full',
      resumeAccess: 'full',
      searchLimit: 100,
      chatLimit: 50,
      validationLimit: 20,
    },
    features: {
      advancedInsights: true,
      billingPortal: true,
      radarAccess: true,
    },
  },
  career_plus: {
    id: 'career_plus',
    label: 'Career+',
    interval: 'month',
    stripePriceId: config.stripeCareerPlusPriceId || null, // Assuming this will be added to env
    entitlements: {
      chatDepth: 'expert',
      insightDetail: 'full',
      resumeAccess: 'unlimited',
      searchLimit: 500,
      chatLimit: 200,
      validationLimit: 100,
    },
    features: {
      advancedInsights: true,
      billingPortal: true,
      radarAccess: true,
      personalizedOutreach: true,
      networkIntelligence: true,
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

export function getEntitlement(planId, entitlement) {
  const plan = getPlanConfig(planId);
  return plan.entitlements?.[entitlement];
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
