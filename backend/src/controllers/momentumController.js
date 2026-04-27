import momentumService from '../services/momentumService.js';

/**
 * MOMENTUM CONTROLLER
 * ===================
 * Refactored to use MomentumService (Phase 3).
 */

export const getMomentumData = async (req, res) => {
    try {
        const data = await momentumService.getMomentumData(req.userId);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching momentum data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch momentum data', error: error.message });
    }
};

export const getStats = async (req, res) => {
    try {
        const data = await momentumService.getStats(req.userId);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};

export const getActivityData = async (req, res) => {
    try {
        const data = await momentumService.getMomentumData(req.userId);
        res.json({ success: true, data: data.activityData });
    } catch (error) {
        console.error('Error fetching activity data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch activity data' });
    }
};

export const getWeeklyProgress = async (req, res) => {
    try {
        const data = await momentumService.getMomentumData(req.userId);
        res.json({ success: true, data: data.weeklyProgress });
    } catch (error) {
        console.error('Error fetching weekly progress:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch weekly progress' });
    }
};

export const getSkills = async (req, res) => {
    try {
        const data = await momentumService.getMomentumData(req.userId);
        res.json({ success: true, data: data.skills });
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch skills' });
    }
};

export const getAchievements = async (req, res) => {
    try {
        const data = await momentumService.getMomentumData(req.userId);
        res.json({ success: true, data: data.achievements });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch achievements' });
    }
};

export const unlockAchievement = async (req, res) => {
    try {
        const result = await momentumService.unlockAchievement(req.userId, req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error unlocking achievement:', error);
        res.status(500).json({ success: false, message: 'Failed to unlock achievement' });
    }
};

export const updateSkillProgress = async (req, res) => {
    try {
        const result = await momentumService.updateSkillProgress(req.userId, req.params.skillName, req.body.progress);
        res.json(result);
    } catch (error) {
        console.error('Error updating skill progress:', error);
        res.status(500).json({ success: false, message: 'Failed to update skill progress' });
    }
};
