import LearnerProfile from '../models/LearnerProfile.js';
import { extractJSON } from '../utils/aiUtils.js';
import Groq from "groq-sdk";
import Bytez from "bytez.js";
import axios from 'axios';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import queueService from '../services/queueService.js';

const RX_API_BASE = "https://rxresu.me/api/openapi";

const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        console.warn("⚠️ GROQ_API_KEY is missing. AI features will be disabled.");
        return null;
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const getBytezClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("⚠️ Bytez/OpenAI Key missing. Falling back to Groq.");
        return null;
    }
    return new Bytez(process.env.OPENAI_API_KEY);
};

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
                temperature: 0.1,
                max_tokens: 4096
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

/**
 * AI MODEL WRAPPER
 */
async function callAI(prompt, systemPrompt = "You are an ATS-compliant resume generation and optimization engine.") {
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
    ];

    // 1. Try GitHub GPT-4.1 (Primary)
    try {
        console.log("🤖 Attempting GitHub GPT-4.1...");
        const result = await callGitHubModel(messages, "gpt-4.1");
        if (result) {
            console.log("✅ GitHub GPT-4.1 success");
            return result.content;
        }
    } catch (e) { console.warn("⚠️ GitHub GPT-4.1 failed:", e.message); }

    // 2. Try GitHub GPT-4.1-mini (Secondary)
    try {
        console.log("🤖 Attempting GitHub GPT-4.1-mini...");
        const result = await callGitHubModel(messages, "gpt-4.1-mini");
        if (result) {
            console.log("✅ GitHub GPT-4.1-mini success");
            return result.content;
        }
    } catch (e) { console.warn("⚠️ GitHub GPT-4.1-mini failed:", e.message); }

    // 3. Try Bytez GPT-4.1-mini (Existing Fallback)
    try {
        console.log("🤖 Falling back to Bytez...");
        const bytez = getBytezClient();
        if (bytez) {
            const model = bytez.model("openai/gpt-4.1-mini");
            const { error, output } = await model.run(messages);
            if (!error && output) {
                console.log("✅ Bytez success");
                return typeof output === 'string' ? output : (output?.content || JSON.stringify(output));
            }
        }
    } catch (e) { console.warn("⚠️ Bytez failed:", e.message); }

    // 4. Try Groq (Tertiary Fallback)
    try {
        console.log("🤖 Falling back to Groq...");
        const groq = getGroqClient();
        if (groq) {
            const completion = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" }
            });
            console.log("✅ Groq success");
            return completion.choices[0].message.content;
        }
    } catch (e) { console.warn("⚠️ Groq failed:", e.message); }

    throw new Error("All AI services failed.");
}

/**
 * Enhanced AI Call with Provider Metadata
 */
async function callAIWithMetadata(prompt, systemPrompt = "You are an ATS-compliant resume generation and optimization engine.") {
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
    ];

    // 1. Try GitHub GPT-4.1 (Primary)
    try {
        console.log("🤖 Attempting GitHub GPT-4.1...");
        const result = await callGitHubModel(messages, "gpt-4.1");
        if (result) {
            console.log("✅ GitHub GPT-4.1 success");
            return { content: result.content, provider: "github-models", model: "gpt-4.1" };
        }
    } catch (e) { console.warn("⚠️ GitHub GPT-4.1 failed:", e.message); }

    // 2. Try GitHub GPT-4.1-mini (Secondary)
    try {
        console.log("🤖 Attempting GitHub GPT-4.1-mini...");
        const result = await callGitHubModel(messages, "gpt-4.1-mini");
        if (result) {
            console.log("✅ GitHub GPT-4.1-mini success");
            return { content: result.content, provider: "github-models", model: "gpt-4.1-mini" };
        }
    } catch (e) { console.warn("⚠️ GitHub GPT-4.1-mini failed:", e.message); }

    // 3. Try Bytez GPT-4.1-mini (Existing Fallback)
    try {
        console.log("🤖 Falling back to Bytez...");
        const bytez = getBytezClient();
        if (bytez) {
            const model = bytez.model("openai/gpt-4.1-mini");
            const { error, output } = await model.run(messages);
            if (!error && output) {
                return { content: output.content || JSON.stringify(output), provider: "bytez", model: "gpt-4.1-mini" };
            }
        }
    } catch (e) { console.warn("⚠️ Bytez fallback failed:", e.message); }

    // 4. Try Groq (Tertiary Fallback)
    try {
        console.log("🤖 Falling back to Groq...");
        const groq = getGroqClient();
        if (groq) {
            const completion = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" }
            });
            console.log("✅ Groq success");
            return { 
                content: completion.choices[0].message.content, 
                provider: "groq", 
                model: "llama-3.3-70b" 
            };
        }
    } catch (e) { console.warn("⚠️ Groq failed:", e.message); }

    throw new Error("All AI services failed.");
}

