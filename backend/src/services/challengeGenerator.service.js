import pkgService from './pkgService.js';
import graphEngineService from './graphEngine.service.js';
import LearnerProfile from '../models/LearnerProfile.js';
import { extractJSON } from '../utils/aiUtils.js';
import Groq from 'groq-sdk';

/**
 * ADAPTIVE CHALLENGE GENERATOR SERVICE
 * =====================================
 * AI-powered dynamic mission/challenge generation
 * based on PKG mastery, entropy, and learning patterns.
 */

function getGroqClient() {
    if (!process.env.GROQ_API_KEY) return null;
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// ========================================
// SKILL TARGETING
// ========================================

function selectTargetSkills(pkg) {
    const skills = Array.isArray(pkg.skills) ? pkg.skills.map(s => [s.skillId || s.displayName || 'unknown', s]) : (pkg.skills instanceof Map ? Array.from(pkg.skills.entries()) : []);
    if (skills.length === 0) return [];

    return skills.map(([name, data]) => {
        const entropy = data.entropyRate ?? 0.5;
        const mastery = data.masteryScore || (data.level / 100) || 0;
        const daysSincePractice = data.lastPracticed
            ? (Date.now() - new Date(data.lastPracticed).getTime()) / (1000 * 60 * 60 * 24)
            : 30;
        const decayUrgency = Math.min(1, daysSincePractice / 30);

        const priority = entropy * 0.4 + (1 - mastery) * 0.35 + decayUrgency * 0.25;

        return {
            name,
            mastery: Math.round(mastery * 100) / 100,
            entropy: Math.round(entropy * 100) / 100,
            priority: Math.round(priority * 100) / 100,
            level: data.level || 0,
            health: data.health || 100
        };
    })
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);
}

function calculateDifficulty(targetSkills) {
    if (targetSkills.length === 0) return 'medium';
    const avgMastery = targetSkills.reduce((s, sk) => s + sk.mastery, 0) / targetSkills.length;
    if (avgMastery < 0.3) return 'easy';
    if (avgMastery < 0.6) return 'medium';
    if (avgMastery < 0.85) return 'hard';
    return 'expert';
}

function selectChallengeType(pkg, profile) {
    const car = pkg.momentum?.consumptionToApplicationRatio || 0;
    // If user consumes more than applies -> favor build challenges
    if (car < 0.5) return 'micro_project';

    const random = Math.random();
    if (random < 0.4) return 'micro_project';
    if (random < 0.65) return 'networking_action';
    if (random < 0.85) return 'publishing_action';
    return 'micro_project';
}

// ========================================
// LLM GENERATION
// ========================================

async function generateWithLLM(targetSkills, difficulty, challengeType, profile) {
    const groq = getGroqClient();
    if (!groq) return generateFallbackChallenge(targetSkills, difficulty, challengeType);

    const targetRole = profile?.goals?.targetRole || 'Software Developer';
    const learningStyle = profile?.preferences?.learningStyle || 'hands-on';
    const sessionLength = profile?.preferences?.sessionLength || 60;

    const prompt = `Generate an applied ${challengeType.replace('_', ' ')} challenge.

Target skills: ${targetSkills.map(s => `${s.name} (mastery: ${Math.round(s.mastery * 100)}%)`).join(', ')}
Difficulty: ${difficulty}
User's target role: ${targetRole}
Learning style: ${learningStyle}
Available time: ${sessionLength} minutes

Return ONLY a JSON object (no markdown, no explanation):
{
  "title": "string",
  "description": "string",
  "type": "${challengeType}",
  "difficulty": "${difficulty}",
  "estimatedMinutes": ${sessionLength},
  "skills": [${targetSkills.map(s => `"${s.name}"`).join(', ')}],
  "stages": [
    {
      "stageId": 1,
      "title": "string",
      "type": "learn",
      "description": "string",
      "estimatedMinutes": 15,
      "objectives": ["string"],
      "deliverable": "string"
    },
    {
      "stageId": 2,
      "title": "string",
      "type": "build",
      "description": "string",
      "estimatedMinutes": 30,
      "objectives": ["string"],
      "deliverable": "string"
    },
    {
      "stageId": 3,
      "title": "string",
      "type": "reflect",
      "description": "string",
      "estimatedMinutes": 10,
      "objectives": ["string"],
      "deliverable": "string"
    }
  ],
  "successCriteria": ["string"],
  "careerImpact": "string",
  "portfolioArtifact": { "type": "project", "title": "string" }
}`;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are an elite learning architect. Generate applied, real-world challenges. Return ONLY valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 1500
        });

        const text = completion.choices?.[0]?.message?.content || '';
        const parsed = extractJSON(text);
        if (parsed && parsed.title) return parsed;
    } catch (err) {
        console.error('[ChallengeGenerator] LLM error:', err.message);
    }

    return generateFallbackChallenge(targetSkills, difficulty, challengeType);
}

function generateFallbackChallenge(targetSkills, difficulty, challengeType) {
    const skill = targetSkills[0]?.name || 'programming';
    return {
        title: `Practice: ${skill.charAt(0).toUpperCase() + skill.slice(1)} ${difficulty} Challenge`,
        description: `Strengthen your ${skill} skills with a focused ${challengeType.replace('_', ' ')} exercise.`,
        type: challengeType,
        difficulty,
        estimatedMinutes: 60,
        skills: targetSkills.map(s => s.name),
        stages: [
            { stageId: 1, title: 'Review Concepts', type: 'learn', description: `Review key ${skill} concepts`, estimatedMinutes: 15, objectives: ['Understand core concepts'], deliverable: 'Notes' },
            { stageId: 2, title: 'Apply Knowledge', type: 'build', description: `Build a small ${skill} project`, estimatedMinutes: 35, objectives: ['Write working code'], deliverable: 'Working code' },
            { stageId: 3, title: 'Reflect', type: 'reflect', description: 'Document what you learned', estimatedMinutes: 10, objectives: ['Write summary'], deliverable: 'Learning journal' }
        ],
        successCriteria: ['Complete all stages', 'Working deliverable'],
        careerImpact: `Strengthens ${skill} for your target role`,
        portfolioArtifact: { type: 'project', title: `${skill} Practice Project` }
    };
}

