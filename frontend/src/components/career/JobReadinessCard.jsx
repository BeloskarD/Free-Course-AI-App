import { useState } from 'react';
import { Target, ChevronRight, Lock } from 'lucide-react';
import { useUpgradeModal } from '../../hooks/useUpgradeModal';

export const JobReadinessCard = ({ readinessScore, targetRole, tier = 'free' }) => {
  const { openModal } = useUpgradeModal();

  const handleLockedClick = () => {
    openModal({
      featureName: 'Readiness Action Plan',
      upgradeHint: 'Get your exact, step-by-step action plan to become job-ready faster.',
      targetTier: 'career_plus'
    });
  };

  const isPro = tier === 'pro' || tier === 'career_plus';
  const isCareerPlus = tier === 'career_plus';

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-8">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl" />
      
      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Target size={28} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[var(--site-text)] tracking-tight">Job Readiness</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">{targetRole || "Career Target"}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-5xl font-black text-[var(--site-text)] tracking-tighter">{readinessScore}%</span>
          </div>
        </div>

        {/* Level 1: Free (Score only, rest is locked) */}
        {!isPro && (
          <div 
            onClick={handleLockedClick}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 transition-all hover:bg-indigo-500/10"
          >
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[var(--card-bg)]/80 via-[var(--card-bg)]/50 to-[var(--card-bg)]/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 z-20">
              <span className="flex items-center gap-2 rounded-xl bg-[var(--site-text)] px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--site-bg)]">
                <Lock size={14} /> Unlock Insights
              </span>
            </div>
            <div className="space-y-4 blur-[4px] opacity-40">
              <div className="h-4 w-1/3 rounded bg-[var(--site-text)]" />
              <div className="h-2 w-full rounded bg-[var(--site-text)]" />
              <div className="h-2 w-2/3 rounded bg-[var(--site-text)]" />
            </div>
          </div>
        )}

        {/* Level 2: Pro (Skill Breakdown) */}
        {isPro && !isCareerPlus && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-[var(--site-text-muted)]">
                <span>Core Fundamentals</span>
                <span>80%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--site-text)]/5">
                <div className="h-full w-[80%] rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-[var(--site-text-muted)]">
                <span>Advanced Patterns</span>
                <span>40%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--site-text)]/5">
                <div className="h-full w-[40%] rounded-full bg-amber-500" />
              </div>
            </div>

            <div 
              onClick={handleLockedClick}
              className="group flex cursor-pointer items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 transition-all hover:bg-indigo-500/10"
            >
              <div className="flex items-center gap-3">
                <Lock size={16} className="text-indigo-500" />
                <span className="text-sm font-bold text-[var(--site-text)]">View Exact Action Plan</span>
              </div>
              <span className="rounded-lg bg-indigo-500 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">Career+</span>
            </div>
          </div>
        )}

        {/* Level 3: Career+ (Full Action Plan) */}
        {isCareerPlus && (
          <div className="space-y-4">
             <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--site-text)]/[0.02] p-5">
               <h4 className="text-xs font-black uppercase tracking-widest text-[var(--site-text-muted)] mb-4">Immediate Actions</h4>
               <ul className="space-y-3">
                 <li className="flex items-start gap-3">
                   <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                   <span className="text-sm font-medium leading-relaxed text-[var(--site-text)]">Complete State Management Mission (fixes your biggest gap)</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                   <span className="text-sm font-medium leading-relaxed text-[var(--site-text)]">Take 2 AI validation tests in System Design</span>
                 </li>
               </ul>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
