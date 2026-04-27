import express from 'express';
import { authenticate } from '../middleware/auth.js';
import graphEngineController from '../controllers/graphEngine.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', graphEngineController.getFullGraph);
router.get('/clusters', graphEngineController.getClusters);
router.post('/recalculate', graphEngineController.recalculateGraph);
router.get('/skill/:skillName', graphEngineController.getSkillNode);
router.get('/evolution', graphEngineController.getEvolution);

export default router;
