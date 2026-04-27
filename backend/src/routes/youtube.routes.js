import express from 'express';
import { searchYouTube } from '../controllers/youtube.controller.js';

const router = express.Router();

router.post('/search', searchYouTube);

export default router;
