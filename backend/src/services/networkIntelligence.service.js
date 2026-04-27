/**
 * NETWORK INTELLIGENCE SERVICE
 * =============================
 * Happenstance-based contextual network intelligence.
 * Called ONLY when triggered by an opportunity context (never standalone).
 *
 * Functions:
 *   - analyzeNetworkPaths: Accepts opportunity cluster + skills + companies,
 *     queries Happenstance, normalizes results, returns structured data.
 *
 * NetworkLeverageScore formula:
 *   (1 / connectionDegree × 0.4)
 *   + (companyMatchScore × 0.3)
 *   + (roleRelevanceScore × 0.2)
 *   + (mutualStrength × 0.1)
 *
 * Output shape (raw API data is NEVER exposed):
 *   { warmPaths: [], hiringManagers: [], domainExperts: [], networkScore: number }
 */

// ========================================
// CONFIGURATION
// ========================================

const HAPPENSTANCE_BASE_URL = 'https://api.happenstance.ai/v1';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_RESULTS = 20;

// In‑memory cache: Map<queryHash, { data, timestamp }>
const queryCache = new Map();

// ========================================
// HELPERS
// ========================================

/**
 * Generate a deterministic hash for cache dedup.
 */
function hashQuery(params) {
    const str = JSON.stringify(params);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return 'niq_' + Math.abs(h).toString(36);
}

/**
 * Check cache and return if fresh.
 */
function getCached(key) {
    const entry = queryCache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
    }
    if (entry) queryCache.delete(key);
    return null;
}

/**
 * Set cache with TTL cleanup.
 */
function setCache(key, data) {
    // Evict stale entries (max 100 cached)
    if (queryCache.size > 100) {
        const now = Date.now();
        for (const [k, v] of queryCache) {
            if (now - v.timestamp > CACHE_TTL) queryCache.delete(k);
        }
    }
    queryCache.set(key, { data, timestamp: Date.now() });
}

// ========================================
// HAPPENSTANCE API CLIENT
// ========================================

/**
 * Call Happenstance Search API.
 * @param {string} query - Natural language search query
 * @returns {Array|null} - Raw results or null on failure
 */
