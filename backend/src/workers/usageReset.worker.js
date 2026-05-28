import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * USAGE RESET WORKER
 * ==================
 * Resets daily and weekly limits.
 */

export const defineUsageResetJobs = (agenda) => {
  agenda.define('reset-daily-usage', async (job) => {
    try {
      const now = new Date();
      const result = await User.updateMany(
        {},
        {
          $set: {
            'usage.dailyChatCount': 0,
            'usage.dailySearchCount': 0,
            'usage.lastResetDate': now
          }
        }
      );
      logger.info({ modified: result.modifiedCount }, '[Worker] Daily usage reset completed');
    } catch (error) {
      logger.error({ error: error.message }, '[Worker] Daily usage reset failed');
    }
  });

  agenda.define('reset-weekly-usage', async (job) => {
    try {
      const result = await User.updateMany(
        {},
        {
          $set: {
            'usage.weeklyValidationCount': 0
          }
        }
      );
      logger.info({ modified: result.modifiedCount }, '[Worker] Weekly usage reset completed');
    } catch (error) {
      logger.error({ error: error.message }, '[Worker] Weekly usage reset failed');
    }
  });
};
