import logger from '../utils/logger.js';
import Notification from '../models/Notification.js';

/**
 * NOTIFICATION SERVICE (Zeeklect v3)
 * =================================
 * Orchestrates multi-channel user engagement.
 * Active: inApp (Persistent storage)
 * Stubs: Email, Push
 */

class NotificationService {
  constructor() {
    this.channels = {
      inApp: async (userId, data) => this.sendInApp(userId, data),
      email: async (userId, data) => this.sendEmail(userId, data),
      push: async (userId, data) => this.sendPush(userId, data)
    };
  }

  /**
   * Main dispatch method
   */
  async notify(userId, type, payload) {
    const { title, message, priority = 'medium', actionLink = null, requestedChannels = ['inApp'] } = payload;

    logger.info({ userId, type, channels: requestedChannels }, '[NotificationService] Dispatching notification');

    const results = await Promise.allSettled(
      requestedChannels.map(channel => {
        if (this.channels[channel]) {
          return this.channels[channel](userId, { type, title, message, priority, actionLink });
        }
        return Promise.reject(new Error(`Channel ${channel} not supported`));
      })
    );

    return results;
  }

  /**
   * IN-APP: Persist to database
   */
  async sendInApp(userId, data) {
    try {
      // Prevent duplicates: Check for unread notification of same type for this user
      const existing = await Notification.findOne({
        userId,
        type: data.type,
        isRead: false
      });

      if (existing) {
        logger.debug({ userId, type: data.type }, '[NotificationService] Duplicate unread notification skipped');
        return { success: true, channel: 'inApp', skipped: true };
      }

      const notification = new Notification({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority,
        actionLink: data.actionLink,
        channels: { inApp: true }
      });
      await notification.save();
      logger.debug({ userId }, '[NotificationService] In-App notification saved');
      return { success: true, channel: 'inApp' };
    } catch (error) {
      logger.error({ userId, error: error.message }, '[NotificationService] In-App failed');
      throw error;
    }
  }

  /**
   * EMAIL: Stub for future implementation (SendGrid/AWS SES)
   */
  async sendEmail(userId, data) {
    logger.info({ userId }, '[NotificationService] [STUB] Email notification would be sent here');
    return { success: true, channel: 'email', status: 'stubbed' };
  }

  /**
   * PUSH: Stub for future implementation (Firebase/OneSignal)
   */
  async sendPush(userId, data) {
    logger.info({ userId }, '[NotificationService] [STUB] Push notification would be sent here');
    return { success: true, channel: 'push', status: 'stubbed' };
  }
}

export default new NotificationService();
