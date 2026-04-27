'use client';

/**
 * GUARDIAN PROVIDER
 * =================
 * Global Guardian integration that:
 * - Calls /api/guardian/evaluate on page load
 * - Refreshes every 5 minutes
 * - Shows modal only for P0/P1 interventions
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const GuardianContext = createContext(null);

// Track session start time
let sessionStartTime = null;
let sessionInterventions = 0;

export function GuardianProvider({ children }) {
    const { token } = useAuth();
    const [intervention, setIntervention] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);

    // Calculate session duration in minutes
    const getSessionDuration = useCallback(() => {
        if (!sessionStartTime) {
            sessionStartTime = Date.now();
        }
        return Math.floor((Date.now() - sessionStartTime) / 60000);
    }, []);

    // Evaluate Guardian
    const evaluateGuardian = useCallback(async () => {
        if (!token) return;

        setIsEvaluating(true);
        try {
            const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/';

            const result = await api.evaluateGuardian({
                sessionDuration: getSessionDuration(),
                currentPage,
                interventionsThisSession: sessionInterventions
            }, token);

            if (result.success && result.intervention?.shouldIntervene) {
                const priority = result.intervention.priority;

                // Only show modal for P0 and P1 interventions
                if (priority <= 1) {
                    setIntervention(result.intervention);
                    setShowModal(true);
                    sessionInterventions++;
                } else {
                    // For P2+ interventions, just store for inline display
                    setIntervention(result.intervention);
                }
            } else {
                setIntervention(null);
            }
        } catch (error) {
            console.error('[Guardian] Evaluation error:', error);
        } finally {
            setIsEvaluating(false);
        }
    }, [token, getSessionDuration]);

    // Initial evaluation on mount and every 5 minutes
    useEffect(() => {
        if (!token) return;

        // Reset session data
        sessionStartTime = Date.now();
        sessionInterventions = 0;

        // Initial check
        evaluateGuardian();

        // Check every 5 minutes
        const interval = setInterval(evaluateGuardian, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [token, evaluateGuardian]);

    // Handle intervention acknowledgment
    const acknowledgeIntervention = useCallback(async (action) => {
        setShowModal(false);

        // Send acknowledgment to backend via PKG event
        if (intervention && token) {
            try {
                await api.sendPKGEvent('intervention_acknowledged', {
                    type: intervention.interventionType,
                    action
                }, token);
            } catch (e) {
                console.warn('[Guardian] Failed to send acknowledgment:', e);
            }
        }

        // Clear intervention after acknowledgment
        setTimeout(() => setIntervention(null), 300);
    }, [intervention, token]);

    // Dismiss inline intervention
    const dismissIntervention = useCallback(() => {
        setIntervention(null);
    }, []);

    const value = {
        intervention,
        showModal,
        isEvaluating,
        evaluateGuardian,
        acknowledgeIntervention,
        dismissIntervention
    };

    return (
        <GuardianContext.Provider value={value}>
            {children}
            {/* P0/P1 Modal */}
            {showModal && intervention && (
                <GuardianModal
                    intervention={intervention}
                    onAcknowledge={acknowledgeIntervention}
                />
            )}
        </GuardianContext.Provider>
    );
}

export function useGuardian() {
    const context = useContext(GuardianContext);
    if (!context) {
        throw new Error('useGuardian must be used within a GuardianProvider');
    }
    return context;
}

// ============================================
// GUARDIAN MODAL (P0/P1 Only)
// ============================================
function GuardianModal({ intervention, onAcknowledge }) {
    const { message, interventionType, priority } = intervention;

    // P0 = Force (no dismiss), P1 = Strong suggestion (can snooze once)
    const isP0 = priority === 0;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden">
                {/* Header */}
                <div className={`px-6 py-4 ${isP0 ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{message.emoji}</span>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                {message.title}
                            </h2>
                            <span className={`text-xs font-medium ${isP0 ? 'text-red-500' : 'text-amber-500'}`}>
                                {isP0 ? 'Wellbeing Priority' : 'Recommendation'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                        {message.body}
                    </p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-[var(--border-primary)] flex gap-3">
                    <button
                        onClick={() => onAcknowledge('accept')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all
              ${isP0
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-[var(--accent-primary)] hover:opacity-90 text-white'
                            }`}
                    >
                        {message.action}
                    </button>

                    {!isP0 && message.alternativeAction && (
                        <button
                            onClick={() => onAcknowledge('dismiss')}
                            className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--card-bg-hover)] 
                text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all
                border border-[var(--border-primary)]"
                        >
                            {message.alternativeAction}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GuardianProvider;
