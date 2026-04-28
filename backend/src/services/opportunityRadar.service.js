import OpportunitySignal from '../models/OpportunitySignal.js';
import UserOpportunityMatch from '../models/UserOpportunityMatch.js';
import pkgService from './pkgService.js';
import graphEngineService from './graphEngine.service.js';
import { pkgRepository } from '../repositories/index.js';

/**
 * OPPORTUNITY RADAR SERVICE
 * =========================
 * Signal ingestion, skill tagging, and user-PKG matching.
 */

// In-memory signal cache with TTL (6 hours)
const signalCache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000;

function getCachedSignals() {
    const now = Date.now();
    for (const [key, entry] of signalCache) {
        if (now - entry.time > CACHE_TTL) signalCache.delete(key);
    }
    return signalCache;
}

// Match score cache per user (2 hour TTL)
const matchCache = new Map();
const MATCH_CACHE_TTL = 2 * 60 * 60 * 1000;

export function invalidateMatchCache(userId) {
    matchCache.delete(`${userId}_radar`);
}

/**
 * Calculate match score between a signal and user PKG.
 */
function calculateMatchScore(signal, pkg) {
    const skillsInput = pkg.skills || [];
    const userSkillMap = {};
    
    if (Array.isArray(skillsInput)) {
        for (const s of skillsInput) {
            const name = s.skillId || s.displayName || '';
            userSkillMap[name] = s.masteryScore || (s.level / 100) || 0;
        }
    } else if (skillsInput instanceof Map) {
        for (const [name, data] of skillsInput.entries()) {
            userSkillMap[name] = data.masteryScore || (data.level / 100) || 0;
        }
    } else if (typeof skillsInput === 'object') {
        for (const [name, data] of Object.entries(skillsInput)) {
            userSkillMap[name] = data.masteryScore || (data.level / 100) || 0;
        }
    }

    let matchSum = 0;
    let gapSum = 0;
    const gaps = [];
    const matchedSkills = [];

    for (const requiredSkill of (signal.skillTags || [])) {
        const normalized = requiredSkill.toLowerCase().replace(/[^a-z0-9]/g, '');
        const userMastery = userSkillMap[normalized] || 0;
        const requiredLevel = 0.6;

        if (userMastery >= requiredLevel) {
            matchedSkills.push({
                skill: requiredSkill,
                mastery: Math.round(userMastery * 100) / 100
            });
        }
        
        matchSum += userMastery;
        const gap = Math.max(0, requiredLevel - userMastery);
        gapSum += gap;

        if (gap > 0) {
            gaps.push({
                skill: requiredSkill,
                currentMastery: Math.round(userMastery * 100) / 100,
                requiredLevel,
                gap: Math.round(gap * 100) / 100
            });
        }
    }

    const tagCount = (signal.skillTags || []).length || 1;
    const avgSimilarity = matchSum / tagCount;
    const gapPenalty = gapSum / tagCount;

    const matchScore = (
        avgSimilarity * 0.4 +
        (signal.opportunityScore || 0.5) * 0.25 +
        Math.max(0, signal.trendMomentum || 0) * 0.2 +
        (signal.confidence || 0.5) * 0.15 -
        gapPenalty * 0.3
    );

    // --- GENERATE REASONING ---
    let aiReasoning = "Analyzing match...";
    if (matchedSkills.length >= 3) {
        aiReasoning = `Strong match found! Your mastery in ${matchedSkills.slice(0, 2).map(s => s.skill).join(' and ')} aligns perfectly with this role's core requirements.`;
    } else if (matchedSkills.length > 0) {
        aiReasoning = `You have strong foundations in ${matchedSkills[0].skill}. Focus on bridging the identified skill gaps to become a top candidate.`;
    } else {
        aiReasoning = "This role introduces new domains. Use the targeted missions to build the required foundations.";
    }

    return {
        matchScore: Math.min(1, Math.max(0, Math.round(matchScore * 100) / 100)),
        gapAnalysis: gaps.sort((a, b) => b.gap - a.gap),
        matchedSkills,
        aiReasoning
    };
}

/**
 * Freshness score for ranking.
 */
function calculateFreshness(signal) {
    const hoursSince = (Date.now() - new Date(signal.detectedAt).getTime()) / 3600000;
    const ttlHours = signal.expiresAt
        ? (new Date(signal.expiresAt).getTime() - new Date(signal.detectedAt).getTime()) / 3600000
        : 720; // Default 30 days
    return Math.max(0, 1 - (hoursSince / ttlHours));
}

