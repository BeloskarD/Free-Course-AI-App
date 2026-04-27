'use client';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api, API_BASE } from '../../services/api';
import Surface from '../ui/Surface';
import SkillHealthCard from './SkillHealthCard';
import MicroChallenge from './MicroChallenge';
import {
    HeartPulse,
    Activity,
    AlertTriangle,
    AlertCircle,
    Trophy,
    Zap,
    RefreshCw,
    Bell,
    ChevronRight,
    Sparkles,
    Heart,
    TrendingUp,
    Shield,
    X
} from 'lucide-react';

export default function SkillHealthDashboard() {
    const { token, user } = useAuth();
    const [isMountedState, setIsMountedState] = useState(false);
    const queryClient = useQueryClient();
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [showChallenge, setShowChallenge] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const apiBaseUrl = API_BASE;

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            setIsMountedState(true);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    // Fetch skill health data - stable version
    const { data: healthData, isLoading, error, refetch } = useQuery({
        queryKey: ['skillHealth', user?.id],
        queryFn: async () => {
            console.log('🩺 Fetching skill health update...');
            const response = await fetch(`${apiBaseUrl}/skill-health/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch skill health');
            return response.json();
        },
        enabled: !!token && !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        refetchOnWindowFocus: false
    });

    // Fetch notifications
    const { data: notificationsData } = useQuery({
        queryKey: ['skillHealthNotifications', user?.id],
        queryFn: async () => {
            const response = await fetch(`${apiBaseUrl}/skill-health/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json();
        },
        enabled: !!token && !!user,
        staleTime: 1000 * 60 * 5
    });

    // Recalculate mutation
    const recalculateMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${apiBaseUrl}/skill-health/calculate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to recalculate');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['skillHealth']);
            queryClient.invalidateQueries(['skillHealthNotifications']);
        }
    });

    const dashboardData = healthData?.data || healthData || {};
    const skills = dashboardData.skills || [];
    const overallHealth = dashboardData.overallHealth || 0;
    const stats = {
        critical: dashboardData.criticalCount || 0,
        warning: dashboardData.warningCount || 0,
        dormant: dashboardData.dormantCount || 0,
        healthy: dashboardData.healthyCount || 0,
        total: dashboardData.totalSkills || 0
    };
    const notifications = notificationsData?.data?.notifications || notificationsData?.notifications || [];

    // Handle challenge completion
    const handleChallengeComplete = () => {
        setShowChallenge(false);
        setSelectedSkill(null);
        queryClient.invalidateQueries(['skillHealth']);
        queryClient.invalidateQueries(['skillHealthNotifications']);
    };

    const handleTakeChallenge = (skill) => {
        setSelectedSkill(skill);
        setShowChallenge(true);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="relative group p-1 rounded-[4rem] bg-gradient-to-br from-[var(--card-border)] via-transparent to-[var(--card-border)] shadow-2xl">
                <Surface className="p-10 md:p-14 rounded-[3.8rem] bg-[var(--card-bg)]/60 backdrop-blur-3xl border border-[var(--card-border)]">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center animate-pulse">
                            <HeartPulse size={48} className="text-indigo-500 mx-auto mb-4 animate-bounce" />
                            <p className="text-[var(--site-text-muted)] font-bold">Loading Skill Health...</p>
                        </div>
                    </div>
                </Surface>
            </div>
        );
    }

    // No skills state
    if (!skills.length) {
        return (
            <div className="relative group p-1 rounded-[4rem] bg-gradient-to-br from-[var(--card-border)] via-transparent to-[var(--card-border)] shadow-2xl">
                <Surface className="p-10 md:p-14 rounded-[3.8rem] bg-[var(--card-bg)]/60 backdrop-blur-3xl border border-[var(--card-border)]">
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                            <HeartPulse size={40} className="text-indigo-500" />
                        </div>
                        <h3 className="text-2xl font-black text-[var(--site-text)] mb-2">No Skills to Track</h3>
                        <p className="text-[var(--site-text-muted)] max-w-md mx-auto">
                            Complete courses and add skills to your profile to start tracking your skill health.
                        </p>
                    </div>
                </Surface>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div id="skill-evolution-hub" className="relative group p-0.5 sm:p-1 rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] bg-gradient-to-br from-[var(--card-border)] via-transparent to-[var(--card-border)] shadow-2xl">
                    <Surface className="p-5 sm:p-8 md:p-10 lg:p-14 rounded-[1.8rem] sm:rounded-[2.8rem] md:rounded-[3.8rem] bg-[var(--card-bg)]/60 backdrop-blur-3xl border border-[var(--card-border)]">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

                        <div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 sm:mb-14">
                            <div className="space-y-2">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--site-text)] tracking-tighter leading-tight">
                                    Skill <span className="text-gradient-elite">Evolution Hub</span>
                                </h2>
                                <p className="text-xs sm:text-sm font-bold text-[var(--site-text-muted)] opacity-60 tracking-widest uppercase">
                                    Real-time Mastery Tracking
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                {notifications.length > 0 && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowNotifications(!showNotifications)}
                                            className={`w-14 cursor-pointer h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${showNotifications
                                                ? 'bg-amber-500 text-white shadow-amber-500/40 rotate-12 scale-110'
                                                : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:scale-105 active:scale-95'
                                                }`}
                                        >
                                            <Bell size={24} className={showNotifications ? '' : 'animate-bounce-slow'} />
                                            {!showNotifications && (
                                                <span className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-red-500 text-white text-[11px] font-black rounded-full border-4 border-[var(--card-bg)] flex items-center justify-center shadow-lg animate-pulse z-30">
                                                    {notifications.length}
                                                </span>
                                            )}
                                        </button>

                                        {showNotifications && isMountedState && (
                                            <div
                                                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300"
                                                onClick={() => setShowNotifications(false)}
                                            >
                                                <div
                                                    className="relative z-10 w-[min(90vw,480px)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-400"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="relative bg-[var(--card-bg)] rounded-[2.5rem] border-2 border-[var(--glass-border)] shadow-[var(--shadow-elite)] overflow-hidden flex flex-col max-h-[600px]">
                                                        <div className="p-8 pb-4 flex items-center justify-between border-b border-[var(--card-border)]/5">
                                                            <div>
                                                                <h4 className="font-black text-2xl text-[var(--site-text)] tracking-tighter flex items-center gap-3">
                                                                    <Activity size={24} className="text-amber-500" />
                                                                    Health <span className="text-amber-500">Alerts</span>
                                                                </h4>
                                                            </div>
                                                            <div className="px-4 py-1.5 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-full border border-amber-500/20">
                                                                {notifications.length} NEW
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 max-h-[400px]">
                                                            {notifications.sort((a, b) => a.priority - b.priority).map((notif, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className={`group/notif relative p-5 rounded-2xl border transition-all duration-500 hover:scale-[1.02] cursor-pointer outline-none ${notif.type === 'critical'
                                                                        ? 'bg-red-500/[0.04] border-red-500/10 hover:border-red-500/40'
                                                                        : notif.type === 'warning'
                                                                            ? 'bg-amber-500/[0.04] border-amber-500/10 hover:border-amber-500/40'
                                                                            : 'bg-indigo-500/[0.04] border-indigo-500/10 hover:border-indigo-500/40'
                                                                        }`}
                                                                    onClick={() => {
                                                                        const skillObj = skills.find(s => s.name === notif.skillName);
                                                                        if (skillObj) {
                                                                            setSelectedSkill(skillObj);
                                                                            setShowChallenge(true);
                                                                            setShowNotifications(false);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="flex items-start gap-4">
                                                                        <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg ${notif.type === 'critical'
                                                                            ? 'bg-red-500/10 text-red-500'
                                                                            : notif.type === 'warning'
                                                                                ? 'bg-amber-500/10 text-amber-500'
                                                                                : 'bg-indigo-500/10 text-indigo-500'
                                                                            }`}>
                                                                            {notif.type === 'critical' ? <AlertCircle size={24} /> : notif.type === 'warning' ? <AlertTriangle size={24} /> : <Zap size={24} />}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                                                <h5 className="font-black text-sm text-[var(--site-text)] truncate tracking-tight group-hover/notif:text-amber-500 transition-colors">
                                                                                    {notif.skillName}
                                                                                </h5>
                                                                            </div>
                                                                            <p className="text-[12px] font-medium text-[var(--site-text-muted)] leading-relaxed line-clamp-2">
                                                                                {notif.message}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="p-4 border-t border-[var(--card-border)] bg-[var(--site-text)]/[0.02] text-center">
                                                            <button
                                                                onClick={() => setShowNotifications(false)}
                                                                className="px-8 py-3 bg-[var(--site-text)]/[0.04] text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em] rounded-xl hover:bg-amber-500 hover:text-white transition-all duration-300 cursor-pointer"
                                                            >
                                                                Close Alerts
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => recalculateMutation.mutate()}
                                    disabled={recalculateMutation.isPending}
                                    className="flex items-center gap-3 px-8 py-4 bg-[var(--site-text)]/[0.04] border border-[var(--card-border)] rounded-2xl hover:bg-indigo-600 text-[var(--site-text)] hover:text-white hover:border-indigo-600 transition-all duration-500 active:scale-95 group/sync shadow-sm cursor-pointer"
                                >
                                    <RefreshCw size={20} className={`${recalculateMutation.isPending ? 'animate-spin' : 'group-hover/sync:rotate-180'} transition-transform duration-1000`} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sync System</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-5 mb-10 sm:mb-12 lg:mb-16">
                            <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 md:p-4 lg:p-5 rounded-xl sm:rounded-2xl md:rounded-[1.8rem] lg:rounded-[2rem] bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.08] border border-indigo-500/20 group/overall hover:border-indigo-500/50 transition-all duration-700 hover:scale-[1.03] hover:shadow-[0_32px_64px_-16px_rgba(79,70,229,0.3)]">
                                <div className="flex items-center gap-2 md:gap-2.5">
                                    <div className="p-1.5 sm:p-2 md:p-2 rounded-lg sm:rounded-xl md:rounded-xl bg-indigo-500/10 text-indigo-500 transition-all duration-500 group-hover/overall:scale-110">
                                        <HeartPulse size={16} className="sm:w-[18px] sm:h-[18px] md:w-4 md:h-4 lg:w-5 lg:h-5" />
                                    </div>
                                    <span className="text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                                        {overallHealth}%
                                    </span>
                                </div>
                                <div className="text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.12em] sm:tracking-[0.15em] mt-1.5 sm:mt-2 opacity-70">
                                    Mastery
                                </div>
                            </div>

                            {
                                [
                                    { label: 'Mastered', count: stats.healthy, icon: Heart, color: 'emerald' },
                                    { label: 'Resting', count: stats.dormant, icon: Activity, color: 'blue' },
                                    { label: 'Fading', count: stats.warning, icon: AlertTriangle, color: 'amber' },
                                    { label: 'Needs Love', count: stats.critical, icon: AlertCircle, color: 'red' }
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 sm:p-4 md:p-4 lg:p-5 rounded-xl sm:rounded-2xl md:rounded-[1.8rem] lg:rounded-[2rem] border transition-all duration-700 hover:scale-[1.03] group/stat overflow-hidden relative cursor-default ${stat.color === 'emerald' ? 'bg-emerald-500/[0.04] border-emerald-500/10 hover:border-emerald-500/40' :
                                            stat.color === 'blue' ? 'bg-blue-500/[0.04] border-blue-500/10 hover:border-blue-500/40' :
                                                stat.color === 'amber' ? 'bg-amber-500/[0.04] border-amber-500/10 hover:border-amber-500/40' :
                                                    'bg-red-500/[0.04] border-red-500/10 hover:border-red-500/40'}`}
                                    >
                                        <div className="flex items-center gap-2 md:gap-2.5">
                                            <div className={`p-1.5 sm:p-2 md:p-2 rounded-lg sm:rounded-xl md:rounded-xl transition-all duration-500 group-hover/stat:scale-110 ${stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                                                stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                                                    stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-red-500/10 text-red-500'}`}>
                                                <stat.icon size={16} />
                                            </div>
                                            <span className={`text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-black tracking-tight ${stat.color === 'emerald' ? 'text-emerald-600' :
                                                stat.color === 'blue' ? 'text-blue-600' :
                                                    stat.color === 'amber' ? 'text-amber-600' :
                                                        'text-red-600'}`}>
                                                {stat.count}
                                            </span>
                                        </div>
                                        <div className="text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.12em] mt-1.5 opacity-70">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-10 md:gap-12 pb-20">
                            {
                                skills.map((skill, index) => (
                                    <SkillHealthCard
                                        key={skill.name || index}
                                        skill={skill}
                                        onTakeChallenge={handleTakeChallenge}
                                    />
                                ))
                            }
                        </div >
                    </Surface >
                </div >
            </div >

            {
                showChallenge && selectedSkill && (
                    <MicroChallenge
                        key={`challenge-${selectedSkill.name}`}
                        skill={selectedSkill}
                        onClose={() => setShowChallenge(false)}
                        onComplete={handleChallengeComplete}
                    />
                )
            }
        </>
    );
}
