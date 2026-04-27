import { pkgRepository } from '../repositories/index.js';
import PKG from '../models/PKG.js'; // Still needed for static methods if not moved yet
import graphEngineService from './graphEngine.service.js';
import achievementProofService from './achievementProof.service.js';
import cacheUtils from '../utils/cacheUtils.js';

/**
 * PKG UPDATE SERVICE
 * ==================
 * Centralized service for all PKG writes.
 * ALL features must write to PKG through this service.
 * Direct PKG mutation from controllers is prohibited.
 * 
 * Based on: Zeeklect v2 Evolution Architecture
 */

// ========================================
// EVENT TYPES (for POST /pkg/event)
// ========================================
export const PKG_EVENTS = {
    // Skill Events
    CHALLENGE_COMPLETED: 'challenge_completed',
    SKILL_PRACTICED: 'skill_practiced',
    SKILL_DECAYED: 'skill_decayed',

    // Behavior Events
    SEARCH_PERFORMED: 'search_performed',
    SESSION_STARTED: 'session_started',
    SESSION_ENDED: 'session_ended',
    MISSION_ABANDONED: 'mission_abandoned',
    CONFUSION_DETECTED: 'confusion_detected',

    // Wellbeing Events
    MOOD_CHECKED_IN: 'mood_checked_in',
    BREAK_TAKEN: 'break_taken',
    REST_DAY_USED: 'rest_day_used',
    BURNOUT_ASSESSED: 'burnout_assessed',

    // Momentum Events
    STREAK_UPDATED: 'streak_updated',
    MISSION_COMPLETED: 'mission_completed',
    MISSION_STARTED: 'mission_started',

    // Career Events
    CAREER_ANALYZED: 'career_analyzed',

    // Guardian Events
    INTERVENTION_TRIGGERED: 'intervention_triggered',
    INTERVENTION_ACKNOWLEDGED: 'intervention_acknowledged'
};

// ========================================
// CORE UPDATE METHODS
// ========================================

/**
 * Get or create PKG for a user (Normalizing to Array at runtime)
 * @param {ObjectId} userId 
 * @returns {Promise<PKG>}
 */
export async function getPKG(userId) {
    if (!userId) throw new Error('userId is required for getPKG');

    // 1. Concurrent Safe Get or Create
    let pkg = await PKG.getOrCreate(userId);

    // 2. Ensure Runtime Normalization (Memory-only if not saved yet)
    if (!Array.isArray(pkg.skills)) {
        pkg.skills = PKG.normalizeSkills(pkg.skills);
    }

    return pkg;
}

function setNestedValue(target, path, value) {
    const segments = path.split('.');
    let current = target;

    for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        if (current[segment] === undefined || current[segment] === null) {
            current[segment] = {};
        }
        current = current[segment];
    }

    current[segments[segments.length - 1]] = value;
}

/**
 * Update PKG using a path-based approach (for PATCH endpoint)
 * Supports dot notation: 'skills.javascript.health'
 * @param {ObjectId} userId 
 * @param {string} path - Dot notation path
 * @param {any} value - New value
 * @returns {Promise<PKG>}
 */
export async function updateByPath(userId, path, value) {
    const pkg = await getPKG(userId);
    setNestedValue(pkg, path, value);
    return await pkgRepository.save(pkg);
}

/**
 * Update multiple paths at once
 * @param {ObjectId} userId 
 * @param {Array<{path: string, value: any}>} updates 
 * @returns {Promise<PKG>}
 */
export async function updateMultiplePaths(userId, updates) {
    const pkg = await getPKG(userId);

    for (const { path, value } of updates) {
        setNestedValue(pkg, path, value);
    }

    return await pkgRepository.save(pkg);
}

// ========================================
// EVENT-DRIVEN UPDATE HANDLERS
// ========================================

/**
 * Process a PKG event and update accordingly
 * @param {ObjectId} userId 
 * @param {string} eventType - One of PKG_EVENTS
 * @param {Object} data - Event-specific data
 * @returns {Promise<{success: boolean, pkg: PKG, changes: string[]}>}
 */
