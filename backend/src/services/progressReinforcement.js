import UserProgress from '../models/UserProgress.js';

/**
 * PROGRESS REINFORCEMENT SERVICE (Zeeklect v3)
 * ==========================================
 * Calculates score deltas and returns success signals.
 */

class ProgressReinforcement {
  async getSuccessSignal(userId, currentScore) {
    try {
      const progress = await UserProgress.findOne({ userId });
      if (!progress) return null;

      const prevScore = progress.lastCalculatedScore || 0;
      const delta = currentScore - prevScore;

      // Update the "last seen" score for next time
      progress.lastCalculatedScore = currentScore;
      await progress.save();

      // Return signals
      if (delta <= 0) {
        return {
          type: 'qualitative',
          message: 'Momentum Maintained',
          description: 'Keep going! Every effort counts toward your long-term career growth.'
        };
      }

      if (delta < 1) {
        return {
          type: 'qualitative',
          message: 'Hiring Signal Optimized',
          description: 'You just significantly improved your professional profile visibility.'
        };
      }

      return {
        type: 'quantitative',
        message: 'High Performance Detected',
        description: `Your hiring readiness score boosted by ${delta.toFixed(1)}%!`,
        delta
      };

    } catch (error) {
      console.error('[ProgressReinforcement] Signal generation failed', error);
      return null;
    }
  }
}

export default new ProgressReinforcement();
