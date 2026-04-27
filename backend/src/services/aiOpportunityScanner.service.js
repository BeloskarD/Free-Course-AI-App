import pkgService from './pkgService.js';
import opportunityRadarService from './opportunityRadar.service.js';
import { extractJSON } from '../utils/aiUtils.js';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import axios from 'axios';
import Groq from 'groq-sdk';
import Bytez from 'bytez.js';

/**
 * AI OPPORTUNITY SCANNER SERVICE
 * ===============================
 * Uses AI models (Bytez GPT-4.1 → Gemini → Groq LLaMA) to automatically
 * generate career opportunity signals based on user PKG skill profile.
 * 
 * AI Provider Order (matches platform standard):
 *   1. GitHub (gpt-4.1) — Primary
 *   2. GitHub (gpt-4.1-mini) — Secondary
 *   3. Bytez (GPT-4.1-mini) — Tertiary
 *   4. Gemini (gemini-2.0-flash) — Quaternary
 *   5. Groq (LLaMA 3.3-70B) — Quinary
 *   6. Fallback (safe-state) — Last resort
 */

// ── AI Client Helpers ──
async function getBytezOutput(messages, modelName = 'openai/gpt-4.1-mini') {
    if (!process.env.OPENAI_API_KEY) return null;
    try {
        const sdk = new Bytez(process.env.OPENAI_API_KEY);
        const model = sdk.model(modelName);
        const { error, output } = await model.run(messages);
        if (error) return null;
        return typeof output === 'string' ? output : JSON.stringify(output);
    } catch (e) { return null; }
}

/**
 * Robust GitHub Model Caller
 */
async function callGitHubModel(messages, modelName = "gpt-4.1") {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.warn("⚠️ GITHUB_TOKEN is missing. Skipping GitHub Model.");
        return null;
    }

    try {
        const client = ModelClient("https://models.github.ai/inference", new AzureKeyCredential(token));
        const response = await client.path("/chat/completions").post({
            body: {
                messages: messages,
                model: modelName,
                temperature: 0.7,
                max_tokens: 2048
            }
        });

        if (isUnexpected(response)) {
            console.error(`❌ GitHub Model (${modelName}) unexpected response:`, response.body?.error || response.status);
            return null;
        }

        if (!response.body?.choices?.[0]?.message?.content) {
            console.error(`❌ GitHub Model (${modelName}) returned empty content:`, JSON.stringify(response.body));
            return null;
        }

        return {
            content: response.body.choices[0].message.content,
            model: modelName
        };
    } catch (error) {
        console.error(`❌ GitHub Model (${modelName}) error:`, error.message);
        return null;
    }
}

