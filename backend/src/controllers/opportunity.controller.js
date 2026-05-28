import opportunityRadarService from '../services/opportunityRadar.service.js';
import { shapeGatedResponse } from '../utils/response.js';

/**
 * OPPORTUNITY RADAR CONTROLLER
 * ===========================
 */

export const getOpportunityRadar = async (req, res) => {
  try {
    const userId = req.userId;
    const entitlements = req.entitlements;
    const limit = parseInt(req.query.limit) || 10;

    const radar = await opportunityRadarService.getRadar(userId, limit);

    // Response Shaping:
    // - Free users see only 3 opportunities.
    // - Pro users see 10+.
    // - Free users have gapAnalysis locked.
    const gatedResult = shapeGatedResponse(radar, entitlements, {
      lockedMessage: "Upgrade to Pro to unlock precise skill gap analysis and the full opportunity list.",
      upgradeHint: "Pro users see 3x more opportunities and get custom advice for each role.",
      keysToLock: ['gapAnalysis', 'aiReasoning']
    });

    if (gatedResult.locked) {
      gatedResult.data = gatedResult.data.slice(0, 3).map(match => ({
        ...match,
        gapAnalysis: [], // Hide gaps for free
        aiReasoning: "Upgrade to Pro to see why you're a match."
      }));
    }

    return res.json(gatedResult);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
