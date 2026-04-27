/**
 * GUARDIAN ROUTES
 * ===============
 * Express routes for Cognitive Guardian API
 * 
 * All routes require authentication.
 * 
 * Endpoints:
 * - POST /api/guardian/evaluate  - Full evaluation with session context
 * - GET  /api/guardian/status    - Get guardian status
 * - POST /api/guardian/quick     - Quick P0/P1 check only
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import guardianController from '../controllers/guardian.controller.js';

const router = express.Router();

// All Guardian routes require authentication
router.use(authenticate);

// POST /api/guardian/evaluate
// Body: { sessionDuration, currentPage, interventionsThisSession }
// Returns: Full intervention decision
router.post('/evaluate', guardianController.evaluate);

// GET /api/guardian/status
// Returns: Guardian status summary
router.get('/status', guardianController.getStatus);

// POST /api/guardian/quick
// Returns: Quick check for P0/P1 only
router.post('/quick', guardianController.quickCheck);

export default router;
