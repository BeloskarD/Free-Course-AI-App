/**
 * MISSION CONTROLLER
 * ==================
 * Express controller for Learning Missions API.
 * 
 * Endpoints:
 * - POST   /api/missions              - Create mission
 * - GET    /api/missions              - Get user's missions
 * - GET    /api/missions/:id          - Get mission details
 * - POST   /api/missions/:id/start    - Start a mission
 * - POST   /api/missions/:id/stage    - Update stage progress
 * - POST   /api/missions/:id/skip     - Skip a stage
 * - POST   /api/missions/:id/complete - Complete mission
 * - POST   /api/missions/:id/abandon  - Abandon mission
 * - POST   /api/missions/:id/pause    - Pause mission
 * - POST   /api/missions/:id/resume   - Resume mission
 * - GET    /api/missions/recommended  - Get recommended missions
 * - POST   /api/missions/from-course  - Create from saved course
 * - POST   /api/missions/from-roadmap - Create from roadmap
 */

import missionService from '../services/mission.service.js';

/**
 * POST /api/missions
 * Create a new mission
 */
export async function createMission(req, res) {
    try {
        const userId = req.user.userId;
        const missionData = req.body;

        const mission = await missionService.createMission(missionData, userId);

        res.status(201).json({
            success: true,
            data: mission,
            message: 'Mission created successfully'
        });
    } catch (error) {
        console.error('[Mission Controller] Create error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * GET /api/missions
 * Get user's missions (active, completed, etc.)
 */
export async function getUserMissions(req, res) {
    try {
        const userId = req.user.userId;
        const { status } = req.query; // 'active', 'completed', 'all'

        let missions;
        if (status === 'completed') {
            missions = await missionService.getUserCompletedMissions(userId);
        } else if (status === 'active') {
            missions = await missionService.getUserActiveMissions(userId);
        } else {
            // Return both
            const active = await missionService.getUserActiveMissions(userId);
            const completed = await missionService.getUserCompletedMissions(userId);
            missions = { active, completed };
        }

        res.json({
            success: true,
            data: missions
        });
    } catch (error) {
        console.error('[Mission Controller] Get missions error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * GET /api/missions/:id
 * Get mission details with user progress
 */
export async function getMission(req, res) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const result = await missionService.getMissionWithProgress(id, userId);
        if (!result) {
            return res.status(404).json({ success: false, error: 'Mission not found' });
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('[Mission Controller] Get mission error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/missions/:id/start
 * Start a mission
 */
export async function startMission(req, res) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const progress = await missionService.startMission(id, userId);

        res.json({
            success: true,
            data: progress,
            message: 'Mission started successfully'
        });
    } catch (error) {
        console.error('[Mission Controller] Start error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/missions/:id/stage
 * Update stage progress
 * Body: { stageId, score, timeSpent, passed }
 */
export async function updateStage(req, res) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { stageId, score, timeSpent, passed } = req.body;

        if (!stageId) {
            return res.status(400).json({
                success: false,
                error: 'stageId is required'
            });
        }

        const result = await missionService.updateStageProgress(id, userId, stageId, {
            score: score || 0,
            timeSpent: timeSpent || 0,
            passed
        });

        res.json({
            success: true,
            data: result,
            message: result.stagePassed ? 'Stage completed!' : 'Stage result recorded'
        });
    } catch (error) {
        console.error('[Mission Controller] Update stage error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/missions/:id/skip
 * Skip a stage (if eligible)
 * Body: { stageId, reason }
 */
export async function skipStage(req, res) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { stageId, reason } = req.body;

        const result = await missionService.skipStage(id, userId, stageId, reason);

        res.json({
            success: true,
            data: result,
            message: 'Stage skipped'
        });
    } catch (error) {
        console.error('[Mission Controller] Skip stage error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/missions/:id/complete
 * Complete a mission
 */
export async function completeMission(req, res) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const result = await missionService.completeMission(id, userId);

        res.json({
            success: true,
            data: result,
            message: 'Mission completed! Great job!'
        });
    } catch (error) {
        console.error('[Mission Controller] Complete error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/missions/:id/abandon
 * Abandon a mission
 * Body: { reason }
 */
export async function abandonMission(req, res) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { reason } = req.body;

        const result = await missionService.abandonMission(id, userId, reason || 'other');

        res.json({
            success: true,
            data: result,
            message: 'Mission abandoned'
        });
    } catch (error) {
        console.error('[Mission Controller] Abandon error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/missions/:id/pause
 * Pause a mission
 */
export async function pauseMission(req, res) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const progress = await missionService.pauseMission(id, userId);

        res.json({
            success: true,
            data: progress,
            message: 'Mission paused'
        });
    } catch (error) {
        console.error('[Mission Controller] Pause error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/missions/:id/resume
 * Resume a paused mission
 */
export async function resumeMission(req, res) {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const progress = await missionService.resumeMission(id, userId);

        res.json({
            success: true,
            data: progress,
            message: 'Mission resumed'
        });
    } catch (error) {
        console.error('[Mission Controller] Resume error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * GET /api/missions/recommended
 * Get recommended missions based on PKG
 */
export async function getRecommended(req, res) {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 5;

        const missions = await missionService.getRecommendedMissions(userId, limit);

        res.json({
            success: true,
            data: missions
        });
    } catch (error) {
        console.error('[Mission Controller] Recommendations error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/missions/from-course
 * Create mission from a saved course
 * Body: { course: { title, skill, link, platform, duration } }
 */
export async function createFromCourse(req, res) {
    try {
        const userId = req.user.userId;
        const { course } = req.body;

        if (!course || !course.title) {
            return res.status(400).json({
                success: false,
                error: 'Course data with title is required'
            });
        }

        // 1. Create the mission template
        const mission = await missionService.createFromSavedCourse(course, userId);

        // 2. Automatically start it for the user so it shows up in "Active Missions"
        const progress = await missionService.startMission(mission._id, userId);

        res.status(201).json({
            success: true,
            data: {
                mission,
                progress
            },
            message: 'Mission created and started successfully! 🚀'
        });
    } catch (error) {
        console.error('[Mission Controller] From course error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * POST /api/missions/from-roadmap
 * Create missions from an AI roadmap
 * Body: { roadmap: { skill, milestones: [...] } }
 */
export async function createFromRoadmap(req, res) {
    try {
        const userId = req.user.userId;
        const { roadmap } = req.body;

        if (!roadmap || !roadmap.milestones) {
            return res.status(400).json({
                success: false,
                error: 'Roadmap with milestones is required'
            });
        }

        const missions = await missionService.createFromRoadmap(roadmap, userId);

        res.status(201).json({
            success: true,
            data: missions,
            message: `${missions.length} missions created from roadmap`
        });
    } catch (error) {
        console.error('[Mission Controller] From roadmap error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

export default {
    createMission,
    getUserMissions,
    getMission,
    startMission,
    updateStage,
    skipStage,
    completeMission,
    abandonMission,
    pauseMission,
    resumeMission,
    getRecommended,
    createFromCourse,
    createFromRoadmap
};
