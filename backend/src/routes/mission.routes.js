/**
 * MISSION ROUTES
 * ==============
 * Express routes for Learning Missions API
 * 
 * All routes require authentication.
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import missionController from '../controllers/mission.controller.js';

const router = express.Router();

// All Mission routes require authentication
router.use(authenticate);

// ========================================
// MISSION CRUD
// ========================================

// POST /api/missions - Create a new mission
router.post('/', missionController.createMission);

// GET /api/missions - Get user's missions
// Query: ?status=active|completed|all
router.get('/', missionController.getUserMissions);

// GET /api/missions/recommended - Get recommended missions
// IMPORTANT: Place before /:id to avoid conflict
router.get('/recommended', missionController.getRecommended);

// ========================================
// MISSION CREATION FROM SOURCES
// IMPORTANT: These must come BEFORE /:id routes
// ========================================

// POST /api/missions/from-course - Create from saved course
// Body: { course: { title, skill, link, platform, duration } }
router.post('/from-course', missionController.createFromCourse);

// POST /api/missions/from-roadmap - Create from AI roadmap
// Body: { roadmap: { skill, milestones: [...] } }
router.post('/from-roadmap', missionController.createFromRoadmap);

// ========================================
// MISSION BY ID (must come AFTER specific routes)
// ========================================

// GET /api/missions/:id - Get mission details with progress
router.get('/:id', missionController.getMission);

// ========================================
// MISSION PROGRESS
// ========================================

// POST /api/missions/:id/start - Start a mission
router.post('/:id/start', missionController.startMission);

// POST /api/missions/:id/stage - Update stage progress
// Body: { stageId, score, timeSpent, passed }
router.post('/:id/stage', missionController.updateStage);

// POST /api/missions/:id/skip - Skip a stage
// Body: { stageId, reason }
router.post('/:id/skip', missionController.skipStage);

// POST /api/missions/:id/complete - Complete mission
router.post('/:id/complete', missionController.completeMission);

// POST /api/missions/:id/abandon - Abandon mission
// Body: { reason }
router.post('/:id/abandon', missionController.abandonMission);

// POST /api/missions/:id/pause - Pause mission
router.post('/:id/pause', missionController.pauseMission);

// POST /api/missions/:id/resume - Resume mission
router.post('/:id/resume', missionController.resumeMission);

export default router;
