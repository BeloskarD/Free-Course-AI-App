import express from 'express';
import { getPrepKit } from '../controllers/interviewPrep.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', authenticate, getPrepKit);

export default router;
