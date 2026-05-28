import careerTimelineEngine from '../services/careerTimelineEngine.js';
import { shapeGatedResponse } from '../utils/response.js';
import { incrementUsage } from '../utils/usage.js';

/**
 * PATHWAY ORCHESTRATOR CONTROLLER
 * ==============================
 */

export const getCareerTimeline = async (req, res) => {
  try {
    const { targetRole } = req.body;
    const userId = req.userId;
    const entitlements = req.entitlements;

    // Generate or fetch the timeline
    const timeline = await careerTimelineEngine.generateProjection(userId, targetRole || 'Software Engineer');

    // Response Shaping: 
    // - Free users get only 2 milestones and limited weekly plan.
    // - Pro users get full detail.
    const gatedResult = shapeGatedResponse(timeline.toObject(), entitlements, {
      keysToLock: ['scenarios', 'hiringProbability'], // Advanced insights
      partialCount: 2, // Limit milestones/plans if they were arrays
      lockedMessage: "Upgrade to Career+ to unlock scenario forecasting and hiring probability scores.",
      upgradeHint: "Career+ users see 3 detailed growth scenarios and precise hiring odds."
    });

    // If it's a list we are gating
    if (gatedResult.locked) {
      gatedResult.data.milestones = gatedResult.data.milestones.slice(0, 1);
      gatedResult.data.weeklyPlan = gatedResult.data.weeklyPlan.slice(0, 1);
    }

    return res.json(gatedResult);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
