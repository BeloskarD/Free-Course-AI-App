"use client";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import Surface from "../../components/ui/Surface.jsx";
import Breadcrumb from "../../components/ui/Breadcrumb";
import {
    Brain, Sparkles, Activity, ArrowUpRight, RefreshCw,
    Zap, Eye, TrendingUp, AlertTriangle, Link2, ChevronDown, Briefcase
} from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

// ── Cluster Colors ──
const CLUSTER_COLORS = {
    frontend: { bg: 'from-blue-500 to-indigo-600', ring: 'border-blue-500/30', text: 'text-blue-500', light: 'bg-blue-500/10' },
    backend: { bg: 'from-emerald-500 to-teal-600', ring: 'border-emerald-500/30', text: 'text-emerald-500', light: 'bg-emerald-500/10' },
    database: { bg: 'from-purple-500 to-violet-600', ring: 'border-purple-500/30', text: 'text-purple-500', light: 'bg-purple-500/10' },
    devops: { bg: 'from-orange-500 to-red-600', ring: 'border-orange-500/30', text: 'text-orange-500', light: 'bg-orange-500/10' },
    ai_ml: { bg: 'from-pink-500 to-rose-600', ring: 'border-pink-500/30', text: 'text-pink-500', light: 'bg-pink-500/10' },
    mobile: { bg: 'from-cyan-500 to-sky-600', ring: 'border-cyan-500/30', text: 'text-cyan-500', light: 'bg-cyan-500/10' },
    security: { bg: 'from-red-500 to-rose-600', ring: 'border-red-500/30', text: 'text-red-500', light: 'bg-red-500/10' },
    data: { bg: 'from-amber-500 to-yellow-600', ring: 'border-amber-500/30', text: 'text-amber-500', light: 'bg-amber-500/10' },
    general: { bg: 'from-slate-500 to-gray-600', ring: 'border-slate-500/30', text: 'text-slate-500', light: 'bg-slate-500/10' },
};

function getClusterStyle(cluster) {
    return CLUSTER_COLORS[cluster] || CLUSTER_COLORS.general;
}

// ── Skill Detail Card ──
function SkillDetailCard({ node, onSelect }) {
    const masteryPct = Math.round((node.masteryScore || 0) * 100);
    const entropyPct = Math.round((node.entropyRate || 0) * 100);
    const healthPct = Math.round(node.health || 100);
    const style = getClusterStyle(node.cluster);

    const entropyLabel = node.entropyRate > 0.7 ? 'Fading' : node.entropyRate > 0.4 ? 'Stable' : 'Strong';
    const entropyColor = node.entropyRate > 0.7 ? 'text-red-500 bg-red-500/10' : node.entropyRate > 0.4 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';

    return (
        <div onClick={() => onSelect?.(node)} className={`group cursor-pointer p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border-2 ${style.ring} hover:border-[var(--card-hover-border)] transition-all duration-300 hover:shadow-[var(--shadow-elite-hover)] hover:-translate-y-1`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${style.bg} flex items-center justify-center shrink-0`}>
                        <Brain size={15} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-black text-[var(--site-text)] capitalize leading-tight truncate" title={node.label || node.id}>{node.label || node.id}</p>
                        <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${style.text} truncate`}>{node.cluster}</p>
                    </div>
                </div>
                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${entropyColor} shrink-0`}>{entropyLabel}</span>
            </div>

            {/* Bars */}
            <div className="space-y-2.5">
                {/* Mastery */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Mastery</span>
                        <span className="text-[10px] font-black text-[var(--site-text)]">{masteryPct}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${style.bg} transition-all duration-700`} style={{ width: `${masteryPct}%` }} />
                    </div>
                </div>
                {/* Health */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Health</span>
                        <span className="text-[10px] font-black text-[var(--site-text)]">{healthPct}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${healthPct > 70 ? 'bg-emerald-500' : healthPct > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${healthPct}%` }} />
                    </div>
                </div>
            </div>

            {/* Footer stats */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="text-[8px] font-bold text-[var(--site-text-muted)] flex items-center gap-1">
                    <Activity size={10} /> V: {(node.learningVelocity || 0).toFixed(2)}
                </span>
                <span className="text-[8px] font-bold text-[var(--site-text-muted)] flex items-center gap-1">
                    <Link2 size={10} /> {(node.adjacencySkills || []).length} links
                </span>
                <span className="text-[8px] font-bold text-[var(--site-text-muted)] flex items-center gap-1">
                    <Eye size={10} /> {node.challengeCount || 0} challenges
                </span>
            </div>
        </div>
    );
}

// ── Selected Skill Panel ──
function SkillFocusPanel({ node, onClose }) {
    if (!node) return null;
    const style = getClusterStyle(node.cluster);
    return (
        <Surface className="p-5 sm:p-6 md:p-8 relative">
            <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-colors cursor-pointer btn-tactile">✕</button>
            <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${style.bg} flex items-center justify-center`}>
                    <Brain size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[var(--site-text)] capitalize">{node.label || node.id}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>{node.cluster} cluster</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { l: 'Mastery', v: Math.round((node.masteryScore || 0) * 100) + '%' },
                    { l: 'Entropy', v: Math.round((node.entropyRate || 0) * 100) + '%' },
                    { l: 'Health', v: Math.round(node.health || 100) + '%' },
                    { l: 'Velocity', v: (node.learningVelocity || 0).toFixed(2) },
                ].map((s, i) => (
                    <div key={i} className="px-3 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center">
                        <p className="text-lg sm:text-xl font-black text-[var(--site-text)]">{s.v}</p>
                        <p className="text-[8px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">{s.l}</p>
                    </div>
                ))}
            </div>

            {/* Adjacent skills */}
            {(node.adjacencySkills || []).length > 0 && (
                <div>
                    <p className="text-xs font-black text-[var(--site-text-muted)] uppercase tracking-wider mb-3">Connected Skills</p>
                    <div className="flex flex-wrap gap-2">
                        {node.adjacencySkills.map((adj, i) => (
                            <span key={i} className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] capitalize">{adj}</span>
                        ))}
                    </div>
                </div>
            )}
        </Surface>
    );
}

