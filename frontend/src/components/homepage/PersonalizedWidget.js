'use client';
import Link from 'next/link';
import Surface from '../ui/Surface';
import { Flame, BookMarked, TrendingUp, ArrowRight, Zap, Sparkles } from 'lucide-react';

export default function PersonalizedWidget({ user, momentum, savedCount }) {
  const velocity = momentum?.velocity || 0;
  const streak = momentum?.currentStreak || 0;
  const totalCourses = momentum?.totalCourses || 0;

  // Determine momentum status
  const getMomentumStatus = () => {
    if (velocity >= 2) return { text: 'Excellent', emoji: '🔥', color: 'text-rose-500', bg: 'bg-rose-500/10' };
    if (velocity >= 1) return { text: 'Productive', emoji: '🚀', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (velocity > 0) return { text: 'Active', emoji: '🌱', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    return { text: 'Ready', emoji: '💪', color: 'text-neutral-500', bg: 'bg-neutral-500/10' };
  };

  const status = getMomentumStatus();

  return (
    <div className="relative group transition-all duration-700">
      {/* EXTREME ELITE AMBIENT GLOWS - REFINED FOR BIG SCREENS */}
      <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-[var(--accent-primary)]/10 rounded-full blur-[100px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-30 animate-pulse" />
      <div className="absolute -left-20 -bottom-20 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-30" />

      {/* MAIN CONTAINER - GLASSMORPHISM 2.0 (Refined Padding) */}
      <div className="relative z-10 p-8 md:p-10 xl:p-12 rounded-[3.5rem] bg-[var(--card-bg)]/40 backdrop-blur-3xl border border-[var(--card-border)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)] transition-all duration-1000 overflow-hidden">

        {/* Subtle Inner Glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col xl:flex-row items-center justify-between gap-10 xl:gap-14">

          {/* PROFILE INTELLIGENCE SECTION */}
          <div className="flex-1 w-full space-y-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-indigo-600 blur-2xl opacity-10 group-hover:opacity-30 transition-opacity duration-1000" />
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 group-hover:rotate-[8deg] group-hover:scale-105 transition-all duration-700 border border-white/10 ring-4 ring-white/5">
                  <Zap size={32} strokeWidth={2.5} className="animate-pulse" />
                </div>
              </div>

              <div className="space-y-3 text-center md:text-left">
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.4em] opacity-80">User Profile</p>
                  <h3 className="text-xl md:text-3xl lg:text-4xl font-black text-[var(--site-text)] tracking-tighter leading-none transition-all">
                    Welcome, <span className="bg-gradient-to-r from-indigo-500 to-blue-600 bg-clip-text text-transparent">{user?.email?.split('@')[0] || 'Operator'}</span>
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] backdrop-blur-sm transition-all hover:border-indigo-500/30">
                  <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                  <span className="text-[9px] font-black text-[var(--site-text)] uppercase tracking-[0.2em]">Account Verified</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* STAT GRID - RE-ENGINEERED FOR BALANCE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 xl:gap-6">
              {[
                { label: 'Streak', val: streak, icon: <Flame size={18} />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                { label: 'Library', val: savedCount, icon: <BookMarked size={18} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Progress', val: velocity.toFixed(1), icon: <TrendingUp size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Status', val: status.text, icon: status.emoji, color: status.color, bg: status.bg, isRaw: true }
              ].map((stat, i) => (
                <div key={i} className="group/stat relative p-6 rounded-[2.5rem] bg-[var(--site-text)]/[0.02] border border-[var(--card-border)] hover:border-indigo-500/20 transition-all duration-500 hover:-translate-y-1.5 shadow-lg overflow-hidden backdrop-blur-md">
                  <div className="flex flex-col gap-3 relative z-10">
                    <div className={`w-11 h-11 rounded-1.5xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white/5 group-hover/stat:scale-105 transition-all duration-700`}>
                      {typeof stat.icon === 'string' ? <span className="text-xl">{stat.icon}</span> : stat.icon}
                    </div>
                    <div>
                      <div className={`text-xl md:text-2xl font-black text-[var(--site-text)] tracking-tighter leading-none mb-1.5 ${stat.isRaw ? 'text-xs md:text-sm uppercase tracking-widest' : ''}`}>
                        {stat.val}
                      </div>
                      <div className="text-[8px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-50">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OPERATIONAL HUB - REFINED BUTTONS */}
          <div className="w-full xl:w-72 flex flex-col gap-4 shrink-0">
            <Link href="/dashboard" className="block w-full">
              <button className="group relative w-full py-6 md:py-7 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 hover:from-indigo-700 hover:to-blue-700 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 transition-all duration-700 flex items-center justify-center gap-5 overflow-hidden btn-tactile border border-white/10">
                <span className="relative z-10 text-[10px] uppercase tracking-[0.4em]">Dashboard</span>
                <ArrowRight size={18} strokeWidth={3} className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </Link>

            <Link href="/momentum" className="block w-full">
              <button className="group w-full py-6 md:py-7 bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--card-border)] text-[var(--site-text)] font-black rounded-[2rem] hover:border-indigo-500/30 hover:bg-[var(--site-text)]/5 hover:scale-[1.02] active:scale-95 transition-all duration-700 flex items-center justify-center gap-5 shadow-lg btn-tactile">
                <span className="text-[10px] uppercase tracking-[0.4em] opacity-80 group-hover:opacity-100 transition-opacity">Momentum</span>
                <TrendingUp size={18} strokeWidth={3} className="text-indigo-500 group-hover:translate-y-[-1px] group-hover:translate-x-[1px] transition-transform duration-700" />
              </button>
            </Link>

            <p className="text-[7px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.4em] text-center opacity-30">
              Profile ID: {user?.id?.slice(-8) || 'GUEST'}
            </p>
          </div>

        </div>

        {/* Decorative Element - Circuit Pattern Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
      </div>
    </div>
  );
}
