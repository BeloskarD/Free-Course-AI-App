import express from "express";
import { aiSearch, aiSearchJobStatus, getCourseInsights } from "../controllers/ai.controller.js";
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post("/search", optionalAuth, aiSearch);
router.get("/job-status/:jobId", aiSearchJobStatus);
router.post("/course-insights", getCourseInsights);

export default router;
