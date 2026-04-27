import express from 'express';
import { resumeOrchestrator } from '../controllers/aiResume.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Main AI Resume Orchestrator endpoint
router.post('/resume-orchestrator', authenticate, resumeOrchestrator);

export default router;
