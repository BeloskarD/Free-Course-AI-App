"use client";

import React, { useState, useEffect } from 'react';
import {
    Trophy,
    Target,
    Map,
    Cpu,
    Layers,
    ExternalLink,
    ShieldCheck,
    Zap,
    Globe,
    Briefcase,
    Clock,
    Sparkles,
    Github,
    Linkedin,
    Twitter,
    Link as LinkIcon,
    Award,
    Code2,
    CheckCircle2,
    LayoutIcon,
    FileText,
    Printer,
    ArrowLeft,
    LayoutDashboard,
    GraduationCap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getApiBaseUrl } from '../../../lib/runtimeConfig';

export default function PortfolioClient({ initialData, id }) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(null);
    const [isRecruiterMode, setIsRecruiterMode] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!initialData && id) {
            const fetchPortfolio = async () => {
                const API_BASE = getApiBaseUrl();
                try {
                    const response = await fetch(`${API_BASE}/portfolio/${id}`);
                    const result = await response.json();
                    if (result.success) setData(result.data);
                    else setError(result.error || "Failed to load portfolio");
                } catch (err) {
                    setError("Connection error. Please try again later.");
                } finally {
                    setLoading(false);
                }
            };
            fetchPortfolio();
        }
    }, [id, initialData]);

    const { token, user: currentUser } = useAuth();

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;
    if (!data) return null;

    const { user, profile, skills, missions } = data;
    const socialLinks = profile.socialLinks || {};

    const isOwner = currentUser && (
        currentUser.id === user.id || 
        currentUser.id === user._id || 
        currentUser._id === user.id || 
        currentUser._id === user._id
    );

    const isProfileEmpty = 
        (!profile.experience || profile.experience.length === 0) &&
        (!profile.customProjects || profile.customProjects.length === 0) &&
        (!profile.certificates || profile.certificates.length === 0) &&
        (!profile.professionalSummary || profile.professionalSummary.trim() === '') &&
        (!profile.headline || profile.headline.trim() === '');

    const isEmptyOrFallback = profile.isFallback === true || isProfileEmpty;

    if (isEmptyOrFallback) {
        if (isOwner) {
            return <BuildYourPortfolioState user={user} onEdit={() => router.push('/dashboard?tab=portfolio')} />;
        } else if (!profile.isFallback) {
            return <UnderConstructionState user={user} socialLinks={socialLinks} />;
        }
    }

    const subscriptionTier = user?.subscriptionTier || 'free';
    const isPremium = subscriptionTier === 'pro' || subscriptionTier === 'career_plus';
    const isGlassmorphicTheme = isPremium && (profile.portfolioTheme === 'glassmorphism' || subscriptionTier === 'career_plus');

    return (
        <div 
            className={`min-h-screen pb-24 px-4 sm:px-8 lg:px-12 pt-28 selection:bg-indigo-500 selection:text-white transition-all duration-500 ${isGlassmorphicTheme ? 'theme-glassmorphic' : 'bg-[var(--site-bg)]'}`}
            style={{
                '--accent-primary': profile.accentColor || '#6366f1',
                '--accent-secondary': profile.accentColor === '#6366f1' || !profile.accentColor ? '#a855f7' : `${profile.accentColor}dd`
            }}
        >
            {/* Print Logic Component (Hidden in Web View) */}
            <PrintStyles />

            {/* Print Header Logic (Simple Button) */}
            <div className="fixed bottom-8 left-8 lg:left-[calc(var(--sidebar-offset,0px)+2rem)] z-50 no-print flex flex-col gap-4 transition-all duration-500">
                <button
                    onClick={() => window.print()}
                    className="p-5 bg-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 group border-4 border-white dark:border-slate-900 cursor-pointer"
                >
                    <Printer size={24} />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-500 whitespace-nowrap font-black uppercase text-[10px] tracking-[0.2em] pl-1">Print Resume</span>
                </button>
            </div>

            {/* Free Tier Branding Watermark Badge */}
            {subscriptionTier === 'free' && (
                <div className="fixed bottom-8 right-8 z-50 no-print">
                    <a
                        href="/pricing"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)]/90 backdrop-blur-xl border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest group border hover:border-indigo-500 hover:text-indigo-700"
                    >
                        <ShieldCheck size={14} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span>Powered by Zeeklect</span>
                    </a>
                </div>
            )}

            {/* Background Aesthetic Layers (Hidden in Print) */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none no-print">
                <div className={`absolute top-[5%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-1000 ${isGlassmorphicTheme ? 'bg-cyan-500 opacity-[0.08] animate-pulse-elite' : 'bg-indigo-500 opacity-[0.04] animate-pulse'}`} />
                <div className={`absolute bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full blur-[100px] transition-all duration-1000 ${isGlassmorphicTheme ? 'bg-purple-500 opacity-[0.07] animate-float-elite' : 'bg-blue-500 opacity-[0.03]'}`} />
            </div>

            <div className="max-w-6xl mx-auto space-y-16 relative z-10 print:m-0 print:max-w-none print:space-y-8">
                {/* 0. Top Navigation (No Print) */}
                <div className="no-print mb-8 animate-in fade-in slide-in-from-left duration-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)] text-[var(--site-text)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50 rounded-xl sm:rounded-2xl shadow-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                        >
                            <ArrowLeft size={16} className="text-[var(--site-text-muted)] group-hover:text-[var(--accent-primary)] transition-colors group-hover:-translate-x-1" />
                            Back to Dashboard
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl shadow-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                        >
                            <Printer size={16} />
                            Print Resume
                        </button>
                    </div>

                    {/* Premium Glassmorphic Recruiter Toggle Switch */}
                    <div className="flex items-center gap-4 px-6 py-2.5 bg-[var(--card-bg)]/85 backdrop-blur-2xl border border-[var(--card-border)] rounded-2xl shadow-xl hover:border-indigo-500/30 transition-all select-none">
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${!isRecruiterMode ? 'text-indigo-500 font-extrabold' : 'text-[var(--site-text-muted)] opacity-60'}`}>
                            Candidate View
                        </span>
                        <button
                            onClick={() => setIsRecruiterMode(!isRecruiterMode)}
                            className="relative w-12 h-6 rounded-full bg-slate-300 dark:bg-slate-700 transition-colors focus:outline-none cursor-pointer"
                            aria-label="Toggle Recruiter Mode"
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-300 shadow-md ${
                                    isRecruiterMode
                                        ? 'translate-x-6 bg-indigo-500'
                                        : 'bg-indigo-600'
                                }`}
                            />
                        </button>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isRecruiterMode ? 'text-indigo-500 font-extrabold' : 'text-[var(--site-text-muted)] opacity-60'}`}>
                            Recruiter View
                        </span>
                    </div>
                </div>

                {/* 1. ELITE PORTFOLIO HEADER (Resume Style) */}
                <header className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-8 md:p-16 relative overflow-hidden group print:shadow-none print:border-b print:rounded-none`}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 no-print">
                        <Trophy size={300} strokeWidth={1} />
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16 relative z-10 print:flex-row print:gap-10">
                        {/* Avatar Hub */}
                        <div className="relative print:shrink-0">
                            <div className="w-40 h-40 md:w-52 md:h-52 rounded-[3.5rem] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] p-1.5 shadow-2xl transition-transform duration-700 hover:rotate-3 print:w-32 print:h-32 print:rounded-2xl print:shadow-none">
                                <div className="w-full h-full bg-[var(--card-bg)] rounded-[3.2rem] overflow-hidden flex items-center justify-center p-2 print:rounded-xl">
                                    <img
                                        src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                                        alt={user.name}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover rounded-[3rem] print:rounded-xl"
                                    />
                                </div>
                            </div>
                            {!isRecruiterMode && (
                                <div className="absolute -bottom-4 -right-2 bg-indigo-600 text-white px-5 py-2 rounded-2xl text-base font-black shadow-2xl border-4 border-[var(--card-bg)] no-print">
                                    LVL {user.level}
                                </div>
                            )}
                        </div>

                        {/* Identity & Bio */}
                        <div className="text-center md:text-left flex-1 space-y-6 print:text-left">
                            <div>
                                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gradient-elite mb-4 tracking-tighter uppercase italic print:text-black print:text-4xl">
                                    {user.name}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <span className="px-5 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-black uppercase tracking-widest border border-indigo-500/20 flex items-center gap-2 print:bg-transparent print:border-none print:text-black print:p-0">
                                        <Briefcase size={16} className="print:hidden" />
                                        {profile.targetRole}
                                    </span>
                                    {profile.careerReadiness >= 80 && (
                                        <span className="px-5 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2 no-print">
                                            <ShieldCheck size={16} />
                                            {isRecruiterMode ? "Vetted Specialist" : "Top 1% Ready"}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Recruiter Contact Metadata line */}
                                {(profile.contactInfo?.email || profile.contactInfo?.phone || profile.contactInfo?.location) && (
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 mt-4 text-xs md:text-sm text-[var(--site-text-muted)] font-black uppercase tracking-widest print:text-black print:text-[10px] print:mt-2 print:gap-x-4">
                                        {profile.contactInfo.email && (
                                            <span className="flex items-center gap-2">
                                                <span className="print:hidden">✉️</span>
                                                <span>{profile.contactInfo.email}</span>
                                            </span>
                                        )}
                                        {profile.contactInfo.phone && (
                                            <span className="flex items-center gap-2">
                                                <span className="print:hidden">📞</span>
                                                <span>{profile.contactInfo.phone}</span>
                                            </span>
                                        )}
                                        {profile.contactInfo.location && (
                                            <span className="flex items-center gap-2">
                                                <span className="print:hidden">📍</span>
                                                <span>{profile.contactInfo.location}</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* AI Summary Section */}
                            {profile.professionalSummary ? (
                                <div className="max-w-2xl bg-indigo-500/5 p-6 md:p-8 rounded-[2.5rem] border border-indigo-500/10 relative backdrop-blur-sm print:p-0 print:border-none print:bg-transparent shadow-inner">
                                    <Sparkles size={24} className="absolute -top-4 -right-4 text-amber-500 animate-bounce no-print" />
                                    <p className="text-lg md:text-2xl font-bold text-[var(--site-text)] leading-snug tracking-tight print:text-black print:text-sm italic">
                                        "{profile.professionalSummary}"
                                    </p>
                                </div>
                            ) : (
                                <p className="text-lg md:text-xl text-[var(--site-text-muted)] font-bold max-w-2xl leading-relaxed italic opacity-60 print:text-sm">
                                    High-performance engineer focused on building robust technical architectures and verified system proficiency.
                                </p>
                            )}

                            {/* Social & Connect */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 pt-4 print:pt-0 print:gap-4">
                                {socialLinks.linkedin && <SocialIcon icon={Linkedin} href={socialLinks.linkedin} color="hover:text-blue-600" label="LinkedIn" />}
                                {socialLinks.github && <SocialIcon icon={Github} href={socialLinks.github} color="hover:text-indigo-500" label="GitHub" />}
                                {socialLinks.twitter && <SocialIcon icon={Twitter} href={socialLinks.twitter} color="hover:text-sky-500" label="X" />}
                                {socialLinks.website && <SocialIcon icon={Globe} href={socialLinks.website} color="hover:text-emerald-500" label="URL" />}

                                <button
                                    onClick={() => {
                                        const subject = encodeURIComponent(`Inquiry regarding professional profile of ${user.name}`);
                                        const body = encodeURIComponent(`Hi ${user.name},\n\nWe viewed your verified professional portfolio and are highly impressed by your Telemetry-Verified skills.\n\nLet's schedule a brief conversation.\n\nBest regards,\n[Recruiter Name]`);
                                        window.location.href = `mailto:${profile.portfolio?.contactInfo?.email || 'beloskar.dinesh@gmail.com'}?subject=${subject}&body=${body}`;
                                    }}
                                    className="ml-2 px-8 md:px-10 py-3 md:py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-95 transition-all shadow-xl no-print cursor-pointer"
                                >
                                    {isRecruiterMode ? "Request Interview 💼" : "HIRE FOR INNOVATION 🚀"}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-16 print:grid-cols-1 print:gap-8">
                    {/* LEFT COLUMN: CORE ASSETS */}
                    <div className="xl:col-span-4 space-y-16 print:space-y-8">
                        {/* SKILL MATRIX */}
                        <section className="space-y-8 print:space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 no-print">
                                    <Cpu size={20} />
                                </div>
                                <h2 className="text-2xl font-black tracking-tighter italic uppercase print:text-black print:text-lg">
                                    {isRecruiterMode ? "Core Competencies & Skills" : "Technical Stack"}
                                </h2>
                            </div>
                            <div className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-8 space-y-8 print:p-0 print:border-none print:shadow-none`}>
                                {skills.map((skill, idx) => (
                                    <SkillBar key={idx} skill={skill} isPremium={isPremium} isRecruiterMode={isRecruiterMode} profile={profile} />
                                ))}
                            </div>
                        </section>

                        {/* EDUCATION FLOW */}
                        {profile.education?.length > 0 && (
                            <section className="space-y-8 print:space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20 no-print">
                                        <GraduationCap size={20} />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tighter uppercase italic print:text-black print:text-lg">
                                        {isRecruiterMode ? "Education" : "Academic Path"}
                                    </h2>
                                </div>
                                <div className="space-y-4">
                                    {profile.education.map((edu, idx) => (
                                        <div key={idx} className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-6 border-l-4 border-l-violet-500 group hover:bg-violet-500/5 transition-colors print:p-0 print:border-none`}>
                                            <h4 className="font-black text-lg group-hover:text-violet-500 transition-colors uppercase tracking-tight print:text-black print:text-sm">{edu.degree}</h4>
                                            <p className="text-sm font-bold opacity-60 mt-1 print:text-xs">{edu.institution}</p>
                                            <span className="inline-block mt-3 text-[10px] font-black bg-violet-500/10 px-3 py-1 rounded-lg text-violet-600 print:text-xs print:p-0">{edu.year}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT COLUMN: PROFESSIONAL TRACKS */}
                    <div className="xl:col-span-8 space-y-20 print:space-y-10">
                        {/* 2. PROFESSIONAL EXPERIENCE (NEW) */}
                        {profile.experience?.length > 0 && (
                            <section className="space-y-10 print:space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5 no-print">
                                        <Briefcase size={24} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase print:text-black print:text-xl">
                                        {isRecruiterMode ? "Professional Experience" : "Career Milestones"}
                                    </h2>
                                </div>
                                <div className="space-y-8">
                                    {profile.experience.map((exp, idx) => (
                                        <ExperienceCard key={idx} exp={exp} isGlassmorphicTheme={isGlassmorphicTheme} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 3. VERIFIED CREDENTIALS (NEW) */}
                        {profile.certificates?.length > 0 && (
                            <section className="space-y-10 print:space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 no-print">
                                        <Award size={24} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase print:text-black print:text-xl">
                                        {isRecruiterMode ? "Certifications & Credentials" : "Elite Credentials"}
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1">
                                    {profile.certificates.map((cert, idx) => (
                                        <CertificateCard key={idx} cert={cert} isGlassmorphicTheme={isGlassmorphicTheme} isRecruiterMode={isRecruiterMode} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 4. CUSTOM PROJECTS (The User's Added Projects) */}
                        {profile.customProjects && profile.customProjects.length > 0 && (() => {
                            const displayedProjects = subscriptionTier === 'free' ? profile.customProjects.slice(0, 1) : profile.customProjects;
                            const hasHiddenProjects = subscriptionTier === 'free' && profile.customProjects.length > 1;
                            return (
                                <section className="space-y-10 print:space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5 no-print">
                                                <Code2 size={24} />
                                            </div>
                                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase print:text-black print:text-xl">
                                                {isRecruiterMode ? "Featured Projects" : "Personal Lab"}
                                            </h2>
                                        </div>
                                        <span className="px-5 py-2 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 no-print">
                                            <Zap size={14} className={isRecruiterMode ? "" : "animate-pulse"} />
                                            {isRecruiterMode ? `${displayedProjects.length} Verified Project${displayedProjects.length !== 1 ? 's' : ''}` : `${displayedProjects.length} Custom Build${displayedProjects.length !== 1 ? 's' : ''}`}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1">
                                        {displayedProjects.map((project, idx) => (
                                            <ProjectCard key={idx} project={project} isGlassmorphicTheme={isGlassmorphicTheme} />
                                        ))}

                                        {hasHiddenProjects && (
                                            <div className="md:col-span-2 p-6 md:p-8 rounded-[1.8rem] border border-dashed border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-indigo-500/5 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group no-print">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                                    <Zap size={120} className="text-indigo-500" />
                                                </div>
                                                <div className="space-y-2 text-center sm:text-left relative z-10">
                                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                                        <span className="px-3 py-1 text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-500 rounded-lg tracking-widest border border-indigo-500/20">PREMIUM GATED</span>
                                                        <span className="text-[11px] font-black text-amber-500 flex items-center gap-1">
                                                            <Sparkles size={12} className="animate-spin-slow" />
                                                            +{profile.customProjects.length - 1} More Custom Builds
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg md:text-xl font-black uppercase tracking-tight text-[var(--site-text)]">Unlock Complete Engineering Portfolio</h4>
                                                    <p className="text-xs md:text-sm font-semibold text-[var(--site-text-muted)] opacity-80 max-w-md leading-relaxed">
                                                        This candidate has additional custom projects on their Zeeklect Protocol ledger. Upgrade to a premium plan to view all custom systems and verified build telemetry.
                                                    </p>
                                                </div>
                                                <a 
                                                    href="/pricing" 
                                                    className="shrink-0 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-[0_8px_25px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 transition-all relative z-10"
                                                >
                                                    Upgrade to View 🚀
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            );
                        })()}

                        {/* LANGUAGES SECTION */}
                        {profile.languages?.length > 0 && (
                            <section className="space-y-8 print:space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 no-print">
                                        <Globe size={24} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase print:text-black print:text-xl">Languages</h2>
                                </div>
                                <div className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-6 md:p-8 print:p-0 print:border-none`}>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2">
                                        {profile.languages.map((lang, idx) => (
                                            <LanguageCard key={idx} lang={lang} />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* SOFT SKILLS SECTION */}
                        {profile.softSkills?.length > 0 && (
                            <section className="space-y-8 print:space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/5 no-print">
                                        <Target size={24} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase print:text-black print:text-xl">Core Competencies</h2>
                                </div>
                                <div className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-6 md:p-8 print:p-0 print:border-none`}>
                                    <div className="flex flex-wrap gap-3 print:gap-2">
                                        {profile.softSkills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold border border-rose-500/20 hover:scale-105 transition-transform print:text-black print:border-gray-300 print:bg-transparent print:text-xs"
                                            >
                                                {skill.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* AWARDS SECTION */}
                        {profile.awards?.length > 0 && (
                            <section className="space-y-8 print:space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20 shadow-lg shadow-yellow-500/5 no-print">
                                        <Trophy size={24} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase print:text-black print:text-xl">Awards & Recognition</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1">
                                    {profile.awards.map((award, idx) => (
                                        <AwardCard key={idx} award={award} isGlassmorphicTheme={isGlassmorphicTheme} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 5. MISSION SHOWROOM (Zeeklect Verified Missions) */}
                        <section className="space-y-10 print:hidden no-print">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                        <Layers size={24} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase">
                                        {isRecruiterMode ? "Technical Achievements" : "Verified Proofs"}
                                    </h2>
                                </div>
                                <span className="px-5 py-2 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest">
                                    {isRecruiterMode ? `${missions.length} Verified Lab${missions.length !== 1 ? 's' : ''}` : `${missions.length} Validated Path`}
                                </span>
                            </div>

                            <div className="space-y-8">
                                {missions.map((mission, idx) => (
                                    <MissionCard key={idx} mission={mission} isGlassmorphicTheme={isGlassmorphicTheme} isRecruiterMode={isRecruiterMode} />
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* FOOTER CALL TO ACTION (Hidden in Print) */}
                <footer className="text-center pt-32 pb-12 no-print">
                    <div className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-8 md:p-20 inline-block max-w-4xl border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-transparent to-indigo-500/5 rounded-[4rem]`}>
                        <Trophy size={64} className="mx-auto text-indigo-500 mb-8 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                        <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-[var(--site-text)] uppercase italic">Verified Professional Ledger</h3>
                        <p className="text-base md:text-xl text-[var(--site-text-muted)] font-bold mb-12 leading-relaxed max-w-2xl mx-auto opacity-70 italic uppercase tracking-tight">
                            Synthesized by Bytez Intelligence.
                            Verified through Real-World Telemetry.
                            Anchored on the Zeeklect Protocol.
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                    <Globe size={22} />
                                </div>
                                <span className="font-black text-2xl tracking-tighter italic">zeeklect.com</span>
                            </div>
                            <div className="hidden md:block h-6 w-px bg-[var(--card-border)] opacity-30" />
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={28} className="text-emerald-500" />
                                <span className="text-xs font-black uppercase tracking-[0.4em] text-[var(--site-text-muted)]">Verified Assets 2026</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

// ========================================
// REFINED SUB-COMPONENTS
// ========================================

function SocialIcon({ icon: Icon, href, color, label }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--site-text)]/5 flex items-center justify-center text-[var(--site-text-muted)] transition-all transform hover:scale-110 hover:-translate-y-2 ${color} border border-[var(--card-border)] hover:border-current shadow-sm print:border-none print:shadow-none print:bg-transparent print:text-black print:w-auto print:h-auto print:mr-4`}
        >
            <Icon size={24} className="print:hidden" />
            <span className="hidden print:inline text-xs font-bold underline">{label}</span>
        </a>
    );
}

function ExperienceCard({ exp, isGlassmorphicTheme }) {
    return (
        <div className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-6 md:p-10 border-l-[6px] border-l-blue-500 group relative hover:bg-blue-500/5 transition-all duration-500 print:p-0 print:border-none print:mb-6`}>
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 print:mb-2 print:flex-row print:justify-between">
                <div>
                    <h3 className="text-xl md:text-2xl font-black group-hover:text-blue-500 transition-colors uppercase tracking-tight print:text-black print:text-base">{exp.role}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs md:text-sm font-black opacity-60 uppercase print:text-black">{exp.company}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40 print:hidden" />
                        <span className="text-[10px] md:text-xs font-bold text-blue-500 uppercase tracking-widest print:text-black">{exp.duration}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 no-print">
                    {exp.technologies?.map((tech, i) => (
                        <span key={i} className="text-[9px] font-black uppercase bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 text-blue-600">
                            {tech}
                        </span>
                    ))}
                </div>
            </div>
            <p className="text-[var(--site-text-muted)] text-sm md:text-lg font-bold leading-relaxed opacity-80 whitespace-pre-wrap print:text-black print:text-xs print:font-medium">
                {exp.description}
            </p>
        </div>
    );
}

function CertificateCard({ cert, isGlassmorphicTheme, isRecruiterMode }) {
    return (
        <div className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-6 md:p-8 border-t-4 border-t-emerald-500 group hover:shadow-emerald-500/10 transition-all duration-500 print:p-0 print:mb-4 print:border-none`}>
            <div className="flex items-center justify-between mb-4 print:mb-1">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform no-print">
                    <Award size={24} />
                </div>
                {cert.link && (
                    <a href={cert.link} target="_blank" className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all no-print">
                        <ExternalLink size={16} />
                    </a>
                )}
            </div>
            <h4 className="text-lg md:text-xl font-black group-hover:text-emerald-500 transition-colors tracking-tight leading-tight uppercase print:text-black print:text-sm">{cert.title}</h4>
            <p className="text-[10px] md:text-[11px] font-black uppercase opacity-40 mt-2 tracking-widest print:text-black print:text-[10px]">{cert.issuer}</p>
            {cert.isVerified && (
                <div className="mt-6 flex items-center gap-2 text-emerald-500 bg-emerald-500/5 px-4 py-2 rounded-2xl border border-emerald-500/20 w-fit no-print">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isRecruiterMode ? "Verified Credential" : "Protocol Verified"}
                    </span>
                </div>
            )}
        </div>
    );
}

function SkillBar({ skill, isPremium, isRecruiterMode, profile }) {
    const showHoloBadge = isPremium && skill.isVerified && (profile?.hologramEnabled !== false);
    const showShimmer = showHoloBadge && (profile?.shimmerEnabled !== false);
    return (
        <div className="space-y-3 group print:space-y-1">
            <div className="flex justify-between items-center text-xs md:text-sm font-black uppercase tracking-widest">
                <span className="flex items-center gap-2 text-[var(--site-text)] print:text-black">
                    {skill.name}
                    {skill.isVerified && (
                        showHoloBadge ? (
                            isRecruiterMode ? (
                                <span className="px-2.5 py-0.5 rounded-lg text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest shadow-sm flex items-center gap-1 no-print select-none">
                                    <ShieldCheck size={10} />
                                    INDUSTRY VERIFIED
                                </span>
                            ) : (
                                <span className="holographic-badge px-2 py-0.5 rounded-lg text-[8px] font-black text-white uppercase tracking-widest shadow-sm flex items-center gap-1 animate-pulse no-print select-none">
                                    <Zap size={8} className="fill-white" />
                                    TELEMETRY VERIFIED
                                </span>
                            )
                        ) : (
                            <CheckCircle2 size={14} className="text-indigo-500 no-print" />
                        )
                    )}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 print:text-black">{skill.level}%</span>
            </div>
            <div className="h-2 md:h-3.5 w-full bg-[var(--site-text)]/5 rounded-full overflow-hidden border border-[var(--card-border)] print:hidden">
                <div
                    className={`h-full bg-gradient-to-r ${showShimmer ? 'from-sky-400 via-indigo-500 to-purple-500 animate-shimmer' : 'from-indigo-600 via-blue-500 to-indigo-600'} bg-[length:200%_100%] rounded-full transition-all duration-1000 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]`}
                    style={{ width: `${skill.level}%` }}
                />
            </div>
        </div>
    );
}

function ProjectCard({ project, isGlassmorphicTheme }) {
    return (
        <div className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-5 sm:p-6 lg:p-10 flex flex-col justify-between h-full border-b-4 border-b-amber-500 group hover:bg-amber-500/5 transition-all duration-500 shadow-xl print:p-0 print:border-none print:shadow-none print:mb-6`}>
            <div className="space-y-6 print:space-y-2">
                <div className="flex items-center justify-between no-print">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:rotate-12 transition-transform shadow-lg shadow-amber-500/10">
                        <Code2 size={24} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                    </div>
                    <div className="flex gap-3">
                        {project.githubLink && (
                            <SocialIconSmall icon={Github} href={project.githubLink} color="hover:text-indigo-500" />
                        )}
                        {project.link && (
                            <SocialIconSmall icon={Globe} href={project.link} color="hover:text-emerald-500" />
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-black group-hover:text-amber-600 transition-colors uppercase italic tracking-tighter print:text-black print:text-base">{project.title}</h3>
                    <p className="text-[var(--site-text-muted)] text-xs sm:text-sm lg:text-base font-bold mt-4 leading-relaxed opacity-80 italic print:text-black print:text-xs">
                        {project.description}
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-8 no-print">
                {project.technologies?.map((tech, i) => (
                    <span key={i} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-amber-500/5 rounded-xl border border-amber-500/20 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                        {tech}
                    </span>
                ))}
            </div>
        </div>
    );
}

function SocialIconSmall({ icon: Icon, href, color }) {
    return (
        <a href={href} target="_blank" className={`p-2 rounded-xl bg-[var(--site-text)]/5 text-[var(--site-text-muted)] ${color} transition-all hover:scale-110 active:scale-90 border border-[var(--card-border)]`}>
            <Icon size={18} />
        </a>
    );
}

function MissionCard({ mission, isGlassmorphicTheme, isRecruiterMode }) {
    return (
        <div className={`${isGlassmorphicTheme ? 'glass-card' : 'card-elite'} p-6 sm:p-8 lg:p-12 flex flex-col lg:flex-row gap-6 lg:gap-10 hover:border-indigo-500 group transition-all duration-500 bg-gradient-to-br from-[var(--card-bg)] via-[var(--card-bg)] to-indigo-500/5 no-print`}>
            <div className="relative shrink-0 w-fit">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-36 lg:h-36 rounded-[2rem] lg:rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-[0_20px_50px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform duration-700">
                    <Layers className="w-10 h-10 lg:w-16 lg:h-16" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 lg:border-4 border-white dark:border-slate-900 animate-bounce">
                    <ShieldCheck size={16} className="lg:w-5 lg:h-5" />
                </div>
            </div>

            <div className="flex-1 space-y-6">
                <div>
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter group-hover:text-indigo-600 transition-colors uppercase italic">
                                {mission.title}
                            </h3>
                            <div className="flex flex-wrap gap-3 mt-3">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 px-4 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                    {mission.skill} Mastery
                                </span>
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-4 py-1.5 bg-slate-500/5 rounded-xl border border-slate-500/20">
                                    {mission.difficulty} Complexity
                                </span>
                            </div>
                        </div>
                        <div className="hidden lg:flex px-6 py-3 rounded-full bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 text-[11px] font-black uppercase tracking-[0.2em] items-center gap-3 backdrop-blur-sm">
                            <Zap size={16} className="text-amber-500" />
                            {isRecruiterMode ? "Performance Validated" : "Elite Validation"}
                        </div>
                    </div>
                    <p className="mt-6 text-[var(--site-text-muted)] text-sm sm:text-base lg:text-lg font-bold leading-relaxed opacity-70 italic font-medium">
                        {mission.description}
                    </p>
                </div>

                <div className="flex flex-wrap gap-6 lg:gap-8 pt-6 lg:pt-8 border-t border-indigo-500/10">
                    <Stat icon={Clock} label={`${mission.duration} MINS`} color="text-indigo-400" />
                    {isRecruiterMode ? (
                        <Stat icon={Trophy} label="VERIFIED PROOF" color="text-amber-500" />
                    ) : (
                        <Stat icon={Trophy} label={`${mission.points} XP EARNED`} color="text-amber-500" />
                    )}
                    <Stat icon={Layers} label={`${mission.stageCount} ARCHITECTURES`} color="text-blue-500" />
                </div>
            </div>

            <div className="flex lg:flex-col items-center justify-end lg:justify-center shrink-0 mt-4 lg:mt-0">
                <a href={`/missions/${mission.id}`} className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl bg-indigo-600 text-white hover:bg-white hover:text-indigo-600 hover:rotate-12 transition-all shadow-xl flex items-center justify-center group/btn border-2 border-transparent hover:border-indigo-600 shrink-0">
                    <ExternalLink size={20} className="lg:w-7 lg:h-7 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform shrink-0" />
                </a>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, color = "text-[var(--site-text-muted)]" }) {
    return (
        <div className={`flex items-center gap-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] ${color}`}>
            <Icon size={18} />
            {label}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="min-h-screen bg-[var(--site-bg)] flex flex-col items-center justify-center space-y-12 p-8 overflow-hidden">
            <div className="relative">
                <div className="w-32 h-32 border-[12px] border-indigo-500/5 rounded-[3rem] animate-pulse" />
                <div className="absolute inset-0 w-32 h-32 border-[12px] border-indigo-500 border-t-transparent rounded-[3rem] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={40} className="text-indigo-500 animate-bounce" />
                </div>
            </div>
            <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-black text-gradient-elite tracking-tighter uppercase italic">Synthesizing Digital Essence</h2>
                <p className="text-[var(--site-text-muted)] font-black uppercase tracking-[0.5em] text-[10px] animate-pulse whitespace-nowrap">Bytez Protocol Active • Validating Assets</p>
            </div>
        </div>
    );
}

function ErrorState({ message }) {
    return (
        <div className="min-h-screen bg-[var(--site-bg)] flex flex-col items-center justify-center space-y-12 p-8 text-center">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[3.5rem] bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-2xl border-2 border-rose-500/20 animate-bounce">
                <Globe size={64} />
            </div>
            <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--site-text)] uppercase italic">Sync Disrupted</h2>
                <p className="max-w-md text-sm md:text-xl font-bold text-[var(--site-text-muted)] uppercase tracking-tight opacity-60 leading-tight mx-auto">{message}</p>
            </div>
            <button
                onClick={() => window.location.reload()}
                className="px-8 md:px-12 py-4 md:py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center gap-4 mx-auto"
            >
                RE-ESTABLISH HANDSHAKE 🛰️
            </button>
        </div>
    );
}

// Language Card Component
function LanguageCard({ lang }) {
    const proficiencyColors = {
        native: 'bg-green-500',
        fluent: 'bg-blue-500',
        professional: 'bg-indigo-500',
        intermediate: 'bg-amber-500',
        basic: 'bg-gray-400'
    };

    const proficiencyLabels = {
        native: 'Native',
        fluent: 'Fluent',
        professional: 'Professional',
        intermediate: 'Intermediate',
        basic: 'Basic'
    };

    return (
        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors print:border-gray-300 print:bg-transparent">
            <div className="font-bold text-base mb-2 print:text-sm">{lang.name}</div>
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${proficiencyColors[lang.proficiency] || 'bg-gray-400'} print:hidden`} />
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider print:text-black">
                    {proficiencyLabels[lang.proficiency] || 'Basic'}
                </span>
            </div>
        </div>
    );
}

// Award Card Component
function AwardCard({ award, isGlassmorphicTheme }) {
    return (
        <div className="card-elite p-6 border-l-[6px] border-l-yellow-500 group hover:bg-yellow-500/5 transition-colors print:p-4 print:border-none">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 print:hidden">
                    <Trophy size={24} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-lg group-hover:text-yellow-500 transition-colors print:text-black print:text-base">{award.title}</h4>
                    {award.issuer && (
                        <p className="text-sm font-semibold opacity-60 mt-1 print:text-xs">{award.issuer}</p>
                    )}
                    {award.date && (
                        <span className="inline-block mt-2 text-[10px] font-bold bg-yellow-500/10 px-3 py-1 rounded-lg text-yellow-600 print:text-xs print:bg-transparent print:p-0">{award.date}</span>
                    )}
                    {award.description && (
                        <p className="text-sm opacity-70 mt-2 print:text-xs">{award.description}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function PrintStyles() {
    return (
        <style dangerouslySetInnerHTML={{
            __html: `
            /* ATS-FRIENDLY RESUME PRINT STYLES */
            @media print {
                /* Force full reset of any sidebar wrapper offsets and padding */
                html, body, #__next, [class*="lg:ml-"], [class*="ml-"], main, #main-content, .container, .min-h-screen {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    left: 0 !important;
                    position: static !important;
                    transform: none !important;
                }

                /* Page Setup - Standard Resume Format */
                @page {
                    size: A4;
                    margin: 0.6in 0.5in;
                }
                
                /* Reset & Base Styles */
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                html, body {
                    background: white !important;
                    color: #111 !important;
                    font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif !important;
                    font-size: 11pt !important;
                    line-height: 1.5 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                
                /* Hide Non-Essential Elements */
                .no-print,
                nav,
                footer,
                .navbar,
                button,
                .fixed,
                .animate-pulse,
                .animate-bounce,
                [class*="hover:"],
                .badge-elite,
                .shadow-elite {
                    display: none !important;
                }
                
                /* Main Container */
                .min-h-screen {
                    min-height: auto !important;
                    padding: 0 !important;
                    background: white !important;
                }
                
                /* Header Section - Contact Info */
                .text-gradient-elite {
                    background: none !important;
                    -webkit-background-clip: unset !important;
                    -webkit-text-fill-color: #1a1a1a !important;
                    color: #1a1a1a !important;
                    font-size: 22pt !important;
                    font-weight: 700 !important;
                    margin-bottom: 4px !important;
                }
                
                /* Section Headers */
                h2, h3, .text-2xl, .text-3xl {
                    color: #000 !important;
                    font-weight: 800 !important;
                    border-bottom: 2pt solid #000 !important;
                    padding-bottom: 6px !important;
                    margin-bottom: 12px !important;
                    margin-top: 24px !important;
                    font-size: 13pt !important;
                    text-transform: uppercase !important;
                    letter-spacing: 1px !important;
                }
                
                /* Cards & Sections */
                .card-elite,
                [class*="rounded-[2rem]"],
                [class*="rounded-[3rem]"] {
                    background: white !important;
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    padding: 8px 0 !important;
                    margin: 0 !important;
                    page-break-inside: avoid !important;
                }
                
                /* Experience & Education Items */
                .pm-card, .experience-card, .education-card {
                    border-left: 2pt solid #333 !important;
                    padding-left: 10px !important;
                    margin-bottom: 10px !important;
                    background: white !important;
                }
                
                /* Job Titles & Company Names */
                h4, .font-black {
                    color: #1a1a1a !important;
                    font-weight: 600 !important;
                    font-size: 10.5pt !important;
                    margin-bottom: 2px !important;
                }
                
                /* Dates & Meta Info */
                .text-xs, .text-sm, [class*="text-[10px]"], [class*="text-[11px]"] {
                    font-size: 9pt !important;
                    color: #444 !important;
                }
                
                /* Skills Section - Inline Display */
                .skill-tag, [class*="bg-indigo"], [class*="bg-emerald"], [class*="bg-purple"] {
                    background: #f0f0f0 !important;
                    color: #1a1a1a !important;
                    border: 0.5pt solid #999 !important;
                    border-radius: 2px !important;
                    padding: 2px 6px !important;
                    font-size: 9pt !important;
                    display: inline-block !important;
                    margin: 2px 3px 2px 0 !important;
                }
                
                /* Bullet Points */
                ul, li {
                    margin: 0 !important;
                    padding-left: 15px !important;
                }
                li {
                    margin-bottom: 3px !important;
                    font-size: 10pt !important;
                    color: #333 !important;
                }
                
                /* Links - Show URL */
                a {
                    color: #1a1a1a !important;
                    text-decoration: none !important;
                }
                a[href^="http"]:after {
                    content: " (" attr(href) ")";
                    font-size: 8pt;
                    color: #666;
                    word-break: break-all;
                }
                
                /* Grid to Column Layout */
                .grid {
                    display: block !important;
                }
                .grid > * {
                    width: 100% !important;
                    max-width: 100% !important;
                }
                
                /* Icons Hidden or Minimal */
                svg {
                    display: none !important;
                }
                
                /* Gradients to Solid */
                [class*="from-"], [class*="to-"], [class*="via-"] {
                    background: white !important;
                }
                
                /* Remove Animations */
                [class*="animate-"], [class*="transition-"], [class*="hover:"] {
                    animation: none !important;
                    transition: none !important;
                }
                
                /* Page Breaks */
                section, .section {
                    page-break-inside: avoid !important;
                }
                h2, h3 {
                    page-break-after: avoid !important;
                }
                
                /* Certificate & Award Badges */
                .verified-badge {
                    border: 0.5pt solid #28a745 !important;
                    color: #28a745 !important;
                    background: white !important;
                    font-size: 8pt !important;
                    padding: 1px 4px !important;
                }
                
                /* Professional Summary */
                .professional-summary, .summary-text {
                    font-size: 10pt !important;
                    line-height: 1.5 !important;
                    color: #333 !important;
                    margin-bottom: 12px !important;
                    text-align: justify !important;
                }
                
                /* Contact Info Header */
                .contact-info {
                    text-align: center !important;
                    margin-bottom: 10px !important;
                    padding-bottom: 8px !important;
                    border-bottom: 1pt solid #ccc !important;
                }
                .contact-info span {
                    margin: 0 8px !important;
                    font-size: 9pt !important;
                }
                
                /* Ensure Readability */
                p, span, div {
                    orphans: 3 !important;
                    widows: 3 !important;
                }
                
                /* Remove Background Colors */
                [class*="bg-"] {
                    background-color: transparent !important;
                }
                
                /* Reset Rounded Corners */
                [class*="rounded"] {
                    border-radius: 0 !important;
                }
                
                /* Fix Width Issues */
                .container, .max-w-6xl, .max-w-7xl {
                    max-width: 100% !important;
                    width: 100% !important;
                    padding: 0 !important;
                }
            }
        `}} />
    );
}

function BuildYourPortfolioState({ user, onEdit }) {
    return (
        <div className="min-h-screen bg-[var(--site-bg)] px-4 py-24 flex items-center justify-center relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[5%] w-[45%] h-[45%] rounded-full blur-[140px] bg-indigo-500 opacity-[0.07] animate-pulse" />
                <div className="absolute bottom-[10%] right-[5%] w-[35%] h-[35%] rounded-full blur-[120px] bg-purple-500 opacity-[0.06]" />
            </div>

            <div className="max-w-3xl w-full relative z-10 space-y-12">
                {/* Header Banner */}
                <div className="text-center space-y-4">
                    <span className="px-5 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-500/20 inline-flex items-center gap-2">
                        <Sparkles size={14} className="animate-pulse" />
                        Candidate Dashboard Hub
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-gradient-elite tracking-tighter uppercase italic leading-none">
                        Your Portfolio is Ready 🚀
                    </h1>
                    <p className="text-base md:text-xl text-[var(--site-text-muted)] font-bold max-w-xl mx-auto leading-relaxed opacity-70">
                        Connect your real-world credentials, synchronized repositories, and AI summary to activate your verified professional dossier.
                    </p>
                </div>

                {/* Construction Guidance Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-6 shadow-xl space-y-4 hover:border-indigo-500/30 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <Github size={24} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-[var(--site-text)]">1. Connect GitHub</h3>
                        <p className="text-xs text-[var(--site-text-muted)] font-semibold leading-relaxed">
                            Synchronize your public codebases, stars, and language stats with one click.
                        </p>
                    </div>

                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-6 shadow-xl space-y-4 hover:border-emerald-500/30 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-[var(--site-text)]">2. AI Biography</h3>
                        <p className="text-xs text-[var(--site-text-muted)] font-semibold leading-relaxed">
                            Leverage Bytez AI to generate an elite, recruiter-optimized summary in seconds.
                        </p>
                    </div>

                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-6 shadow-xl space-y-4 hover:border-amber-500/30 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Briefcase size={24} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-[var(--site-text)]">3. Profile Details</h3>
                        <p className="text-xs text-[var(--site-text-muted)] font-semibold leading-relaxed">
                            Add professional experiences, education, and credentials to build credibility.
                        </p>
                    </div>
                </div>

                {/* Call-to-action */}
                <div className="text-center">
                    <button
                        onClick={onEdit}
                        className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_12px_35px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-3"
                    >
                        LAUNCH PORTFOLIO EDITOR ⚡
                    </button>
                </div>
            </div>
        </div>
    );
}

function UnderConstructionState({ user, socialLinks }) {
    return (
        <div className="min-h-screen bg-[var(--site-bg)] px-4 py-24 flex items-center justify-center relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[5%] w-[45%] h-[45%] rounded-full blur-[140px] bg-indigo-500 opacity-[0.06] animate-pulse" />
                <div className="absolute bottom-[10%] right-[5%] w-[35%] h-[35%] rounded-full blur-[120px] bg-purple-500 opacity-[0.05]" />
            </div>

            <div className="max-w-2xl w-full text-center relative z-10 space-y-12">
                {/* Identity Shield */}
                <div className="relative inline-block">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[3rem] bg-gradient-to-br from-indigo-500 to-purple-500 p-1 shadow-2xl mx-auto">
                        <div className="w-full h-full bg-[var(--card-bg)] rounded-[2.8rem] overflow-hidden flex items-center justify-center p-2">
                            <img
                                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                                alt={user.name}
                                className="w-full h-full object-cover rounded-[2.5rem]"
                            />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-2xl shadow-xl border-4 border-[var(--site-bg)] flex items-center justify-center animate-bounce">
                        <Cpu size={16} />
                    </div>
                </div>

                {/* Construction Information */}
                <div className="space-y-4">
                    <span className="px-5 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Portfolio Under Construction
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-gradient-elite tracking-tighter uppercase italic leading-none animate-in fade-in zoom-in duration-500">
                        {user.name}
                    </h1>
                    <p className="text-base md:text-xl text-[var(--site-text-muted)] font-bold max-w-md mx-auto leading-relaxed opacity-85 pt-2">
                        This candidate is currently modeling their verified career telemetry and Personal Knowledge Graph. Check back soon to view industry-verified skills and code integrations.
                    </p>
                </div>

                {/* Social links fallback */}
                {socialLinks && Object.values(socialLinks).some(Boolean) && (
                    <div className="space-y-6 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--site-text-muted)] opacity-60">Connect Directly with the Candidate</p>
                        <div className="flex justify-center gap-4">
                            {socialLinks.linkedin && (
                                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-2xl bg-[var(--site-text)]/5 flex items-center justify-center text-[var(--site-text-muted)] hover:text-blue-500 border border-[var(--card-border)] hover:border-blue-500 shadow-md hover:scale-110 active:scale-95 transition-all">
                                    <Linkedin size={24} />
                                </a>
                            )}
                            {socialLinks.github && (
                                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-2xl bg-[var(--site-text)]/5 flex items-center justify-center text-[var(--site-text-muted)] hover:text-indigo-500 border border-[var(--card-border)] hover:border-indigo-500 shadow-md hover:scale-110 active:scale-95 transition-all">
                                    <Github size={24} />
                                </a>
                            )}
                            {socialLinks.twitter && (
                                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-2xl bg-[var(--site-text)]/5 flex items-center justify-center text-[var(--site-text-muted)] hover:text-sky-500 border border-[var(--card-border)] hover:border-sky-500 shadow-md hover:scale-110 active:scale-95 transition-all">
                                    <Twitter size={24} />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Branding Footer */}
                <div className="pt-16 opacity-50 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--site-text-muted)]">
                    <ShieldCheck size={14} className="text-indigo-500" />
                    <span>Zeeklect Protocol Verified Profile</span>
                </div>
            </div>
        </div>
    );
}