// ── Custom Sort Dropdown (theme-matched) ──
const SORT_OPTIONS = [
    { value: 'mastery', label: 'Mastery', icon: '🎯' },
    { value: 'entropy', label: 'Entropy', icon: '🔥' },
    { value: 'health', label: 'Health ↑', icon: '💚' },
    { value: 'velocity', label: 'Velocity', icon: '⚡' },
];

function SortDropdown({ sortBy, setSortBy }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const current = SORT_OPTIONS.find(o => o.value === sortBy) || SORT_OPTIONS[0];

    return (
        <div className="ml-auto relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--site-text)] hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer btn-tactile shadow-sm"
            >
                <span className="text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider hidden sm:inline">Sort:</span>
                <span className="text-[10px] font-black uppercase tracking-wider">{current.icon} {current.label}</span>
                <ChevronDown size={14} className={`text-[var(--site-text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {SORT_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => { setSortBy(option.value); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${sortBy === option.value
                                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-black'
                                    : 'text-[var(--site-text)] hover:bg-[var(--site-text)]/5'
                                }`}
                        >
                            <span className="text-base">{option.icon}</span>
                            {option.label}
                            {sortBy === option.value && <span className="ml-auto text-[var(--accent-primary)]">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ════════════════════════
// MAIN PAGE
// ════════════════════════
export default function SkillGraphPage() {
    const { token, user } = useAuth();
    const [selectedNode, setSelectedNode] = useState(null);
    const [filterCluster, setFilterCluster] = useState('all');
    const [sortBy, setSortBy] = useState('mastery');

    const { data: graphRes, isLoading, error } = useQuery({
        queryKey: ["graph-engine", user?.id],
        queryFn: () => api.getGraphEngine(token),
        enabled: !!token && !!user,
        staleTime: 1000 * 60 * 5,
        refetchOnMount: "always",
    });

    const graph = graphRes?.data;
    const nodes = graph?.nodes || [];
    const clusters = graph?.clusters || [];

    const filteredNodes = useMemo(() => {
        let result = [...nodes];
        if (filterCluster !== 'all') {
            result = result.filter(n => n.cluster === filterCluster);
        }
        result.sort((a, b) => {
            if (sortBy === 'mastery') return (b.masteryScore || 0) - (a.masteryScore || 0);
            if (sortBy === 'entropy') return (b.entropyRate || 0) - (a.entropyRate || 0);
            if (sortBy === 'health') return (a.health || 100) - (b.health || 100);
            return (b.learningVelocity || 0) - (a.learningVelocity || 0);
        });
        return result;
    }, [nodes, filterCluster, sortBy]);

    // ── Loading ──
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] flex items-center justify-center">
                <div className="text-center animate-in fade-in zoom-in duration-700">
                    <div className="relative w-32 h-32 mx-auto mb-8">
                        <div className="absolute inset-0 bg-indigo-500/10 rounded-[2rem] blur-2xl" />
                        <div className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-[var(--card-bg)] to-[var(--site-bg)] border border-[var(--card-border)] flex items-center justify-center shadow-2xl">
                            <Brain size={60} className="text-indigo-500 animate-bounce" strokeWidth={1.5} />
                        </div>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--site-text)] tracking-tighter mb-2">
                        Mapping <span className="text-indigo-500">Your Brain...</span>
                    </h3>
                    <p className="text-sm font-black text-[var(--site-text-muted)] uppercase tracking-[0.4em] opacity-40">Building Cognitive Graph</p>
                </div>
            </div>
        );
    }

    if (error || !token) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] pb-16">
                <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-7xl">
                    <Breadcrumb currentPage="Skill Graph" currentIcon={Brain} homeHref="/career-acceleration" homeLabel="Career" homeIcon={Briefcase} />
                    <div className="text-center mt-20">
                        <Brain size={48} className="mx-auto text-[var(--site-text-muted)] opacity-30 mb-4" />
                        <h2 className="text-2xl sm:text-3xl font-black text-[var(--site-text)] mb-3">Sign in to view your Skill Graph</h2>
                        <button onClick={() => (window.location.href = "/auth/login")} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.4em] btn-tactile mt-4">Sign In</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300 pb-16">
            <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-7xl">
                <Breadcrumb currentPage="Skill Graph" currentIcon={Brain} homeHref="/career-acceleration" homeLabel="Career" homeIcon={Briefcase} />

                {/* ── HERO ── */}
                <div className="relative mb-10 sm:mb-16 overflow-hidden rounded-[2rem] sm:rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-6 sm:p-10 md:p-16 shadow-[var(--shadow-elite)] group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="absolute -right-32 -top-32 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-elite" />

                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-10">
                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 ring-4 ring-white/10">
                                <Brain size={28} className="sm:hidden" strokeWidth={2.5} />
                                <Brain size={40} className="hidden sm:block" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-[var(--site-text)] leading-[1.1]">
                                    Cognitive <span className="text-gradient-elite">Graph</span>
                                </h1>
                                <p className="text-indigo-600 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.4em] flex items-center gap-2 mt-2 sm:mt-4">
                                    <Sparkles size={14} className="animate-pulse" /> Your Dynamic Skill Intelligence
                                </p>
                            </div>
                        </div>
                        <p className="text-sm sm:text-lg md:text-xl text-[var(--site-text-muted)] max-w-4xl font-bold leading-relaxed opacity-80">
                            {nodes.length} skill nodes with {graph?.edges?.length || 0} connections. Your cognitive graph evolves with every challenge, project, and learning session.
                        </p>
                    </div>
                </div>

                {/* ── SUMMARY CARDS ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
                    <Surface className="p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-black text-[var(--accent-primary)]">{graph?.meta?.totalNodes || 0}</p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Nodes</p>
                    </Surface>
                    <Surface className="p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-black text-emerald-500">{graph?.meta?.totalEdges || 0}</p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Edges</p>
                    </Surface>
                    <Surface className="p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-black text-amber-500">{Math.round((graph?.meta?.graphDensity || 0) * 100)}%</p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Density</p>
                    </Surface>
                    <Surface className="p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-black text-purple-500 capitalize">{graph?.meta?.dominantCluster || 'N/A'}</p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Dominant</p>
                    </Surface>
                </div>

                {/* ── FILTERS ── */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <button onClick={() => setFilterCluster('all')} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer btn-tactile ${filterCluster === 'all' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--site-text-muted)]'}`}>All</button>
                    {clusters.map((c, i) => {
                        const style = getClusterStyle(c.name);
                        return (
                            <button key={i} onClick={() => setFilterCluster(c.name)} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer btn-tactile capitalize ${filterCluster === c.name ? `bg-gradient-to-r ${style.bg} text-white` : `${style.light} ${style.text} border border-transparent`}`}>
                                {c.name} ({c.skills?.length || 0})
                            </button>
                        );
                    })}
                    <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
                </div>

                {/* ── SELECTED SKILL ── */}
                {selectedNode && (
                    <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <SkillFocusPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
                    </div>
                )}

                {/* ── SKILL GRID ── */}
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {filteredNodes.map((node, i) => (
                        <SkillDetailCard key={node.id || i} node={node} onSelect={setSelectedNode} />
                    ))}
                    {filteredNodes.length === 0 && (
                        <div className="col-span-full text-center py-16">
                            <Brain size={48} className="mx-auto text-[var(--site-text-muted)] opacity-30 mb-4" />
                            <p className="text-sm font-bold text-[var(--site-text-muted)] opacity-50">No skills found. Complete challenges to build your graph.</p>
                        </div>
                    )}
                </div>

                {/* ── CLUSTERS OVERVIEW ── */}
                {clusters.length > 0 && (
                    <Surface className="p-5 sm:p-6 md:p-8 mt-8 sm:mt-12">
                        <h2 className="text-base sm:text-lg font-black text-[var(--site-text)] mb-5 sm:mb-6">Cluster Analysis</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {clusters.map((cluster, i) => {
                                const style = getClusterStyle(cluster.name);
                                return (
                                    <div key={i} className={`p-4 sm:p-5 rounded-2xl border-2 ${style.ring} bg-[var(--card-bg)]`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${style.bg} flex items-center justify-center`}>
                                                <Brain size={14} className="text-white" />
                                            </div>
                                            <p className="text-sm font-black text-[var(--site-text)] capitalize">{cluster.name}</p>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-2xl font-black text-[var(--site-text)]">{Math.round((cluster.avgMastery || 0) * 100)}%</p>
                                                <p className="text-[8px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">Avg Mastery</p>
                                            </div>
                                            <p className={`text-xs font-black ${style.text}`}>{cluster.skills?.length || 0} skills</p>
                                        </div>
                                        {/* Mini bar */}
                                        <div className="h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden mt-3">
                                            <div className={`h-full rounded-full bg-gradient-to-r ${style.bg}`} style={{ width: `${Math.round((cluster.avgMastery || 0) * 100)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Surface>
                )}
            </div>
        </div>
    );
}
