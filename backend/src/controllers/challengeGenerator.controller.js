import challengeGeneratorService from '../services/challengeGenerator.service.js';
import pkgService from '../services/pkgService.js';

/**
 * ADAPTIVE CHALLENGE GENERATOR CONTROLLER
 */

export const generateChallenge = async (req, res) => {
    try {
        const userId = req.userId;
        const challenge = await challengeGeneratorService.generateChallenge(userId);
        res.json({ success: true, data: challenge });
    } catch (error) {
        console.error('[ChallengeGenerator] generate error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getSuggestions = async (req, res) => {
    try {
        const userId = req.userId;
        const count = Math.min(parseInt(req.query.count) || 3, 5);
        const suggestions = await challengeGeneratorService.getSuggestions(userId, count);
        res.json({ success: true, data: suggestions });
    } catch (error) {
        console.error('[ChallengeGenerator] suggestions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const history = challengeGeneratorService.getHistory(userId);
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('[ChallengeGenerator] history error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const submitResult = async (req, res) => {
    try {
        const userId = req.userId;
        const { skill, topic, score, timeSpent } = req.body;

        if (!skill || score === undefined) {
            return res.status(400).json({ success: false, error: 'skill and score are required' });
        }

        // Feed result back into PKG via the standard event pipeline
        await pkgService.processEvent(userId, pkgService.PKG_EVENTS.CHALLENGE_COMPLETED, {
            skill,
            topic: topic || `${skill} Challenge`,
            score: Math.min(100, Math.max(0, Number(score))),
            timeSpent: timeSpent || 300,
            isAIGenerated: true
        });

        res.json({ success: true, message: 'Challenge result recorded and PKG updated' });
    } catch (error) {
        console.error('[ChallengeGenerator] submitResult error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default { generateChallenge, getSuggestions, getHistory, submitResult };
