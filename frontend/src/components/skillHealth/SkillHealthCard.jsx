'use client';
import { useState } from 'react';
import {
    Heart,
    HeartPulse,
    AlertTriangle,
    AlertCircle,
    Trophy,
    Zap,
    Clock,
    ChevronRight,
    Flame,
    Award,
    Shield,
    Star
} from 'lucide-react';
import { humanizeSkillName } from '../../utils/stringUtils';

// Health status configurations
const HEALTH_STATUS = {
    healthy: {
        color: 'from-emerald-500 to-teal-500',
        bgLight: 'bg-emerald-50',
        bgDark: 'dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        icon: Heart,
        label: 'Healthy',
        ringColor: '#10b981'
    },
    dormant: {
        color: 'from-blue-500 to-cyan-500',
        bgLight: 'bg-blue-50',
        bgDark: 'dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        icon: Clock,
        label: 'Dormant',
        ringColor: '#3b82f6'
    },
    warning: {
        color: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        bgDark: 'dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        icon: AlertTriangle,
        label: 'Warning',
        ringColor: '#f59e0b'
    },
    critical: {
        color: 'from-red-500 to-pink-500',
        bgLight: 'bg-red-50',
        bgDark: 'dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        icon: AlertCircle,
        label: 'Critical',
        ringColor: '#ef4444'
    }
};

// Badge configurations
const BADGE_CONFIG = {
    bronze: { color: 'from-amber-600 to-amber-800', icon: Award, days: 30 },
    silver: { color: 'from-slate-400 to-slate-600', icon: Shield, days: 60 },
    gold: { color: 'from-yellow-400 to-amber-500', icon: Trophy, days: 90 },
    platinum: { color: 'from-violet-400 to-purple-600', icon: Star, days: 180 }
};

export default function SkillHealthCard({
    skill,
    onTakeChallenge,
    isCompact = false
}) {
    const [isHovered, setIsHovered] = useState(false);

    const healthScore = skill.health?.score ?? 100;
    const status = skill.health?.status || 'healthy';
    const streak = skill.health?.streak || 0;
    const daysSince = skill.health?.daysSinceLastPractice || 0;
    const badge = skill.proof?.badgeLevel;

    const statusConfig = HEALTH_STATUS[status] || HEALTH_STATUS.healthy;
    const StatusIcon = statusConfig.icon;
    const badgeConfig = badge ? BADGE_CONFIG[badge] : null;
    const BadgeIcon = badgeConfig?.icon;

    // SVG Ring calculations - smaller on mobile
    const size = isCompact ? 70 : 80;
    const strokeWidth = isCompact ? 5 : 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const healthOffset = circumference - (healthScore / 100) * circumference;

    return (
        <div
            className={`group relative rounded-[2.5rem] ${isCompact ? 'p-6' : 'p-8'} 
                bg-[var(--card-bg)] border border-[var(--card-border)] 
                hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/25
                hover:-translate-y-2 transition-all duration-700 cursor-pointer overflow-hidden
                min-h-[220px] w-full flex flex-col justify-between shadow-[var(--shadow-elite)]`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onTakeChallenge?.(skill)}
        >
            {/* Elite Hover Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${statusConfig.color} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-1000`} />
            
            {/* Absolute Decorative Pulse (only for critical) */}
            {status === 'critical' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
            )}

            {/* MAIN CONTENT STACK: Zero-Collision Header */}
            <div className="relative z-10 space-y-5">
                {/* Title Row: 100% Horizontal Space */}
                <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--site-text)] tracking-tighter leading-tight group-hover:text-indigo-500 transition-colors">
                    {humanizeSkillName(skill.name)}
                </h4>
                
                {/* Metrics Pill Row: Responsive and Non-Colliding */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Pill */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl shadow-inner border border-current/10 ${statusConfig.bgLight} ${statusConfig.bgDark}`}>
                        <StatusIcon size={14} className={statusConfig.text} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${statusConfig.text}`}>
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Health % Pill */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border border-[var(--card-border)] bg-[var(--site-text)]/[0.03]`}>
                        <Zap size={14} className={statusConfig.text} />
                        <span className="text-[10px] font-black text-[var(--site-text)] tracking-widest uppercase">
                            Health: {healthScore}%
                        </span>
                    </div>

                    {/* Streak Pill */}
                    {streak > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/10">
                            <Flame size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black tracking-widest uppercase">
                                {streak} Day Streak
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Visual Health Indicator (Bottom Line) */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--site-text)]/[0.03] overflow-hidden">
                <div 
                    className={`h-full bg-gradient-to-r ${statusConfig.color} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.2)]`}
                    style={{ width: `${healthScore}%` }}
                />
            </div>

            {/* FOOTER: Sustainability & Action */}
            {!isCompact && (
                <div className="relative z-10 space-y-5 border-t border-[var(--site-text)]/[0.04] pt-6 mt-2">
                    {/* Baseline Stats */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.2em] mb-1 opacity-50">
                                Sustainability Baseline
                            </span>
                            <span className="text-sm font-bold text-[var(--site-text)] flex items-center gap-2">
                                {daysSince === 0 ? 'Practiced today' : `${daysSince} days ago`}
                                {daysSince > 10 && <AlertTriangle size={14} className="text-red-500 animate-bounce" />}
                            </span>
                        </div>
                        
                        {/* Status Label (Repositioned for better balance) */}
                        <div className={`px-3 py-1 rounded-xl shadow-inner ${statusConfig.bgLight} ${statusConfig.bgDark}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${statusConfig.text}`}>
                                {statusConfig.label}
                            </span>
                        </div>
                    </div>

                    {/* Full Width Action Button - No longer squashed */}
                    <div className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r ${statusConfig.color} px-6 py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-current/10 transition-all duration-500 hover:scale-[1.02] active:scale-95 group-hover:shadow-[statusConfig.ringColor] 
                        ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
                        <Zap size={16} fill="currentColor" />
                        Practice Skill
                        <ChevronRight size={16} strokeWidth={3} />
                    </div>
                </div>
            )}

            {/* Critical Outer Glow */}
            {status === 'critical' && (
                <div className="absolute inset-0 rounded-[2.5rem] border-4 border-red-500/20 animate-pulse pointer-events-none" />
            )}
        </div>
    );
}
