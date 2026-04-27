import pkgService from './pkgService.js';
import AchievementProof from '../models/AchievementProof.js';
import { extractJSON } from '../utils/aiUtils.js';
import Groq from 'groq-sdk';
import Bytez from 'bytez.js';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

/**
 * OUTREACH GENERATOR SERVICE
 * ===========================
 * LLM-powered professional outreach message generator.
 *
 * AI Provider Order (matches platform standard):
 *   1. GitHub (gpt-4.1) — Primary
 *   2. GitHub (gpt-4.1-mini) — Secondary
 *   3. Bytez (GPT-4.1-mini) — Tertiary
 *   4. Gemini (gemini-2.0-flash) — Quaternary
 *   5. Groq (LLaMA 3.3-70B) — Quinary
 *   6. Fallback (template-based) — Last resort
 *
 * Gate conditions:
 *   - microProject completed (has AchievementProof of type mission_completion)
 *   - mastery >= MASTERY_THRESHOLD (0.6)
 *
 * Generates 3 messages:
 *   1. Initial connection message
 *   2. Follow-up message
 *   3. Value-driven technical question
 */

const MASTERY_THRESHOLD = 0.6;

// ========================================
// AI CLIENT HELPERS
// ========================================

function getBytezModel(modelName = 'openai/gpt-4.1-mini') {
    if (!process.env.OPENAI_API_KEY) return null;
    try {
        const sdk = new Bytez(process.env.OPENAI_API_KEY);
        return sdk.model(modelName);
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

async function callGemini(messages) {
    if (!process.env.GEMINI_API_KEY) return null;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsg = messages.find(m => m.role === 'user')?.content || '';
    const body = {
        contents: [{ parts: [{ text: `${systemMsg}\n\n${userMsg}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
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

function getGroqClient() {
    if (!process.env.GROQ_API_KEY) return null;
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// ========================================
// GATE CHECKS
// ========================================

/**
 * Check all pre-conditions for outreach generation.
 * @returns {{ allowed: boolean, reason?: string, context?: object }}
 */
async function checkGates(userId) {
    // 1. Check PKG mastery
    const pkg = await pkgService.getPKG(userId);
    const skills = Array.isArray(pkg.skills) ? pkg.skills.map(s => [s.skillId || s.displayName || 'unknown', s]) : (pkg.skills instanceof Map ? Array.from(pkg.skills.entries()) : []);

    if (skills.length === 0) {
        return { allowed: false, reason: 'No skills tracked. Complete learning sessions first.' };
    }

    const avgMastery = skills.reduce((sum, [, data]) => {
        return sum + (data.masteryScore || (data.level / 100) || 0);
    }, 0) / skills.length;

    if (avgMastery < MASTERY_THRESHOLD) {
        return {
            allowed: false,
            reason: `Average mastery ${Math.round(avgMastery * 100)}% is below ${MASTERY_THRESHOLD * 100}% threshold. Keep building skills.`,
            context: { avgMastery }
        };
    }

    // 2. Check micro-project completion (AchievementProof of type mission_completion)
    const completedProjects = await AchievementProof.countDocuments({
        userId,
        proofType: { $in: ['mission_completion', 'project_showcase'] },
        status: { $in: ['generated', 'published'] }
    });

    if (completedProjects === 0) {
        return {
            allowed: false,
            reason: 'Complete at least one micro-project before generating outreach messages.',
            context: { avgMastery, completedProjects }
        };
    }

    // Get top skills for context
    const topSkills = skills
        .sort((a, b) => ((b[1].masteryScore || 0) - (a[1].masteryScore || 0)))
        .slice(0, 5)
        .map(([name, data]) => ({
            name,
            mastery: Math.round((data.masteryScore || (data.level / 100) || 0) * 100)
        }));

    return {
        allowed: true,
        context: { avgMastery, completedProjects, topSkills }
    };
}

// ========================================
// LLM OUTREACH GENERATION
// ========================================

const SYSTEM_PROMPT = `You are an elite career networking strategist. You write professional, authentic, and compelling outreach messages.
Your messages should:
- Be concise (max 150 words each)
- Sound genuine and personalized, never spammy
- Reference the user's actual skills and projects
- Provide value before asking for anything
- Be appropriate for LinkedIn/email professional context
Always return valid JSON only. No markdown, no explanation.`;

function buildOutreachPrompt(params) {
    const { connectionName, connectionRole, connectionCompany, userSkills, userProject, cluster, roleTarget } = params;
    return `Generate 3 professional outreach messages for this networking context:

TARGET PERSON:
- Name: ${connectionName}
- Role: ${connectionRole}
- Company: ${connectionCompany}

SENDER CONTEXT:
- Top skills: ${userSkills.map(s => `${s.name} (${s.mastery}%)`).join(', ')}
- Recently completed: ${userProject || 'a relevant micro-project'}
- Target career cluster: ${cluster || 'Technology'}
- Target role: ${roleTarget || 'Software Engineer'}

Return ONLY a JSON object:
{
  "messages": [
    {
      "type": "initial_connection",
      "subject": "Short subject line",
      "body": "Connection request message (max 150 words). Mention shared interest, your relevant project, and genuine curiosity.",
      "tone": "professional_warm"
    },
    {
      "type": "follow_up",
      "subject": "Follow-up subject line",
      "body": "Follow-up message after connection accepted (max 150 words). Offer specific value, ask thoughtful question.",
      "tone": "collegial"
    },
    {
      "type": "technical_question",
      "subject": "Technical discussion subject",
      "body": "Value-driven technical question (max 150 words). Show expertise while asking for their perspective on a specific challenge.",
      "tone": "intellectual_peer"
    }
  ],
  "strategy": "Brief 1-sentence networking strategy suggestion"
}`;
}

/**
 * Generate outreach messages using AI with fallback chain.
 * Bytez (GPT-4.1-mini) → Gemini → Groq → Template Fallback
 */
async function generateWithAI(promptParams) {
    const prompt = buildOutreachPrompt(promptParams);
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
    ];

    // ── 1. Try GitHub GPT-4.1 (Primary) ──
    try {
        console.log('🤖 [OutreachGen] Attempting GitHub GPT-4.1...');
        const result = await callGitHubModel(messages, "gpt-4.1");
        if (result) {
            const text = result.content;
            const parsed = extractJSON(text);
            if (parsed?.messages && Array.isArray(parsed.messages)) {
                console.log('✅ [OutreachGen] GitHub GPT-4.1 generated outreach messages');
                return { result: parsed, provider: 'github-gpt-4.1' };
            }
        }
    } catch (e) { console.warn('⚠️ [OutreachGen] GitHub GPT-4.1 failed:', e.message); }

    // ── 2. Try GitHub GPT-4.1-mini (Secondary) ──
    try {
        console.log('🤖 [OutreachGen] Attempting GitHub GPT-4.1-mini...');
        const result = await callGitHubModel(messages, "gpt-4.1-mini");
        if (result) {
            const text = result.content;
            const parsed = extractJSON(text);
            if (parsed?.messages && Array.isArray(parsed.messages)) {
                console.log('✅ [OutreachGen] GitHub GPT-4.1-mini generated outreach messages');
                return { result: parsed, provider: 'github-gpt-4.1-mini' };
            }
        }
    } catch (e) { console.warn('⚠️ [OutreachGen] GitHub GPT-4.1-mini failed:', e.message); }

    // ── 3. Try Bytez (GPT-4.1-mini) — Tertiary ──
    try {
        console.log('🤖 [OutreachGen] Attempting Bytez GPT-4.1-mini...');
        const model = getBytezModel('openai/gpt-4.1-mini');
        if (model) {
            const { error, output } = await model.run(messages);
            if (!error && output) {
                const text = typeof output === 'string' ? output : (output?.content || JSON.stringify(output));
                const parsed = extractJSON(text);
                if (parsed?.messages && Array.isArray(parsed.messages)) {
                    console.log('✅ [OutreachGen] Bytez generated outreach messages');
                    return { result: parsed, provider: 'bytez-gpt-4.1-mini' };
                }
            }
            if (error) console.warn('⚠️ [OutreachGen] Bytez error:', error);
        }
    } catch (e) {
        console.warn('⚠️ [OutreachGen] Bytez failed:', e.message);
    }

    // ── 2. Try Gemini (gemini-2.0-flash) — Secondary ──
    try {
        console.log('🤖 [OutreachGen] Attempting Gemini 2.0 Flash...');
        const text = await callGemini(messages);
        if (text) {
            const parsed = extractJSON(text);
            if (parsed?.messages && Array.isArray(parsed.messages)) {
                console.log('✅ [OutreachGen] Gemini generated outreach messages');
                return { result: parsed, provider: 'gemini-2.0-flash' };
            }
        }
    } catch (e) {
        console.warn('⚠️ [OutreachGen] Gemini failed:', e.message);
    }

    // ── 3. Try Groq (LLaMA 3.3-70B) — Tertiary ──
    try {
        console.log('🤖 [OutreachGen] Attempting Groq LLaMA 3.3-70B...');
        const groq = getGroqClient();
        if (groq) {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.7,
                max_tokens: 2000
            });
            const text = completion.choices?.[0]?.message?.content || '';
            const parsed = extractJSON(text);
            if (parsed?.messages && Array.isArray(parsed.messages)) {
                console.log('✅ [OutreachGen] Groq generated outreach messages');
                return { result: parsed, provider: 'groq-llama-3.3-70b' };
            }
        }
    } catch (e) {
        console.warn('⚠️ [OutreachGen] Groq failed:', e.message);
    }

    // ── 4. Fallback (template-based) ──
    console.log('🤖 [OutreachGen] All AI providers failed, using template fallback...');
    return { result: generateTemplateOutreach(promptParams), provider: 'template-fallback' };
}

/**
 * Template-based fallback when all AI providers fail.
 */
function generateTemplateOutreach({ connectionName, connectionRole, connectionCompany, userSkills, userProject, cluster }) {
    const topSkill = userSkills?.[0]?.name || 'software development';
    const firstName = connectionName?.split(' ')[0] || 'there';

    return {
        messages: [
            {
                type: 'initial_connection',
                subject: `Connecting on ${cluster || 'tech'}`,
                body: `Hi ${firstName}, I came across your profile and was impressed by your work as ${connectionRole} at ${connectionCompany}. I've been building my expertise in ${topSkill} and recently completed ${userProject || 'a relevant project'}. I'd love to connect and learn from your experience in the ${cluster || 'technology'} space.`,
                tone: 'professional_warm'
            },
            {
                type: 'follow_up',
                subject: `Thanks for connecting, ${firstName}`,
                body: `Hi ${firstName}, thanks for connecting! I've been following ${connectionCompany}'s work in ${cluster || 'the space'} and I'd love to learn more about your experience. I recently built a project using ${topSkill} that I think relates to what your team does. Would you have 15 minutes for a brief chat sometime?`,
                tone: 'collegial'
            },
            {
                type: 'technical_question',
                subject: `Quick question on ${topSkill}`,
                body: `Hi ${firstName}, I've been diving deep into ${topSkill} and had a question I think you'd have great insight on — given your experience at ${connectionCompany}. What would you say is the biggest technical challenge in scaling ${cluster || 'modern systems'} today? I've been exploring some approaches in my recent project and would value your perspective.`,
                tone: 'intellectual_peer'
            }
        ],
        strategy: 'Lead with genuine curiosity and relevant project experience before making any asks.'
    };
}

// ========================================
// PUBLIC API
// ========================================

/**
 * Generate outreach messages for a target connection.
 *
 * @param {string} userId - Current user ID
 * @param {Object} params
 * @param {string} params.connectionName  - Target person's name
 * @param {string} params.connectionRole  - Target person's role
 * @param {string} params.connectionCompany - Target person's company
 * @param {string} params.cluster         - Career cluster (e.g. "AI Infrastructure")
 * @param {string} params.roleTarget      - User's target role
 * @param {string} params.microProject    - Completed micro-project title
 *
 * @returns {{ success, messages, provider, gateStatus }}
 */
async function generateOutreach(userId, params) {
    // ── Gate check ──
    const gateCheck = await checkGates(userId);
    if (!gateCheck.allowed) {
        return {
            success: false,
            gated: true,
            reason: gateCheck.reason,
            context: gateCheck.context
        };
    }

    // ── Build context for LLM ──
    const promptParams = {
        connectionName: params.connectionName || 'the professional',
        connectionRole: params.connectionRole || 'Engineer',
        connectionCompany: params.connectionCompany || 'the company',
        userSkills: gateCheck.context.topSkills,
        userProject: params.microProject || null,
        cluster: params.cluster || '',
        roleTarget: params.roleTarget || ''
    };

    // ── Generate with AI (Bytez → Gemini → Groq → Template) ──
    const { result, provider } = await generateWithAI(promptParams);

    return {
        success: true,
        messages: result.messages || [],
        strategy: result.strategy || '',
        provider,
        context: {
            avgMastery: gateCheck.context.avgMastery,
            completedProjects: gateCheck.context.completedProjects,
            topSkills: gateCheck.context.topSkills
        }
    };
}

/**
 * Check if outreach generation is currently allowed for a user.
 */
async function getGateStatus(userId) {
    return checkGates(userId);
}

export default {
    generateOutreach,
    getGateStatus,
    checkGates,
    MASTERY_THRESHOLD
};