function getGroqClient() {
    if (!process.env.GROQ_API_KEY) return null;
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function callGemini(messages) {
    if (!process.env.GEMINI_API_KEY) return null;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsg = messages.find(m => m.role === 'user')?.content || '';
    const body = {
        contents: [{ parts: [{ text: `${systemMsg}\n\n${userMsg}` }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 2000 }
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// Per-user scan cooldown (prevent excessive API calls)
const scanCooldowns = new Map();
const SCAN_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes between scans

/**
 * Extract user's skill profile summary for the AI prompt.
 */
function buildSkillSummary(pkg) {
    let skills = [];
    if (pkg.skills) {
        if (Array.isArray(pkg.skills)) {
            skills = pkg.skills.map(s => [s.skillId || s.displayName || 'unknown', s]);
        } else if (pkg.skills instanceof Map) {
            skills = (Array.isArray(pkg.skills) ? pkg.skills.map(s => [s.skillId || s.displayName || 'unknown', s]) : Array.from(pkg.skills.entries()));
        } else if (typeof pkg.skills === 'object') {
            skills = Object.entries(pkg.skills);
        }
    }
    if (skills.length === 0) return null;

    const skillSummary = skills
        .map(([name, data]) => {
            const mastery = data.masteryScore || (data.level / 100) || 0;
            const level = mastery > 0.8 ? 'expert' : mastery > 0.5 ? 'intermediate' : 'beginner';
            return `${name} (${level}, ${Math.round(mastery * 100)}% mastery)`;
        })
        .join(', ');

    const topSkills = skills
        .sort((a, b) => ((b[1].masteryScore || b[1].level / 100 || 0) - (a[1].masteryScore || a[1].level / 100 || 0)))
        .slice(0, 5)
        .map(([name]) => name);

    const weakSkills = skills
        .filter(([, data]) => (data.entropyRate ?? 0.5) > 0.6)
        .map(([name]) => name);

    return { skillSummary, topSkills, weakSkills, totalSkills: skills.length };
}

/**
 * Build the AI prompt for opportunity generation.
 */
function buildPrompt(skillProfile, targetRole) {
    return `You are an elite career intelligence AI. Analyze this developer's skill profile and generate career opportunity signals.

SKILL PROFILE:
- Skills: ${skillProfile.skillSummary}
- Top strengths: ${skillProfile.topSkills.join(', ')}
- Skills needing attention: ${skillProfile.weakSkills.join(', ')}
- Target role: ${targetRole || 'Software Developer'}

Generate exactly 10 diverse, realistic career opportunity signals. Each should be actionable and relevant to their current skill level. Mix different signal types.

Return ONLY a JSON array (no markdown, no explanation):
[
  {
    "title": "Specific, compelling opportunity title (realistic, not generic)",
    "source": "one of: github_trending, hiring_signal, research_trend, creator_ecosystem, industry_report",
    "description": "2-3 sentence description of why this matters for their career",
    "skillTags": ["relevant", "skill", "names", "lowercase"],
    "skillCluster": "one of: frontend, backend, database, devops, ai_ml, mobile, security, data, general",
    "opportunityScore": 0.7,
    "trendMomentum": 0.5,
    "confidence": 0.8,
    "url": ""
  }
]

Rules:
- opportunityScore: 0.0 to 1.0 (how valuable this opportunity is)
- trendMomentum: -1.0 to 1.0 (negative = declining, positive = growing)
- confidence: 0.0 to 1.0 (how confident you are in this signal)
- skillTags MUST be lowercase, no spaces
- Make titles specific and realistic (reference actual technologies, frameworks, industry trends)
- Include a mix of: job market signals, technology trends, project ideas, learning opportunities
- Tailor everything to their ACTUAL skill level and strengths`;
}

const SYSTEM_PROMPT = 'You are a career intelligence analyst. You generate realistic, actionable career opportunity signals based on developer skill profiles. Always return valid JSON arrays only. No markdown, no explanation.';

/**
 * AI-powered opportunity generation using Bytez → Gemini → Groq → Fallback.
 */
async function generateAISignals(skillProfile, targetRole) {
    const prompt = buildPrompt(skillProfile, targetRole);
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
    ];

    let usedProvider = 'fallback';

    // ── 1. Try GitHub GPT-4.1 (Primary) ──
    try {
        console.log('🤖 [AIScanner] Attempting GitHub GPT-4.1...');
        const result = await callGitHubModel(messages, "gpt-4.1");
        if (result) {
            const text = result.content;
            const parsed = extractJSON(text);
            if (Array.isArray(parsed) && parsed.length > 0) { // Assuming extractJSON returns array directly
                console.log(`✅ [AIScanner] GitHub GPT-4.1 generated ${parsed.length} signals`);
                return { signals: parsed, provider: 'github-gpt-4.1' };
            }
        }
    } catch (e) { console.warn('⚠️ [AIScanner] GitHub GPT-4.1 failed:', e.message); }

    // ── 2. Try GitHub GPT-4.1-mini (Secondary) ──
    try {
        console.log('🤖 [AIScanner] Attempting GitHub GPT-4.1-mini...');
        const result = await callGitHubModel(messages, "gpt-4.1-mini");
        if (result) {
            const text = result.content;
            const parsed = extractJSON(text);
            if (Array.isArray(parsed) && parsed.length > 0) { // Assuming extractJSON returns array directly
                console.log(`✅ [AIScanner] GitHub GPT-4.1-mini generated ${parsed.length} signals`);
                return { signals: parsed, provider: 'github-gpt-4.1-mini' };
            }
        }
    } catch (e) { console.warn('⚠️ [AIScanner] GitHub GPT-4.1-mini failed:', e.message); }

    // ── 3. Try Bytez (GPT-4.1-mini) — Tertiary ──
    try {
        console.log('🤖 [AIScanner] Attempting Bytez GPT-4.1-mini...');
        const output = await getBytezOutput(messages);
        if (output) {
            const parsed = extractJSON(output);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`✅ [AIScanner] Bytez generated ${parsed.length} signals`);
                return { signals: parsed, provider: 'bytez-gpt-4.1-mini' };
            }
        }
    } catch (e) {
        console.warn('⚠️ [AIScanner] Bytez failed:', e.message);
    }

    // ── 4. Try Gemini (gemini-2.0-flash) — Quaternary ──
    try {
        console.log('🤖 [AIScanner] Attempting Gemini 2.0 Flash...');
        const text = await callGemini(messages);
        if (text) {
            const parsed = extractJSON(text);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`✅ [AIScanner] Gemini generated ${parsed.length} signals`);
                return { signals: parsed, provider: 'gemini-2.0-flash' };
            }
        }
    } catch (e) {
        console.warn('⚠️ [AIScanner] Gemini failed:', e.message);
    }

    // ── 5. Try Groq (LLaMA 3.3-70B) — Quinary ──
    try {
        console.log('🤖 [AIScanner] Attempting Groq LLaMA 3.3-70B...');
        const groq = getGroqClient();
        if (groq) {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.85,
                max_tokens: 2000
            });
            const text = completion.choices?.[0]?.message?.content || '';
            const parsed = extractJSON(text);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`✅ [AIScanner] Groq generated ${parsed.length} signals`);
                return { signals: parsed, provider: 'groq-llama-3.3-70b' };
            }
        }
    } catch (e) {
        console.warn('⚠️ [AIScanner] Groq failed:', e.message);
    }

    // ── 4. Fallback (skill-based rules) ──
    console.log('🤖 [AIScanner] All AI providers failed, using fallback...');
    return { signals: generateFallbackSignals(skillProfile), provider: 'fallback' };
}

