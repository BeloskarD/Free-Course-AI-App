import User from '../models/User.js';
import { getEntitlement, hasFeatureAccess } from '../config/billing.js';
import { incrementUsage } from '../utils/usage.js';
import logger from '../utils/logger.js';

/**
 * Usage Recording Helpers
 */
export const recordValidationUsage = async (userId) => incrementUsage(userId, 'validationLimit');
export const recordSearchUsage = async (userId) => incrementUsage(userId, 'searchLimit');
export const recordChatUsage = async (userId) => incrementUsage(userId, 'chatLimit');

/**
 * ZEEKLECT SUBSCRIPTION & ENTITLEMENT GUARD
 * ========================================
 * Production-ready tiered access control.
 */

export const subscriptionGuard = (feature, options = {}) => {
  return async (req, res, next) => {
    try {
      let tier = 'free';
      let user = null;

      if (req.userId) {
        user = await User.findById(req.userId);
        if (user) {
          tier = user.subscriptionTier || 'free';
        }
      }

      // If no user found and it's mandatory, we block. 
      // But for optionalAuth routes, we treat as 'free' tier.
      if (!user && options.requireUser) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required for this feature' });
      }

      // 1. Hard Feature Access Check
      if (options.requireFeature && !hasFeatureAccess(tier, options.requireFeature)) {
        return res.status(403).json({
          success: false,
          locked: true,
          error: 'FeatureLocked',
          message: `The ${options.requireFeature.replace(/([A-Z])/g, ' $1').trim()} feature is not available on the ${tier} tier.`,
          upgradeHint: options.upgradeHint || `Upgrade to Pro to unlock this feature.`
        });
      }

      // 2. Usage Limit Check
      if (options.limitKey) {
        const limit = getEntitlement(tier, options.limitKey);
        const currentUsage = await getCurrentUsage(user, options.limitKey);

        if (currentUsage >= limit) {
          return res.status(403).json({
            success: false,
            limitReached: true,
            error: 'LimitReached',
            message: `You've reached your ${tier} tier limit for ${options.limitKey.replace(/([A-Z])/g, ' $1').trim()}.`,
            usage: { current: currentUsage, limit },
            upgradeHint: `Upgrade to unlock higher limits.`
          });
        }
        
        // Pass limit info to request for incrementing later
        req.usageToIncrement = options.limitKey;
      }

      // 3. Depth/Output Level Injection
      // We don't block here, but we tell the service what level of data to return
      req.entitlements = {
        tier,
        chatDepth: getEntitlement(tier, 'chatDepth'),
        insightDetail: getEntitlement(tier, 'insightDetail'),
        resumeAccess: getEntitlement(tier, 'resumeAccess')
      };

      next();
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack }, '[SubscriptionGuard] Middleware Error');
      next(error);
    }
  };
};

/**
 * Usage Helper
 */
async function getCurrentUsage(user, limitKey) {
  if (!user) return 0;
  const now = new Date();
  const lastReset = user.usage?.lastResetDate || new Date(0);
  
  const isDifferentDay = now.toDateString() !== lastReset.toDateString();
  const isDifferentWeek = getYearWeek(now) !== getYearWeek(lastReset);

  // Daily Resets
  if (['chatLimit', 'searchLimit'].includes(limitKey) && isDifferentDay) {
    return 0; 
  }

  // Weekly Resets
  if (['validationLimit'].includes(limitKey) && isDifferentWeek) {
    return 0;
  }

  // Return current count from DB
  switch (limitKey) {
    case 'chatLimit': return user.usage?.dailyChatCount || 0;
    case 'searchLimit': return user.usage?.dailySearchCount || 0;
    case 'validationLimit': return user.usage?.weeklyValidationCount || 0;
    case 'resumeLimit': return user.usage?.monthlyResumeCount || 0;
    default: return 0;
  }
}

function getYearWeek(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return date.getFullYear() + "-W" + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7 + 1);
}
