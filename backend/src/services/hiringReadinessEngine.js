import logger from '../utils/logger.js';
import pkgService from './pkgService.js';
import SkillValidation from '../models/SkillValidation.js';
import UserProgress from '../models/UserProgress.js';

/**
 * HIRING READINESS ENGINE (Zeeklect v3)
 * ====================================
 * A dynamic weighting scoring system to predict job market readiness.
 * Adapts weights based on user maturity levels.
 */

class HiringReadinessEngine {
  constructor() {
    this.BASE_WEIGHTS = {
      skills: 0.25,      // V3: Reduced weight for theory
      projects: 0.35,    // V3: Increased weight for proof-of-work
      validations: 0.30, // V3: Heavy weight for verified expert results
      market: 0.10
    };
  }


  /**
   * Calculate dynamic weights based on user profile
   */
  getDynamicWeights(profileData) {
    const weights = { ...this.BASE_WEIGHTS };
    const { projectCount, totalValidations, avgMastery } = profileData;

    // Gradual transition: if user is new, use V3 directly. 
    // If they have deep existing stats, shift weights based on data density.
    
    if (projectCount < 2) {
      weights.projects += 0.05;
      weights.skills -= 0.05;
    }

    if (totalValidations === 0) {
      weights.validations += 0.05;
      weights.skills -= 0.05;
    }

    if (avgMastery > 0.8) {
      weights.market = 0.15;
      weights.skills -= 0.05;
    }

    // Normalize
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    Object.keys(weights).forEach(k => weights[k] /= sum);

    return weights;
  }


  /**
   * Main score calculation
   */
  async calculateScore(userId) {
    if (!userId) throw new Error("userId is required for readiness calculation");
    logger.info({ userId }, '[ReadinessEngine] Calculating hiring readiness score');

    try {
      const pkg = await pkgService.getPKG(userId);
      if (!pkg) throw new Error("PKG not found for readiness calculation");
      const userProgress = await UserProgress.findOne({ userId });
      const validations = await SkillValidation.find({ userId, isLatest: true });

      // Gather metrics
      // Gather metrics
      let skillValues = [];
      if (Array.isArray(pkg.skills)) {
        skillValues = pkg.skills;
      } else if (pkg.skills instanceof Map) {
        skillValues = Array.from(pkg.skills.values());
      } else if (typeof pkg.skills === 'object' && pkg.skills !== null) {
        skillValues = Object.entries(pkg.skills)
          .filter(([key]) => key !== '$init')
          .map(([key, val]) => ({ ...val, skillId: key }));
      }

      const avgMastery = skillValues.length > 0 
        ? skillValues.reduce((acc, s) => acc + (s.masteryScore || 0), 0) / skillValues.length 
        : 0;
      
      const projectCount = pkg.missions?.completed?.length || 0;
      const totalValidations = validations.length;
      const avgValidationScore = totalValidations > 0
        ? validations.reduce((acc, v) => acc + v.score, 0) / totalValidations
        : 0;

      const profileData = { 
        projectCount, 
        totalValidations, 
        avgMastery, 
        currentStreak: userProgress?.currentStreak || 0 
      };
      
      const weights = this.getDynamicWeights(profileData);

      // Raw Scores (0-100)
      const skillScore = avgMastery * 100;
      const projectScore = Math.min(100, projectCount * 25); 
      const validationScore = avgValidationScore;
      const marketScore = (pkg.momentum?.weeklyActiveMinutes > 60) ? 90 : 60;

      const rawFinalScore = Math.round(
        (skillScore * weights.skills) +
        (projectScore * weights.projects) +
        (validationScore * weights.validations) +
        (marketScore * weights.market)
      );

      // 1. Score Smoothing (0.7/0.3 mix)
      const prevScore = userProgress?.hiringScore || 0;
      const finalScore = prevScore === 0 
        ? rawFinalScore 
        : Math.round((prevScore * 0.7) + (rawFinalScore * 0.3));

      // 2. Indicators
      const confidence = this.calculateConfidence(validations, projectCount, profileData);
      const targetRole = userProgress?.targetRole || pkg.career?.targetRole || 'Software Engineer';
      const benchmarking = await this.getPeerBenchmarking(userId, targetRole, finalScore);

      const transparency = {
        score: finalScore,
        confidence,
        benchmarking,
        weights: {
          skills: Math.round(weights.skills * 100),
          projects: Math.round(weights.projects * 100),
          validations: Math.round(weights.validations * 100),
          market: Math.round(weights.market * 100)
        },
        breakdown: {
          skillStrength: Math.round(skillScore),
          projectProof: Math.round(projectScore),
          verifiedExpertise: Math.round(validationScore),
          engagementHealth: Math.round(marketScore)
        },
        biggestImpactFactor: this.getBiggestImpactFactor(weights, { skillScore, projectScore, validationScore, marketScore }),
        missingComponents: this.getMissingComponents(pkg, profileData)
      };

      // Persistence
      if (userProgress) {
        userProgress.hiringScore = finalScore;
        userProgress.hiringScoreHistory.push({ score: finalScore, date: new Date() });
        if (userProgress.hiringScoreHistory.length > 30) userProgress.hiringScoreHistory.shift();
        await userProgress.save();
      }

      // Update PKG Readiness (use smoothed score)
      await pkgService.processEvent(userId, 'career_analyzed', {
        readinessScore: finalScore / 100,
        lastAnalysisDate: new Date()
      });

      logger.info({ userId, finalScore }, '[ReadinessEngine] Calculation complete');
      return transparency;

    } catch (error) {
      logger.error({ userId, error: error.message }, '[ReadinessEngine] Calculation failed');
      throw error;
    }
  }


