import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';
import { 
  analyzeSkillGap, 
  analyzeSkillGapStatus,
  calculateLearningVelocity,
  estimateSkillProficiency,
  suggestCareerPaths
} from '../controllers/skillAnalysis.controller.js';
import { requireCache } from '../middleware/cache.middleware.js';

const router = express.Router();

// All routes require authentication
// router.post('/analyze-gap', authenticate, analyzeSkillGap);
router.post('/analyze-gap', optionalAuth, subscriptionGuard('aiSearch'), analyzeSkillGap);
router.get('/job-status/:jobId', optionalAuth, subscriptionGuard('aiSearch'), analyzeSkillGapStatus);
router.get('/learning-velocity', authenticate, subscriptionGuard('learningVelocity'), requireCache(300000), calculateLearningVelocity); // 5 min
router.get('/skill-proficiency', authenticate, subscriptionGuard('skillProficiency'), requireCache(300000), estimateSkillProficiency); // 5 min
router.get('/career-paths', authenticate, subscriptionGuard('careerPaths'), requireCache(300000), suggestCareerPaths); // 5 min

export default router;