export async function processEvent(userId, eventType, data) {
    const pkg = await getPKG(userId);
    const changes = [];

    try {
        switch (eventType) {
            case PKG_EVENTS.CHALLENGE_COMPLETED:
                await handleChallengeCompleted(pkg, data, changes);
                break;

            case PKG_EVENTS.MOOD_CHECKED_IN:
                await handleMoodCheckIn(pkg, data, changes);
                break;

            case PKG_EVENTS.BREAK_TAKEN:
                await handleBreakTaken(pkg, data, changes);
                break;

            case PKG_EVENTS.SEARCH_PERFORMED:
                await handleSearchPerformed(pkg, data, changes);
                break;

            case PKG_EVENTS.SESSION_ENDED:
                await handleSessionEnded(pkg, data, changes);
                break;

            case PKG_EVENTS.STREAK_UPDATED:
                await handleStreakUpdated(pkg, data, changes);
                break;

            case PKG_EVENTS.CONFUSION_DETECTED:
                await handleConfusionDetected(pkg, data, changes);
                break;

            case PKG_EVENTS.REST_DAY_USED:
                await handleRestDayUsed(pkg, data, changes);
                break;

            case PKG_EVENTS.INTERVENTION_TRIGGERED:
                await handleInterventionTriggered(pkg, data, changes);
                break;

            case PKG_EVENTS.CAREER_ANALYZED:
                await handleCareerAnalyzed(pkg, data, changes);
                break;

            case PKG_EVENTS.MISSION_STARTED:
                await handleMissionStarted(pkg, data, changes);
                break;

            case PKG_EVENTS.MISSION_COMPLETED:
                await handleMissionCompleted(pkg, data, changes);
                break;

            case PKG_EVENTS.MISSION_ABANDONED:
                await handleMissionAbandoned(pkg, data, changes);
                break;

            default:
                console.warn(`[PKG] Unknown event type: ${eventType}`);
                return { success: false, pkg, changes: [] };
        }

        // 1. Persist Changes (Using updateOne to bypass pre-save hooks as requested)
        // Sanitizing payload: disable virtuals and version keys to prevent MongoDB validation errors
        const updateData = pkg.toObject({ virtuals: false, versionKey: false });
        delete updateData._id;
        delete updateData.userId; 

        await PKG.updateOne(
            { userId: pkg.userId },
            { 
                $set: { 
                    ...updateData,
                    isInitialized: true 
                } 
            }
        );

        console.log(`[PKG] Processed ${eventType} for user ${userId} via Atomic Update. Changes: ${changes.join(', ')}`);

        // 3. Cache Invalidation with Consistency Check
        const cacheKey = `skillgraph_${userId}`;
        // Normalize skills fully before potential caching
        const normalizedSkills = PKG.normalizeSkills(pkg.skills);
        
        cacheUtils.delCache(cacheKey);
        
        return { success: true, pkg, changes };
    } catch (error) {
        console.error(`[PKG] Event processing failed for ${eventType}:`, error.message);
        // Fail-safe: Keep system usable
        return { success: false, pkg, changes, error: error.message };
    }
}

// ========================================
// INDIVIDUAL EVENT HANDLERS
// ========================================

/**
 * Handle challenge completed event
 * Updates: skills[skill].challengeHistory, skills[skill].subTopics, skills[skill].health
 */
