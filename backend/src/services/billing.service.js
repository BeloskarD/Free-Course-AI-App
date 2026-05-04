import Stripe from 'stripe';
import User from '../models/User.js';
import config from '../config/env.js';
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  BILLING_PROVIDER,
  DEFAULT_PLAN_ID,
  getPlanConfig,
  getPublicBillingPlans,
  resolvePlanFromSubscription,
} from '../config/billing.js';
import logger from '../utils/logger.js';

let stripeClient;

const configurationFields = [
  'stripeSecretKey',
  'stripeProPriceId',
  'stripeCheckoutSuccessUrl',
  'stripeCheckoutCancelUrl',
  'stripeBillingReturnUrl',
];

const dateFromUnixSeconds = (value) => {
  if (!value) return null;
  return new Date(value * 1000);
};

class BillingService {
  ensureConfigured() {
    const missing = configurationFields.filter((field) => !config[field]);
    if (missing.length > 0) {
      const msg = `Billing is not configured. Missing: ${missing.join(', ')}`;
      logger.error({ missing }, '[Billing] Service configuration check failed');
      const error = new Error(msg);
      error.statusCode = 503;
      throw error;
    }
  }

  getStripeClient() {
    this.ensureConfigured();
    if (!stripeClient) {
      stripeClient = new Stripe(config.stripeSecretKey);
    }
    return stripeClient;
  }

  getPlanCatalog() {
    const plans = getPublicBillingPlans();
    return plans.map((plan) => ({
      ...plan,
      price: plan.id === 'pro' ? config.stripeProPriceAmount : 0,
      currency: 'USD',
    }));
  }