/**
 * Signal dedup hash.
 */
function signalHash(title, source) {
    let hash = 0;
    const str = (title + source).toLowerCase();
    for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return 'sig_' + Math.abs(hash).toString(36);
}

/**
 * Validate signal quality.
 */
function isValidSignal(signal) {
    if (!signal.title || signal.title.length < 10) return false;
    if (!signal.skillTags?.length) return false;
    if ((signal.confidence || 0.5) < 0.2) return false;
    return true;
}

// ========================================
// PUBLIC API
// ========================================

/**
 * Ingest signals (admin/cron job).
 */
async function ingestSignals(signals) {
    const results = { ingested: 0, skipped: 0, errors: 0 };

    for (const signal of signals) {
        try {
            if (!isValidSignal(signal)) {
                results.skipped++;
                continue;
            }

            const id = signal.signalId || signalHash(signal.title, signal.source);

            // Check for existing
            const exists = await OpportunitySignal.findOne({ signalId: id });
            if (exists) {
                results.skipped++;
                continue;
            }

            await OpportunitySignal.create({
                ...signal,
                signalId: id,
                expiresAt: signal.expiresAt || new Date(Date.now() + 30 * 24 * 3600000),
                detectedAt: signal.detectedAt || new Date()
            });

            results.ingested++;
        } catch (err) {
            console.error('[OpportunityRadar] Ingest error:', err.message);
            results.errors++;
        }
    }

    return results;
}

/**
 * Get matched opportunities for a user (ranked).
 */
async function getRadar(userId, limit = 10) {
    // Check match cache
    const cacheKey = `${userId}_radar`;
    const cached = matchCache.get(cacheKey);
    if (cached && (Date.now() - cached.time < MATCH_CACHE_TTL)) {
        return cached.data.slice(0, limit); // Slice from cached full list
    }

    const pkg = await pkgService.getPKG(userId);

    // If user has no skills tracked, return empty — don't show global signals
    const skillsInput = pkg?.skills || [];
    let userHasSkills = false;
    if (Array.isArray(skillsInput)) {
        userHasSkills = skillsInput.length > 0;
    } else if (skillsInput instanceof Map) {
        userHasSkills = skillsInput.size > 0;
    } else if (typeof skillsInput === 'object') {
        userHasSkills = Object.keys(skillsInput).length > 0;
    }

    if (!userHasSkills) {
        console.log(`[OpportunityRadar] User ${userId} has no skills — returning empty radar`);
        // Do not cache empty radar so it can update immediately when skills are added
        return [];
    }

    const activeSignals = await OpportunitySignal.find({ isActive: true })
        .sort({ opportunityScore: -1 })
        .limit(500) // Larger pool to account for dismissals and filtering
        .lean();

    // --- JOIN WITH USER MATCHES FOR STATUS ---
    const userMatches = await UserOpportunityMatch.find({ userId }).lean();
    const matchMap = userMatches.reduce((acc, m) => {
        acc[m.signalId] = m;
        return acc;
    }, {});

    const matches = [];
    for (const signal of activeSignals) {
        const userMatch = matchMap[signal.signalId];
        
        // Skip dismissed signals
        if (userMatch?.status === 'dismissed') continue;
        if (signal.userDismissals?.some(id => id.toString() === userId.toString())) continue;

        const { matchScore, gapAnalysis, matchedSkills, aiReasoning } = calculateMatchScore(signal, pkg);
        const freshness = calculateFreshness(signal);

        const finalRank = matchScore * 0.5 +
            (signal.opportunityScore || 0.5) * 0.2 +
            Math.max(0, signal.trendMomentum || 0) * 0.15 +
            freshness * 0.15;

        matches.push({
            signal: {
                signalId: signal.signalId,
                title: signal.title,
                description: signal.description,
                url: signal.url,
                source: signal.source,
                skillTags: signal.skillTags,
                skillCluster: signal.skillCluster,
                opportunityScore: signal.opportunityScore,
                trendMomentum: signal.trendMomentum,
                detectedAt: signal.detectedAt,
                confidence: signal.confidence
            },
            matchScore: Math.round(matchScore * 100) / 100,
            gapAnalysis,
            matchedSkills,
            aiReasoning,
            finalRank: Math.round(finalRank * 100) / 100,
            freshness: Math.round(freshness * 100) / 100,
            status: userMatch?.status || 'new',
            savedAt: userMatch?.savedAt || null
        });
    }

    matches.sort((a, b) => b.finalRank - a.finalRank);
    
    // Invalidate earlier cache if needed, though getRadar is usually called on demand
    matchCache.set(cacheKey, { time: Date.now(), data: matches });

    return matches.slice(0, limit);
}

