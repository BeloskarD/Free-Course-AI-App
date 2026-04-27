/**
 * GUARDIAN RULE ENGINE
 * ====================
 * Evaluates detection results and determines appropriate intervention.
 * Enforces priorities, cooldowns, and wellbeing overrides.
 * 
 * RULE: Rule Engine is READ-ONLY. Never mutates PKG.
 * 
 * Based on: Zeeklect v2 Evolution Architecture - Phase 3
 */

import { THRESHOLDS } from './detection.logic.js';

const GLOBAL_INTERVENTION_COOLDOWN_MINUTES = 240; // 4 hours
// ========================================
// INTERVENTION TYPES
// ========================================
export const INTERVENTION_TYPES = {
    FORCE_BREAK: 'force_break',
    SUGGEST_BREAK: 'suggest_break',
    CONFUSION_HELP: 'confusion_help',
    STAGNATION_NUDGE: 'stagnation_nudge',
    OVERCONSUMPTION_ALERT: 'overconsumption_alert',
    DECAY_WARNING: 'decay_warning',
    ABANDONMENT_SUPPORT: 'abandonment_support',
    SESSION_FATIGUE: 'session_fatigue'
};

// ========================================
// INTERVENTION PRIORITIES (P0 = Highest)
// ========================================
export const PRIORITIES = {
    P0: 0,  // Critical - Force action (no override)
    P1: 1,  // High - Strongly recommend (snooze 1x allowed)
    P2: 2,  // Medium - Helpful suggestion (dismissible)
    P3: 3,  // Low - Gentle nudge (dismissible)
    P4: 4   // Nudge - Passive suggestion (ignorable)
};

// ========================================
// INTERVENTION DEFINITIONS
// ========================================
const INTERVENTION_CONFIG = {
    [INTERVENTION_TYPES.FORCE_BREAK]: {
        priority: PRIORITIES.P0,
        triggerDetection: 'burnout',
        condition: (detection) => detection.severity >= THRESHOLDS.BURNOUT_CRITICAL,
        overrideAllowed: false,
        cooldownMinutes: 0  // No cooldown for critical
    },
    [INTERVENTION_TYPES.SUGGEST_BREAK]: {
        priority: PRIORITIES.P1,
        triggerDetection: 'burnout',
        condition: (detection) => detection.severity >= THRESHOLDS.BURNOUT_HIGH,
        overrideAllowed: true,
        maxSnooze: 1,
        cooldownMinutes: 60
    },
    [INTERVENTION_TYPES.SESSION_FATIGUE]: {
        priority: PRIORITIES.P1,
        triggerDetection: 'sessionFatigue',
        condition: (detection) => detection.detected,
        overrideAllowed: true,
        maxSnooze: 1,
        cooldownMinutes: 30
    },
    [INTERVENTION_TYPES.CONFUSION_HELP]: {
        priority: PRIORITIES.P2,
        triggerDetection: 'confusionLoop',
        condition: (detection) => detection.detected,
        overrideAllowed: true,
        cooldownMinutes: 120
    },
    [INTERVENTION_TYPES.DECAY_WARNING]: {
        priority: PRIORITIES.P2,
        triggerDetection: 'skillDecay',
        condition: (detection) => detection.detected,
        overrideAllowed: true,
        cooldownMinutes: 240
    },
    [INTERVENTION_TYPES.OVERCONSUMPTION_ALERT]: {
        priority: PRIORITIES.P3,
        triggerDetection: 'overconsumption',
        condition: (detection) => detection.detected,
        overrideAllowed: true,
        cooldownMinutes: 240
    },
    [INTERVENTION_TYPES.STAGNATION_NUDGE]: {
        priority: PRIORITIES.P4,
        triggerDetection: 'stagnation',
        condition: (detection) => detection.detected,
        overrideAllowed: true,
        cooldownMinutes: 480  // 8 hours
    },
    [INTERVENTION_TYPES.ABANDONMENT_SUPPORT]: {
        priority: PRIORITIES.P4,
        triggerDetection: 'abandonmentPattern',
        condition: (detection) => detection.detected,
        overrideAllowed: true,
        cooldownMinutes: 1440  // 24 hours
    }
};

