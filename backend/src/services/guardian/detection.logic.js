/**
 * GUARDIAN DETECTION LOGIC
 * ========================
 * Pure detection functions that analyze PKG data.
 * Returns detection signals with severity scores.
 * 
 * RULE: Detection logic is READ-ONLY. Never mutates PKG.
 * 
 * Based on: Zeeklect v2 Evolution Architecture - Phase 3
 */

// ========================================
// DETECTION THRESHOLDS (from Architecture Doc)
// ========================================
export const THRESHOLDS = {
    // Burnout Risk
    BURNOUT_CRITICAL: 0.85,      // P0: Force break
    BURNOUT_HIGH: 0.7,           // P1: Suggest break
    BURNOUT_MEDIUM: 0.5,         // Suppress productivity nudges

    // Stagnation
    STAGNATION_DAYS: 7,          // Days without activity
    STAGNATION_HEALTH_DROP: 0.15, // 15% health drop in window

    // Overconsumption
    CONSUMPTION_RATIO: 5,        // 5:1 consumption:application ratio
    CONSUMPTION_WINDOW_DAYS: 7,

    // Confusion Loops
    CONFUSION_THRESHOLD: 3,      // Same topic 3+ times
    CONFUSION_WINDOW_DAYS: 14,

    // Skill Decay
    DECAY_SKILL_COUNT: 3,        // 3+ skills with low health
    DECAY_HEALTH_THRESHOLD: 50,  // Health below 50%

    // Session Fatigue
    SESSION_FATIGUE_MINUTES: 90, // 90+ minutes without break

    // Abandonment
    ABANDONMENT_COUNT: 2         // 2+ missions abandoned at same stage
};

// ========================================
// DETECTION RESULT STRUCTURE
// ========================================
/**
 * @typedef {Object} DetectionResult
 * @property {string} type - Detection type (e.g., 'burnout', 'stagnation')
 * @property {boolean} detected - Whether condition was detected
 * @property {number} severity - 0-1 severity score
 * @property {Object} data - Detection-specific data
 * @property {string} message - Human-readable description
 */

// ========================================
// BURNOUT RISK DETECTION
// ========================================
/**
 * Detect burnout risk level
 * @param {Object} pkg - User's PKG document
 * @returns {DetectionResult}
 */
export function detectBurnoutRisk(pkg) {
    const risk = pkg.wellbeing?.currentBurnoutRisk || 0;

    const result = {
        type: 'burnout',
        detected: risk >= THRESHOLDS.BURNOUT_MEDIUM,
        severity: risk,
        data: {
            currentRisk: risk,
            recentMoods: pkg.wellbeing?.moodTrend?.slice(-3) || [],
            lastBreak: pkg.wellbeing?.lastBreakTaken,
            restDaysRemaining: (pkg.wellbeing?.restDaysTotal || 2) - (pkg.wellbeing?.restDaysUsed || 0)
        },
        message: ''
    };

    if (risk >= THRESHOLDS.BURNOUT_CRITICAL) {
        result.message = 'Critical burnout risk detected. User needs immediate rest.';
    } else if (risk >= THRESHOLDS.BURNOUT_HIGH) {
        result.message = 'High burnout risk. Recommend suggesting a break.';
    } else if (risk >= THRESHOLDS.BURNOUT_MEDIUM) {
        result.message = 'Moderate burnout risk. Suppress productivity nudges.';
    } else {
        result.message = 'Burnout risk within normal range.';
    }

    return result;
}

// ========================================
// LEARNING STAGNATION DETECTION
// ========================================
/**
 * Detect learning stagnation (no activity + health decline)
 * @param {Object} pkg - User's PKG document
 * @returns {DetectionResult}
 */
