import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';
import intelligenceController from '../controllers/intelligence.controller.js';

const router = express.Router();
router.use(authenticate);

// CORRECTION 2: Entitlements only — NO hard gate
// Free users see partial proofs/feed, locked strategic details
router.get('/proofs', subscriptionGuard('intelligence'), intelligenceController.getProofs);
router.post('/proofs/:id/publish', subscriptionGuard('intelligence'), intelligenceController.publishProof);
router.get('/proofs/recruiter-feed', subscriptionGuard('intelligence'), intelligenceController.getRecruiterFeed);
router.post('/proofs/:id/share', intelligenceController.shareProof);
router.patch('/proofs/:id/visibility', intelligenceController.toggleVisibility);

export default router;
