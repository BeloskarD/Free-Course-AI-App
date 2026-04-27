import express from 'express';
import {
    sendMessage,
    getHistory,
    clearHistory,
    switchMode
} from '../controllers/companion.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Use optional auth - works for both logged-in and guest users
router.post('/message', optionalAuth, sendMessage);
router.get('/history', optionalAuth, getHistory);
router.delete('/clear', optionalAuth, clearHistory);
router.patch('/mode', optionalAuth, switchMode);

export default router;
