'use client';
import { ExternalLink, FileText, Code, Book, Github, Wrench } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ResourceCard({ resource, onClick }) {
  const { isMounted } = useTheme();

  const typeIcons = {
    Documentation: <Book className="w-6 h-6" />,
    Article: <FileText className="w-6 h-6" />,
    Interactive: <Code className="w-6 h-6" />,
    GitHub: <Github className="w-6 h-6" />,
    Tool: <Wrench className="w-6 h-6" />,
  };

  const typeColors = {
    Documentation: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    Article: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    Interactive: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    GitHub: 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20',
    Tool: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    if (onClick) onClick();
  };

  if (!isMounted) {
    return (
      <div className="h-32 rounded-[2.5rem] bg-[var(--site-text)]/5 animate-pulse" />
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative h-full card-elite p-7 flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 !bg-[var(--card-bg)] border-[var(--card-border)] overflow-hidden cursor-pointer"
    >
      {/* Background Accent */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="flex items-start gap-7 relative z-10">
        {/* Elite Resource Icon */}
        <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[10deg] border shadow-sm ${typeColors[resource.type] || typeColors.Documentation}`}>
          {typeIcons[resource.type] || typeIcons.Documentation}
        </div>

        {/* Resource Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-xl font-black text-[var(--site-text)] group-hover:text-[var(--accent-primary)] transition-colors duration-500 tracking-tight leading-[1.2] line-clamp-2">
              {resource.title}
            </h3>
            {resource.isPremium && (
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-black rounded-lg uppercase tracking-[0.2em] whitespace-nowrap shadow-sm">
                ELITE
              </span>
            )}
          </div>

          <p className="text-sm font-bold text-[var(--site-text-muted)] mb-6 line-clamp-2 leading-relaxed opacity-70">
            {resource.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="px-4 py-2 bg-[var(--site-text)]/5 text-[var(--site-text-muted)] border border-[var(--card-border)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group-hover:text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]/30 group-hover:bg-[var(--site-text)]/10">
              {resource.type}
            </span>
            <div className="w-11 h-11 rounded-full bg-[var(--site-text)]/5 flex items-center justify-center transition-all duration-500 group-hover:bg-[var(--accent-primary)] group-hover:text-white group-hover:scale-110 shadow-lg border border-transparent group-hover:border-white/20">
              <ExternalLink size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