async function handleChallengeCompleted(pkg, data, changes) {
    const { skill, topic, score, timeSpent, isAIGenerated } = data;
    const normalizedSkill = skill.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Convert skills to array if not already (Backward Compatibility)
    if (!Array.isArray(pkg.skills)) {
        pkg.skills = PKG.normalizeSkills(pkg.skills);
    }

    // Initialize skill if doesn't exist
    let skillIndex = pkg.skills.findIndex(s => s.skillId === normalizedSkill);
    
    if (skillIndex === -1) {
        pkg.skills.push({
            skillId: normalizedSkill,
            displayName: skill,
            level: 0,
            health: 100,
            masteryScore: 0,
            entropyRate: 1,
            learningVelocity: 0,
            confidenceWeight: 0,
            lastPracticed: new Date(),
            lastUsedTimestamp: new Date(),
            decayRate: 0.03,
            applicationCount: 0,
            adjacencySkills: [],
            velocityHistory: [],
            subTopics: {}, // Using plain object for subTopics in Array format
            challengeHistory: []
        });
        skillIndex = pkg.skills.length - 1;
        changes.push(`skills.${normalizedSkill} initialized`);
    }

    const skillData = pkg.skills[skillIndex];
    const oldMastery = skillData.masteryScore || 0;

    // Add to challenge history
    skillData.challengeHistory.push({
        date: new Date(),
        topic,
        score,
        timeSpent: timeSpent || 0,
        isAIGenerated: isAIGenerated !== false
    });

    // Keep only last 20 challenges per skill
    if (skillData.challengeHistory.length > 20) {
        skillData.challengeHistory = skillData.challengeHistory.slice(-20);
    }
    changes.push(`skills.${normalizedSkill}.challengeHistory updated`);

    // Update subTopic mastery
    const normalizedTopic = topic.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!skillData.subTopics) skillData.subTopics = {};

    // Support both Map and Plain Object for subTopics
    const getSubTopic = (st, key) => st instanceof Map ? st.get(key) : st[key];
    const setSubTopic = (st, key, val) => st instanceof Map ? st.set(key, val) : st[key] = val;

    const subTopic = getSubTopic(skillData.subTopics, normalizedTopic) || { mastery: 0, confusionCount: 0 };
    subTopic.mastery = Math.min(100, subTopic.mastery + (score * 0.1));
    subTopic.lastPracticed = new Date();

    // Flag confusion if score < 50
    if (score < 50) {
        subTopic.confusionCount = (subTopic.confusionCount || 0) + 1;
        changes.push(`confusion detected for ${topic}`);
    }

    setSubTopic(skillData.subTopics, normalizedTopic, subTopic);
    changes.push(`skills.${normalizedSkill}.subTopics.${normalizedTopic} updated`);

    // === GRAPH ENGINE INTEGRATION: Sophisticated mastery calculation ===
    // Determine difficulty from score context
    const difficulty = score >= 90 ? 'hard' : score >= 70 ? 'medium' : 'easy';
    const burnoutRisk = pkg.wellbeing?.currentBurnoutRisk || 0;

    // Use Graph Engine's mastery formula: M(new) = M(old) + α × (Score - M(old)) × DiffMult × (1 - BurnoutPenalty)
    skillData.masteryScore = graphEngineService.updateMastery(skillData, score, difficulty, burnoutRisk);

    // Sync level from mastery (0-1 → 0-100)
    skillData.level = Math.min(100, Math.round(skillData.masteryScore * 100));

    // Use Graph Engine's entropy formula: E(t) = E₀ × e^(-λΔt) + (1 - C)(1 - e^(-μΔt_inactive))
    skillData.lastPracticed = new Date();
    skillData.lastUsedTimestamp = new Date();
    skillData.entropyRate = graphEngineService.calculateEntropy(skillData);

    // Update velocity history for EMA calculation
    const newMastery = skillData.masteryScore;
    const masteryDelta = newMastery - oldMastery;
    if (!skillData.velocityHistory) skillData.velocityHistory = [];
    skillData.velocityHistory.push({ date: new Date(), delta: masteryDelta });
    if (skillData.velocityHistory.length > 10) {
        skillData.velocityHistory = skillData.velocityHistory.slice(-10);
    }

    // Use Graph Engine's velocity EMA: V(t) = EMA(ΔM_i / Δt_i, α=0.3, window=10)
    skillData.learningVelocity = graphEngineService.calculateLearningVelocity(skillData.velocityHistory);

    // Use Graph Engine's confidence formula from challenge history consistency
    skillData.confidenceWeight = graphEngineService.calculateConfidence(skillData.challengeHistory);

    // Health driven by confidence and entropy
    skillData.health = Math.min(100, Math.round(
        (skillData.confidenceWeight * 50) + ((1 - skillData.entropyRate) * 50)
    ));

    // Application count increment
    skillData.applicationCount = (skillData.applicationCount || 0) + 1;

    // Changes already in-place since skillData is a reference in the skills array
    changes.push(`skills.${normalizedSkill} mastery=${newMastery.toFixed(3)} entropy=${skillData.entropyRate.toFixed(3)} velocity=${skillData.learningVelocity} confidence=${skillData.confidenceWeight.toFixed(3)} health=${skillData.health}`);

    // ── Auto-Proof Triggers (fire-and-forget, never block main flow) ──
    try {
        await achievementProofService.checkMasteryThreshold(pkg.userId, skill, oldMastery, newMastery);
    } catch (proofErr) {
        console.warn(`[PKG] Auto-proof trigger skipped for ${skill}:`, proofErr.message);
    }
}

