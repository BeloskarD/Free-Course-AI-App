'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { humanizeSkillName } from '../../utils/stringUtils';
import Surface from '../ui/Surface';
import { useGuardian } from '../../context/GuardianContext';
import {
    Brain,
    Target,
    Sparkles,
    ChevronRight,
    CheckCircle2,
    Circle,
    SkipForward,
    Loader2,
    TrendingUp,
    Clock,
    Zap,
    RefreshCw,
    Settings,
    BookOpen,
    Code,
    Trophy,
    ArrowRight,
    Play,
    ExternalLink,
    X
} from 'lucide-react';
import OnboardingModal from './OnboardingModal';
import SkillsGalleryModal from './SkillsGalleryModal';
import { AlertCircle, Info, Heart, BarChart3 } from 'lucide-react';

// Task type icons and colors
const TASK_TYPE_STYLES = {
    course: {
        icon: BookOpen,
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/20'
    },
    quiz: {
        icon: Brain,
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/20'
    },
    project: {
        icon: Code,
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/20'
    },
    practice: {
        icon: Zap,
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/20'
    },
    reading: {
        icon: BookOpen,
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-500/20'
    },
};

export default function LearningBrainWidget({ suppressOnboarding = false }) {
    const { user, token } = useAuth();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { intervention, dismissIntervention } = useGuardian();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showSkillsGallery, setShowSkillsGallery] = useState(false);
    const [updatingTask, setUpdatingTask] = useState(null);
    const [isStartingMission, setIsStartingMission] = useState(false);

    // Fetch learner profile
    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['learner-profile', user?.id],
        queryFn: () => api.getLearnerProfile(token),
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch skill graph
    const { data: skillsData } = useQuery({
        queryKey: ['skill-graph', user?.id],
        queryFn: () => api.getSkillGraph(token),
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
    });

    // Generate plan mutation
    const generatePlanMutation = useMutation({
        mutationFn: () => api.generateWeeklyPlan(token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learner-profile', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['skill-graph', user?.id] });
        },
        onError: (error) => {
            console.error('Plan generation failed:', error);
            alert('Failed to generate plan. Please try again later.');
        }
    });

    // Update task mutation
    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, status }) => api.updateTaskStatus(taskId, status, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learner-profile', user?.id] });
        },
        onSettled: () => {
            setUpdatingTask(null);
        }
    });

    const profile = profileData?.profile;
    const skills = skillsData?.skills?.slice(0, 6) || [];
    const topToLearn = skillsData?.topToLearn || [];
    const plan = profile?.currentPlan;
    const isOnboarded = profile?.goals?.isOnboarded;

    // 🎯 Role Readiness Calculation
    const getGoalProgress = () => {
        if (!skills || skills.length === 0) return 0;
        const topSkillsAvg = skills.slice(0, 3).reduce((acc, curr) => acc + (curr.level || 0), 0) / Math.min(skills.length, 3);
        return Math.min(100, Math.round(topSkillsAvg));
    };

    // 🛡️ Defensive rendering helper for skills
    const renderSkill = (skillData) => {
        if (!skillData) return null;
        if (typeof skillData === 'string') return humanizeSkillName(skillData);

        if (Array.isArray(skillData)) {
            const first = skillData[0];
            if (!first) return null;
            return typeof first === 'object' 
                ? humanizeSkillName(first.skill || first.name || 'Skill') 
                : humanizeSkillName(first);
        }

        if (typeof skillData === 'object') {
            const rawName = skillData.skill || skillData.name || 'Skill';
            return humanizeSkillName(rawName);
        }

        return humanizeSkillName(String(skillData));
    };

    // Show onboarding if not completed
    useEffect(() => {
        if (suppressOnboarding) {
            setShowOnboarding(false);
            return;
        }

        if (profile && !isOnboarded && !user?.onboardingComplete) {
            setShowOnboarding(true);
        }
    }, [profile, isOnboarded, suppressOnboarding, user?.onboardingComplete]);

    // Handle task status update
    const handleTaskUpdate = (taskId, status) => {
        setUpdatingTask(taskId);
        updateTaskMutation.mutate({ taskId, status });
    };

    // 🚀 Start a task
    const handleStartTask = async (task) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsStartingMission(true);
        try {
            let missionId = task.missionId;

            if (!missionId && task.type === 'course') {
                const courseData = {
                    title: task.title,
                    skill: typeof task.skill === 'object' ? task.skill.skill : task.skill,
                    link: task.resourceUrl || '',
                    platform: 'Internal',
                    duration: task.estimatedMinutes || 30
                };
                const createRes = await api.createMissionFromCourse(courseData, token);
                if (createRes.success && createRes.data?.mission) {
                    missionId = createRes.data.mission._id;
                    api.updateTaskStatus(task.id, 'in_progress', token, missionId);
                }
            }

            if (missionId) {
                await api.startMission(missionId, token);
            }

            handleTaskUpdate(task.id, 'in_progress');

            const skillObj = task.skill;
            const skillQuery = typeof skillObj === 'object' ? (skillObj.skill || '') : (skillObj?.trim() || '');
            const titleQuery = task.title?.replace(/[\[\]()]/g, '').trim() || '';

            let searchQuery = '';

            switch (task.type) {
                case 'course':
                    searchQuery = skillQuery || titleQuery;
                    router.push(`/courses?q=${encodeURIComponent(searchQuery)}`);
                    break;
                case 'quiz':
                    searchQuery = skillQuery || titleQuery;
                    router.push(`/?companion=quiz&topic=${encodeURIComponent(searchQuery)}`);
                    break;
                case 'project':
                    searchQuery = skillQuery
                        ? `build ${skillQuery} project step by step`
                        : `${titleQuery} hands-on project`;
                    router.push(`/ai-intelligence?q=${encodeURIComponent(searchQuery)}&autoSearch=true`);
                    break;
                case 'practice':
                    searchQuery = skillQuery
                        ? `${skillQuery} coding exercises challenges`
                        : `${titleQuery} practice exercises`;
                    router.push(`/ai-intelligence?q=${encodeURIComponent(searchQuery)}&autoSearch=true`);
                    break;
                default:
                    searchQuery = skillQuery || titleQuery;
                    router.push(`/ai-intelligence?q=${encodeURIComponent(searchQuery)}&autoSearch=true`);
            }
        } catch (error) {
            console.error('Failed to start mission:', error);
            handleTaskUpdate(task.id, 'in_progress');
        } finally {
            setIsStartingMission(false);
        }
    };

    const handleLearnSkill = (skillData) => {
        const skillName = typeof skillData === 'object' ? (skillData.skill || skillData.name || '') : (skillData || '');
        if (!skillName) return;

        const query = `learn ${skillName} complete roadmap courses tutorials`;
        router.push(`/ai-intelligence?q=${encodeURIComponent(query)}&autoSearch=true`);
    };

    if (profileLoading) {
        return (
            <div className="space-y-6">
                <div className="h-64 rounded-[2.5rem] bg-[var(--site-text)]/5 animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-48 rounded-[2rem] bg-[var(--site-text)]/5 animate-pulse" />
                    <div className="h-48 rounded-[2rem] bg-[var(--site-text)]/5 animate-pulse" />
                </div>
            </div>
        );
    }

    const completedTasks = plan?.tasks?.filter(t => t.status === 'completed').length || 0;
    const totalTasks = plan?.tasks?.length || 0;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <>
            <div className="space-y-8">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                            <Brain size={28} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">
                                Learning <span className="text-gradient-elite">Brain</span>
                            </h2>
                            <p className="text-xs font-bold text-[var(--site-text-muted)] uppercase tracking-widest opacity-60">
                                AI-Personalized Intelligence
                            </p>
                        </div>
                    </div>

                    {isOnboarded && (
                        <button
                            onClick={() => setShowOnboarding(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all btn-tactile text-xs font-black uppercase tracking-widest"
                        >
                            <Settings size={16} />
                            Edit Goals
                        </button>
                    )}
                </div>

                {/* Guardian Wellbeing Insight */}
                {intervention && !intervention.showModal && intervention.priority > 1 && (
                    <div className="animate-in fade-in slide-in-from-top duration-500">
                        <Surface className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl shadow-inner">
                                    {intervention.message.emoji || '💡'}
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                        Guardian Insight
                                    </h4>
                                    <p className="text-sm font-medium text-[var(--site-text)] opacity-90">
                                        {intervention.message.body}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={dismissIntervention}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-[var(--site-text-muted)]"
                            >
                                <X size={16} />
                            </button>
                        </Surface>
                    </div>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Weekly Plan */}
                    <div className="lg:col-span-7">
                        <Surface className="p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] relative overflow-hidden group hover:shadow-[var(--shadow-elite)] transition-all duration-500">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-[var(--site-text)] tracking-tight flex items-center gap-3">
                                            <Target size={20} className="text-indigo-500" />
                                            This Week's Plan
                                        </h3>
                                        {plan?.weeklyFocus && (
                                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                                🎯 Focus: {plan.weeklyFocus}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => generatePlanMutation.mutate()}
                                        disabled={generatePlanMutation.isPending}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 btn-tactile cursor-pointer"
                                    >
                                        {generatePlanMutation.isPending ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw size={14} />
                                                {plan?.tasks?.length ? 'Regenerate' : 'Generate Plan'}
                                            </>
                                        )}
                                    </button>
                                </div>

                                {plan?.tasks?.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        {plan?.etaToJobReady && (
                                            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                                🚀 ETA: {plan.etaToJobReady}
                                            </span>
                                        )}
                                        {plan?.adaptedDifficulty && (
                                            <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                                                {plan.adaptedDifficulty === 'easy' ? '🌱' : plan.adaptedDifficulty === 'hard' ? '🔥' : '⚡'} {plan.adaptedDifficulty}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {totalTasks > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-[var(--site-text-muted)]">Week Progress</span>
                                            <span className="text-sm font-black text-[var(--site-text)]">{progressPercent}%</span>
                                        </div>
                                        <div className="h-2 bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 max-h-[400px] overflow-y-auto premium-scroll">
                                    {plan?.tasks?.length > 0 ? (
                                        plan.tasks.map((task) => {
                                            const typeStyle = TASK_TYPE_STYLES[task.type] || TASK_TYPE_STYLES.course;
                                            const TaskIcon = typeStyle.icon;
                                            const isUpdating = updatingTask === task.id;
                                            const isCompleted = task.status === 'completed';
                                            const isSkipped = task.status === 'skipped';

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 ${isCompleted
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-700/50'
                                                        : isSkipped
                                                            ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/30 opacity-60'
                                                            : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:border-indigo-400/50 hover:shadow-lg'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3 sm:gap-4">
                                                        <button
                                                            onClick={() => handleTaskUpdate(task.id, isCompleted ? 'pending' : 'completed')}
                                                            disabled={isUpdating}
                                                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all btn-tactile shrink-0 ${isCompleted
                                                                ? 'bg-emerald-500 text-white shadow-lg'
                                                                : 'bg-[var(--site-text)]/5 text-[var(--site-text-muted)] hover:bg-indigo-500 hover:text-white hover:shadow-lg'
                                                                }`}
                                                        >
                                                            {isUpdating ? (
                                                                <Loader2 size={18} className="animate-spin" />
                                                            ) : isCompleted ? (
                                                                <CheckCircle2 size={20} />
                                                            ) : (
                                                                <Circle size={20} />
                                                            )}
                                                        </button>

                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm sm:text-base font-bold leading-snug mb-2 ${isCompleted ? 'text-[var(--site-text-muted)] line-through' : 'text-[var(--site-text)]'}`}>
                                                                {task.title}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {task.isRollover && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 text-[10px] font-black text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                                                        🔄 Rollover
                                                                    </span>
                                                                )}
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                                                                    <TaskIcon size={12} />
                                                                    {task.type}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--site-text)]/5 text-[10px] font-bold text-[var(--site-text-muted)]">
                                                                    <Clock size={11} />
                                                                    {task.estimatedMinutes}m
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {!isCompleted && !isSkipped && (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <button
                                                                    onClick={() => handleStartTask(task)}
                                                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center transition-all btn-tactile shadow-lg"
                                                                >
                                                                    <Play size={16} fill="currentColor" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleTaskUpdate(task.id, 'skipped')}
                                                                    disabled={isUpdating}
                                                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--site-text)]/5 text-[var(--site-text-muted)] hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all btn-tactile"
                                                                >
                                                                    <SkipForward size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-16 text-center">
                                            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                                                <Sparkles size={32} className="text-indigo-500" />
                                            </div>
                                            <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em] mb-4">No plan yet</p>
                                            <p className="text-sm text-[var(--site-text-muted)] max-w-xs mx-auto">Click "Generate Plan" to get your personalized weekly learning tasks</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Surface>
                    </div>

                    {/* Right: Skills & Focus */}
                    <div className="lg:col-span-5 space-y-6">
                        <Surface className="p-6 rounded-[2rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:shadow-lg transition-all duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <TrendingUp size={18} className="text-amber-500" />
                                </div>
                                <h3 className="text-lg font-black text-[var(--site-text)] tracking-tight">Focus This Week</h3>
                            </div>

                            <div className="space-y-3">
                                {topToLearn.length > 0 ? (
                                    topToLearn.map((skill, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleLearnSkill(skill)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--site-text)]/[0.02] border border-[var(--card-border)] group hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs font-black flex items-center justify-center shadow-lg">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-bold text-[var(--site-text)]">{renderSkill(skill)}</p>
                                                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">High Priority</p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                <ExternalLink size={14} className="text-amber-500 group-hover:text-white" />
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-[var(--site-text-muted)] text-center py-4">Complete onboarding to see focus areas</p>
                                )}
                            </div>
                        </Surface>

                        <Surface className="p-6 rounded-[2rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:shadow-lg transition-all duration-500">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <Trophy size={18} className="text-purple-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-[var(--site-text)] tracking-tight">Your Skills</h3>
                                </div>
                                <button 
                                    onClick={() => setShowSkillsGallery(true)}
                                    className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest flex items-center gap-1 transition-all group cursor-pointer"
                                >
                                    View Intelligence
                                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {skills.length > 0 ? (
                                    <>
                                        {skills.slice(0, 4).map((skill, idx) => (
                                            <div 
                                                key={idx} 
                                                className="space-y-2 cursor-pointer group/item"
                                                onClick={() => setShowSkillsGallery(true)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-[var(--site-text)] group-hover/item:text-indigo-500 transition-colors">{renderSkill(skill.name)}</span>
                                                    <span className="text-xs font-black text-indigo-500">{skill.level}%</span>
                                                </div>
                                                <div className="h-1.5 bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                                                        style={{ width: `${skill.level}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <button 
                                                onClick={() => router.push('/skill-analysis')}
                                                className="py-3 rounded-xl bg-[var(--site-text)]/[0.03] border border-dashed border-[var(--card-border)] text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-widest hover:bg-indigo-500/5 hover:text-indigo-500 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <BarChart3 size={12} /> Analysis
                                            </button>
                                            <button 
                                                onClick={() => router.push('/momentum#skill-evolution-hub')}
                                                className="py-3 rounded-xl bg-[var(--site-text)]/[0.03] border border-dashed border-[var(--card-border)] text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-widest hover:bg-rose-500/5 hover:text-rose-500 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <Heart size={12} /> Health
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-[var(--site-text-muted)] text-center py-4">Save courses to build your profile</p>
                                )}
                            </div>
                        </Surface>

                        {isOnboarded && profile?.goals?.targetRole && (
                            <Surface className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-700 border-none relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                                <div className="relative z-10 text-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-70">Your Target</p>
                                        <Target size={14} className="text-white/50" />
                                    </div>
                                    <p className="text-xl font-black tracking-tight leading-none mb-4">{profile.goals.targetRole}</p>
                                    <div className="space-y-2 mb-4 bg-black/20 rounded-xl p-3 backdrop-blur-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">Role Readiness</span>
                                            <span className="text-xs font-black text-emerald-400">{getGoalProgress()}%</span>
                                        </div>
                                        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000" style={{ width: `${getGoalProgress()}%` }} />
                                        </div>
                                    </div>
                                    {profile.goals.targetTimeline && (
                                        <p className="text-[10px] font-bold opacity-80 flex items-center gap-2">
                                            <Clock size={12} /> Target: <span className="text-white font-black">{profile.goals.targetTimeline}</span>
                                        </p>
                                    )}
                                </div>
                            </Surface>
                        )}
                    </div>
                </div>
            </div>

            <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} existingProfile={profile} />
            <SkillsGalleryModal isOpen={showSkillsGallery} onClose={() => setShowSkillsGallery(false)} skills={skillsData?.skills || []} topToLearn={topToLearn} />
        </>
    );
}
