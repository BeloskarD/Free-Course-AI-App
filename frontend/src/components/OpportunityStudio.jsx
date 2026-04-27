'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import Surface from './ui/Surface';
import Skeleton from './ui/Skeleton';
import {
  Briefcase, Zap, X, ExternalLink, ShieldCheck,
  TrendingUp, Target, Rocket, BrainCircuit, ArrowRight
} from 'lucide-react';
import { isDirectCourseLink } from '../utils/linkUtils';

// SKELETON COMPONENT (Elite Implementation)
const SkeletonGrid = () => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-6 rounded-[2.2rem] bg-[var(--site-text)]/5 border border-[var(--card-border)] aspect-square flex flex-col justify-between">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-40 mb-6" />
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-[var(--site-text)]/5 rounded-[2.5rem] border border-[var(--card-border)] p-7 flex gap-5">
          <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
    <Skeleton className="h-20 w-full rounded-[2.5rem]" />
  </div>
);

export default function OpportunityStudio({ course, onClose }) {
  const courseTitle = course.title || course.name;

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights', courseTitle],
    queryFn: () => api.getCourseInsights(courseTitle),
  });

   const handleLaunch = () => {
     const officialLink = course.official_url || course.official_link || course.website;
     // Get the best available link
     const targetUrl = officialLink || course.link || course.url;
     
     // Validate that the link is a direct course link, not a search/category page
     if (targetUrl && isDirectCourseLink(targetUrl)) {
       window.open(targetUrl, '_blank', 'noopener,noreferrer');
     } else {
       // Fallback to platform root to avoid 404/blank page
       const platformRoot = course.platform?.toLowerCase().includes('udemy') ? 'https://www.udemy.com' : 'https://www.coursera.org';
       window.open(platformRoot, '_blank', 'noopener,noreferrer');
     }
   };

  return (
    <div
      className="fixed inset-0 z-[9999] flex p-4 sm:p-6 md:p-8 animate-in fade-in duration-500 overflow-hidden"
      onClick={onClose}
    >
      {/* Extreme Elite Backdrop */}
      <div className="absolute inset-0 bg-black/90 dark:bg-black/95 backdrop-blur-3xl" />

      {/* Layout Wrapper to center relative to sidebar */}
      <div className="relative w-full h-full flex items-start justify-center max-lg:pl-0 lg:pl-[var(--sidebar-offset,0px)] pt-24 pb-6 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500">
        <Surface
          className="w-full max-w-3xl h-full max-h-[85vh] flex flex-col rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* TOP AMBIENT GLOW */}
        <div className="absolute -right-40 -top-40 w-96 h-96 bg-gradient-to-br from-indigo-600 to-purple-600 opacity-20 blur-[100px] pointer-events-none" />
        <div className="absolute -left-40 -bottom-40 w-96 h-96 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-20 blur-[100px] pointer-events-none" />

        {/* PROFESSIONAL HEADER SECTION */}
        <div className="relative pt-6 sm:pt-8 pb-4 sm:pb-6 px-6 sm:px-8 border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl shrink-0 z-20">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--site-text)]/5 hover:bg-rose-500/10 flex items-center justify-center transition-all hover:rotate-90 group btn-tactile border border-[var(--card-border)] active:scale-90"
          >
            <X size={18} className="text-[var(--site-text-muted)] group-hover:text-rose-500 transition-colors" />
          </button>

          <div className="space-y-3 sm:space-y-4 pr-16 sm:pr-20">
            <div className="flex items-center gap-3">
              <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border border-indigo-500/20 shadow-sm flex items-center gap-2">
                <BrainCircuit size={10} sm={12} className="text-indigo-500" />
                Course Insights
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--card-border)] to-transparent" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--site-text)] tracking-tighter leading-tight line-clamp-1 sm:line-clamp-2">
              {courseTitle}
            </h2>
          </div>
        </div>

        {/* SCROLLABLE ANALYTICS ENGINE */}
        <div className="flex-1 overflow-y-auto premium-scroll p-5 sm:p-8 space-y-8 sm:space-y-10 scroll-smooth">
          {isLoading ? <SkeletonGrid /> : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-10">
              {/* BENTO GRID METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Market Demand', val: insights?.jobCount || '1.8k+', icon: <Briefcase size={18} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-600/10 border-blue-500/10' },
                  { label: 'Avg Entrance', val: insights?.avgSalary || 'High', icon: <Target size={18} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-500/10' },
                  { label: 'Yield Growth', val: `+${insights?.salaryBoost || '38'}%`, icon: <TrendingUp size={18} />, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-600/10 border-orange-500/10' }
                ].map((stat, i) => (
                  <div key={i} className="p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] hover:border-[var(--accent-primary)]/40 transition-all group/stat relative overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--site-text)]/[0.02] to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 sm:mb-4 group-hover/stat:scale-110 group-hover/stat:rotate-6 transition-all border shadow-sm`}>
                      {stat.icon}
                    </div>
                    <p className={`font-black text-[var(--site-text)] tracking-tighter leading-none mb-1.5 sm:mb-2 ${stat.val.length > 8 ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}`}>
                      {stat.val}
                    </p>
                    <p className="text-[8px] sm:text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.2em] leading-tight opacity-60 group-hover/stat:opacity-100 transition-opacity flex items-center gap-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* INTELLIGENCE PATCHES */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em] flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                    <Zap size={12} sm={14} className="text-amber-500 animate-pulse" />
                    Course Highlights
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-[var(--card-border)] to-transparent opacity-50" />
                </div>

                <div className="grid gap-4">
                  {(insights?.livePatch || [
                    "Advanced synchronization with neural AI frameworks and large-scale deployment protocols.",
                    "Strategic focus on low-latency compute optimization for high-availability systems.",
                    "Comprehensive mastery of global data structures and secure intelligence networking."
                  ]).slice(0, 3).map((note, i) => (
                    <div key={i} className="flex gap-4 sm:gap-6 p-5 sm:p-6 bg-[var(--site-text)]/[0.02] hover:bg-[var(--site-text)]/[0.04] rounded-[1.5rem] sm:rounded-[2rem] border border-[var(--card-border)] hover:border-indigo-500/30 transition-all group/item relative overflow-hidden">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[var(--site-bg)] text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-md border border-[var(--card-border)] group-hover/item:scale-110 transition-transform font-black text-base sm:text-lg">
                        {i + 1}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-[13px] sm:text-sm md:text-base font-bold text-[var(--site-text)] leading-relaxed tracking-tight group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors opacity-90">{note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STICKY CTA FOOTER */}
        <div className="p-4 sm:p-6 md:px-8 md:py-8 border-t border-[var(--card-border)] bg-[var(--card-bg)]/90 backdrop-blur-xl relative z-40 shrink-0">
          <button
            onClick={handleLaunch}
            className="group relative w-full py-4 sm:py-5 bg-[var(--site-text)] text-[var(--site-bg)] font-black rounded-xl sm:rounded-2xl uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] shadow-lg sm:shadow-xl hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 sm:gap-4 overflow-hidden btn-tactile border border-transparent hover:border-[var(--site-text)]/20 text-[10px] sm:text-xs md:text-sm"
          >
            <div className="relative z-10 flex items-center gap-2 sm:gap-3">
              Open Course
              <Rocket size={14} sm={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" strokeWidth={2.5} />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--site-bg)]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          </button>
        </div>
      </Surface >
      </div>
    </div >
  );
}
