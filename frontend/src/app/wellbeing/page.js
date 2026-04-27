'use client';

import React, { useState, useEffect } from 'react';
import {
    Heart,
    Zap,
    Coffee,
    Calendar,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Brain,
    Clock,
    Flame,
    LayoutDashboard,
    ArrowRight,
    Sparkles,
    Pause
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import StreakPauseCard from '@/components/wellbeing/StreakPauseCard';

export default function WellbeingDashboard() {
    const { token, user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // SEO / Page Title Control
    useEffect(() => {
        document.title = "Wellbeing & Learning Health | Zeeklect AI";
    }, []);

    useEffect(() => {
        fetchWellbeingData();
    }, [token]);

    const fetchWellbeingData = async () => {
        try {
            setLoading(true);
            if (token) {
                const response = await api.getWellbeingStatus(token);
                if (response.success) {
                    setData(response.wellbeing);
                }
            }
        } catch (err) {
            console.error('Error fetching wellbeing data:', err);
            setError('Failed to load wellbeing data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-[var(--site-text-muted)] animate-pulse">Syncing your zen levels...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] p-8 flex flex-col items-center justify-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-[var(--site-text)] mb-2">Notice</h2>
                <p className="text-[var(--site-text-muted)] mb-6">{error}</p>
                <button
                    onClick={fetchWellbeingData}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Show sign in prompt for logged-out users
    if (!token) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] p-4 sm:p-8 flex flex-col items-center justify-center">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                        <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--site-text)] mb-3">
                        Track Your Learning Health
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--site-text-muted)] mb-8 leading-relaxed">
                        Sign in to access your personalized wellbeing dashboard, track your learning streaks, and get AI-powered insights to optimize your progress.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        <Link
                            href="/auth/login"
                            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/auth/login"
                            className="w-full sm:w-auto px-8 py-3 bg-[var(--site-text)]/5 text-[var(--site-text)] rounded-2xl font-bold text-sm hover:bg-[var(--site-text)]/10 transition-all border border-[var(--card-border)]"
                        >
                            Create Account
                        </Link>
                    </div>
                    <p className="mt-8 text-xs text-[var(--site-text-muted)]">
                        New to Zeeklect? Start your learning journey today!
                    </p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] p-4 sm:p-8 flex flex-col items-center justify-center">
                <div className="max-w-md w-full text-center">
                    <AlertCircle className="w-14 h-14 sm:w-16 sm:h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--site-text)] mb-2">
                        No Wellbeing Data Yet
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--site-text-muted)] mb-6">
                        Start a learning session to begin tracking your wellbeing stats and get personalized insights.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold text-sm"
                    >
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }


    const {
        burnoutRisk,
        riskLevel,
        factors,
        recommendations,
        wellnessStreak,
        breaksTaken,
        averageSessionLength,
        recentMoods,
        streakPausesRemaining,
        upcomingPauses
    } = data;

    // Helper for risk color
    const getRiskColor = (level) => {
        switch (level) {
            case 'high': return 'text-red-500';
            case 'moderate': return 'text-amber-500';
            default: return 'text-emerald-500';
        }
    };

    return (
        <div className="min-h-screen bg-[var(--site-bg)] pb-20 pt-8 sm:pt-12 px-4 sm:px-8 selection:bg-emerald-500/30">
            <div className="container mx-auto max-w-6xl">

                {/* Header with Navigation Integration */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                    <div>
                        <Link href="/growth" className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] mb-3 hover:gap-3 transition-all group">
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Back to Growth Hub</span>
                        </Link>
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm mb-1">
                            <Sparkles className="w-4 h-4 cursor-default animate-pulse" />
                            <span>WELLBEING & HEALTH CENTER</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-[var(--site-text)] tracking-tight">
                            Personal Learning Health
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-sm">
                        <Link href="/growth" className="px-4 py-2 text-sm font-bold text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all">
                            Performance
                        </Link>
                        <div className="px-5 py-2 text-sm font-black bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                            Health
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* Burnout Risk Gauge Section */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="glass-panel p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Zap className="w-20 h-20 text-indigo-500" />
                            </div>

                            <h3 className="text-sm font-black text-[var(--site-text-muted)] uppercase tracking-widest mb-8">Burnout Risk</h3>

                            {/* SVG Gauge */}
                            <div className="relative w-48 h-48 mb-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-[var(--card-border)] opacity-20"
                                    />
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={2 * Math.PI * 80}
                                        strokeDashoffset={2 * Math.PI * 80 * (1 - burnoutRisk / 100)}
                                        strokeLinecap="round"
                                        className={`${getRiskColor(riskLevel)} transition-all duration-1000 ease-out`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-5xl font-black ${getRiskColor(riskLevel)}`}>{burnoutRisk}</span>
                                    <span className="text-xs font-bold text-[var(--site-text-muted)] uppercase">Score</span>
                                </div>
                            </div>

                            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${riskLevel === 'low' ? 'bg-emerald-500/10 text-emerald-500' :
                                riskLevel === 'moderate' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-red-500/10 text-red-500'
                                }`}>
                                {riskLevel} Risk
                            </div>
                            <p className="text-xs text-[var(--site-text-muted)] text-center max-w-[200px]">
                                Based on your recent activity, session frequency, and mood check-ins.
                            </p>
                        </div>

                        {/* Stats Widgets */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-panel p-5 flex flex-col items-center text-center">
                                <Flame className="w-6 h-6 text-orange-500 mb-2" />
                                <span className="text-2xl font-black text-[var(--site-text)]">{wellnessStreak}</span>
                                <span className="text-[10px] font-bold text-[var(--site-text-muted)] uppercase">Wellness Streak</span>
                            </div>
                            <div className="glass-panel p-5 flex flex-col items-center text-center">
                                <Coffee className="w-6 h-6 text-teal-500 mb-2" />
                                <span className="text-2xl font-black text-[var(--site-text)]">{breaksTaken}</span>
                                <span className="text-[10px] font-bold text-[var(--site-text-muted)] uppercase">Breaks Taken</span>
                            </div>
                        </div>

                        {/* Streak Pause Card */}
                        <StreakPauseCard
                            pausesRemaining={streakPausesRemaining ?? 2}
                            upcomingPauses={upcomingPauses || []}
                            onPauseScheduled={fetchWellbeingData}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* AI Recommendations */}
                        <div className="glass-panel border-l-4 border-indigo-500 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Sparkles className="w-24 h-24 text-indigo-500" />
                            </div>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--site-text)] mb-4">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                AI Insights & Recommendations
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {recommendations.length > 0 ? (
                                    recommendations.map((rec, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-[var(--site-text)]/5 border border-[var(--card-border)] hover:bg-[var(--site-text)]/10 transition-all cursor-default group">
                                            <span className="text-2xl group-hover:scale-125 transition-transform">{rec.icon}</span>
                                            <div>
                                                <p className="text-[13px] font-bold text-[var(--site-text)] mb-1">{rec.text}</p>
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{rec.type}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="sm:col-span-2 flex items-center justify-center p-8 bg-[var(--site-text)]/5 rounded-2xl border border-dashed border-[var(--card-border)]">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
                                        <p className="text-sm font-bold text-[var(--site-text-muted)]">Looking good! Keep maintaining this healthy pace.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Visualizations Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Mood History Chart */}
                            <div className="glass-panel p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black text-[var(--site-text)] uppercase tracking-wider">Mood History</h3>
                                    <Heart className="w-4 h-4 text-rose-500" />
                                </div>
                                <div className="h-40 w-full relative group mt-4">
                                    {recentMoods.length > 1 ? (
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40">
                                            <defs>
                                                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#818CF8" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {/* Path calculation: x from 0 to 100, y from 5 (high) to 35 (low) */}
                                            {/* Score 1-5 maps to y 35-5 */}
                                            {(() => {
                                                const points = recentMoods.slice(0, 7).reverse().map((m, i) => ({
                                                    x: (i / 6) * 100,
                                                    y: 35 - ((m.score - 1) / 4) * 30
                                                }));
                                                const d = `M ${points[0].x} ${points[0].y} ` +
                                                    points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
                                                const areaD = d + ` L 100 40 L 0 40 Z`;
                                                return (
                                                    <>
                                                        <path d={areaD} fill="url(#moodGradient)" />
                                                        <path d={d} fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        {points.map((p, i) => (
                                                            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="white" stroke="#6366F1" strokeWidth="1.5" />
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--site-text-muted)] italic">
                                            Log more moods to see trends
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between mt-4 px-1">
                                    <span className="text-[8px] font-bold text-[var(--site-text-muted)] uppercase">LAST 7 CHECKS</span>
                                    <span className="text-[8px] font-bold text-[var(--site-text-muted)] uppercase">NOW</span>
                                </div>
                            </div>

                            {/* Session Health Cards */}
                            <div className="glass-panel p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-black text-[var(--site-text)] uppercase tracking-wider">Learning Rhythm</h3>
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold mb-2">
                                            <span className="text-[var(--site-text-muted)]">Average Session</span>
                                            <span className="text-[var(--site-text)]">{averageSessionLength} min</span>
                                        </div>
                                        <div className="h-2 w-full bg-[var(--card-border)]/30 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-1000"
                                                style={{ width: `${Math.min(100, (averageSessionLength / 90) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold mb-2">
                                            <span className="text-[var(--site-text-muted)]">Efficiency Score</span>
                                            <span className="text-[var(--site-text)]">{Math.round((1 - burnoutRisk / 100) * 100)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-[var(--card-border)]/30 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-1000"
                                                style={{ width: `${(1 - burnoutRisk / 100) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-[var(--card-border)]/50">
                                    <p className="text-[10px] text-[var(--site-text-muted)] leading-relaxed italic">
                                        "Focus on consistency over intensity. Small, regular sessions are more effective than high-stress marathons."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Factors */}
                        <div className="glass-panel p-6">
                            <h3 className="text-sm font-black text-[var(--site-text)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                                Assessment Factors
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {factors.length > 0 ? (
                                    factors.map((factor, i) => (
                                        <div key={i} className="px-3 py-1.5 rounded-xl bg-orange-500/5 border border-orange-500/20 text-[var(--site-text-muted)] text-[11px] font-medium flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3 text-orange-400" />
                                            {factor}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-2 text-[var(--site-text-muted)] text-[11px] font-medium italic">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        No negative risk factors identified!
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-12 p-8 glass-panel bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-center sm:text-left">
                        <h3 className="text-xl font-black text-[var(--site-text)] mb-2">Feeling Burned Out?</h3>
                        <p className="text-sm text-[var(--site-text-muted)] max-w-lg">
                            Take control of your learning pace. Schedule a rest day or adjust your daily goals to maintain a healthy long-term momentum.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/" className="px-8 py-3 bg-[var(--site-text)] text-[var(--site-bg)] rounded-2xl font-black text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-black/10">
                            Adjust Goals <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

            </div>

            {/* glass-panel styles moved to globals.css to prevent hydration mismatch */}
        </div>
    );
}