// ========================================
// INTERVENTION MESSAGES
// ========================================
const MESSAGES = {
    [INTERVENTION_TYPES.FORCE_BREAK]: {
        title: "Time to Rest",
        body: `Hey — I've noticed you've been pushing really hard. Your focus is admirable, but sustainable growth beats sprints every time.\n\nHow about we pause here? I'll hold your progress, and tomorrow we'll come back sharper.`,
        action: "Take a Break",
        emoji: "🛑"
    },
    [INTERVENTION_TYPES.SUGGEST_BREAK]: {
        title: "Consider a Break",
        body: `You've been at this for a while now. Your energy might be dipping.\n\nA quick break could help you come back stronger. Your streak is safe if you take one now.`,
        action: "Take a Break",
        alternativeAction: "5 More Minutes",
        emoji: "☕"
    },
    [INTERVENTION_TYPES.SESSION_FATIGUE]: {
        title: "Extended Session",
        body: `You've been active for over 90 minutes without a break. Great dedication!\n\nBut research shows that short breaks actually boost learning retention. How about a quick stretch?`,
        action: "Take 5 Minutes",
        alternativeAction: "Continue",
        emoji: "⏰"
    },
    [INTERVENTION_TYPES.CONFUSION_HELP]: {
        title: "Need Some Help?",
        body: (data) => `I see you've circled back to '${data.activeLoops?.[0]?.topic || 'this topic'}' a few times now. That's totally normal — it's one of those concepts that clicks suddenly.\n\nWant me to explain it differently? I can use a real-world analogy, show you a diagram, or walk through an example together.`,
        action: "Explain Differently",
        alternativeAction: "I've Got It",
        emoji: "💡"
    },
    [INTERVENTION_TYPES.DECAY_WARNING]: {
        title: "Skills Fading",
        body: (data) => `Your ${data.decayingSkills?.[0]?.name || 'skills'} knowledge is starting to fade — it's been a while since you practiced.\n\nA quick 5-minute challenge could bring it right back. Ready?`,
        action: "Quick Challenge",
        alternativeAction: "Later",
        emoji: "🔄"
    },
    [INTERVENTION_TYPES.OVERCONSUMPTION_ALERT]: {
        title: "Time to Build",
        body: `You've explored a lot recently — that's great! But I haven't seen you build anything yet.\n\nLearning sticks when you apply it. Want me to suggest a 30-minute project that uses what you've learned?`,
        action: "Show Me a Project",
        alternativeAction: "Keep Exploring",
        emoji: "🛠️"
    },
    [INTERVENTION_TYPES.STAGNATION_NUDGE]: {
        title: "Keep the Momentum",
        body: (data) => `It's been a while since you practiced ${data.stagnatingSkills?.[0]?.name || 'your skills'}. A quick refresher could keep your edge sharp.\n\nWant to jump into a short challenge?`,
        action: "Let's Go",
        alternativeAction: "Not Now",
        emoji: "🎯"
    },
    [INTERVENTION_TYPES.ABANDONMENT_SUPPORT]: {
        title: "Let's Talk",
        body: `I noticed you've paused a few learning missions recently. That's completely okay — everyone's journey is different.\n\nWould it help to try a different approach, or would you like to talk about what made those challenging?`,
        action: "Try Different Approach",
        alternativeAction: "I'm Fine",
        emoji: "💬"
    }
};

// ========================================
// RULE EVALUATION
// ========================================

/**
 * Check if intervention is on cooldown
 * @param {string} interventionType 
 * @param {Object} guardianState - From PKG
 * @returns {boolean}
 */
function isOnCooldown(interventionType, guardianState) {
    const config = INTERVENTION_CONFIG[interventionType];
    if (!config || config.cooldownMinutes === 0) return false;

    const history = guardianState?.interventionHistory || [];
    const lastOfType = history
        .filter(i => i.type === interventionType)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!lastOfType) return false;

    const minutesSinceLast = (Date.now() - new Date(lastOfType.date)) / (1000 * 60);
    return minutesSinceLast < config.cooldownMinutes;
}

/**
 * Check if max interventions per session reached
 * @param {Object} sessionContext 
 * @returns {boolean}
 */
function maxInterventionsReached(sessionContext) {
    const interventionsThisSession = sessionContext.interventionsThisSession || 0;
    return interventionsThisSession >= 1; // Max 1 per session
}

/**
 * Apply wellbeing override logic
 * @param {string} interventionType 
 * @param {Object} detections 
 * @returns {{allowed: boolean, reason: string}}
 */
