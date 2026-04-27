import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNetworkInsight, analyzeNetworkPaths } from '../controllers/networkInsight.controller.js';

/**
 * NETWORK INSIGHT ROUTES
 * =======================
 * /api/network-insight
 */

const router = express.Router();
router.use(authenticate);

// GET  /api/network-insight        — Career insight with network layer
router.get('/', getNetworkInsight);

// POST /api/network-insight/analyze — Analyze network paths for a specific signal
router.post('/analyze', analyzeNetworkPaths);

export default router;
