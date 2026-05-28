import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * USAGE TRACKING UTILITY
 * ======================
 */

export const incrementUsage = async (userId, limitKey) => {
  try {
    const now = new Date();
    const user = await User.findById(userId);
    if (!user) return;

    const lastReset = user.usage?.lastResetDate || new Date(0);
    const isDifferentDay = now.toDateString() !== lastReset.toDateString();
    const isDifferentWeek = getYearWeek(now) !== getYearWeek(lastReset);

    // 1. Perform daily/weekly resets in a separate $set operation if needed
    // This avoids MongoDB errors caused by trying to $set and $inc the same path in one update
    const resetFields = {};
    if (isDifferentDay) {
      resetFields['usage.dailyChatCount'] = 0;
      resetFields['usage.dailySearchCount'] = 0;
      resetFields['usage.lastResetDate'] = now;
    }
    if (isDifferentWeek) {
      resetFields['usage.weeklyValidationCount'] = 0;
      resetFields['usage.lastResetDate'] = now;
    }

    if (Object.keys(resetFields).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: resetFields });
    }

    // 2. Perform increment safely
    const update = {};
    switch (limitKey) {
      case 'chatLimit':
        update.$inc = { 'usage.dailyChatCount': 1 };
        break;
      case 'searchLimit':
        update.$inc = { 'usage.dailySearchCount': 1 };
        break;
      case 'validationLimit':
        update.$inc = { 'usage.weeklyValidationCount': 1 };
        break;
      case 'resumeLimit':
        update.$inc = { 'usage.monthlyResumeCount': 1 };
        break;
    }

    if (Object.keys(update).length > 0) {
      await User.findByIdAndUpdate(userId, update);
    }
  } catch (error) {
    logger.error({ userId, limitKey, error: error.message }, '[UsageUtil] Increment failed');
  }
};

function getYearWeek(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return date.getFullYear() + "-W" + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7 + 1);
}
