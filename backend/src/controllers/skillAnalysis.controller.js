import User from '../models/User.js';
import OpenAI from 'openai';
import Bytez from 'bytez.js';
import axios from 'axios';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { extractJSON } from '../utils/aiUtils.js';
import queueService from '../services/queueService.js';
import { getCache, setCache, getPersistentCache, setPersistentCache } from '../utils/cacheUtils.js';
import config from '../config/env.js';
import { normalizeQuery } from '../utils/stringUtils.js';

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing in environment');
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const getBytezModel = (modelName = 'openai/gpt-4.1-mini') => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing in environment');
  }

  const sdk = new Bytez(process.env.OPENAI_API_KEY);
  return sdk.model(modelName);
};

const getOpenRouterClient = () => {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": config.frontendUrl,
      "X-Title": "AI Learning Platform",
    }
  });
};

// Helper for direct OpenRouter call with reasoning enabled (consistent with ai.controller.js)
const callOpenRouterWithReasoning = async (systemPrompt, userPrompt, modelName = "nvidia/nemotron-3-super-120b-a12b:free") => {
  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      reasoning: { enabled: true },
      response_format: { type: "json_object" }
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": config.frontendUrl,
        "X-Title": "AI Learning Platform"
      }
    });

    if (response.data?.choices?.[0]?.message?.content) {
      return {
        content: response.data.choices[0].message.content,
        reasoning: response.data.choices[0].message.reasoning_details || null
      };
    }
    throw new Error("Invalid response structure from OpenRouter API");
  } catch (error) {
    console.error("❌ OpenRouter API Error:", error.response?.data || error.message);
    throw error;
  }
};

// Helper for GitHub Models (GPT-5) - consistent with ai.controller.js
const callGitHubModel = async (systemPrompt, userPrompt, modelName = "gpt-4.1") => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const endpoint = "https://models.github.ai/inference";
    
    if (!token) throw new Error("GITHUB_TOKEN is missing in environment");

    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: modelName,
        response_format: { type: "json_object" }
      }
    });

    if (isUnexpected(response)) {
      console.error("❌ GitHub Unexpected Response:", response.status, response.body);
      throw response.body?.error || new Error(`GitHub API returned status ${response.status}`);
    }

    if (!response.body?.choices?.[0]?.message?.content) {
      console.error("❌ GitHub Response Structure Issue:", JSON.stringify(response.body, null, 2));
      throw new Error("Invalid response structure from GitHub Models");
    }

    return response.body.choices[0].message.content;
  } catch (error) {
    console.error("❌ GitHub Model Error Details:", error.message);
    throw error;
  }
};

/**
 * 🥇 BACKGROUND WORKER PROCESSOR
 * Executed by Agenda queue to generate the Skill Gap Analysis
 */
