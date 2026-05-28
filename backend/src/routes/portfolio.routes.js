import express from 'express';
import {
    getPublicPortfolio,
    generateProfessionalSummary,
    updatePortfolioSettings,
    refinePortfolioSegment,
    analyzeATS,
    generateAccomplishment,
    suggestKeywords,
    reviewPortfolio,
    generateCareerObjective,
    trackPortfolioView,
    syncGithubRepos
} from '../controllers/portfolio.controller.js';
import { authenticate } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';

const router = express.Router();

// ========================================
// PUBLIC ROUTES - No auth required
// ========================================
router.get('/:id', getPublicPortfolio);
router.post('/:id/track-view', trackPortfolioView);

// ========================================
// PRIVATE ROUTES - Require authentication
// ========================================

// Core Portfolio Management — unguarded
router.patch('/settings', authenticate, updatePortfolioSettings);
router.post('/sync-github', authenticate, syncGithubRepos);

// AI Content Generation — entitlements injected for tier-aware responses
router.post('/generate-bio', authenticate, subscriptionGuard('portfolio'), generateProfessionalSummary);
router.post('/refine', authenticate, subscriptionGuard('portfolio'), refinePortfolioSegment);
router.post('/generate-accomplishment', authenticate, subscriptionGuard('portfolio'), generateAccomplishment);
router.post('/generate-career-objective', authenticate, subscriptionGuard('portfolio'), generateCareerObjective);

// AI Analysis & Optimization — entitlements injected
router.post('/analyze-ats', authenticate, subscriptionGuard('portfolio'), analyzeATS);
router.post('/suggest-keywords', authenticate, subscriptionGuard('portfolio'), suggestKeywords);
router.post('/review-all', authenticate, subscriptionGuard('portfolio'), reviewPortfolio);

export default router;
