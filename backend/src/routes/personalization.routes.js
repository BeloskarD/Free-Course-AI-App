import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getProfile,
    updateProfile,
    generateWeeklyPlan,
    updateTaskStatus,
    logSession,
    getSkillGraph,
    getReadiness,
    // 🧘 Wellbeing endpoints
    getWellbeingStatus,
    logBreak,
    requestStreakPause,
    logMood,
    updateWellbeingSettings,
    dismissBreakReminder,
} from '../controllers/personalization.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile endpoints
router.get('/profile', getProfile);
router.post('/profile', updateProfile);

// Weekly plan endpoints
router.get('/plan', async (req, res) => {
    const LearnerProfile = (await import('../models/LearnerProfile.js')).default;
    const profile = await LearnerProfile.findOne({ userId: req.userId });
    res.json({ success: true, plan: profile?.currentPlan || null });
});
router.post('/plan/generate', generateWeeklyPlan);

// Task management
router.patch('/task/:taskId', updateTaskStatus);

// Session logging
router.post('/session', logSession);

// Skill graph
router.get('/skill-graph', getSkillGraph);
router.get('/readiness', getReadiness);

// ═══════════════════════════════════════════════════════════════
// 🧘 WELLBEING & BURNOUT PREVENTION ROUTES
// ═══════════════════════════════════════════════════════════════
router.get('/wellbeing', getWellbeingStatus);           // Get burnout risk & wellbeing status
router.post('/wellbeing/break', logBreak);               // Log a break taken
router.post('/wellbeing/streak-pause', requestStreakPause); // Schedule guilt-free rest day
router.post('/wellbeing/mood', logMood);                 // Log mood check-in
router.patch('/wellbeing/settings', updateWellbeingSettings); // Update rest day preferences
router.post('/wellbeing/dismiss-break', dismissBreakReminder); // Track dismissed reminders

export default router;
