import logger from '../utils/logger.js';
import pkgService from './pkgService.js';
import missionService from './mission.service.js';
import SkillValidation from '../models/SkillValidation.js';

/**
 * VALIDATION PROVIDER ADAPTER (Zeeklect v3)
 * ========================================
 * Pluggable architecture to support multiple validation engines.
 * Current implementation: InternalEvaluator.
 * Future: Judge0, HackerRank, LinkedIn Skills, etc.
 */

class ValidationProvider {
  constructor() {
    this.engines = new Map();
  }

  registerEngine(name, engine) {
    this.engines.set(name, engine);
    logger.info({ engine: name }, '[ValidationProvider] Engine registered');
  }

  async validate(userId, skill, type, data, engineName = 'internal') {
    const engine = this.engines.get(engineName);
    if (!engine) {
      throw new Error(`Validation engine ${engineName} not found`);
    }

    logger.info({ userId, skill, type }, '[ValidationProvider] Starting validation');

    // Anti-gaming: Check recent attempts
    const recentAttempts = await SkillValidation.find({
      userId,
      skill,
      validatedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
    });

    const result = await engine.execute(skill, type, data);

    // Apply anti-gaming penalty if repeated
    if (recentAttempts.length > 0) {
      const penalty = 0.8 / (recentAttempts.length + 1);
      result.score = Math.round(result.score * penalty);
      logger.warn({ userId, skill, attempts: recentAttempts.length }, '[ValidationProvider] Anti-gaming penalty applied to score');
    }

    // Save to DB
    const validation = new SkillValidation({
      userId,
      skill,
      type,
      score: result.score,
      difficulty: result.difficulty || 'intermediate',
      proofLink: result.proofLink || null,
      metadata: result.metadata || {}
    });

    // Mark previous as not latest
    await SkillValidation.updateMany({ userId, skill, isLatest: true }, { isLatest: false });
    
    await validation.save();

    // ── TOP AHEAD: LINK TO PKG INTELLIGENCE ──
    try {
        await pkgService.processEvent(userId, 'challenge_completed', {
            skill,
            topic: `Validation: ${type}`,
            score: result.score,
            timeSpent: data?.timeSpent || 0,
            isAIGenerated: false
        });
        logger.info({ userId, skill }, '[ValidationProvider] Signal propagated to PKG');

        // Check if we can auto-advance active missions based on this validation
        const advanced = await missionService.autoAdvanceFromValidation(userId, skill, result.score);
        if (advanced && advanced.length > 0) {
            validation.metadata.autoAdvancedMissions = advanced;
            await validation.save();
            logger.info({ userId, skill, advanced }, '[ValidationProvider] Auto-advanced missions from validation');
        }
    } catch (err) {
        logger.error({ userId, skill, error: err.message }, '[ValidationProvider] Failed to propagate signal to PKG or advance mission');
    }

    return validation;
  }
}

/**
 * INTERNAL EVALUATOR (Zeeklect v3)
 * ===============================
 * Handles basic MCQ, Simple Code snippets, and Project link verification.
 */
class InternalEvaluator {
  async execute(skill, type, data) {
    switch (type) {
      case 'mcq':
        return this.evalMCQ(data);
      case 'code':
        return this.evalCode(data);
      case 'project':
        return this.evalProject(data);
      default:
        return { score: 0, metadata: { error: 'Unknown validation type' } };
    }
  }

  evalMCQ(data) {
    if (data?.mock) {
      return {
        score: 65,
        metadata: {
          mode: 'starter_probe',
          total: 5,
          correctCount: 3,
          skill: data.skill || 'core competency'
        }
      };
    }

    const { answers, correctAnswers } = data;
    if (!Array.isArray(answers) || !Array.isArray(correctAnswers) || answers.length === 0 || answers.length !== correctAnswers.length) {
      const error = new Error('Invalid MCQ payload. Answers and correctAnswers must be non-empty arrays of the same length.');
      error.statusCode = 400;
      throw error;
    }

    let correctCount = 0;
    answers.forEach((ans, idx) => {
      if (ans === correctAnswers[idx]) correctCount++;
    });

    const score = Math.round((correctCount / correctAnswers.length) * 100);
    return { score, metadata: { correctCount, total: correctAnswers.length } };
  }

  evalCode(data) {
    if (data?.mock) {
      return {
        score: 70,
        metadata: {
          mode: 'starter_probe',
          keywordMatches: 2,
          totalKeywords: 3
        }
      };
    }

    // Internal V1: Simple presence check and keyword match (Mock execution)
    const { code, expectedKeywords = [] } = data;
    if (!code || code.length < 10) {
      const error = new Error('Code submission is too short for validation.');
      error.statusCode = 400;
      throw error;
    }

    let matches = 0;
    expectedKeywords.forEach(k => {
      if (code.includes(k)) matches++;
    });

    const score = Math.round((matches / expectedKeywords.length) * 100) || 50; 
    return { score, metadata: { keywordMatches: matches, totalKeywords: expectedKeywords.length } };
  }

  evalProject(data) {
    const { proofLink } = data;
    if (!proofLink) {
      const error = new Error('Project validation requires a proof link.');
      error.statusCode = 400;
      throw error;
    }

    // Real signal extraction from URL
    const githubRegex = /github\.com\/([^/]+)\/([^/]+)/;
    const match = proofLink.match(githubRegex);

    if (match) {
      const [_, user, repo] = match;
      // In a real environment, we'd fetch actual metadata here.
      // For now, we only score if the URL structure is valid.
      return { 
        score: 90, 
        proofLink, 
        metadata: { 
          platform: 'github',
          repository: repo,
          owner: user,
          verifiedAt: new Date()
        } 
      };
    }

    const isLive = proofLink.startsWith('http://') || proofLink.startsWith('https://');
    if (isLive) {
      return { 
        score: 80, 
        proofLink, 
        metadata: { platform: 'web', verifiedAt: new Date() } 
      };
    }

    return { score: 0, metadata: { error: 'Invalid link structure' } };
  }
}

/**
 * JUDGE0 PROVIDER (Zeeklect v3 - SAFE STUB)
 * ========================================
 * Placeholder for full code execution integration.
 */
class Judge0Provider {
  async execute(skill, type, data) {
    logger.info({ skill, type }, '[Judge0Provider] Execution requested (STUB)');
    // Interface contract for future Judge0 integration
    return {
      score: 50, // Default stub score
      metadata: { engine: 'judge0_stub', status: 'awaiting_api_configuration' }
    };
  }
}

const provider = new ValidationProvider();
provider.registerEngine('internal', new InternalEvaluator());
provider.registerEngine('judge0', new Judge0Provider());

export default provider;
