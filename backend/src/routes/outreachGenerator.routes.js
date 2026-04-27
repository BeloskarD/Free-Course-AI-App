import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateOutreach, getOutreachStatus } from '../controllers/outreachGenerator.controller.js';

/**
 * OUTREACH GENERATOR ROUTES
 * ==========================
 * /api/outreach-generator
 */

const router = express.Router();
router.use(authenticate);

// POST /api/outreach-generator/generate — Generate outreach messages (gated)
router.post('/generate', generateOutreach);

// GET  /api/outreach-generator/status   — Check gate status
router.get('/status', getOutreachStatus);

export default router;
