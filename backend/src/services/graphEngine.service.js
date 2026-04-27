import PKG from '../models/PKG.js';
import pkgService from './pkgService.js';
import { pkgRepository } from '../repositories/index.js';

/**
 * GRAPH ENGINE SERVICE
 * ====================
 * Core computation engine for the Dynamic Cognitive Graph.
 * Handles entropy decay, mastery growth, adjacency prediction,
 * learning velocity, and skill clustering.
 */

// ========================================
// ENTROPY CALCULATION
// ========================================

/**
 * Calculate skill entropy using a modified forgetting curve.
 * E(t) = E₀ × e^(-λΔt) + (1 - C)(1 - e^(-μΔt_inactive))
 */
function calculateEntropy(skill) {
    const now = Date.now();
    const hoursSincePractice = skill.lastPracticed
        ? (now - new Date(skill.lastPracticed).getTime()) / 3600000
        : 720; // Default 30 days if never practiced
    const hoursSinceUsed = skill.lastUsedTimestamp
        ? (now - new Date(skill.lastUsedTimestamp).getTime()) / 3600000
        : hoursSincePractice;

    const lambda = Math.max(0.05, (skill.learningVelocity || 0) * 0.5 + 0.05);
    const mu = skill.decayRate || 0.02;
    const E0 = skill.entropyRate ?? 1;
    const C = skill.confidenceWeight || 0;

    const learningDecay = E0 * Math.exp(-lambda * Math.min(hoursSincePractice, 720));
    const forgettingGrowth = (1 - C) * (1 - Math.exp(-mu * Math.min(hoursSinceUsed, 720)));

    return Math.min(1, Math.max(0, learningDecay + forgettingGrowth));
}

// ========================================
// MASTERY CALCULATION
// ========================================

/**
 * Update mastery score after a practice event.
 * M(new) = M(old) + α × (Score - M(old)) × DiffMult × (1 - BurnoutPenalty)
 */
function updateMastery(skill, score, difficulty, burnoutRisk = 0) {
    const alpha = 0.15 * (1 + (skill.learningVelocity || 0) * 0.2);
    const diffMult = { easy: 0.5, medium: 1.0, hard: 1.5, expert: 2.0 }[difficulty] || 1.0;
    const burnoutPenalty = burnoutRisk * 0.3;

    const oldMastery = skill.masteryScore || 0;
    const normalizedScore = Math.min(1, Math.max(0, score / 100)); // Normalize 0-100 to 0-1
    const newMastery = oldMastery + alpha * (normalizedScore - oldMastery) * diffMult * (1 - burnoutPenalty);

    return Math.min(1, Math.max(0, newMastery));
}

// ========================================
// LEARNING VELOCITY
// ========================================

/**
 * Calculate learning velocity as EMA of mastery deltas.
 * V(t) = EMA(ΔM_i / Δt_i, α=0.3, window=10)
 */
function calculateLearningVelocity(velocityHistory) {
    if (!velocityHistory?.length) return 0;
    const alpha = 0.3;
    const window = Math.min(velocityHistory.length, 10);
    let ema = velocityHistory[0]?.delta || 0;
    for (let i = 1; i < window; i++) {
        ema = alpha * (velocityHistory[i]?.delta || 0) + (1 - alpha) * ema;
    }
    return Math.round(ema * 1000) / 1000; // 3 decimal precision
}

// ========================================
// CONFIDENCE WEIGHT
// ========================================

/**
 * Calculate confidence weight from challenge history consistency.
 * Higher consistency = higher confidence.
 */
function calculateConfidence(challengeHistory) {
    if (!challengeHistory?.length || challengeHistory.length < 2) return 0;
    const recent = challengeHistory.slice(-10);
    const scores = recent.map(c => c.score / 100);
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
    const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
    // Low variance + high mean = high confidence
    const consistency = 1 - Math.min(1, variance * 4); // Scale: 0.25 variance → 0 confidence
    return Math.min(1, Math.max(0, mean * 0.6 + consistency * 0.4));
}

// ========================================
// SKILL CLUSTERING
// ========================================

const SKILL_CLUSTER_MAP = {
    frontend: ['javascript', 'typescript', 'react', 'nextjs', 'vue', 'angular', 'html', 'css', 'tailwind', 'svelte'],
    backend: ['nodejs', 'express', 'python', 'django', 'flask', 'java', 'spring', 'go', 'rust', 'php', 'ruby'],
    database: ['mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'dynamodb', 'sql', 'graphql'],
    devops: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'cicd', 'terraform', 'linux', 'nginx', 'jenkins'],
    ai_ml: ['machinelearning', 'deeplearning', 'tensorflow', 'pytorch', 'nlp', 'computervision', 'datascience', 'pandas', 'numpy'],
    mobile: ['reactnative', 'flutter', 'swift', 'kotlin', 'ios', 'android'],
    security: ['cybersecurity', 'cryptography', 'owasp', 'penetrationtesting', 'networksecurity'],
    data: ['dataengineering', 'etl', 'spark', 'kafka', 'airflow', 'datawarehouse', 'powerbi', 'tableau']
};

