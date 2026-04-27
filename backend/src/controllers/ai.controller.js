import axios from "axios";
import OpenAI from "openai";
import Groq from "groq-sdk";
import Bytez from "bytez.js";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { extractJSON, validateAIIntelligenceResult, normalizeAIResponse } from "../utils/aiUtils.js";
import { getCache, setCache, getPersistentCache, setPersistentCache } from "../utils/cacheUtils.js";
import config from '../config/env.js';
import queueService from '../services/queueService.js';
import { normalizeQuery } from '../utils/stringUtils.js';

// --- ZERO-CONFUSION HELPERS ---
/**
 * Standardizes URLs for reliable comparison (strips query params, fragments, etc.)
 */
const normalizeUrl = (url) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    // Keep YouTube video IDs, strip everything else
    if (!u.hostname.includes('youtube.com') && !u.hostname.includes('youtu.be')) {
      u.search = '';
    } else {
      const v = u.searchParams.get('v');
      u.search = v ? `?v=${v}` : '';
    }
    return u.toString().toLowerCase().replace(/\/$/, '').split('#')[0];
  } catch (e) {
    return url.toLowerCase().trim().replace(/\/$/, '');
  }
};

/**
 * Extracts platform name from URL for accurate card display
 */
const getPlatformFromUrl = (url) => {
  if (!url) return 'EdTech';
  const u = url.toLowerCase();
  if (u.includes('udemy.com')) return 'Udemy';
  if (u.includes('coursera.org')) return 'Coursera';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('edx.org')) return 'edX';
  if (u.includes('pluralsight.com')) return 'Pluralsight';
  if (u.includes('simplilearn.com')) return 'Simplilearn';
  if (u.includes('github.com')) return 'GitHub';
  if (u.includes('freecodecamp.org')) return 'FreeCodeCamp';
  if (u.includes('khanacademy.org')) return 'Khan Academy';
  return 'Direct Source';
};

const withTimeout = async (promise, timeoutMs, label) => {
  let timer;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const AI_INTEL_CACHE_VERSION = 'v21';

const getAIIntelCacheKey = (query, mode = "intelligence") => {
  const normalizedQuery = normalizeQuery(query);
  const prefix = mode === 'intelligence' ? '' : `${mode}_`;
  return `ai_intel_${AI_INTEL_CACHE_VERSION}_${prefix}${normalizedQuery}`;
};

const extractTextContent = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value?.content === 'string') return value.content;
  if (typeof value?.output?.content === 'string') return value.output.content;
  return JSON.stringify(value);
};

const parseValidatedAIIntelResponse = (rawContent) => {
  const parsed = extractJSON(rawContent);
  if (!parsed) {
    return { parsed: null, valid: false, issues: ['json extraction failed'] };
  }

  const validation = validateAIIntelligenceResult(parsed);
  return {
    parsed,
    valid: validation.valid,
    issues: validation.issues,
  };
};

