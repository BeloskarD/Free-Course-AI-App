'use client';

import { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

/**
 * 🎭 MoodCheckIn Component - daily emotional wellbeing tracking
 * 
 * Shows once every 24 hours to help users reflect on their mental state.
 * Integrated with the EQ-AI system to provide better empathetic support.
 */
export default function MoodCheckIn() {
    const { token, user } = useAuth();
    const [show, setShow] = useState(false);
    const [step, setStep] = useState('mood'); // 'mood' | 'note' | 'success'
    const [selectedMood, setSelectedMood] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');

    const moods = [
        { id: 'stressed', emoji: '😤', label: 'Stressed', score: 1, color: 'from-red-500/20 to-orange-500/20' },
        { id: 'struggling', emoji: '😔', label: 'Struggling', score: 2, color: 'from-orange-500/20 to-amber-500/20' },
        { id: 'okay', emoji: '😐', label: 'Okay', score: 3, color: 'from-amber-500/20 to-yellow-500/20' },
        { id: 'good', emoji: '😊', label: 'Good', score: 4, color: 'from-emerald-500/20 to-teal-500/20' },
        { id: 'great', emoji: '🌟', label: 'Great', score: 5, color: 'from-teal-500/20 to-cyan-500/20' },
    ];

    useEffect(() => {
        if (!user) return;

        // Check if user has already checked in today (last 24h)
        const lastCheckin = localStorage.getItem(`last_mood_checkin_${user.id}`);
        const now = Date.now();
        const checkinInterval = 24 * 60 * 60 * 1000; // 24 hours

        if (!lastCheckin || (now - parseInt(lastCheckin)) > checkinInterval) {
            // Small delay so it doesn't pop up immediately on page load
            const timer = setTimeout(() => setShow(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleMoodSelect = (mood) => {
        setSelectedMood(mood);
        setStep('note');
    };

    const handleSubmit = async () => {
        if (!selectedMood) return;
        setLoading(true);

        try {
            if (token) {
                const response = await api.logMood({
                    score: selectedMood.score,
                    emotion: selectedMood.id,
                    notes: note
                }, token);

                setAiResponse(response.message || "Thanks for sharing! Your wellbeing matters.");
            }

            // Save checkin time
            localStorage.setItem(`last_mood_checkin_${user.id}`, Date.now().toString());
            setStep('success');

            // Auto close after 5 seconds
            setTimeout(() => {
                setShow(false);
            }, 5000);
        } catch (error) {
            console.error('Error logging mood:', error);
            // Even on error, we don't want to nag the user, so we mark it as done
            setShow(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        // Record dismissal so we don't nag until the next interval
        if (user) {
            localStorage.setItem(`last_mood_checkin_${user.id}`, Date.now().toString());
        }
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header Gradient */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br transition-colors duration-500 ${selectedMood ? selectedMood.color : 'from-indigo-500/10 to-purple-500/10'}`} />

                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative pt-12 pb-8 px-6 sm:px-8 text-center">
                    {step === 'mood' && (
                        <div className="animate-in slide-in-from-bottom-5 duration-500">
                            <div className="mb-6">
                                <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
                                    <Heart className="w-8 h-8 fill-current" />
                                </span>
                                <h3 className="text-2xl font-bold text-[var(--site-text)] mb-2">How are you today?</h3>
                                <p className="text-[var(--site-text-muted)]">Checking in on your wellbeing helps us personalize your learning experience.</p>
                            </div>

                            <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-2">
                                {moods.map((mood) => (
                                    <button
                                        key={mood.id}
                                        onClick={() => handleMoodSelect(mood)}
                                        className="flex flex-col items-center group"
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center text-3xl mb-2 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] group-hover:scale-110 group-hover:border-indigo-500/50 transition-all duration-200">
                                            {mood.emoji}
                                        </div>
                                        <span className="text-[10px] font-medium text-[var(--site-text-muted)] group-hover:text-indigo-500 transition-colors">
                                            {mood.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'note' && (
                        <div className="animate-in slide-in-from-right-5 duration-500">
                            <div className="mb-6 text-left">
                                <h3 className="text-xl font-bold text-[var(--site-text)] mb-1">
                                    You're feeling {selectedMood?.label} {selectedMood?.emoji}
                                </h3>
                                <p className="text-sm text-[var(--site-text-muted)]">Want to share why? (Optional)</p>
                            </div>

                            <div className="relative mb-6">
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Write a quick thought..."
                                    className="w-full h-32 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--site-text)] placeholder-[var(--site-text-muted)] focus:border-indigo-500/50 outline-none resize-none transition-all"
                                />
                                <MessageSquare className="absolute top-4 right-4 w-5 h-5 text-[var(--card-border)]" />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('mood')}
                                    className="flex-1 px-4 py-3 rounded-xl border border-[var(--card-border)] text-[var(--site-text)] font-medium hover:bg-[var(--card-bg-hover)] transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Save Check-in
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="animate-in zoom-in-95 duration-500">
                            <div className="mb-6 py-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 mb-6 relative">
                                    <CheckCircle2 className="w-12 h-12" />
                                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-20" />
                                </div>
                                <h3 className="text-2xl font-bold text-[var(--site-text)] mb-3">Check-in Logged!</h3>
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl mb-6">
                                    <p className="text-[var(--site-text)] font-medium italic">
                                        "{aiResponse}"
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShow(false)}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--site-text)] text-[var(--site-bg)] font-bold hover:opacity-90 transition-all"
                                >
                                    Back to Learning
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
