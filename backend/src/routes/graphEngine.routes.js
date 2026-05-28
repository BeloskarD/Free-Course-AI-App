import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';
import graphEngineController from '../controllers/graphEngine.controller.js';

const router = express.Router();
router.use(authenticate);

// Core graph data — entitlements injected, controllers shape by tier
router.get('/', subscriptionGuard('graphEngine'), graphEngineController.getFullGraph);
router.get('/clusters', subscriptionGuard('graphEngine'), graphEngineController.getClusters);
router.post('/recalculate', graphEngineController.recalculateGraph);
router.get('/skill/:skillName', graphEngineController.getSkillNode);
router.get('/evolution', subscriptionGuard('graphEngine'), graphEngineController.getEvolution);

export default router;
