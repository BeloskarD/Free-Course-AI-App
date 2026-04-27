'use client';
import { Globe, ShieldCheck, Activity, Cpu, Database, Twitter, Github, Linkedin, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { isMounted } = useTheme();

  if (!isMounted) return <footer className="h-64 bg-[var(--site-bg)]" />;

  return (
    <footer className="relative border-t border-[var(--card-border)] bg-[var(--site-bg)] transition-colors duration-500 overflow-hidden" role="contentinfo" aria-label="Site footer">
      {/* Extreme Elite Ambient Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-12">

          {/* 1. BRAND & MISSION CONTROL */}
          <div className="lg:col-span-5 space-y-8">
            <div className="flex flex-col items-start gap-1">
              {/* Larger Responsive Logo */}
              <img
                src="/zeeklect-logo.png"
                alt="Zeeklect - AI Learning Platform"
                className="
                  h-[80px] sm:h-[90px] md:h-[105px] lg:h-[120px] xl:h-[140px] w-auto
                  object-contain object-left flex-shrink-0
                  rounded-xl sm:rounded-2xl lg:rounded-3xl
                  origin-left
                  transition-transform duration-300 ease-out
                  hover:scale-[1.05] hover:drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]
                "
                loading="lazy"
              />
              <div className="pl-4 sm:pl-5 lg:pl-6">
                <p className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] font-black uppercase tracking-[0.35em] text-[var(--site-text-muted)] opacity-80">Seek Intelligence</p>
              </div>
            </div>

            <p className="text-[var(--site-text-muted)] font-bold text-lg leading-relaxed max-w-md">
              The world's first AI-native knowledge platform. Synchronizing human potential with the 2026 global technology landscape in real-time.
            </p>

            {/* ELITE SYSTEM STATUS MODULE */}
            <div className="inline-flex flex-col gap-5 p-8 rounded-[2.5rem] card-elite bg-[var(--site-text)]/5 border border-[var(--card-border)] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <span className="text-[11px] font-black text-[var(--site-text)] uppercase tracking-widest">
                  Network Status: <span className="text-emerald-500">Optimal Sync</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-[var(--site-text-muted)]">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)]">
                  <Activity size={14} className="text-blue-500" /> 18ms Latency
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)]">
                  <Database size={14} className="text-indigo-500" /> 2.4TB AI Index
                </span>
              </div>
            </div>
          </div>

          {/* 2. DYNAMIC LINKS */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-12">
            <div>
              <h4 className="text-[11px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--accent-primary)]" />
                Platform
              </h4>
              <ul className="space-y-5 text-[15px] font-bold">
                <li><a href="/ai-intelligence" className="text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all flex items-center gap-2 group">AI Search <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--accent-primary)]" /></a></li>
                <li><a href="/skill-analysis" className="text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all flex items-center gap-2 group">Skill Analysis <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--accent-primary)]" /></a></li>
                <li><a href="/momentum" className="text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all flex items-center gap-2 group">My Momentum <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--accent-primary)]" /></a></li>
                <li><a href="/youtube" className="text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all flex items-center gap-2 group">YouTube Learn <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--accent-primary)]" /></a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.4em] mb-8">Ecosystem</h4>
              <ul className="space-y-5 text-[15px] font-bold">
                <li><a href="/courses" className="text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all">Course Library</a></li>
                <li><a href="/ai-tools" className="text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all">AI Toolkit</a></li>
                <li><a href="/dashboard" className="text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all">Power Panel</a></li>
                <li className="pt-4 flex gap-4">
                  <a href="#" className="w-11 h-11 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)] flex items-center justify-center hover:bg-[var(--accent-primary)] hover:text-white transition-all hover:scale-110 active:scale-95 shadow-sm"><Twitter size={20} /></a>
                  <a href="#" className="w-11 h-11 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)] flex items-center justify-center hover:bg-[var(--accent-primary)] hover:text-white transition-all hover:scale-110 active:scale-95 shadow-sm"><Github size={20} /></a>
                </li>
              </ul>
            </div>
          </div>

          {/* 3. LEGAL & TRUST */}
          <div className="lg:col-span-2">
            <div className="p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/10 shadow-inner">
              <ShieldCheck className="text-indigo-600 dark:text-indigo-400 mb-4" size={24} />
              <p className="text-[11px] font-black text-[var(--site-text)] uppercase tracking-wider leading-relaxed mb-4">
                Quantum-grade data encryption.
              </p>
              <p className="text-[10px] font-bold text-[var(--site-text-muted)] opacity-60 leading-relaxed uppercase tracking-tighter">
                Compliant with ISO 2026 AI Ethics protocol.
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM GLOBAL BAR */}
        <div className="mt-24 pt-10 border-t border-[var(--card-border)] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em]">
              © {currentYear} ZEEKLECT • SEEK INTELLIGENCE
            </p>
          </div>
          <div className="flex gap-10 text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest">
            <a href="#" className="hover:text-[var(--site-text)] transition-colors">Security Protocol</a>
            <a href="#" className="hover:text-[var(--site-text)] transition-colors">Terms of Nexus</a>
            <span className="text-[var(--accent-primary)] font-black">MUMBAI HQ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Added missing import
import { ArrowRight } from 'lucide-react';