export async function processSkillGapAnalysis(jobData) {
  const { targetRole, userId } = jobData;
  let currentSkills = '';
  let coursesCount = 0;
  let user = null;

  // IF USER IS LOGGED IN: Use their saved courses
  if (userId) {
    user = await User.findById(userId);
    if (user) {
      currentSkills = user.savedCourses.map(c => c.title).join(', ');
      coursesCount = user.savedCourses.length;
      console.log(`🎯 Analyzing for logged-in user: ${coursesCount} courses`);
    }
  } else {
    console.log(`🎯 Analyzing for guest user (no login)`);
  }

  console.log(`🎯 Analyzing skill gap for role: ${targetRole}`);

  const normalizedRole = normalizeQuery(targetRole);
  const cacheKey = `skill_gap_${normalizedRole}`;
  
  // Layer 1: Memory (Fastest)
  const cachedResult = getCache(cacheKey);
  if (cachedResult) {
    return {
      ...cachedResult,
      isCached: true,
      message: 'Retrieved from backend cache',
    };
  }

  // Layer 2: Persistent (DB - Survives restarts)
  const persistentResult = await getPersistentCache(cacheKey);
  if (persistentResult) {
    console.log(`🚀 [Double-Shield] Serving persistent result for: "${targetRole}"`);
    return {
        ...persistentResult,
        isCached: true,
        message: 'Retrieved from persistent storage'
    };
  }

  // Build detected skills from saved courses (used in prompt)
  const detectedUserSkills = [];
  if (user && user.savedCourses?.length > 0) {
    const skillKeywords = ['JavaScript', 'React', 'Node', 'Python', 'AI', 'Machine Learning',
      'DevOps', 'Docker', 'AWS', 'System Design', 'TypeScript', 'MongoDB',
      'PostgreSQL', 'GraphQL', 'Next.js', 'Vue', 'Angular', 'Express',
      'Java', 'C++', 'Rust', 'Go', 'Kubernetes', 'CI/CD', 'Terraform',
      'SQL', 'NoSQL', 'Redis', 'Kafka', 'Microservices', 'REST', 'API',
      'HTML', 'CSS', 'Git', 'Linux', 'Data Science', 'Deep Learning',
      'NLP', 'Computer Vision', 'LLM', 'Prompt Engineering', 'RAG',
      'Flutter', 'Swift', 'Kotlin', 'Firebase', 'Supabase'];
    for (const course of user.savedCourses) {
      const title = (course.title || '').toLowerCase();
      for (const kw of skillKeywords) {
        if (title.includes(kw.toLowerCase()) && !detectedUserSkills.includes(kw)) {
          detectedUserSkills.push(kw);
        }
      }
    }
  }

  const currentYear = new Date().getFullYear();
  let marketData = [];
  let searchProvider = 'none';

  try {
    console.log('🔍 Using Serper for market research...');
    const serperResponse = await axios.post(
      'https://google.serper.dev/search',
      {
        q: `${targetRole} job requirements skills technologies salary India LPA ${currentYear} career roadmap`,
        gl: 'in',
        hl: 'en',
        num: 15
      },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    marketData = serperResponse.data?.organic?.map(r => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet
    })) || [];
    searchProvider = 'serper';
    console.log(`✅ Serper returned ${marketData.length} results`);
  } catch (serperError) {
    console.warn('⚠️ Serper failed, trying Tavily:', serperError.message);

    try {
      const tavilyResponse = await axios.post(
        'https://api.tavily.com/search',
        {
          query: `${targetRole} job requirements skills technologies ${currentYear}, ${targetRole} salary range India LPA, ${targetRole} career path roadmap`,
          search_depth: 'advanced',
          max_results: 12
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      marketData = tavilyResponse.data?.results?.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content
      })) || [];
      searchProvider = 'tavily';
      console.log(`✅ Tavily returned ${marketData.length} results`);
    } catch (tavilyError) {
      console.warn('⚠️ Tavily also failed:', tavilyError.message);
    }
  }

  const prompt = `You are an expert AI Career Advisor specializing in premium skill-gap analysis for ${currentYear} tech jobs in India.

CORE REQUIREMENT:
Your analysis MUST stay tightly aligned to the exact role "${targetRole}" and the user's actual current learning state.

ACCURACY RULES:
- Only include skills that are genuinely important for "${targetRole}".
- Do not drift into unrelated generic skills.
- If the user already has evidence of a skill, reflect that in currentSkills and reduce unnecessary gap repetition.
- Keep the output useful for both logged-in and guest users.
- Salary, readiness, and next steps should feel realistic, not inflated.

Target Role: "${targetRole}"
${coursesCount > 0 ? `User's Current Learning (${coursesCount} courses): ${currentSkills}` : 'User has no saved courses yet (guest or new user)'}
Detected User Skills: ${JSON.stringify(detectedUserSkills)}
Market Research Data (from ${searchProvider}): ${JSON.stringify(marketData)}

ROLE-SPECIFIC ANALYSIS REQUIREMENTS:
1. Identify which current skills genuinely map to the role.
2. Identify the top 4-6 missing skills that most strongly block readiness.
3. Explain each gap in a role-specific, employer-relevant way.
4. Recommend realistic learning resources or course titles related to the role.
5. Estimate career readiness honestly based on current evidence.
6. Give next steps that move the user from current state -> portfolio -> interviews.

