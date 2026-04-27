'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, ArrowRight, Brain, BookOpen, Wrench, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../ui/Skeleton';

/**
 * AISearchWidget - Extreme Elite Edition
 * Provides a premium, theme-synchronized search interface for the homepage.
 */
export default function AISearchWidget() {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const quickSuggestions = [
    'Learn React in 2026',
    'Become a Full Stack Developer',
    'Master AI and Machine Learning',
    'Career switch to Data Science'
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      const encodedQuery = encodeURIComponent(query.trim());
      router.push(`/ai-intelligence?q=${encodedQuery}&autoSearch=true`);
      setIsAnalyzing(false);
    }, 300);
  };

  const handleShowSuggestions = () => {
    if (!query.trim()) return;
    setShowSuggestions(true);
  };

  const handleQuickAction = (action) => {
    const encodedQuery = encodeURIComponent(query.trim());
    switch (action) {
      case 'roadmap':
        router.push(`/ai-intelligence?q=${encodedQuery}&autoSearch=true`);
        break;
      case 'courses':
        router.push(`/courses?q=${encodedQuery}`);
        break;
      case 'tools':
        router.push(`/ai-tools?q=${encodedQuery}`);
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(true);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto group/widget">
      {/* ELITE ENCAPSULATION */}
      <div className="relative p-2 rounded-[3.5rem] bg-gradient-to-br from-[var(--card-border)]/50 via-transparent to-[var(--card-border)]/50 shadow-[var(--shadow-elite)]">
        <div className="relative overflow-visible bg-[var(--card-bg)] backdrop-blur-3xl rounded-[3rem] border border-[var(--card-border)] p-8 lg:p-10 transition-all duration-500">

          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center gap-6">
              <div className="absolute left-7 pointer-events-none z-20">
                {isAnalyzing ? (
                  <Loader2 className="w-7 h-7 text-[var(--accent-primary)] animate-spin" />
                ) : (
                  <Search className="w-7 h-7 text-[var(--site-text-muted)] group-focus-within/widget:text-[var(--accent-primary)] transition-colors opacity-40" />
                )}
              </div>

              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (showSuggestions) setShowSuggestions(false);
                }}
                placeholder="What do you want to learn today?"
                className="w-full pl-18 pr-40 py-7 text-lg md:text-xl font-bold bg-[var(--site-text)]/5 border-2 border-transparent rounded-[2rem] focus:border-[var(--accent-primary)]/30 focus:bg-[var(--site-text)]/[0.08] outline-none transition-all placeholder:text-[var(--site-text-muted)] placeholder:opacity-30 text-[var(--site-text)]"
              />

              <button
                type="submit"
                disabled={!query.trim() || isAnalyzing}
                className="absolute right-4 px-10 py-5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-black rounded-[1.5rem] hover:shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-xs uppercase tracking-[0.2em] btn-tactile shadow-xl transition-all"
              >
                <Sparkles size={18} strokeWidth={2.5} />
                <span className="hidden md:inline">Search</span>
              </button>
            </div>

            {/* Quick Suggestions Matrix */}
            {!showSuggestions && query === '' && (
              <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-center text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.4em] mb-6 opacity-40">Popular Searches</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  {quickSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-6 py-3 text-[11px] font-black bg-[var(--site-text)]/5 text-[var(--site-text-muted)] border border-[var(--card-border)] rounded-2xl hover:bg-[var(--accent-primary)] hover:text-white hover:border-transparent transition-all uppercase tracking-widest btn-tactile"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showSuggestions && query.trim() !== '' && (
              <div className="mt-6 flex justify-center animate-in fade-in duration-300">
                <button
                  type="button"
                  onClick={handleShowSuggestions}
                  className="px-6 py-3 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--accent-primary)] hover:text-white transition-all flex items-center gap-3"
                >
                  <Brain size={14} strokeWidth={2.5} />
                  More Options
                </button>
              </div>
            )}
          </form>

          {/* AI Tactical Grid */}
          <AnimatePresence>
            {showSuggestions && query.trim() && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-12 overflow-hidden"
              >
                <div className="h-px bg-gradient-to-r from-transparent via-[var(--card-border)] to-transparent mb-10 opacity-50" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {isAnalyzing ? (
                    // SKELETON STATE
                    [1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-64 rounded-[2.5rem]" />
                    ))
                  ) : (
                    // ACTUAL ACTION CARDS
                    [
                      { id: 'roadmap', label: 'Learning Path', desc: 'Get a personalized roadmap', icon: Brain, col: 'indigo' },
                      { id: 'courses', label: 'Courses', desc: 'Find relevant courses', icon: BookOpen, col: 'emerald' },
                      { id: 'tools', label: 'AI Tools', desc: 'Discover helpful tools', icon: Wrench, col: 'purple' }
                    ].map((action, i) => (
                      <motion.button
                        key={action.id}
                        type="button"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                        onClick={() => handleQuickAction(action.id)}
                        className="group/btn p-8 rounded-[2.5rem] bg-[var(--site-text)]/5 border border-[var(--card-border)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--site-bg)] transition-all text-left shadow-sm hover:shadow-[var(--shadow-elite)] hover:-translate-y-2 btn-tactile"
                      >
                        <div className={`w-14 h-14 bg-${action.col}-500/10 rounded-2xl flex items-center justify-center mb-6 border border-${action.col}-500/20 group-hover/btn:scale-110 transition-transform`}>
                          <action.icon className={`w-7 h-7 text-${action.col}-500`} strokeWidth={2.5} />
                        </div>
                        <h4 className="font-black text-lg md:text-xl mb-2 text-[var(--site-text)] tracking-tighter">
                          {action.label}
                        </h4>
                        <p className="text-[11px] text-[var(--site-text-muted)] font-bold opacity-60 leading-relaxed group-hover/btn:opacity-100 transition-opacity">
                          {action.desc}
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-[var(--accent-primary)] font-black text-[9px] uppercase tracking-[0.3em] opacity-0 group-hover/btn:opacity-100 transition-all group-hover/btn:translate-x-2">
                          View <ArrowRight size={14} strokeWidth={3} />
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AMBIENT GLOW SYSTEM */}
      <div className="absolute inset-0 -z-10 blur-[120px] opacity-20 group-focus-within/widget:opacity-40 transition-opacity duration-1000">
        <div className="absolute top-1/2 left-1/4 w-1/3 h-1/2 bg-indigo-500 rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/2 bg-blue-600 rounded-full animate-pulse delay-700" />
      </div>
    </div>
  );
}
