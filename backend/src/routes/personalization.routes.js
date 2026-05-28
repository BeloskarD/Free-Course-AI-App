import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';
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

// Profile endpoints — unguarded (core UX)
router.get('/profile', getProfile);
router.post('/profile', updateProfile);

// Weekly plan endpoints — unguarded (core UX)
router.get('/plan', async (req, res) => {
    const LearnerProfile = (await import('../models/LearnerProfile.js')).default;
    const profile = await LearnerProfile.findOne({ userId: req.userId });
    res.json({ success: true, plan: profile?.currentPlan || null });
});
router.post('/plan/generate', generateWeeklyPlan);

// Task management — unguarded (core UX)
router.patch('/task/:taskId', updateTaskStatus);

// Session logging — unguarded
router.post('/session', logSession);

// Skill graph & readiness — entitlements injected for response shaping
router.get('/skill-graph', subscriptionGuard('personalization'), getSkillGraph);
router.get('/readiness', subscriptionGuard('personalization'), getReadiness);

// ═══════════════════════════════════════════════════════════════
// 🧘 WELLBEING & BURNOUT PREVENTION ROUTES — unguarded (core UX)
// ═══════════════════════════════════════════════════════════════
router.get('/wellbeing', getWellbeingStatus);
router.post('/wellbeing/break', logBreak);
router.post('/wellbeing/streak-pause', requestStreakPause);
router.post('/wellbeing/mood', logMood);
router.patch('/wellbeing/settings', updateWellbeingSettings);
router.post('/wellbeing/dismiss-break', dismissBreakReminder);

export default router;
