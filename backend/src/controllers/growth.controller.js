import dailyActionEngine from '../services/dailyActionEngine.js';
import { Feedback, ActivityLog } from '../models/Analytics.js';
import User from '../models/User.js';
import UserProgress from '../models/UserProgress.js';

class GrowthController {
  async getDailyActions(req, res) {
    try {
      const actions = await dailyActionEngine.getActions(req.userId);
      
      const response = {
        success: true,
        count: actions.length,
        actions: actions
      };

      // Response Shaping
      if (req.entitlements && req.entitlements.tier === 'free') {
        const { shapeGatedResponse, getCuriosityHint } = await import('../utils/response.js');
        const shaped = shapeGatedResponse(response, req.entitlements, {
            featureArea: 'dailyActions',
            keysToLock: ['estimatedImpact', 'link'],
            upgradeHint: 'Get high-impact daily actions with Pro.',
            lockedMessage: getCuriosityHint('dailyActions')
        });
        return res.json(shaped);
      }

      res.json(response);
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

      // [MOMENTUM SYNC] Update UserProgress activityLog for the heatmap atomically
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updateResult = await UserProgress.updateOne(
        { userId: req.userId, "activityLog.date": today },
        { $inc: { "activityLog.$.count": 1 } }
      );

      if (updateResult.modifiedCount === 0) {
        await UserProgress.updateOne(
          { userId: req.userId },
          { 
            $setOnInsert: { userId: req.userId },
            $push: { 
              activityLog: { 
                $each: [{ date: today, type: 'activity', count: 1 }],
                $slice: -400 // Keep last 400 days for heatmap
              } 
            } 
          },
          { upsert: true }
        );
      }

      // [STREAK SYNC] Update streaks via MomentumService
      try {
        const momentumService = (await import('../services/momentumService.js')).default;
        await momentumService.updateStreak(req.userId);
      } catch (err) {
        console.error('Streak update failed but continuing:', err);
      }

      // Track session counts for monetization timing
      if (action === 'app_launch' || action === 'dashboard_visit') {
        user.sessionCount = (user.sessionCount || 0) + 1;
        await user.save();
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Log activity error:', error);
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
