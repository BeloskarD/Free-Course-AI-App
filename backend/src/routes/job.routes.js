import express from 'express';
import jobController from '../controllers/job.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { catchAsync } from '../utils/catchAsync.js';

const router = express.Router();

router.get('/:id', optionalAuth, catchAsync(jobController.getJobStatus));

export default router;
