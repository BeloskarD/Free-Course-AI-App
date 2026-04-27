import { useState, useEffect, useCallback } from 'react';
import Surface from '../ui/Surface';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import Modal from '../ui/Modal';
import {
    X, ExternalLink, Globe, ShieldCheck,
    Rocket, BrainCircuit, Zap, Info, Loader2,
    Target, Check, Plus, ThumbsUp, ThumbsDown,
    Star, TrendingUp, DollarSign, BookmarkPlus, BookmarkCheck
} from 'lucide-react';

export default function ToolActionModal({ tool, onClose }) {
    const { token, user } = useAuth();
    const queryClient = useQueryClient();
    const toolUrl = tool.official_link || tool.link || tool.url;
    const toolName = tool.name;
    const toolDescription = tool.description || "Synthesizing tool intelligence...";

    // Notification states
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusConfig, setStatusConfig] = useState({ title: '', message: '', type: 'info' });
    const [saving, setSaving] = useState(false);

    // Fetch saved tools to check favorite status
    const { data: savedToolsData } = useQuery({
        queryKey: ['tool-favorites', user?.id],
        queryFn: () => api.getToolFavorites(token),
        enabled: !!user && !!token,
        staleTime: 1000 * 60 * 2,
    });

    const isFavorite = savedToolsData?.tools?.some(t => t.name === toolName) || false;

    const showNotification = (message, type = 'success') => {
        setStatusConfig({
            title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Login Required' : 'Info',
            message,
            type,
        });
        setShowStatusModal(true);
    };

    const handleToggleSave = async (e) => {
        e.stopPropagation();
        if (!user || !token) {
            showNotification('Please login to save tools to your library', 'warning');
            return;
        }

        setSaving(true);
        try {
            let result;
            if (isFavorite) {
                result = await api.removeToolFavorite(toolName, token);
                if (result?.success) {
                    showNotification('Tool removed from your library', 'info');
                }
            } else {
                result = await api.saveToolFavorite({
                    name: toolName,
                    description: toolDescription,
                    url: toolUrl,
                    domain: tool.domain || 'Intelligence'
                }, token);
                if (result?.success) {
                    showNotification('Tool saved to your library! 🎉', 'success');
                }
            }

            if (result?.error) {
                showNotification(`Failed: ${result.error}`, 'error');
            } else {
                queryClient.invalidateQueries({ queryKey: ['tool-favorites'] });
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            showNotification('Failed to save tool. Please try again.', 'error');
        }
        setSaving(false);
    };

    // Known high-security domains that block framing
    const RESTRICTED_DOMAINS = [
        'github.com', 'docker.com', 'google.com', 'linkedin.com',
        'microsoft.com', 'apple.com', 'openai.com', 'twitter.com',
        'facebook.com', 'oracle.com', 'salesforce.com', 'amazon.com',
        'visualstudio.com', 'vscode.dev', 'cursor.com', 'tavily.com',
        'perplexity.ai', 'anthropic.com', 'claude.ai', 'replicate.com',
        'postman.com', 'chatgpt.com', 'v0.dev', 'lovable.dev', 'bolt.new'
    ];

    const isInitialRestricted = toolUrl && RESTRICTED_DOMAINS.some(domain =>
        toolUrl.toLowerCase().includes(domain)
    );

    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [hasError, setHasError] = useState(isInitialRestricted);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        if (isInitialRestricted) return;
        const timer = setTimeout(() => {
            if (!iframeLoaded) setHasError(true);
        }, 3500);
        return () => clearTimeout(timer);
    }, [iframeLoaded, isInitialRestricted]);

    const handleLaunch = () => {
        window.open(toolUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="fixed inset-0 z-[10001] flex p-4 sm:px-6 md:px-8 overflow-hidden animate-in fade-in duration-500"
            onClick={onClose}
        >
            {/* Ultra Elite Backdrop */}
            <div className="absolute inset-0 bg-neutral-950/90 dark:bg-black/95 backdrop-blur-2xl" />

            {/* Layout Wrapper to center relative to sidebar */}
            <div className="relative w-full h-full flex items-start justify-center max-lg:pl-0 lg:pl-[var(--sidebar-offset,0px)] pt-24 pb-6 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500 mx-auto">
                <Surface
                    className="w-full h-full max-w-5xl max-h-[85vh] flex flex-col rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl relative overflow-hidden group animate-in zoom-in-95 duration-700 font-outfit pointer-events-auto transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                {/* AMBIENT BACKGROUND GLOWS */}
                <div className="absolute -right-40 -top-40 w-96 h-96 bg-indigo-600/10 blur-[120px] pointer-events-none" />
                <div className="absolute -left-40 -bottom-40 w-96 h-96 bg-purple-600/10 blur-[120px] pointer-events-none" />

                {/* HEADER SECTION */}
                <div className="relative pt-8 sm:pt-10 pb-6 sm:pb-8 px-6 sm:px-10 border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl shrink-0 z-20">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 sm:top-8 sm:right-10 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--site-text)]/5 hover:bg-rose-500/10 flex items-center justify-center transition-all hover:rotate-90 group btn-tactile border border-[var(--card-border)]"
                    >
                        <X size={20} className="text-[var(--site-text-muted)] group-hover:text-rose-500 transition-colors" />
                    </button>

                    <div className="flex flex-col gap-3 sm:gap-4 w-full pr-12">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] rounded-lg border border-[var(--accent-primary)]/20 shadow-sm flex items-center gap-2 shrink-0">
                                <BrainCircuit size={12} />
                                Intelligence Hub
                            </span>
                            <div className="h-px flex-1 sm:w-12 sm:flex-none bg-gradient-to-r from-[var(--accent-primary)]/30 to-transparent" />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[var(--site-text)] tracking-tighter leading-tight sm:leading-[0.9]">
                                {toolName}
                            </h2>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {/* Save Button */}
                                <button
                                    onClick={handleToggleSave}
                                    disabled={saving}
                                    className={`
                                        flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest border transition-all duration-500 shadow-lg btn-tactile
                                        ${isFavorite
                                            ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-indigo-500/30'
                                            : 'bg-[var(--card-bg)] text-[var(--site-text-muted)] border-[var(--card-border)] hover:border-[var(--accent-primary)]/50'
                                        }
                                        ${saving ? 'animate-pulse' : ''}
                                    `}
                                >
                                    {saving ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : isFavorite ? (
                                        <BookmarkCheck size={14} strokeWidth={3} />
                                    ) : (
                                        <BookmarkPlus size={14} strokeWidth={3} />
                                    )}
                                    <span className="shrink-0">{saving ? 'Saving...' : isFavorite ? 'Saved' : 'Save'}</span>
                                </button>

                                <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm shrink-0">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL BODY CONTROLLER */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tool Summary Bar */}
                    <div className="px-6 sm:px-10 py-4 sm:py-5 bg-[var(--site-bg)]/50 border-b border-[var(--card-border)] shrink-0 flex flex-col sm:flex-row sm:items-center gap-4 justify-between transition-colors">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20 shadow-inner shrink-0">
                                <Info size={16} className="text-[var(--accent-primary)]" />
                            </div>
                            <p className="text-[10px] sm:text-xs sm:text-sm font-bold text-[var(--site-text-muted)] leading-relaxed italic line-clamp-2 pr-4 opacity-90">
                                &quot;{toolDescription}&quot;
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            <button
                                onClick={handleLaunch}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--accent-primary)] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2 btn-tactile"
                            >
                                <Globe size={12} /> Full Site
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-white dark:bg-neutral-950 flex flex-col relative overflow-hidden">
                        {!hasError ? (
                            <div className="w-full h-full relative">
                                {!iframeLoaded && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-white dark:bg-neutral-950">
                                        <Loader2 size={40} className="animate-spin text-[var(--accent-primary)]" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--site-text-muted)] animate-pulse">Establishing Connection...</p>
                                    </div>
                                )}
                                <iframe
                                    src={toolUrl}
                                    className={`w-full h-full border-none transition-opacity duration-1000 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => setIframeLoaded(true)}
                                    onError={() => setHasError(true)}
                                    title={toolName}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full overflow-y-auto premium-scroll flex flex-col">
                                {/* Enhanced Fallback Information Grid */}
                                <div className="max-w-4xl mx-auto w-full p-6 sm:p-10 space-y-10">
                                    <div className="text-center space-y-3 mb-4">
                                        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2">
                                            <ShieldCheck size={40} strokeWidth={1.5} className="animate-pulse" />
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-[var(--site-text)] tracking-tight">Access Controlled Hub</h3>
                                        <p className="text-xs sm:text-sm font-bold text-[var(--site-text-muted)] max-w-lg mx-auto leading-relaxed">
                                            This official intelligence source is security-hardened. For the best experience, please launch it directly.
                                        </p>
                                    </div>

                                    {/* Tool Information Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Key Specifications */}
                                        <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                    <Zap size={18} />
                                                </div>
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--site-text)]">Key Capabilities</h4>
                                            </div>
                                            <ul className="space-y-3">
                                                {['Next-gen AI processing', 'High-performance API connectivity', 'Professional grade reliability', 'Curated intelligence datasets'].map((feat, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-xs font-bold text-[var(--site-text-muted)]">
                                                        <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                        {feat}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Mission Readiness */}
                                        <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <Rocket size={18} />
                                                </div>
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--site-text)]">Mission Readiness</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--site-text)]/[0.03] border border-[var(--card-border)]">
                                                    <Target size={16} className="text-[var(--accent-primary)]" />
                                                    <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-wider">Enterprise Ready</p>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--site-text)]/[0.03] border border-[var(--card-border)]">
                                                    <ShieldCheck size={16} className="text-emerald-500" />
                                                    <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-wider">Production Stable</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Box */}
                                    <div className="p-8 rounded-[2rem] bg-[var(--site-text)] text-[var(--site-bg)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl overflow-hidden relative group">
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--accent-primary)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                                        <div className="space-y-1 text-center md:text-left">
                                            <h5 className="text-lg font-black tracking-tight leading-none uppercase italic">Elite Access Path</h5>
                                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Connect to live tool dashboard</p>
                                        </div>
                                        <button
                                            onClick={handleLaunch}
                                            className="w-full md:w-auto px-10 py-4 bg-[var(--site-bg)] text-[var(--site-text)] font-black rounded-2xl uppercase tracking-[0.3em] text-[10px] hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3 group/btn"
                                        >
                                            Launch Insight Panel
                                            <Rocket size={16} className="group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* BOTTOM BRANDING SECTION */}
                <div className="px-6 sm:px-10 py-4 bg-[var(--card-bg)] border-t border-[var(--card-border)] shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 border-2 border-[var(--card-bg)]" />
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 border-2 border-[var(--card-bg)]" />
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 border-2 border-[var(--card-bg)]" />
                        </div>
                        <span className="text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-widest">Active Intelligence Node</span>
                    </div>
                    <p className="text-[8px] sm:text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-tighter opacity-40">
                        {toolUrl}
                    </p>
                </div>
            </Surface>
            </div>

            {/* Internal Status Notification */}
            <Modal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title={statusConfig.title}
                message={statusConfig.message}
                type={statusConfig.type}
            />
        </div>
    );
}
