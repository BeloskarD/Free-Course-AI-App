'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Coffee, Clock, Timer, CheckCircle, Sparkles, PlayCircle, Bell, Pause } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

/**
 * 🧘 GlobalBreakReminder - Floating Popup for Burnout Prevention
 * 
 * Features:
 * 1. Break suggestion after 45+ minutes of learning
 * 2. Break timer with countdown when user takes a break
 * 3. "Break's over!" alert to remind user to resume studying
 * 4. Works on any page - perfect for users watching courses/videos
 */
export default function GlobalBreakReminder() {
    const { token, user } = useAuth();

    // 🧪 DEV TEST MODE: Set to true for quick testing
    const DEV_TEST_MODE = false; // ✅ Set to true for quick testing
    const BREAK_REMINDER_THRESHOLD = DEV_TEST_MODE
        ? 1 * 60 * 1000   // 1 minute (for testing)
        : 45 * 60 * 1000; // 45 minutes (production)
    const REMIND_LATER_DELAY = DEV_TEST_MODE
        ? 30 * 1000       // 30 seconds (for testing)
        : 15 * 60 * 1000; // 15 minutes (production)
    const DEFAULT_BREAK_DURATION = DEV_TEST_MODE
        ? 15 * 1000       // 15 seconds (for testing)
        : 5 * 60 * 1000;  // 5 minutes (production)
    const CHECK_INTERVAL = DEV_TEST_MODE ? 10 * 1000 : 60 * 1000;

    // States
    const [sessionStartTime] = useState(() => Date.now());
    const [showReminder, setShowReminder] = useState(false);
    const [lastDismiss, setLastDismiss] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sessionMinutes, setSessionMinutes] = useState(0);

    // Break timer states
    const [onBreak, setOnBreak] = useState(false);
    const [breakEndTime, setBreakEndTime] = useState(null);
    const [breakTimeLeft, setBreakTimeLeft] = useState(0);
    const [breakOver, setBreakOver] = useState(false);

    // Refs to track state changes for logging
    const lastLoggedState = useRef(null);
    const prevShowReminder = useRef(false);

    // Check if break reminder should be shown
    useEffect(() => {
        // Don't check while on break or break just ended
        if (onBreak || breakOver) return;

        const checkBreakNeeded = () => {
            const sessionDuration = Date.now() - sessionStartTime;
            const timeSinceLastDismiss = Date.now() - lastDismiss;
            const minutes = Math.floor(sessionDuration / 60000);
            setSessionMinutes(minutes);

            const shouldShow = sessionDuration >= BREAK_REMINDER_THRESHOLD &&
                (lastDismiss === 0 || timeSinceLastDismiss >= REMIND_LATER_DELAY);

            // Only log when shouldShow state changes (fixes spam)
            if (prevShowReminder.current !== shouldShow) {
                console.log('🧘 Break Check:', shouldShow ? '✅ Time for a break!' : '⏳ Not yet');
                prevShowReminder.current = shouldShow;
            }

            if (shouldShow) {
                setShowReminder(true);
            }
        };

        checkBreakNeeded();
        const interval = setInterval(checkBreakNeeded, CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [sessionStartTime, lastDismiss, onBreak, breakOver]);

    // Break countdown timer
    useEffect(() => {
        if (!onBreak || !breakEndTime) return;

        const updateTimer = () => {
            const timeLeft = breakEndTime - Date.now();
            if (timeLeft <= 0) {
                // Break is over!
                setOnBreak(false);
                setBreakOver(true);
                setBreakTimeLeft(0);
                console.log('🔔 Break is over! Time to resume studying.');
            } else {
                setBreakTimeLeft(timeLeft);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [onBreak, breakEndTime]);

    // Format time for display (mm:ss)
    const formatTime = (ms) => {
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleTakeBreak = async (durationMs = DEFAULT_BREAK_DURATION) => {
        setLoading(true);
        try {
            if (token) {
                await api.logBreak(Math.round(durationMs / 60000), token);
            }
            // Start break timer
            setShowReminder(false);
            setOnBreak(true);
            setBreakEndTime(Date.now() + durationMs);
            setBreakTimeLeft(durationMs);
            console.log('☕ Break started for', formatTime(durationMs));
        } catch (error) {
            console.error('Error logging break:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemindLater = () => {
        setLastDismiss(Date.now());
        setShowReminder(false);
    };

    const handleDismiss = () => {
        setLastDismiss(Infinity);
        setShowReminder(false);
    };

    const handleResumeStudying = () => {
        // Reset everything for a new study session
        setBreakOver(false);
        setOnBreak(false);
        setLastDismiss(Date.now());
        console.log('📚 Study session resumed!');
    };

    const handleEndBreakEarly = () => {
        setOnBreak(false);
        setBreakOver(false);
        setLastDismiss(Date.now());
        console.log('⏩ Break ended early, resuming study.');
    };

    // ===============================
    // RENDER: Break Over Alert
    // ===============================
    if (breakOver) {
        return (
            <div className="
                fixed bottom-6 right-6 z-[10000]
                p-5 rounded-2xl
                bg-[var(--card-bg)]
                border border-emerald-500/40
                backdrop-blur-xl
                shadow-2xl shadow-emerald-500/20
                w-[340px] max-w-[calc(100vw-3rem)]
                animate-in slide-in-from-right-5 fade-in duration-300
            ">
                {/* Glow effect */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-xl" />

                {/* Pulsing bell icon */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="
                        w-12 h-12
                        rounded-2xl
                        bg-gradient-to-br from-emerald-500 to-teal-600
                        flex items-center justify-center
                        shadow-lg shadow-emerald-500/30
                        animate-pulse
                    ">
                        <Bell className="w-6 h-6 text-white animate-bounce" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-[var(--site-text)]">
                            Break's Over! 🎯
                        </h3>
                        <p className="text-xs text-[var(--site-text-muted)]">
                            Ready to continue learning?
                        </p>
                    </div>
                </div>

                {/* Motivational message */}
                <p className="text-sm text-[var(--site-text-muted)] leading-relaxed mb-4">
                    You're doing great! Your brain is refreshed and ready to absorb new knowledge. Let's keep the momentum going! 🚀
                </p>

                {/* Resume button */}
                <button
                    onClick={handleResumeStudying}
                    className="
                        w-full
                        flex items-center justify-center gap-2
                        px-4 py-3
                        bg-gradient-to-r from-emerald-500 to-teal-500
                        hover:from-emerald-600 hover:to-teal-600
                        text-white text-sm font-semibold
                        rounded-xl
                        transition-all duration-200
                        active:scale-95
                        cursor-pointer
                        shadow-lg shadow-emerald-500/20
                    "
                >
                    <PlayCircle className="w-5 h-5" />
                    Resume Studying
                </button>
            </div>
        );
    }

    // ===============================
    // RENDER: Break Timer (Countdown)
    // ===============================
    if (onBreak) {
        return (
            <div className="
                fixed bottom-6 right-6 z-[10000]
                p-5 rounded-2xl
                bg-[var(--card-bg)]
                border border-teal-500/30
                backdrop-blur-xl
                shadow-2xl shadow-teal-500/20
                w-[320px] max-w-[calc(100vw-3rem)]
                animate-in slide-in-from-right-5 fade-in duration-300
            ">
                {/* Glow effect */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-transparent blur-xl" />

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="
                            w-10 h-10
                            rounded-xl
                            bg-gradient-to-br from-teal-500 to-cyan-600
                            flex items-center justify-center
                            shadow-md shadow-teal-500/20
                        ">
                            <Coffee className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-[var(--site-text)]">
                                Break Time ☕
                            </h3>
                            <p className="text-xs text-[var(--site-text-muted)]">
                                Relax and recharge
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timer display */}
                <div className="
                    flex flex-col items-center justify-center
                    py-6 mb-4
                    bg-gradient-to-br from-teal-500/10 to-cyan-500/5
                    border border-teal-500/20
                    rounded-2xl
                ">
                    <p className="text-xs text-[var(--site-text-muted)] mb-1">Time remaining</p>
                    <p className="text-4xl font-bold text-teal-500 font-mono">
                        {formatTime(breakTimeLeft)}
                    </p>
                </div>

                {/* Tips during break */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                        { icon: '🚶', text: 'Stretch' },
                        { icon: '💧', text: 'Hydrate' },
                        { icon: '🧘', text: 'Breathe' },
                    ].map((tip, idx) => (
                        <div
                            key={idx}
                            className="
                                flex flex-col items-center justify-center
                                py-2 px-1
                                bg-teal-500/5
                                border border-teal-500/10
                                rounded-xl
                                text-center
                            "
                        >
                            <span className="text-lg mb-0.5">{tip.icon}</span>
                            <span className="text-[10px] text-[var(--site-text-muted)]">{tip.text}</span>
                        </div>
                    ))}
                </div>

                {/* End break early button */}
                <button
                    onClick={handleEndBreakEarly}
                    className="
                        w-full
                        flex items-center justify-center gap-2
                        px-4 py-2.5
                        bg-[var(--card-bg)]
                        border border-[var(--card-border)]
                        hover:border-teal-500/30
                        text-[var(--site-text-muted)] hover:text-[var(--site-text)]
                        text-xs font-medium
                        rounded-xl
                        transition-all duration-200
                        cursor-pointer
                    "
                >
                    <PlayCircle className="w-4 h-4" />
                    End Break Early
                </button>
            </div>
        );
    }

    // ===============================
    // RENDER: Break Suggestion
    // ===============================
    if (!showReminder) return null;

    return (
        <div className="
            fixed bottom-6 right-6 z-[10000]
            p-4 sm:p-5 rounded-2xl
            bg-[var(--card-bg)]
            border border-amber-500/30
            backdrop-blur-xl
            shadow-2xl shadow-amber-500/20
            w-[340px] max-w-[calc(100vw-3rem)]
            animate-in slide-in-from-right-5 fade-in duration-300
        ">
            {/* Glow effect */}
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent blur-xl" />

            {/* Close button */}
            <button
                onClick={handleDismiss}
                className="
                    absolute top-2 right-2
                    w-7 h-7
                    flex items-center justify-center
                    rounded-full
                    bg-[var(--card-bg)] hover:bg-red-500/10
                    border border-[var(--card-border)] hover:border-red-500/30
                    text-[var(--site-text-muted)] hover:text-red-500
                    transition-all duration-200
                    cursor-pointer
                "
                aria-label="Dismiss"
            >
                <X className="w-3.5 h-3.5" />
            </button>

            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-3 pr-8">
                <div className="
                    w-11 h-11
                    rounded-2xl
                    bg-gradient-to-br from-amber-500 to-orange-600
                    flex items-center justify-center
                    shadow-lg shadow-amber-500/30
                    animate-bounce
                ">
                    <Coffee className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-[var(--site-text)]">
                        Time for a Break! ☕
                    </h3>
                    <p className="text-xs text-[var(--site-text-muted)] flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {sessionMinutes} min session
                    </p>
                </div>
            </div>

            {/* Message */}
            <p className="text-xs text-[var(--site-text-muted)] leading-relaxed mb-4">
                Taking short breaks helps your brain consolidate knowledge and prevents burnout. 🧠
            </p>

            {/* Break duration options */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                    { label: '5 min', duration: DEV_TEST_MODE ? 15000 : 5 * 60000 },
                    { label: '10 min', duration: DEV_TEST_MODE ? 20000 : 10 * 60000 },
                    { label: '15 min', duration: DEV_TEST_MODE ? 25000 : 15 * 60000 },
                ].map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleTakeBreak(option.duration)}
                        disabled={loading}
                        className="
                            flex flex-col items-center justify-center
                            py-3 px-2
                            bg-gradient-to-br from-amber-500/10 to-orange-500/5
                            hover:from-amber-500/20 hover:to-orange-500/10
                            border border-amber-500/20 hover:border-amber-500/40
                            rounded-xl
                            text-center
                            cursor-pointer
                            transition-all duration-200
                            active:scale-95
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    >
                        <Coffee className="w-4 h-4 text-amber-500 mb-1" />
                        <span className="text-xs font-semibold text-[var(--site-text)]">{option.label}</span>
                    </button>
                ))}
            </div>

            {/* Remind later */}
            <button
                onClick={handleRemindLater}
                className="
                    w-full
                    flex items-center justify-center gap-1.5
                    px-3 py-2.5
                    bg-[var(--card-bg)]
                    border border-[var(--card-border)]
                    hover:border-amber-500/30
                    text-[var(--site-text-muted)] hover:text-[var(--site-text)]
                    text-xs font-medium
                    rounded-xl
                    transition-all duration-200
                    cursor-pointer
                "
            >
                <Clock className="w-3.5 h-3.5" />
                Remind me later
            </button>

            {/* Pro tip */}
            <div className="mt-3 pt-3 border-t border-[var(--card-border)]/50">
                <p className="text-[10px] text-[var(--site-text-muted)] flex items-start gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>
                        <span className="font-semibold text-amber-500">Pro tip:</span>{' '}
                        The Pomodoro technique (50 min work + 10 min rest) boosts productivity!
                    </span>
                </p>
            </div>
        </div>
    );
}
