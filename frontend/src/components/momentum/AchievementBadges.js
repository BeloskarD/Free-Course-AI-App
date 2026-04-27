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
    gradient: 'from-neutral-400 to-neutral-600',
    glow: 'shadow-neutral-500/50',
    border: 'border-neutral-300 dark:border-neutral-700',
    bg: 'from-neutral-50 to-neutral-100 dark:from-neutral-900/40 dark:to-neutral-800/40',
    textColor: 'text-neutral-700 dark:text-neutral-300',
    label: 'Common',
  },
  rare: {
    gradient: 'from-blue-400 to-blue-600',
    glow: 'shadow-blue-500/50',
    border: 'border-blue-300 dark:border-blue-700',
    bg: 'from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40',
    textColor: 'text-blue-700 dark:text-blue-300',
    label: 'Rare',
  },
  epic: {
    gradient: 'from-purple-400 to-purple-600',
    glow: 'shadow-purple-500/50',
    border: 'border-purple-300 dark:border-purple-700',
    bg: 'from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/40',
    textColor: 'text-purple-700 dark:text-purple-300',
    label: 'Epic',
  },
  legendary: {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    glow: 'shadow-orange-500/50',
    border: 'border-amber-300 dark:border-amber-700',
    bg: 'from-amber-50 to-orange-100 dark:from-amber-900/40 dark:to-orange-800/40',
    textColor: 'text-amber-800 dark:text-amber-200',
    label: 'Legendary',
    icon: Crown
  },
  epic: {
    gradient: 'from-purple-400 to-pink-600',
    glow: 'shadow-purple-500/50',
    border: 'border-purple-300 dark:border-purple-700',
    bg: 'from-purple-50 to-pink-100 dark:from-purple-900/40 dark:to-pink-800/40',
    textColor: 'text-purple-800 dark:text-purple-200',
    label: 'Epic',
    icon: Sparkles
  },
};

export default function AchievementBadges({ achievements }) {
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

    return { total, unlocked, percentage, legendary, epic };
  }, [processedAchievements]);

  return (
    <div className="space-y-6">
      {/* Achievements Container */}
      <div className="relative group p-1 rounded-[4rem] bg-gradient-to-br from-[var(--card-border)] via-transparent to-[var(--card-border)] shadow-2xl">
        <Surface className="p-10 md:p-14 rounded-[3.8rem] bg-[var(--card-bg)]/60 backdrop-blur-3xl border border-[var(--card-border)] overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-5 mb-4">
                <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shadow-sm">
                  <Trophy size={28} strokeWidth={2.5} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-[var(--site-text)] tracking-tighter leading-tight">
                  Domain <span className="text-gradient-elite">Milestones</span>
                </h2>
              </div>
              <p className="text-sm font-bold text-[var(--site-text-muted)] opacity-60 tracking-wide max-w-xl">
                Cryptographic proof of skill acquisition and operational excellence across various neural domains.
              </p>
            </div>

            <div className="flex items-center gap-6 px-8 py-5 bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] rounded-[2rem] backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-black text-amber-600">
                  {stats.unlocked}
                </div>
                <div className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                  Secured
                </div>
              </div>
              <div className="w-px h-8 bg-[var(--card-border)]" />
              <div className="text-center">
                <div className="text-2xl font-black text-[var(--site-text)]">
                  {stats.percentage}%
                </div>
                <div className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                  Velocity
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
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

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

function AchievementCard({ achievement, index }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.type] || ACHIEVEMENT_ICONS.default;
  const rarityConfig = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common;
  const isLocked = !achievement.unlocked;

  return (
    <Surface
      className={`relative p-6 md:p-8 rounded-[2.5rem] border transition-all duration-700 hover:-translate-y-3 group cursor-default perspective-1000 ${isLocked
        ? 'bg-neutral-50/50 dark:bg-neutral-900/10 border-neutral-200/50 dark:border-white/5 opacity-60 hover:opacity-100 hover:bg-neutral-100/80 dark:hover:bg-neutral-900/40'
        : `bg-gradient-to-br ${rarityConfig.bg} ${rarityConfig.border} shadow-2xl ${rarityConfig.glow} hover:shadow-indigo-500/10`
        } overflow-hidden`}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >

      {/* Background decoration */}
      {!isLocked && (
        <>
          <div className={`absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br ${rarityConfig.gradient} rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000`} />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </>
      )}

      <div className="relative z-10">
        {/* Icon & Rarity Indicator */}
        <div className="flex justify-between items-start mb-8">
          <div
            className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-700 ${isLocked
              ? 'bg-neutral-200/50 dark:bg-neutral-800/50 grayscale opacity-40'
              : `bg-gradient-to-br ${rarityConfig.gradient} group-hover:scale-110 group-hover:rotate-6 ring-4 ring-white/20`
              }`}
          >
            {isLocked ? (
              <Lock size={32} className="text-neutral-400 dark:text-neutral-500" strokeWidth={2} />
            ) : (
              <Icon size={40} className="text-white drop-shadow-2xl" strokeWidth={1.5} />
            )}
          </div>

          {!isLocked && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-sm`}>
              {rarityConfig.icon ? <rarityConfig.icon size={12} className={rarityConfig.textColor} /> : <Star size={12} className={rarityConfig.textColor} />}
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${rarityConfig.textColor}`}>
                {rarityConfig.label}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className={`text-xl font-black mb-3 leading-tight ${isLocked ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-900 dark:text-white'
          }`}>
          {isLocked ? 'Restricted Data' : achievement.title}
        </h4>

        {/* Description */}
        <p className={`text-sm font-medium mb-6 leading-relaxed ${isLocked ? 'text-neutral-300 dark:text-neutral-700 italic' : 'text-neutral-600 dark:text-neutral-400'
          }`}>
          {isLocked ? 'The parameters for this milestone remain undisclosed.' : achievement.description}
        </p>

        {/* Progress / Date */}
        {isLocked && achievement.progress !== undefined ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-black text-neutral-500 uppercase tracking-widest">
              <span>Synchronization</span>
              <span>{achievement.progress}%</span>
            </div>
            <div className="h-2 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full overflow-hidden border border-neutral-300/10">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-in-out"
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        ) : (
          !isLocked && achievement.unlockedDate && (
            <div className="flex items-center gap-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/5 w-fit px-4 py-2 rounded-xl border border-emerald-500/20">
              <CheckCircle2 size={16} />
              Protocol Secured {achievement.unlockedDate}
            </div>
          )
        )}

        {/* Reward */}
        {!isLocked && achievement.reward && (
          <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                < Award size={16} className="text-amber-600 dark:text-amber-500" />
              </div>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                {achievement.reward}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Unlock glow effect */}
      {!isLocked && (
        <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${rarityConfig.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none duration-700`} />
      )}
    </Surface>
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