/**
 * 🥇 BACKGROUND WORKER PROCESSOR
 * Executed by Agenda queue to generate the resume 
 */
export async function processResumeGeneration(jobData) {
    const { userId, target_role, job_description, custom_sections, push_to_rx } = jobData;

    const profile = await LearnerProfile.findOne({ userId });
    if (!profile) throw new Error("Profile not found");

    // Build context from profile + user edits
    const context = {
        skills: custom_sections?.skills || profile.masteredSkills?.map(s => s.name) || [],
        projects: custom_sections?.projects || profile.portfolio?.customProjects || [],
        experience: custom_sections?.experience || profile.portfolio?.experience || [],
        interests: custom_sections?.interests || []
    };

    const systemPrompt = `🥇 MASTER RESUME AI CONTROLLER PROMPT
You are an elite ATS-compliant resume architect.
Your task is to:
1. Optimize bullets for ATS (Applicant Tracking Systems) using impact-driven action verbs.
2. Calculate a "Match Score" (0-100) based on JD alignment.
3. Extract 8 strategic keywords.
4. Provide strategic reasoning for the suggested template.
   VALID TEMPLATES: azurill, bronzor, chikorita, ditgar, ditto, gengar, glalie, kakuna, lapras, leafish, onyx, pikachu, rhyhorn.
5. Output ONLY JSON.`;

    const prompt = `
ROLE: ${target_role}
JD: ${job_description || 'None'}
DATA: ${JSON.stringify(context)}

Return JSON: { 
  "ats_score": 85,
  "recruiter_impact": 82,
  "market_alignment": 90,
  "strategic_reasoning": "...",
  "extracted_keywords": [],
  "optimized_experience": [ { "company": "...", "description": "..." } ],
  "optimized_projects": [ { "name": "...", "description": "..." } ],
  "reactive_resume_metadata": { "template": "onyx", "accentColor": "#4f46e5" }
}
(Note: recruiter_impact and market_alignment should be 0-100 scores based on how strongly the profile matches the market expectations for the target role.)`;

    // Explicitly scope variables to prevent ReferenceErrors if destructuring fails
    let content, provider, model;
    try {
        const aiResponse = await callAIWithMetadata(prompt, systemPrompt);
        content = aiResponse.content;
        provider = aiResponse.provider;
        model = aiResponse.model;
    } catch (aiErr) {
        console.error("❌ AI Résumé Orchestration Failed:", aiErr.message);
        throw aiErr;
    }

    const aiResult = extractJSON(content);

    // Map to exact Reactive Resume v5 Schema (OpenAPI Import)
    const rxPayload = mapToReactiveResume(profile, aiResult, target_role, context);

    let rxResponse = null;
    if (push_to_rx) {
        try {
            console.log("📤 Pushing to Rx API (import)");
            const response = await axios.post(`${RX_API_BASE}/resumes/import`, { data: rxPayload.data }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.REACTIVE_RESUME_API_KEY
                }
            });

            const resumeId = typeof response.data === 'string' ? response.data : (response.data?.id || response.data);
            rxResponse = {
                id: resumeId,
                url: `https://rxresu.me/builder/${resumeId}`
            };
        } catch (apiErr) {
            console.error("❌ Rx API Push Failed Detailed");
            rxResponse = {
                error: "Reactive Resume API Error",
                details: apiErr.response?.data?.message || apiErr.message,
                issues: apiErr.response?.data?.data?.issues
            };
        }
    }

    // This object is saved into the job document's "result" field
    return {
        success: true,
        data: aiResult,
        provider: provider,
        model: model, // Detailed model name (gpt-4.1, gpt-4o-mini, etc.)
        source: 'primary-engine',
        reactive_resume: rxPayload,
        rx_api_response: rxResponse,
        timestamp: new Date().toISOString()
    };
}

