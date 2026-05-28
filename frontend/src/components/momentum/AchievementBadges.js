'use client';
import { useMemo } from 'react';
import Surface from '../ui/Surface';
import {
  Award,
  Trophy,
  Flame,
  Zap,
  Target,
  BookOpen,
  Star,
  Crown,
  Rocket,
  Medal,
  TrendingUp,
  Calendar,
  Clock,
  Lock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

// Achievement types with icons
const ACHIEVEMENT_ICONS = {
  milestone: Trophy,
  streak: Flame,
  speed: Zap,
  completion: Target,
  collection: BookOpen,
  excellence: Star,
  mastery: Crown,
  innovation: Rocket,
  dedication: Medal,
  growth: TrendingUp,
  consistency: Calendar,
  endurance: Clock,
  default: Award,
};

// Achievement rarity levels
const RARITY_CONFIG = {
  common: {
    gradient: 'from-slate-400 to-slate-600',
    glow: 'shadow-slate-500/10',
    border: 'border-slate-200 dark:border-slate-700/50',
    textColor: 'text-slate-600 dark:text-slate-300',
    label: 'Common',
  },
  rare: {
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/20',
    border: 'border-blue-200 dark:border-blue-700/50',
    textColor: 'text-blue-700 dark:text-blue-300',
    label: 'Rare',
  },
  epic: {
    gradient: 'from-purple-500 to-pink-600',
    glow: 'shadow-purple-500/20',
    border: 'border-purple-200 dark:border-purple-700/50',
    textColor: 'text-purple-700 dark:text-purple-300',
    label: 'Epic',
    icon: Sparkles
  },
  legendary: {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    glow: 'shadow-orange-500/30',
    border: 'border-amber-200 dark:border-amber-700/50',
    textColor: 'text-amber-700 dark:text-amber-300',
    label: 'Legendary',
    icon: Crown
  },
};

export default function AchievementBadges({ achievements, tier, entitlements }) {
  // Process achievements
  const processedAchievements = useMemo(() => {
    if (!achievements || !Array.isArray(achievements) || achievements.length === 0) {
      return generateMockAchievements();
    }

    return achievements.sort((a, b) => {
      // Sort: unlocked first, then by rarity
      if (a.unlocked !== b.unlocked) return b.unlocked ? 1 : -1;
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }, [achievements]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = processedAchievements.length;
    const unlocked = processedAchievements.filter(a => a.unlocked).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    const legendary = processedAchievements.filter(a => a.unlocked && a.rarity === 'legendary').length;
    const epic = processedAchievements.filter(a => a.unlocked && a.rarity === 'epic').length;
    const rare = processedAchievements.filter(a => a.unlocked && a.rarity === 'rare').length;

    return { total, unlocked, percentage, legendary, epic, rare };
  }, [processedAchievements]);

  return (
    <div className="space-y-6">
      <div className="relative group p-1 rounded-[4rem] bg-gradient-to-br from-[var(--card-border)] via-transparent to-[var(--card-border)] shadow-2xl">
        <Surface className="p-8 md:p-12 rounded-[3.8rem] bg-[var(--card-bg)]/60 backdrop-blur-3xl border border-[var(--card-border)]">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 relative z-10">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black text-[var(--site-text)] tracking-tighter flex items-center gap-4">
                Trophy <span className="text-gradient-elite">Room</span>
              </h2>
              <p className="text-sm font-bold text-[var(--site-text-muted)] opacity-70">
                Celebrate your learning milestones and skill mastery.
              </p>
            </div>

            <div className="flex items-center gap-6 bg-[var(--site-text)]/[0.03] p-4 rounded-3xl border border-[var(--card-border)]">
              <div className="text-center px-4 border-r border-[var(--card-border)]">
                <span className="block text-2xl font-black text-[var(--site-text)]">{stats.unlocked}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--site-text-muted)]">Unlocked</span>
              </div>
              <div className="text-center px-4">
                <span className="block text-2xl font-black text-indigo-500">{stats.percentage}%</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--site-text-muted)]">Progress</span>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
            {processedAchievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.id || index}
                achievement={achievement}
                index={index}
              />
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function AchievementCard({ achievement, index }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.type] || ACHIEVEMENT_ICONS.default;
  const rarityConfig = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common;
  const isLocked = !achievement.unlocked;

  const getAspirationalCopy = () => {
    if (achievement.rarity === 'legendary') return 'Your trajectory indicates elite growth potential.';
    if (achievement.rarity === 'epic') return 'Advanced milestones adapt to high-performance learning patterns.';
    return 'The parameters for this milestone remain undisclosed.';
  };

  const getAspirationalTitle = () => {
    if (achievement.rarity === 'legendary') return 'Elite Progression';
    if (achievement.rarity === 'epic') return 'Growth Pattern';
    return 'Restricted Data';
  };

  return (
    <div
      className={`relative p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 group cursor-default perspective-1000 ${isLocked
        ? 'bg-[var(--card-bg)] border-[var(--card-border)] opacity-75 hover:opacity-100 shadow-sm'
        : `bg-[var(--card-bg)] ${rarityConfig.border} shadow-lg ${rarityConfig.glow} hover:shadow-xl`
        } overflow-hidden`}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Subtle background tint for unlocked cards */}
      {!isLocked && (
        <div className={`absolute inset-0 bg-gradient-to-br ${rarityConfig.gradient} opacity-[0.04] dark:opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.08] dark:group-hover:opacity-20`} />
      )}

      <div className="relative z-10">
        {/* Icon & Rarity Indicator */}
        <div className="flex justify-between items-start mb-6">
          <div
            className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-md transition-all duration-500 ${isLocked
              ? 'bg-[var(--site-text)]/5 text-[var(--site-text-muted)] opacity-50'
              : `bg-gradient-to-br ${rarityConfig.gradient} group-hover:scale-110 group-hover:rotate-6 ring-2 ring-white/20`
              }`}
          >
            {isLocked ? (
              <Lock size={28} strokeWidth={2} />
            ) : (
              <Icon size={32} className="text-white drop-shadow-md" strokeWidth={1.5} />
            )}
          </div>

          {!isLocked && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--site-bg)] border ${rarityConfig.border} shadow-sm`}>
              {rarityConfig.icon ? <rarityConfig.icon size={12} className={rarityConfig.textColor} /> : <Star size={12} className={rarityConfig.textColor} />}
              <span className={`text-[9px] font-black uppercase tracking-widest ${rarityConfig.textColor}`}>
                {rarityConfig.label}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className={`text-xl font-black mb-2 leading-tight ${isLocked ? 'text-[var(--site-text-muted)]' : 'text-[var(--site-text)]'
          }`}>
          {isLocked ? getAspirationalTitle() : achievement.title}
        </h4>

        {/* Description */}
        <p className={`text-sm font-semibold mb-6 leading-relaxed ${isLocked ? 'text-[var(--site-text-muted)] opacity-60 italic' : 'text-[var(--site-text-muted)]'
          }`}>
          {isLocked ? getAspirationalCopy() : achievement.description}
        </p>

        {/* Progress / Date */}
        {isLocked && achievement.progress !== undefined ? (
          <div className="space-y-2 mt-auto pt-4 border-t border-[var(--card-border)]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-widest truncate">
                Sync Progress
              </span>
              <span className="text-[10px] font-black text-[var(--site-text-muted)] shrink-0">
                {achievement.progress}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-[var(--site-text)]/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--site-text-muted)] opacity-30 rounded-full transition-all duration-1000 ease-in-out"
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        ) : !isLocked ? (
          <div className="space-y-4 mt-auto pt-4 border-t border-[var(--card-border)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Protocol Secured
                </p>
                <p className="text-[11px] font-bold text-[var(--site-text-muted)]">
                  {achievement.unlockedDate}
                </p>
              </div>
            </div>

            {achievement.reward && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--site-text)]/5`}>
                <Award size={14} className="text-amber-500" />
                <span className="text-[10px] font-black text-[var(--site-text)] uppercase tracking-widest">
                  +{achievement.reward}
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Helper function
function generateMockAchievements() {
  return [
    {
      id: 1,
      title: 'First Steps',
      description: 'Complete your first course',
      type: 'milestone',
      rarity: 'common',
      unlocked: true,
      unlockedDate: '1 week ago',
      reward: '+10 XP',
    },
    {
      id: 2,
      title: '7-Day Streak',
      description: 'Learn for 7 consecutive days',
      type: 'streak',
      rarity: 'rare',
      unlocked: true,
      unlockedDate: '3 days ago',
      reward: '+50 XP',
    },
    {
      id: 3,
      title: 'Speed Learner',
      description: 'Complete 5 courses in one week',
      type: 'speed',
      rarity: 'epic',
      unlocked: true,
      unlockedDate: '2 days ago',
      reward: '+100 XP',
    },
    {
      id: 4,
      title: 'JavaScript Master',
      description: 'Reach 90% mastery in JavaScript',
      type: 'mastery',
      rarity: 'legendary',
      unlocked: false,
      progress: 75,
    },
    {
      id: 5,
      title: 'Bookworm',
      description: 'Complete 10 courses',
      type: 'collection',
      rarity: 'rare',
      unlocked: false,
      progress: 60,
    },
    {
      id: 6,
      title: 'Dedication',
      description: 'Spend 100 hours learning',
      type: 'dedication',
      rarity: 'epic',
      unlocked: false,
      progress: 42,
    },
    {
      id: 7,
      title: 'Early Bird',
      description: 'Complete 5 courses before 9 AM',
      type: 'consistency',
      rarity: 'rare',
      unlocked: false,
      progress: 20,
    },
    {
      id: 8,
      title: 'Perfectionist',
      description: 'Score 100% on 3 quizzes',
      type: 'excellence',
      rarity: 'epic',
      unlocked: false,
      progress: 33,
    },
  ];
}
