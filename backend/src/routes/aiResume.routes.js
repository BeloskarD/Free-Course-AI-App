import express from 'express';
import { resumeOrchestrator } from '../controllers/aiResume.controller.js';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';

const router = express.Router();

// AI Resume Orchestrator — entitlements injected, controller shapes response by tier
router.post('/resume-orchestrator', authenticate, subscriptionGuard('aiResume'), resumeOrchestrator);

export default router;
