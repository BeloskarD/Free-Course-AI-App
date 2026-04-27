'use client';

import { useState } from 'react';
import { X, Coffee, Clock, Timer, CheckCircle, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

/**
 * 🧘 BreakReminder Component - Burnout Prevention Feature
 * 
 * Shows a gentle reminder to take a break after extended learning sessions.
 * Fully responsive, dual-theme compatible, following design standards.
 */
export default function BreakReminder({
    sessionMinutes = 0,
    onDismiss,
    onTakeBreak
}) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [breakTaken, setBreakTaken] = useState(false);

    const handleTakeBreak = async () => {
        setLoading(true);
        try {
            if (token) {
                await api.logBreak(5, token);
            }
            setBreakTaken(true);
            setTimeout(() => {
                onTakeBreak?.();
            }, 2000);
        } catch (error) {
            console.error('Error logging break:', error);
            onTakeBreak?.();
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async () => {
        try {
            if (token) {
                await api.dismissBreakReminder(token);
            }
        } catch (error) {
            console.error('Error dismissing break:', error);
        }
        onDismiss?.();
    };

    const handleRemindLater = () => {
        onDismiss?.('remind-later');
    };

    if (breakTaken) {
        return (
            <div className="
                p-4 rounded-2xl
                bg-gradient-to-r from-emerald-500/10 to-teal-500/10
                border border-emerald-500/20
                text-center
                animate-pulse
            ">
                <div className="flex items-center justify-center gap-2 text-emerald-500">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold text-sm sm:text-base">Great job taking a break! 🧘</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--site-text-muted)] mt-2">
                    See you in 5 minutes!
                </p>
            </div>
        );
    }

    return (
        <div className="
            relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl
            bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10
            border border-amber-500/20
            shadow-lg
        ">
            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className="
                    absolute top-2 right-2 sm:top-3 sm:right-3
                    w-7 h-7 sm:w-8 sm:h-8
                    flex items-center justify-center
                    rounded-full
                    bg-[var(--card-bg)] hover:bg-red-500/10
                    border border-[var(--card-border)] hover:border-red-500/30
                    text-[var(--site-text-muted)] hover:text-red-500
                    transition-all duration-200
                    cursor-pointer
                "
                aria-label="Dismiss reminder"
            >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pr-8">
                <div className="
                    w-10 h-10 sm:w-12 sm:h-12
                    rounded-2xl
                    bg-gradient-to-br from-amber-500 to-orange-600
                    flex items-center justify-center
                    shadow-lg shadow-amber-500/20
                ">
                    <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm sm:text-base text-[var(--site-text)]">
                        Time for a Break! ☕
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--site-text-muted)] flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {sessionMinutes} minutes learning
                    </p>
                </div>
            </div>

            {/* Message */}
            <p className="text-xs sm:text-sm text-[var(--site-text-muted)] leading-relaxed mb-3 sm:mb-4">
                You've been working hard! Taking short breaks helps your brain consolidate learning
                and prevents burnout. Even 5 minutes makes a difference. 🧠
            </p>

            {/* Tips */}
            <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
                {[
                    { icon: '🚶', text: 'Stretch' },
                    { icon: '💧', text: 'Hydrate' },
                    { icon: '👀', text: 'Rest eyes' },
                ].map((tip, idx) => (
                    <div
                        key={idx}
                        className="
                            flex flex-col items-center justify-center
                            py-2 px-1
                            bg-[var(--card-bg)]/50
                            rounded-xl
                            text-center
                        "
                    >
                        <span className="text-base sm:text-lg mb-0.5">{tip.icon}</span>
                        <span className="text-[10px] sm:text-xs text-[var(--site-text-muted)]">{tip.text}</span>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
                <button
                    onClick={handleTakeBreak}
                    disabled={loading}
                    className="
                        flex-1
                        flex items-center justify-center gap-2
                        px-4 py-2.5 sm:py-3
                        bg-gradient-to-r from-amber-500 to-orange-500
                        hover:from-amber-600 hover:to-orange-600
                        text-white text-sm font-semibold
                        rounded-xl
                        transition-all duration-200
                        active:scale-95
                        cursor-pointer
                        shadow-lg shadow-amber-500/20
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    {loading ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                        <>
                            <Coffee className="w-4 h-4" />
                            Take a 5-min Break
                        </>
                    )}
                </button>
                <button
                    onClick={handleRemindLater}
                    className="
                        flex items-center justify-center gap-2
                        px-4 py-2.5
                        bg-[var(--card-bg)]
                        border border-[var(--card-border)]
                        hover:border-[var(--accent-primary)]/30
                        text-[var(--site-text-muted)] hover:text-[var(--site-text)]
                        text-xs sm:text-sm font-medium
                        rounded-xl
                        transition-all duration-200
                        cursor-pointer
                    "
                >
                    <Clock className="w-3.5 h-3.5" />
                    Remind in 15 min
                </button>
            </div>

            {/* Wellness tip */}
            <div className="
                mt-3 pt-3
                border-t border-[var(--card-border)]/50
                flex items-start gap-2
            ">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-xs text-[var(--site-text-muted)] leading-relaxed">
                    <span className="font-semibold text-amber-500">Pro tip:</span> The Pomodoro technique
                    (50 min work, 10 min rest) can boost productivity by 25%!
                </p>
            </div>
        </div>
    );
}
