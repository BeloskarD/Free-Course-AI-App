import User from '../models/User.js';
import LearnerProfile from '../models/LearnerProfile.js';
import { UserMissionProgress } from '../models/Mission.js';
import { extractJSON } from '../utils/aiUtils.js';
import Bytez from "bytez.js";
import Groq from 'groq-sdk';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

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
 * Primary: Bytez (GPT-4.1 Mini)
 * Fallback: Groq (Llama 3.3)
 */
async function callAI(prompt, systemPrompt = "You are an elite career coach and resume expert.") {
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
 * GET /api/portfolio/:id
 * Fetch public portfolio data for a user
 */
export async function getPublicPortfolio(req, res) {
    try {
        const { id } = req.params;

        // 1. Fetch User (Core profile)
        const user = await User.findById(id).select('name avatar gamification createdAt');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // 2. Fetch Learner Profile (Skills, Readiness, Goals, Portfolio)
        const profile = await LearnerProfile.findOne({ userId: id }).select('goals masteredSkills careerReadiness wellbeing.wellnessStreak lastUpdated portfolio');

        // 3. Fetch Completed Missions
        const completedMissions = await UserMissionProgress.find({
            userId: id,
            status: 'completed'
        })
            .populate({
                path: 'missionId',
                select: 'title description skill subSkill difficulty estimatedTotalMinutes totalPoints stages'
            })
            .sort({ completedAt: -1 })
            .limit(10);

        // Filter and sanitize mission data
        const safeMissions = completedMissions.map(m => ({
            id: m.missionId?._id?.toString() || m._id?.toString(),
            title: m.missionId?.title || 'Unknown Mission',
            description: m.missionId?.description,
            skill: m.missionId?.skill,
            subSkill: m.missionId?.subSkill,
            difficulty: m.missionId?.difficulty,
            duration: m.missionId?.estimatedTotalMinutes,
            points: m.pointsEarned,
            completedAt: m.completedAt,
            stageCount: m.missionId?.stages?.length || 0
        }));

        // Filter and sanitize skill data (Only healthy/verified skills)
        const safeSkills = (profile?.masteredSkills || [])
            .filter(s => s.level >= 30 || s.health?.score >= 50)
            .map(s => ({
                name: s.name,
                level: s.level,
                health: s.health?.score,
                status: s.health?.status,
                badge: s.proof?.badgeLevel,
                isVerified: s.proof?.isVerified,
                lastPracticed: s.lastPracticed
            }))
            .sort((a, b) => b.level - a.level);

        // Aggregate Portfolio JSON
        const portfolio = {
            user: {
                id: user._id,
                name: user.name || 'Elite Learner',
                avatar: user.avatar,
                level: user.gamification?.level || 1,
                xp: user.gamification?.xp || 0,
                achievements: user.gamification?.achievements || [],
                memberSince: user.createdAt
            },
            profile: {
                targetRole: profile?.goals?.targetRole || 'Professional Learner',
                targetTimeline: profile?.goals?.targetTimeline,
                careerReadiness: profile?.careerReadiness?.score || 0,
                wellnessStreak: profile?.wellbeing?.wellnessStreak || 0,
                lastActive: profile?.lastUpdated || user.createdAt,
                professionalSummary: profile?.portfolio?.professionalSummary || '',
                customProjects: profile?.portfolio?.customProjects || [],
                certificates: profile?.portfolio?.certificates || [],
                experience: profile?.portfolio?.experience || [],
                education: profile?.portfolio?.education || [],
                socialLinks: profile?.portfolio?.socialLinks || {},
                featuredSkills: profile?.portfolio?.featuredSkills || []
            },
            skills: safeSkills,
            missions: safeMissions
        };

        res.json({
            success: true,
            data: portfolio,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Portfolio Error:', error);
        res.status(500).json({ success: false, error: 'Failed to aggregate portfolio data' });
    }
}

/**
 * POST /api/portfolio/generate-bio
 * AI-generated professional summary (Bytez Primary)
 */
export async function generateProfessionalSummary(req, res) {
    try {
        const userId = req.userId;
        const profile = await LearnerProfile.findOne({ userId });

        if (!profile) return res.status(404).json({ error: "Profile not found" });

        const skills = profile.masteredSkills.map(s => `${s.name} (${s.level}%)`).join(", ");
        const role = profile.goals.targetRole || "Software Professional";

        const prompt = `
            Generate a high-impact, elite professional bio (2-3 sentences) for a ${role}.
            Skills to highlight: ${skills}.
            Target Audience: Fortune 500 recruiters and top engineering managers.
            Tone: Visionary, technically precise, and growth-oriented.
            Return JSON only: { "summary": "..." }
        `;

        const responseContent = await callAI(prompt);
        const result = extractJSON(responseContent);

        res.json({
            success: true,
            summary: result?.summary || "Professional technologist focused on growth and verified expertise. Passionate about building scalable solutions and mastering cutting-edge technologies."
        });

    } catch (error) {
        console.error('❌ Bio Gen Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/portfolio/refine
 * AI Refinement for specific portfolio segments (Projects, Experience, etc.)
 */
export async function refinePortfolioSegment(req, res) {
    try {
        const { segment, data } = req.body;
        if (!segment || !data) return res.status(400).json({ error: "Missing segment or data" });

        let prompt = "";
        if (segment === 'project') {
            prompt = `
                Refine this project description for a recruiter-friendly portfolio.
                Project: ${data.title}
                Technologies: ${data.technologies}
                Current Description: ${data.description}
                
                Make it sound professional, highlight technical accomplishments, and focus on impact. 
                Return JSON only: { "refinedDescription": "..." }
            `;
        } else if (segment === 'experience') {
            prompt = `
                Refine this work experience entry for an elite resume.
                Role: ${data.role} at ${data.company}
                Description: ${data.description}
                
                Use strong action verbs, emphasize outcomes, and maintain a professional tone. 
                Return JSON only: { "refinedDescription": "..." }
            `;
        } else {
            return res.status(400).json({ error: "Unsupported refinement segment" });
        }

        const responseContent = await callAI(prompt);
        console.log("🔍 Raw AI Response for Refine:", responseContent);
        const result = extractJSON(responseContent);

        const refinedText = result?.refinedDescription || result?.description || (typeof responseContent === 'string' && !responseContent.startsWith('{') ? responseContent : null);

        if (!refinedText) {
            console.warn("⚠️ AI returned no refined text. Fallback to original.");
        }

        res.json({
            success: true,
            refined: refinedText || data.description
        });

    } catch (error) {
        console.error('❌ Refine Error:', error);
        res.status(500).json({ success: false, error: "AI refinement service temporarily unavailable. Please try again in 30 seconds." });
    }
}

/**
 * PATCH /api/portfolio/settings
 * Update portfolio customization - ENHANCED for Enterprise Portfolio
 */
export async function updatePortfolioSettings(req, res) {
    try {
        const userId = req.userId;
        const {
            professionalSummary, headline, customProjects, socialLinks, featuredSkills,
            certificates, experience, education, contactInfo, careerObjective,
            languages, softSkills, volunteering, awards, publications,
            speakingEngagements, references, customSections, skillCategories,
            portfolioTheme, accentColor, privacySettings, showZeeklectBadge
        } = req.body;

        const profile = await LearnerProfile.findOne({ userId });
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        if (!profile.portfolio) profile.portfolio = {};

        // Core Identity
        if (professionalSummary !== undefined) profile.portfolio.professionalSummary = professionalSummary;
        if (headline !== undefined) profile.portfolio.headline = headline;

        // Contact Info
        if (contactInfo !== undefined) profile.portfolio.contactInfo = contactInfo;

        // Career Objectives
        if (careerObjective !== undefined) profile.portfolio.careerObjective = careerObjective;

        // Experience & Education
        if (experience !== undefined) profile.portfolio.experience = experience;
        if (education !== undefined) profile.portfolio.education = education;
        if (certificates !== undefined) profile.portfolio.certificates = certificates;

        // Projects & Showcase
        if (customProjects !== undefined) profile.portfolio.customProjects = customProjects;

        // Skills
        if (featuredSkills !== undefined) profile.portfolio.featuredSkills = featuredSkills;
        if (skillCategories !== undefined) profile.portfolio.skillCategories = skillCategories;
        if (languages !== undefined) profile.portfolio.languages = languages;
        if (softSkills !== undefined) profile.portfolio.softSkills = softSkills;

        // Additional Sections
        if (volunteering !== undefined) profile.portfolio.volunteering = volunteering;
        if (awards !== undefined) profile.portfolio.awards = awards;
        if (publications !== undefined) profile.portfolio.publications = publications;
        if (speakingEngagements !== undefined) profile.portfolio.speakingEngagements = speakingEngagements;
        if (references !== undefined) profile.portfolio.references = references;
        if (customSections !== undefined) profile.portfolio.customSections = customSections;

        // Social Links
        if (socialLinks !== undefined) profile.portfolio.socialLinks = socialLinks;

        // Theme & Display
        if (portfolioTheme !== undefined) profile.portfolio.portfolioTheme = portfolioTheme;
        if (accentColor !== undefined) profile.portfolio.accentColor = accentColor;
        if (showZeeklectBadge !== undefined) profile.portfolio.showZeeklectBadge = showZeeklectBadge;

        // Privacy
        if (privacySettings !== undefined) profile.portfolio.privacySettings = privacySettings;

        // Calculate portfolio completion percentage
        profile.portfolio.completionPercentage = calculateCompletionPercentage(profile.portfolio);
        profile.portfolio.lastUpdated = new Date();
        profile.portfolio.version = (profile.portfolio.version || 0) + 1;

        await profile.save();

        res.json({ success: true, portfolio: profile.portfolio });

    } catch (error) {
        console.error('❌ Portfolio Update Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Calculate portfolio completion percentage
 */
function calculateCompletionPercentage(portfolio) {
    let score = 0;
    const weights = {
        professionalSummary: 15,
        headline: 5,
        contactInfo: 10,
        experience: 20,
        education: 10,
        certificates: 10,
        customProjects: 15,
        languages: 5,
        socialLinks: 5,
        featuredSkills: 5
    };

    if (portfolio.professionalSummary?.length > 50) score += weights.professionalSummary;
    if (portfolio.headline?.length > 10) score += weights.headline;
    if (portfolio.contactInfo?.email || portfolio.contactInfo?.linkedin) score += weights.contactInfo;
    if (portfolio.experience?.length > 0) score += weights.experience;
    if (portfolio.education?.length > 0) score += weights.education;
    if (portfolio.certificates?.length > 0) score += weights.certificates;
    if (portfolio.customProjects?.length > 0) score += weights.customProjects;
    if (portfolio.languages?.length > 0) score += weights.languages;
    if (portfolio.socialLinks?.linkedin || portfolio.socialLinks?.github) score += weights.socialLinks;
    if (portfolio.featuredSkills?.length > 0) score += weights.featuredSkills;

    return Math.min(100, score);
}

/**
 * POST /api/portfolio/analyze-ats
 * AI-powered ATS compatibility analysis
 */
export async function analyzeATS(req, res) {
    try {
        const userId = req.userId;
        const { targetRole } = req.body;

        const profile = await LearnerProfile.findOne({ userId });
        if (!profile?.portfolio) return res.status(404).json({ error: "Portfolio not found" });

        const portfolio = profile.portfolio;
        const skills = profile.masteredSkills?.map(s => s.name).join(', ') || '';

        const prompt = `
            Analyze this resume/portfolio for ATS (Applicant Tracking System) compatibility.
            Target Role: ${targetRole || profile.goals?.targetRole || 'Software Professional'}
            
            Professional Summary: ${portfolio.professionalSummary || 'Not provided'}
            Skills: ${skills}
            Experience: ${JSON.stringify(portfolio.experience?.slice(0, 3) || [])}
            Education: ${JSON.stringify(portfolio.education || [])}
            Certifications: ${JSON.stringify(portfolio.certificates?.slice(0, 5) || [])}
            Projects: ${JSON.stringify(portfolio.customProjects?.slice(0, 3) || [])}
            
            Provide a comprehensive ATS analysis with:
            1. Overall ATS Score (0-100)
            2. Keyword Score (0-100) - How well keywords match the target role
            3. Formatting Score (0-100) - Clarity and structure
            4. Completeness Score (0-100) - Coverage of essential sections
            5. Top 5 missing keywords for this role
            6. Top 5 specific improvement suggestions
            
            Return JSON only:
            {
                "overall": number,
                "keywords": number,
                "formatting": number,
                "completeness": number,
                "missingKeywords": ["keyword1", "keyword2", ...],
                "suggestions": ["suggestion1", "suggestion2", ...]
            }
        `;

        const responseContent = await callAI(prompt, "You are an expert ATS optimization specialist with 15+ years of experience in recruiting and resume screening systems.");
        const result = extractJSON(responseContent);

        if (result) {
            // Save ATS score to profile
            profile.portfolio.atsScore = {
                overall: result.overall || 0,
                keywords: result.keywords || 0,
                formatting: result.formatting || 0,
                completeness: result.completeness || 0,
                suggestions: result.suggestions || [],
                lastAnalyzed: new Date()
            };
            await profile.save();
        }

        res.json({
            success: true,
            atsScore: result || { overall: 50, keywords: 50, formatting: 50, completeness: 50, missingKeywords: [], suggestions: [] },
            targetRole: targetRole || profile.goals?.targetRole
        });

    } catch (error) {
        console.error('❌ ATS Analysis Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/portfolio/generate-accomplishment
 * Transform bullet points into STAR format achievements
 */
export async function generateAccomplishment(req, res) {
    try {
        const { bulletPoint, role, company, context } = req.body;
        if (!bulletPoint) return res.status(400).json({ error: "Bullet point is required" });

        const prompt = `
            Transform this work accomplishment into a powerful STAR format achievement statement.
            
            Original: ${bulletPoint}
            Role: ${role || 'Professional'}
            Company: ${company || 'Organization'}
            Context: ${context || 'General professional context'}
            
            Create an impactful, quantified achievement statement that:
            - Uses strong action verbs (Led, Spearheaded, Architected, Delivered, etc.)
            - Includes measurable results (%, $, time saved, users impacted, etc.)
            - Highlights technical skills and business impact
            - Is ATS-friendly and keyword-optimized
            - Is 1-2 sentences maximum
            
            Return JSON only:
            {
                "accomplishment": "The transformed achievement statement",
                "impact": "Brief quantified impact (e.g., '40% efficiency gain')",
                "keywords": ["keyword1", "keyword2", ...]
            }
        `;

        const responseContent = await callAI(prompt, "You are an elite resume writer who has helped executives land positions at Fortune 500 companies. You specialize in transforming ordinary job descriptions into powerful achievement statements.");
        const result = extractJSON(responseContent);

        res.json({
            success: true,
            accomplishment: result?.accomplishment || bulletPoint,
            impact: result?.impact || '',
            keywords: result?.keywords || []
        });

    } catch (error) {
        console.error('❌ Accomplishment Gen Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/portfolio/suggest-keywords
 * Get role-specific keywords for optimization
 */
export async function suggestKeywords(req, res) {
    try {
        const userId = req.userId;
        const { targetRole, industry } = req.body;

        const profile = await LearnerProfile.findOne({ userId });
        const currentSkills = profile?.masteredSkills?.map(s => s.name) || [];

        const prompt = `
            Provide comprehensive keyword suggestions for a ${targetRole || 'Software Developer'} in the ${industry || 'Technology'} industry.
            
            Current skills the candidate has: ${currentSkills.join(', ') || 'General technical skills'}
            
            Provide:
            1. Must-have technical keywords (10-15)
            2. Soft skill keywords (5-8)
            3. Industry-specific buzzwords (5-8)
            4. Action verbs for achievements (10)
            5. Certifications that would boost this profile (5)
            
            Return JSON only:
            {
                "technicalKeywords": ["keyword1", ...],
                "softSkillKeywords": ["keyword1", ...],
                "industryBuzzwords": ["keyword1", ...],
                "actionVerbs": ["verb1", ...],
                "recommendedCertifications": ["cert1", ...]
            }
        `;

        const responseContent = await callAI(prompt, "You are an expert in talent acquisition and ATS systems. You know exactly what keywords recruiters and hiring managers search for.");
        const result = extractJSON(responseContent);

        res.json({
            success: true,
            keywords: result || {
                technicalKeywords: [],
                softSkillKeywords: [],
                industryBuzzwords: [],
                actionVerbs: [],
                recommendedCertifications: []
            },
            targetRole: targetRole || profile?.goals?.targetRole
        });

    } catch (error) {
        console.error('❌ Keyword Suggestion Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/portfolio/review-all
 * Comprehensive AI review of entire portfolio
 */
export async function reviewPortfolio(req, res) {
    try {
        const userId = req.userId;
        const profile = await LearnerProfile.findOne({ userId });
        if (!profile?.portfolio) return res.status(404).json({ error: "Portfolio not found" });

        const portfolio = profile.portfolio;
        const skills = profile.masteredSkills?.map(s => `${s.name} (${s.level}%)`).join(', ') || '';

        const prompt = `
            Perform a comprehensive review of this professional portfolio for a ${profile.goals?.targetRole || 'Tech Professional'}.
            
            === PORTFOLIO DATA ===
            Summary: ${portfolio.professionalSummary || 'Not provided'}
            Headline: ${portfolio.headline || 'Not provided'}
            Skills: ${skills}
            Experience: ${portfolio.experience?.length || 0} roles
            Education: ${portfolio.education?.length || 0} entries
            Certifications: ${portfolio.certificates?.length || 0} certificates
            Projects: ${portfolio.customProjects?.length || 0} projects
            Languages: ${portfolio.languages?.length || 0} languages
            Volunteering: ${portfolio.volunteering?.length || 0} activities
            Awards: ${portfolio.awards?.length || 0} awards
            Publications: ${portfolio.publications?.length || 0} publications
            
            Provide a detailed review with:
            1. Overall impression (1 paragraph)
            2. Top 3 strengths
            3. Top 5 areas for improvement (prioritized)
            4. Section-by-section feedback (key sections only)
            5. Competitive positioning advice
            6. Overall ready score (0-100) - How ready is this for job applications?
            
            Return JSON only:
            {
                "impression": "Overall impression paragraph",
                "strengths": ["strength1", "strength2", "strength3"],
                "improvements": [
                    {"area": "Area name", "suggestion": "Specific suggestion", "priority": "high/medium/low"},
                    ...
                ],
                "sectionFeedback": {
                    "summary": "Feedback",
                    "experience": "Feedback",
                    "projects": "Feedback",
                    "skills": "Feedback"
                },
                "competitiveAdvice": "Positioning advice",
                "readyScore": number
            }
        `;

        const responseContent = await callAI(prompt, "You are a senior hiring manager at a Fortune 100 tech company. You have reviewed thousands of resumes and know exactly what makes candidates stand out or get rejected.");
        const result = extractJSON(responseContent);

        res.json({
            success: true,
            review: result || {
                impression: "Unable to generate review at this time.",
                strengths: [],
                improvements: [],
                sectionFeedback: {},
                competitiveAdvice: "",
                readyScore: 50
            }
        });

    } catch (error) {
        console.error('❌ Portfolio Review Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/portfolio/generate-career-objective
 * AI-generated career objective based on profile
 */
export async function generateCareerObjective(req, res) {
    try {
        const userId = req.userId;
        const { type } = req.body; // 'short' or 'long'

        const profile = await LearnerProfile.findOne({ userId });
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        const skills = profile.masteredSkills?.slice(0, 10).map(s => s.name).join(', ') || '';
        const experience = profile.portfolio?.experience?.slice(0, 2) || [];

        const prompt = `
            Generate a ${type === 'long' ? 'long-term 5-year career vision' : 'short-term 1-2 year career objective'} for a professional with this background:
            
            Target Role: ${profile.goals?.targetRole || 'Software Professional'}
            Top Skills: ${skills}
            Recent Experience: ${experience.map(e => `${e.role} at ${e.company}`).join(', ') || 'Early career'}
            Timeline Goal: ${profile.goals?.targetTimeline || '6 months'}
            
            The objective should be:
            - Specific and measurable
            - Ambitious but realistic
            - Aligned with industry trends
            - Professional and compelling
            - ${type === 'long' ? '2-3 sentences about 5-year vision' : '1-2 sentences about immediate goals'}
            
            Return JSON only:
            {
                "objective": "The career objective statement",
                "keyMilestones": ["milestone1", "milestone2", "milestone3"]
            }
        `;

        const responseContent = await callAI(prompt, "You are an expert career coach who has helped hundreds of professionals define and achieve their career goals.");
        const result = extractJSON(responseContent);

        res.json({
            success: true,
            objective: result?.objective || '',
            milestones: result?.keyMilestones || [],
            type: type || 'short'
        });

    } catch (error) {
        console.error('❌ Career Objective Gen Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/portfolio/track-view
 * Track portfolio view analytics
 */
export async function trackPortfolioView(req, res) {
    try {
        const { id } = req.params;
        const { source } = req.body;

        const profile = await LearnerProfile.findOne({ userId: id });
        if (!profile?.portfolio) return res.status(404).json({ error: "Portfolio not found" });

        // Initialize analytics if not present
        if (!profile.portfolio.analytics) {
            profile.portfolio.analytics = {
                totalViews: 0,
                uniqueViews: 0,
                viewHistory: []
            };
        }

        profile.portfolio.analytics.totalViews += 1;
        profile.portfolio.analytics.lastViewed = new Date();
        profile.portfolio.analytics.viewHistory.push({
            date: new Date(),
            source: source || 'direct'
        });

        // Keep only last 100 view history entries
        if (profile.portfolio.analytics.viewHistory.length > 100) {
            profile.portfolio.analytics.viewHistory = profile.portfolio.analytics.viewHistory.slice(-100);
        }

        await profile.save();

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Track View Error:', error);
        res.status(500).json({ error: error.message });
    }
}
