import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';
import challengeGeneratorController from '../controllers/challengeGenerator.controller.js';

const router = express.Router();
router.use(authenticate);

// Challenge generation — entitlements injected for tier-aware limits
router.post('/generate', subscriptionGuard('challenges'), challengeGeneratorController.generateChallenge);
router.get('/suggestions', subscriptionGuard('challenges'), challengeGeneratorController.getSuggestions);
router.get('/history', challengeGeneratorController.getHistory);
router.post('/submit', challengeGeneratorController.submitResult);

export default router;
