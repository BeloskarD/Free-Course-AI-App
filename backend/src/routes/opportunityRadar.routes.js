import express from 'express';
import { authenticate } from '../middleware/auth.js';
import opportunityRadarController from '../controllers/opportunityRadar.controller.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';

const router = express.Router();
router.use(authenticate);

router.post('/ingest', opportunityRadarController.ingestSignals);
router.get('/radar', subscriptionGuard('radar', { limitKey: 'searchLimit' }), opportunityRadarController.getRadar);
router.get('/saved', opportunityRadarController.getSavedMatches);
router.post('/ai-scan', subscriptionGuard('radar', { requireFeature: 'radarAccess' }), opportunityRadarController.aiScan);
router.patch('/:signalId/status', opportunityRadarController.updateMatchStatus);
router.get('/trends', opportunityRadarController.getTrends);

export default router;