function applyWellbeingOverride(interventionType, detections) {
    const config = INTERVENTION_CONFIG[interventionType];
    const burnout = detections.burnout;

    // P0 interventions always proceed
    if (config.priority === PRIORITIES.P0) {
        return { allowed: true, reason: null };
    }

    // Suppress productivity nudges (P3+) when burnout risk > 0.5
    if (burnout.severity >= THRESHOLDS.BURNOUT_MEDIUM && config.priority >= PRIORITIES.P3) {
        return { allowed: false, reason: 'wellbeing_priority' };
    }

    // Check recent mood - suppress productivity nudges if user is struggling
    const recentMoods = burnout.data?.recentMoods || [];
    const negativeMoods = ['frustrated', 'overwhelmed', 'tired'];
    const isNegativeMood = recentMoods.some(m => negativeMoods.includes(m.mood));

    if (isNegativeMood && config.priority >= PRIORITIES.P3) {
        return { allowed: false, reason: 'mood_sensitive' };
    }

    return { allowed: true, reason: null };
}

/**
 * Check if user is in shadow mode
 * @param {Object} guardianState 
 * @returns {boolean}
 */
function isInShadowMode(guardianState) {
    return guardianState?.shadowMode?.active === true;
}

/**
 * Evaluate detections and determine intervention
 * @param {Object} detections - From detection.logic.runAllDetections()
 * @param {Object} guardianState - From PKG.guardianState
 * @param {Object} sessionContext - Current session data
 * @returns {Object} Intervention decision
 */
export function evaluateRules(detections, guardianState = {}, sessionContext = {}) {

    // GLOBAL COOLDOWN: prevent frequent interruptions across sessions
    if (guardianState?.lastIntervention) {
        const diffMinutes =
            (Date.now() - new Date(guardianState.lastIntervention)) / (1000 * 60);

        if (diffMinutes < GLOBAL_INTERVENTION_COOLDOWN_MINUTES) {
            return {
                shouldIntervene: false,
                reason: 'global_cooldown_active',
                interventionType: null,
                message: null
            };
        }
    }
    // Check shadow mode first (only P0/P1 pass through)
    const inShadowMode = isInShadowMode(guardianState);

    // Check max interventions per session
    if (maxInterventionsReached(sessionContext)) {
        // Only P0 can override
        const burnout = detections.burnout;
        if (!(burnout.severity >= THRESHOLDS.BURNOUT_CRITICAL)) {
            return {
                shouldIntervene: false,
                reason: 'max_interventions_reached',
                interventionType: null,
                message: null
            };
        }
    }

    // Evaluate each intervention in priority order
    const sortedInterventions = Object.entries(INTERVENTION_CONFIG)
        .sort((a, b) => a[1].priority - b[1].priority);

    for (const [interventionType, config] of sortedInterventions) {
        const detection = detections[config.triggerDetection];
        if (!detection) continue;

        // Check if detection triggers this intervention
        if (!config.condition(detection)) continue;

        // Shadow mode: only P0/P1 pass
        if (inShadowMode && config.priority > PRIORITIES.P1) continue;

        // Check cooldown
        if (isOnCooldown(interventionType, guardianState)) continue;

        // Apply wellbeing override
        const wellbeingCheck = applyWellbeingOverride(interventionType, detections);
        if (!wellbeingCheck.allowed) {
            continue; // Skip this intervention, try next
        }

        // Build message
        const messageConfig = MESSAGES[interventionType];
        const messageBody = typeof messageConfig.body === 'function'
            ? messageConfig.body(detection.data)
            : messageConfig.body;

        return {
            shouldIntervene: true,
            reason: 'condition_met',
            interventionType,
            priority: config.priority,
            priorityLabel: `P${config.priority}`,
            overrideAllowed: config.overrideAllowed,
            message: {
                title: messageConfig.title,
                body: messageBody,
                action: messageConfig.action,
                alternativeAction: messageConfig.alternativeAction || null,
                emoji: messageConfig.emoji
            },
            detection: {
                type: detection.type,
                severity: detection.severity,
                data: detection.data
            },
            metadata: {
                cooldownMinutes: config.cooldownMinutes,
                shadowModeActive: inShadowMode
            }
        };
    }

    // No intervention needed
    return {
        shouldIntervene: false,
        reason: 'no_conditions_met',
        interventionType: null,
        message: null
    };
}

export default {
    INTERVENTION_TYPES,
    PRIORITIES,
    INTERVENTION_CONFIG,
    evaluateRules
};
