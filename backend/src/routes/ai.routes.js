import express from "express";
import { aiSearch, aiSearchJobStatus, getCourseInsights } from "../controllers/ai.controller.js";
import { optionalAuth } from '../middleware/auth.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';

const router = express.Router();

router.post("/search", optionalAuth, subscriptionGuard('aiSearch', { limitKey: 'searchLimit' }), aiSearch);
router.get("/job-status/:jobId", optionalAuth, subscriptionGuard('aiSearch'), aiSearchJobStatus);
router.post("/course-insights", getCourseInsights);

export default router;
