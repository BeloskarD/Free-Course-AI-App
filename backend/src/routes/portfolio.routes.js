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
    trackPortfolioView
} from '../controllers/portfolio.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// PUBLIC ROUTES - No auth required
// ========================================
router.get('/:id', getPublicPortfolio);
router.post('/:id/track-view', trackPortfolioView);  // Track views (public endpoint)

// ========================================
// PRIVATE ROUTES - Require authentication
// ========================================

// Core Portfolio Management
router.patch('/settings', authenticate, updatePortfolioSettings);

// AI Content Generation
router.post('/generate-bio', authenticate, generateProfessionalSummary);
router.post('/refine', authenticate, refinePortfolioSegment);
router.post('/generate-accomplishment', authenticate, generateAccomplishment);
router.post('/generate-career-objective', authenticate, generateCareerObjective);

// AI Analysis & Optimization
router.post('/analyze-ats', authenticate, analyzeATS);
router.post('/suggest-keywords', authenticate, suggestKeywords);
router.post('/review-all', authenticate, reviewPortfolio);

export default router;