// ========================================
// PUBLIC API
// ========================================

// In-memory store for generated challenges (per-user, 1hr TTL)
const generatedCache = new Map();

async function generateChallenge(userId) {
    const pkg = await pkgService.getPKG(userId);
    const profile = await LearnerProfile.findOne({ userId }).lean();

    const targetSkills = selectTargetSkills(pkg);
    const difficulty = calculateDifficulty(targetSkills);
    const challengeType = selectChallengeType(pkg, profile);

    const challenge = await generateWithLLM(targetSkills, difficulty, challengeType, profile);
    challenge.generatedAt = new Date();
    challenge.userId = userId;

    // Cache
    const userChallenges = generatedCache.get(userId.toString()) || [];
    userChallenges.unshift(challenge);
    if (userChallenges.length > 20) userChallenges.length = 20;
    generatedCache.set(userId.toString(), userChallenges);

    return challenge;
}

async function getSuggestions(userId, count = 3) {
    const suggestions = [];
    for (let i = 0; i < count; i++) {
        const challenge = await generateChallenge(userId);
        suggestions.push(challenge);
    }
    return suggestions;
}

function getHistory(userId) {
    return generatedCache.get(userId.toString()) || [];
}

async function generateValidationProbe(userId, skillName, type) {
    const pkg = await pkgService.getPKG(userId);
    const profile = await LearnerProfile.findOne({ userId }).lean();
    const groq = getGroqClient();

    if (!groq) {
        throw new Error('AI Engine (Groq) is currently unavailable.');
    }

    const targetRole = profile?.goals?.targetRole || 'Software Professional';
    const skillData = pkg.skills?.[skillName] || {};
    const mastery = skillData.masteryScore || 0;

    const systemPrompt = `You are an elite industry auditor for Zeeklect OS. Your goal is to generate "Professional Reasoning Probes" that separate Top 1% talent from juniors. 
    Focus on real-world architectural decisions, performance trade-offs, and production resilience.
    Return ONLY valid JSON.`;

    let prompt = '';
    if (type === 'mcq') {
        prompt = `Generate 3 advanced MCQ questions for the skill "${skillName}".
        Target Role: ${targetRole}
        User Mastery: ${Math.round(mastery * 100)}%
        
        Focus on: Architectural reasoning, production bottlenecks, and senior-level decision making.
        
        Return JSON format:
        {
          "title": "string",
          "description": "string",
          "questions": [
            {
              "prompt": "string",
              "options": ["string", "string", "string", "string"],
              "correctIndex": number
            }
          ]
        }`;
    } else {
        prompt = `Generate a high-level "Architectural Snapshot" code challenge for the skill "${skillName}".
        Target Role: ${targetRole}
        User Mastery: ${Math.round(mastery * 100)}%
        
        The challenge should require writing a production-grade utility or logic block.
        
        Return JSON format:
        {
          "title": "string",
          "description": "string",
          "prompt": "detailed task description",
          "starter": "code snippet to start with",
          "expectedKeywords": ["keyword1", "keyword2"]
        }`;
    }

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const text = completion.choices?.[0]?.message?.content || '';
        const parsed = extractJSON(text);
        if (parsed) return parsed;
        throw new Error('Failed to parse AI response');
    } catch (err) {
        console.error('[ChallengeGenerator] Probe generation error:', err.message);
        throw err;
    }
}

async function generateStrategy(userId, skillName) {
    const pkg = await pkgService.getPKG(userId);
    const profile = await LearnerProfile.findOne({ userId }).lean();
    const groq = getGroqClient();

    if (!groq) {
        throw new Error('AI Engine (Groq) is currently unavailable.');
    }

    const targetRole = profile?.goals?.targetRole || 'Software Professional';
    const skillData = pkg.skills?.[skillName] || {};
    const mastery = skillData.masteryScore || 0;

    const systemPrompt = `You are an elite career strategist for Zeeklect OS. Your goal is to generate a high-impact "Top Ahead" career strategy for the user based on their skill mastery.
    Focus on: How to position this skill for 10x impact, which companies to target, and what specific projects will move the needle.
    Return ONLY valid JSON.`;

    const prompt = `Generate a career strategy for: ${skillName}.
    User's Role: ${targetRole}
    Current Mastery: ${Math.round(mastery * 100)}%
    
    Return JSON format:
    {
      "summary": "High-level strategic summary",
      "marketPosition": "How they should position themselves",
      "targetAction": "One specific high-impact action to take now",
      "portfolioAdvice": "What to build to prove mastery",
      "keywords": ["key", "words", "to", "use"]
    }`;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 1000
        });

        const text = completion.choices?.[0]?.message?.content || '';
        const parsed = extractJSON(text);
        if (parsed) return parsed;
        throw new Error('Failed to parse Strategy response');
    } catch (err) {
        console.error('[ChallengeGenerator] Strategy generation error:', err.message);
        throw err;
    }
}

export default {
    generateChallenge,
    generateValidationProbe,
    generateStrategy,
    getSuggestions,
    getHistory,
    selectTargetSkills,
    calculateDifficulty
};