/**
 * 🥇 MASTER RESUME AI ORCHESTRATOR ENDPOINT
 * POST /api/ai/resume-orchestrator
 * NOW RETURNS 202 ACCEPTED with a Job ID
 */
export async function resumeOrchestrator(req, res) {
    try {
        let { target_role, job_description, custom_sections, push_to_rx } = req.body;
        const userId = req.userId;

        // Phase 4 Intelligence Sync: Enforce role input for precision
        if (!target_role && !req.body.initial_target_role) {
            return res.status(400).json({ success: false, error: 'Target Position is required for AI Optimization.' });
        }
        
        if (!target_role) target_role = req.body.initial_target_role;

        // Dispatch heavy AI job to background
        const { jobId } = await queueService.enqueueJob('generate_resume', {
            userId,
            target_role,
            job_description,
            custom_sections,
            push_to_rx,
            mode: 'resume'
        }, {
            ownerUserId: userId,
        });

        // Immediately unblock the frontend with 202 status
        res.status(202).json({
            success: true,
            message: "Resume generation started successfully.",
            data: { jobId }
        });

    } catch (error) {
        console.error("Resume Queue Error:", error);
        res.status(500).json({ success: false, error: 'Failed to queue generation job' });
    }
}

/**
 * MAPPING LOGIC (RxResu.me v5 OpenAPI Schema)
 * Exhaustive mapping to avoid "Input validation failed" (400)
 */
