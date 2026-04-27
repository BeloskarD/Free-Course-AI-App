import personalizationService from '../services/personalizationService.js';
import wellbeingService from '../services/wellbeingService.js';
import cacheUtils from '../utils/cacheUtils.js';

/**
 * GET /api/personalization/profile
 */
export async function getProfile(req, res) {
    try {
        const cacheKey = `profile_${req.userId}`;
        let profile = cacheUtils.getCache(cacheKey);
        
        if (!profile) {
            profile = await personalizationService.getProfile(req.userId);
            cacheUtils.setCache(cacheKey, profile, 60); // Cache for 60 seconds
        } else {
            console.log(`⚡ [Cache] Serving Profile for ${req.userId}`);
        }
        res.json({ success: true, profile });
    } catch (error) {
        console.error('❌ Get Profile Error:', error.message);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/personalization/profile
 */
export async function updateProfile(req, res) {
    try {
        const profile = await personalizationService.updateProfile(req.userId, req.body);
        // Invalidate profile cache
        cacheUtils.delCache(`profile_${req.userId}`);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile,
        });
    } catch (error) {
        console.error('❌ Update Profile Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/personalization/plan/generate
 */
export async function generateWeeklyPlan(req, res) {
    try {
        const result = await personalizationService.generateWeeklyPlan(req.userId);
        cacheUtils.delCache(`profile_${req.userId}`);
        res.json({
            success: true,
            plan: result.plan,
            weeklyFocus: result.weeklyFocus,
            motivationalNote: result.motivationalNote,
            insights: result.insights,
        });
    } catch (error) {
        console.error('❌ Generate Plan Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * PATCH /api/personalization/task/:taskId
 */
export async function updateTaskStatus(req, res) {
    try {
        const profile = await personalizationService.updateTaskStatus(req.userId, req.params.taskId, req.body.status);
        cacheUtils.delCache(`profile_${req.userId}`);
        res.json({ 
            success: true, 
            message: 'Task updated', 
            task: profile.currentPlan.tasks.find(t => t.id === req.params.taskId) 
        });
    } catch (error) {
        console.error('❌ Update Task Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/personalization/session
 */
export async function logSession(req, res) {
    try {
        await personalizationService.logSession(req.userId, req.body);
        cacheUtils.delCache(`profile_${req.userId}`);
        cacheUtils.delCache(`skillgraph_${req.userId}`);
        res.json({ success: true, message: 'Session logged' });
    } catch (error) {
        console.error('❌ Log Session Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/personalization/skill-graph
 */
export async function getSkillGraph(req, res) {
    try {
        const cacheKey = `skillgraph_${req.userId}`;
        let data = cacheUtils.getCache(cacheKey);
        
        if (!data) {
            data = await personalizationService.getSkillGraph(req.userId);
            cacheUtils.setCache(cacheKey, data, 300); // Cache for 5 minutes
        } else {
            console.log(`⚡ [Cache] Serving SkillGraph for ${req.userId}`);
        }
        res.json({ success: true, ...data });
    } catch (error) {
        console.error('❌ Skill Graph Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/personalization/readiness
 */
export async function getReadiness(req, res) {
    try {
        const cacheKey = `readiness_${req.userId}`;
        let data = cacheUtils.getCache(cacheKey);
        
        if (!data) {
            data = await personalizationService.getReadiness(req.userId);
            cacheUtils.setCache(cacheKey, data, 300); // Cache for 5 minutes
        }
        res.json({ success: true, ...data });
    } catch (error) {
        console.error('❌ Readiness Score Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/personalization/wellbeing
 */
export async function getWellbeingStatus(req, res) {
    try {
        const wellbeing = await wellbeingService.getStatus(req.userId);
        res.json({ success: true, wellbeing });
    } catch (error) {
        console.error('❌ Wellbeing Status Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/personalization/wellbeing/break
 */
export async function logBreak(req, res) {
    try {
        await wellbeingService.logBreak(req.userId, req.body.duration);
        res.json({ success: true, message: 'Break logged!' });
    } catch (error) {
        console.error('❌ Log Break Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/personalization/wellbeing/streak-pause
 */
export async function requestStreakPause(req, res) {
    try {
        await wellbeingService.requestStreakPause(req.userId, req.body.date, req.body.reason);
        res.json({ success: true, message: 'Streak pause requested' });
    } catch (error) {
        console.error('❌ Streak Pause Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/personalization/wellbeing/mood
 */
export async function logMood(req, res) {
    try {
        await wellbeingService.logMood(req.userId, req.body);
        res.json({ success: true, message: 'Mood logged' });
    } catch (error) {
        console.error('❌ Log Mood Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * PATCH /api/personalization/wellbeing/settings
 */
export async function updateWellbeingSettings(req, res) {
    try {
        await wellbeingService.updateSettings(req.userId, req.body);
        res.json({ success: true, message: 'Wellbeing settings updated' });
    } catch (error) {
        console.error('❌ Update Wellbeing Settings Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/personalization/wellbeing/dismiss-break
 */
export async function dismissBreakReminder(req, res) {
    try {
        // Placeholder for tracking dismissed reminders
        res.json({ success: true, message: 'Reminder dismissed' });
    } catch (error) {
        console.error('❌ Dismiss Break Error:', error);
        res.status(500).json({ error: error.message });
    }
}
