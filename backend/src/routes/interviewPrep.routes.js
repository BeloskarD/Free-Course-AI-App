import express from 'express';
import { getPrepKit } from '../controllers/interviewPrep.controller.js';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';

const router = express.Router();

// CORRECTION 1: Entitlements only — NO hard gate
// Free users get partial prep kit (2 questions, basic difficulty)
// Pro/Career+ get full kit with strategies and pressure analysis
router.post('/generate', authenticate, subscriptionGuard('interviewPrep'), getPrepKit);

export default router;
