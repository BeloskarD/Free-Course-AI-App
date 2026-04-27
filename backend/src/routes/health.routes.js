import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/health/live
 * @desc    Liveness probe. Verifies that the Express server processes requests.
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is running' });
});

/**
 * @route   GET /api/health/ready
 * @desc    Readiness probe. Verifies if MongoDB is connected and can accept transactions.
 */
router.get('/ready', async (req, res) => {
  try {
    // 1 = connected
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      return res.status(200).json({ status: 'READY', db: 'connected' });
    } else {
      return res.status(503).json({ status: 'NOT_READY', db: 'disconnected' });
    }
  } catch (err) {
    console.error('[HealthCheck] Readiness probe failed:', err.message);
    return res.status(503).json({ status: 'NOT_READY', error: err.message });
  }
});

export default router;