/**
 * Update user interaction with a signal.
 */
async function updateMatchStatus(userId, signalId, status) {
    let match = await UserOpportunityMatch.findOne({ userId, signalId });
    if (!match) {
        const signal = await OpportunitySignal.findOne({ signalId });
        if (!signal) throw new Error('Signal not found');

        const pkg = await pkgService.getPKG(userId);
        const { matchScore, gapAnalysis, matchedSkills, aiReasoning } = calculateMatchScore(signal, pkg);

        match = new UserOpportunityMatch({
            userId,
            signalId,
            matchScore,
            gapAnalysis,
            matchedSkills,
            aiReasoning,
            status
        });
    } else {
        match.status = status;
    }

    if (status === 'saved') match.savedAt = new Date();
    if (status === 'acting') match.actedAt = new Date();

    await match.save();

    // Invalidate cache
    matchCache.delete(`${userId}_radar`);

    // If dismissed, add to signal dismissals
    if (status === 'dismissed') {
        await OpportunitySignal.updateOne(
            { signalId },
            { $addToSet: { userDismissals: userId } }
        );
    }

    return match;
}

/**
 * Get all opportunities saved by the user.
 */
async function getSavedOpportunities(userId) {
    const savedMatches = await UserOpportunityMatch.find({ userId, status: 'saved' })
        .sort({ savedAt: -1 })
        .lean();

    if (savedMatches.length === 0) return [];

    const signalIds = savedMatches.map(m => m.signalId);
    const signals = await OpportunitySignal.find({ signalId: { $in: signalIds } }).lean();
    
    const signalMap = signals.reduce((acc, s) => {
        acc[s.signalId] = s;
        return acc;
    }, {});

    return savedMatches.map(match => ({
        ...match,
        signal: signalMap[match.signalId]
    })).filter(m => m.signal); 
}

/**
 * Get trending skill clusters.
 */
async function getTrends(userId) {
    if (userId) {
        try {
            const pkg = await pkgService.getPKG(userId);
            const skillsInput = pkg?.skills || [];
            let userHasSkills = false;
            if (Array.isArray(skillsInput)) {
                userHasSkills = skillsInput.length > 0;
            } else if (skillsInput instanceof Map) {
                userHasSkills = skillsInput.size > 0;
            } else if (typeof skillsInput === 'object') {
                userHasSkills = Object.keys(skillsInput).length > 0;
            }
            if (!userHasSkills) return [];
        } catch (e) {}
    }

    const signals = await OpportunitySignal.find({ isActive: true })
        .sort({ trendMomentum: -1 })
        .limit(100)
        .lean();

    const clusterMap = {};
    for (const signal of signals) {
        const cluster = signal.skillCluster || 'general';
        if (!clusterMap[cluster]) {
            clusterMap[cluster] = { cluster, signalCount: 0, avgMomentum: 0, topSignals: [] };
        }
        clusterMap[cluster].signalCount++;
        clusterMap[cluster].avgMomentum += (signal.trendMomentum || 0);
        if (clusterMap[cluster].topSignals.length < 3) {
            clusterMap[cluster].topSignals.push({
                title: signal.title,
                trendMomentum: signal.trendMomentum,
                skillTags: signal.skillTags
            });
        }
    }

    return Object.values(clusterMap)
        .map(c => {
            const volumeWeight = 1 + Math.log10(c.signalCount);
            const avgMomentum = c.signalCount > 0 ? (c.avgMomentum / c.signalCount) : 0;
            return {
                ...c,
                avgMomentum: Math.round(avgMomentum * 100) / 100,
                trendScore: Math.round(avgMomentum * volumeWeight * 100) / 100
            };
        })
        .sort((a, b) => b.trendScore - a.trendScore);
}

export default {
    ingestSignals,
    getRadar,
    updateMatchStatus,
    getSavedOpportunities,
    getTrends,
    calculateMatchScore,
    signalHash
};