  getMissingComponents(pkg, data) {
    const missing = [];
    if (data.projectCount < 3) missing.push({ item: '3+ Completed Projects', impact: 'High', reason: 'Employers value proof-of-work over theoretical knowledge.' });
    if (data.totalValidations < 2) missing.push({ item: 'Verified Skill Assessments', impact: 'Medium', reason: 'Unverified skills are perceived as risky by recruiters.' });
    
    // Check for gap skills in PKG
    const gaps = pkg.career?.gapSkills || [];
    if (gaps.length > 0) {
      gaps.slice(0, 3).forEach(g => {
        missing.push({ item: `Mastery in ${g.skill}`, impact: g.priority === 'high' ? 'Critical' : 'Medium', reason: 'This skill is a primary requirement for your target role.' });
      });
    }

    return missing;
  }

  calculateConfidence(validations, projectCount, profileData) {
    const validationDiversity = new Set(validations.map(v => v.skill)).size;
    const streakBonus = Math.min(20, (profileData.currentStreak || 0) * 2);
    
    const confidenceScore = (validationDiversity * 15) + (projectCount * 20) + streakBonus;
    
    if (confidenceScore > 80) return 'High';
    if (confidenceScore > 40) return 'Medium';
    return 'Low';
  }

  async getPeerBenchmarking(userId, role, score) {
    try {
      const bucket = await UserProgress.find({ targetRole: role });
      if (bucket.length < 10) return { percentile: null, status: 'Collecting Peer Data' };

      const lowerScores = bucket.filter(u => u.hiringScore < score).length;
      const percentile = Math.round((lowerScores / bucket.length) * 100);
      
      return { 
        percentile, 
        status: `Top ${Math.max(1, 100 - percentile)}% in ${role}`,
        poolSize: bucket.length
      };
    } catch (error) {
      return { percentile: null, status: 'Benchmarking Unavailable' };
    }
  }

  getBiggestImpactFactor(weights, scores) {
    const contributions = [
      { factor: 'Skills', value: weights.skills * scores.skillScore },
      { factor: 'Projects', value: weights.projects * scores.projectScore },
      { factor: 'Validations', value: weights.validations * scores.validationScore },
      { factor: 'Market', value: weights.market * scores.marketScore }
    ];

    // The one with the lowest relative performance multiplied by its weight
    return contributions.sort((a, b) => a.value - b.value)[0].factor;
  }
}


export default new HiringReadinessEngine();
