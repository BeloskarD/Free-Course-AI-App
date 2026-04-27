'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import Surface from '../ui/Surface';
import {
    X,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Loader2,
    BookOpen,
    Video,
    Code2,
    Layers,
    CheckCircle2,
    Cpu,
    Shield,
    Smartphone,
    Database,
    Cloud,
    Layout
} from 'lucide-react';

// Popular target roles and their associated fields
const FIELD_CATEGORIES = [
    { id: 'web', label: 'Web Development', icon: Layout, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'ai', label: 'AI & Data Science', icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'mobile', label: 'Mobile Apps', icon: Smartphone, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'devops', label: 'Cloud & DevOps', icon: Cloud, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'security', label: 'Cybersecurity', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'data', label: 'Data Engineering', icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
];

const POPULAR_ROLES = {
    web: ['Full Stack Developer', 'Frontend Engineer', 'Backend Specialist', 'UI/UX Designer'],
    ai: ['AI/ML Engineer', 'Data Scientist', 'NLP Specialist', 'Computer Vision Expert'],
    mobile: ['iOS Developer', 'Android Developer', 'React Native Engineer', 'Flutter Expert'],
    devops: ['Cloud Architect', 'SRE Engineer', 'Platform Specialist', 'AWS Solutions Expert'],
    security: ['Security Analyst', 'Penetration Tester', 'DevSecOps Specialist', 'SOC Analyst'],
    data: ['Data Architect', 'Big Data Engineer', 'ETL Specialist', 'Analytics Engineer'],
};

// Experience levels for Phase 4
const EXPERIENCE_LEVELS = [
    { id: 'student', label: 'Student / High School', desc: 'Just starting the tech journey', emoji: '🎓' },
    { id: 'junior', label: 'Junior / Entry Level', desc: '0-2 years of experience', emoji: '🌱' },
    { id: 'mid', label: 'Mid-Level Professional', desc: '2-5 years of industry tenure', emoji: '⚡' },
    { id: 'senior', label: 'Senior Specialist', desc: '5+ years, leading teams', emoji: '🔥' },
    { id: 'lead', label: 'Lead / Management', desc: 'Directing architecture & vision', emoji: '🏆' },
];

// Current skill levels for quick assessment 
const SKILL_OPTIONS = [
    { name: 'JavaScript', category: 'web' },
    { name: 'Python', category: 'ai' },
    { name: 'React', category: 'web' },
    { name: 'Node.js', category: 'web' },
    { name: 'TypeScript', category: 'web' },
    { name: 'SQL / NoSQL', category: 'data' },
    { name: 'Git / GitHub', category: 'devops' },
    { name: 'Docker / K8s', category: 'devops' },
    { name: 'Machine Learning', category: 'ai' },
    { name: 'Cloud (AWS/GCP)', category: 'devops' },
];

// Learning formats
const FORMATS = [
    { id: 'video', label: 'Masterclass Videos', icon: Video, desc: 'Visual step-by-step guides' },
    { id: 'projects', label: 'Hands-on Projects', icon: Code2, desc: 'Real-world deployment focus' },
    { id: 'text', label: 'In-depth Docs', icon: BookOpen, desc: 'Deep technical reading' },
    { id: 'mixed', label: 'Hybrid Journey', icon: Layers, desc: 'The most balanced path' },
];

const TIMELINE_OPTIONS = ['3 months', '6 months', '9 months', '12 months'];

export default function OnboardingModal({ isOpen, onClose, existingProfile, onComplete }) {
    const { token, refreshUser, user } = useAuth();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const totalSteps = 5;

    // Form state
    const [targetField, setTargetField] = useState(existingProfile?.goals?.targetField || '');
    const [targetRole, setTargetRole] = useState(existingProfile?.goals?.targetRole || '');
    const [experienceLevel, setExperienceLevel] = useState(existingProfile?.goals?.experienceLevel || 'junior');
    const [targetTimeline, setTargetTimeline] = useState(existingProfile?.goals?.targetTimeline || '6 months');
    const [motivation, setMotivation] = useState(existingProfile?.goals?.motivation || 'career-switch');
    const [currentSkills, setCurrentSkills] = useState(
        existingProfile?.masteredSkills?.map(s => ({ name: s.name, level: s.level })) || []
    );
    const [format, setFormat] = useState(existingProfile?.preferences?.format || 'mixed');
    const [difficulty, setDifficulty] = useState(existingProfile?.preferences?.difficultyComfort || 'medium');
    const [sessionLength, setSessionLength] = useState(existingProfile?.preferences?.sessionLength || 30);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (!isOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isOpen]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data) => api.updateLearnerProfile(data, token),
        onSuccess: async (result) => {
            console.log('✅ [Onboarding] Profile updated successfully');
            
            // Refetch in background
            queryClient.invalidateQueries({ queryKey: ['learner-profile', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['skill-graph', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['readiness', user?.id] });
            
            if (refreshUser) {
                await refreshUser().catch(e => console.warn('User refresh failed:', e));
            }
            
            if (onComplete) {
                onComplete(result?.profile);
            }
            
            // Close modal last
            onClose();
        },
        onError: (error) => {
            console.error('❌ [Onboarding] Update failed:', error);
            alert(`Failed to synchronize: ${error.message}. Please try again.`);
        }
    });

    const toggleSkill = (skillName) => {
        setCurrentSkills(prev => {
            const existing = prev.find(s => s.name === skillName);
            if (existing) return prev.filter(s => s.name !== skillName);
            return [...prev, { name: skillName, level: 30 }];
        });
    };

    const updateSkillLevel = (skillName, level) => {
        setCurrentSkills(prev => prev.map(s => s.name === skillName ? { ...s, level } : s));
    };

    const handleSubmit = () => {
        updateMutation.mutate({
            goals: {
                targetField,
                targetRole,
                experienceLevel,
                targetTimeline,
                motivation,
                isOnboarded: true,
            },
            preferences: {
                format,
                difficultyComfort: difficulty,
                sessionLength,
            },
            masteredSkills: currentSkills.map(s => ({
                name: s.name,
                level: s.level,
                confidence: s.level >= 70 ? 'high' : s.level >= 40 ? 'medium' : 'low',
                sources: ['self-assessment'],
                lastPracticed: new Date(),
            })),
        });
    };

    if (!isOpen) return null;

    const progressWidth = `${(step / totalSteps) * 100}%`;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex animate-in fade-in duration-500 overflow-hidden"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/90 dark:bg-black/95 backdrop-blur-3xl" />

            <div className="relative w-full h-full flex items-start justify-center px-4 sm:px-6 lg:pr-8 lg:pl-[calc(2rem+var(--sidebar-offset,0px))] pt-24 pb-6 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500">
                
                <Surface 
                    className="w-full max-w-2xl h-full max-h-[85vh] flex flex-col rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group animate-in zoom-in-95 duration-500 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="relative z-50 p-6 sm:px-10 flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Sparkles size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-[var(--site-text)] tracking-tighter">
                                    Career Discovery
                                </h2>
                                <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60">
                                    Phase 4 | Goal-Centric Intelligence
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-[var(--site-text)]/5 hover:bg-rose-500/10 text-[var(--site-text-muted)] hover:text-rose-500 flex items-center justify-center transition-all btn-tactile border border-[var(--card-border)] cursor-pointer active:scale-90"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="h-1 bg-[var(--site-text)]/5 overflow-hidden shrink-0">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-700 ease-out"
                            style={{ width: progressWidth }}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto premium-scroll px-6 sm:px-10 py-8 lg:py-10">
                        
                        {step === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight text-[var(--site-text)]">Select Your Domain</h3>
                                    <p className="text-sm text-[var(--site-text-muted)]">Which technical field are you looking to conquer?</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {FIELD_CATEGORIES.map((field) => {
                                        const Icon = field.icon;
                                        const isActive = targetField === field.id;
                                        return (
                                            <button
                                                key={field.id}
                                                onClick={() => setTargetField(field.id)}
                                                className={`p-5 rounded-3xl text-left transition-all border-2 flex flex-col gap-3 group/btn cursor-pointer ${isActive
                                                    ? `bg-[var(--card-bg)] ${field.color} border-indigo-500/50 shadow-xl`
                                                    : 'bg-[var(--site-text)]/[0.02] border-[var(--card-border)] hover:border-[var(--site-text)]/20'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-indigo-500 text-white' : `${field.bg} ${field.color}`}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <p className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-[var(--site-text)]' : 'text-[var(--site-text-muted)]'}`}>
                                                    {field.label}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>

                                {targetField && (
                                    <div className="space-y-4 pt-4 border-t border-[var(--card-border)] animate-in fade-in slide-in-from-top-4">
                                        <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest text-center">Specific Target Role</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {POPULAR_ROLES[targetField].map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => setTargetRole(role)}
                                                    className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${targetRole === role 
                                                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' 
                                                        : 'bg-[var(--site-text)]/5 text-[var(--site-text-muted)] border-[var(--card-border)]'
                                                    }`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Or type custom role..."
                                            value={targetRole && !POPULAR_ROLES[targetField].includes(targetRole) ? targetRole : ''}
                                            onChange={(e) => setTargetRole(e.target.value)}
                                            className="w-full px-6 py-4 rounded-2xl bg-[var(--site-text)]/5 border-2 border-[var(--card-border)] focus:border-indigo-500/50 outline-none text-sm font-bold mt-2"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight text-[var(--site-text)]">Technical Maturity</h3>
                                    <p className="text-sm text-[var(--site-text-muted)]">State your current level for personalized roadmapping</p>
                                </div>
                                
                                <div className="grid gap-3">
                                    {EXPERIENCE_LEVELS.map((lvl) => (
                                        <button
                                            key={lvl.id}
                                            onClick={() => setExperienceLevel(lvl.id)}
                                            className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between group cursor-pointer ${experienceLevel === lvl.id
                                                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg'
                                                : 'bg-[var(--site-text)]/[0.02] border-[var(--card-border)] hover:border-indigo-500/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl bg-[var(--site-text)]/5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner">
                                                    {lvl.emoji}
                                                </div>
                                                <div className="text-left">
                                                    <p className={`font-black text-sm uppercase tracking-widest ${experienceLevel === lvl.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--site-text)]'}`}>
                                                        {lvl.label}
                                                    </p>
                                                    <p className="text-xs text-[var(--site-text-muted)] opacity-80">{lvl.desc}</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${experienceLevel === lvl.id ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-[var(--card-border)]'}`}>
                                                {experienceLevel === lvl.id && <CheckCircle2 size={14} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight text-[var(--site-text)]">Knowledge Baseline</h3>
                                    <p className="text-sm text-[var(--site-text-muted)]">Select technologies you currently possess</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {SKILL_OPTIONS.map((skill) => {
                                        const isSelected = currentSkills.some(s => s.name === skill.name);
                                        return (
                                            <button
                                                key={skill.name}
                                                onClick={() => toggleSkill(skill.name)}
                                                className={`relative p-4 rounded-2xl text-center border-2 transition-all cursor-pointer ${isSelected
                                                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                                                    : 'bg-[var(--site-text)]/[0.02] border-[var(--card-border)] hover:border-amber-500/20'
                                                }`}
                                            >
                                                <p className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--site-text-muted)]'}`}>
                                                    {skill.name}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>

                                {currentSkills.length > 0 && (
                                    <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 space-y-6">
                                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.3em] text-center">Proficiency Mapping</p>
                                        <div className="space-y-5">
                                            {currentSkills.map((skill) => (
                                                <div key={skill.name} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--site-text)]">{skill.name}</span>
                                                        <span className="text-xs font-black text-amber-500">{skill.level}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="10" max="100" step="10"
                                                        value={skill.level}
                                                        onChange={(e) => updateSkillLevel(skill.name, parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-amber-500/20 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight text-[var(--site-text)]">Learning DNA</h3>
                                    <p className="text-sm text-[var(--site-text-muted)]">How should the Brain curate your path?</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {FORMATS.map((f) => {
                                        const Icon = f.icon;
                                        const isActive = format === f.id;
                                        return (
                                            <button
                                                key={f.id}
                                                onClick={() => setFormat(f.id)}
                                                className={`p-6 rounded-[2rem] text-left transition-all border-2 cursor-pointer ${isActive
                                                    ? 'bg-purple-500/10 border-purple-500/50 shadow-xl'
                                                    : 'bg-[var(--site-text)]/[0.02] border-[var(--card-border)] hover:border-purple-500/20'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all ${isActive ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-600'}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <p className="text-sm font-black text-[var(--site-text)] mb-1">{f.label}</p>
                                                <p className="text-xs text-[var(--site-text-muted)] leading-tight">{f.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight text-[var(--site-text)]">Execution Control</h3>
                                    <p className="text-sm text-[var(--site-text-muted)]">Configure your velocity and timelines</p>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest text-center">Intensity Selection</p>
                                    <div className="flex gap-3">
                                        {['easy', 'medium', 'hard'].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => setDifficulty(d)}
                                                className={`flex-1 p-5 rounded-3xl border-2 transition-all text-center cursor-pointer ${difficulty === d
                                                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg'
                                                    : 'bg-[var(--site-text)]/[0.02] border-[var(--card-border)] hover:border-emerald-500/20'
                                                }`}
                                            >
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--site-text)]">{d}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest text-center">Focus Session Duration</p>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[15, 30, 45, 60].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSessionLength(s)}
                                                className={`p-4 rounded-2xl border-2 transition-all font-black text-sm cursor-pointer ${sessionLength === s
                                                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-md'
                                                    : 'bg-[var(--site-text)]/[0.02] border-[var(--card-border)] text-[var(--site-text-muted)]'
                                                }`}
                                            >
                                                {s}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest text-center">Target Timeline</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {TIMELINE_OPTIONS.map((timeline) => (
                                            <button
                                                key={timeline}
                                                onClick={() => setTargetTimeline(timeline)}
                                                className={`p-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest cursor-pointer ${targetTimeline === timeline
                                                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400 shadow-md'
                                                    : 'bg-[var(--site-text)]/[0.02] border-[var(--card-border)] text-[var(--site-text-muted)] hover:border-purple-500/20'
                                                }`}
                                            >
                                                {timeline}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white space-y-4 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Sparkles size={18} className="text-amber-300" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Final Intel Summary</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Target</p>
                                                <p className="text-sm font-black leading-tight">{targetRole || 'Intelligence Seek'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Level</p>
                                                <p className="text-sm font-black leading-tight capitalize">{experienceLevel}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Velocity</p>
                                                <p className="text-sm font-black leading-tight capitalize">{difficulty}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Commitment</p>
                                                <p className="text-sm font-black leading-tight">{sessionLength}min / session</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Timeline</p>
                                                <p className="text-sm font-black leading-tight">{targetTimeline}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 sm:px-10 border-t border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
                        <button
                            onClick={() => setStep(prev => Math.max(1, prev - 1))}
                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-[var(--site-text-muted)] hover:text-[var(--site-text)]'}`}
                        >
                            <ArrowLeft size={16} /> Previous
                        </button>

                        <div className="flex items-center gap-4">
                            <p className="hidden sm:block text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-40">
                                Section {step} / {totalSteps}
                            </p>
                            
                            {step < totalSteps ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    disabled={(step === 1 && (!targetRole || !targetField)) || (step === 2 && !experienceLevel)}
                                    className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all btn-tactile disabled:opacity-30 cursor-pointer"
                                >
                                    Continue <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={updateMutation.isPending}
                                    className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all btn-tactile disabled:opacity-50 cursor-pointer"
                                >
                                    {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Synchronize Brain
                                </button>
                            )}
                        </div>
                    </div>
                </Surface>
            </div>
        </div>
    );
}
