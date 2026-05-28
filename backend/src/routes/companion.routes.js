import express from 'express';
import {
    sendMessage,
    getHistory,
    clearHistory,
    switchMode
} from '../controllers/companion.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';

const router = express.Router();

// Use optional auth - works for both logged-in and guest users
// subscriptionGuard injects entitlements + enforces chat limits for logged-in users
// Guest rate limiting is handled separately inside the controller
router.post('/message', optionalAuth, subscriptionGuard('companionChat', { limitKey: 'chatLimit' }), sendMessage);
router.get('/history', optionalAuth, getHistory);
router.delete('/clear', optionalAuth, clearHistory);
router.patch('/mode', optionalAuth, switchMode);

export default router;