const buildFallbackAiResult = (query, searchData, currentYear) => {
  const topCourses = (searchData?.courses || []).slice(0, 6).map((item, index) => ({
    title: item.title,
    platform: getPlatformFromUrl(item.url),
    type: 'Visit Site',
    price: null,
    link: isDirectCourseLink(item.url) ? item.url : "https://www.udemy.com",
    level: index < 2 ? 'Beginner' : index < 4 ? 'Intermediate' : 'Advanced',
    language: 'English',
    coversSkills: [query],
    isBestMatch: index === 0,
    matchScore: Math.max(80, 96 - (index * 2)),
    whyThisCourse: (item.snippet || `Relevant curated course for ${query} found via verified search.`).substring(0, 157) + "...",
  }));


  const topVideos = (searchData?.videos || []).slice(0, 6).map((item, index) => ({
    title: item.title,
    creator: item.source || 'YouTube',
    link: item.url || `https://www.youtube.com/`,
    duration: index === 0 ? '12:45' : index === 1 ? '18:20' : '45:10',
    type: index === 0 ? 'Project Based' : 'Quick Start',
    viewCount: index === 0 ? '245K' : '1.2M',
    difficulty: index < 2 ? 'Beginner' : 'Intermediate',
    isBestMatch: index === 0,
  }));

  const topResources = (searchData?.blueprints || []).slice(0, 8).map((item) => ({
    title: item.title,
    type: 'Documentation',
    link: item.url || `https://developer.mozilla.org/`,
    description: item.snippet || `Authoritative documentation for ${query}`,
  }));

  const topProjects = (searchData?.projects || []).slice(0, 6).map((item, index) => ({
    title: item.title,
    difficulty: index < 2 ? 'Intermediate' : 'Advanced',
    description: item.snippet || `Practice project aligned with ${query}`,
    link: item.url || `https://github.com/`,
    skills: [query],
  }));

  const topTools = (searchData?.tools || []).slice(0, 6).map((item) => ({
    name: item.title,
    description: (item.snippet || `Essential AI tool for ${query} mastery.`).substring(0, 157) + "...",
    link: item.url || `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,

    bestFor: query,
    pricing: 'Check Website'
  }));

  return {
    learningGoal: `Build practical, job-ready capability in ${query}`,
    skillBreakdown: [
      {
        skill: query,
        priority: 'Critical',
        explanation: `${query} is the main capability required to move forward in ${currentYear}. This fallback view is generated from live search data so the user still gets a usable roadmap when an AI provider is slow.`,
        prerequisites: ['Basic programming fundamentals'],
        estimatedTime: '6-10 weeks',
        marketDemand: 'High'
      }
    ],
    roadmap: [
      { phase: 'Foundation', duration: '2 weeks', skills: [query], milestone: `Understand the fundamentals of ${query}` },
      { phase: 'Project Build', duration: '2-3 weeks', skills: [query], milestone: 'Ship one practical portfolio project' },
    ],
    courses: topCourses,
    youtubeVideos: topVideos,
    resources: topResources,
    practiceProjects: topProjects,
    tools: topTools,
    careerInsights: {
      targetRoles: [`${query} Developer`],
      salaryRange: 'Varies by role and region',
      marketOutlook: `Demand remains active for ${query} skills in ${currentYear}`,
      readinessTime: '2-4 months',
      demandLevel: 'High'
    }
  };
};


const compactSearchEvidence = (items = [], limit = 15) =>
  items.slice(0, limit).map((item) => ({
    title: item.title,
    url: item.url,
    snippet: (item.snippet || "").substring(0, 180),
    source: item.source || item.platform || null,
  }));


const ensureArray = (value) => Array.isArray(value) ? value : [];

const mergeUniqueByLinkOrName = (primary = [], fallback = []) => {
  const seen = new Set();
  const merged = [];

  for (const item of [...ensureArray(primary), ...ensureArray(fallback)]) {
    if (!item || typeof item !== 'object') continue;
    const key = item.link || item.url || item.official_link || item.name || item.title || JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
};

const normalizeAIIntelResult = (query, aiData, searchData, currentYear) => {
  const fallbackData = buildFallbackAiResult(query, searchData, currentYear);
  const normalized = {
    ...fallbackData,
    ...(aiData || {}),
  };

  normalized.skillBreakdown = ensureArray(aiData?.skillBreakdown).length > 0
    ? aiData.skillBreakdown
    : fallbackData.skillBreakdown;
  normalized.roadmap = mergeUniqueByLinkOrName(aiData?.roadmap, fallbackData.roadmap).slice(0, 4);
  normalized.courses = mergeUniqueByLinkOrName(aiData?.courses, fallbackData.courses).slice(0, 8);
  normalized.youtubeVideos = mergeUniqueByLinkOrName(aiData?.youtubeVideos, fallbackData.youtubeVideos).slice(0, 8);
  normalized.resources = mergeUniqueByLinkOrName(aiData?.resources, fallbackData.resources).slice(0, 8);
  normalized.practiceProjects = mergeUniqueByLinkOrName(aiData?.practiceProjects, fallbackData.practiceProjects).slice(0, 8);
  normalized.tools = mergeUniqueByLinkOrName(aiData?.tools, fallbackData.tools).slice(0, 8);
  normalized.careerInsights = {
    ...fallbackData.careerInsights,
    ...(aiData?.careerInsights || {}),
  };

  if (!normalized.learningGoal || typeof normalized.learningGoal !== 'string') {
    normalized.learningGoal = fallbackData.learningGoal;
  }

  if (normalized.courses.length > 0 && !normalized.courses.some((course) => course.isBestMatch)) {
    normalized.courses[0].isBestMatch = true;
  }

  if (normalized.youtubeVideos.length > 0 && !normalized.youtubeVideos.some((video) => video.isBestMatch)) {
    normalized.youtubeVideos[0].isBestMatch = true;
  }

  return normalized;
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

const getOpenAIClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });
const getBytezClient = () => {
    const sdk = new Bytez(process.env.OPENAI_API_KEY);
    return { sdk, getModel: (modelName = "openai/gpt-4o-mini") => sdk.model(modelName) };
};

const callBytezModel = async (systemPrompt, userPrompt, modelName = "openai/gpt-4o-mini") => {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing for Bytez");
  const bytez = getBytezClient();
  const model = bytez.getModel(modelName);
  const { error, output } = await model.run([{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]);
  if (error) throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
  return extractTextContent(output);
};

const callGitHubModel = async (systemPrompt, userPrompt, modelName = "gpt-4.1") => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const endpoint = "https://models.github.ai/inference";
    if (!token) throw new Error("GITHUB_TOKEN is missing in environment");
    const client = ModelClient(endpoint, new AzureKeyCredential(token));
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        model: modelName,
        response_format: { type: "json_object" }
      }
    });
    if (isUnexpected(response)) throw response.body?.error || new Error(`GitHub API returned status ${response.status}`);
    return response.body.choices[0].message.content;
  } catch (error) { throw error; }
};

/**
 * URL Validator: Ensures links lead directly to specific courses, not search results.
 */
function isDirectCourseLink(url) {
  if (!url) return false;
  const u = url.toLowerCase();

  const strictPatterns = {
    udemy: /(\/course\/|\/c\/)[^\/]+/,
    coursera: /(\/learn\/|\/professional-certificate\/|\/specializations\/|\/degrees\/|\/guided-project\/)[^\/]+/,
    edx: /\/course\/[^\/]+/,
    pluralsight: /\/courses\/[^\/]+/,
    simplilearn: /\.com\/.*-training-/,
    youtube: /(watch\?v=[^&]+|youtu\.be\/[^\?\/]+)/,
    github: /\/github\.com\/[^\/]+\/[^\/]+(\/blob\/|\/tree\/|#)?$/
  };

  const antiPatterns = [
    '/search?', '/search/', '/catalog', '/category', '/browse',
    '/directory', '/course-directory', 'query=', 'google.com/search',
    '/roadmap', '/signup', '/login', '#search', '?q=', '&q='
  ];

  if (antiPatterns.some(ap => u.includes(ap))) return false;

  for (const platform in strictPatterns) {
    if (u.includes(platform)) return strictPatterns[platform].test(u);
  }

  const pathParts = u.split('/').filter(p => p.length > 0 && !p.includes('://'));
  if (pathParts.length < 2) return false;

  return true;
}

async function callAIWithFallback(systemPrompt, userPrompt, options = {}) {
  const { preferredProvider = "bytez", jsonMode = true } = options;
  if (preferredProvider === "bytez" || preferredProvider === "auto") {
    try {
      const bytez = getBytezClient();
      const model = bytez.getModel("openai/gpt-4o-mini");
      const { error, output } = await model.run([{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }]);
      if (!error) return { provider: "bytez-gpt-4o-mini", content: output?.content || JSON.stringify(output), success: true };
    } catch (e) {}
  }
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      response_format: jsonMode ? { type: "json_object" } : undefined,
    });
    return { provider: "groq-llama-3.3-70b", content: completion.choices[0].message.content, success: true };
  } catch (e) {
    return { provider: "none", content: null, success: false, error: e.message };
  }
}

async function searchWithSerper(query, options = {}) {
  const { num = 15 } = options;
  try {
    const response = await axios.post("https://google.serper.dev/search", { q: query, gl: "in", hl: "en", num }, { headers: { "X-API-KEY": process.env.SERPER_API_KEY }, timeout: 10000 });
    return { success: true, results: (response.data?.organic || []).map(r => ({ title: r.title, url: r.link, snippet: r.snippet })) };
  } catch (e) { return { success: false, error: e.message }; }
}

async function searchWithTavily(query, options = {}) {
  try {
    const payload = { query, search_depth: 'advanced', max_results: options.num || 12 };
    if (options.domains && options.domains.length > 0) {
      payload.include_domains = options.domains;
    }
    const response = await axios.post(
      'https://api.tavily.com/search',
      payload,
      { headers: { Authorization: `Bearer ${process.env.TAVILY_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    const results = (response.data?.results || []).map(r => ({ title: r.title, url: r.url, snippet: r.content }));
    console.log(`[Search] Tavily responded with ${results.length} results for: ${query.substring(0, 50)}...`);
    return { success: true, results };
  } catch (e) { 
    console.error(`[Search] Tavily error for "${query.substring(0, 30)}...":`, e.message);
    return { success: false, error: e.message }; 
  }
}

async function performComprehensiveSearch(query, currentYear) {
  const results = { courses: [], blueprints: [], projects: [], videos: [], tools: [], provider: "tavily" };
  const keys = ['courses', 'blueprints', 'projects', 'videos', 'tools'];

  let [udemyRes, courseraRes, edxRes, pluralRes, simpliRes, docsRes, githubRes, youtubeRes, toolsRes] = await Promise.all([
    searchWithTavily(`${query} course ${currentYear}`, { domains: ['udemy.com'], num: 10 }),
    searchWithTavily(`${query} course ${currentYear}`, { domains: ['coursera.org'], num: 10 }),
    searchWithTavily(`${query} course ${currentYear}`, { domains: ['edx.org'], num: 10 }),
    searchWithTavily(`${query} course ${currentYear}`, { domains: ['pluralsight.com'], num: 10 }),
    searchWithTavily(`${query} course ${currentYear}`, { domains: ['simplilearn.com'], num: 10 }),
    searchWithTavily(`${query} official documentation`),
    searchWithTavily(`${query} project repository`, { domains: ['github.com'] }),
    searchWithTavily(`${query} tutorial`, { domains: ['youtube.com'], num: 20 }),
    searchWithTavily(`${query} automation tools software library`)
  ]);

  // Filter and deduplicate each platform FIRST before interleaving
  const seenUrls = new Set();
  const filterAndDedup = (resObj, platform = 'unknown') => {
    if (!resObj.success || !resObj.results) return [];
    
    const initialRawCount = resObj.results.length;
    const filtered = resObj.results.filter(r => {
      let u = r.url.split('?')[0].toLowerCase();
      if (seenUrls.has(u)) return false;
      
      // RELAXED FILTERING FOR EVIDENCE: 
      // We allow topic pages and search results in the evidence phase 
      // so the AI sees platform activity, but we only show direct links to users finally.
      const isSomewhatRelevant = !['/login', '/signup', 'google.com/search'].some(ap => u.includes(ap));
      if (!isSomewhatRelevant) return false;

      seenUrls.add(u);
      return true;
    });

    console.log(`[Search] Platform [${platform}] filtered ${initialRawCount} -> ${filtered.length} (Relaxed Evidence Phase)`);
    return filtered;
  };

  const courseArrays = [
    filterAndDedup(udemyRes, 'Udemy'),
    filterAndDedup(courseraRes, 'Coursera'),
    filterAndDedup(edxRes, 'edX'),
    filterAndDedup(pluralRes, 'Pluralsight'),
    filterAndDedup(simpliRes, 'Simplilearn')
  ];

  const interleavedCourses = [];
  const maxLen = Math.max(0, ...courseArrays.map(arr => arr.length));
  for (let i = 0; i < maxLen; i++) {
    for (const arr of courseArrays) {
      if (arr[i]) interleavedCourses.push(arr[i]);
    }
  }

  let responses = [
    { success: interleavedCourses.length > 0, results: interleavedCourses },
    docsRes,
    githubRes,
    youtubeRes,
    toolsRes
  ];

  let hasResults = responses.some(r => r.success && r.results && r.results.length > 0);

  if (!hasResults) {
    console.warn("⚠️ Tavily returned nothing, trying Serper...");
    results.provider = "serper";
    const streams = {
      courses: `${query} "course" ${currentYear} site:udemy.com OR site:coursera.org OR site:edx.org`,
      blueprints: `${query} official documentation site:docs.* OR site:developer.*`,
      projects: `${query} repository site:github.com`,
      videos: `${query} tutorial site:youtube.com`,
      tools: `${query} free tools library software`
    };
    responses = await Promise.all(keys.map(k => searchWithSerper(streams[k])));
  }

  responses.forEach((res, i) => { if (res.success) results[keys[i]] = res.results || []; });
  
  const totalEvidenceCount = Object.values(results).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
  console.log(`[Search] Total evidence gathered: ${totalEvidenceCount} items across all categories.`);

  if (results.courses.length === 0) {
     console.warn("⚠️ Tavily search yielded 0 courses for query:", query);
  }
  
  return results;
}


export async function processAIIntelligenceSearch(jobData) {
  const query = jobData?.query;
  const mode = jobData?.mode || 'intelligence';
  const currentYear = new Date().getFullYear();
  if (!query) throw new Error('Query is required');

  const cacheKey = getAIIntelCacheKey(query, mode);
  let cachedResult = getCache(cacheKey) || await getPersistentCache(cacheKey);
  if (cachedResult) return { ...cachedResult, source: 'backend-cache', isCached: true };

  let searchData = (mode === 'intelligence' || mode === 'courses') ? await performComprehensiveSearch(query, currentYear) : { courses: [], blueprints: [], videos: [], projects: [] };

  let systemPrompt = "";
  if (mode === 'courses') {
      systemPrompt = `You are an AI Career Strategist. Return direct links ONLY. You MUST return ONLY a fully valid JSON object.
CRITICAL SCHEMA REQUIREMENTS:
1. Return a top-level 'courses' array.
2. For each course, 'description' MUST be a clean, concise 2-sentence summary. NO markdown formatting, NO raw text dumps.
3. For each course, 'price' MUST be a specific numeric string (e.g. "$49", "₹3999") or "Free" based on actual platform knowledge. Do not just blindly output "Paid".
4. Each object must have: title, description, price, platform, url, difficulty.
Do not include any conversational text outside the JSON itself.`;
  } else if (mode === 'tools') {
      systemPrompt = `You are an AI Tool Analyst. Return ONLY a fully valid JSON object.
CRITICAL SCHEMA REQUIREMENTS:
1. Return a top-level 'tools' array.
2. Each tool must have: name, description (2 concise sentences max), bestFor, pricing (Free, Paid, Freemium), link.
Do not include any conversational text outside the JSON itself.`;
  } else {
      systemPrompt = `You are an AI Career Strategist API. Your strict purpose is to synthesize search evidence into a JSON profile.
You MUST return ONLY a fully valid JSON object with the following structure:
{
  "learningGoal": "String",
  "careerInsights": { "marketDemand": "High/Medium/Low", "estimatedSalary": "String", "timeToMastery": "String", "readinessTime": "String" },
  "skillBreakdown": [ { "skill": "String", "priority": "Critical/High/Medium/Low", "explanation": "String (Exactly 1-2 short sentences)", "prerequisites": ["String"], "estimatedTime": "String", "marketDemand": "High/Medium/Low" } ],
  "roadmap": [ { "phase": "String", "duration": "String", "skills": ["String"], "milestone": "String (Short)" } ],
  "courses": [ { "title": "String", "url": "String", "platform": "String", "price": "String", "description": "String (Exactly 1 concise, highly relatable sentence. Max 140 chars. NO markdown.)", "level": "String", "coversSkills": ["String"] } ],
  "youtubeVideos": [ { "title": "String", "url": "String", "creator": "String", "duration": "MM:SS", "viewCount": "String (e.g. 500K)", "difficulty": "Beginner/Intermediate", "type": "Project/Tutorial" } ],
  "resources": [ { "title": "String", "url": "String", "type": "Documentation/Article", "description": "String (Short)" } ],
  "practiceProjects": [ { "title": "String", "description": "String (Exactly 1 short sentence)", "link": "String", "difficulty": "String", "skills": ["String"] } ],
  "tools": [ { "name": "String", "description": "String (Exactly 1 concise, highly relatable sentence. Max 140 chars. NO markdown.)", "link": "String", "bestFor": "String", "pricing": "Free/Paid/Freemium" } ]
}
Do not include markdown or conversational text anywhere. Ensure all JSON keys are exactly as requested.`;


  }

  const compactedEvidence = {
    courses: compactSearchEvidence(searchData.courses, 15),
    blueprints: compactSearchEvidence(searchData.blueprints, 6),
    projects: compactSearchEvidence(searchData.projects, 6),
    videos: compactSearchEvidence(searchData.videos, 10),
    tools: compactSearchEvidence(searchData.tools, 8)
  };



  const userPrompt = `Learning Goal: "${query}"\nEvidence: ${JSON.stringify(compactedEvidence)}`;


  const providerChain = [
    { provider: 'github', label: 'GitHub Expert', execute: () => callGitHubModel(systemPrompt, userPrompt, "gpt-4.1") },
    { provider: 'github', label: 'GitHub Pro', execute: () => callGitHubModel(systemPrompt, userPrompt, "gpt-4.1-mini") },
    { provider: 'groq', label: 'Groq Real-time', execute: async () => {
        const groq = getGroqClient();
        const res = await groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], response_format: { type: 'json_object' } });
        return res.choices[0].message.content;
    }}
  ];

  let parsedData = null;
  for (const attempt of providerChain) {
    try {
      const rawContent = await attempt.execute();
      const extracted = extractJSON(rawContent);
      if (extracted) {
        let normalized = normalizeAIIntelResult(query, extracted, searchData, currentYear);
        
        // --- ANTI-HALLUCINATION GUARD (Zero-Confusion v3.5) ---
        // Loosened to allow deep links if the domain/origin is present in evidence.
        if (normalized && (mode === 'intelligence' || mode === 'courses')) {
          const evidenceUrls = new Set([...searchData.courses.map(r => normalizeUrl(r.url)), ...searchData.videos.map(r => normalizeUrl(r.url))]);
          const evidenceDomains = new Set([...searchData.courses, ...searchData.videos].map(r => {
            try { return new URL(r.url).hostname.replace('www.', ''); } catch(e) { return null; }
          }).filter(Boolean));

          const verifyLinks = (items = [], type = 'generic') => {
            const initialCount = items.length;
            const filtered = items.filter(item => {
              const link = item.link || item.url;
              if (!link) return false;
              
              const nLink = normalizeUrl(link);
              const linkDomain = (function() {
                try { return new URL(link).hostname.replace('www.', ''); } catch(e) { return null; }
              })();

              // 1. Block known junk (search engines, login pages)
              const blackList = ['google.com/search', 'bing.com/search', 'yahoo.com/search', '/login', '/signup', '/signin', '/signin'];
              if (blackList.some(bl => nLink.includes(bl))) return false;

              // 2. Strict Exact match check (Against search evidence - highest confidence)
              if (evidenceUrls.has(nLink)) return true;

              // 3. Pattern match (Trusted platforms only if they look like direct courses)
              const isDirect = isDirectCourseLink(link);
              if (isDirect) return true;

              // 4. Hallucination Block: If it's a domain match but NOT in evidence and NOT a verified direct link, we reject it to avoid 404s.
              // We removed the loose domain match here to prevent AI-invented URLs.
              
              return false;
            });
            console.log(`[Verification] ${type} filtered: ${initialCount} -> ${filtered.length} (Evidence: ${evidenceUrls.size} items)`);
            return filtered;
          };

          normalized.courses = verifyLinks(normalized.courses, 'Courses');
          normalized.youtubeVideos = verifyLinks(normalized.youtubeVideos, 'Videos');
        }
        parsedData = normalizeAIResponse(normalized, mode);
        // Explicitly override fallback metadata since AI succeeded
        parsedData.source = 'advanced-ai-engine';
        parsedData.provider = attempt.provider;
        parsedData.model = attempt.label.includes('GitHub') ? (attempt.label.includes('Expert') ? 'gpt-4.1' : 'gpt-4.1-mini') : 'llama-3.3-70b-versatile';
        console.log(`✅ AI Model [${attempt.label}] succeeded for mode: ${mode}`);
        break;
      }
    } catch (e) {
      console.error(`❌ AI Model [${attempt.label}] attempt failed:`, e.stack || e);
    }
  }

  const finalData = parsedData || buildFallbackAiResult(query, searchData, currentYear);
  const finalResult = { success: true, query, data: finalData, provider: finalData.provider, timestamp: new Date().toISOString() };
  await setPersistentCache(cacheKey, finalResult);
  return finalResult;
}