/**
 * Handle mood check-in event
 * Updates: wellbeing.moodTrend, wellbeing.currentBurnoutRisk
 */
async function handleMoodCheckIn(pkg, data, changes) {
    const { mood, energy } = data;

    // Add to mood trend
    pkg.wellbeing.moodTrend.push({
        date: new Date(),
        mood,
        energy: energy || 0.5
    });

    // Keep only last 30 entries
    if (pkg.wellbeing.moodTrend.length > 30) {
        pkg.wellbeing.moodTrend = pkg.wellbeing.moodTrend.slice(-30);
    }
    changes.push('wellbeing.moodTrend updated');

    // Recalculate burnout risk based on mood patterns
    const recentMoods = pkg.wellbeing.moodTrend.slice(-7);
    const negativeMoods = ['frustrated', 'overwhelmed', 'tired'];
    const negativeCount = recentMoods.filter(m => negativeMoods.includes(m.mood)).length;

    // Burnout risk increases with negative moods
    const moodBasedRisk = negativeCount / 7;

    // Combine with existing risk (weighted average)
    pkg.wellbeing.currentBurnoutRisk = Math.min(1,
        (pkg.wellbeing.currentBurnoutRisk * 0.6) + (moodBasedRisk * 0.4)
    );
    changes.push(`wellbeing.currentBurnoutRisk updated to ${pkg.wellbeing.currentBurnoutRisk.toFixed(2)}`);

}

/**
 * Handle break taken event
 * Updates: wellbeing.lastBreakTaken, wellbeing.averageSessionBeforeBreak
 */
async function handleBreakTaken(pkg, data, changes) {
    const { sessionDuration } = data;

    pkg.wellbeing.lastBreakTaken = new Date();
    changes.push('wellbeing.lastBreakTaken updated');

    if (sessionDuration) {
        // Update rolling average
        const currentAvg = pkg.wellbeing.averageSessionBeforeBreak || 45;
        pkg.wellbeing.averageSessionBeforeBreak = Math.round((currentAvg * 0.8) + (sessionDuration * 0.2));
        changes.push('wellbeing.averageSessionBeforeBreak updated');
    }

    // Reduce burnout risk after taking a break
    pkg.wellbeing.currentBurnoutRisk = Math.max(0, pkg.wellbeing.currentBurnoutRisk - 0.1);
    changes.push('wellbeing.currentBurnoutRisk reduced');

}

/**
 * Handle search performed event
 * Updates: behavior.searchPatterns
 */
async function handleSearchPerformed(pkg, data, changes) {
    const { query, followed, dwellTime } = data;

    pkg.behavior.searchPatterns.push({
        query,
        timestamp: new Date(),
        followed: followed || false,
        dwellTime: dwellTime || 0
    });

    // Keep only last 100 searches
    if (pkg.behavior.searchPatterns.length > 100) {
        pkg.behavior.searchPatterns = pkg.behavior.searchPatterns.slice(-100);
    }

    changes.push('behavior.searchPatterns updated');
}

/**
 * Handle session ended event
 * Updates: behavior.sessionHistory, identity.attentionSpan
 */
