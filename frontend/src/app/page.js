'use client';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import Link from 'next/link';
import { Sparkles, ArrowRight, Zap, PlayCircle, Bot } from 'lucide-react';

// NEW: Import homepage components
import AISearchWidget from '../components/homepage/AISearchWidget';
import PersonalizedWidget from '../components/homepage/PersonalizedWidget';
import IntentNavigator from '../components/homepage/IntentNavigator';

export default function HomePage() {
  const { user, token } = useAuth();

  // Fetch momentum data (only if logged in)
  const { data: momentumResponse } = useQuery({
    queryKey: ['momentum', user?.id],
    queryFn: () => api.getMomentumData(token),
    enabled: !!user && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch saved courses count
  const { data: savedCourses } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.getFavorites(token),
    enabled: !!user && !!token,
    staleTime: 1000 * 60 * 5,
  });

  const momentumData = momentumResponse?.data;

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-500 overflow-hidden relative">

      {/* FAQ Schema for AEO - Answer Engine Optimization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is Zeeklect?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Zeeklect is an AI-powered learning platform that provides curated courses, personalized learning roadmaps, skill gap analysis, career acceleration tools, and an AI tools directory to help professionals and students master technology skills efficiently."
                }
              },
              {
                "@type": "Question",
                "name": "Is Zeeklect free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Zeeklect offers free access to its core features including curated courses, AI-powered learning roadmaps, skill gap analysis, and career development tools."
                }
              },
              {
                "@type": "Question",
                "name": "How does Zeeklect personalize learning?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Zeeklect uses AI to analyze your current skill levels, career goals, and learning patterns to generate personalized roadmaps, recommend relevant courses, and identify skill gaps that need attention for your target roles."
                }
              },
              {
                "@type": "Question",
                "name": "What features does Zeeklect offer?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Zeeklect offers AI-powered learning roadmaps, curated course libraries, an AI tools directory with comparison features, skill gap analysis, career acceleration tools, an AI resume builder, project-based learning missions, YouTube mentor curation, and wellbeing tracking."
                }
              },
              {
                "@type": "Question",
                "name": "Can Zeeklect help me find a job?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Zeeklect includes an Opportunity Radar for job tracking, an AI Resume Builder for creating ATS-optimized resumes, and Career Acceleration tools that provide personalized career strategies and salary insights."
                }
              }
            ]
          })
        }}
      />

      {/* ==================== */}
      {/* SECTION 1: ENHANCED HERO */}
      {/* ==================== */}
      <section className="relative pt-8 pb-32 lg:pt-10 lg:pb-40 overflow-hidden">
        {/* Extreme Elite Ambient Background System */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[150px] rounded-full animate-pulse-elite" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/20 blur-[150px] rounded-full" />
        </div>

        <div className="container mx-auto px-6 max-w-6xl text-center relative z-10">
          {/* Elite Operational Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm text-[var(--site-text)] text-[10px] font-black tracking-[0.3em] uppercase mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Bot size={18} className="text-[var(--accent-primary)] animate-pulse" /> AI-Powered Learning
          </div>

          {/* Elite Heading System */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-[var(--site-text)] leading-[1.1] mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Learn Without <br />
            <span className="text-gradient-elite drop-shadow-sm">Boundaries.</span>
          </h1>

          {/* Elite Subheading */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[var(--site-text-muted)] mb-16 font-bold leading-relaxed opacity-80 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            The all-in-one intelligence platform for curated roadmaps, domain AI tools, and the world&apos;s best learning resources.
          </p>

          {/* SEARCH WIDGET INTEGRATION */}
          <div className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <AISearchWidget />
          </div>

          {/* ELITE CTA SYSTEM */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Link href="/ai-intelligence" className="w-full sm:w-auto">
              <button className="w-full sm:px-14 py-6 bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-black rounded-[2.5rem] shadow-2xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 btn-tactile">
                Start Learning <Zap size={20} strokeWidth={3} />
              </button>
            </Link>
            <Link href="/youtube" className="w-full sm:w-auto">
              <button className="w-full sm:px-14 py-6 bg-[var(--card-bg)] text-[var(--site-text)] font-black rounded-[2.5rem] border-2 border-[var(--card-border)] hover:border-[var(--accent-primary)]/50 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 btn-tactile shadow-xl">
                Watch Tutorials <PlayCircle size={22} strokeWidth={2.5} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== */}
      {/* SECTION 2: PERSONALIZED WIDGET (Elite Layer) */}
      {/* ==================== */}
      {user && momentumData && (
        <section className="py-20 relative">
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="p-1 rounded-[4rem] bg-gradient-to-br from-[var(--card-border)] via-transparent to-[var(--card-border)]">
              <div className="bg-[var(--card-bg)] rounded-[3.8rem] overflow-hidden border border-[var(--card-border)] shadow-2xl p-4 md:p-8">
                <PersonalizedWidget
                  user={user}
                  momentum={momentumData}
                  savedCount={savedCourses?.length || 0}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== */}
      {/* SECTION 3: INTENT NAVIGATOR (Elite Architecture) */}
      {/* ==================== */}
      <section className="py-40 bg-[var(--site-bg)] border-t border-[var(--card-border)]">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-sm">
                  <Sparkles size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter text-[var(--site-text)]">
                  Explore Topics
                </h2>
              </div>
              <p className="text-lg md:text-xl text-[var(--site-text-muted)] font-bold italic opacity-70 leading-relaxed">
                Choose a learning path and let AI guide your journey.
              </p>
            </div>
            <Link href="/courses" className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-3 group">
              View All Courses <ArrowRight size={16} className="group-hover:translate-x-3 transition-transform duration-500" />
            </Link>
          </div>

          {/* Intent-Based Cards */}
          <div className="relative z-10">
            <IntentNavigator />
          </div>
        </div>
      </section>
    </main>
  );
}
