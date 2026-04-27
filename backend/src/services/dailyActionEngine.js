import pkgService from './pkgService.js';
import UserProgress from '../models/UserProgress.js';
import SkillValidation from '../models/SkillValidation.js';
import logger from '../utils/logger.js';

/**
 * DAILY ACTION ENGINE (Zeeklect v3)
 * ================================
 * Generates 3 prioritized, specific, and measurable actions to improve hiring readiness.
 * Logic: 1 Skill + 1 Validation + 1 Project/Engagement.
 */

class DailyActionEngine {
  async getActions(userId) {
    logger.info({ userId }, '[ActionEngine] Generating daily actions');
    const startTime = Date.now();

    try {
      const [pkg, progress, validations] = await Promise.all([
        pkgService.getPKG(userId),
        UserProgress.findOne({ userId }),
        SkillValidation.find({ userId, isLatest: true })
      ]);

      const actions = [];
      const validatedSkills = new Set(validations.map(v => v.skill.toLowerCase()));
      
      // Normalized skills from PKG (New Array Format or Legacy Map)
      const skills = Array.isArray(pkg.skills) ? pkg.skills : (pkg.skills instanceof Map ? Array.from(pkg.skills.values()) : Object.values(pkg.skills || {}));

      // 1. ACTION: SKILL (Lowest Mastery)
      const weakSkill = skills
        .filter(s => (s.masteryScore || 0) < 0.6)
        .sort((a, b) => (a.masteryScore || 0) - (b.masteryScore || 0))[0];
      
      if (weakSkill) {
        actions.push({
          id: 'skill_1',
          type: 'skill',
          title: `Master ${weakSkill.displayName || weakSkill.skillId} Fundamentals`,
          description: `Complete 2 interactive challenges in ${weakSkill.displayName || weakSkill.skillId} to solve core mastery gaps.`,
          estimatedImpact: 'Estimated +2–4% Readiness',
          cta: 'Practice Skill',
          link: `/skill-graph?focus=${weakSkill.skillId}`,
          priority: 'High'
        });
      }

      // 2. ACTION: VALIDATION (Mastery > 0.4 but unverified)
      const readyForValidation = skills
        .filter(s => (s.masteryScore || 0) > 0.4 && !validatedSkills.has((s.skillId || '').toLowerCase()))
        .sort((a, b) => (b.masteryScore || 0) - (a.masteryScore || 0))[0];

      if (readyForValidation) {
        actions.push({
          id: 'val_1',
          type: 'validation',
          title: `Verify ${readyForValidation.displayName || readyForValidation.skillId} Expertise`,
          description: `Take a 15-minute technical validation to convert internal mastery into recruiter-grade proof.`,
          estimatedImpact: 'Estimated +5–8% Readiness',
          cta: 'Start Validation',
          link: `/skill-analysis?validate=${readyForValidation.skillId}`,
          priority: 'Critical'
        });
      }

      // 3. ACTION: ENGAGEMENT / PROJECT
      const projectCount = pkg.missions?.completed?.length || 0;
      if (projectCount < 3) {
        actions.push({
          id: 'proj_1',
          type: 'project',
          title: 'Deploy Proof-of-Work Project',
          description: `Start an Advanced Micro-Mission to build a verifiable project for your ${progress?.targetRole || 'Software Engineer'} portfolio.`,
          estimatedImpact: 'Estimated +10% Readiness',
          cta: 'Browse Missions',
          link: '/missions',
          priority: 'Medium'
        });
      } else {
        // Streak maintenance fallback
        actions.push({
          id: 'eng_1',
          type: 'engagement',
          title: 'Maintain Performance Momentum',
          description: 'Login today and complete any dashboard activity to protect your learning streak and engagement health score.',
          estimatedImpact: 'Estimated +1% Readiness',
          cta: 'Check Progress',
          link: '/dashboard',
          priority: 'Low'
        });
      }

      // Ensure diversity (limit to top 3 if we somehow got more)
      const finalActions = actions.slice(0, 3);

      logger.info({ 
        userId, 
        duration: Date.now() - startTime,
        count: finalActions.length 
      }, '[ActionEngine] Generation complete');

      return finalActions;

    } catch (error) {
      logger.error({ userId, error: error.message }, '[ActionEngine] Generation failed');
      return this.getFallbackActions();
    }
  }

  getFallbackActions() {
    return [
      {
        id: 'fb_1',
        type: 'engagement',
        title: 'Explore Career Pathways',
        description: 'Update your target role to get personalized, data-driven daily actions.',
        estimatedImpact: 'Estimated +2% Readiness',
        cta: 'Update Profile',
        link: '/settings/profile',
        priority: 'High'
      }
    ];
  }
}

export default new DailyActionEngine();