async function handleSessionEnded(pkg, data, changes) {
    const { duration, focusScore, pagesVisited } = data;

    pkg.behavior.sessionHistory.push({
        date: new Date(),
        duration: duration || 0,
        focusScore: focusScore || 0.5,
        pagesVisited: pagesVisited || 0
    });

    // Keep only last 90 days
    if (pkg.behavior.sessionHistory.length > 90) {
        pkg.behavior.sessionHistory = pkg.behavior.sessionHistory.slice(-90);
    }

    // Update attention span average
    const recentSessions = pkg.behavior.sessionHistory.slice(-10);
    const avgDuration = recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length;
    pkg.identity.attentionSpan.average = Math.round(avgDuration);

    // Determine trend
    if (recentSessions.length >= 5) {
        const firstHalf = recentSessions.slice(0, Math.floor(recentSessions.length / 2));
        const secondHalf = recentSessions.slice(Math.floor(recentSessions.length / 2));
        const firstAvg = firstHalf.reduce((sum, s) => sum + s.duration, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, s) => sum + s.duration, 0) / secondHalf.length;

        if (secondAvg > firstAvg * 1.1) pkg.identity.attentionSpan.trend = 'increasing';
        else if (secondAvg < firstAvg * 0.9) pkg.identity.attentionSpan.trend = 'decreasing';
        else pkg.identity.attentionSpan.trend = 'stable';
    }

    changes.push('behavior.sessionHistory updated');
    changes.push('identity.attentionSpan updated');
}

/**
 * Handle streak updated event
 * Updates: momentum.currentStreak, momentum.longestStreak, momentum.streakHealth
 */
async function handleStreakUpdated(pkg, data, changes) {
    const { streak, action } = data;

    if (action === 'increment') {
        pkg.momentum.currentStreak = (pkg.momentum.currentStreak || 0) + 1;
    } else if (action === 'reset') {
        pkg.momentum.currentStreak = 0;
    } else if (streak !== undefined) {
        pkg.momentum.currentStreak = streak;
    }

    // Update longest streak
    if (pkg.momentum.currentStreak > pkg.momentum.longestStreak) {
        pkg.momentum.longestStreak = pkg.momentum.currentStreak;
        changes.push('momentum.longestStreak updated');
    }

    // Calculate streak health (consistency measure)
    const streakRatio = pkg.momentum.currentStreak / Math.max(pkg.momentum.longestStreak, 1);
    pkg.momentum.streakHealth = Math.min(1, streakRatio);

    changes.push(`momentum.currentStreak updated to ${pkg.momentum.currentStreak}`);
}

/**
 * Handle confusion detected event
 * Updates: behavior.confusionLoops
 */
async function handleConfusionDetected(pkg, data, changes) {
    const { topic } = data;
    const normalizedTopic = topic.toLowerCase();

    // Find existing confusion loop for this topic
    const existingLoop = pkg.behavior.confusionLoops.find(
        c => c.topic.toLowerCase() === normalizedTopic
    );

    if (existingLoop) {
        existingLoop.occurrences += 1;
        existingLoop.lastOccurrence = new Date();
    } else {
        pkg.behavior.confusionLoops.push({
            topic,
            occurrences: 1,
            lastOccurrence: new Date()
        });
    }

    changes.push(`behavior.confusionLoops updated for ${topic}`);
}

/**
 * Handle rest day used event
 * Updates: wellbeing.restDaysUsed
 */
async function handleRestDayUsed(pkg, data, changes) {
    pkg.wellbeing.restDaysUsed = Math.min(
        pkg.wellbeing.restDaysTotal,
        (pkg.wellbeing.restDaysUsed || 0) + 1
    );
    pkg.wellbeing.lastBreakTaken = new Date();

    // Reduce burnout risk significantly for rest day
    pkg.wellbeing.currentBurnoutRisk = Math.max(0, pkg.wellbeing.currentBurnoutRisk - 0.2);

    changes.push(`wellbeing.restDaysUsed updated to ${pkg.wellbeing.restDaysUsed}`);
}

/**
 * Handle intervention triggered event
 * Updates: guardianState.lastIntervention, guardianState.interventionHistory
 */
async function handleInterventionTriggered(pkg, data, changes) {
    const { type, acknowledged } = data;

    pkg.guardianState.lastIntervention = new Date();
    pkg.guardianState.interventionHistory.push({
        type,
        date: new Date(),
        acknowledged: acknowledged || false
    });

    // Keep only last 50 interventions
    if (pkg.guardianState.interventionHistory.length > 50) {
        pkg.guardianState.interventionHistory = pkg.guardianState.interventionHistory.slice(-50);
    }

    changes.push(`guardianState.interventionHistory updated with ${type}`);
}

