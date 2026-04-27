'use client';

import React, { useState } from 'react';
import { Pause, Calendar, CheckCircle, AlertCircle, Sparkles, Clock, ChevronRight, X } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

/**
 * 🧘 StreakPauseCard - Schedule guilt-free rest days
 * 
 * Professional responsive design for all screen sizes (300px - large screens)
 */
export default function StreakPauseCard({
    pausesRemaining = 2,
    upcomingPauses = [],
    onPauseScheduled
}) {
    const { token } = useAuth();
    const [selectedDate, setSelectedDate] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const getTomorrow = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const handleSchedulePause = async () => {
        if (!selectedDate) {
            setError('Please select a date');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.requestStreakPause(selectedDate, reason || 'Planned rest', token);

            if (response.success) {
                setSuccess(response.message);
                setSelectedDate('');
                setReason('');
                setShowForm(false);
                onPauseScheduled?.();
                setTimeout(() => setSuccess(null), 5000);
            } else {
                setError(response.error || 'Failed to schedule rest day');
            }
        } catch (err) {
            console.error('Streak pause error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="glass-panel p-4 sm:p-5 lg:p-6 relative overflow-hidden">


            {/* Header - Unified professional layout */}
            <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
                {/* Left: Icon + Text */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                        <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-black text-[var(--site-text)] uppercase tracking-wide sm:tracking-wider truncate">
                            Streak Pause Credits
                        </h3>
                        <p className="text-[10px] sm:text-xs text-[var(--site-text-muted)] truncate">
                            Rest days that don't break your streak
                        </p>
                    </div>
                </div>

                {/* Right: Credits Badge - Compact pill design */}
                <div className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-black text-base sm:text-lg flex-shrink-0 ${pausesRemaining > 0
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                    <span>{pausesRemaining}</span>
                    <span className="text-[10px] sm:text-xs font-bold opacity-60">/2</span>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2 sm:gap-3 animate-in slide-in-from-top duration-300">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">{success}</p>
                        <p className="text-[10px] sm:text-xs text-[var(--site-text-muted)] mt-0.5">Your streak is safe! 🎉</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 sm:gap-3">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Upcoming Pauses */}
            {upcomingPauses.length > 0 && (
                <div className="mb-4">
                    <p className="text-[10px] sm:text-xs font-bold text-[var(--site-text-muted)] uppercase tracking-wider mb-2">
                        Scheduled Rest Days
                    </p>
                    <div className="space-y-2">
                        {upcomingPauses.map((pause, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)]"
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                                    <span className="text-xs sm:text-sm font-bold text-[var(--site-text)]">
                                        {formatDate(pause.date)}
                                    </span>
                                </div>
                                <span className="text-[10px] sm:text-xs text-[var(--site-text-muted)] italic truncate ml-2">
                                    {pause.reason}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Schedule Form */}
            {showForm ? (
                <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-300 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--site-text)]/[0.02] border border-[var(--card-border)]">
                    {/* Form Header */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-black text-[var(--site-text)]">Schedule Rest Day</span>
                        <button
                            onClick={() => setShowForm(false)}
                            className="p-1.5 rounded-lg hover:bg-[var(--site-text)]/10 text-[var(--site-text-muted)] transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Date Input - Clean professional design with inset icon */}
                    <div>
                        <label className="text-[10px] sm:text-xs font-bold text-[var(--site-text-muted)] uppercase tracking-wider mb-1.5 sm:mb-2 block">
                            Select Date
                        </label>
                        <div
                            className="relative flex items-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg sm:rounded-xl transition-all cursor-pointer hover:border-indigo-500/50"
                            onClick={() => document.getElementById('rest-date-picker')?.showPicker?.()}
                        >
                            {/* Date input */}
                            <input
                                id="rest-date-picker"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={getTomorrow()}
                                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent 
                                    text-sm text-[var(--site-text)] focus:outline-none font-medium cursor-pointer
                                    [&::-webkit-calendar-picker-indicator]:hidden"
                            />
                            {/* Inset calendar icon - properly inside the input */}
                            <div className="flex-shrink-0 px-3 sm:px-4 flex items-center justify-center text-indigo-500 pointer-events-none">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                    </div>






                    {/* Reason Input */}
                    <div>
                        <label className="text-[10px] sm:text-xs font-bold text-[var(--site-text-muted)] uppercase tracking-wider mb-1.5 sm:mb-2 block">
                            Reason <span className="opacity-60 normal-case">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Family day, Self-care..."
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] 
                                text-sm text-[var(--site-text)] placeholder:text-[var(--site-text-muted)]/50
                                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                                transition-all font-medium"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3 pt-1">
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)]
                                text-[var(--site-text-muted)] font-bold text-xs sm:text-sm
                                hover:bg-[var(--site-text)]/10 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSchedulePause}
                            disabled={loading || !selectedDate}
                            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600
                                text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2
                                hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Schedule
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                /* Action Button */
                <button
                    onClick={() => setShowForm(true)}
                    disabled={pausesRemaining <= 0}
                    className={`w-full py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 cursor-pointer transition-all ${pausesRemaining > 0
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
                        : 'bg-[var(--site-text)]/10 text-[var(--site-text-muted)] cursor-not-allowed'
                        }`}
                >
                    {pausesRemaining > 0 ? (
                        <>
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Schedule a Rest Day</span>
                            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </>
                    ) : (
                        <>
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Pauses reset next month</span>
                        </>
                    )}
                </button>
            )}

            {/* Pro Tip - Only shown when form is closed */}
            {!showForm && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--card-border)]/50 flex items-start gap-2">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[9px] sm:text-[10px] text-[var(--site-text-muted)] leading-relaxed">
                        <span className="font-bold text-indigo-500">Pro tip:</span> Plan your rest days ahead.
                        Taking intentional breaks actually helps you learn faster!
                    </p>
                </div>
            )}
        </div>
    );
}
