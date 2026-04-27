'use client';
import { useMemo, useState } from 'react';
import Surface from '../ui/Surface';
import {
  Code2,
  Palette,
  Database,
  Layers,
  Zap,
  Award,
  TrendingUp,
  ChevronRight,
  Star
} from 'lucide-react';

// Skill category icons
const CATEGORY_ICONS = {
  frontend: Palette,
  backend: Database,
  database: Database,
  devops: Layers,
  mobile: Code2,
  ai: Zap,
  default: Code2,
};

// Skill level configuration
const SKILL_LEVELS = {
  beginner: { min: 0, max: 25, label: 'Beginner', color: 'from-red-500 to-orange-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  intermediate: { min: 26, max: 50, label: 'Intermediate', color: 'from-amber-500 to-yellow-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  advanced: { min: 51, max: 75, label: 'Advanced', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  expert: { min: 76, max: 100, label: 'Expert', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
};

export default function SkillProgressBars({ skills }) {
  const [expandedSkill, setExpandedSkill] = useState(null);

  // Process and sort skills
  const processedSkills = useMemo(() => {
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return generateMockSkills();
    }

    return skills
      .map(skill => ({
        ...skill,
        level: getSkillLevel(skill.progress || 0),
        progress: skill.progress || 0, // Ensure progress is defined
      }))
      .sort((a, b) => (b.progress || 0) - (a.progress || 0));
  }, [skills]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalProgress = processedSkills.reduce((sum, s) => sum + (s.progress || 0), 0);
    const average = processedSkills.length > 0 ? (totalProgress / processedSkills.length).toFixed(0) : 0;

    const expertCount = processedSkills.filter(s => s.progress >= 76).length;
    const advancedCount = processedSkills.filter(s => s.progress >= 51 && s.progress < 76).length;

    return { average, expertCount, advancedCount, total: processedSkills.length };
  }, [processedSkills]);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 xl:gap-8">
        {[
          { label: 'Total Skills', val: stats.total, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-500/10' },
          { label: 'Avg Progress', val: `${stats.average}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { label: 'Expert Level', val: stats.expertCount, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: 'Advanced', val: stats.advancedCount, icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/10' }
        ].map((stat, i) => (
          <Surface key={i} className="p-8 rounded-[2.5rem] bg-white/50 dark:bg-white/5 border border-[var(--card-border)] hover:border-indigo-500/20 transition-all duration-500 hover:-translate-y-1.5 shadow-lg overflow-hidden backdrop-blur-md group">
            <div className="flex flex-col gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-all duration-700`}>
                <stat.icon size={22} />
              </div>
              <div>
                <div className="text-3xl font-black text-[var(--site-text)] tracking-tighter leading-none mb-2">
                  {stat.val}
                </div>
                <div className="text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em] opacity-60">
                  {stat.label}
                </div>
              </div>
            </div>
          </Surface>
        ))}
      </div>

      {/* Skills List Container */}
      <div className="relative group p-1 rounded-[4rem] bg-gradient-to-br from-[var(--card-border)] via-transparent to-[var(--card-border)] shadow-2xl">
        <Surface className="p-10 md:p-14 rounded-[3.8rem] bg-[var(--card-bg)]/60 backdrop-blur-3xl border border-[var(--card-border)] overflow-hidden">
          {/* Subtle decoration like home page widget */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div>
              <h3 className="text-4xl md:text-5xl font-black text-[var(--site-text)] tracking-tighter leading-tight mb-2">
                Active <span className="text-gradient-elite">Experience Matrix</span>
              </h3>
              <p className="text-sm font-bold text-[var(--site-text-muted)] opacity-60 tracking-wide">
                Real-time synchronization of acquired neural patterns and domain expertise.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] rounded-2xl backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-[var(--site-text)] uppercase tracking-[0.4em]">Satellite Sync Active</span>
            </div>
          </div>

          <div className="space-y-6">
            {processedSkills.map((skill, index) => (
              <SkillBar
                key={`${skill.name}-${index}`}
                skill={skill}
                index={index}
                isExpanded={expandedSkill === index}
                onToggle={() => setExpandedSkill(expandedSkill === index ? null : index)}
              />
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function SkillBar({ skill, index, isExpanded, onToggle }) {
  const Icon = CATEGORY_ICONS[skill.category?.toLowerCase()] || CATEGORY_ICONS.default;
  const levelConfig = SKILL_LEVELS[skill.level] || SKILL_LEVELS.beginner;

  return (
    <div
      className={`group cursor-pointer transition-all duration-700 rounded-[2.5rem] p-6 md:p-7 card-elite border border-[var(--card-border)] hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 relative overflow-hidden btn-tactile ${isExpanded ? 'bg-indigo-500/[0.02] dark:bg-indigo-500/5' : 'bg-[var(--card-bg)]'}`}
      onClick={onToggle}
    >
      {/* Dynamic Background Hover Layer (Home Page Style) */}
      <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none`} />

      <div className="relative z-10 flex flex-col items-start gap-4">
        {/* Header Section: Icon + Title + Progress */}
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
            {/* Elite Icon Container */}
            <div className={`relative shrink-0`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${levelConfig.color} blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000`} />
              <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${levelConfig.color} flex items-center justify-center shadow-lg shadow-${levelConfig.text.split('-')[1]}-500/20 group-hover:rotate-[8deg] group-hover:scale-105 transition-all duration-700 border border-white/10 ring-4 ring-white/5`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-md" strokeWidth={2.5} />
              </div>
            </div>

            {/* Core Info */}
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-lg md:text-xl font-black text-[var(--site-text)] tracking-tighter group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-500 truncate">
                {skill.name}
              </h4>
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <span className="text-[8px] md:text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] opacity-80 whitespace-nowrap">
                  {skill.category || 'Skill'}
                </span>
                <div className="w-1 h-1 rounded-full bg-[var(--site-text)] opacity-20 shrink-0" />
                <div className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] ${levelConfig.text} whitespace-nowrap`}>
                  {levelConfig.label}
                </div>
              </div>
            </div>
          </div>

          {/* Progress & Toggle - Right Aligned */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-3xl font-black text-[var(--site-text)] tracking-tighter">
                {skill.progress || 0}<span className="text-xs font-bold opacity-30 ml-1">%</span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-[var(--site-text)]/[0.03] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 ${isExpanded ? 'bg-indigo-600 text-white rotate-90' : 'text-neutral-400'}`}>
              <ChevronRight size={20} strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Mobile Progress Bar (Visible under header on mobile) */}
        <div className="w-full sm:hidden flex items-end justify-between gap-2 mb-1">
          <div className="text-2xl font-black text-[var(--site-text)] tracking-tighter">
            {skill.progress || 0}<span className="text-xs font-bold opacity-30">%</span>
          </div>
          <p className="text-[7px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.2em] opacity-40 mb-1">Proficiency</p>
        </div>

        {/* Elite Progress Visualization */}
        <div className="w-full relative h-3 bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden border border-[var(--card-border)] shadow-inner">
          <div
            className={`h-full bg-gradient-to-r ${levelConfig.color} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
            style={{
              width: `${skill.progress || 0}%`,
              transitionDelay: `${index * 50}ms`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
          <div className={`absolute inset-0 bg-gradient-to-r ${levelConfig.color} opacity-0 group-hover:opacity-10 transition-opacity blur-md duration-700`} />
        </div>
      </div>

      {/* Expanded Details - Elite Glassmorphism */}
      {isExpanded && (
        <div className="mt-4 p-5 sm:p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-white/5 border border-[var(--card-border)] animate-in slide-in-from-top-2 fade-in duration-500 shadow-inner overflow-hidden relative">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { label: 'Courses Done', val: skill.coursesCompleted },
              { label: 'Hours Spent', val: `${skill.hoursSpent}h` },
              { label: 'Last Practiced', val: skill.lastPracticed },
              { label: 'Next Milestone', val: skill.nextMilestone, isActive: true }
            ].map((detail, i) => detail.val && (
              <div key={i} className={`space-y-1 ${detail.isActive ? 'col-span-2 lg:col-span-1' : ''}`}>
                <p className="text-[9px] font-black !text-indigo-500 dark:!text-indigo-300 uppercase tracking-[0.2em] opacity-80">
                  {detail.label}
                </p>
                <p className="text-base sm:text-lg md:text-xl font-black tracking-tight !text-indigo-700 dark:!text-indigo-400 leading-tight drop-shadow-[0_2px_8px_rgba(99,102,241,0.25)]">
                  {detail.val}
                </p>
              </div>
            ))}
          </div>

          {skill.description && (
            <div className="mt-8 pt-6 border-t border-neutral-200/50 dark:border-white/5">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
                {skill.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
      `}</style>
    </div>
  );
}

// Helper functions
function getSkillLevel(progress) {
  if (progress >= 76) return 'expert';
  if (progress >= 51) return 'advanced';
  if (progress >= 26) return 'intermediate';
  return 'beginner';
}

function generateMockSkills() {
  return [
    {
      name: 'JavaScript',
      category: 'Frontend',
      progress: 85,
      level: 'expert',
      coursesCompleted: 8,
      hoursSpent: 42,
      lastPracticed: '2 days ago',
      nextMilestone: 'Master ES6+ features',
      description: 'Modern JavaScript programming with ES6+ features',
    },
    {
      name: 'React',
      category: 'Frontend',
      progress: 72,
      level: 'advanced',
      coursesCompleted: 5,
      hoursSpent: 28,
      lastPracticed: '1 day ago',
      nextMilestone: 'Build complex applications',
    },
    {
      name: 'Node.js',
      category: 'Backend',
      progress: 58,
      level: 'advanced',
      coursesCompleted: 4,
      hoursSpent: 20,
      lastPracticed: '3 days ago',
      nextMilestone: 'RESTful API mastery',
    },
  ];
}
