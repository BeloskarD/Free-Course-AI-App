/**
 * GUARDIAN CONTROLLER
 * ===================
 * Express controller for Guardian API endpoints.
 * Guardian is READ-ONLY - produces decisions only.
 * 
 * Endpoints:
 * - POST /api/guardian/evaluate  - Full evaluation
 * - GET  /api/guardian/status    - Guardian status
 * - POST /api/guardian/quick     - Quick P0/P1 check
 */

import guardianService from '../services/guardian/guardian.service.js';

/**
 * POST /api/guardian/evaluate
 * Evaluate user and return intervention decision
 * 
 * Body: {
 *   sessionDuration: number (minutes),
 *   currentPage: string,
 *   interventionsThisSession: number
 * }
 */
export async function evaluate(req, res) {
    try {
        const userId = req.user.userId;
        const sessionContext = {
            sessionDuration: req.body.sessionDuration || 0,
            currentPage: req.body.currentPage || 'unknown',
            interventionsThisSession: req.body.interventionsThisSession || 0
        };

        const result = await guardianService.evaluateUser(userId, sessionContext);

        res.json(result);

    } catch (error) {
        console.error('[Guardian Controller] Evaluate error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to evaluate guardian rules'
        });
    }
}

/**
 * GET /api/guardian/status
 * Get current guardian status for user
 */
export async function getStatus(req, res) {
    try {
        const userId = req.user.userId;
        const result = await guardianService.getGuardianStatus(userId);

        res.json(result);

    } catch (error) {
        console.error('[Guardian Controller] Status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get guardian status'
        });
    }
}

/**
 * POST /api/guardian/quick
 * Quick check for P0/P1 interventions only
 * Useful for lightweight polling
 */
export async function quickCheck(req, res) {
    try {
        const userId = req.user.userId;
        const result = await guardianService.quickCheck(userId);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('[Guardian Controller] Quick check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform quick check'
        });
    }
}

export default {
    evaluate,
    getStatus,
    quickCheck
};
