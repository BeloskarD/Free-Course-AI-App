import dailyActionEngine from '../services/dailyActionEngine.js';
import { Feedback, ActivityLog } from '../models/Analytics.js';
import User from '../models/User.js';
import UserProgress from '../models/UserProgress.js';

class GrowthController {
  async getDailyActions(req, res) {
    try {
      const actions = await dailyActionEngine.getActions(req.userId);
      res.json({ success: true, count: actions.length, data: actions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async submitFeedback(req, res) {
    try {
      const { featureId, helpful, comment, score } = req.body;
      const user = await User.findById(req.userId);
      
      const feedback = new Feedback({
        userId: req.userId,
        featureId,
        helpful,
        comment,
        userState: {
          score: score || 0,
          tier: user?.subscriptionTier || 'free'
        }
      });
      await feedback.save();

      res.status(201).json({ success: true, message: 'Feedback received' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async logActivity(req, res) {
    try {
      const { action, feature, metadata, score } = req.body;
      const user = await User.findById(req.userId);

      const log = new ActivityLog({
        userId: req.userId,
        action,
        feature,
        metadata,
        userTier: user?.subscriptionTier || 'free',
        currentScore: score || 0
      });
      await log.save();

      // Track session counts for monetization timing
      if (action === 'app_launch' || action === 'dashboard_visit') {
        user.sessionCount = (user.sessionCount || 0) + 1;
        await user.save();
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async completeOnboarding(req, res) {
    try {
      const { targetRole, skills } = req.body;
      
      // Update User Level
      await User.findByIdAndUpdate(req.userId, {
        $set: { 
          "onboardingStatus.roleDefined": true,
          "onboardingStatus.skillsDefined": !!skills?.length
        }
      });

      // Update UserProgress Level
      await UserProgress.findOneAndUpdate(
        { userId: req.userId },
        { $set: { targetRole: targetRole || 'Software Engineer' } },
        { upsert: true }
      );

      res.json({ success: true, message: 'Onboarding completed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new GrowthController();