Return ONLY valid JSON with this exact structure:
{
  "currentSkills": ["List skills user already has that are relevant to ${targetRole}"],
  "skillGaps": [
    {
      "skill": "Skill specific to ${targetRole}",
      "priority": "Critical" | "High" | "Medium" | "Low",
      "marketDemand": "High" | "Medium" | "Low",
      "reasoning": "Why this skill is essential for ${targetRole} specifically, what part of the job it affects, and what happens if the user lacks it",
      "estimatedLearningTime": "X-Y weeks",
      "resources": ["Specific course or resource name"]
    }
  ],
  "recommendedCourses": ["Real course titles from Udemy/Coursera/YouTube specific to ${targetRole}"],
  "careerReadiness": 0-100,
  "timeToJobReady": "X-Y months",
  "salaryPotential": "₹X-Y LPA",
  "marketOutlook": "Detailed outlook for ${targetRole} demand in ${currentYear} India market",
  "nextSteps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]
}

Do not add markdown. Do not add explanations outside JSON. Make it feel like a premium, realistic, role-specific analysis.`;

  let usedProvider = '';
  let usedModel = '';
  let source = 'primary-engine';
  let aiResponse = '';
  let analysis = null;

  try {
    console.log('🤖 Attempting GitHub Models GPT-4.1 for skill analysis...');
    const ghResult = await callGitHubModel(
      'You are an expert AI Career Advisor. Return only valid JSON responses.',
      prompt,
      'gpt-4.1'
    );

    if (ghResult) {
      usedProvider = 'github-models';
      usedModel = 'gpt-4.1';
      aiResponse = ghResult;
      console.log('✨ [Skill-Gap-Analysis] SUCCESS: GitHub GPT-4.1');
    } else {
      throw new Error("Empty GitHub response (gpt-4.1)");
    }
  } catch (gh41Error) {
    console.warn('⚠️ GitHub GPT-4.1 failed, falling back to OpenAI:', gh41Error.message);
    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.6
    });
    usedProvider = 'openai';
    usedModel = 'gpt-4o-mini';
    source = 'fallback-engine';
    aiResponse = completion.choices[0].message.content;
    console.log('✅ OpenAI SUCCESS (fallback)');
  }

  analysis = extractJSON(aiResponse);
  if (!analysis) throw new Error(`Invalid JSON from ${usedProvider}`);

  if (user) {
    user.aiProfile.detectedSkills = Array.isArray(analysis.currentSkills) ? analysis.currentSkills : [];
    const safetySkillGaps = Array.isArray(analysis.skillGaps) ? analysis.skillGaps : [];
    user.aiProfile.skillGaps = safetySkillGaps.map(gap => ({
      skill: gap.skill,
      priority: gap.priority
    }));
    user.aiProfile.lastAnalysis = new Date();
    await user.save();
  }

    const finalResult = {
        success: true,
        targetRole,
        data: analysis,
        provider: usedProvider,
        model: usedModel,
        source,
        savedToProfile: !!user,
        timestamp: new Date().toISOString()
    };

    // --- SAVE TO DOUBLE-SHIELD BACKEND CACHE ---
    await setPersistentCache(cacheKey, finalResult, { ttlDays: 2, category: 'skill_gap' });
    console.log(`💾 [Double-Shield] CACHED (Memory+DB) for role: "${targetRole}" (TTL: 2 days)`);

    return finalResult;
}

/**
 * 1. SKILL GAP ANALYSIS ENDPOINT
 * POST /api/skill-analysis/analyze-gap
 * NOW RETURNS 202 ACCEPTED with a Job ID
 */
export async function analyzeSkillGap(req, res) {
  try {
    const { targetRole } = req.body;
    const userId = req.userId;

    if (!targetRole) {
      return res.status(400).json({ error: 'Target role is required' });
    }

    // --- DOUBLE-SHIELD BACKEND CACHE LAYER (QUEUE BYPASS) ---
    const normalizedRole = normalizeQuery(targetRole);
    const cacheKey = `skill_gap_${normalizedRole}`;
    
    // Check Memory First
    let cachedResult = getCache(cacheKey);
    // Check Persistent Second
    if (!cachedResult) {
        cachedResult = await getPersistentCache(cacheKey);
    }

    if (cachedResult) {
      console.log(`🚀 [Double-Shield] QUEUE BYPASS: serving result for "${targetRole}" instantly.`);
      return res.json({
          ...cachedResult,
          isCached: true,
          message: 'Retrieved from cache'
      });
    }

    // --- JOB DEDUPLICATION LAYER ---
    const activeJob = await queueService.findActiveJob('analyze_skill_gap', { targetRole: normalizedRole });
    if (activeJob) {
        console.log(`🎯 [Deduplication] Joining existing job for "${targetRole}": ${activeJob.jobId}`);
        return res.status(202).json({
            success: true,
            message: 'Joining existing analysis job',
            data: { jobId: activeJob.jobId, accessKey: activeJob.accessKey }
        });
    }
    // --------------------------------------------------------

    // Dispatch heavy AI job to background
    const { jobId, accessKey } = await queueService.enqueueJob('analyze_skill_gap', { targetRole: normalizedRole, userId }, {
      ownerUserId: userId || null,
    });

    // Unblock the frontend
    res.status(202).json({
      success: true,
      message: 'Skill gap analysis job started',
      data: { jobId, accessKey }
    });

  } catch (error) {
    console.error('❌ Skill Gap Queue Error:', error.message);
    
    // Return gracefully so the frontend fails over nicely
    res.status(500).json({ success: false, error: 'Failed to queue analysis job' });
  }
}
/**
 * 2. LEARNING VELOCITY CALCULATOR
 * Calculates user's learning speed based on course completion patterns
 */
export async function calculateLearningVelocity(req, res) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const coursesCount = user.savedCourses.length;
    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7)); // weeks

    // Calculate velocity (courses per week)
    const velocity = accountAge > 0 ? (coursesCount / accountAge).toFixed(2) : 0;

    // Update user profile
    user.aiProfile.learningVelocity = parseFloat(velocity);
    await user.save();

    // Predict completion time for various tracks
    const predictions = {
      beginner: Math.ceil(8 / velocity) || 8, // 8 courses for beginner
      intermediate: Math.ceil(15 / velocity) || 12, // 15 courses
      advanced: Math.ceil(25 / velocity) || 20 // 25 courses
    };

    res.json({
      success: true,
      data: {
        velocity: parseFloat(velocity),
        coursesCompleted: coursesCount,
        accountAgeWeeks: accountAge,
        predictions: {
          beginnerTrack: `${predictions.beginner} weeks`,
          intermediateTrack: `${predictions.intermediate} weeks`,
          advancedTrack: `${predictions.advanced} weeks`
        },
        insight: velocity > 1
          ? 'You\'re learning at an excellent pace! 🚀'
          : velocity > 0.5
            ? 'Steady progress! Consider increasing your pace.'
            : 'Start adding courses to track your velocity.'
      }
    });

  } catch (error) {
    console.error('❌ Velocity Calculation Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 3. SKILL PROFICIENCY ESTIMATOR
 * Estimates proficiency levels based on courses and time invested
 */
export async function estimateSkillProficiency(req, res) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract unique skills from course titles
    const skillMap = {};

    user.savedCourses.forEach(course => {
      const keywords = ['JavaScript', 'React', 'Node', 'Python', 'AI', 'Machine Learning',
        'DevOps', 'Docker', 'AWS', 'System Design', 'TypeScript', 'MongoDB',
        'PostgreSQL', 'GraphQL', 'Next.js', 'Vue', 'Angular', 'Express'];

      keywords.forEach(skill => {
        if (course.title.toLowerCase().includes(skill.toLowerCase())) {
          skillMap[skill] = (skillMap[skill] || 0) + 1;
        }
      });
    });

    // Convert to proficiency levels (1-5 scale)
    const skillsProficiency = Object.entries(skillMap).map(([skill, count]) => ({
      skill,
      level: Math.min(count * 20, 100), // Max 100%
      courses: count,
      status: count >= 3 ? 'Proficient' : count >= 2 ? 'Intermediate' : 'Beginner'
    }));

    res.json({
      success: true,
      data: {
        totalSkills: skillsProficiency.length,
        skills: skillsProficiency.sort((a, b) => b.level - a.level).slice(0, 8), // Top 8
        averageProficiency: skillsProficiency.reduce((sum, s) => sum + s.level, 0) / skillsProficiency.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Proficiency Estimation Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 4. CAREER PATH SUGGESTIONS
 * AI suggests optimal career paths based on current skills
 */
export async function suggestCareerPaths(req, res) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentSkills = user.savedCourses.map(c => c.title).join(', ');

    const prompt = `Based on these learning courses: ${currentSkills || 'No courses yet'}

