import express from 'express';
import { authenticate } from '../middleware/auth.js';
import careerController from '../controllers/career.controller.js';
import growthController from '../controllers/growth.controller.js';

const router = express.Router();

// All career routes require authentication
router.get('/ping', (req, res) => res.json({ status: 'ok', timestamp: new Date(), service: 'Career Engine' }));

router.use(authenticate);

/**
 * @route GET /api/career/readiness
 * @desc Get dynamic hiring readiness score and breakdown
 */
router.get('/readiness', careerController.getHiringReadiness);

/**
 * @route GET /api/career/radar
 * @desc Get radar breakdown mapped to target role
 */
router.get('/radar', careerController.getRadarBreakdown);

/**
 * @route GET /api/career/timeline
 * @desc Get data-driven career timeline projection
 */
router.get('/timeline', careerController.getCareerTimeline);

/**
 * @route POST /api/career/validate
 * @desc Perform skill validation (MCQ, Code, Project)
 */
router.post('/validate', careerController.validateSkill);
router.get('/generate-probe', careerController.generateProbe);
router.get('/generate-strategy', careerController.generateStrategy);

/**
 * @route GET /api/career/notifications
 * @desc Get latest career notifications and alerts
 */
router.get('/notifications', careerController.getNotifications);

/**
 * @route PATCH /api/career/notifications/:id/read
 * @desc Mark notification as read
 */
router.patch('/notifications/:id/read', careerController.markNotificationAsRead);
router.delete('/notifications/:id', careerController.deleteNotification);

/**
 * @route GET /api/career/daily-actions
 * @desc Get 3 prioritized data-driven actions
 */
router.get('/daily-actions', growthController.getDailyActions);

/**
 * @route POST /api/career/onboarding
 * @desc Complete onboarding and set target role
 */
router.post('/onboarding', growthController.completeOnboarding);

/**
 * @route POST /api/career/feedback
 * @desc Submit feature feedback
 */
router.post('/feedback', growthController.submitFeedback);

/**
 * @route POST /api/career/activity
 * @desc Log feature usage and session counts
 */
router.post('/activity', growthController.logActivity);

export default router;
