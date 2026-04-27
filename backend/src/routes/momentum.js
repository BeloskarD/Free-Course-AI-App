import express from 'express';
import {
  getMomentumData,
  getStats,
  getActivityData,
  getWeeklyProgress,
  getSkills,
  getAchievements,
  unlockAchievement,
  updateSkillProgress,
} from '../controllers/momentumController.js';
import { authenticate } from '../middleware/auth.js';
import { requireCache } from '../middleware/cache.middleware.js';

const router = express.Router();

// Main momentum endpoint
router.get('/', authenticate, requireCache(60000), getMomentumData); // 1 min TTL

// Individual endpoints
router.get('/stats', authenticate, requireCache(60000), getStats);
router.get('/activity', authenticate, requireCache(60000), getActivityData);
router.get('/weekly-progress', authenticate, requireCache(60000), getWeeklyProgress);
router.get('/skills', authenticate, requireCache(60000), getSkills);
router.get('/achievements', authenticate, requireCache(60000), getAchievements);

// Update endpoints
router.post('/achievement/:id/unlock', authenticate, unlockAchievement);
router.patch('/skill/:skillName/progress', authenticate, updateSkillProgress);

export default router;
