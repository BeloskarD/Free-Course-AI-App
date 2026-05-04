import express from 'express';
import billingController from '../controllers/billing.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/webhook', billingController.handleWebhook);
router.get('/plans', billingController.getPlans);

router.use(authenticate);

router.get('/subscription', billingController.getSubscription);
router.post('/checkout-session', billingController.createCheckoutSession);
router.post('/portal-session', billingController.createPortalSession);

export default router;
