import express from 'express';
import { authenticate,optionalAuth } from '../middleware/auth.js';
import { 
  analyzeSkillGap, 
  calculateLearningVelocity,
  estimateSkillProficiency,
  suggestCareerPaths
} from '../controllers/skillAnalysis.controller.js';
import { requireCache } from '../middleware/cache.middleware.js';

const router = express.Router();

// All routes require authentication
// router.post('/analyze-gap', authenticate, analyzeSkillGap);
router.post('/analyze-gap', optionalAuth, analyzeSkillGap);
router.get('/learning-velocity', authenticate, requireCache(300000), calculateLearningVelocity); // 5 min
router.get('/skill-proficiency', authenticate, requireCache(300000), estimateSkillProficiency); // 5 min
router.get('/career-paths', authenticate, requireCache(300000), suggestCareerPaths); // 5 min

export default router;
