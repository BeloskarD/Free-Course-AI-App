import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';
import reinforcementController from '../controllers/reinforcement.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/status', reinforcementController.getStatus);
router.get('/interventions', reinforcementController.getInterventions);
router.post('/acknowledge/:interventionId', reinforcementController.acknowledgeIntervention);
router.get('/analytics', subscriptionGuard('reinforcement'), reinforcementController.getAnalytics);

export default router;