function identifyCluster(skillName) {
    const normalized = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [cluster, skills] of Object.entries(SKILL_CLUSTER_MAP)) {
        if (skills.includes(normalized)) return cluster;
    }
    return 'general';
}

function buildClusters(skillsInput) {
    const clusters = {};
    // Support both Array and Map/Object formats
    const skillEntries = Array.isArray(skillsInput)
        ? skillsInput.map(s => [s.skillId || s.displayName || 'unknown', s])
        : skillsInput instanceof Map
            ? Array.from(skillsInput.entries())
            : typeof skillsInput === 'object' && skillsInput
                ? Object.entries(skillsInput)
                : [];
    for (const [name, data] of skillEntries) {
        const cluster = identifyCluster(name);
        if (!clusters[cluster]) {
            clusters[cluster] = { name: cluster, skills: [], totalMastery: 0 };
        }
        clusters[cluster].skills.push(name);
        clusters[cluster].totalMastery += (data.masteryScore || data.level / 100 || 0);
    }
    return Object.values(clusters).map(c => ({
        name: c.name,
        skills: c.skills,
        avgMastery: c.skills.length > 0 ? Math.round((c.totalMastery / c.skills.length) * 100) / 100 : 0
    }));
}

// ========================================
// ADJACENCY PREDICTION (rule-based fallback)
// ========================================

function predictAdjacency(skillName, existingSkills) {
    const cluster = identifyCluster(skillName);
    const clusterSkills = SKILL_CLUSTER_MAP[cluster] || [];
    const normalized = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingSet = new Set(existingSkills.map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '')));

    // Return other skills in the same cluster that the user has
    const adjacent = clusterSkills
        .filter(s => s !== normalized && existingSet.has(s))
        .slice(0, 5);

    // Suggest new skills in the same cluster that the user doesn't have
    const suggested = clusterSkills
        .filter(s => s !== normalized && !existingSet.has(s))
        .slice(0, 3);

    return { adjacent, suggested };
}

// ========================================
// LABEL FORMATTING UTILITIES 
// ========================================
const FORMAT_LABELS = {
    'machinelearning': 'Machine Learning',
    'datascience': 'Data Science',
    'deeplearning': 'Deep Learning',
    'computervision': 'Computer Vision',
    'reactnative': 'React Native',
    'dataengineering': 'Data Engineering',
    'frontend': 'Frontend',
    'backend': 'Backend',
    'cybersecurity': 'Cyber Security',
    'uxdesign': 'UX Design',
    'productmanagement': 'Product Management',
    'webdevelopment': 'Web Development',
    'nodejs': 'Node.js',
    'nextjs': 'Next.js',
    'advanceddeeplearninggenerativemodels': 'Advanced Deep Learning Generative Models',
    'ai': 'AI',
    'awscloud': 'AWS Cloud',
    'mongodb': 'MongoDB',
    'udemy': 'Udemy',
    'coursera': 'Coursera'
};

// ========================================
// MAIN SERVICE METHODS
// ========================================

/**
 * Get the full cognitive graph for a user.
 */
async function getFullGraph(userId) {
    const pkg = await pkgService.getPKG(userId);
    // Support both Array and Map formats
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    const skillEntries = skillsArr.map(s => [s.skillId || s.displayName || 'unknown', s]);
    const existingSkillNames = skillEntries.map(([name]) => name);

    const nodes = skillEntries.map(([name, data]) => {
        const entropy = calculateEntropy(data);
        const velocity = calculateLearningVelocity(data.velocityHistory);
        const confidence = calculateConfidence(data.challengeHistory);
        const cluster = identifyCluster(name);
        const adjacency = data.adjacencySkills?.length > 0
            ? data.adjacencySkills
            : predictAdjacency(name, existingSkillNames).adjacent;

        return {
            id: name,
            label: FORMAT_LABELS[name] || data.displayName || name.charAt(0).toUpperCase() + name.slice(1),
            level: data.level || 0,
            health: data.health || 100,
            masteryScore: data.masteryScore || 0,
            entropyRate: Math.round(entropy * 100) / 100,
            confidenceWeight: Math.round(confidence * 100) / 100,
            learningVelocity: velocity,
            lastPracticed: data.lastPracticed,
            lastUsedTimestamp: data.lastUsedTimestamp,
            applicationCount: data.applicationCount || 0,
            cluster,
            adjacencySkills: adjacency,
            decayRate: data.decayRate || 0.03,
            subTopicCount: data.subTopics instanceof Map ? data.subTopics.size : (data.subTopics ? Object.keys(data.subTopics).length : 0),
            challengeCount: data.challengeHistory?.length || 0
        };
    });

    // Build edges from adjacency relationships
    const edgeSet = new Set();
    const edges = [];
    for (const node of nodes) {
        for (const adj of node.adjacencySkills) {
            const key = [node.id, adj].sort().join('->');
            if (!edgeSet.has(key)) {
                edgeSet.add(key);
                edges.push({ source: node.id, target: adj });
            }
        }
    }

    const clusters = buildClusters(skillsArr);

    // Find dominant cluster
    const dominantCluster = clusters.length > 0
        ? clusters.reduce((best, c) => c.skills.length > best.skills.length ? c : best, clusters[0]).name
        : '';

    const maxEdges = nodes.length > 1 ? (nodes.length * (nodes.length - 1)) / 2 : 1;

    return {
        nodes,
        edges,
        clusters,
        meta: {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            graphDensity: Math.round((edges.length / maxEdges) * 100) / 100,
            dominantCluster,
            lastGraphUpdate: new Date()
        }
    };
}

