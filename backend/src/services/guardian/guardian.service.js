/**
 * GUARDIAN SERVICE
 * ================
 * Main entry point for Guardian System.
 * Orchestrates detection and rule evaluation.
 * 
 * RULE: Guardian is READ-ONLY regarding PKG.
 * Guardian produces decisions, never mutates data.
 * 
 * Based on: Zeeklect v2 Evolution Architecture - Phase 3
 */

import { getPKG, addToAuditTrail } from '../pkgService.js';
import { runAllDetections } from './detection.logic.js';
import { evaluateRules, INTERVENTION_TYPES, PRIORITIES } from './rule.engine.js';
import { pkgRepository } from '../../repositories/index.js';

// ========================================
// MAIN EVALUATION FUNCTION
// ========================================

/**
 * Evaluate user's PKG and determine if intervention is needed
 * @param {string} userId - User's MongoDB ObjectId
 * @param {Object} sessionContext - Current session context
 * @returns {Object} Intervention decision
 */
export async function evaluateUser(userId, sessionContext = {}) {
    try {
        // Step 1: Get user's PKG (read-only)
        const pkg = await getPKG(userId);
        // SAFETY OVERRIDE: Exit shadow mode if burnout risk is high
        if (
            pkg.guardianState?.shadowMode?.active &&
            pkg.wellbeing?.currentBurnoutRisk >
            pkg.guardianState.shadowMode.autoExitThreshold
        ) {
            return {
                success: true,
                userId,
                timestamp: new Date().toISOString(),
                intervention: {
                    shouldIntervene: true,
                    interventionType: 'force_break',
                    priority: PRIORITIES.P0,
                    priorityLabel: 'P0',
                    message: {
                        title: 'Let’s Pause',
                        body: 'I know you prefer autonomy, but your wellbeing matters more right now.',
                        action: 'Take a Break',
                        emoji: '🛑'
                    }
                }
            };
        }

        if (!pkg) {
            return {
                success: false,
                error: 'PKG not found for user',
                shouldIntervene: false
            };
        }

        // Step 2: Run all detections
        const detectionResults = runAllDetections(pkg, sessionContext);

        // Step 3: Evaluate rules and determine intervention
        const intervention = evaluateRules(
            detectionResults.detections,
            pkg.guardianState,
            sessionContext
        );
        // Log guardian evaluation (non-blocking audit)
        try {
            if (pkg) {
                addToAuditTrail(pkg, 'GUARDIAN_EVALUATION', 'guardian');

                if (intervention?.shouldIntervene) {
                    addToAuditTrail(pkg, `INTERVENTION_${intervention.interventionType.toUpperCase()}`, 'guardian');
                }

                await pkgRepository.save(pkg);
            }
        } catch (e) {
            console.warn('[Guardian] Audit logging failed:', e.message);
        }

        // Step 4: Return decision (no mutation)
        return {
            success: true,
            userId,
            timestamp: new Date().toISOString(),
            sessionContext: {
                sessionDuration: sessionContext.sessionDuration || 0,
                currentPage: sessionContext.currentPage || 'unknown',
                interventionsThisSession: sessionContext.interventionsThisSession || 0
            },
            detectionSummary: {
                anyDetected: detectionResults.anyDetected,
                highestSeverity: detectionResults.highestSeverity?.type || null,
                detections: Object.fromEntries(
                    Object.entries(detectionResults.detections).map(([key, val]) => [
                        key,
                        { detected: val.detected, severity: val.severity }
                    ])
                )
            },

            intervention

        };

    } catch (error) {
        console.error('[Guardian] Evaluation error:', error);
        return {
            success: false,
            error: error.message,
            shouldIntervene: false
        };
    }
}

/**
 * Get Guardian status for a user (lightweight)
 * @param {string} userId 
 * @returns {Object} Guardian status summary
 */
export async function getGuardianStatus(userId) {
    try {
        const pkg = await getPKG(userId);

        if (!pkg) {
            return { success: false, error: 'PKG not found' };
        }

        const guardianState = pkg.guardianState || {};

        return {
            success: true,
            userId,
            status: {
                shadowModeActive: guardianState.shadowMode?.active || false,
                shadowModeSince: guardianState.shadowMode?.activatedAt || null,
                lastIntervention: guardianState.lastIntervention || null,
                interventionCount: guardianState.interventionHistory?.length || 0,
                pendingAlerts: guardianState.pendingAlerts?.length || 0
            },
            wellbeing: {
                burnoutRisk: pkg.wellbeing?.currentBurnoutRisk || 0,
                lastBreak: pkg.wellbeing?.lastBreakTaken || null,
                restDaysRemaining: (pkg.wellbeing?.restDaysTotal || 2) - (pkg.wellbeing?.restDaysUsed || 0)
            }
        };

    } catch (error) {
        console.error('[Guardian] Status error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Quick check if user needs immediate attention (P0/P1 only)
 * @param {string} userId 
 * @returns {Object} Quick check result
 */
export async function quickCheck(userId) {
    const result = await evaluateUser(userId, {});

    return {
        needsAttention: result.intervention?.priority <= PRIORITIES.P1,
        priority: result.intervention?.priorityLabel || null,
        type: result.intervention?.interventionType || null,
        message: result.intervention?.message?.title || null
    };
}

export default {
    evaluateUser,
    getGuardianStatus,
    quickCheck,
    INTERVENTION_TYPES,
    PRIORITIES
};