export async function aiSearch(req, res) {
  const { query, mode = "intelligence" } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });
  const cacheKey = getAIIntelCacheKey(query, mode);
  const cached = getCache(cacheKey) || await getPersistentCache(cacheKey);
  if (cached) return res.json(cached);

  const { jobId, accessKey } = await queueService.enqueueJob('ai_intelligence_search', { query, mode });
  return res.status(202).json({ success: true, data: { jobId, accessKey } });
}

export async function getCourseInsights(req, res) {
  const { courseTitle } = req.body;
  if (!courseTitle) return res.status(400).json({ error: "Course title required" });

  const cacheKey = `course_insight_${encodeURIComponent(courseTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase())}_v1`;
  let cached = getCache(cacheKey) || await getPersistentCache(cacheKey);
  if (cached) return res.json(cached);

  const systemPrompt = `You are a Career Data Analyst. Provide insights for a person taking the course: "${courseTitle}".
Return ONLY valid JSON with exactly these keys: 
'jobCount' (string, e.g. "2.4k+" or "15k+"), 
'avgSalary' (string, e.g. "₹10-15 LPA" or "$80k-$120k"), 
'salaryBoost' (number, e.g. 42), 
'livePatch' (array of precisely 3 short informative sentences outlining main learning outcomes and industry relevance). 
Do NOT include markdown formatting or conversational text. Return raw JSON only.`;

  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing in environment");
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content;
    const parsedData = extractJSON(content);
    
    if (parsedData && parsedData.jobCount && Array.isArray(parsedData.livePatch)) {
      console.log(`✅ [CourseInsights] Generated unique insights for: ${courseTitle}`);
      await setPersistentCache(cacheKey, parsedData, { ttlDays: 7 });
      return res.json(parsedData);
    } else {
      console.warn(`⚠️ [CourseInsights] AI returned malformed data for: ${courseTitle}. Content:`, content);
    }
  } catch (e) {
    console.error(`❌ [CourseInsights] AI Failed for "${courseTitle}":`, e.message);
  }

  // Improved fallback that at least mentions the course title context if possible
  const fallback = { 
    jobCount: "1.2k+", 
    avgSalary: "Competitive", 
    salaryBoost: 35, 
    livePatch: [
      `Master core concepts and advanced techniques in ${courseTitle}.`,
      "Build practical, industry-aligned projects to boost your portfolio.",
      "Gain specialized skills highly valued by top-tier recruiters."
    ] 
  };
  return res.json(fallback);
}

export async function aiSearchJobStatus(req, res) {
  const { jobId } = req.params;
  const accessKey = req.query.accessKey || null;

  try {
    const jobStatus = await queueService.getJobStatus(jobId, { accessKey });
    
    if (!jobStatus) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (jobStatus.forbidden) {
      return res.status(403).json({ success: false, error: 'Access denied to this job' });
    }

    return res.json({
      success: true,
      status: jobStatus.status,
      data: jobStatus.result,
      error: jobStatus.error
    });
  } catch (error) {
    console.error('❌ Job Status Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
