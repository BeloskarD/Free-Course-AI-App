/**
 * MISSION ROUTES
 * ==============
 * Express routes for Learning Missions API
 * 
 * All routes require authentication.
 * subscriptionGuard injects entitlements on read routes.
 * Mission CRUD (create, start, complete, abandon) stays unguarded to preserve core loop.
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';
import missionController from '../controllers/mission.controller.js';

const router = express.Router();

// All Mission routes require authentication
router.use(authenticate);

// ========================================
// MISSION CRUD — entitlements injected on reads
// ========================================

// POST /api/missions - Create a new mission
router.post('/', missionController.createMission);

// GET /api/missions - Get user's missions (entitlements injected)
router.get('/', subscriptionGuard('missions'), missionController.getUserMissions);

// GET /api/missions/recommended - Get recommended missions
router.get('/recommended', subscriptionGuard('missions'), missionController.getRecommended);

// ========================================
// MISSION CREATION FROM SOURCES
// ========================================

router.post('/from-course', missionController.createFromCourse);
router.post('/from-roadmap', missionController.createFromRoadmap);

// ========================================
// MISSION BY ID
// ========================================

router.get('/:id', missionController.getMission);

// ========================================
// MISSION PROGRESS — stays unguarded (core loop)
// ========================================

router.post('/:id/start', missionController.startMission);
router.post('/:id/stage', missionController.updateStage);
router.post('/:id/skip', missionController.skipStage);
router.post('/:id/complete', missionController.completeMission);
router.post('/:id/abandon', missionController.abandonMission);
router.post('/:id/pause', missionController.pauseMission);
router.post('/:id/resume', missionController.resumeMission);

export default router;
