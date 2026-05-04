import User from '../models/User.js';
import UserProgress from '../models/UserProgress.js';
import { getFeatureLimit, hasFeatureAccess } from '../config/billing.js';

/**
 * SUBSCRIPTION GUARD (Zeeklect v3)
 * ===============================
 * Tiered access control with soft limits.
 */

export const subscriptionGuard = (feature, limit = 0) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Pro users always pass
      if (user.subscriptionTier === 'pro') return next();

      const resolvedLimit = Number.isFinite(limit) && limit > 0 ? limit : getFeatureLimit(user.subscriptionTier, feature);

      // Feature specific gating
      if (feature === 'validation_limit') {
        const currentWeek = getYearWeek();
        const progress = await UserProgress.findOne({ userId: req.userId });
        
        const weekUsage = progress?.validationUsage?.find(u => u.week === currentWeek);
        const count = weekUsage?.count || 0;

        if (count >= resolvedLimit) {
          return res.status(403).json({
            success: false,
            limitReached: true,
            tier: 'free',
            feature: 'Skill Validation',
            message: `Weekly verification limit reached (${resolvedLimit}/week for Free tier).`,
            unlockCta: 'Unlock Unlimited Validations with Pro'
          });
        }
      }

      if (feature === 'advanced_insights') {
        if (hasFeatureAccess(user.subscriptionTier, 'advancedInsights')) {
          return next();
        }

        // Soft gate: Allow preview but flag as pro for frontend to hide details
        req.isProRequested = true;
        return next();
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export async function recordValidationUsage(userId) {
  const currentWeek = getYearWeek();
  const progress = await UserProgress.findOne({ userId });

  if (!progress) {
    await UserProgress.create({
      userId,
      validationUsage: [{ week: currentWeek, count: 1 }],
    });
    return;
  }

  const existing = progress.validationUsage?.find((entry) => entry.week === currentWeek);
  if (existing) {
    existing.count += 1;
  } else {
    progress.validationUsage = [...(progress.validationUsage || []), { week: currentWeek, count: 1 }].slice(-12);
  }

  await progress.save();
}

function getYearWeek() {
  const d = new Date();
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return date.getFullYear() + "-W" + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7 + 1);
}
