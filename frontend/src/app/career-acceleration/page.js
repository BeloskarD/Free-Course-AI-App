"use client";
import { useAuth } from "../../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import Surface from "../../components/ui/Surface.jsx";
import Breadcrumb from "../../components/ui/Breadcrumb";
import {
    Rocket, TrendingUp, Brain, Zap, Shield, Target, Sparkles, Activity,
    ArrowUpRight, AlertTriangle, ChevronRight, RefreshCw, Award, Eye,
    Flame, BarChart3, Cpu, Globe, Users, Send, Network, Building2,
    Lock, Unlock, MessageSquare, Briefcase, X, Copy, Check, Loader2
} from "lucide-react";
import { useState, useCallback } from "react";
import Link from "next/link";
import Skeleton, { StatsSkeleton } from "../../components/ui/Skeleton";

// ── Metric Card ──
function MetricCard({ icon: Icon, label, value, sub, color, trend }) {
    return (
        <Surface className="p-4 sm:p-5 md:p-6 group hover:border-[var(--card-hover-border)] transition-all duration-500 hover:shadow-[var(--shadow-elite-hover)] hover:-translate-y-1">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center ${color} transition-transform duration-500 group-hover:scale-110`}>
                    <Icon size={20} strokeWidth={2} className="text-white" />
                </div>
                {trend && (
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : trend === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {sub}
                    </span>
                )}
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[var(--site-text)] tracking-tight leading-none">{value}</p>
            <p className="text-[10px] sm:text-xs font-bold text-[var(--site-text-muted)] uppercase tracking-widest mt-2 opacity-60">{label}</p>
        </Surface>
    );
}

// ── Skill Node (for mini graph) ──
function SkillNode({ name, mastery, entropy }) {
    const masteryPct = Math.round((mastery || 0) * 100);
    const entropyClr = entropy > 0.7 ? 'text-red-500' : entropy > 0.4 ? 'text-amber-500' : 'text-emerald-500';
    const ringClr = entropy > 0.7 ? 'border-red-500/30' : entropy > 0.4 ? 'border-amber-500/30' : 'border-emerald-500/30';

    return (
        <div className={`flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-[var(--card-bg)] border-2 ${ringClr} transition-all duration-300 hover:scale-[1.03]`}>
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--card-border)" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${masteryPct}, 100`} className={entropyClr} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[var(--site-text)]">{masteryPct}%</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-black text-[var(--site-text)] truncate capitalize" title={name}>{name}</p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${entropyClr}`}>
                    {entropy > 0.7 ? 'Fading' : entropy > 0.4 ? 'Stable' : 'Strong'}
                </p>
            </div>
        </div>
    );
}

// ── Opportunity Mini Card ──
function OpportunityMini({ opportunity }) {
    const match = Math.round((opportunity.matchScore || 0) * 100);
    const srcIcons = { github_trending: Cpu, hiring_signal: Target, research_trend: Brain, creator_ecosystem: Globe, industry_report: BarChart3 };
    const SrcIcon = srcIcons[opportunity.signal?.source] || Zap;

    return (
        <div className="flex items-center gap-3 sm:gap-4 px-3 py-3 sm:px-4 sm:py-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--card-hover-border)] transition-all duration-300 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600/10 to-blue-600/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <SrcIcon size={18} className="text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-black text-[var(--site-text)] truncate">{opportunity.signal?.title || 'Opportunity'}</p>
                <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] truncate">{(opportunity.signal?.skillTags || []).slice(0, 3).join(' · ')}</p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-sm sm:text-base font-black text-[var(--accent-primary)]">{match}%</p>
                <p className="text-[8px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Match</p>
            </div>
        </div>
    );
}

// ── Intervention Banner ──
function InterventionBanner({ intervention }) {
    const colors = {
        critical: 'from-red-600/10 to-red-600/5 border-red-500/20 text-red-500',
        warning: 'from-amber-600/10 to-amber-600/5 border-amber-500/20 text-amber-500',
        info: 'from-blue-600/10 to-blue-600/5 border-blue-500/20 text-blue-500'
    };
    const c = colors[intervention.severity] || colors.info;

    return (
        <div className={`px-4 py-3 sm:px-5 sm:py-4 rounded-2xl bg-gradient-to-r ${c} border flex items-center gap-3 sm:gap-4`}>
            <AlertTriangle size={18} className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-black truncate">{intervention.title}</p>
                <p className="text-[10px] sm:text-xs font-bold opacity-70 line-clamp-1">{intervention.message}</p>
            </div>
        </div>
    );
}

// ── Proof Mini Card ──
function ProofMini({ proof }) {
    const typeIcons = { mastery_achieved: Award, mission_completion: Target, streak_milestone: Flame, skill_badge: Shield, project_showcase: Sparkles };
    const PIcon = typeIcons[proof.proofType] || Award;

    return (
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--card-hover-border)] transition-all duration-300">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center flex-shrink-0">
                <PIcon size={16} className="text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-black text-[var(--site-text)] truncate">{proof.title}</p>
                <p className="text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">{proof.proofType?.replace(/_/g, ' ')}</p>
            </div>
            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${proof.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {proof.status}
            </span>
        </div>
    );
}

// ── Career Navigation Insight Card ──
function CareerNavigationInsight({ insight, token, user }) {
    const [showOutreach, setShowOutreach] = useState(false);
    const [generatingOutreach, setGeneratingOutreach] = useState(false);
    const [outreachMessages, setOutreachMessages] = useState(null);
    const [copiedIdx, setCopiedIdx] = useState(-1);

    const careerInsight = insight?.careerInsight;
    const activated = insight?.activated;
    const readiness = insight?.readiness || 0;

    const handleGenerateOutreach = useCallback(async () => {
        if (!careerInsight?.outreachReady || !careerInsight?.warmPath) return;
        setGeneratingOutreach(true);
        try {
            const res = await api.generateOutreach({
                connectionName: careerInsight.warmPath.name,
                connectionRole: careerInsight.warmPath.role,
                connectionCompany: careerInsight.warmPath.company,
                cluster: careerInsight.cluster,
                roleTarget: careerInsight.cluster + ' Engineer',
                microProject: careerInsight.microProject?.title
            }, token);
            if (res.success) {
                setOutreachMessages(res.data);
                setShowOutreach(true);
            }
        } catch (e) { console.error(e); }
        setGeneratingOutreach(false);
    }, [careerInsight, token]);

    const handleCopy = useCallback((text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(-1), 2000);
    }, []);

    // Readiness color
    const readinessColor = readiness >= 80 ? 'text-emerald-500' : readiness >= 60 ? 'text-blue-500' : readiness >= 40 ? 'text-amber-500' : 'text-red-400';
    const readinessBg = readiness >= 80 ? 'from-emerald-500/10 to-teal-500/10' : readiness >= 60 ? 'from-blue-500/10 to-indigo-500/10' : readiness >= 40 ? 'from-amber-500/10 to-orange-500/10' : 'from-red-500/10 to-rose-500/10';
    const readinessRing = readiness >= 80 ? 'ring-emerald-500/20' : readiness >= 60 ? 'ring-blue-500/20' : readiness >= 40 ? 'ring-amber-500/20' : 'ring-red-500/20';

    // Not activated — show soft prompt
    if (!activated) {
        return (
            <Surface className="p-5 sm:p-6 md:p-8 relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-40 h-40 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-[60px]" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5 sm:mb-6">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-600/10 to-blue-600/10 flex items-center justify-center">
                            <Network size={18} className="text-cyan-500" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-[var(--site-text)]">Career Navigation</h2>
                            <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Network intelligence</p>
                        </div>
                    </div>
                    <div className="text-center py-6 sm:py-8">
                        <Lock size={28} className="mx-auto text-[var(--site-text-muted)] opacity-30 mb-3" />
                        <p className="text-xs sm:text-sm font-bold text-[var(--site-text-muted)] max-w-xs mx-auto leading-relaxed">
                            {insight?.reason || 'Build momentum to unlock career navigation insights.'}
                        </p>
                        <div className="mt-4 flex justify-center">
                            <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${readinessBg} ring-1 ${readinessRing}`}>
                                <span className={`text-xl sm:text-2xl font-black ${readinessColor}`}>{readiness}%</span>
                                <span className="text-[8px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider ml-2">Readiness</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Surface>
        );
    }

    // No career insight data yet
    if (!careerInsight) {
        return (
            <Surface className="p-5 sm:p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-600/10 to-blue-600/10 flex items-center justify-center">
                        <Network size={18} className="text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-[var(--site-text)]">Career Navigation</h2>
                        <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">No insight available</p>
                    </div>
                </div>
                <div className="text-center py-6 sm:py-8">
                    <Globe size={28} className="mx-auto text-[var(--site-text-muted)] opacity-30 mb-3" />
                    <p className="text-xs font-bold text-[var(--site-text-muted)] opacity-60">Run the Opportunity Scanner to generate career insights.</p>
                </div>
            </Surface>
        );
    }

    return (
        <>
            <Surface className="p-5 sm:p-6 md:p-8 relative overflow-hidden group">
                <div className="absolute -right-24 -top-24 w-56 h-56 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 rounded-full blur-[80px] group-hover:from-cyan-500/10 group-hover:to-blue-600/10 transition-all duration-1000" />
                <div className="absolute -left-16 -bottom-16 w-40 h-40 bg-gradient-to-br from-indigo-600/3 to-purple-600/3 rounded-full blur-[60px]" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-600/20 group-hover:scale-110 transition-transform duration-500">
                                <Network size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-[var(--site-text)]">Career Navigation</h2>
                                <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Contextual intelligence</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl bg-gradient-to-r ${readinessBg} ring-1 ${readinessRing}`}>
                            <span className={`text-lg sm:text-xl font-black ${readinessColor}`}>{readiness}%</span>
                            <span className="text-[7px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider ml-1">Ready</span>
                        </div>
                    </div>

                    {/* Cluster + Hiring + Network Score Row */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                        <div className="text-center px-2 py-2.5 sm:px-3 sm:py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                            <Briefcase size={14} className="mx-auto text-cyan-500 mb-1" />
                            <p className="text-lg sm:text-xl font-black text-[var(--site-text)]">{careerInsight.startupsHiring}</p>
                            <p className="text-[7px] sm:text-[8px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Hiring</p>
                        </div>
                        <div className="text-center px-2 py-2.5 sm:px-3 sm:py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                            <Users size={14} className="mx-auto text-indigo-500 mb-1" />
                            <p className="text-lg sm:text-xl font-black text-[var(--site-text)]">{careerInsight.totalWarmPaths || 0}</p>
                            <p className="text-[7px] sm:text-[8px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Warm Paths</p>
                        </div>
                        <div className="text-center px-2 py-2.5 sm:px-3 sm:py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                            <TrendingUp size={14} className="mx-auto text-emerald-500 mb-1" />
                            <p className="text-lg sm:text-xl font-black text-[var(--site-text)]">{Math.round((careerInsight.networkScore || 0) * 100)}%</p>
                            <p className="text-[7px] sm:text-[8px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Net Score</p>
                        </div>
                    </div>

                    {/* Cluster Tag */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.3em] bg-cyan-500/10 px-2.5 py-1 rounded-lg">
                            {careerInsight.cluster}
                        </span>
                        {careerInsight.opportunity && (
                            <span className="text-[8px] font-black text-[var(--site-text-muted)] uppercase tracking-wider opacity-50">
                                {careerInsight.opportunity.matchScore}% match
                            </span>
                        )}
                    </div>

                    {/* Warm Connection Highlight */}
                    {careerInsight.warmPath ? (
                        <div className="px-3 py-3 sm:px-4 sm:py-4 rounded-2xl bg-gradient-to-r from-indigo-600/5 to-blue-600/5 border border-indigo-500/10 mb-4 sm:mb-5 group/warm">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600/15 to-blue-600/15 flex items-center justify-center flex-shrink-0 group-hover/warm:scale-110 transition-transform">
                                    <Users size={16} className="text-indigo-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-black text-[var(--site-text)] truncate">{careerInsight.warmPath.name}</p>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] truncate">
                                        {careerInsight.warmPath.role} · {careerInsight.warmPath.company}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="inline-flex items-center gap-1 text-[8px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg">
                                        {careerInsight.warmPath.connectionDegree === 1 ? '1st' : careerInsight.warmPath.connectionDegree === 2 ? '2nd' : '3rd'} degree
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="px-3 py-3 sm:px-4 sm:py-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] mb-4 sm:mb-5 text-center">
                            <p className="text-[10px] font-bold text-[var(--site-text-muted)] opacity-50">No warm connections found for this opportunity.</p>
                        </div>
                    )}

                    {/* Micro-Project Block */}
                    <div className={`px-3 py-3 sm:px-4 sm:py-4 rounded-2xl border mb-4 sm:mb-5 ${careerInsight.microProject?.completed
                            ? 'bg-emerald-500/5 border-emerald-500/15'
                            : 'bg-amber-500/5 border-amber-500/15'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${careerInsight.microProject?.completed
                                    ? 'bg-emerald-500/15'
                                    : 'bg-amber-500/15'
                                }`}>
                                {careerInsight.microProject?.completed
                                    ? <Check size={14} className="text-emerald-500" />
                                    : <Target size={14} className="text-amber-500" />
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] sm:text-xs font-black text-[var(--site-text)] truncate">
                                    {careerInsight.microProject?.title || 'Complete a micro-project'}
                                </p>
                                <p className="text-[8px] sm:text-[9px] font-bold text-[var(--site-text-muted)]">
                                    {careerInsight.microProject?.completed ? '✅ Completed' : '⚡ Required before outreach'}
                                </p>
                            </div>
                            {careerInsight.microProject?.skills?.length > 0 && (
                                <div className="hidden sm:flex gap-1 flex-shrink-0">
                                    {careerInsight.microProject.skills.slice(0, 2).map((sk, i) => (
                                        <span key={i} className="text-[7px] font-bold text-[var(--site-text-muted)] bg-[var(--card-bg)] px-1.5 py-0.5 rounded capitalize">
                                            {sk}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Next Action + Outreach Button */}
                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
                        <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] flex-1 leading-relaxed">
                            {careerInsight.requiredNextAction}
                        </p>
                        <button
                            onClick={handleGenerateOutreach}
                            disabled={!careerInsight.outreachReady || generatingOutreach}
                            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex-shrink-0 cursor-pointer ${careerInsight.outreachReady && !generatingOutreach
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20 hover:shadow-xl hover:shadow-cyan-600/30 hover:scale-[1.03] active:scale-95'
                                    : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--site-text-muted)] opacity-50 cursor-not-allowed'
                                }`}
                        >
                            {generatingOutreach ? (
                                <><Loader2 size={13} className="animate-spin" /> Generating...</>
                            ) : careerInsight.outreachReady ? (
                                <><Send size={13} /> Generate Outreach</>
                            ) : (
                                <><Lock size={13} /> Outreach Locked</>
                            )}
                        </button>
                    </div>
                </div>
            </Surface>

            {/* ── Outreach Modal ── */}
            {showOutreach && outreachMessages && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowOutreach(false)}>
                    <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[var(--card-bg)] border-2 border-[var(--card-border)] rounded-[2rem] p-5 sm:p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                                    <MessageSquare size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-[var(--site-text)]">Outreach Messages</h3>
                                    <p className="text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">
                                        via {outreachMessages.provider?.replace(/-/g, ' ') || 'AI'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowOutreach(false)} className="w-9 h-9 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center hover:border-red-500/30 transition-colors cursor-pointer">
                                <X size={16} className="text-[var(--site-text-muted)]" />
                            </button>
                        </div>

                        {/* Strategy */}
                        {outreachMessages.strategy && (
                            <div className="px-4 py-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 mb-5">
                                <p className="text-[10px] sm:text-xs font-bold text-cyan-600">
                                    💡 {outreachMessages.strategy}
                                </p>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="space-y-4">
                            {(outreachMessages.messages || []).map((msg, idx) => {
                                const typeLabels = { initial_connection: 'Initial Connection', follow_up: 'Follow-Up', technical_question: 'Technical Question' };
                                const typeColors = { initial_connection: 'from-cyan-600 to-blue-600', follow_up: 'from-indigo-600 to-purple-600', technical_question: 'from-emerald-600 to-teal-600' };

                                return (
                                    <div key={idx} className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--card-border)]">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${typeColors[msg.type] || typeColors.initial_connection}`} />
                                                <span className="text-[9px] font-black text-[var(--site-text)] uppercase tracking-wider">
                                                    {typeLabels[msg.type] || msg.type}
                                                </span>
                                                {msg.tone && (
                                                    <span className="text-[7px] font-bold text-[var(--site-text-muted)] bg-[var(--site-bg)] px-1.5 py-0.5 rounded">
                                                        {msg.tone.replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleCopy(msg.body, idx)}
                                                className="flex items-center gap-1 text-[8px] font-black text-[var(--accent-primary)] uppercase tracking-wider hover:opacity-70 transition-opacity cursor-pointer"
                                            >
                                                {copiedIdx === idx ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                                            </button>
                                        </div>
                                        {msg.subject && (
                                            <div className="px-4 py-2 border-b border-[var(--card-border)]/50">
                                                <p className="text-[10px] font-bold text-[var(--site-text-muted)]">
                                                    <span className="opacity-50">Subject:</span> {msg.subject}
                                                </p>
                                            </div>
                                        )}
                                        <div className="px-4 py-3">
                                            <p className="text-xs sm:text-sm text-[var(--site-text)] leading-relaxed whitespace-pre-wrap">
                                                {msg.body}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════
export default function CareerAccelerationPage() {
    const { token, user } = useAuth();
    const queryClient = useQueryClient();
    const [recalibrating, setRecalibrating] = useState(false);

    // ── Data Fetching ──
    const { data: overviewRes, isLoading, error } = useQuery({
        queryKey: ["career-overview", user?.id],
        queryFn: () => api.getCareerOverview(token),
        enabled: !!token && !!user,
        staleTime: 1000 * 60 * 5,
        refetchOnMount: "always",
    });

    const { data: interventionsRes } = useQuery({
        queryKey: ["interventions", user?.id],
        queryFn: () => api.getInterventions(token),
        enabled: !!token && !!user,
        staleTime: 1000 * 60 * 3,
    });

    // ── Network Intelligence ──
    const { data: insightRes } = useQuery({
        queryKey: ["career-insight", user?.id],
        queryFn: () => api.getNetworkInsight(token),
        enabled: !!token && !!user,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });

    const overview = overviewRes?.data;
    const interventions = interventionsRes?.data || [];
    const networkInsight = insightRes?.data || null;

    // ── Recalibrate ──
    const handleRecalibrate = async () => {
        setRecalibrating(true);
        try {
            await api.recalibrateEngines(token);
            queryClient.invalidateQueries(["career-overview"]);
            queryClient.invalidateQueries(["interventions"]);
            queryClient.invalidateQueries(["career-insight"]);
        } catch (e) { console.error(e); }
        setRecalibrating(false);
    };

    // ── Loading ──
    if (isLoading) {
        return (
            <div className="container mx-auto px-6 py-16 max-w-7xl animate-in fade-in duration-700">
                <Breadcrumb currentPage="Career Engine" currentIcon={Rocket} />
                
                {/* Hero Skeleton */}
                <div className="mt-8 mb-16">
                    <Skeleton className="h-[400px] w-full rounded-[3.5rem]" />
                </div>

                {/* Metrics Grid Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatsSkeleton />
                    <StatsSkeleton />
                    <StatsSkeleton />
                    <StatsSkeleton />
                </div>

                {/* Main Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[500px] w-full rounded-[3rem]" />
                    <Skeleton className="h-[500px] w-full rounded-[3rem]" />
                </div>
            </div>
        );
    }

    // ── Error / Not signed in ──
    if (error || !token) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] pb-16">
                <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-7xl">
                    <Breadcrumb currentPage="Career Engine" currentIcon={Rocket} />
                </div>
                <div className="flex items-center justify-center px-4 sm:px-6">
                    <div className="max-w-4xl w-full text-center animate-in fade-in zoom-in duration-1000">
                        <div className="relative w-36 h-36 sm:w-48 sm:h-48 mx-auto mb-8 sm:mb-12">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-[3rem] blur-3xl" />
                            <div className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl">
                                <Rocket size={60} className="text-indigo-500/50" strokeWidth={1} />
                            </div>
                        </div>
                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-[var(--site-text)] tracking-tighter mb-4 sm:mb-6 leading-[0.9]">
                            Sign In <span className="text-indigo-600">Required</span>
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl font-bold text-[var(--site-text-muted)] max-w-2xl mx-auto opacity-70 mb-8 sm:mb-12">
                            Sign in to access your AI Career Acceleration Engine.
                        </p>
                        <button onClick={() => (window.location.href = "/auth/login")} className="px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.4em] transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-indigo-600/20 btn-tactile">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const reinforcement = overview?.reinforcement || {};
    const graph = overview?.graph || {};
    const opportunities = overview?.opportunities || [];
    const recentProofs = overview?.recentProofs || [];

    return (
        <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300 pb-16">
            <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-7xl">
                {/* BREADCRUMB */}
                <Breadcrumb currentPage="Career Engine" currentIcon={Rocket} />

                {/* ── HERO ── */}
                <div className="relative mb-10 sm:mb-16 overflow-hidden rounded-[2rem] sm:rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-6 sm:p-10 md:p-16 shadow-[var(--shadow-elite)] group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="absolute -right-32 -top-32 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-elite" />
                    <div className="absolute -left-32 -bottom-32 w-64 sm:w-96 h-64 sm:h-96 bg-purple-600/5 rounded-full blur-[100px]" />

                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-10">
                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 ring-4 ring-white/10">
                                <Rocket size={28} className="sm:hidden" strokeWidth={2.5} />
                                <Rocket size={40} className="hidden sm:block" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-[var(--site-text)] leading-[1.1]">
                                    Career <span className="text-gradient-elite">Acceleration</span>
                                </h1>
                                <p className="text-indigo-600 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.4em] flex items-center gap-2 sm:gap-3 mt-2 sm:mt-4">
                                    <Sparkles size={14} className="animate-pulse" /> AI That Builds Your Future With You
                                </p>
                            </div>
                            <button onClick={handleRecalibrate} disabled={recalibrating} className={`self-start sm:self-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--site-text)] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] transition-all hover:border-[var(--accent-primary)]/30 btn-tactile flex items-center gap-2 ${recalibrating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <RefreshCw size={14} className={recalibrating ? 'animate-spin' : ''} />
                                <span className="hidden xs:inline">{recalibrating ? 'Calibrating...' : 'Recalibrate'}</span>
                            </button>
                        </div>
                        <p className="text-sm sm:text-lg md:text-xl text-[var(--site-text-muted)] max-w-4xl font-bold leading-relaxed opacity-80">
                            Your personal career intelligence hub — skill graph, opportunity radar, adaptive challenges, and achievement proofs, all powered by AI.
                        </p>
                    </div>
                </div>

                {/* ── INTERVENTIONS ── */}
                {interventions.length > 0 && (
                    <div className="mb-8 sm:mb-12 space-y-3">
                        {interventions.slice(0, 2).map((iv, i) => (
                            <InterventionBanner key={iv.id || i} intervention={iv} />
                        ))}
                    </div>
                )}

                {/* ── METRICS ROW ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
                    <MetricCard
                        icon={Activity} label="Momentum" color="bg-gradient-to-br from-emerald-500 to-teal-600"
                        value={Math.round((reinforcement.momentum?.score || 0) * 100) + '%'}
                        sub={reinforcement.velocity?.trend || 'stable'} trend={reinforcement.velocity?.trend === 'accelerating' ? 'up' : reinforcement.velocity?.trend === 'slowing' ? 'down' : 'neutral'}
                    />
                    <MetricCard
                        icon={Zap} label="Velocity" color="bg-gradient-to-br from-blue-500 to-indigo-600"
                        value={(reinforcement.velocity?.average || 0).toFixed(2)}
                        sub={reinforcement.velocity?.trend || ''} trend={reinforcement.velocity?.average > 0 ? 'up' : 'neutral'}
                    />
                    <MetricCard
                        icon={Brain} label="High Entropy" color="bg-gradient-to-br from-amber-500 to-orange-600"
                        value={`${reinforcement.entropy?.highEntropyCount || 0} / ${reinforcement.entropy?.totalSkills || 0}`}
                        sub="Skills fading" trend={(reinforcement.entropy?.highEntropyCount || 0) > 2 ? 'down' : 'neutral'}
                    />
                    <MetricCard
                        icon={Shield} label="Burnout" color={`bg-gradient-to-br ${reinforcement.burnout?.level === 'critical' ? 'from-red-500 to-rose-600' : reinforcement.burnout?.level === 'high' ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-green-600'}`}
                        value={reinforcement.burnout?.level || 'low'}
                        sub={Math.round((reinforcement.burnout?.risk || 0) * 100) + '%'} trend={reinforcement.burnout?.level === 'low' ? 'up' : 'down'}
                    />
                </div>

                {/* ── MAIN GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">

                    {/* LEFT: Skill Graph Preview */}
                    <Surface className="p-5 sm:p-6 md:p-8">
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600/10 to-blue-600/10 flex items-center justify-center">
                                    <Brain size={18} className="text-[var(--accent-primary)]" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-black text-[var(--site-text)]">Skill Graph</h2>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">{graph.totalSkills || 0} nodes · {graph.totalEdges || 0} edges</p>
                                </div>
                            </div>
                            <Link href="/skill-graph" className="flex items-center gap-1 text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-wider hover:underline btn-tactile">
                                View <ArrowUpRight size={12} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                            {(graph.topSkills || []).slice(0, 6).map((sk, i) => (
                                <SkillNode key={i} name={sk.name} mastery={sk.mastery} entropy={sk.entropy} />
                            ))}
                            {(!graph.topSkills || graph.topSkills.length === 0) && (
                                <div className="col-span-full text-center py-8 sm:py-12">
                                    <Brain size={32} className="mx-auto text-[var(--site-text-muted)] opacity-30 mb-3" />
                                    <p className="text-xs font-bold text-[var(--site-text-muted)] opacity-50">No skills tracked yet. Start learning!</p>
                                </div>
                            )}
                        </div>
                    </Surface>

                    {/* RIGHT: Opportunity Radar */}
                    <Surface className="p-5 sm:p-6 md:p-8">
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600/10 to-teal-600/10 flex items-center justify-center">
                                    <Globe size={18} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-black text-[var(--site-text)]">Opportunity Radar</h2>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Matched to your skills</p>
                                </div>
                            </div>
                            <Link href="/opportunity-radar" className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-wider hover:underline btn-tactile">
                                View All <ArrowUpRight size={12} />
                            </Link>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            {opportunities.slice(0, 5).map((opp, i) => (
                                <OpportunityMini key={i} opportunity={opp} />
                            ))}
                            {opportunities.length === 0 && (
                                <div className="text-center py-8 sm:py-12">
                                    <Globe size={32} className="mx-auto text-[var(--site-text-muted)] opacity-30 mb-3" />
                                    <p className="text-xs font-bold text-[var(--site-text-muted)] opacity-50">No opportunities detected yet.</p>
                                </div>
                            )}
                        </div>
                    </Surface>

                    {/* BOTTOM LEFT: Achievement Proofs */}
                    <Surface className="p-5 sm:p-6 md:p-8">
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                                    <Award size={18} className="text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-black text-[var(--site-text)]">Achievement Proofs</h2>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Auto-generated milestones</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            {recentProofs.slice(0, 5).map((proof, i) => (
                                <ProofMini key={proof._id || i} proof={proof} />
                            ))}
                            {recentProofs.length === 0 && (
                                <div className="text-center py-8 sm:py-12">
                                    <Award size={32} className="mx-auto text-[var(--site-text-muted)] opacity-30 mb-3" />
                                    <p className="text-xs font-bold text-[var(--site-text-muted)] opacity-50">Complete challenges to earn proofs.</p>
                                </div>
                            )}
                        </div>
                    </Surface>

                    {/* CAREER NAVIGATION INSIGHT */}
                    <CareerNavigationInsight insight={networkInsight} token={token} user={user} />

                    {/* BOTTOM RIGHT: Quick Actions */}
                    <Surface className="p-5 sm:p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-5 sm:mb-6">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-600/10 to-pink-600/10 flex items-center justify-center">
                                <Target size={18} className="text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-[var(--site-text)]">Quick Launch</h2>
                                <p className="text-[9px] sm:text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Navigate your engines</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                            {[
                                { href: '/skill-graph', icon: Brain, label: 'Skill Graph', color: 'from-indigo-600 to-blue-600', desc: 'Visualize your cognitive graph' },
                                { href: '/opportunity-radar', icon: Globe, label: 'Radar', color: 'from-emerald-500 to-teal-600', desc: 'Career opportunities' },
                                { href: '/momentum', icon: Flame, label: 'Momentum', color: 'from-orange-500 to-red-600', desc: 'Streaks & progress' },
                                { href: '/missions', icon: Target, label: 'Missions', color: 'from-purple-600 to-pink-600', desc: 'Adaptive challenges' },
                            ].map((item, i) => (
                                <Link key={i} href={item.href} className="flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--card-hover-border)] transition-all duration-300 group">
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <item.icon size={16} className="text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-black text-[var(--site-text)]">{item.label}</p>
                                        <p className="text-[9px] font-bold text-[var(--site-text-muted)] truncate">{item.desc}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-[var(--site-text-muted)] opacity-40 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    </Surface>
                </div>

                {/* ── CLUSTERS ── */}
                {(graph.clusters || []).length > 0 && (
                    <Surface className="p-5 sm:p-6 md:p-8 mt-4 sm:mt-6 md:mt-8">
                        <h2 className="text-base sm:text-lg font-black text-[var(--site-text)] mb-4 sm:mb-6">Skill Clusters</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                            {graph.clusters.map((cluster, i) => (
                                <div key={i} className="px-3 py-3 sm:px-4 sm:py-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center">
                                    <p className="text-xs sm:text-sm font-black text-[var(--site-text)] capitalize mb-1">{cluster.name}</p>
                                    <p className="text-xl sm:text-2xl font-black text-[var(--accent-primary)]">{Math.round((cluster.avgMastery || 0) * 100)}%</p>
                                    <p className="text-[8px] sm:text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">{cluster.skills?.length || 0} skills</p>
                                </div>
                            ))}
                        </div>
                    </Surface>
                )}
            </div>
        </div>
    );
}