/**
 * Get skill clusters with average mastery.
 */
async function getClusters(userId) {
    const pkg = await pkgService.getPKG(userId);
    return buildClusters(Array.isArray(pkg.skills) ? pkg.skills : []);
}

/**
 * Get a single skill node with adjacency and stats.
 */
async function getSkillNode(userId, skillName) {
    const pkg = await pkgService.getPKG(userId);
    const normalized = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    const skill = skillsArr.find(s => s.skillId === normalized);
    if (!skill) return null;

    const existingSkillNames = skillsArr.map(s => s.skillId || s.displayName || 'unknown');
    const adjacencyResult = predictAdjacency(normalized, existingSkillNames);

    return {
        id: normalized,
        label: FORMAT_LABELS[normalized] || skillName,
        level: skill.level || 0,
        health: skill.health || 100,
        masteryScore: skill.masteryScore || 0,
        entropyRate: calculateEntropy(skill),
        confidenceWeight: calculateConfidence(skill.challengeHistory),
        learningVelocity: calculateLearningVelocity(skill.velocityHistory),
        lastPracticed: skill.lastPracticed,
        cluster: identifyCluster(normalized),
        adjacencySkills: adjacencyResult.adjacent,
        suggestedSkills: adjacencyResult.suggested,
        subTopics: skill.subTopics instanceof Map ? Object.fromEntries(skill.subTopics) : (skill.subTopics || {}),
        recentChallenges: (skill.challengeHistory || []).slice(-5)
    };
}

/**
 * Get skill evolution timeline.
 */
async function getEvolution(userId) {
    const pkg = await pkgService.getPKG(userId);
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    const timeline = [];

    for (const data of skillsArr) {
        const name = data.skillId || data.displayName || 'unknown';
        const history = (data.challengeHistory || []).map(ch => ({
            date: ch.date,
            score: ch.score,
            topic: ch.topic
        }));

        const velocityHist = (data.velocityHistory || []).map(vh => ({
            date: vh.date,
            delta: vh.delta
        }));

        if (history.length > 0 || velocityHist.length > 0) {
            timeline.push({
                skill: name,
                masteryScore: data.masteryScore || 0,
                currentEntropy: calculateEntropy(data),
                challengeHistory: history,
                velocityHistory: velocityHist,
                firstPracticed: history.length > 0 ? history[0].date : null,
                lastPracticed: data.lastPracticed
            });
        }
    }

    return timeline.sort((a, b) => (b.lastPracticed || 0) - (a.lastPracticed || 0));
}

/**
 * Recalculate all entropy/mastery/velocity for all skills (force refresh).
 */
async function recalculateGraph(userId) {
    const pkg = await pkgService.getPKG(userId);
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    const existingSkillNames = skillsArr.map(s => s.skillId || s.displayName || 'unknown');

    for (const skill of skillsArr) {
        const name = skill.skillId || skill.displayName || 'unknown';
        skill.entropyRate = calculateEntropy(skill);
        skill.confidenceWeight = calculateConfidence(skill.challengeHistory);
        skill.learningVelocity = calculateLearningVelocity(skill.velocityHistory);

        if (!skill.adjacencySkills || skill.adjacencySkills.length === 0) {
            const { adjacent } = predictAdjacency(name, existingSkillNames);
            skill.adjacencySkills = adjacent;
        }

        // Sync masteryScore from level if not set
        if (!skill.masteryScore && skill.level > 0) {
            skill.masteryScore = Math.min(1, skill.level / 100);
        }
    }

    // Update graphMeta
    const clusters = buildClusters(skillsArr);
    const dominantCluster = clusters.length > 0
        ? clusters.reduce((best, c) => c.skills.length > best.skills.length ? c : best, clusters[0]).name
        : '';

    const totalEdges = skillsArr
        .reduce((sum, s) => sum + (s.adjacencySkills?.length || 0), 0) / 2;

    pkg.graphMeta = {
        lastGraphUpdate: new Date(),
        totalNodes: skillsArr.length,
        totalEdges: Math.round(totalEdges),
        graphDensity: skillsArr.length > 1
            ? Math.round((totalEdges / ((skillsArr.length * (skillsArr.length - 1)) / 2)) * 100) / 100
            : 0,
        dominantCluster,
        skillClusters: clusters
    };

    pkg.skills = skillsArr;
    await pkgRepository.save(pkg);

    return getFullGraph(userId);
}

export default {
    getFullGraph,
    getClusters,
    getSkillNode,
    getEvolution,
    recalculateGraph,
    calculateEntropy,
    updateMastery,
    calculateLearningVelocity,
    calculateConfidence,
    identifyCluster,
    buildClusters,
    predictAdjacency
};
