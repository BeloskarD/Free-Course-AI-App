"use client";
import { useAuth } from "../../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import Surface from "../../components/ui/Surface.jsx";
import Breadcrumb from "../../components/ui/Breadcrumb";
import {
    Globe, Sparkles, TrendingUp, ArrowUpRight, Eye, Bookmark, X,
    BookmarkCheck, Target, AlertTriangle, Cpu, Brain, BarChart3,
    ChevronRight, Zap, Activity, Clock, RefreshCw, Radar, Briefcase,
    CheckCircle2, Award
} from "lucide-react";
import ConfirmModal from "../../components/ui/ConfirmModal";
import InterviewPrepModal from "../../components/ui/InterviewPrepModal";
import { useState, useEffect, useCallback } from "react";

// ── Session persistence for pagination ──
const getVisibleCountKey = (userId) => `radar_visibleCount_${userId || 'guest'}`;

function getPersistedVisibleCount(userId) {
    if (typeof window === 'undefined') return 10;
    const key = getVisibleCountKey(userId);
    const stored = localStorage.getItem(key);
    return stored ? Math.max(10, parseInt(stored, 10) || 10) : 10;
}

// ── Source icon + label ──
function sourceConfig(source) {
    const map = {
        github_trending: { icon: Cpu, label: 'GitHub Trend', color: 'from-gray-600 to-slate-700', text: 'text-slate-500' },
        hiring_signal: { icon: Target, label: 'Hiring Signal', color: 'from-emerald-500 to-teal-600', text: 'text-emerald-500' },
        research_trend: { icon: Brain, label: 'Research', color: 'from-purple-500 to-violet-600', text: 'text-purple-500' },
        creator_ecosystem: { icon: Sparkles, label: 'Creator', color: 'from-pink-500 to-rose-600', text: 'text-pink-500' },
        industry_report: { icon: BarChart3, label: 'Industry', color: 'from-blue-500 to-indigo-600', text: 'text-blue-500' },
    };
    return map[source] || { icon: Globe, label: source, color: 'from-slate-500 to-gray-600', text: 'text-slate-500' };
}

// ── Skill Formatter ──
const SKILL_MAP = {
    'advanceddeeplearninggenerativemodels': 'Advanced Deep Learning Generative Models',
    'machinelearning': 'Machine Learning',
    'datascience': 'Data Science',
    'dataanalysis': 'Data Analysis',
    'frontenddevelopment': 'Frontend Development',
    'backenddevelopment': 'Backend Development',
    'fullstack': 'Full Stack',
    'cloudcomputing': 'Cloud Computing',
    'devops': 'DevOps',
    'cybersecurity': 'Cyber Security',
    'mongodb': 'MongoDB',
    'python': 'Python',
    'react': 'React',
    'sqlnosql': 'SQL & NoSQL',
    'cloudawsgcp': 'Cloud (AWS/GCP)',
    'coreprogramming': 'Core Programming',
    'typescript': 'TypeScript',
    'javascript': 'JavaScript',
};

