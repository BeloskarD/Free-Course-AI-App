'use client';

/**
 * MISSION DETAIL PAGE
 * ===================
 * Shows mission with current stage.
 * Stage types: learn, build, challenge, reflect
 * One primary action per stage.
 */

import { useMission, useStartMission, useUpdateMissionStage, useCompleteMission, useAbandonMission } from '../../lib/hooks';
import { useAuth } from '../../../context/AuthContext';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function MissionDetailPage() {
    const params = useParams();
    const missionId = params.id;
    const router = useRouter();
    const { token } = useAuth();

    const { data, isLoading, error, refetch } = useMission(missionId);
    const startMutation = useStartMission();
    const updateStageMutation = useUpdateMissionStage();
    const completeMutation = useCompleteMission();
    const abandonMutation = useAbandonMission();

    const [confirming, setConfirming] = useState(null);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-[var(--text-secondary)]">Please sign in to view this mission.</p>
            </div>
        );
    }

    if (isLoading) {
        return <MissionDetailSkeleton />;
    }

    if (error || !data?.success || !data?.data?.mission) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Mission Not Found</h1>
                    <Link href="/missions" className="text-[var(--accent-primary)]">
                        Browse Missions
                    </Link>
                </div>
            </div>
        );
    }

    const { mission, progress, hasStarted } = data.data;
    const currentStageNum = progress?.currentStage || 1;
    const currentStage = mission.stages?.find(s => s.stageId === currentStageNum);
    const totalStages = mission.stages?.length || 0;
    const progressPercent = hasStarted ? Math.round((progress?.progress || 0) * 100) : 0;
    const isCompleted = progress?.status === 'completed';

    // Start mission handler
    const handleStart = async () => {
        try {
            await startMutation.mutateAsync(missionId);
            refetch();
        } catch (e) {
            console.error('Failed to start mission:', e);
        }
    };

    // Complete stage handler
    const handleCompleteStage = async (score = 100) => {
        try {
            console.log('Completing stage:', currentStageNum);
            const result = await updateStageMutation.mutateAsync({
                missionId,
                stageData: {
                    stageId: currentStageNum,
                    score,
                    timeSpent: 5, // Placeholder
                    passed: true
                }
            });

            console.log('Stage update result:', result);

            if (!result?.success) {
                throw new Error(result?.error || 'Failed to update mission stage');
            }

            // Access the nested data from API response
            const { isLastStage, stagePassed } = result.data || result;

            // If this was the last stage, complete the mission
            if (isLastStage && stagePassed) {
                console.log('Last stage completed, finalizing mission...');
                await completeMutation.mutateAsync(missionId);
                router.push('/missions?completed=true');
            } else {
                console.log('Advancing to next stage...');
                refetch();
            }
        } catch (e) {
            console.error('Failed to complete stage:', e);
        }
    };

    // Abandon mission handler
    const handleAbandon = async (reason) => {
        try {
            await abandonMutation.mutateAsync({ missionId, reason });
            router.push('/missions');
        } catch (e) {
            console.error('Failed to abandon mission:', e);
        }
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">

                {/* Back Link */}
                <Link
                    href="/missions"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--site-text)]/[0.04] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--site-text)]/[0.08] transition-all duration-300 group mb-6"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Missions Hub</span>
                </Link>

                {/* Header */}
                <header className="mb-10 relative animate-in fade-in slide-in-from-top-6 duration-700">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 shadow-glow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">
                                Mission: {mission.skill}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--site-text)]/[0.04] border border-[var(--card-border)]">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--site-text-muted)]">
                                Status: <span className={isCompleted ? 'text-green-500' : 'text-indigo-500'}>{isCompleted ? 'Completed' : 'In Progress'}</span>

                            </span>
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-3 tracking-tight leading-tight">
                        {mission.title}
                    </h1>

                    {mission.description && (
                        <p className="text-base sm:text-lg text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl opacity-90 italic">
                            {mission.description}
                        </p>
                    )}

                    {/* Progress Bar - Elite Design */}
                    {hasStarted && !isCompleted && (
                        <div className="mt-8 p-4 sm:p-6 rounded-[2rem] bg-[var(--card-bg)] border-2 border-[var(--border-primary)] shadow-sm">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-[10px] sm:text-xs border border-indigo-500/20">
                                        {currentStageNum}
                                    </div>
                                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[var(--text-muted)]">
                                        Step {currentStageNum} <span className="opacity-40">of {totalStages}</span>

                                    </span>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-indigo-500 drop-shadow-glow-sm">
                                    {progressPercent}<span className="text-xs sm:text-sm opacity-40">%</span>
                                </span>
                            </div>
                            <div className="h-3 sm:h-4 bg-[var(--progress-bg)] rounded-full border border-[var(--border-primary)] p-0.5 sm:p-1 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-[length:200%_auto] animate-gradient-x rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </header>

                {/* Current Stage */}
                {!isCompleted && (
                    <>
                        {!hasStarted ? (
                            <NotStartedView
                                mission={mission}
                                onStart={handleStart}
                                isLoading={startMutation.isPending}
                            />
                        ) : currentStage ? (
                            <StageView
                                stage={currentStage}
                                stageNum={currentStageNum}
                                totalStages={totalStages}
                                onComplete={handleCompleteStage}
                                isLoading={updateStageMutation.isPending}
                            />
                        ) : (
                            <p className="text-[var(--text-secondary)]">No stage data available.</p>
                        )}
                    </>
                )}

                {/* Completed View */}
                {isCompleted && (
                    <CompletedView
                        mission={mission}
                        progress={progress}
                    />
                )}

                {/* Abandon Option */}
                {hasStarted && !isCompleted && (
                    <div className="mt-12 pt-8 border-t border-[var(--border-primary)] flex justify-center">
                        {confirming === 'abandon' ? (
                            <div className="flex items-center flex-wrap justify-center gap-3 p-4 rounded-2xl bg-red-500/[0.03] border border-red-500/10 scale-in-center">
                                <span className="text-[10px] font-black text-red-500/60 uppercase tracking-widest mr-2">ABORT MISSION?</span>
                                {['Too Hard', 'Not Interested', 'No Time', 'Other'].map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => handleAbandon(reason.toLowerCase())}
                                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 cursor-pointer"
                                    >
                                        {reason}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setConfirming(null)}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl text-[var(--text-muted)] hover:bg-[var(--site-text)]/5 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirming('abandon')}
                                className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] hover:text-red-500 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer"
                            >
                                [ CANCEL MISSION ]
                            </button>

                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function NotStartedView({ mission, onStart, isLoading }) {
    return (
        <div className="card-elite p-5 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-primary)]/5 rounded-full blur-3xl -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />

            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mb-6 sm:mb-8 uppercase tracking-tight flex items-center gap-3">
                <span className="w-1.5 h-6 bg-[var(--accent-primary)] rounded-full" />
                Mission Overview
            </h2>


            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
                {[
                    { label: 'Complexity', val: `${mission.stages?.length || 0} STEPS`, icon: '🧬' },
                    { label: 'Time Reqd', val: `${mission.estimatedTotalMinutes || 45} MIN`, icon: '⏱️' },
                    { label: 'Experience Gain', val: `+${mission.skillBoostOnCompletion || 10} XP`, icon: '🧠' }
                ].map((stat, i) => (

                    <div key={i} className={`p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/30 transition-all group/stat ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
                        <div className="text-lg sm:text-xl mb-1.5 sm:mb-2 group-hover/stat:scale-125 transition-transform">{stat.icon}</div>
                        <div className="text-[8px] sm:text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className="text-xs sm:text-sm font-black text-[var(--text-primary)]">{stat.val}</div>
                    </div>
                ))}
            </div>

            <button
                onClick={onStart}
                disabled={isLoading}
                className="w-full py-4 sm:py-6 rounded-xl sm:rounded-3xl bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-[length:200%_auto] text-white font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[10px] sm:text-xs
                    cursor-pointer btn-tactile shadow-2xl hover:shadow-[var(--accent-primary)]/40 hover:scale-[1.02] active:scale-95 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Starting...' : 'START LEARNING MISSION →'}
            </button>

        </div>
    );
}

function StageView({ stage, stageNum, totalStages, onComplete, isLoading }) {
    const stageIcons = {
        learn: '📡',
        build: '⚔️',
        challenge: '⚡',
        reflect: '🧠'
    };

    return (
        <div className="card-elite p-5 sm:p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Stage Header */}
            <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-10 border-b border-[var(--border-primary)]/10 pb-6 sm:pb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-2xl sm:text-3xl shadow-glow-sm animate-pulse-elite border border-indigo-500/20 shrink-0">
                    {stageIcons[stage.type] || '📝'}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <span className="text-[8px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Step {stageNum}</span>
                        <span className="w-1 h-1 bg-[var(--text-muted)] rounded-full opacity-40 shrink-0" />
                        <span className="text-[8px] sm:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] sm:tracking-[0.3em] truncate">{stage.type}</span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight truncate">
                        {stage.title}
                    </h2>
                </div>
            </div>

            {/* Content Bento */}
            <div className="grid gap-8 mb-10">
                {/* Description */}
                {stage.description && (
                    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-[var(--site-text)]/[0.02] border border-[var(--border-primary)]/50">
                        <p className="text-base sm:text-lg text-[var(--text-secondary)] font-medium leading-relaxed italic opacity-90">
                            &quot;{stage.description}&quot;
                        </p>
                    </div>
                )}

                {/* Objectives */}
                {stage.objectives?.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-left duration-700 delay-150">
                        <h3 className="text-[9px] sm:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4 sm:mb-6 px-1">WHAT YOU&apos;LL LEARN</h3>

                        <div className="grid gap-3 sm:gap-4">
                            {stage.objectives.map((obj, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--site-text)]/[0.02] border border-[var(--border-primary)] hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] transition-all duration-300 cursor-default group">
                                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-all duration-300">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full group-hover:bg-white" />
                                    </div>
                                    <span className="text-sm sm:text-base text-[var(--text-secondary)] font-semibold leading-relaxed group-hover:text-[var(--text-primary)] transition-colors">{obj}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Resources */}
                {stage.resources?.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-right duration-700 delay-300">
                        <h3 className="text-[9px] sm:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4 sm:mb-6 px-1">LEARNING RESOURCES</h3>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            {stage.resources.map((resource, i) => (
                                <a
                                    key={i}
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 sm:gap-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--site-text)]/[0.02] border-2 border-[var(--border-primary)]
                                        cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/[0.05] hover:shadow-glow-sm hover:scale-[1.01] transition-all duration-500 group"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[var(--site-text)]/[0.04] flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                                        {resource.type === 'video' ? '🎬' : resource.type === 'article' ? '📄' : '🔗'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[var(--text-primary)] font-black text-xs sm:text-sm truncate uppercase tracking-tight mb-1">{resource.title}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{resource.platform || 'External Resource'}</span>
                                            <span className="w-1 h-1 bg-[var(--text-muted)] rounded-full opacity-30" />
                                            <span className="text-[8px] sm:text-[9px] font-black text-indigo-500 uppercase tracking-widest">Verify Link</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-[var(--site-text)]/[0.04] flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-indigo-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0">
                                        <span className="text-sm">→</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Complete Button - High Impact */}
            <div className="pt-6 border-t border-[var(--border-primary)]/10">
                <button
                    onClick={() => onComplete(100)}
                    disabled={isLoading}
                    className="w-full py-4 sm:py-6 rounded-xl sm:rounded-3xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[10px] sm:text-xs
                        cursor-pointer btn-tactile shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {isLoading
                        ? 'SAVING DATA...'
                        : (
                            <div className="flex items-center justify-center gap-2 sm:gap-4">
                                <span>{stageNum === totalStages ? 'FINISH MISSION' : 'COMPLETE STEP & CONTINUE'}</span>
                                <span className="group-hover:translate-x-2 transition-transform">→</span>
                            </div>
                        )
                    }
                </button>
            </div>
        </div>
    );
}

function CompletedView({ mission, progress }) {
    return (
        <div className="bg-gradient-to-br from-green-500/[0.03] to-emerald-500/[0.03] border-2 border-green-500/20 rounded-[3rem] p-12 text-center shadow-elite relative overflow-hidden animate-in zoom-in-95 duration-700">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />

            <div className="relative z-10">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-5xl mb-8 mx-auto shadow-2xl shadow-green-500/30 animate-bounce">
                    🎉
                </div>

                <h2 className="text-4xl font-black text-[var(--text-primary)] mb-4 tracking-tight uppercase">
                    Mission Accomplished
                </h2>


                <p className="text-xl font-medium text-[var(--text-secondary)] mb-8 max-w-md mx-auto leading-relaxed">
                    Great work! You&apos;ve successfully completed this mission and earned <span className="text-green-500 font-black">+{progress?.pointsEarned || 10} XP</span> for your <span className="text-[var(--text-primary)] font-black uppercase tracking-widest">{mission.skill}</span> skill.
                </p>


                <div className="grid gap-3 sm:gap-4 max-w-lg mx-auto">
                    <Link
                        href="/growth"
                        className="flex-1 py-4 sm:py-5 rounded-xl sm:rounded-3xl bg-green-500 text-white font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px]
                            cursor-pointer btn-tactile shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                        Check My Progress →
                    </Link>
                    <Link
                        href="/missions"
                        className="flex-1 py-4 sm:py-5 rounded-xl sm:rounded-3xl bg-[var(--card-bg)] border-2 border-[var(--border-primary)] text-[var(--text-primary)] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[10px]
                            cursor-pointer btn-tactile hover:border-green-500/50 hover:bg-green-500/[0.03] transition-all duration-300"
                    >
                        Go to Mission Hub
                    </Link>

                </div>
            </div>
        </div>
    );
}

function MissionDetailSkeleton() {
    return (
        <div className="min-h-screen py-8 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto animate-pulse">
                <div className="h-4 w-24 bg-[var(--skeleton-bg)] rounded mb-6" />
                <div className="h-8 w-3/4 bg-[var(--skeleton-bg)] rounded mb-4" />
                <div className="h-4 w-full bg-[var(--skeleton-bg)] rounded mb-2" />
                <div className="h-2 bg-[var(--skeleton-bg)] rounded-full mb-8" />
                <div className="bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-2xl p-6">
                    <div className="h-6 w-1/2 bg-[var(--skeleton-bg)] rounded mb-4" />
                    <div className="h-4 w-full bg-[var(--skeleton-bg)] rounded mb-2" />
                    <div className="h-4 w-3/4 bg-[var(--skeleton-bg)] rounded mb-6" />
                    <div className="h-12 bg-[var(--skeleton-bg)] rounded-xl" />
                </div>
            </div>
        </div>
    );
}
