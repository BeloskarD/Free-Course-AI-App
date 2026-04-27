'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, API_BASE } from '../../services/api';
import {
    X,
    Clock,
    Zap,
    CheckCircle,
    XCircle,
    Loader2,
    Lightbulb,
    Trophy,
    Flame,
    ArrowRight,
    Sparkles
} from 'lucide-react';

export default function MicroChallenge({ skill, onClose, onComplete }) {
    const { token } = useAuth();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(180);
    const [isAIQuestion, setIsAIQuestion] = useState(false);

    const API_URL = API_BASE;

    // Fetch AI-generated challenge with fallback to standard
    const fetchChallenge = useCallback(async (tryAIFirst = true) => {
        setLoading(true);
        setResult(null);
        setSelectedAnswer(null);

        if (tryAIFirst) {
            try {
                console.log('🤖 Trying AI-generated challenge...');
                const aiResponse = await fetch(`${API_URL}/skill-health/challenge/ai`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    body: JSON.stringify({ skillName: skill.name, difficulty: 'medium' })
                });

                const aiData = await aiResponse.json();

                if (aiData.success && aiData.data?.challenge) {
                    const c = aiData.data.challenge;
                    setChallenge(c);
                    setTimeLeft(c.timeLimit || 180);
                    setIsAIQuestion(!!c.isAIGenerated);
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.log('⚠️ AI challenge error:', error.message);
            }
        }

        try {
            const response = await fetch(
                `${API_URL}/skill-health/challenge/${encodeURIComponent(skill.name)}?t=${Date.now()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache'
                    }
                }
            );

            const data = await response.json();

            if (data.success && data.data?.challenge) {
                setChallenge(data.data.challenge);
                setTimeLeft(data.data.challenge.timeLimit || 180);
                setIsAIQuestion(data.data.challenge.isAIGenerated);
            }
        } catch (error) {
            console.error('❌ Failed to fetch any challenge:', error);
        } finally {
            setLoading(false);
        }
    }, [skill.name, token, API_URL]);

    useEffect(() => {
        fetchChallenge(true);
    }, [fetchChallenge]);

    const handleSubmit = useCallback(async (timeout = false) => {
        if (isSubmitting || !challenge) return;
        setIsSubmitting(true);

        const isExplainType = challenge.type === 'explain' || !challenge.options?.length;
        const isCorrect = !timeout && (isExplainType
            ? selectedAnswer?.trim().length >= 10
            : selectedAnswer === challenge.correctAnswer);
        const timeSpent = (challenge.timeLimit || 180) - timeLeft;

        try {
            const response = await fetch(`${API_URL}/skill-health/submit-result`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    skillName: skill.name,
                    challengeId: challenge.id,
                    answer: selectedAnswer,
                    isCorrect,
                    timeSpent,
                    challengeType: challenge.type,
                    difficulty: challenge.difficulty || 'medium',
                    timeLimit: challenge.timeLimit || 180
                })
            });

            const data = await response.json();

            setResult({
                isCorrect,
                timeout,
                healthBoost: data.data?.healthBoost || (isCorrect ? 15 : 5),
                newHealth: data.data?.newHealth,
                newStatus: data.data?.newStatus,
                streak: data.data?.streak,
                explanation: challenge.explanation
            });
        } catch (error) {
            console.error('Submit error:', error);
            setResult({ isCorrect: false, error: true });
        } finally {
            setIsSubmitting(false);
        }
    }, [API_URL, challenge, isSubmitting, selectedAnswer, skill.name, timeLeft, token]);

    useEffect(() => {
        if (!challenge || result) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [challenge, result, handleSubmit]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (timeLeft <= 30) return 'text-red-500';
        if (timeLeft <= 60) return 'text-amber-500';
        return 'text-emerald-500';
    };

    return (
        <div
            className="fixed inset-0 z-[10001] flex p-4 sm:px-6 md:px-8 overflow-hidden animate-in fade-in duration-300"
            onClick={onClose}
        >
            {/* Layout Wrapper to center relative to sidebar */}
            <div
                className="relative w-full h-full flex items-start justify-center max-lg:pl-0 lg:pl-[var(--sidebar-offset,0px)] pt-24 pb-6 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500 mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Content */}
                <div className="relative z-10 w-full max-w-xl h-full max-h-[85vh] bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-400">
                    {/* Ambient Glow */}
                    <div className="absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-15 blur-3xl pointer-events-none" />
                    <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="shrink-0 relative p-4 sm:p-6 bg-[var(--card-bg)] border-b border-[var(--card-border)]">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.03] to-purple-500/[0.03]" />
                        <div className="relative flex items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                                <div className="w-10 h-10 sm:w-16 sm:h-16 shrink-0 rounded-xl sm:rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg transition-transform duration-300">
                                    <Zap size={20} className="text-white sm:hidden" />
                                    <Zap size={32} className="text-white hidden sm:block" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-2xl md:text-3xl font-black text-[var(--site-text)] truncate tracking-tight">
                                        {skill.name} <span className="text-indigo-500">Quest</span>
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
                                        <span className="text-[8px] sm:text-xs font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                            {challenge?.difficulty || 'Medium'}
                                        </span>
                                        {challenge?.isAIGenerated && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-[8px] sm:text-[11px] font-black uppercase tracking-wider border border-purple-500/20">
                                                <Sparkles size={8} className="animate-pulse" /> AI
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-3xl bg-[var(--site-text)]/[0.03] hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 group ml-2"
                            >
                                <X size={18} className="sm:w-7 sm:h-7 transition-transform group-hover:rotate-90" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
                                <p className="text-xs sm:text-sm font-bold text-[var(--site-text-muted)] tracking-widest uppercase opacity-60">Synchronizing...</p>
                            </div>
                        ) : result ? (
                            <div className="text-center py-4">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl ${result.isCorrect
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20'
                                    : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
                                    }`}>
                                    {result.isCorrect ? <CheckCircle size={32} className="text-white" /> : <XCircle size={32} className="text-white" />}
                                </div>
                                <h4 className="text-xl sm:text-2xl font-black text-[var(--site-text)] mb-2">
                                    {result.timeout ? 'Time\'s Up!' : result.isCorrect ? 'Excellent!' : 'Need Practice!'}
                                </h4>
                                <p className="text-sm text-[var(--site-text-muted)] mb-8 px-4">
                                    {result.isCorrect ? 'Your mastery level has increased!' : 'Review the concept to strengthen your foundation.'}
                                </p>

                                <div className="flex items-center justify-center gap-6 mb-8 bg-[var(--site-text)]/5 p-5 rounded-3xl border border-[var(--card-border)] mx-auto max-w-sm">
                                    <div className="text-center">
                                        <div className={`text-2xl font-black ${result.healthBoost >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {result.healthBoost >= 0 ? '+' : ''}{result.healthBoost}%
                                        </div>
                                        <div className="text-[9px] text-[var(--site-text-muted)] font-black uppercase tracking-widest mt-1">Health</div>
                                    </div>
                                    {result.streak !== undefined && (
                                        <>
                                            <div className="w-px h-8 bg-[var(--card-border)]" />
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-2xl font-black text-orange-500">
                                                    <Flame size={20} fill="currentColor" />
                                                    {result.streak}
                                                </div>
                                                <div className="text-[9px] text-[var(--site-text-muted)] font-black uppercase tracking-widest mt-1">Streak</div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => fetchChallenge(true)}
                                        className="flex-1 px-6 py-4 bg-[var(--site-text)]/5 border border-[var(--card-border)] rounded-2xl font-bold text-[var(--site-text)] hover:bg-indigo-500/10 transition-all cursor-pointer active:scale-95"
                                    >
                                        Try Another
                                    </button>
                                    <button
                                        onClick={onComplete}
                                        className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                    >
                                        Finish <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Quiz HUD */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--site-text)]/5 ${getTimerColor()} border border-current/10`}>
                                        <Clock size={16} />
                                        <span className="text-base font-black font-mono">{formatTime(timeLeft)}</span>
                                    </div>
                                    <button
                                        onClick={() => fetchChallenge(true)}
                                        className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all border border-indigo-500/20 cursor-pointer active:scale-95 flex items-center gap-2"
                                    >
                                        <Sparkles size={14} /> Regenerate
                                    </button>
                                </div>

                                {/* Question */}
                                <div className="mb-8">
                                    <p className="text-base sm:text-xl font-bold text-[var(--site-text)] leading-relaxed tracking-tight">
                                        {challenge?.question}
                                    </p>
                                </div>

                                {/* Answers */}
                                <div className="space-y-3 mb-8">
                                    {challenge?.type === 'explain' || !challenge?.options?.length ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={selectedAnswer || ''}
                                                onChange={(e) => setSelectedAnswer(e.target.value)}
                                                placeholder="Enter your explanation..."
                                                className="w-full p-5 rounded-2xl bg-[var(--site-text)]/5 border-2 border-[var(--card-border)] focus:border-indigo-500 outline-none text-[var(--site-text)] min-h-[160px] resize-none transition-all"
                                            />
                                            <p className="text-[10px] text-[var(--site-text-muted)] font-bold text-center uppercase tracking-widest">
                                                Demonstrate your mastery with a detailed explanation
                                            </p>
                                        </div>
                                    ) : (
                                        challenge.options.map((option, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedAnswer(option)}
                                                className={`w-full cursor-pointer p-4 sm:p-5 rounded-2xl text-left border-2 transition-all duration-300 group/opt ${selectedAnswer === option
                                                    ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                                                    : 'bg-[var(--site-text)]/[0.02] border-[var(--card-border)] hover:bg-[var(--site-text)]/[0.05] hover:border-indigo-500/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${selectedAnswer === option
                                                        ? 'bg-indigo-500 text-white shadow-indigo-500/30 shadow-md'
                                                        : 'bg-[var(--site-text)]/10 text-[var(--site-text-muted)] group-hover/opt:bg-indigo-500/20 group-hover/opt:text-indigo-500'
                                                        }`}>
                                                        {String.fromCharCode(65 + index)}
                                                    </div>
                                                    <span className={`text-sm sm:text-base font-bold flex-1 ${selectedAnswer === option ? 'text-[var(--site-text)]' : 'text-[var(--site-text-muted)] group-hover/opt:text-[var(--site-text)]'}`}>
                                                        {option}
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>

                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={!selectedAnswer || isSubmitting}
                                    className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.01] hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 cursor-pointer"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <>Submit Mastery <ArrowRight size={18} /></>}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