export function detectStagnation(pkg) {
    const now = new Date();
    const skills = Array.isArray(pkg.skills) ? pkg.skills.map(s => [s.skillId || s.displayName || 'unknown', s]) : (pkg.skills instanceof Map ? Array.from(pkg.skills.entries()) : []);

    // Find skills with recent health drops
    const stagnatingSkills = [];

    for (const [skillName, skill] of skills) {
        const lastPracticed = skill.lastPracticed ? new Date(skill.lastPracticed) : null;
        const daysSinceLastPractice = lastPracticed
            ? Math.floor((now - lastPracticed) / (1000 * 60 * 60 * 24))
            : Infinity;

        if (daysSinceLastPractice >= THRESHOLDS.STAGNATION_DAYS) {
            stagnatingSkills.push({
                name: skillName,
                daysSinceLastPractice,
                currentHealth: skill.health || 0
            });
        }
    }

    const detected = stagnatingSkills.length > 0;
    const severity = detected ? Math.min(1, stagnatingSkills.length / 5) : 0;

    return {
        type: 'stagnation',
        detected,
        severity,
        data: {
            stagnatingSkills,
            totalSkills: skills.length,
            stagnatingCount: stagnatingSkills.length
        },
        message: detected
            ? `${stagnatingSkills.length} skill(s) haven't been practiced in 7+ days.`
            : 'No stagnation detected.'
    };
}

// ========================================
// OVERCONSUMPTION DETECTION
// ========================================
/**
 * Detect overconsumption without application
 * @param {Object} pkg - User's PKG document
 * @returns {DetectionResult}
 */
export function detectOverconsumption(pkg) {
    const ratio = pkg.momentum?.consumptionToApplicationRatio || 0;
    const weeklyMinutes = pkg.momentum?.weeklyActiveMinutes || 0;
    const outputScore = pkg.momentum?.weeklyOutputScore || 0;

    // Calculate consumption (time spent) vs application (output score)
    // If high time but low output, it's overconsumption
    const detected = ratio > THRESHOLDS.CONSUMPTION_RATIO && weeklyMinutes > 60;

    return {
        type: 'overconsumption',
        detected,
        severity: detected ? Math.min(1, ratio / (THRESHOLDS.CONSUMPTION_RATIO * 2)) : 0,
        data: {
            consumptionRatio: ratio,
            weeklyMinutes,
            weeklyOutputScore: outputScore
        },
        message: detected
            ? `High consumption detected (${ratio}:1 ratio). Suggest practical application.`
            : 'Consumption/application balance is healthy.'
    };
}

// ========================================
// CONFUSION LOOP DETECTION
// ========================================
/**
 * Detect repeated confusion on same topic
 * @param {Object} pkg - User's PKG document
 * @returns {DetectionResult}
 */