async function callHappenstanceSearch(query) {
    const apiKey = process.env.HAPPENSTANCE_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ [NetworkIntelligence] HAPPENSTANCE_API_KEY not configured');
        return null;
    }

    try {
        const res = await fetch(`${HAPPENSTANCE_BASE_URL}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                query,
                limit: MAX_RESULTS
            }),
            signal: AbortSignal.timeout(12000) // 12s hard timeout
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error(`❌ [NetworkIntelligence] Happenstance API ${res.status}: ${errText}`);
            return null;
        }

        const data = await res.json();
        return data.results || data.data || data.people || data || [];
    } catch (err) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            console.error('❌ [NetworkIntelligence] Happenstance API timeout (12s)');
        } else {
            console.error('❌ [NetworkIntelligence] Happenstance API error:', err.message);
        }
        return null;
    }
}

/**
 * Call Happenstance Research API for deeper profile info.
 * @param {string} identifier - person identifier (name, email, or URL)
 * @returns {Object|null}
 */
async function callHappenstanceResearch(identifier) {
    const apiKey = process.env.HAPPENSTANCE_API_KEY;
    if (!apiKey) return null;

    try {
        const res = await fetch(`${HAPPENSTANCE_BASE_URL}/research`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ query: identifier }),
            signal: AbortSignal.timeout(10000)
        });

        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// ========================================
// SCORING ENGINE
// ========================================

/**
 * Detect connection degree from Happenstance result metadata.
 * Defaults to 3 (unknown/weakest) if not determinable.
 */
function detectConnectionDegree(person) {
    // Check explicit fields
    if (person.connectionDegree) return Math.min(person.connectionDegree, 3);
    if (person.degree) return Math.min(person.degree, 3);
    if (person.connection_degree) return Math.min(person.connection_degree, 3);

    // Infer from relationship strength indicators
    if (person.mutual_connections > 10 || person.mutualCount > 10) return 1;
    if (person.mutual_connections > 3 || person.mutualCount > 3) return 2;

    // Check if they're in the immediate network
    if (person.is_direct_connection || person.isConnection) return 1;

    return 3; // Default: distant
}

/**
 * Calculate company match score (0-1).
 */
function calculateCompanyMatch(person, targetCompanies) {
    if (!targetCompanies || targetCompanies.length === 0) return 0.5;

    const personCompany = (person.company || person.organization || person.current_company || '').toLowerCase().trim();
    if (!personCompany) return 0.2;

    for (const target of targetCompanies) {
        const t = target.toLowerCase().trim();
        if (personCompany === t) return 1.0;
        if (personCompany.includes(t) || t.includes(personCompany)) return 0.85;
    }
    return 0.2;
}

/**
 * Calculate role relevance score (0-1).
 */
function calculateRoleRelevance(person, requiredSkills, cluster) {
    const personRole = (person.role || person.title || person.position || '').toLowerCase();
    const personBio = (person.bio || person.description || person.headline || '').toLowerCase();
    const combined = `${personRole} ${personBio}`;

    let score = 0;

    // Role keyword matches
    const roleKeywords = ['engineer', 'developer', 'manager', 'lead', 'director', 'vp', 'head', 'architect', 'founder', 'cto'];
    if (roleKeywords.some(k => combined.includes(k))) score += 0.3;

    // Cluster relevance
    if (cluster) {
        const clusterTerms = cluster.toLowerCase().replace(/[_-]/g, ' ').split(' ');
        const clusterMatches = clusterTerms.filter(t => combined.includes(t)).length;
        score += Math.min(0.3, clusterMatches * 0.15);
    }

    // Skill overlap
    if (requiredSkills && requiredSkills.length > 0) {
        const skillMatches = requiredSkills.filter(s => combined.includes(s.toLowerCase())).length;
        score += Math.min(0.4, (skillMatches / requiredSkills.length) * 0.4);
    }

    return Math.min(1, score);
}

/**
 * Calculate mutual connection strength (0-1).
 */
function calculateMutualStrength(person) {
    const mutuals = person.mutual_connections || person.mutualCount || person.shared_connections || 0;
    // Logarithmic scale: 1 mutual = 0.3, 5 = 0.6, 10+ = 0.8+
    if (mutuals === 0) return 0.1;
    return Math.min(1, 0.3 + Math.log10(mutuals + 1) * 0.4);
}

/**
 * NetworkLeverageScore formula:
 *   (1 / connectionDegree × 0.4) + (companyMatchScore × 0.3)
 *   + (roleRelevanceScore × 0.2) + (mutualStrength × 0.1)
 */
function computeLeverageScore(connectionDegree, companyMatchScore, roleRelevanceScore, mutualStrength) {
    return (
        ((1 / connectionDegree) * 0.4) +
        (companyMatchScore * 0.3) +
        (roleRelevanceScore * 0.2) +
        (mutualStrength * 0.1)
    );
}

// ========================================
// NORMALIZATION (Never expose raw API data)
// ========================================

/**
 * Normalize a raw Happenstance person result into a clean, safe object.
 */
function normalizePerson(raw, targetCompanies, requiredSkills, cluster) {
    const name = raw.name || raw.full_name || raw.display_name || 'Unknown';
    const role = raw.role || raw.title || raw.position || raw.headline || '';
    const company = raw.company || raw.organization || raw.current_company || '';

    const connectionDegree = detectConnectionDegree(raw);
    const companyMatchScore = calculateCompanyMatch(raw, targetCompanies);
    const roleRelevanceScore = calculateRoleRelevance(raw, requiredSkills, cluster);
    const mutualStrength = calculateMutualStrength(raw);

    return {
        name: name.substring(0, 60),           // sanitize length
        role: role.substring(0, 100),
        company: company.substring(0, 80),
        connectionDegree,
        leverageScore: Math.round(
            computeLeverageScore(connectionDegree, companyMatchScore, roleRelevanceScore, mutualStrength) * 1000
        ) / 1000,
        companyMatchScore: Math.round(companyMatchScore * 100) / 100,
        roleRelevanceScore: Math.round(roleRelevanceScore * 100) / 100,
        mutualStrength: Math.round(mutualStrength * 100) / 100
    };
}

/**
 * Classify normalized people into categories.
 */
function classifyPeople(normalizedPeople) {
    const warmPaths = [];
    const hiringManagers = [];
    const domainExperts = [];

    for (const person of normalizedPeople) {
        const roleLower = person.role.toLowerCase();

        // Is this a hiring manager?
        const isHiringManager = (
            roleLower.includes('manager') ||
            roleLower.includes('director') ||
            roleLower.includes('head of') ||
            roleLower.includes('vp') ||
            roleLower.includes('lead') ||
            (roleLower.includes('recruiter') || roleLower.includes('talent'))
        );

        // Is this a domain expert?
        const isDomainExpert = (
            roleLower.includes('engineer') ||
            roleLower.includes('architect') ||
            roleLower.includes('developer') ||
            roleLower.includes('scientist') ||
            roleLower.includes('researcher')
        );

        // Warm paths: 1st or 2nd degree connections
        if (person.connectionDegree <= 2) {
            warmPaths.push(person);
        }

        if (isHiringManager && person.companyMatchScore >= 0.5) {
            hiringManagers.push(person);
        }

        if (isDomainExpert && person.roleRelevanceScore >= 0.3) {
            domainExperts.push(person);
        }
    }

    // Sort all by leverage score descending
    warmPaths.sort((a, b) => b.leverageScore - a.leverageScore);
    hiringManagers.sort((a, b) => b.leverageScore - a.leverageScore);
    domainExperts.sort((a, b) => b.leverageScore - a.leverageScore);

    return {
        warmPaths: warmPaths.slice(0, 10),
        hiringManagers: hiringManagers.slice(0, 5),
        domainExperts: domainExperts.slice(0, 5)
    };
}

// ========================================
// PUBLIC API
// ========================================

/**
 * Analyze network paths for a given opportunity context.
 *
 * @param {Object} params
 * @param {string} params.cluster        - Opportunity cluster (e.g. "AI Infrastructure")
 * @param {string[]} params.requiredSkills - Skills required for the opportunity
 * @param {string[]} params.companies      - Target companies hiring
 * @param {string} [params.roleTarget]     - Target role title
 *
 * @returns {{ warmPaths: [], hiringManagers: [], domainExperts: [], networkScore: number }}
 */
async function analyzeNetworkPaths({ cluster, requiredSkills = [], companies = [], roleTarget = '' }) {
    const cacheKey = hashQuery({ cluster, requiredSkills, companies, roleTarget });

    // ── Return cached if fresh ──
    const cached = getCached(cacheKey);
    if (cached) {
        console.log('💾 [NetworkIntelligence] Returning cached result');
        return cached;
    }

    // ── Build search queries (contextual, never random browsing) ──
    const queries = [];

    // Primary query: role + company context
    if (companies.length > 0 && roleTarget) {
        queries.push(`${roleTarget} at ${companies.slice(0, 3).join(' or ')}`);
    }

    // Skills + cluster context
    if (requiredSkills.length > 0) {
        queries.push(`${cluster || ''} ${requiredSkills.slice(0, 5).join(', ')} engineers`);
    }

    // Cluster-only fallback
    if (queries.length === 0 && cluster) {
        queries.push(`${cluster} professionals hiring`);
    }

    if (queries.length === 0) {
        console.warn('⚠️ [NetworkIntelligence] Insufficient context for network analysis');
        return buildEmptyResult();
    }

    // ── Execute Happenstance queries in parallel ──
    console.log(`🔍 [NetworkIntelligence] Querying ${queries.length} search(es)...`);

    const rawResults = [];
    const searchPromises = queries.map(q => callHappenstanceSearch(q));
    const searchResults = await Promise.allSettled(searchPromises);

    for (const result of searchResults) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            rawResults.push(...result.value);
        }
    }

    if (rawResults.length === 0) {
        console.log('ℹ️ [NetworkIntelligence] No results from Happenstance API');
        const emptyResult = buildEmptyResult();
        setCache(cacheKey, emptyResult);
        return emptyResult;
    }

    // ── Deduplicate by name + company ──
    const deduped = [];
    const seen = new Set();
    for (const raw of rawResults) {
        const key = `${(raw.name || raw.full_name || '').toLowerCase()}_${(raw.company || raw.organization || '').toLowerCase()}`;
        if (!seen.has(key) && key !== '_') {
            seen.add(key);
            deduped.push(raw);
        }
    }

    // ── Normalize & classify ──
    const normalized = deduped.map(raw =>
        normalizePerson(raw, companies, requiredSkills, cluster)
    );

    const classified = classifyPeople(normalized);

    // ── Compute aggregate network score ──
    const allPeople = [...classified.warmPaths, ...classified.hiringManagers, ...classified.domainExperts];
    const uniqueScored = [...new Map(allPeople.map(p => [p.name, p])).values()];

    const networkScore = uniqueScored.length > 0
        ? Math.round(
            (uniqueScored.reduce((sum, p) => sum + p.leverageScore, 0) / uniqueScored.length) * 100
        ) / 100
        : 0;

    const result = {
        warmPaths: classified.warmPaths,
        hiringManagers: classified.hiringManagers,
        domainExperts: classified.domainExperts,
        networkScore,
        totalMatches: deduped.length,
        queriesExecuted: queries.length
    };

    // ── Cache result ──
    setCache(cacheKey, result);

    console.log(`✅ [NetworkIntelligence] Found ${classified.warmPaths.length} warm paths, ${classified.hiringManagers.length} hiring managers, ${classified.domainExperts.length} domain experts`);
    return result;
}

/**
 * Quick check: is network intelligence available?
 */
function isAvailable() {
    return !!process.env.HAPPENSTANCE_API_KEY;
}

/**
 * Build empty result (used for fallback / no data).
 */
function buildEmptyResult() {
    return {
        warmPaths: [],
        hiringManagers: [],
        domainExperts: [],
        networkScore: 0,
        totalMatches: 0,
        queriesExecuted: 0
    };
}

/**
 * Clear cache (for testing / admin).
 */
function clearCache() {
    queryCache.clear();
}

export default {
    analyzeNetworkPaths,
    isAvailable,
    buildEmptyResult,
    clearCache,
    // Internal exports for testing
    computeLeverageScore,
    detectConnectionDegree,
    normalizePerson
};
