'use client';
import { useMemo } from 'react';
import Surface from '../ui/Surface';
import {
  TrendingUp,
  Flame,
  BookOpen,
  Clock,
  Zap,
  Target,
  Award,
  Calendar
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { StatsSkeleton } from '../ui/Skeleton';

export default function StatsCards({ data }) {
  const { isMounted } = useTheme();

  // Calculate stats from data
  const stats = useMemo(() => {
    if (!data) return null;

    return {
      velocity: {
        value: data.velocity || 0,
        label: 'Knowledge Velocity',
        tooltip: 'How many skills you are learning per week',
        icon: Zap,
        gradient: 'from-blue-600 to-indigo-600',
        bgGradient: 'from-blue-500/5 to-indigo-500/5',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        description: 'Skills / Week',
        trend: data.velocityTrend || 0,
      },
      streak: {
        value: data.currentStreak || 0,
        label: 'Learning Streak',
        tooltip: 'Days in a row you have been learning',
        icon: Flame,
        gradient: 'from-orange-500 to-rose-600',
        bgGradient: 'from-orange-500/5 to-rose-500/5',
        textColor: 'text-rose-600 dark:text-rose-400',
        description: 'Days in a Row',
        trend: null,
        maxStreak: data.maxStreak || 0,
      },
      courses: {
        value: data.totalCourses || 0,
        label: 'Courses Completed',
        tooltip: 'Total number of courses you have finished',
        icon: BookOpen,
        gradient: 'from-emerald-500 to-teal-600',
        bgGradient: 'from-emerald-500/5 to-teal-500/5',
        textColor: 'text-teal-600 dark:text-teal-400',
        description: 'Milestones Reached',
        trend: null,
      },
      hours: {
        value: data.totalHours || 0,
        label: 'Time Invested',
        tooltip: 'Total hours you have dedicated to learning',
        icon: Clock,
        gradient: 'from-purple-500 to-pink-600',
        bgGradient: 'from-purple-500/5 to-pink-500/5',
        textColor: 'text-pink-600 dark:text-pink-400',
        description: 'Hours of Focus',
        trend: null,
      },
    };
  }, [data]);

  if (!isMounted || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <StatsSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard stat={stats.velocity} />
      <StatCard stat={stats.streak} isStreak />
      <StatCard stat={stats.courses} />
      <StatCard stat={stats.hours} />
    </div>
  );
}

function StatCard({ stat, isStreak = false }) {
  const Icon = stat.icon;

  return (
    <div
      title={stat.tooltip}
      className="group relative rounded-2xl sm:rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-5 sm:p-8 flex flex-col justify-between btn-tactile transition-all duration-500 hover:border-[var(--card-hover-border)] hover:shadow-[var(--shadow-elite-hover)]"
    >
      {/* Extreme Elite Dynamic Layering */}
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl sm:rounded-[2.5rem]`} />
      <div className={`absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-br ${stat.gradient} rounded-full blur-3xl opacity-5 group-hover:opacity-20 transition-all duration-700`} />

      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-500`}>
          <Icon size={28} className="text-white" strokeWidth={2.5} />
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          <h3 className="text-4xl font-black text-[var(--site-text)] tracking-tighter">
            {stat.value}
          </h3>
          {stat.trend !== null && stat.trend !== undefined && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border bg-[var(--site-text)]/5 ${stat.trend > 0 ? 'text-emerald-500 border-emerald-500/30' : 'text-rose-500 border-rose-500/30'}`}>
              {stat.trend > 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
            </span>
          )}
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--site-text-muted)] mb-4 opacity-60 group-hover:opacity-100 transition-opacity">
          {stat.label}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between mt-4">
        <span className={`text-[10px] font-black uppercase tracking-widest ${stat.textColor} opacity-80`}>
          {stat.description}
        </span>
        {isStreak && stat.maxStreak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Award size={12} strokeWidth={3} />
            <span className="text-[10px] font-black tracking-tighter ">{stat.maxStreak} MAX</span>
          </div>
        )}
      </div>
    </div>
  );
}
