/**
 * ANALYTICS TRACKING FOR MONETIZATION
 * Ensures every conversion-related action is tracked.
 */

class Analytics {
  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  // Helper to push to dataLayer or custom integration (e.g., PostHog)
  track(eventName, properties = {}) {
    if (!this.isClient) return;

    // Standard console fallback for development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics] 📊 ${eventName}`, properties);
    }

    // Example PostHog / generic dataLayer integration
    if (window.posthog) {
      window.posthog.capture(eventName, properties);
    } else if (window.dataLayer) {
      window.dataLayer.push({ event: eventName, ...properties });
    }
  }

  lockedView(featureName, properties = {}) {
    this.track('locked_view', { feature_name: featureName, ...properties });
  }

  limitHit(limitKey, properties = {}) {
    this.track('limit_hit', { limit_key: limitKey, ...properties });
  }

  ctaClickedInline(featureName, targetTier, properties = {}) {
    this.track('cta_clicked_inline', { feature_name: featureName, target_tier: targetTier, ...properties });
  }

  upgradeClick(source, targetTier, properties = {}) {
    this.track('upgrade_click', { source, target_tier: targetTier, ...properties });
  }

  checkoutStarted(tier, properties = {}) {
    this.track('checkout_started', { tier, ...properties });
  }

  checkoutCompleted(tier, properties = {}) {
    this.track('checkout_completed', { tier, ...properties });
  }
}

export const analytics = new Analytics();
