import interviewPrepService from '../services/interviewPrep.service.js';
import { shapeGatedResponse, getCuriosityHint } from '../utils/response.js';

/**
 * INTERVIEW PREP CONTROLLER
 * =========================
 * CORRECTION 1: Progressive reveal, NOT denial.
 * Free: 2 questions, basic difficulty, generic feedback
 * Pro: full interview guidance
 * Career+: strategic interview intelligence
 */
export const getPrepKit = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { signalId } = req.body;

        if (!signalId) return res.status(400).json({ error: 'signalId is required' });

        console.log(`🔍 [InterviewPrep] Generating kit for user ${userId} / signal ${signalId}...`);
        const kit = await interviewPrepService.generatePrepKit(userId, signalId);

        // Use shapeGatedResponse for all tiers to ensure consistent structure (flattened)
        const shaped = shapeGatedResponse(kit, req.entitlements, {
            partialCount: 2,
            keysToLock: [
                'strategy', 'reasoning', 'starMethodPoints',
                'recruiterReasoning', 'pressureAnalysis', 'advancedStrategies',
                'hiddenWeaknesses', 'detailedFeedback'
            ],
            featureArea: 'interviewPrep',
            upgradeHint: 'Unlock recruiter reasoning and pressure analysis with Pro.',
            lockedMessage: getCuriosityHint('interviewPrep')
        });

        res.json(shaped);
    } catch (error) {
        console.error('[InterviewPrep] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
