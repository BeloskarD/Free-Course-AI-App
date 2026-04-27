"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { 
    X, Sparkles, Brain, Target, MessageSquare, 
    ArrowRight, Loader2, Award, Zap, Trophy,
    CheckCircle2, HelpCircle
} from "lucide-react";

export default function InterviewPrepModal({ isOpen, onClose, kit, signal, isLoading }) {
    // ── Body Scroll Lock ──
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { type: "spring", duration: 0.5, bounce: 0.3, staggerChildren: 0.1 }
        },
        exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <AnimatePresence mode="wait">
            {/* ── Outer wrapper: EXACT match of AI Comparison modal gold-standard ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[10001] flex p-3 sm:p-4 md:p-6 overflow-hidden"
                onClick={onClose}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-xl" />

                {/* Layout Wrapper — centers relative to sidebar */}
                <div className="relative w-full h-full flex items-start justify-center max-lg:pl-0 lg:pl-[var(--sidebar-offset,0px)] pt-20 pb-4 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500">
                    {/* Modal Container */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl my-auto bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl sm:rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-full"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Header */}
                        <div className="p-4 sm:p-8 border-b border-[var(--card-border)] bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent flex items-start justify-between">
                            <div className="flex gap-4 sm:gap-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                                    <Brain size={32} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-3xl font-black text-[var(--site-text)] tracking-tighter leading-tight">
                                        Interview <span className="text-gradient-elite">Co-Pilot</span>
                                    </h2>
                                    <p className="text-[10px] sm:text-xs font-bold text-[var(--site-text-muted)] uppercase tracking-[0.2em] mt-1">
                                        For: {signal?.title || 'Personalized Role'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-[var(--site-text-muted)] transition-colors btn-tactile">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                            {isLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <Loader2 size={48} className="text-[var(--accent-primary)] animate-spin" />
                                        <Sparkles size={24} className="absolute -top-2 -right-2 text-amber-500 animate-pulse" />
                                    </div>
                                    <p className="text-sm font-black text-[var(--site-text)] uppercase tracking-widest animate-pulse">
                                        AI is generating your strategy...
                                    </p>
                                </div>
                            ) : kit ? (
                                <div className="space-y-8 sm:space-y-12">
                                    {/* Strategy Banner */}
                                    <motion.div variants={itemVariants} className="p-6 rounded-[2rem] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 relative overflow-hidden group">
                                        <Zap size={40} className="absolute -right-4 -bottom-4 text-[var(--accent-primary)]/10 group-hover:scale-150 transition-transform duration-700" />
                                        <div className="flex items-center gap-3 mb-3">
                                            <Trophy size={18} className="text-amber-500" />
                                            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--site-text)]">The Winning Strategy</h3>
                                        </div>
                                        <p className="text-sm sm:text-base text-[var(--site-text)] font-semibold leading-relaxed">
                                            {kit.strategy}
                                        </p>
                                    </motion.div>

                                    {/* Strengths & Skills */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                        <motion.div variants={itemVariants}>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Award size={18} className="text-emerald-500" />
                                                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--site-text)]">Key Strengths</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {kit.keyStrengths?.map((s, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                                        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm font-bold text-[var(--site-text)]">{s}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        <motion.div variants={itemVariants}>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Target size={18} className="text-[var(--accent-primary)]" />
                                                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--site-text)]">Critical Focus</h3>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                                                <p className="text-xs font-bold text-[var(--site-text-muted)] mb-3">Priority Skills to defend:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {signal?.skillTags?.slice(0, 4).map((tag, i) => (
                                                        <span key={i} className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-black uppercase tracking-wider">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Questions Section */}
                                    <motion.div variants={itemVariants} className="space-y-6">
                                        <div className="flex items-center gap-2 pb-4 border-b border-[var(--card-border)]">
                                            <MessageSquare size={18} className="text-indigo-500" />
                                            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--site-text)]">Predicted Questions</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                            {kit.potentialQuestions?.map((q, i) => (
                                                <div key={i} className="p-4 sm:p-6 rounded-[2rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-indigo-500/20 transition-all group">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                                            <HelpCircle size={16} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm sm:text-base font-black text-[var(--site-text)] mb-3 group-hover:text-indigo-500 transition-colors">
                                                                {q.question}
                                                            </h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div className="p-3 rounded-xl bg-slate-500/5">
                                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reasoning</p>
                                                                    <p className="text-[11px] font-bold text-[var(--site-text-muted)]">{q.reasoning}</p>
                                                                </div>
                                                                <div className="p-3 rounded-xl bg-emerald-500/5">
                                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Answer Tip</p>
                                                                    <p className="text-[11px] font-bold text-emerald-500/80">{q.tips}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Progress CTA */}
                                    <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-500/20 text-center relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h4 className="text-xl sm:text-2xl font-black mb-2">Feeling Ready?</h4>
                                            <p className="text-xs sm:text-sm font-bold opacity-80 mb-6 max-w-sm mx-auto">Use these points to rehearse. Your missions have prepared you for this moment.</p>
                                            <button onClick={onClose} className="px-8 py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all btn-tactile">
                                                Back to Radar
                                            </button>
                                        </div>
                                        <Sparkles size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-[var(--site-text-muted)] font-bold">
                                    No preparation data available.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
