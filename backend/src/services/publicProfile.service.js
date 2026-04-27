import logger from '../utils/logger.js';
import User from '../models/User.js';
import PKG from '../models/PKG.js';
import UserProgress from '../models/UserProgress.js';
import SkillValidation from '../models/SkillValidation.js';
import CareerTimeline from '../models/CareerTimeline.js';

/**
 * PUBLIC PROFILE SERVICE (Zeeklect v3)
 * ===================================
 * Aggregates all career-critical data for the public shareable profile.
 */

class PublicProfileService {
  async getProfileByUsername(username) {
    logger.info({ username }, '[PublicProfile] Fetching profile');

    try {
      // 1. Find User
      const user = await User.findOne({ username }).select('name username avatar createdAt');
      if (!user) {
        logger.warn({ username }, '[PublicProfile] User not found');
        return null;
      }

      const userId = user._id;

      // 2. Fetch PKG & Progress
      const [pkg, progress, validations, timeline] = await Promise.all([
        PKG.findOne({ userId }),
        UserProgress.findOne({ userId }),
        SkillValidation.find({ userId, isLatest: true }),
        CareerTimeline.findOne({ userId })
      ]);

      // 3. Aggregate Verified Skills
      const verifiedSkills = validations.map(v => ({
        name: v.skill,
        score: v.score,
        badge: this.getBadgeLevel(v.score),
        validatedAt: v.validatedAt,
        type: v.type
      }));

      // 4. Map PKG Skills (Top 5 by mastery)
      const topSkills = pkg ? (Array.isArray(pkg.skills) ? pkg.skills.map(s => [s.skillId || s.displayName || 'unknown', s]) : Array.from(pkg.skills.entries()))
        .map(([name, data]) => ({
          name: data.displayName || name,
          mastery: Math.round(data.masteryScore * 100),
          level: data.level
        }))
        .sort((a, b) => b.mastery - a.mastery)
        .slice(0, 5) : [];

      return {
        user: {
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          memberSince: user.createdAt
        },
        stats: {
          hiringScore: progress?.hiringScore || 0,
          targetRole: progress?.targetRole || 'Professional',
          readinessTrend: progress?.hiringScoreHistory || [],
          preferences: progress?.preferences || {}
        },
        verifiedSkills,
        topSkills,
        timeline: timeline ? {
          estimatedMonths: timeline.estimatedMonthsToReady,
          hiringProbability: timeline.hiringProbability,
          scenarios: timeline.scenarios,
          nextMilestone: timeline.milestones.find(m => !m.isCompleted)
        } : null
      };


    } catch (error) {
      logger.error({ username, error: error.message }, '[PublicProfile] Fetch failed');
      throw error;
    }
  }

  getBadgeLevel(score) {
    if (score >= 90) return 'Expert';
    if (score >= 75) return 'Advanced';
    if (score >= 60) return 'Proficient';
    return 'Verified';
  }
}

export default new PublicProfileService();