  async createCheckoutSession(user, source = 'pricing_page') {
    if (!user?.id) {
      const error = new Error('Authenticated user is required to start checkout.');
      error.statusCode = 401;
      throw error;
    }

    if (user.subscriptionTier === 'pro' && ACTIVE_SUBSCRIPTION_STATUSES.has(user.billing?.subscriptionStatus)) {
      const error = new Error('Your Pro subscription is already active.');
      error.statusCode = 409;
      throw error;
    }

    const stripe = this.getStripeClient();
    const proPlan = getPlanConfig('pro');
    const customerId = await this.ensureCustomer(user);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: proPlan.stripePriceId, quantity: 1 }],
      success_url: `${config.stripeCheckoutSuccessUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: config.stripeCheckoutCancelUrl,
      client_reference_id: String(user.id),
      allow_promotion_codes: false,
      metadata: {
        userId: String(user.id),
        planId: 'pro',
        source,
      },
      subscription_data: {
        metadata: {
          userId: String(user.id),
          planId: 'pro',
          source,
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createPortalSession(user) {
    if (!user?.billing?.stripeCustomerId) {
      const error = new Error('No billing account found for this user yet.');
      error.statusCode = 404;
      throw error;
    }

    const stripe = this.getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.billing.stripeCustomerId,
      return_url: config.stripeBillingReturnUrl,
    });

    return { url: session.url };
  }

  async getSubscriptionSummary(user) {
    const planId = user?.billing?.subscriptionPlan || user?.subscriptionTier || DEFAULT_PLAN_ID;
    const plan = getPlanConfig(planId);

    return {
      tier: user?.subscriptionTier || DEFAULT_PLAN_ID,
      status: user?.billing?.subscriptionStatus || 'inactive',
      planId,
      planLabel: plan.label,
      interval: plan.interval,
      currentPeriodEnd: user?.billing?.currentPeriodEnd || null,
      cancelAtPeriodEnd: Boolean(user?.billing?.cancelAtPeriodEnd),
      provider: user?.billing?.provider || null,
      hasCustomerAccount: Boolean(user?.billing?.stripeCustomerId),
      plans: this.getPlanCatalog(),
    };
  }

  async ensureCustomer(user) {
    const stripe = this.getStripeClient();

    if (user.billing?.stripeCustomerId) {
      return user.billing.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: String(user.id),
      },
    });

    await User.findByIdAndUpdate(user.id, {
      $set: {
        'billing.provider': BILLING_PROVIDER,
        'billing.stripeCustomerId': customer.id,
      },
    });

    return customer.id;
  }

  async verifyWebhookEvent(signature, rawBody) {
    if (!config.stripeWebhookSecret) {
      const error = new Error('Stripe Webhook Secret is not configured. Webhook verification failed.');
      error.statusCode = 503;
      throw error;
    }
    const stripe = this.getStripeClient();
    return stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
  }

  async handleWebhookEvent(event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await this.syncCustomerFromCheckoutSession(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await this.syncSubscription(event.data.object);
        break;
      }
      case 'invoice.payment_succeeded': {
        await this.markLastPayment(event.data.object);
        break;
      }
      case 'invoice.payment_failed': {
        await this.markPaymentFailure(event.data.object);
        break;
      }
      default:
        logger.info({ type: event.type }, '[Billing] Ignoring unhandled webhook event');
    }
  }

  async syncCustomerFromCheckoutSession(session) {
    const user = await this.findUserForBillingPayload({
      metadata: session.metadata,
      customerId: session.customer,
      customerEmail: session.customer_details?.email,
    });

    if (!user) {
      logger.warn({ sessionId: session.id }, '[Billing] Checkout completed but user mapping failed');
      return;
    }

    await User.findByIdAndUpdate(user._id, {
      $set: {
        'billing.provider': BILLING_PROVIDER,
        'billing.stripeCustomerId': session.customer || user.billing?.stripeCustomerId || null,
      },
    });
  }

  async syncSubscription(subscription) {
    const priceId = subscription.items?.data?.[0]?.price?.id || null;
    const planId = resolvePlanFromSubscription(subscription.status, priceId);
    const user = await this.findUserForBillingPayload({
      metadata: subscription.metadata,
      customerId: subscription.customer,
    });

    if (!user) {
      logger.warn({ subscriptionId: subscription.id }, '[Billing] Subscription sync skipped because user was not found');
      return;
    }

    await User.findByIdAndUpdate(user._id, {
      $set: {
        subscriptionTier: ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status) ? 'pro' : 'free',
        'billing.provider': BILLING_PROVIDER,
        'billing.stripeCustomerId': subscription.customer || user.billing?.stripeCustomerId || null,
        'billing.stripeSubscriptionId': subscription.id,
        'billing.subscriptionStatus': subscription.status,
        'billing.subscriptionPlan': planId,
        'billing.currentPeriodEnd': dateFromUnixSeconds(subscription.current_period_end),
        'billing.cancelAtPeriodEnd': Boolean(subscription.cancel_at_period_end),
      },
    });
  }

  async markLastPayment(invoice) {
    const user = await this.findUserForBillingPayload({ customerId: invoice.customer });
    if (!user) return;

    await User.findByIdAndUpdate(user._id, {
      $set: {
        'billing.lastPaymentAt': new Date(),
      },
    });
  }

  async markPaymentFailure(invoice) {
    const user = await this.findUserForBillingPayload({ customerId: invoice.customer });
    if (!user) return;

    await User.findByIdAndUpdate(user._id, {
      $set: {
        'billing.subscriptionStatus': invoice.subscription ? 'past_due' : user.billing?.subscriptionStatus || 'past_due',
      },
    });
  }

  async findUserForBillingPayload({ metadata, customerId, customerEmail }) {
    if (metadata?.userId) {
      const byId = await User.findById(metadata.userId);
      if (byId) return byId;
    }

    if (customerId) {
      const byCustomer = await User.findOne({ 'billing.stripeCustomerId': customerId });
      if (byCustomer) return byCustomer;
    }

    if (customerEmail) {
      return User.findOne({ email: { $regex: new RegExp(`^${String(customerEmail).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    }

    return null;
  }
}

export default new BillingService();