function formatSkillName(skill) {
    if (!skill) return "";
    
    // 1. Check dictionary for known unspaced terms (Legacy support)
    const normalized = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SKILL_MAP[normalized]) return SKILL_MAP[normalized];

    // 2. Handle camelCase or missing spaces between words
    // Improved regex to handle abbreviations and number-letter boundaries
    let formatted = skill
        .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // ACRONYMWord
        .replace(/([0-9])([a-zA-Z])/g, '$1 $2') // 2react -> 2 React
        .replace(/([a-zA-Z])([0-9])/g, '$1 $2'); // react18 -> React 18
    
    // 3. Replace separators with spaces
    formatted = formatted.replace(/[_-]/g, ' ');
    
    // 4. Special handling for common tech abbreviations
    const TECH_ABBREVIATIONS = ['SQL', 'AI', 'ML', 'API', 'AWS', 'GCP', 'UI', 'UX', 'IT', 'IP'];
    
    // 5. Title case + Abbreviation fixing
    return formatted.split(' ')
        .filter(word => word.length > 0)
        .map(word => {
            const upper = word.toUpperCase();
            if (TECH_ABBREVIATIONS.includes(upper)) return upper;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

// ── Opportunity Card ──
function OpportunityCard({ opportunity, onSave, onUnsave, onDismiss, onPrepare }) {
    const match = Math.round((opportunity.matchScore || 0) * 100);
    const fresh = Math.round((opportunity.freshness || 0) * 100);
    const sig = opportunity.signal || {};
    const gaps = opportunity.gapAnalysis || [];
    const matchedSkills = opportunity.matchedSkills || [];
    const reasoning = opportunity.aiReasoning;

    const src = sourceConfig(sig.source);
    const SrcIcon = src.icon;
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const isSaved = opportunity.status === 'saved';
    
    const momentumLabel = (sig.trendMomentum || 0) > 0.5 ? 'Exploding' : sig.trendMomentum > 0 ? 'Rising' : sig.trendMomentum < -0.2 ? 'Declining' : 'Stable';
    const momentumColor = (sig.trendMomentum || 0) > 0.5 ? 'text-emerald-500 bg-emerald-500/10' : sig.trendMomentum > 0 ? 'text-blue-500 bg-blue-500/10' : sig.trendMomentum < -0.2 ? 'text-red-500 bg-red-500/10' : 'text-slate-500 bg-slate-500/10';

    // Build explore URL: use signal URL or generate a Google search from title
    const exploreUrl = sig.url || `https://www.google.com/search?q=${encodeURIComponent(sig.title || 'career opportunity')}`;

    const handleAction = (type) => {
        if (type === 'save') onSave?.(opportunity);
        if (type === 'unsave') onUnsave?.(opportunity);
    };

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.(sig.signalId);
    };

    if (dismissed) return null;

    return (
        <Surface className="p-4 sm:p-6 group hover:border-[var(--card-hover-border)] transition-all duration-500 hover:shadow-[var(--shadow-elite-hover)]">
            {/* Header */}
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${src.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <SrcIcon size={18} className="text-white sm:hidden" />
                    <SrcIcon size={22} className="text-white hidden sm:block" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-black text-[var(--site-text)] line-clamp-2 leading-snug">{sig.title || 'Opportunity'}</h3>
                    <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 ${src.text}`}>{src.label}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-xl sm:text-2xl font-black text-[var(--accent-primary)]">{match}%</p>
                    <p className="text-[8px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Match</p>
                </div>
            </div>

            {/* Description */}
            {sig.description && (
                <p className="text-xs sm:text-sm text-[var(--site-text-muted)] font-bold mb-4 line-clamp-2 opacity-70">{sig.description}</p>
            )}

            {/* Skill Tags */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                {(sig.skillTags || []).slice(0, 6).map((tag, i) => (
                    <span key={i} className="text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] cursor-default select-none transition-colors hover:bg-[var(--accent-primary)]/20 whitespace-nowrap">
                        {formatSkillName(tag)}
                    </span>
                ))}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg cursor-default ${momentumColor}`}>{momentumLabel}</span>
                <span className="text-[9px] font-bold text-[var(--site-text-muted)] flex items-center gap-1">
                    <Clock size={10} /> Fresh: {fresh}%
                </span>
                <span className="text-[9px] font-bold text-[var(--site-text-muted)] flex items-center gap-1">
                    <Activity size={10} /> Score: {Math.round((sig.opportunityScore || 0) * 100)}%
                </span>
            </div>

            {/* Gap Analysis (expandable) */}
            {(gaps.length > 0 || matchedSkills.length > 0) && (
                <div className="mb-4">
                    <div className="flex items-center gap-4 mb-3">
                        {matchedSkills.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-wider bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                                <Award size={12} /> {matchedSkills.length} matches
                            </div>
                        )}
                        {gaps.length > 0 && (
                            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-wider cursor-pointer btn-tactile hover:text-amber-600 transition-colors">
                                <AlertTriangle size={12} /> {gaps.length} gap{gaps.length > 1 ? 's' : ''}
                                <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
                            </button>
                        )}
                    </div>

                    {reasoning && (
                        <div className="p-3 rounded-xl bg-[var(--site-bg)] border border-[var(--card-border)] mb-3 relative overflow-hidden group/reason">
                            <Sparkles size={14} className="absolute -right-1 -top-1 text-[var(--accent-primary)]/20 rotate-12 group-hover/reason:scale-125 transition-transform" />
                            <p className="text-[11px] font-bold text-[var(--site-text)] leading-relaxed italic opacity-90">
                                "{reasoning}"
                            </p>
                        </div>
                    )}

                    {expanded && gaps.length > 0 && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            {gaps.map((gap, i) => (
                                <div key={i} className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 transition-all hover:bg-amber-500/10">
                                    <span className="text-[11px] font-black text-[var(--site-text)] flex-1 min-w-0 truncate tracking-tight">{formatSkillName(gap.skill)}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[9px] font-bold text-[var(--site-text-muted)]">{Math.round((gap.currentMastery || 0) * 100)}%</span>
                                        <ArrowUpRight size={10} className="text-amber-500" />
                                        <span className="text-[9px] font-bold text-amber-500">{Math.round((gap.requiredLevel || 0) * 100)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Actions — Always visible, cursor-pointer on everything */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <a href={exploreUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all hover:scale-[1.03] cursor-pointer btn-tactile shadow-lg shadow-indigo-500/20">
                    <Eye size={12} /> Explore
                </a>
                <button 
                  onClick={() => handleAction(isSaved ? 'unsave' : 'save')} 
                  className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all cursor-pointer btn-tactile ${isSaved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--site-text)] hover:border-emerald-500/30 hover:text-emerald-500'}`}
                >
                    {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />} {isSaved ? 'Saved' : 'Save'}
                </button>
                <button onClick={handleDismiss} className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--site-text-muted)] font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all hover:border-red-500/30 hover:text-red-500 cursor-pointer btn-tactile">
                    <X size={12} /> Dismiss
                </button>
                {match > 50 && (
                    <button 
                        onClick={() => onPrepare?.(opportunity)}
                        className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all hover:bg-indigo-500 hover:text-white cursor-pointer btn-tactile w-full sm:w-auto justify-center mt-2 sm:mt-0"
                    >
                        <Brain size={12} /> Prep Interview
                    </button>
                )}
            </div>
        </Surface>
    );
}

// ── Trend Card ──
function TrendCard({ trend }) {
    return (
        <Surface className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-black text-[var(--site-text)] capitalize">{trend.cluster}</p>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${trend.avgMomentum > 0.3 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {trend.avgMomentum > 0.3 ? '🔥 Hot' : '📈 Active'}
                </span>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-xl font-black text-[var(--accent-primary)]">{trend.signalCount}</p>
                    <p className="text-[8px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Signals</p>
                </div>
                <p className="text-sm font-black text-emerald-500">+{Math.round((trend.avgMomentum || 0) * 100)}%</p>
            </div>
        </Surface>
    );
}

// ════════════════════════
// MAIN PAGE
// ════════════════════════
export default function OpportunityRadarPage() {
    const { token, user } = useAuth();
    const queryClient = useQueryClient();
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [visibleCount, setVisibleCount] = useState(10);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize visibleCount once user is loaded
    useEffect(() => {
        if (user?.id && !isInitialized) {
            const persisted = getPersistedVisibleCount(user.id);
            setVisibleCount(persisted);
            setIsInitialized(true);
        }
    }, [user?.id, isInitialized]);

    // Persist visibleCount to localStorage on change
    useEffect(() => {
        if (user?.id && isInitialized) {
            localStorage.setItem(getVisibleCountKey(user.id), String(visibleCount));
        }
    }, [visibleCount, user?.id, isInitialized]);

    // Modal states
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'save', opportunity: null });
    const [prepConfig, setPrepConfig] = useState({ isOpen: false, kit: null, opportunity: null, isLoading: false });
    const [processing, setProcessing] = useState(false);

    const { data: radarRes, isLoading, isFetching } = useQuery({
        queryKey: ["opportunity-radar", user?.id, visibleCount],
        queryFn: () => api.getOpportunityRadar(token, visibleCount), 
        enabled: !!token && !!user && isInitialized,
        staleTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
    });

    const { data: trendsRes } = useQuery({
        queryKey: ["opportunity-trends", user?.id],
        queryFn: () => api.getOpportunityTrends(token),
        enabled: !!token && !!user,
        staleTime: 1000 * 60 * 10,
    });

    const opportunities = radarRes?.data || [];
    const trends = trendsRes?.data || [];
    
    // hasMore logic: if we got exactly as many as we asked for, there might be more.
    // If we got fewer, we reached the end of the matching pool.
    const hasMore = opportunities.length > 0 && opportunities.length === visibleCount;

    // AI Scan handler
    const handleAIScan = async () => {
        setScanning(true);
        setScanResult(null);
        try {
            const result = await api.aiScanOpportunities(token);
            setScanResult(result?.data);
            queryClient.invalidateQueries({ queryKey: ["opportunity-radar", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["opportunity-trends", user?.id] });
            setVisibleCount(10); // Reset pagination on scan (sessionStorage syncs via useEffect)
        } catch (e) { console.error(e); setScanResult({ status: 'error', message: 'Scan failed' }); }
        setScanning(false);
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 10);
    };

    const handleSaveRequest = (opp) => {
        setModalConfig({ isOpen: true, type: 'save', opportunity: opp });
    };

    const handleUnsaveRequest = (opp) => {
        setModalConfig({ isOpen: true, type: 'unsave', opportunity: opp });
    };

    const mutation = useMutation({
        mutationFn: ({ signalId, newStatus }) => api.updateOpportunityStatus(signalId, newStatus, token),
        onMutate: async ({ signalId, newStatus }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["opportunity-radar", user?.id] });
            const currentKey = ["opportunity-radar", user?.id, visibleCount];

            // Snapshot the previous value
            const previousRadar = queryClient.getQueryData(currentKey);

            // Optimistically update to the new value
            queryClient.setQueryData(currentKey, old => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map(opp => 
                        opp.signal.signalId === signalId 
                            ? { ...opp, status: newStatus } 
                            : opp
                    )
                };
            });

            return { previousRadar, currentKey };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            queryClient.setQueryData(context.currentKey, context.previousRadar);
        },
        onSettled: () => {
            // Refetch to sync with server
            queryClient.invalidateQueries({ queryKey: ["opportunity-radar", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["saved-opportunities", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["saved-opportunities"] });
            queryClient.invalidateQueries({ queryKey: ["personalization"] });
        },
    });

    const handlePrepare = async (opp) => {
        setPrepConfig({ isOpen: true, kit: null, opportunity: opp, isLoading: true });
        try {
            const res = await api.getInterviewPrep(opp.signal.signalId, token);
            setPrepConfig(prev => ({ ...prev, kit: res.data, isLoading: false }));
        } catch (e) {
            console.error(e);
            setPrepConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const confirmAction = async () => {
        const { type, opportunity } = modalConfig;
        if (!opportunity) return;

        setProcessing(true);
        try {
            const newStatus = type === 'save' ? 'saved' : 'new';
            const signalId = opportunity.signal.signalId;
            
            await mutation.mutateAsync({ signalId, newStatus });
            
            // Toast notification
            const notification = document.createElement("div");
            notification.className = `fixed top-24 right-6 z-[300] bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black shadow-2xl animate-in slide-in-from-right duration-500 flex items-center gap-3`;
            notification.innerHTML = `<div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div> Signal ${type === 'save' ? 'Saved' : 'Removed'}`;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.classList.add("animate-out", "slide-out-to-right");
                setTimeout(() => notification.remove(), 500);
            }, 2000);

        } catch (e) { console.error(e); }
        finally {
            setProcessing(false);
            setModalConfig({ isOpen: false, type: 'save', opportunity: null });
        }
    };

    const handleDismiss = async (signalId) => {
        try {
            await api.updateOpportunityStatus(signalId, 'dismissed', token);
            queryClient.invalidateQueries({ queryKey: ["opportunity-radar", user?.id] });
        } catch (e) { console.error(e); }
    };

    // ── Loading ──
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] flex items-center justify-center">
                <div className="text-center animate-in fade-in zoom-in duration-700">
                    <div className="relative w-32 h-32 mx-auto mb-8">
                        <div className="absolute inset-0 bg-emerald-500/10 rounded-[2rem] blur-2xl" />
                        <div className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-[var(--card-bg)] to-[var(--site-bg)] border border-[var(--card-border)] flex items-center justify-center shadow-2xl">
                            <Globe size={60} className="text-emerald-500 animate-bounce" strokeWidth={1.5} />
                        </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--site-text)] tracking-tighter mb-2">
                        Scanning <span className="text-emerald-500">Signals...</span>
                    </h3>
                    <p className="text-sm font-black text-[var(--site-text-muted)] uppercase tracking-[0.4em] opacity-40">Opportunity Radar Active</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] pb-16">
                <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-7xl">
                    <Breadcrumb currentPage="Opportunity Radar" currentIcon={Globe} homeHref="/career-acceleration" homeLabel="Career" homeIcon={Briefcase} />
                    <div className="text-center mt-20">
                        <Globe size={48} className="mx-auto text-[var(--site-text-muted)] opacity-30 mb-4" />
                        <h2 className="text-2xl sm:text-3xl font-black text-[var(--site-text)] mb-3">Sign in to view your Opportunity Radar</h2>
                        <button onClick={() => (window.location.href = "/auth/login")} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.4em] btn-tactile mt-4">Sign In</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300 pb-16">
            <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-7xl overflow-x-hidden">
                <Breadcrumb currentPage="Opportunity Radar" currentIcon={Globe} homeHref="/career-acceleration" homeLabel="Career" homeIcon={Briefcase} />

                {/* ── HERO ── */}
                <div className="relative mb-10 sm:mb-16 overflow-hidden rounded-[2rem] sm:rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-6 sm:p-10 md:p-16 shadow-[var(--shadow-elite)] group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="absolute -right-32 -top-32 w-64 sm:w-96 h-64 sm:h-96 bg-emerald-600/10 rounded-full blur-[100px] animate-pulse-elite" />

                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-10">
                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-600/20 group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 ring-4 ring-white/10">
                                <Globe size={28} className="sm:hidden" strokeWidth={2.5} />
                                <Globe size={40} className="hidden sm:block" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-[var(--site-text)] leading-[1.1]">
                                    Opportunity <span className="text-gradient-elite">Radar</span>
                                </h1>
                                <p className="text-emerald-500 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.4em] flex items-center gap-2 mt-2 sm:mt-4">
                                    <Sparkles size={14} className="animate-pulse" /> AI-Powered Career Intelligence
                                </p>
                            </div>
                            <button onClick={handleAIScan} disabled={scanning} className={`self-start sm:self-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-[1.03] btn-tactile flex items-center gap-2 shadow-lg shadow-emerald-600/20 ${scanning ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                <Radar size={14} className={scanning ? 'animate-spin' : ''} />
                                <span>{scanning ? 'AI Scanning...' : '🤖 AI Scan'}</span>
                            </button>
                        </div>

                        {/* Scan result banner */}
                        {scanResult && (
                            <div className={`mt-4 px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in duration-300 ${scanResult.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : scanResult.status === 'cooldown' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                                {scanResult.status === 'success' ? <Sparkles size={14} /> : <Clock size={14} />}
                                {scanResult.message}
                                {scanResult.aiModel && <span className="ml-auto text-[9px] opacity-60">via {scanResult.aiModel}</span>}
                            </div>
                        )}

                        <p className="text-sm sm:text-lg md:text-xl text-[var(--site-text-muted)] max-w-4xl font-bold leading-relaxed opacity-80 mt-4">
                            {opportunities.length} opportunities matched to your skill profile. Ranked by relevance, trend momentum, and freshness.
                        </p>
                    </div>
                </div>

                {/* ── TRENDS ── */}
                {trends.length > 0 && (
                    <div className="mb-8 sm:mb-12 overflow-hidden">
                        <h2 className="text-sm sm:text-base font-black text-[var(--site-text)] mb-4 sm:mb-6 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-500" /> Trending Clusters
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide md:overflow-visible">
                            {trends.map((trend, i) => (
                                <TrendCard key={i} trend={trend} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── OPPORTUNITIES LIST ── */}
                <h2 className="text-sm sm:text-base font-black text-[var(--site-text)] mb-4 sm:mb-6 flex items-center gap-2">
                    <Target size={16} className="text-[var(--accent-primary)]" /> Matched Opportunities
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                    {opportunities.map((opp) => (
                        <div key={opp.signal?.signalId || opp.matchScore} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <OpportunityCard 
                              opportunity={opp} 
                              onSave={handleSaveRequest} 
                              onUnsave={handleUnsaveRequest}
                              onDismiss={handleDismiss} 
                              onPrepare={handlePrepare}
                            />
                        </div>
                    ))}
                </div>

                <ConfirmModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    onConfirm={confirmAction}
                    title={modalConfig.type === 'save' ? "Save Opportunity?" : "Remove Opportunity?"}
                    message={modalConfig.type === 'save' 
                        ? "This will add this signal to your dashboard for tracking and future matching."
                        : "This will remove the signal from your favorites. You can still find it in the radar."}
                    confirmText={modalConfig.type === 'save' ? "Yes, Save" : "Yes, Remove"}
                    type={modalConfig.type === 'save' ? 'success' : 'danger'}
                    isLoading={processing}
                />

                <InterviewPrepModal 
                    isOpen={prepConfig.isOpen}
                    onClose={() => setPrepConfig({ ...prepConfig, isOpen: false })}
                    kit={prepConfig.kit}
                    signal={prepConfig.opportunity?.signal}
                    isLoading={prepConfig.isLoading}
                />

                {hasMore && (
                    <div className="mt-12 flex justify-center">
                        <button 
                            onClick={handleLoadMore}
                            disabled={isFetching}
                            className="px-10 py-4 bg-[var(--card-bg)] hover:bg-[var(--accent-primary)]/10 border-2 border-[var(--card-border)] hover:border-[var(--accent-primary)]/30 text-[var(--site-text)] font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3 btn-tactile cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                            {isFetching ? 'Fetching more...' : 'Load More Signals'}
                        </button>
                    </div>
                )}

                {opportunities.length === 0 && (
                    <div className="col-span-full text-center py-16 sm:py-24 animate-in fade-in zoom-in duration-700">
                        <Radar size={48} className="mx-auto text-emerald-500 opacity-40 mb-4" />
                        <h3 className="text-lg sm:text-xl font-black text-[var(--site-text)] mb-2">Ready to Discover Opportunities</h3>
                        <p className="text-xs sm:text-sm font-bold text-[var(--site-text-muted)] opacity-50 max-w-md mx-auto mb-6">
                            Click the <strong className="text-emerald-500">🤖 AI Scan</strong> button above to have our AI analyze your skills and find personalized career opportunities.
                        </p>
                        <button onClick={handleAIScan} disabled={scanning} className={`px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-[1.03] btn-tactile flex items-center gap-2 mx-auto shadow-lg shadow-emerald-600/20 ${scanning ? 'opacity-70' : ''}`}>
                            <Radar size={14} className={scanning ? 'animate-spin' : ''} />
                            {scanning ? 'Scanning with AI...' : 'Scan Now with AI'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
