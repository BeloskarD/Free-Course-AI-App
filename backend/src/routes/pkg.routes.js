import express from 'express';
import { authenticate } from '../middleware/auth.js';
import pkgController from '../controllers/pkg.controller.js';

/**
 * PKG ROUTES
 * ==========
 * Express routes for Personal Knowledge Genome API
 * 
 * All routes require authentication.
 * 
 * Endpoints:
 * - GET    /api/pkg           - Get full PKG
 * - PATCH  /api/pkg           - Path-based update
 * - POST   /api/pkg/event     - Event-driven update
 * - GET    /api/pkg/summary   - Lightweight summary
 * - POST   /api/pkg/initialize - Force initialize (migration)
 */

const router = express.Router();

// All PKG routes require authentication
router.use(authenticate);

// GET /api/pkg - Get full PKG for authenticated user
router.get('/', pkgController.getPKG);

// PATCH /api/pkg - Update PKG using path-based approach
// Body: { path: 'skills.javascript.health', value: 85 }
// Or: { updates: [{ path: '...', value: ... }, ...] }
router.patch('/', pkgController.updatePKG);

// POST /api/pkg/event - Process an event and update PKG
// Body: { type: 'challenge_completed', data: { skill, topic, score, ... } }
router.post('/event', pkgController.processEvent);

// GET /api/pkg/summary - Lightweight summary for dashboard widgets
router.get('/summary', pkgController.getPKGSummary);

// POST /api/pkg/initialize - Force initialize PKG (for existing users migration)
router.post('/initialize', pkgController.initializePKG);

export default router;
