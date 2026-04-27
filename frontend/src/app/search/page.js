// import AppContainer from "../../components/AppContainer";
// import AISearchClient from "./AISearchClient";

// export const metadata = {
//   title: "AI Course Search",
// };

// export default function SearchPage() {
//   return (
//     <AppContainer>
//       <AISearchClient />
//     </AppContainer>
//   );
// }


'use client';

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import SectionHeader from "../../components/ui/SectionHeader";
import CourseCard from "../../components/CourseCard";
import Surface from "../../components/ui/Surface";
import { api } from "../../services/api"; // Updated to use the common API utility
import { Sparkles, Map, Globe, Cpu, Loader2, ArrowRight, CheckCircle2, Clock, CheckCircle } from "lucide-react";

function SearchPageContent() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleSearch = useCallback(async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    
    setLoading(true);
    try {
      const res = await api.aiSearch(q);
      setData(res.data);
    } catch (error) {
      console.error("AI Search Error:", error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Handle URL parameters on mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, [searchParams, handleSearch]);

  const onFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* --- HERO SEARCH SECTION --- */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <SectionHeader
          title="AI Learning Architect"
          subtitle="Describe your learning goal (e.g., 'Master React' or 'Become a Data Scientist') and let AI build your custom path."
        />

        {/* Zero-Confusion Mission Banner */}
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/5 border border-blue-500/10 text-[var(--accent-primary)] text-xs font-bold uppercase tracking-widest animate-fade-in">
          <CheckCircle2 size={14} className="animate-pulse" />
          Zero-Confusion Mission: Direct Learning Paths Only
        </div>

        <form onSubmit={onFormSubmit} className="mt-12 relative group max-w-2xl mx-auto">
          {/* Subtle Ambient Glow behind textarea */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />

          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="w-full p-8 rounded-[2rem] bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transition-all text-lg font-bold resize-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              placeholder="Architect your trajectory (e.g., 'Master 2026 AI Engineering')"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute bottom-4 right-4 px-8 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-xl border border-white/10 dark:border-black/5"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} className="text-blue-500" /> Generate</>}
            </button>
          </div>
        </form>
      </div>

      {/* --- LOADING STATE --- */}
      {loading && (
        <div className="py-20 text-center animate-pulse">
          <Sparkles className="mx-auto text-blue-500 mb-4" size={40} />
          <p className="text-xl font-bold text-neutral-700 dark:text-neutral-300">Architecting your personalized roadmap...</p>
        </div>
      )}

      {/* --- RESULTS AREA --- */}
      {data && (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-700">

          {/* 1. THE ROADMAP */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600"><Map size={24} /></div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Your Learning Journey</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.roadmap.map((step, i) => (
                <Surface key={i} className="p-6 relative border-[var(--card-border)] rounded-3xl bg-[var(--card-bg)] backdrop-blur-sm group hover:border-[var(--accent-primary)]/40 transition-all shadow-xl shadow-[var(--accent-primary)]/5">
                  <span className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-indigo-500/30 ring-4 ring-[var(--card-bg)]">
                    {i + 1}
                  </span>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 text-[var(--accent-primary)] text-[11px] font-black uppercase tracking-[0.2em]">
                       <Clock size={12} strokeWidth={3} />
                       {step.duration || 'Flexible'}
                    </div>
                    
                    <h3 className="font-black text-xl text-[var(--site-text)] leading-tight tracking-tight">
                        {step.phase}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                        {step.skills?.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-black border border-[var(--accent-primary)]/20 uppercase tracking-wider">
                                {skill}
                            </span>
                        ))}
                    </div>

                    <div className="pt-5 mt-5 border-t border-[var(--card-border)]">
                        <div className="flex items-center gap-3 text-[var(--site-text-muted)] group-hover:text-emerald-500 transition-all">
                            <CheckCircle size={16} strokeWidth={2.5} />
                            <span className="text-[11px] font-black uppercase tracking-[0.1em]">{step.milestone}</span>
                        </div>
                    </div>
                  </div>
                </Surface>
              ))}
            </div>
          </section>

          {/* 2. RECOMMENDED COURSES */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"><Globe size={24} /></div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">World-Class Resources</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-8">
              {data.courses.map((course, i) => (
                <CourseCard key={i} course={course} className="cursor-pointer hover:scale-[1.02] transition-transform duration-300" />
              ))}
            </div>
          </section>

          {/* 3. AI TOOLS SECTION */}
          <section className="bg-[var(--card-bg)]/40 p-8 sm:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-[var(--card-border)] shadow-inner relative overflow-hidden group/tools">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/10">
                  <Cpu size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-[var(--site-text)] tracking-tight">AI Tools Hub</h2>
                  <p className="text-sm font-bold text-[var(--site-text-muted)] opacity-60">Architectural essentials for your trajectory</p>
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.tools.map((tool, i) => (
                  <Surface key={i} className="p-6 border-[var(--card-border)] rounded-3xl hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all group/card bg-[var(--card-bg)] cursor-pointer">
                    <div className="flex flex-col gap-5">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover/card:scale-110 group-hover/card:bg-purple-500 group-hover/card:text-white transition-all duration-500">
                        <Sparkles size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-[var(--site-text)] leading-tight group-hover/card:text-purple-500 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-[13px] font-bold text-[var(--site-text-muted)] mt-3 leading-relaxed opacity-70 group-hover/card:opacity-100 transition-opacity">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
