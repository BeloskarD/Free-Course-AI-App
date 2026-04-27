'use client';
import { Github, Code, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ProjectCard({ project, onClick }) {
  const { isMounted } = useTheme();

  const difficultyColors = {
    Beginner: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    Intermediate: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    Advanced: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    if (onClick) onClick();
  };

  if (!isMounted) {
    return (
      <div className="h-[400px] rounded-[3rem] bg-[var(--site-text)]/5 animate-pulse" />
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative h-full card-elite p-6 sm:p-8 flex flex-col transition-all duration-500 hover:-translate-y-2 !bg-[var(--card-bg)] border-[var(--card-border)] cursor-pointer"
    >
      {/* GitHub Brand Header - Elite Rendering */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-300 flex items-center justify-center group-hover:scale-110 group-hover:rotate-[8deg] transition-all duration-500 shadow-xl shadow-black/10 dark:shadow-white/5 border border-white/10 flex-shrink-0">
          <Github className="w-7 h-7 sm:w-8 sm:h-8 text-white dark:text-neutral-900" />
        </div>
        <div className={`px-4 py-2 rounded-xl border text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-sm ${difficultyColors[project.difficulty] || difficultyColors.Beginner}`}>
          {project.difficulty} Protocol
        </div>
      </div>

      {/* Project Content - Flex grow to push CTA to bottom */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-xl sm:text-2xl font-black text-[var(--site-text)] group-hover:text-[var(--accent-primary)] transition-colors duration-500 tracking-tight leading-[1.25] line-clamp-2 mb-4">
          {project.title}
        </h3>

        <p className="text-sm font-bold text-[var(--site-text-muted)] line-clamp-3 leading-relaxed opacity-70 mb-6">
          {project.description}
        </p>

        {/* Elite Skills Bar */}
        {project.skills && project.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.skills.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[var(--site-text)]/5 text-[var(--site-text-muted)] border border-[var(--card-border)] rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 group-hover:border-[var(--accent-primary)]/30 group-hover:text-[var(--accent-primary)] group-hover:bg-[var(--site-text)]/10"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Elite Engineering CTA - Always at bottom */}
      <div className="mt-auto pt-4">
        <button className="w-full px-5 py-4 sm:px-6 sm:py-5 bg-[var(--site-text)] text-[var(--card-bg)] font-black rounded-xl sm:rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 btn-tactile">
          <Code size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
          Architect Base
          <ExternalLink size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500 opacity-60" />
        </button>
      </div>
    </div>
  );
}
