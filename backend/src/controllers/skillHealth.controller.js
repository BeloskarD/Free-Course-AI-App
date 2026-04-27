import skillHealthService from '../services/skillHealthService.js';

/**
 * GET /api/skill-health/dashboard
 */
export async function getDashboard(req, res) {
    try {
        const dashboard = await skillHealthService.getDashboard(req.userId);
        res.json({ success: true, data: dashboard });
    } catch (error) {
        console.error('❌ Skill Health Dashboard Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/skill-health/recalculate
 */
export async function recalculateHealth(req, res) {
    try {
        const result = await skillHealthService.recalculateHealth(req.userId);
        res.json({ success: true, data: result, message: 'Skill health recalculated' });
    } catch (error) {
        console.error('❌ Recalculate Health Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/skill-health/challenges/:skillName
 */
export async function getChallenges(req, res) {
    try {
        const challenge = await skillHealthService.getChallenges(req.userId, req.params.skillName);
        res.json({ success: true, data: { challenge } });
    } catch (error) {
        console.error('❌ Get Challenges Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/skill-health/submit
 */
export async function submitAnswer(req, res) {
    try {
        const result = await skillHealthService.submitAnswer(req.userId, {
            skillName: req.body.skillName,
            challengeId: req.body.challengeId,
            answer: req.body.answer,
            isAiChallenge: req.body.isAiChallenge,
            isCorrect: req.body.isCorrect,
            timeSpent: req.body.timeSpent,
            challengeType: req.body.challengeType,
            difficulty: req.body.difficulty,
        });
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ Submit Answer Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/skill-health/claim-badge
 */
export async function claimProofBadge(req, res) {
    try {
        // Assume logic is in service now if needed
        res.json({ success: true, message: 'Badge claimed!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/skill-health/notifications
 */
export async function getNotifications(req, res) {
    try {
        const notifications = await skillHealthService.getNotifications(req.userId);
        res.json({ success: true, data: { notifications } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/skill-health/challenge/ai
 */
export async function generateAIChallenge(req, res) {
    try {
        const challenge = await skillHealthService.generateAIChallenge(
            req.userId,
            req.body.skillName,
            req.body.difficulty
        );
        res.json({ success: true, data: { challenge } });
    } catch (error) {
        console.error('❌ Generate AI Challenge Error:', error);
        res.status(500).json({ error: error.message });
    }
}