/**
 * Handle career analyzed event
 * Updates: career.*
 */
async function handleCareerAnalyzed(pkg, data, changes) {
    const { targetRole, readinessScore, gapSkills, salaryPotential } = data;

    if (targetRole) pkg.career.targetRole = targetRole;
    if (readinessScore !== undefined) pkg.career.readinessScore = readinessScore;
    if (gapSkills) pkg.career.gapSkills = gapSkills;
    if (salaryPotential) pkg.career.salaryPotential = salaryPotential;
    pkg.career.lastAnalysisDate = new Date();

    changes.push('career updated');
}

/**
 * Handle mission started event
 * Updates: missions.active
 */
async function handleMissionStarted(pkg, data, changes) {
    const { missionId, skill, subSkill } = data;

    // Add to active missions
    pkg.missions.active.push({
        missionId,
        startedAt: new Date(),
        progress: 0,
        currentStage: 1
    });

    // Keep only last 10 active missions
    if (pkg.missions.active.length > 10) {
        pkg.missions.active = pkg.missions.active.slice(-10);
    }

    changes.push(`missions.active updated - added ${missionId}`);
}

/**
 * Handle mission completed event
 * Updates: missions.completed, skills, momentum
 */
async function handleMissionCompleted(pkg, data, changes) {
    const { missionId, skill, skillBoost, pointsEarned } = data;

    // Move to completed
    if (!pkg.missions.completed.includes(missionId)) {
        pkg.missions.completed.push(missionId);
    }

    // Remove from active
    pkg.missions.active = pkg.missions.active.filter(
        m => m.missionId?.toString() !== missionId?.toString()
    );

    // Boost skill using Graph Engine mastery formula
    if (skill) {
        const normalizedSkill = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Initialize if doesn't exist
        let skillIndex = pkg.skills.findIndex(s => s.skillId === normalizedSkill);
        
        if (skillIndex === -1) {
            pkg.skills.push({
                skillId: normalizedSkill,
                displayName: skill,
                level: 0,
                health: 100,
                masteryScore: 0,
                entropyRate: 1,
                learningVelocity: 0,
                confidenceWeight: 0,
                lastPracticed: new Date(),
                lastUsedTimestamp: new Date(),
                decayRate: 0.03,
                applicationCount: 0,
                adjacencySkills: [],
                velocityHistory: [],
                subTopics: {},
                challengeHistory: []
            });
            skillIndex = pkg.skills.length - 1;
            changes.push(`skills.${normalizedSkill} initialized`);
        }
        
        const skillData = pkg.skills[skillIndex];
        const oldMastery = skillData.masteryScore || 0;

        // Use Graph Engine mastery formula with 'expert' difficulty for mission completion
        const burnoutRisk = pkg.wellbeing?.currentBurnoutRisk || 0;
        const boostScore = Math.min(100, (skillBoost || 10) * 10); // Convert boost to 0-100 score
        skillData.masteryScore = graphEngineService.updateMastery(skillData, boostScore, 'expert', burnoutRisk);

        // Sync level from mastery
        skillData.level = Math.min(100, Math.round(skillData.masteryScore * 100));
        skillData.lastPracticed = new Date();
        skillData.lastUsedTimestamp = new Date();

        // Recalculate entropy (will be low since just practiced)
        skillData.entropyRate = graphEngineService.calculateEntropy(skillData);

        // Update velocity
        const masteryDelta = skillData.masteryScore - oldMastery;
        if (!skillData.velocityHistory) skillData.velocityHistory = [];
        skillData.velocityHistory.push({ date: new Date(), delta: masteryDelta });
        if (skillData.velocityHistory.length > 10) {
            skillData.velocityHistory = skillData.velocityHistory.slice(-10);
        }
        skillData.learningVelocity = graphEngineService.calculateLearningVelocity(skillData.velocityHistory);

        // Confidence from challenge history
        skillData.confidenceWeight = graphEngineService.calculateConfidence(skillData.challengeHistory);

        // Health driven by confidence and entropy
        skillData.health = Math.min(100, Math.round(
            (skillData.confidenceWeight * 50) + ((1 - skillData.entropyRate) * 50)
        ));

        skillData.applicationCount = (skillData.applicationCount || 0) + 1;
        
        changes.push(`skills.${normalizedSkill} mission-boosted mastery=${skillData.masteryScore.toFixed(3)} entropy=${skillData.entropyRate.toFixed(3)}`);
    }

    // Update momentum
    pkg.momentum.weeklyOutputScore = Math.min(1, (pkg.momentum.weeklyOutputScore || 0) + 0.1);

    changes.push(`missions.completed - added ${missionId}`);

    // ── Auto-Proof Triggers (fire-and-forget, never block main flow) ──
    try {
        // Mission completion proof
        await achievementProofService.checkMissionCompletion(pkg.userId, {
            missionId,
            title: data.title || `${skill || 'General'} Mission`,
            description: data.description || `Completed ${skill || 'learning'} mission`,
            skills: skill ? [skill] : [],
            status: 'completed'
        });

        // Mastery threshold proof (if skill boosted past 80%)
        if (skill) {
            const normalizedSkill = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
            const skillData = pkg.skills.find(s => s.skillId === normalizedSkill);
            if (skillData) {
                const oldMastery = (skillData.masteryScore || 0) - ((skillBoost || 10) * 0.015); // approximate
                await achievementProofService.checkMasteryThreshold(pkg.userId, skill, Math.max(0, oldMastery), skillData.masteryScore);
            }
        }

        // Streak milestone proof
        const currentStreak = pkg.momentum?.currentStreak || 0;
        if (currentStreak > 0) {
            await achievementProofService.checkStreakMilestone(pkg.userId, currentStreak);
        }
    } catch (proofErr) {
        console.warn(`[PKG] Auto-proof trigger skipped for mission ${missionId}:`, proofErr.message);
    }
}