function mapToReactiveResume(profile, aiResult, target_role, context) {
    const portfolio = profile.portfolio || {};
    const timestamp = Date.now();
    const resumeId = `resume-${timestamp}`;

    // Helper for empty strings/objects to satisfy strict validation
    const emptyWebsite = { url: "", label: "" };
    const defaultOptions = { showLinkInTitle: false };
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // Valid template names per v5 spec enum
    const VALID_TEMPLATES = ['azurill', 'bronzor', 'chikorita', 'ditgar', 'ditto', 'gengar', 'glalie', 'kakuna', 'lapras', 'leafish', 'onyx', 'pikachu', 'rhyhorn'];
    const pickTemplate = (suggested) => VALID_TEMPLATES.includes(suggested) ? suggested : 'azurill';

    return {
        name: portfolio.contactInfo?.name ? `${portfolio.contactInfo.name} - ${target_role}` : `Resume - ${target_role}`,
        slug: `${resumeId}`,
        data: {
            picture: {
                hidden: true,
                url: "",
                size: 64,
                rotation: 0,
                aspectRatio: 1,
                borderRadius: 0,
                borderColor: "#000000",
                borderWidth: 0,
                shadowColor: "#000000",
                shadowWidth: 0
            },
            basics: {
                name: portfolio.contactInfo?.name || profile.username || "Professional",
                headline: target_role,
                email: portfolio.contactInfo?.email || "",
                phone: portfolio.contactInfo?.phone || "",
                location: portfolio.contactInfo?.location || "",
                website: { url: portfolio.socialLinks?.website || "", label: "Portfolio" },
                customFields: []
            },
            summary: {
                title: "Professional Summary",
                columns: 1,
                hidden: false,
                content: portfolio.professionalSummary || ""
            },
            sections: {
                experience: {
                    title: "Experience",
                    columns: 1,
                    hidden: false,
                    items: context.experience.map(exp => {
                        const optimized = aiResult?.optimized_experience?.find(o => o.company === exp.company);
                        return {
                            id: generateId(),
                            hidden: false,
                            options: defaultOptions,
                            company: exp.company || exp.role || "Company",
                            position: exp.role || "",
                            location: exp.location || "",
                            period: exp.date || `${exp.startDate || ""} - ${exp.endDate || ""}` || "",
                            website: emptyWebsite,
                            description: optimized?.description || exp.description || ""
                        };
                    })
                },
                projects: {
                    title: "Projects",
                    columns: 1,
                    hidden: false,
                    items: context.projects.map(p => {
                        const optimized = aiResult?.optimized_projects?.find(o => o.name === p.title);
                        return {
                            id: generateId(),
                            hidden: false,
                            options: defaultOptions,
                            name: p.title || "Project",
                            description: optimized?.description || p.description || "",
                            period: p.period || `${p.startDate || ""} - ${p.endDate || ""}` || "",
                            website: { url: p.link || "", label: "Link" }
                        };
                    })
                },
                education: {
                    title: "Education",
                    columns: 1,
                    hidden: false,
                    items: (portfolio.education || []).map(edu => ({
                        id: generateId(),
                        hidden: false,
                        options: defaultOptions,
                        school: edu.institution || "School",
                        degree: edu.degree || "",
                        area: edu.fieldOfStudy || "",
                        grade: edu.gpa || "",
                        location: edu.location || "",
                        period: `${edu.startYear || ""} - ${edu.endYear || ""}`,
                        website: emptyWebsite,
                        description: edu.achievements?.join(", ") || ""
                    }))
                },
                skills: {
                    title: "Skills",
                    columns: 1,
                    hidden: false,
                    items: context.skills.map(s => ({
                        id: generateId(),
                        hidden: false,
                        options: defaultOptions,
                        name: s || "Skill",
                        proficiency: "Advanced",
                        level: 4,
                        icon: "",
                        keywords: []
                    }))
                },
                interests: {
                    title: "Interests",
                    columns: 1,
                    hidden: false,
                    items: context.interests.map(it => ({
                        id: generateId(),
                        hidden: false,
                        options: defaultOptions,
                        name: it || "Interest",
                        icon: "",
                        keywords: []
                    }))
                },
                profiles: { title: "Profiles", columns: 1, hidden: false, items: [] },
                languages: { title: "Languages", columns: 1, hidden: false, items: [] },
                awards: { title: "Awards", columns: 1, hidden: false, items: [] },
                certifications: { title: "Certifications", columns: 1, hidden: false, items: [] },
                publications: { title: "Publications", columns: 1, hidden: false, items: [] },
                volunteer: { title: "Volunteer", columns: 1, hidden: false, items: [] },
                references: { title: "References", columns: 1, hidden: false, items: [] }
            },
            customSections: [],
            metadata: {
                template: pickTemplate(aiResult?.reactive_resume_metadata?.template),
                layout: {
                    sidebarWidth: 30,
                    pages: [
                        { fullWidth: false, main: ["experience", "projects", "education"], sidebar: ["basics", "skills", "interests"] }
                    ]
                },
                css: { enabled: false, value: "" },
                page: {
                    gapX: 12,
                    gapY: 12,
                    marginX: 12,
                    marginY: 12,
                    format: "a4",
                    locale: "en-US",
                    hideIcons: false
                },
                design: {
                    level: { icon: "circle", type: "hidden" },
                    colors: {
                        primary: aiResult?.reactive_resume_metadata?.accentColor || "#4f46e5",
                        text: "#000000",
                        background: "#ffffff"
                    }
                },
                typography: {
                    body: { fontFamily: "Inter", fontWeights: ["400", "700"], fontSize: 10, lineHeight: 1.5 },
                    heading: { fontFamily: "Inter", fontWeights: ["400", "700", "900"], fontSize: 12, lineHeight: 1.2 }
                },
                notes: ""
            }
        }
    };
}
