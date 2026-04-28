'use client';

/**
 * MISSION HOME PAGE (Evolution Hub)
 * ================================
 * Post-login landing page. Mission-first experience.
 * Answers: "What should I work on next?"
 */

import { useMissions, useRecommendedMissions, useStartMission } from '../lib/hooks';
import { useGuardian } from '../../context/GuardianContext';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { Rocket, History, LayoutDashboard, ArrowRight, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MissionHomePage() {
    const { token } = useAuth();
    const router = useRouter();

    // Fetch missions
    const { data: missionsData, isLoading: loadingMissions } = useMissions();
    const { data: recommendedData, isLoading: loadingRecommended } = useRecommendedMissions();
    const startMutation = useStartMission();

    // Guardian context
    const { intervention, dismissIntervention } = useGuardian();

    // Redirect if not logged in
    if (!token) {
        return (
            <div className="min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-[var(--accent-primary)]/10 rounded-full blur-[100px] animate-pulse" />
                <div className="card-elite p-12 text-center max-w-md w-full relative z-10 group">
                    <div className="text-7xl mb-8 floating-animation">⚡</div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] mb-4 tracking-tighter uppercase">
                        Zeeklect <span className="text-[var(--accent-primary)]">OS</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] mb-8 text-lg leading-relaxed">
                        Execute your high-performance learning missions and track your engineering velocity.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center justify-center w-full py-5 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        Initiate Access →
                    </Link>
                </div>
            </div>
        );
    }

    // Process data
    const activeMissionsRaw = missionsData?.data?.active || [];
    const recommendations = recommendedData?.data || [];
    
    // Sort by recency
    const activeMissionsSorted = [...activeMissionsRaw].sort((a, b) => {
        const dateA = new Date(a.lastActivityAt || a.updatedAt || 0);
        const dateB = new Date(b.lastActivityAt || b.updatedAt || 0);
        return dateB - dateA;
    });

    const primaryMission = activeMissionsSorted[0]?.missionId;
    const primaryProgress = activeMissionsSorted[0];

    const handleStartMission = async (missionId, skill) => {
        try {
            await startMutation.mutateAsync(missionId);
            router.push(`/missions/${missionId}`);
        } catch (e) {
            console.error('Failed to start mission:', e);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Immersive Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[var(--bg-primary)]">
                <div className="absolute top-[5%] left-[20%] w-[50rem] h-[50rem] bg-[var(--accent-primary)]/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[10%] right-[10%] w-[40rem] h-[40rem] bg-[var(--accent-secondary)]/5 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <header className="mb-10 sm:mb-14 text-center sm:text-left relative animate-in fade-in slide-in-from-top-8 duration-700">
                    <div className="absolute -left-12 top-2 bottom-2 w-1.5 bg-gradient-to-b from-[var(--accent-secondary)] to-transparent hidden lg:block rounded-full shadow-glow-sm" />
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[var(--text-primary)] tracking-tight mb-4 leading-tight">
                        My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] animate-gradient-x">Evolution Hub</span>
                    </h1>
                    <div className="flex items-center gap-4 justify-center sm:justify-start">
                        <div className="h-0.5 w-12 sm:w-16 bg-gradient-to-r from-[var(--accent-secondary)] to-transparent rounded-full" />
                        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs">
                            Your Learning Path & <span className="text-[var(--accent-primary)]">Personalized Goals</span>
                        </p>
                    </div>
                </header>

                {/* Guardian Intervention */}
                {intervention && intervention.priority >= 2 && (
                    <div className="mb-8 p-6 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">🛰️</div>
                        <div className="flex items-start gap-4 relative z-10">
                            <span className="text-3xl">{intervention.message?.emoji}</span>
                            <div className="flex-1">
                                <h3 className="font-black text-blue-600 dark:text-blue-400 uppercase text-xs tracking-widest mb-1">{intervention.message?.title}</h3>
                                <p className="text-blue-800/80 dark:text-blue-200/80 text-sm font-medium">{intervention.message?.body}</p>
                            </div>
                            <button onClick={dismissIntervention} className="text-blue-500/50 hover:text-blue-500 transition-colors px-2 font-black cursor-pointer">✕</button>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {primaryMission ? (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-6 px-2">
                                <h2 className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.3em]">Main Mission</h2>
                                <Link href="/missions" className="text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--accent-primary)] uppercase tracking-widest transition-colors flex items-center gap-1.5 group">
                                    Mission Hub <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            
                            <div 
                                className="card-elite p-8 sm:p-10 relative overflow-hidden group cursor-pointer border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 transition-all duration-500 hover:shadow-glow-sm rounded-[2.5rem]"
                                onClick={() => router.push(`/missions/${primaryMission._id}`)}
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] text-3xl font-black group-hover:rotate-6 transition-all shadow-xl">
                                            {primaryMission.skill?.[0]?.toUpperCase() || 'M'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--accent-primary)]/20">
                                                    {primaryMission.skill}
                                                </span>
                                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tight opacity-60">
                                                    Step {primaryProgress.currentStage || 1} of {primaryMission.stageCount || primaryMission.stages?.length || 0}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors leading-[1.1] tracking-tighter">
                                                {primaryMission.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-8 mb-10">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest opacity-70">Learning Progress</span>
                                                <span className="text-3xl font-black text-[var(--accent-primary)] drop-shadow-glow-sm">{Math.round((primaryProgress?.progress || 0) * 100)}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-[var(--progress-bg)] rounded-full overflow-hidden border border-[var(--border-primary)] p-0.5 relative">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-[length:200%_auto] animate-gradient-x rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
                                                    style={{ width: `${(primaryProgress?.progress || 0) * 100}%` }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-full h-full -translate-x-full animate-shimmer" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5 p-4 bg-[var(--card-bg-hover)]/30 rounded-2xl border border-[var(--border-primary)]">
                                            <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-secondary)]/30 flex items-center justify-center text-xl font-black text-[var(--accent-secondary)] bg-[var(--accent-secondary)]/5">
                                                {primaryProgress.currentStage || 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Current Step</p>
                                                <p className="text-sm font-bold text-[var(--text-primary)] truncate italic">{primaryMission.stages?.[(primaryProgress?.currentStage || 1) - 1]?.title || 'Loading next step...'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/missions/${primaryMission._id}`);
                                        }}
                                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:shadow-[var(--accent-primary)]/40 hover:scale-[1.02] active:scale-95 transition-all duration-500 flex items-center justify-center gap-3 btn-tactile"
                                    >
                                        Continue Learning <Rocket size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Suggestions Section - Now always visible alongside active mission if missions exist */}
                    <div className="mt-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-[var(--accent-primary)]/5" />
                            <h2 className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.4em] flex items-center gap-3">
                                <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse shadow-glow-sm" />
                                Recommended for You
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--accent-primary)]/20 to-[var(--accent-primary)]/5" />
                        </div>

                        {loadingMissions ? (
                            <MissionCardSkeleton />
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {(() => {
                                    const displayMissions = recommendations.length > 0 
                                        ? recommendations.slice(0, 2) 
                                        : [
                                            { 
                                                title: "Quantum Strategy & Neural Deployment", 
                                                skill: "AI Architecture", 
                                                estimatedTotalMinutes: 60
                                            },
                                            { 
                                                title: "High-Performance Data Synthesis", 
                                                skill: "Data Engineering", 
                                                estimatedTotalMinutes: 45
                                            }
                                        ];
                                    
                                    return displayMissions.map((mission, idx) => (
                                        <div 
                                            key={mission?._id || `ev-suggestion-${idx}`}
                                            className="relative group p-[1px] rounded-[2.5rem] bg-gradient-to-br from-[var(--border-primary)] to-transparent hover:from-[var(--accent-primary)]/30 transition-all duration-700 overflow-hidden"
                                        >
                                            <div className="card-elite p-8 bg-[var(--card-bg)]/40 backdrop-blur-2xl rounded-[2.45rem] overflow-hidden">
                                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-[80px]" />
                                                
                                                <div className="absolute top-6 right-8">
                                                    <span className="px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[9px] font-black uppercase tracking-[0.2em] border border-[var(--accent-primary)]/20 shadow-glow-sm">
                                                        Suggestion
                                                    </span>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 relative z-10 pt-4">
                                                    <div className="w-16 h-16 rounded-[1.75rem] bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] text-2xl font-black group-hover:scale-110 transition-all shadow-xl">
                                                        {mission.skill?.[0]?.toUpperCase() || 'S'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="px-3 py-1 rounded-lg bg-[var(--card-bg-hover)] text-[var(--accent-primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--border-primary)]">
                                                                {mission.skill}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors tracking-tighter leading-tight mb-2">
                                                            {mission.title}
                                                        </h3>
                                                        <p className="text-[var(--text-secondary)] font-medium text-sm line-clamp-1 opacity-70">
                                                            Start this goal to advance your skills.
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const query = mission.skill || mission.title;
                                                            router.push(`/courses?q=${encodeURIComponent(query)}`);
                                                        }}
                                                        className="w-full sm:w-auto mt-4 sm:mt-0 px-10 py-4 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all btn-tactile"
                                                    >
                                                        Explore Courses →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                </section>


                {/* Tactical Actions Grid */}
                <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <Link
                        href="/missions"
                        className="flex-1 h-20 rounded-[2rem] bg-[var(--card-bg)] border-2 border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.02] shadow-sm hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 group font-black uppercase tracking-widest text-[10px]"
                    >
                        <span>Mission Hub</span>
                        <History size={18} className="group-hover:rotate-12 transition-transform opacity-60" />
                    </Link>
                    <Link
                        href="/growth"
                        className="flex-1 h-20 rounded-[2rem] bg-[var(--card-bg)] border-2 border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-secondary)] hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/[0.02] shadow-sm hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 group font-black uppercase tracking-widest text-[10px]"
                    >
                        <span>Growth Hub</span>
                        <LayoutDashboard size={18} className="group-hover:rotate-12 transition-transform opacity-60" />
                    </Link>
                </div>

                {/* Sync Note */}
                <div className="mt-20 p-8 rounded-[2.5rem] bg-gradient-to-br from-[var(--card-bg)] to-transparent border border-[var(--border-primary)] relative overflow-hidden text-center opacity-60 hover:opacity-100 transition-opacity duration-700">
                    <Zap className="mx-auto mb-4 text-[var(--accent-primary)] opacity-40" size={32} />
                    <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Sync Information</p>
                    <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed max-w-sm mx-auto">
                        Your Evolution Hub is consistently updated with your progress. All missions, active steps, and learning history are reflected here in real-time.
                    </p>
                </div>

            </div>
        </div>
    );
}

function MissionCardSkeleton() {
    return (
        <div className="bg-[var(--card-bg)]/40 border border-[var(--border-primary)] rounded-[2.5rem] p-8 animate-pulse">
            <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-[var(--card-bg-hover)] rounded-2xl" />
                <div className="flex-1 space-y-3">
                    <div className="h-4 w-20 bg-[var(--card-bg-hover)] rounded" />
                    <div className="h-8 w-3/4 bg-[var(--card-bg-hover)] rounded" />
                </div>
            </div>
            <div className="h-12 w-full bg-[var(--card-bg-hover)] rounded-2xl" />
        </div>
    );
}
