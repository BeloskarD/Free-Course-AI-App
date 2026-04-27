import express from 'express';
import { authenticate } from '../middleware/auth.js';
import intelligenceController from '../controllers/intelligence.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/proofs', intelligenceController.getProofs);
router.post('/proofs/:id/publish', intelligenceController.publishProof);
router.get('/proofs/recruiter-feed', intelligenceController.getRecruiterFeed);
router.post('/proofs/:id/share', intelligenceController.shareProof);
router.patch('/proofs/:id/visibility', intelligenceController.toggleVisibility);

export default router;