export function detectConfusionLoops(pkg) {
    const confusionLoops = pkg.behavior?.confusionLoops || [];
    const now = new Date();
    const windowStart = new Date(now - THRESHOLDS.CONFUSION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Filter to recent confusion loops
    const activeLoops = confusionLoops.filter(loop => {
        const lastOccurrence = new Date(loop.lastOccurrence);
        return lastOccurrence >= windowStart && loop.occurrences >= THRESHOLDS.CONFUSION_THRESHOLD;
    });

    const detected = activeLoops.length > 0;

    return {
        type: 'confusion_loop',
        detected,
        severity: detected ? Math.min(1, activeLoops.length / 3) : 0,
        data: {
            activeLoops: activeLoops.map(l => ({
                topic: l.topic,
                occurrences: l.occurrences,
                lastOccurrence: l.lastOccurrence
            })),
            totalLoops: activeLoops.length
        },
        message: detected
            ? `User is stuck on ${activeLoops.length} topic(s): ${activeLoops.map(l => l.topic).join(', ')}`
            : 'No active confusion loops.'
    };
}

// ========================================
// SKILL DECAY DETECTION
// ========================================
/**
 * Detect accelerated skill decay (multiple skills decaying)
 * @param {Object} pkg - User's PKG document
 * @returns {DetectionResult}
 */
export function detectSkillDecay(pkg) {
    const skills = Array.isArray(pkg.skills) ? pkg.skills.map(s => [s.skillId || s.displayName || 'unknown', s]) : (pkg.skills instanceof Map ? Array.from(pkg.skills.entries()) : []);

    const decayingSkills = skills.filter(([_, skill]) =>
        skill.health < THRESHOLDS.DECAY_HEALTH_THRESHOLD
    );

    const detected = decayingSkills.length >= THRESHOLDS.DECAY_SKILL_COUNT;

    return {
        type: 'skill_decay',
        detected,
        severity: detected ? Math.min(1, decayingSkills.length / 5) : 0,
        data: {
            decayingSkills: decayingSkills.map(([name, skill]) => ({
                name,
                health: skill.health,
                lastPracticed: skill.lastPracticed
            })),
            decayingCount: decayingSkills.length,
            totalSkills: skills.length
        },
        message: detected
            ? `${decayingSkills.length} skills are decaying. Recommend targeted practice.`
            : 'Skill health is stable.'
    };
}

// ========================================
// SESSION FATIGUE DETECTION
// ========================================
/**
 * Detect extended session without break
 * @param {Object} pkg - User's PKG document
 * @param {Object} sessionContext - Current session data
 * @returns {DetectionResult}
 */
export function detectSessionFatigue(pkg, sessionContext = {}) {
    const currentSessionMinutes = sessionContext.sessionDuration || 0;
    const lastBreak = pkg.wellbeing?.lastBreakTaken;

    let minutesSinceBreak = currentSessionMinutes;
    if (lastBreak) {
        const now = new Date();
        minutesSinceBreak = Math.floor((now - new Date(lastBreak)) / (1000 * 60));
    }

    const detected = minutesSinceBreak >= THRESHOLDS.SESSION_FATIGUE_MINUTES;

    return {
        type: 'session_fatigue',
        detected,
        severity: detected ? Math.min(1, minutesSinceBreak / 120) : 0,
        data: {
            minutesSinceBreak,
            currentSessionMinutes,
            lastBreak
        },
        message: detected
            ? `User has been active for ${minutesSinceBreak} minutes without a break.`
            : 'Session length is healthy.'
    };
}

// ========================================
// ABANDONMENT PATTERN DETECTION
// ========================================
/**
 * Detect repeated mission abandonment at same stage
 * @param {Object} pkg - User's PKG document
 * @returns {DetectionResult}
 */
export function detectAbandonmentPattern(pkg) {
    const abandoned = pkg.missions?.abandoned || [];

    // Group by stage
    const stageCount = {};
    for (const mission of abandoned) {
        const stage = mission.stageReached || 1;
        stageCount[stage] = (stageCount[stage] || 0) + 1;
    }

    // Find stages with repeated abandonment
    const problematicStages = Object.entries(stageCount)
        .filter(([_, count]) => count >= THRESHOLDS.ABANDONMENT_COUNT)
        .map(([stage, count]) => ({ stage: parseInt(stage), count }));

    const detected = problematicStages.length > 0;

    return {
        type: 'abandonment_pattern',
        detected,
        severity: detected ? Math.min(1, problematicStages.length / 3) : 0,
        data: {
            problematicStages,
            totalAbandoned: abandoned.length
        },
        message: detected
            ? `User tends to abandon missions at stage(s): ${problematicStages.map(p => p.stage).join(', ')}`
            : 'No problematic abandonment patterns.'
    };
}

// ========================================
// COMPREHENSIVE DETECTION
// ========================================
/**
 * Run all detection checks and return aggregated results
 * @param {Object} pkg - User's PKG document
 * @param {Object} sessionContext - Current session context
 * @returns {Object} All detection results with highest priority signal
 */
export function runAllDetections(pkg, sessionContext = {}) {
    const detections = {
        burnout: detectBurnoutRisk(pkg),
        stagnation: detectStagnation(pkg),
        overconsumption: detectOverconsumption(pkg),
        confusionLoop: detectConfusionLoops(pkg),
        skillDecay: detectSkillDecay(pkg),
        sessionFatigue: detectSessionFatigue(pkg, sessionContext),
        abandonmentPattern: detectAbandonmentPattern(pkg)
    };

    // Find highest severity detected signal
    let highestSeverity = null;
    for (const [key, result] of Object.entries(detections)) {
        if (result.detected) {
            if (!highestSeverity || result.severity > highestSeverity.severity) {
                highestSeverity = { key, ...result };
            }
        }
    }

    return {
        detections,
        highestSeverity,
        anyDetected: highestSeverity !== null
    };
}

export default {
    THRESHOLDS,
    detectBurnoutRisk,
    detectStagnation,
    detectOverconsumption,
    detectConfusionLoops,
    detectSkillDecay,
    detectSessionFatigue,
    detectAbandonmentPattern,
    runAllDetections
};
