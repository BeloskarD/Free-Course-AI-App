import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getDashboard,
    recalculateHealth,
    getChallenges,
    submitAnswer,
    generateAIChallenge,
    claimProofBadge,
    getNotifications
} from '../controllers/skillHealth.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ========================================
// SKILL HEALTH ROUTES
// ========================================

// Dashboard - Get all skills with health scores
router.get('/dashboard', getDashboard);

// Recalculate all skill health (run decay algorithm)
router.post('/calculate', recalculateHealth);

// Generate AI-powered personalized challenge
router.post('/challenge/ai', generateAIChallenge);

// Submit challenge answer and update health
router.post('/submit-result', submitAnswer);

// Get pre-built challenge for a skill
router.get('/challenge/:skillName', getChallenges);

// Claim proof badge for a skill
router.post('/proof/:skillName/claim', claimProofBadge);

// Get decay warnings and challenge reminders
router.get('/notifications', getNotifications);

export default router;