/**
 * Fallback signal generation when all AI providers are unavailable.
 */
function generateFallbackSignals(skillProfile) {
    const { topSkills, weakSkills } = skillProfile;
    const signals = [];

    if (topSkills.some(s => ['react', 'javascript', 'nextjs', 'vue', 'angular'].includes(s.toLowerCase()))) {
        signals.push({
            title: 'React Server Components Adoption Accelerating Across Enterprise',
            source: 'github_trending',
            description: 'Server Components are becoming the standard pattern in React applications. Your React expertise positions you well for senior frontend roles.',
            skillTags: ['react', 'nextjs', 'javascript', 'typescript'],
            skillCluster: 'frontend',
            opportunityScore: 0.85, trendMomentum: 0.7, confidence: 0.8
        });
    }

    if (topSkills.some(s => ['python', 'machinelearning', 'datascience', 'tensorflow', 'pytorch'].includes(s.toLowerCase()))) {
        signals.push({
            title: 'AI/ML Engineer Demand Surges 45% — Companies Racing to Build AI Teams',
            source: 'hiring_signal',
            description: 'With the AI revolution in full swing, ML engineers command premium salaries. Your Python and data science skills are highly sought after.',
            skillTags: ['python', 'machinelearning', 'tensorflow', 'datascience'],
            skillCluster: 'ai_ml',
            opportunityScore: 0.92, trendMomentum: 0.9, confidence: 0.88
        });
    }

    if (topSkills.some(s => ['nodejs', 'express', 'mongodb', 'sql', 'postgresql'].includes(s.toLowerCase()))) {
        signals.push({
            title: 'Full-Stack Node.js Developers in High Demand for Startup Ecosystem',
            source: 'hiring_signal',
            description: 'Startups are seeking full-stack developers proficient in Node.js and modern databases. Your backend expertise is a strong match.',
            skillTags: ['nodejs', 'express', 'mongodb', 'javascript'],
            skillCluster: 'backend',
            opportunityScore: 0.82, trendMomentum: 0.5, confidence: 0.85
        });
    }

    signals.push({
        title: 'Open Source Contributions Now Weighted Heavily in Tech Hiring',
        source: 'industry_report',
        description: `Contributing to open source projects in ${topSkills[0] || 'your area'} can significantly boost your visibility to recruiters.`,
        skillTags: topSkills.slice(0, 4).map(s => s.toLowerCase()),
        skillCluster: 'general',
        opportunityScore: 0.75, trendMomentum: 0.4, confidence: 0.82
    });

    if (weakSkills.length > 0) {
        signals.push({
            title: `Skill Gap Alert: ${weakSkills[0].charAt(0).toUpperCase() + weakSkills[0].slice(1)} Refresher Would Strengthen Your Profile`,
            source: 'research_trend',
            description: `Your ${weakSkills[0]} skills are showing decay. A focused 2-week refresher could prevent knowledge loss.`,
            skillTags: weakSkills.slice(0, 3).map(s => s.toLowerCase()),
            skillCluster: 'general',
            opportunityScore: 0.68, trendMomentum: 0.3, confidence: 0.9
        });
    }

    return signals.length > 0 ? signals : [{
        title: 'Build Your Developer Portfolio to Stand Out in Job Market',
        source: 'industry_report',
        description: 'A strong portfolio with real projects is the #1 factor that differentiates candidates.',
        skillTags: ['portfolio', 'career', 'projects'],
        skillCluster: 'general',
        opportunityScore: 0.7, trendMomentum: 0.35, confidence: 0.9
    }];
}