Suggest 4 optimal career paths for 2026 tech industry in India.

Return ONLY valid JSON:
{
  "careerPaths": [
    {
      "role": "Career Title",
      "matchScore": 0-100,
      "reasoning": "Why this fits",
      "avgSalary": "₹X-Y LPA",
      "demandLevel": "High" | "Medium" | "Low",
      "requiredSkills": ["skill1", "skill2"],
      "timeToReady": "X months"
    }
  ]
}`;

    let suggestions = null;

    // Try Bytez GPT-4.1-mini first (primary)
    try {
      console.log('🤖 Attempting Bytez GPT-4.1-mini for career paths...');
      const model = getBytezModel("openai/gpt-4.1-mini");

      const { error, output } = await model.run([
        { role: 'system', content: 'You are a career advisor. Return only valid JSON responses.' },
        { role: 'user', content: prompt }
      ]);

      if (error) {
        console.warn('⚠️ Bytez error:', error);
        throw new Error(error);
      }

      const responseContent = output?.content || JSON.stringify(output);
      suggestions = extractJSON(responseContent);

      if (!suggestions) {
        console.warn('⚠️ Bytez JSON extraction failed for suggestions');
        throw new Error('Invalid JSON from Bytez');
      }
      console.log('✅ Bytez GPT-4.1-mini response received');
    } catch (bytezError) {
      console.warn('⚠️ Bytez failed, falling back to OpenAI:', bytezError.message);

      // Fallback to OpenAI
      const openaiClient = getOpenAIClient();
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8
      });

      suggestions = extractJSON(completion.choices[0].message.content);

      if (!suggestions) {
        console.error('❌ OpenAI JSON extraction failed for suggestions');
        throw new Error('Invalid JSON from OpenAI');
      }
      console.log('✅ OpenAI response received (fallback)');
    }

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('❌ Career Path Suggestion Error:', error);

    // Fallback
    res.json({
      success: true,
      source: 'fallback',
      data: {
        careerPaths: [
          {
            role: 'Full Stack Developer',
            matchScore: 85,
            reasoning: 'Your courses align well with modern web development',
            avgSalary: '₹8-15 LPA',
            demandLevel: 'High',
            requiredSkills: ['React', 'Node.js', 'MongoDB', 'System Design'],
            timeToReady: '2-3 months'
          },
          {
            role: 'Frontend Engineer',
            matchScore: 80,
            reasoning: 'Strong foundation in UI frameworks',
            avgSalary: '₹7-12 LPA',
            demandLevel: 'High',
            requiredSkills: ['React', 'TypeScript', 'Next.js'],
            timeToReady: '1-2 months'
          },
          {
            role: 'Backend Developer',
            matchScore: 75,
            reasoning: 'Good understanding of server-side technologies',
            avgSalary: '₹8-14 LPA',
            demandLevel: 'Medium',
            requiredSkills: ['Node.js', 'PostgreSQL', 'Docker'],
            timeToReady: '3-4 months'
          },
          {
            role: 'DevOps Engineer',
            matchScore: 60,
            reasoning: 'Some relevant skills, but needs infrastructure focus',
            avgSalary: '₹10-18 LPA',
            demandLevel: 'High',
            requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
            timeToReady: '5-6 months'
          }
        ]
      }
    });
  }
}
