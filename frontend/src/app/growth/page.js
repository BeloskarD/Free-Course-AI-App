'use client';

/**
 * GROWTH PAGE (Mission-Centric)
 * =============================
 * Shows mission progress and achievements as the primary content.
 * PKG narrative sections are supplementary when data exists.
 */

import { usePKGSummary, useMissions } from '../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { Rocket, Shield, ArrowRight, Play } from 'lucide-react';

export default function GrowthPage() {
    const { token, user } = useAuth();
    const { data: summary, isLoading: isLoadingPKG, error } = usePKGSummary();
    const { data: missionsData, isLoading: isLoadingMissions } = useMissions();

    if (!token) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="card-elite p-12 text-center max-w-md w-full relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                    <div className="text-6xl mb-6 scale-animation">🔐</div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Your Story Awaits</h2>
                    <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
                        Sign in to unlock your personalized growth intelligence and track your mission milestones.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center justify-center w-full py-4 rounded-xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-lg hover:shadow-[var(--accent-primary)]/20 hover:scale-[1.02] transition-all duration-300"
                    >
                        Sign In →
                    </Link>
                </div>
            </div>
        );
    }

    // Show skeleton while loading (either missions or PKG)
    if (isLoadingMissions || isLoadingPKG) {
        return <GrowthSkeleton />;
    }

    // Extract mission data
    const completedMissions = missionsData?.data?.completed || [];
    const activeMissions = missionsData?.data?.active || [];
    const hasMissionData = completedMissions.length > 0 || activeMissions.length > 0;

    // Extract PKG data
    const hasPKGData = summary?.data && !isEmptyPKG(summary.data);
    const pkg = summary?.data;

    // Show error state only for actual API failures (not empty data)
    const isRealError = error && error.message && !error.message.includes('404');
    if (isRealError) {
        return (
            <div className="min-h-screen py-12 px-4 sm:px-6">
                <div className="max-w-2xl mx-auto text-center py-20 card-elite p-8">
                    <div className="text-5xl mb-6">📡</div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Sync Interrupted</h2>
                    <p className="text-[var(--text-secondary)]">
                        We're having trouble retrieving your data. Let's try refreshing the connection.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-8 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // If no missions AND no PKG data, show the new user empty state
    if (!hasMissionData && !hasPKGData) {
        return <EmptyGrowthState />;
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Elite Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 dark:opacity-40">
                <div className="absolute top-[10%] right-[10%] w-[40rem] h-[40rem] bg-[var(--accent-primary)]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] left-[-5%] w-[30rem] h-[30rem] bg-[var(--accent-secondary)]/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header Section */}
                <header className="mb-10 sm:mb-14 text-center sm:text-left relative animate-in fade-in slide-in-from-left-8 duration-700">
                    <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4 sm:mb-6 border border-[var(--accent-primary)]/20 shadow-glow-sm">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                        Your Record: Week of {getCurrentWeekRange()}
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[var(--text-primary)] tracking-tight mb-4 sm:mb-5 leading-tight">
                        My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] animate-gradient-x">Growth Hub</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg sm:text-xl font-medium max-w-xl leading-relaxed opacity-80 italic">
                        A clear record of your progress, milestones, and <span className="text-[var(--text-primary)] font-bold">learning momentum</span>.
                    </p>

                </header>

                {/* Main Story Flow */}
                <div className="space-y-8">
                    {/* Mission Achievements - Primary Focus */}
                    <MissionAchievements missionsData={missionsData} />

                    {/* Extended Intelligence Sections */}
                    {hasPKGData && (
                        <div className="grid gap-8">
                            <StorySection title="Skills Tracked" emoji="🧠" delay="0ms">
                                <WorkedOnNarrative pkg={pkg} />
                            </StorySection>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <StorySection title="Recent Challenges" emoji="⚡" delay="100ms">
                                    <ChallengesNarrative pkg={pkg} />
                                </StorySection>

                                <StorySection title="Progression" emoji="🚀" delay="200ms">
                                    <ProgressNarrative pkg={pkg} />
                                </StorySection>
                            </div>

                            <StorySection title="Next Goals" emoji="🎯" delay="300ms">
                                <NextFocusNarrative pkg={pkg} />
                            </StorySection>

                        </div>
                    )}

                    {!hasPKGData && hasMissionData && (
                        <div className="card-elite p-6 sm:p-10 text-center relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[var(--accent-primary)]/5 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🌱</div>
                            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mb-3 italic">Expanding Horizon</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto text-sm sm:text-base">
                                You're building the foundation. Complete more challenges to unlock <span className="text-[var(--text-primary)] font-semibold">Deep Analytics</span> including focus distribution and friction mapping.
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Hub */}
                <div className="mt-12 sm:mt-16 pt-8 border-t border-[var(--border-primary)] flex flex-col sm:flex-row gap-4 sm:gap-6 px-1">
                    <Link
                        href="/mission-home"
                        className="flex-1 h-14 sm:h-16 rounded-xl sm:rounded-2xl font-black uppercase tracking-[0.15em] sm:tracking-widest bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white text-[10px]
                            shadow-xl hover:shadow-[var(--accent-primary)]/40 hover:scale-[1.02] active:scale-95 transition-all duration-500 
                            flex items-center justify-center gap-3 group/btn"
                    >
                        <span className="leading-none mt-[1px]">Resume Mission</span>
                        <Rocket size={16} className="transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                    </Link>
                    <Link
                        href="/wellbeing"
                        className="flex-1 h-14 sm:h-16 rounded-xl sm:rounded-2xl font-black uppercase tracking-[0.15em] sm:tracking-widest
                            bg-[var(--card-bg)] border border-[var(--border-primary)] text-[var(--accent-primary)] text-[10px]
                            hover:border-[var(--accent-primary)] hover:shadow-glow-sm hover:bg-[var(--accent-primary)]/[0.03] transition-all duration-500 
                            flex items-center justify-center gap-3 group/well"
                    >
                        <span className="leading-none mt-[1px]">Mental Health Check</span>
                        <span className="text-xl transition-transform duration-300 group-hover/well:scale-110 flex items-center justify-center">🛡️</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ============================================
// STORY SECTIONS
// ============================================

function StorySection({ title, emoji, children, delay }) {
    return (
        <section
            className="card-elite p-5 sm:p-8 relative overflow-hidden group hover:shadow-glow-sm transition-all duration-500"
            style={{ animationDelay: delay }}
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--accent-primary)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-black text-[var(--text-primary)] mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl filter drop-shadow-sm group-hover:scale-125 transition-transform duration-500">{emoji}</span>
                {title}
            </h2>
            <div className="text-[var(--text-secondary)] leading-relaxed text-base sm:text-lg font-medium italic opacity-90">
                {children}
            </div>
        </section>
    );
}

// Mission Achievements Section
function MissionAchievements({ missionsData }) {
    const rawActiveMissions = missionsData?.data?.active || [];
    const completedMissions = missionsData?.data?.completed || [];

    // Sort active missions by most recently worked on
    const activeMissions = [...rawActiveMissions].sort((a, b) => {
        const dateA = new Date(a.lastActivityAt || a.updatedAt || 0);
        const dateB = new Date(b.lastActivityAt || b.updatedAt || 0);
        return dateB - dateA;
    });

    // Calculate total points from completed missions
    const totalPoints = completedMissions.reduce((sum, item) => sum + (item.pointsEarned || 10), 0);
    const uniqueSkills = [...new Set(completedMissions.map(item => item.missionId?.skill).filter(Boolean))];

    if (completedMissions.length === 0 && activeMissions.length === 0) {
        return null;
    }

    return (
        <section className="card-elite p-8 relative overflow-hidden bg-gradient-to-br from-[var(--card-bg)] via-[var(--card-bg)] to-[var(--accent-primary)]/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-8xl">🏆</span>
            </div>

            <h2 className="flex items-center gap-3 text-2xl font-black text-[var(--text-primary)] mb-8">
                Achievements
            </h2>

            {/* Stats Summary - Expanded & Professional */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12">
                {[
                    { label: 'Objectives', val: completedMissions.length, color: 'var(--accent-primary)', icon: '🏆', desc: 'Completed' },
                    { label: 'Learning Momentum', val: totalPoints, color: '#10b981', icon: '⚡', desc: 'Skill Points' },
                    { label: 'Expertise', val: uniqueSkills.length, color: '#3b82f6', icon: '🧬', desc: 'Skills Mastered' }
                ].map((stat, i) => (

                    <div key={i} className={`relative p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] bg-[var(--card-bg)] border-2 border-[var(--border-primary)] shadow-sm hover:border-[var(--accent-primary)]/40 transition-all duration-500 group cursor-pointer hover:scale-[1.03] active:scale-95 ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="text-[8px] sm:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] sm:tracking-[0.3em]">{stat.label}</div>
                            <span className="text-lg sm:text-xl group-hover:rotate-12 transition-transform duration-500 group-hover:scale-125">{stat.icon}</span>
                        </div>
                        <div className="text-2xl sm:text-5xl font-black tracking-tighter mb-1" style={{ color: stat.color }}>
                            {stat.val}
                        </div>
                        <div className="text-[8px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                            {stat.desc}
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Mission - High Contrast */}
            {activeMissions.length > 0 && (
                <div className="mb-10">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[var(--text-muted)] mb-4 sm:mb-5 px-1 font-heading">ACTIVE MISSION</p>
                    <div className="p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] border-2 border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/[0.04] group cursor-pointer hover:bg-[var(--accent-primary)]/[0.08] transition-all duration-500 hover:shadow-glow-sm">
                        <div className="flex items-start sm:items-center justify-between gap-4 mb-4 sm:mb-5">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10 shrink-0">
                                    <span className="text-lg sm:text-xl font-black animate-pulse">🛰️</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="font-black text-base sm:text-xl text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors tracking-tight line-clamp-2 block break-words">
                                        {activeMissions[0]?.missionId?.title || 'Active Mission'}
                                    </span>
                                    <p className="text-[8px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-1">
                                        STEP {activeMissions[0]?.currentStage || 1} IN PROGRESS
                                    </p>

                                </div>
                            </div>
                            <div className="text-right shrink-0 mt-1 sm:mt-0">
                                <span className="text-2xl sm:text-3xl font-black text-[var(--accent-primary)]">{Math.round((activeMissions[0]?.progress || 0) * 100)}%</span>
                            </div>
                        </div>
                        <div className="w-full h-2 sm:h-3 bg-[var(--progress-bg)] rounded-full overflow-hidden border border-[var(--border-primary)]/10 p-0.5">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-[length:200%_auto] animate-gradient-x rounded-full transition-all duration-1000"
                                style={{ width: `${Math.round((activeMissions[0]?.progress || 0) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Completions - Styled as Timeline */}
            {completedMissions.length > 0 && (
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4 sm:mb-5">Historical Milestones</p>
                    <div className="space-y-2 sm:space-y-3">
                        {completedMissions.slice(0, 3).map((item, i) => (
                            <div key={item._id || i} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)]/50 hover:border-[var(--accent-primary)]/30 transition-all cursor-pointer hover:bg-[var(--site-text)]/[0.02]">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold shrink-0 text-xs sm:text-sm">
                                        ✓
                                    </div>
                                    <span className="text-[var(--text-primary)] font-bold truncate text-xs sm:text-sm">
                                        {item.missionId?.title}
                                    </span>
                                </div>
                                <span className="text-[8px] sm:text-xs font-black text-green-500 bg-green-500/10 px-2 sm:px-3 py-1 rounded-full shrink-0">
                                    +{item.pointsEarned || 10} XP
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Link
                href="/missions"
                className="mt-12 sm:mt-20 mb-10 block text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.4em] text-[var(--accent-primary)] hover:translate-x-2 transition-transform cursor-pointer py-4 sm:py-5 rounded-2xl border border-[var(--border-primary)]/30 bg-[var(--card-bg)] shadow-sm hover:shadow-glow-sm hover:border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/5"
            >
                Check Mission Progress <span className="ml-2 text-lg">→</span>
            </Link>

        </section>
    );
}

function WorkedOnNarrative({ pkg }) {
    const skills = pkg?.topSkills || [];
    const streak = pkg?.momentum?.currentStreak || 0;
    const minutes = pkg?.momentum?.weeklyActiveMinutes || 0;

    if (skills.length === 0) {
        return (
            <p>
                This week is a fresh start. You haven't logged any learning activity yet —
                and that's okay. Every journey begins with a single step.
            </p>
        );
    }

    const skillNames = skills.map(s => s.name).join(', ');
    const topSkill = skills[0];

    return (
        <>
            <p>
                This week, you focused on <strong className="text-[var(--text-primary)]">{skillNames}</strong>.
                {topSkill && ` Your strongest effort went into ${topSkill.name}, where you reached ${topSkill.level || 0}% mastery.`}
            </p>
            {minutes > 0 && (
                <p>
                    You spent approximately {minutes} minutes learning, maintaining a {streak}-day streak.
                </p>
            )}
        </>
    );
}

function ChallengesNarrative({ pkg }) {
    const confusionLoops = pkg?.behavior?.confusionCount || 0;
    const burnoutRisk = pkg?.wellbeing?.burnoutRisk || 0;

    if (confusionLoops === 0 && burnoutRisk < 0.3) {
        return (
            <p>
                Smooth sailing this week. No major confusion points or overwhelm detected.
                You're in a good learning rhythm.
            </p>
        );
    }

    return (
        <>
            {confusionLoops > 0 && (
                <p>
                    You encountered some challenging concepts — topics you circled back to {confusionLoops} times.
                    That's completely normal. Confusion is a sign of growth, not failure.
                </p>
            )}
            {burnoutRisk >= 0.3 && burnoutRisk < 0.6 && (
                <p>
                    Your energy levels showed some fluctuation. Remember to take breaks —
                    sustainable learning beats intense sprints.
                </p>
            )}
            {burnoutRisk >= 0.6 && (
                <p>
                    You pushed hard this week, and your wellbeing signals suggest it might be time to rest.
                    Recovery is part of progress.
                </p>
            )}
        </>
    );
}

function ProgressNarrative({ pkg }) {
    const completedMissions = pkg?.missions?.completedThisWeek || 0;
    const skillBoosts = pkg?.momentum?.weeklyOutputScore || 0;
    const longestStreak = pkg?.momentum?.longestStreak || 0;

    if (completedMissions === 0 && skillBoosts < 0.1) {
        return (
            <p>
                Progress isn't always visible in numbers. Sometimes it's the notes you took,
                the concepts you wrestled with, or the questions you started asking.
                That counts too.
            </p>
        );
    }

    return (
        <>
            {completedMissions > 0 && (
                <p>
                    You completed <strong className="text-[var(--text-primary)]">{completedMissions} mission{completedMissions > 1 ? 's' : ''}</strong> this week.
                    Each one strengthened your skill foundation.
                </p>
            )}
            {longestStreak > 3 && (
                <p>
                    Your consistency is building — a {longestStreak}-day learning streak shows real commitment.
                </p>
            )}
            <p>
                Every small step compounds over time. Trust the process.
            </p>
        </>
    );
}

function NextFocusNarrative({ pkg }) {
    const gapSkills = pkg?.career?.gapSkills || [];
    const decayingSkills = pkg?.topSkills?.filter(s => (s.health || 100) < 50) || [];
    const activeMission = pkg?.missions?.activeMission;

    if (activeMission) {
        return (
            <p>
                Continue where you left off: <strong className="text-[var(--text-primary)]">{activeMission.title || 'your current mission'}</strong>.
                Finishing what you start builds momentum.
            </p>
        );
    }

    if (decayingSkills.length > 0) {
        return (
            <p>
                Your <strong className="text-[var(--text-primary)]">{decayingSkills[0].name}</strong> skill
                could use some attention — it's been a while since you practiced.
                A quick refresher goes a long way.
            </p>
        );
    }

    if (gapSkills.length > 0) {
        return (
            <p>
                Based on your career goals, consider exploring <strong className="text-[var(--text-primary)]">{gapSkills[0].skill || gapSkills[0]}</strong> next.
                It's a gap worth closing.
            </p>
        );
    }

    return (
        <p>
            Keep exploring. The best learning happens when you follow your curiosity
            while staying grounded in your goals.
        </p>
    );
}

// ============================================
// HELPERS
// ============================================

function getCurrentWeekRange() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const options = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', options)}`;
}

// Check if PKG data is empty (new user with no activity)
function isEmptyPKG(pkg) {
    if (!pkg) return true;

    // Check for any meaningful activity
    const hasSkills = pkg.topSkills?.length > 0;
    const hasStreak = pkg.momentum?.currentStreak > 0;
    const hasMinutes = pkg.momentum?.weeklyActiveMinutes > 0;
    const hasMissions = pkg.missions?.completedThisWeek > 0 || pkg.missions?.activeMission;

    return !hasSkills && !hasStreak && !hasMinutes && !hasMissions;
}

function GrowthSkeleton() {
    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto animate-pulse">
                <div className="h-4 w-32 bg-[var(--skeleton-bg)] rounded mb-2" />
                <div className="h-8 w-48 bg-[var(--skeleton-bg)] rounded mb-10" />

                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-2xl p-6 mb-8">
                        <div className="h-6 w-40 bg-[var(--skeleton-bg)] rounded mb-4" />
                        <div className="h-4 w-full bg-[var(--skeleton-bg)] rounded mb-2" />
                        <div className="h-4 w-3/4 bg-[var(--skeleton-bg)] rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyGrowthState() {
    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <p className="text-sm text-[var(--text-muted)] mb-1">Week of {getCurrentWeekRange()}</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                        Your Learning Story
                    </h1>
                </header>

                {/* Empty State Card */}
                <div className="card-elite p-12 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="text-7xl mb-8 floating-animation">📖</div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4 uppercase tracking-tighter">
                        Your Story Begins
                    </h2>
                    <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-8 max-w-sm mx-auto">
                        Your professional learning narrative will formalize here after your first mission engagement.
                    </p>
                    <Link
                        href="/missions"
                        className="inline-flex items-center px-10 py-4 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-black uppercase tracking-widest shadow-lg hover:shadow-[var(--accent-primary)]/30 hover:scale-105 transition-all duration-300"
                    >
                        Initiate First Mission
                    </Link>
                </div>

                {/* Encouraging Preview */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-xl p-5 opacity-60">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                            <span>📚</span>
                            <span className="text-sm font-medium">What You'll See</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Skills you worked on and time invested in learning.
                        </p>
                    </div>
                    <div className="bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-xl p-5 opacity-60">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                            <span>🚀</span>
                            <span className="text-sm font-medium">Progress Tracked</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Missions completed and streaks maintained.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
