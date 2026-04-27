import pkgService, { PKG_EVENTS } from '../services/pkgService.js';

/**
 * PKG CONTROLLER
 * ==============
 * Express controller for PKG API endpoints.
 * All writes go through pkgService.
 * 
 * Endpoints:
 * - GET  /api/pkg        - Get full PKG for authenticated user
 * - PATCH /api/pkg       - Path-based update (e.g., { path: 'skills.javascript.health', value: 85 })
 * - POST /api/pkg/event  - Event-driven update (e.g., { type: 'challenge_completed', data: {...} })
 */

/**
 * GET /api/pkg
 * Returns the full PKG for the authenticated user
 */
export async function getPKG(req, res) {
    try {
        const userId = req.user.userId;
        const pkg = await pkgService.getPKG(userId);

        res.json({
            success: true,
            data: pkg
        });
    } catch (error) {
        console.error('[PKG Controller] Error getting PKG:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve PKG'
        });
    }
}

/**
 * PATCH /api/pkg
 * Update PKG using path-based approach
 * Body: { path: 'skills.javascript.health', value: 85 }
 * Or: { updates: [{ path: '...', value: ... }, ...] }
 */
export async function updatePKG(req, res) {
    try {
        const userId = req.user.userId;
        const { path, value, updates } = req.body;

        let pkg;

        if (updates && Array.isArray(updates)) {
            // Multiple path updates
            pkg = await pkgService.updateMultiplePaths(userId, updates);
        } else if (path && value !== undefined) {
            // Single path update
            pkg = await pkgService.updateByPath(userId, path, value);
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid request. Provide either { path, value } or { updates: [...] }'
            });
        }

        res.json({
            success: true,
            data: pkg,
            message: 'PKG updated successfully'
        });
    } catch (error) {
        console.error('[PKG Controller] Error updating PKG:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update PKG'
        });
    }
}

/**
 * POST /api/pkg/event
 * Process an event and update PKG accordingly
 * Body: { type: 'challenge_completed', data: { skill, topic, score, ... } }
 */
export async function processEvent(req, res) {
    try {
        const userId = req.user.userId;
        const { type, data } = req.body;

        // Validate event type
        if (!type || !Object.values(PKG_EVENTS).includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Invalid event type. Valid types: ${Object.values(PKG_EVENTS).join(', ')}`
            });
        }

        // Process the event
        const result = await pkgService.processEvent(userId, type, data || {});

        res.json({
            success: result.success,
            data: {
                pkg: result.pkg,
                changes: result.changes
            },
            message: result.success ? 'Event processed successfully' : 'Event processing failed'
        });
    } catch (error) {
        console.error('[PKG Controller] Error processing event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process event'
        });
    }
}

/**
 * GET /api/pkg/summary
 * Returns a lightweight summary of PKG for dashboard widgets
 */
export async function getPKGSummary(req, res) {
    try {
        const userId = req.user.userId;
        const pkg = await pkgService.getPKG(userId);

        // Build summary
        // Robust skill normalization (Support both Array and Map formats during migration)
        const skillsArr = Array.isArray(pkg.skills) 
            ? pkg.skills 
            : (pkg.skills instanceof Map ? Array.from(pkg.skills.values()) : Object.values(pkg.skills || {}));

        const summary = {
            identity: {
                learningStyle: pkg.identity?.learningStyle,
                preferredDifficulty: pkg.identity?.preferredDifficulty
            },
            skills: {
                count: skillsArr.length,
                topSkills: skillsArr
                    .sort((a, b) => (b.level || 0) - (a.level || 0))
                    .slice(0, 5)
                    .map(s => ({
                        name: s.displayName || s.skillId || 'Unknown Skill',
                        level: s.level || 0,
                        health: s.health || 0
                    }))
            },
            wellbeing: {
                burnoutRisk: pkg.wellbeing?.currentBurnoutRisk || 0,
                restDaysRemaining: Math.max(0, (pkg.wellbeing?.restDaysTotal || 2) - (pkg.wellbeing?.restDaysUsed || 0)),
                recentMood: (Array.isArray(pkg.wellbeing?.moodTrend) ? pkg.wellbeing.moodTrend : []).slice(-1)[0]?.mood || 'neutral'
            },
            momentum: {
                currentStreak: pkg.momentum?.currentStreak || 0,
                longestStreak: pkg.momentum?.longestStreak || 0,
                weeklyActiveMinutes: pkg.momentum?.weeklyActiveMinutes || 0
            },
            career: {
                targetRole: pkg.career?.targetRole || 'Not Defined',
                readinessScore: pkg.career?.readinessScore || 0
            },
            guardian: {
                pendingAlerts: pkg.guardianState?.pendingAlerts?.length || 0,
                shadowMode: pkg.guardianState?.shadowMode?.active || false
            }
        };

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('[PKG Controller] Error getting PKG summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve PKG summary'
        });
    }
}

/**
 * POST /api/pkg/initialize
 * Force initialize PKG for existing user (for migration)
 */
export async function initializePKG(req, res) {
    try {
        const userId = req.user.userId;

        // Check if already exists
        const exists = await pkgService.pkgExists(userId);
        if (exists) {
            const pkg = await pkgService.getPKG(userId);
            return res.json({
                success: true,
                data: pkg,
                message: 'PKG already exists'
            });
        }

        // Create new PKG
        const pkg = await pkgService.getPKG(userId); // getOrCreate

        res.json({
            success: true,
            data: pkg,
            message: 'PKG initialized successfully'
        });
    } catch (error) {
        console.error('[PKG Controller] Error initializing PKG:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize PKG'
        });
    }
}

export default {
    getPKG,
    updatePKG,
    processEvent,
    getPKGSummary,
    initializePKG
};
