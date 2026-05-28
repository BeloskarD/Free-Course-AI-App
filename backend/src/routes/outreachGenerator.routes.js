import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';
import { generateOutreach, getOutreachStatus } from '../controllers/outreachGenerator.controller.js';

/**
 * OUTREACH GENERATOR ROUTES
 * ==========================
 * /api/outreach-generator
 * Career+ exclusive — hard-gated via requireFeature
 */

const router = express.Router();
router.use(authenticate);

// POST /api/outreach-generator/generate — Career+ only: generate outreach messages
router.post('/generate', subscriptionGuard('outreach', { requireFeature: 'personalizedOutreach' }), generateOutreach);

// GET  /api/outreach-generator/status   — Check gate status (open to all for UI awareness)
router.get('/status', subscriptionGuard('outreach'), getOutreachStatus);

export default router;
