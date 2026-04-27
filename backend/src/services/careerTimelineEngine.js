import logger from '../utils/logger.js';
import CareerTimeline from '../models/CareerTimeline.js';
import pkgService from './pkgService.js';

/**
 * CAREER TIMELINE ENGINE (Zeeklect v3)
 * ===================================
 * Generates realistic career projections based on current mastery and learning velocity.
 */

class CareerTimelineEngine {
  /**
   * Main projection logic
   */
  async generateProjection(userId, targetRole) {
    if (!userId) throw new Error("userId is required for career projection");
    logger.info({ userId, targetRole }, '[TimelineEngine] Generating career projection');

    try {
      const pkg = await pkgService.getPKG(userId);
      if (!pkg) throw new Error("PKG not found for timeline generation");

      let skillValues = [];
      if (Array.isArray(pkg.skills)) {
        skillValues = pkg.skills;
      } else if (pkg.skills instanceof Map) {
        skillValues = Array.from(pkg.skills.values());
      } else if (typeof pkg.skills === 'object' && pkg.skills !== null) {
        skillValues = Object.entries(pkg.skills)
          .filter(([key]) => key !== '$init')
          .map(([skillId, value]) => ({ ...value, skillId }));
      }
      
      // Calculate average learning velocity (mastery points per week)
      const avgVelocity = skillValues.length > 0
        ? skillValues.reduce((acc, s) => acc + (s.learningVelocity || 0), 0) / skillValues.length
        : 0.05; // Default modest velocity (5% mastery gain per week)

      const currentReadiness = pkg.career?.readinessScore || 0;
      const gapToReady = 0.9 - currentReadiness; // Target 90% readiness

      // Estimated months (gap / velocity * weeks/month)
      // If gap is 0.4 and velocity is 0.05, it takes 8 weeks = 2 months.
      const estimatedWeeks = Math.max(4, Math.ceil(gapToReady / Math.max(0.01, avgVelocity)));
      const estimatedMonths = Math.round(estimatedWeeks / 4);

      const milestones = this.calculateMilestones(targetRole, estimatedMonths, pkg);
      const weeklyPlan = this.generateWeeklyPlan(targetRole, estimatedWeeks, pkg);

      // 3-Scenario Projection (Realism Upgrade)
      const scenarios = {
        optimistic: Math.max(1, Math.round(estimatedMonths * 0.7)),
        realistic: estimatedMonths,
        pessimistic: Math.round(estimatedMonths * 1.5)
      };

      // Probability Layer (70% base logic)
      const readinessScore = pkg.career?.readinessScore || 0;
      const consistencyFactor = Math.min(1, (pkg.momentum?.streak || 0) / 14); 
      const hiringProbability = Math.round((readinessScore * 0.7 + consistencyFactor * 0.3) * 100);

      const timeline = await CareerTimeline.findOneAndUpdate(
        { userId },
        {
          userId, // Explicitly include to satisfy all validation paths
          targetRole,
          estimatedMonthsToReady: estimatedMonths,
          hiringProbability,
          scenarios,
          milestones,
          weeklyPlan,
          generatedAt: new Date()
        },
        { upsert: true, new: true, runValidators: false }
      );

      return timeline;
    } catch (error) {
      logger.error({ userId, error: error.message }, '[TimelineEngine] Generation failed');
      throw error;
    }
  }

  calculateMilestones(role, months, pkg) {
    const milestones = [];
    const now = new Date();

    // Milestone 1: Core Fundamentals (Month 1)
    milestones.push({
      title: 'Core Technical Foundation',
      targetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      requiredSkills: pkg.career?.gapSkills?.slice(0, 2).map(g => g.skill) || [],
      isCompleted: false
    });

    // Milestone 2: Project Milestone (Month midway)
    milestones.push({
      title: 'Proof-of-Work Portfolio',
      targetDate: new Date(now.getTime() + (months * 0.5) * 30 * 24 * 60 * 60 * 1000),
      requiredSkills: ['Project Architecture', 'Deployment'],
      isCompleted: false
    });

    // Milestone 3: Market Ready (Target)
    milestones.push({
      title: `${role} Readiness Achieved`,
      targetDate: new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000),
      requiredSkills: pkg.career?.gapSkills?.map(g => g.skill) || [],
      isCompleted: false
    });

    return milestones;
  }

  generateWeeklyPlan(role, totalWeeks, pkg) {
    const plan = [];
    const gaps = pkg.career?.gapSkills || [{ skill: 'Core Skills' }];
    
    // Generate first 4 weeks specifically
    for (let i = 1; i <= Math.min(4, totalWeeks); i++) {
      const topic = gaps[Math.floor(i % gaps.length)].skill;
      plan.push({
        week: i,
        focus: `Mastery of ${topic}`,
        tasks: [
          `Complete 2 missions in ${topic}`,
          `Achieve > 80% on ${topic} validation`,
          `Apply ${topic} to a micro-project`
        ]
      });
    }

    return plan;
  }
}

export default new CareerTimelineEngine();
