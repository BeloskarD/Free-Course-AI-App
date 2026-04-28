'use client';

/**
 * MISSIONS LIST PAGE
 * ==================
 * Shows active, recommended, and completed missions.
 * Only one active mission per skill (UI enforcement).
 */

import { useMissions, useRecommendedMissions, useStartMission, usePKGSummary } from '../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

function MissionsListContent() {
    const { token } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const showCompleted = searchParams.get('completed');

    const { data: missionsData, isLoading } = useMissions();
    const { data: recommendedData, isLoading: loadingRecommended } = useRecommendedMissions();
    const { data: pkgSummary } = usePKGSummary();
    const startMutation = useStartMission();

    const [showCompletedSection, setShowCompletedSection] = useState(showCompleted === 'true');

    if (!token) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="card-elite p-12 text-center max-w-md w-full relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                    <div className="text-6xl mb-6 scale-animation">🔐</div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 uppercase tracking-tighter font-black">Restricted Access</h2>
                    <p className="text-[var(--text-secondary)] mb-8 leading-relaxed font-medium">
                        Sign in to synchronize your high-performance learning missions and objective history.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center justify-center w-full py-4 rounded-xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-transparent text-white shadow-lg hover:shadow-[var(--accent-primary)]/20 hover:scale-[1.02] transition-all duration-300"
                    >
                        Authenticate Operative →
                    </Link>
                </div>
            </div>
        );
    }

    const activeMissionsRaw = missionsData?.data?.active || [];
    const completedMissions = missionsData?.data?.completed || [];
    const recommendations = recommendedData?.data || [];

    // Sort by most recently active
    const activeMissions = [...activeMissionsRaw].sort((a, b) => {
        const dateA = new Date(a.lastActivityAt || a.updatedAt || 0);
        const dateB = new Date(b.lastActivityAt || b.updatedAt || 0);
        return dateB - dateA;
    });

    // Get active skills to prevent starting duplicate skill missions
    const activeSkills = new Set(activeMissions.map(m => m.missionId?.skill?.toLowerCase()).filter(Boolean));

    const handleStartMission = async (missionId, skill) => {
        if (activeSkills.has(skill?.toLowerCase())) {
            alert(`You already have an active mission for ${skill}. Complete or abandon it first.`);
            return;
        }

        try {
            await startMutation.mutateAsync(missionId);
            router.push(`/missions/${missionId}`);
        } catch (e) {
            console.error('Failed to start mission:', e);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Elite Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[var(--bg-primary)]">
                <div className="absolute top-[2%] left-[10%] w-[45rem] h-[45rem] bg-[var(--accent-primary)]/5 rounded-full blur-[130px] animate-pulse-slow" />
                <div className="absolute bottom-[20%] right-[-5%] w-[35rem] h-[35rem] bg-[var(--accent-secondary)]/5 rounded-full blur-[110px] animate-pulse-slow delay-700" />
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header Section */}
                <header className="mb-8 sm:mb-14 relative animate-in fade-in slide-in-from-top-8 duration-700">
                    <div className="absolute -left-12 top-2 bottom-2 w-1.5 bg-gradient-to-b from-[var(--accent-primary)] to-transparent hidden lg:block rounded-full shadow-glow-sm" />
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[var(--text-primary)] tracking-tight mb-4 leading-tight">
                        My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] animate-gradient-x">Missions Hub</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="h-0.5 w-12 sm:w-16 bg-gradient-to-r from-[var(--accent-primary)] to-transparent rounded-full" />
                        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs">
                            Active Tasks & <span className="text-[var(--accent-secondary)]">Your Growth</span>
                        </p>
                    </div>
                </header>

                {/* Success Toast */}
                {showCompleted && (
                    <div className="mb-10 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/5 border-2 border-green-500/20 rounded-2xl shadow-glow-sm relative group overflow-hidden animate-in fade-in slide-in-from-top duration-700">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000">🎉</div>
                        <div className="flex items-center gap-5 mb-5 relative z-10">
                            <span className="text-5xl animate-bounce">🥇</span>
                            <div>
                                <h3 className="text-green-800 dark:text-green-300 font-black text-xl tracking-tight uppercase">
                                    Mission Accomplished
                                </h3>
                                <p className="text-green-700/80 dark:text-green-400/80 font-medium">
                                    Well done! Your mission goals have been met and recorded.
                                </p>

                            </div>
                        </div>
                        <Link
                            href="/growth"
                            className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-green-500 text-white font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all duration-300 relative z-10"
                        >
                            Check My Progress <span className="text-lg">📈</span>
                        </Link>

                    </div>
                )}

                {/* Full Empty State */}
                {!isLoading && !loadingRecommended && activeMissions.length === 0 && recommendations.length === 0 && completedMissions.length === 0 && (
                    <div className="card-elite p-12 text-center relative overflow-hidden group mb-12 sm:mb-16">
                        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                        <div className="text-8xl mb-8 floating-animation group-hover:rotate-12 transition-transform duration-500">🌌</div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4 uppercase tracking-tighter">
                            Ready for a New Mission?
                        </h2>
                        <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-10 max-w-sm mx-auto font-medium">
                            You don't have any active missions right now. Explore our courses to find something new to learn!
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href={`/courses${pkgSummary?.career?.targetRole ? `?q=${encodeURIComponent(pkgSummary.career.targetRole)}` : ''}`}
                                className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                            >
                                🗺️ Explore {pkgSummary?.career?.targetRole || 'Courses'}
                            </Link>
                            <Link
                                href="/ai-intelligence"
                                className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-[var(--card-bg)] border-2 border-[var(--border-primary)] text-[var(--text-secondary)] font-black uppercase tracking-widest hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all duration-300 shadow-sm"
                            >
                                🤖 Ask AI Companion
                            </Link>
                        </div>

                    </div>
                )}

                {/* Active Missions Section */}
                {(activeMissions.length > 0 || !isLoading) && (
                    <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-500/20 to-green-500/5" />
                            <h2 className="text-[10px] font-black text-green-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-glow-sm" />
                                Active Missions
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-green-500/20 to-green-500/5" />
                        </div>

                        {isLoading ? (
                            <MissionCardSkeleton count={2} />
                        ) : activeMissions.length === 0 ? (
                            <div className="grid grid-cols-1 gap-8">
                                {(() => {
                                    const displayMissions = recommendations.length > 0 
                                        ? recommendations.slice(0, 2) 
                                        : [
                                            { 
                                                title: "Advanced AI Architecture Systems", 
                                                skill: "AI Architecture", 
                                                estimatedTotalMinutes: 60,
                                                isDefault: true 
                                            },
                                            { 
                                                title: "Strategic Data Engineering Protocols", 
                                                skill: "Data Engineering", 
                                                estimatedTotalMinutes: 45,
                                                isDefault: true 
                                            }
                                        ];
                                    
                                    return displayMissions.map((mission, idx) => (
                                        <div 
                                            key={mission?._id || `suggestion-${idx}`}
                                            className="relative group p-[2px] rounded-[3rem] bg-gradient-to-br from-[var(--border-primary)] via-[var(--accent-primary)]/10 to-transparent hover:via-[var(--accent-primary)]/40 transition-all duration-700 overflow-hidden"
                                        >
                                            <div className="card-elite p-10 bg-[var(--card-bg)]/60 backdrop-blur-2xl rounded-[2.95rem] relative overflow-hidden h-full border-0">
                                                <div className="absolute -right-20 -top-20 w-80 h-80 bg-[var(--accent-primary)]/10 rounded-full blur-[100px] group-hover:bg-[var(--accent-primary)]/20 transition-all duration-1000" />
                                                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[var(--accent-secondary)]/10 rounded-full blur-[100px]" />
                                                
                                                <div className="absolute top-8 right-10 flex items-center gap-4">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-pulse shadow-glow-sm" />
                                                    <span className="px-5 py-2 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-black uppercase tracking-[0.3em] border border-[var(--accent-primary)]/20 shadow-glow-sm">
                                                        Strategic Recommendation
                                                    </span>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-10 relative z-10 pt-6">
                                                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] text-3xl font-black group-hover:scale-110 group-hover:rotate-[15deg] transition-all duration-700 shadow-2xl">
                                                        {mission.skill?.[0]?.toUpperCase() || 'S'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-4 mb-3">
                                                            <span className="px-4 py-1.5 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[11px] font-black uppercase tracking-widest border border-[var(--accent-primary)]/20 shadow-sm">
                                                                {mission.skill}
                                                            </span>
                                                            <div className="h-1 w-1 bg-[var(--text-muted)] rounded-full opacity-30" />
                                                            <span className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                                                {mission.estimatedTotalMinutes || 45} MINUTE MISSION
                                                            </span>
                                                        </div>
                                                        <h3 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors tracking-tighter leading-[1.1] mb-3">
                                                            {mission.title}
                                                        </h3>
                                                        <p className="text-[var(--text-secondary)] font-medium text-base sm:text-lg line-clamp-2 opacity-80 leading-relaxed italic">
                                                            A comprehensive goal designed to rapidly advance your professional expertise in {mission.skill}.
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const query = mission.skill || mission.title;
                                                            router.push(`/courses?q=${encodeURIComponent(query)}`);
                                                        }}
                                                        className="w-full sm:w-auto mt-6 sm:mt-0 px-12 py-5 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-[length:200%_auto] animate-gradient-half text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:shadow-[var(--accent-primary)]/40 hover:scale-105 active:scale-95 transition-all duration-500 btn-tactile"
                                                    >
                                                        Explore Content →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                        ) : (
                            <div className="space-y-4">
                                {activeMissions.map((item) => (
                                    <ActiveMissionCard
                                        key={item.missionId?._id || item._id}
                                        mission={item.missionId}
                                        progress={item}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Recommended Missions Section */}
                {!loadingRecommended && recommendations.length > 0 && (
                    <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/20 to-blue-500/5" />
                            <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                <span className="w-2 h-2 bg-blue-500 rounded-full shadow-glow-sm" />
                                New Recommendations
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-blue-500/20 to-blue-500/5" />
                        </div>
                        <div className="space-y-3">
                            {recommendations.map((mission) => (
                                <RecommendedMissionCard
                                    key={mission._id}
                                    mission={mission}
                                    onStart={() => router.push(`/courses?q=${encodeURIComponent(mission.skill || mission.title)}`)}
                                    isStarting={startMutation.isPending}
                                    alreadyActive={activeSkills.has(mission.skill?.toLowerCase())}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Completed Missions Section */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <div className="mb-10 sm:mb-16">
                        <div className="flex items-center justify-between mb-6 sm:mb-8 px-2">
                            <div className="flex items-center gap-4">
                                <div className="h-0.5 w-8 bg-[var(--accent-primary)]/40 rounded-full" />
                                <h2 className="text-[10px] sm:text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">MISSION HISTORY</h2>

                            </div>
                            {completedMissions.length > 0 && (
                                <button
                                    onClick={() => setShowCompletedSection(!showCompletedSection)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--card-bg-hover)] border border-[var(--border-primary)] text-[9px] sm:text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-300 shadow-sm cursor-pointer group/toggle"
                                >
                                    <span>{showCompletedSection ? 'OPEN MISSIONS' : `CLOSE MISSIONS (${completedMissions.length})`}</span>
                                    {showCompletedSection ? (
                                        <ChevronUp size={14} />
                                    ) : (
                                        <ChevronDown size={14} />
                                    )}
                                </button>
                            )}
                        </div>

                        {showCompletedSection && (
                            <div className="space-y-3">
                                {completedMissions.length === 0 ? (
                                    <div className="text-center py-8 text-[var(--text-muted)]">No completed missions yet</div>
                                ) : (
                                    completedMissions.map((item) => (
                                        <Link
                                            key={item.missionId?._id || item._id}
                                            href={`/missions/${item.missionId?._id || item._id}`}
                                            className="block"
                                        >
                                            <CompletedMissionCard
                                                mission={item.missionId}
                                                progress={item}
                                            />
                                        </Link>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default function MissionsListPage() {
    return (
        <Suspense fallback={null}>
            <MissionsListContent />
        </Suspense>
    );
}

// Sub-components as defined earlier...
function ActiveMissionCard({ mission, progress }) {
    const router = useRouter();
    if (!mission) return null;

    const progressPercent = Math.round((progress?.progress || 0) * 100);
    const currentStage = progress?.currentStage || 1;
    const totalStages = mission.stageCount || mission.stages?.length || 0;

    return (
        <div
            className="card-elite p-8 sm:p-10 cursor-pointer group relative overflow-hidden transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(var(--accent-rgb),0.25)] hover:scale-[1.02] active:scale-[0.98] border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 bg-[var(--card-bg)]/80 backdrop-blur-2xl rounded-[3rem] shadow-xl"
            onClick={() => router.push(`/missions/${mission._id}`)}
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000 blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[var(--accent-secondary)]/5 to-transparent rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-1000 blur-3xl opacity-30" />
            
            <div className="flex items-start justify-between gap-8 relative z-10">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-16 h-16 rounded-[1.75rem] bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] text-3xl font-black group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-700 shadow-2xl">
                            {mission.skill?.[0]?.toUpperCase() || 'M'}
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="w-fit px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-glow-sm">
                                {mission.skill}
                            </span>
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-60 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[var(--accent-primary)]/40 rounded-full animate-pulse" />
                                STEP {currentStage} <span className="opacity-40">OF {totalStages}</span>
                            </span>
                        </div>
                    </div>
                    <h3 className="text-2xl sm:text-5xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors tracking-tighter leading-[1.1] mb-4">
                        {mission.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] font-medium text-lg lg:text-xl line-clamp-1 opacity-80 italic max-w-xl">
                        Advancing through current objectives. System synchronization at {progressPercent}%.
                    </p>
                </div>
                <div className="text-right flex-shrink-0 pt-4">
                    <div className="relative inline-block">
                        <span className="text-4xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-[length:200%_auto] animate-gradient-x drop-shadow-glow-sm">
                            {progressPercent}
                        </span>
                        <span className="text-lg sm:text-2xl font-black text-[var(--text-muted)] align-top ml-1 opacity-40">%</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-10 relative">
                <div className="absolute -top-6 left-0 right-0 flex justify-between px-1">
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-40">PROGRESSION</span>
                    <span className="text-[9px] font-black text-[var(--accent-primary)] uppercase tracking-[0.2em]">{progressPercent}% COMPLETE</span>
                </div>
                <div className="w-full h-4 bg-[var(--card-bg-hover)] rounded-full overflow-hidden border border-[var(--border-primary)]/30 p-1 relative shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-[length:200%_auto] animate-gradient-x rounded-full transition-all duration-1500 ease-out shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]"
                        style={{ width: `${progressPercent}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full h-full -translate-x-full animate-shimmer" />
                </div>
            </div>
        </div>

    );
}

function RecommendedMissionCard({ mission, onStart, isStarting, alreadyActive }) {
    return (
        <div className="card-elite p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border-l-4 border-l-transparent hover:border-l-blue-500/50 transition-all duration-500 group hover:scale-[1.01] cursor-pointer">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shrink-0">
                    {mission.skill?.[0]?.toUpperCase() || 'R'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {mission.skill}
                        </span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-[var(--text-primary)] truncate transition-transform group-hover:translate-x-1 tracking-tight">
                        {mission.title}
                    </h3>
                </div>
            </div>
            {alreadyActive ? (
                <div className="w-full sm:w-auto text-center px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-[var(--card-bg-hover)] text-[var(--text-muted)] border border-[var(--border-primary)]">
                    ENGAGED
                </div>
            ) : (
                <button
                    onClick={onStart}
                    disabled={isStarting}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                    Explore Courses →
                </button>
            )}
        </div>
    );
}

function CompletedMissionCard({ mission, progress }) {
    if (!mission) return null;
    return (
        <div className="card-elite p-5 flex items-center gap-6 border border-[var(--border-primary)] bg-[var(--card-bg)]/50 opacity-80 hover:opacity-100 transition-all group cursor-pointer relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[var(--card-bg-hover)] border border-[var(--border-primary)] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                <Check size={20} strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <span className="px-2.5 py-1 rounded-lg text-[0.6rem] font-bold uppercase bg-[var(--border-primary)] text-[var(--text-muted)] group-hover:text-emerald-500 transition-all">
                        {mission.skill}
                    </span>
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors tracking-tight">
                    {mission.title}
                </h3>
            </div>
            <div className="text-right shrink-0">
                <span className="text-[10px] font-black text-emerald-500 uppercase">+{progress?.pointsEarned || 10} XP</span>
            </div>
        </div>
    );
}

function MissionCardSkeleton({ count = 1 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 animate-pulse">
                    <div className="flex items-start justify-between gap-6">
                        <div className="w-12 h-12 bg-[var(--card-bg-hover)] rounded-2xl" />
                        <div className="flex-1 space-y-3">
                            <div className="h-4 w-20 bg-[var(--card-bg-hover)] rounded" />
                            <div className="h-6 w-3/4 bg-[var(--card-bg-hover)] rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
