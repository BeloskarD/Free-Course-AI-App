import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';
import { getNetworkInsight, analyzeNetworkPaths } from '../controllers/networkInsight.controller.js';

/**
 * NETWORK INSIGHT ROUTES
 * =======================
 * /api/network-insight
 * Career+ exclusive — hard-gated via requireFeature
 */

const router = express.Router();
router.use(authenticate);

// GET  /api/network-insight        — Career+ only: full network intelligence
router.get('/', subscriptionGuard('networkInsight'), getNetworkInsight);

// POST /api/network-insight/analyze — Career+ only: analyze network paths
router.post('/analyze', subscriptionGuard('networkInsight'), analyzeNetworkPaths);

export default router;
