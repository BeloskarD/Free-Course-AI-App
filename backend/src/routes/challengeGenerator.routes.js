import express from 'express';
import { authenticate } from '../middleware/auth.js';
import challengeGeneratorController from '../controllers/challengeGenerator.controller.js';

const router = express.Router();
router.use(authenticate);

router.post('/generate', challengeGeneratorController.generateChallenge);
router.get('/suggestions', challengeGeneratorController.getSuggestions);
router.get('/history', challengeGeneratorController.getHistory);
router.post('/submit', challengeGeneratorController.submitResult);

export default router;