/**
 * Handle mission abandoned event
 * Updates: missions.abandoned, behavior.abandonmentPatterns
 */
async function handleMissionAbandoned(pkg, data, changes) {
    const { missionId, reason, stageReached } = data;

    // Add to abandoned
    pkg.missions.abandoned.push({
        missionId,
        reason: reason || 'unknown',
        stageReached: stageReached || 1,
        abandonedAt: new Date()
    });

    // Remove from active
    pkg.missions.active = pkg.missions.active.filter(
        m => m.missionId?.toString() !== missionId?.toString()
    );

    // Add to abandonment patterns for Guardian detection
    pkg.behavior.abandonmentPatterns.push({
        missionId,
        stage: stageReached || 1,
        reason: reason || 'unknown',
        timestamp: new Date()
    });

    // Keep only last 20 abandonment patterns
    if (pkg.behavior.abandonmentPatterns.length > 20) {
        pkg.behavior.abandonmentPatterns = pkg.behavior.abandonmentPatterns.slice(-20);
    }

    changes.push(`missions.abandoned - added ${missionId}`);
}

// ========================================
// UTILITY METHODS
// ========================================

/**
 * Check if PKG exists for a user
 */
export async function pkgExists(userId) {
    const count = await PKG.countDocuments({ userId });
    return count > 0;
}

/**
 * Add an event to the audit trail with auto-rotation (capped at 200)
 * @param {PKG} pkg 
 * @param {string} eventType 
 * @param {string} source 
 */
export function addToAuditTrail(pkg, eventType, source = 'system') {
    if (!pkg.auditTrail) pkg.auditTrail = [];

    // Auto-rotate: Remove oldest entries BEFORE adding new ones if at limit
    // This ensures we NEVER save more than 200 entries
    while (pkg.auditTrail.length >= 200) {
        pkg.auditTrail.shift();
    }

    pkg.auditTrail.push({
        eventType,
        source,
        timestamp: new Date()
    });

}

/**
 * Delete PKG for a user (for testing/cleanup)
 */
export async function deletePKG(userId) {
    await PKG.deleteOne({ userId });
}

export default {
    getPKG,
    updateByPath,
    updateMultiplePaths,
    processEvent,
    pkgExists,
    deletePKG,
    addToAuditTrail,
    PKG_EVENTS
};