// ========================================
// PUBLIC API
// ========================================

/**
 * Scan and generate AI-powered opportunity signals for a user.
 */
async function scanForUser(userId) {
    // Cooldown check
    const lastScan = scanCooldowns.get(userId.toString());
    if (lastScan && (Date.now() - lastScan < SCAN_COOLDOWN_MS)) {
        const minutesLeft = Math.ceil((SCAN_COOLDOWN_MS - (Date.now() - lastScan)) / 60000);
        return {
            status: 'cooldown',
            message: `AI scanner on cooldown. Next scan available in ${minutesLeft} minute(s).`,
            minutesLeft
        };
    }

    // Get user's PKG
    const pkg = await pkgService.getPKG(userId);
    const skillProfile = buildSkillSummary(pkg);

    if (!skillProfile) {
        return {
            status: 'no_skills',
            message: 'No skills tracked yet. Complete some challenges or learning sessions first.',
            signalsGenerated: 0
        };
    }

    // Get target role
    let targetRole = 'Software Developer';
    try {
        const LearnerProfile = (await import('../models/LearnerProfile.js')).default;
        const profile = await LearnerProfile.findOne({ userId }).lean();
        if (profile?.goals?.targetRole) targetRole = profile.goals.targetRole;
    } catch (e) { /* OK */ }

    // Generate AI signals (Bytez → Gemini → Groq → Fallback)
    console.log(`🔍 [AIScanner] Scanning opportunities for user ${userId}...`);
    const { signals: aiSignals, provider } = await generateAISignals(skillProfile, targetRole);

    // Prepare signals for ingestion
    const preparedSignals = aiSignals.map((signal, idx) => ({
        ...signal,
        signalId: opportunityRadarService.signalHash(signal.title + Date.now() + idx, signal.source || 'ai_generated'),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
        detectedAt: new Date(),
        confidence: signal.confidence || 0.75
    }));

    // Ingest into the radar system
    const result = await opportunityRadarService.ingestSignals(preparedSignals);

    // Set cooldown
    scanCooldowns.set(userId.toString(), Date.now());

    console.log(`✅ [AIScanner] Scan complete via ${provider}: ${result.ingested} ingested, ${result.skipped} skipped`);

    return {
        status: 'success',
        message: `AI scanner found ${result.ingested} new opportunities tailored to your skills.`,
        signalsGenerated: result.ingested,
        skipped: result.skipped,
        aiModel: provider,
        nextScanAvailable: new Date(Date.now() + SCAN_COOLDOWN_MS)
    };
}

/**
 * Auto-scan on first radar visit (if no recent signals exist).
 * Only scans if user has actual skills in their PKG.
 */
async function autoScanIfNeeded(userId) {
    // First, check if user has any skills — skip scan for brand new users
    const pkg = await pkgService.getPKG(userId);
    const skillProfile = buildSkillSummary(pkg);
    if (!skillProfile) {
        return { status: 'no_skills', message: 'No skills tracked yet.', count: 0 };
    }

    const OpportunitySignal = (await import('../models/OpportunitySignal.js')).default;
    const recentCount = await OpportunitySignal.countDocuments({
        isActive: true,
        detectedAt: { $gte: new Date(Date.now() - 24 * 3600000) }
    });

    if (recentCount >= 3) {
        return { status: 'sufficient_signals', count: recentCount };
    }

    return scanForUser(userId);
}

export default {
    scanForUser,
    autoScanIfNeeded,
    generateAISignals,
    buildSkillSummary
};
