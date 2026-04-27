"use client";
import { Suspense } from "react";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import Surface from "../../components/ui/Surface";
import ConfirmModal from "../../components/ui/ConfirmModal";
import LearningBrainWidget from "../../components/personalization/LearningBrainWidget";
import Breadcrumb from "../../components/ui/Breadcrumb";
import {
  BookMarked,
  TrendingUp,
  LogOut,
  Award,
  ArrowUpRight,
  Trash2,
  Sparkles,
  Target,
  Clock,
  Globe,
  Brain,
  ArrowRight,
  ArrowLeft,
  Calendar,
  X,
  Wrench,
  LayoutDashboard,
  Layout,
  Settings,
  Heart,
  Pause,
  Trophy,
  ExternalLink,
  Radar,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Skeleton, { StatsSkeleton } from "../../components/ui/Skeleton";
import { motion } from "framer-motion";
import ResumeBuilder from "../../components/personalization/ResumeBuilder";
import HiringReadinessWidget from "../../components/career/HiringReadinessWidget";
import CareerTimelineVisual from "../../components/career/CareerTimelineVisual";
import NotificationBell from "../../components/career/NotificationBell";
import SkillValidationModal from "../../components/career/SkillValidationModal";
import OnboardingModal from "../../components/personalization/OnboardingModal";
import TodayActionsWidget from "../../components/career/TodayActionsWidget";




function DashboardPageContent() {
  const { user, token, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // overview, portfolio
  const [deletingId, setDeletingId] = useState(null);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === 'portfolio') {
      setActiveTab('portfolio');
    } else if (tabParam === 'overview') {
      setActiveTab('overview');
    }
  }, [tabParam]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [showAnalysisConfirm, setShowAnalysisConfirm] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState(null);
  const [deletingAnalysis, setDeletingAnalysis] = useState(null);
  const [showToolConfirm, setShowToolConfirm] = useState(false);
  const [toolToDelete, setToolToDelete] = useState(null);
  const [deletingTool, setDeletingTool] = useState(null);
  const [showOppConfirm, setShowOppConfirm] = useState(false);
  const [oppToDelete, setOppToDelete] = useState(null);
  const [deletingOpp, setDeletingOpp] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [validationSkill, setValidationSkill] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSettling, setOnboardingSettling] = useState(false);

  const router = useRouter();

  const queryClient = useQueryClient();

  const {
    data: savedCourses,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      return await api.getFavorites(token);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const { data: savedAnalyses } = useQuery({
    queryKey: ["saved-analyses", user?.id],
    queryFn: () => api.getSavedAnalyses(token),
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: savedToolsData } = useQuery({
    queryKey: ["tool-favorites", user?.id],
    queryFn: () => api.getToolFavorites(token),
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: savedOppsData } = useQuery({
    queryKey: ["saved-opportunities", user?.id],
    queryFn: () => api.getSavedOpportunities(token),
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: learnerProfileData } = useQuery({
    queryKey: ["learner-profile", user?.id],
    queryFn: () => api.getLearnerProfile(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const { data: dailyActions, isLoading: actionsLoading } = useQuery({
    queryKey: ["daily-actions", user?.id],
    queryFn: () => api.getDailyActions(token),
    enabled: !!token && user?.onboardingComplete,
  });

  // Log dashboard visit for session tracking
  useEffect(() => {
    if (token) {
      api.logActivity({ action: 'dashboard_visit', feature: 'dashboard' }, token);
    }
  }, [token]);

  useEffect(() => {
    if (!user) return;
    
    if (!learnerProfileData) {
      if (!user.onboardingComplete) setShowOnboarding(true);
      return;
    }

    const hasTargetRole = learnerProfileData?.profile?.goals?.targetRole;

    if (!hasTargetRole) {
      setShowOnboarding(true);
    } else if (!user.onboardingComplete) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user, learnerProfileData]);

  const savedTools = savedToolsData?.tools || [];
  const savedOpportunities = savedOppsData?.data || [];

  const handleRemoveTool = (tool) => {
    setToolToDelete(tool);
    setShowToolConfirm(true);
  };

  const confirmRemoveTool = async () => {
    if (!toolToDelete) return;
    setDeletingTool(toolToDelete.name);
    try {
      await api.removeToolFavorite(toolToDelete.name, token);
      await queryClient.invalidateQueries({ queryKey: ["tool-favorites"] });

      const notification = document.createElement("div");
      notification.className = "fixed top-24 right-6 z-[300] bg-red-500 text-white px-6 py-4 rounded-2xl font-black shadow-2xl animate-in slide-in-from-right duration-500";
      notification.textContent = "✓ Tool Removed";
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add("animate-out", "slide-out-to-right");
        setTimeout(() => notification.remove(), 500);
      }, 2000);
    } catch (error) {
      console.error("Remove tool error:", error);
    } finally {
      setDeletingTool(null);
      setToolToDelete(null);
      setShowToolConfirm(false);
    }
  };

  const handleRemoveOpportunity = (opp) => {
    setOppToDelete(opp);
    setShowOppConfirm(true);
  };

  const confirmRemoveOpportunity = async () => {
    if (!oppToDelete) return;
    setDeletingOpp(oppToDelete.signalId);
    try {
      await api.updateOpportunityStatus(oppToDelete.signalId, 'new', token);
      await queryClient.invalidateQueries({ queryKey: ["saved-opportunities"] });
      await queryClient.invalidateQueries({ queryKey: ["opportunity-radar"] });

      const notification = document.createElement("div");
      notification.className = "fixed top-24 right-6 z-[300] bg-red-500 text-white px-6 py-4 rounded-2xl font-black shadow-2xl animate-in slide-in-from-right duration-500";
      notification.textContent = "✓ Opportunity Removed";
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add("animate-out", "slide-out-to-right");
        setTimeout(() => notification.remove(), 500);
      }, 2000);
    } catch (error) {
      console.error("Remove opportunity error:", error);
    } finally {
      setDeletingOpp(null);
      setOppToDelete(null);
      setShowOppConfirm(false);
    }
  };

  const handleRemoveAnalysis = (analysis) => {
    setAnalysisToDelete(analysis);
    setShowAnalysisConfirm(true);
  };

  const confirmRemoveAnalysis = async () => {
    if (!analysisToDelete) return;
    setDeletingAnalysis(analysisToDelete.role);
    try {
      await api.removeSavedAnalysis(analysisToDelete.role, token);
      await queryClient.invalidateQueries({ queryKey: ["saved-analyses"] });

      const notification = document.createElement("div");
      notification.className = "fixed top-24 right-6 z-[300] bg-red-500 text-white px-6 py-4 rounded-2xl font-black shadow-2xl animate-in slide-in-from-right duration-500";
      notification.textContent = "✓ Analysis Removed";
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add("animate-out", "slide-out-to-right");
        setTimeout(() => notification.remove(), 500);
      }, 2000);
    } catch (error) {
      console.error("Remove analysis error:", error);
    } finally {
      setDeletingAnalysis(null);
      setAnalysisToDelete(null);
      setShowAnalysisConfirm(false);
    }
  };

  const handleRemoveCourse = (course) => {
    setCourseToDelete(course);
    setShowConfirm(true);
  };

  const confirmRemove = async () => {
    if (!courseToDelete) return;
    setDeletingId(courseToDelete.courseId);
    try {
      await api.removeCourse(courseToDelete.courseId, token);
      refetch();
      const notification = document.createElement("div");
      notification.className = "fixed top-24 right-6 z-[300] bg-red-500 text-white px-6 py-4 rounded-2xl font-black shadow-2xl animate-in slide-in-from-right duration-500";
      notification.textContent = "✓ Removed from Library";
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add("animate-out", "slide-out-to-right");
        setTimeout(() => notification.remove(), 500);
      }, 2000);
    } catch (error) {
      console.error("Remove error:", error);
    } finally {
      setDeletingId(null);
      setCourseToDelete(null);
      setShowConfirm(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--site-bg)] p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <LayoutDashboard className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--site-text)] mb-3">
            Your Learning Dashboard
          </h2>
          <p className="text-sm sm:text-base text-[var(--site-text-muted)] mb-8 leading-relaxed">
            Sign in to access your personalized dashboard, track your saved courses, view skill analyses, and monitor your learning progress.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/auth/login" className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/signup" className="w-full sm:w-auto px-8 py-3 bg-[var(--site-text)]/5 text-[var(--site-text)] rounded-2xl font-bold text-sm hover:bg-[var(--site-text)]/10 transition-all border border-[var(--card-border)]">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-7xl space-y-16 animate-in fade-in duration-700">
        <Skeleton className="h-64 sm:h-80 w-full rounded-[2.5rem] sm:rounded-[3.5rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-10">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <Skeleton className="h-10 w-48 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatsSkeleton /> <StatsSkeleton /> <StatsSkeleton /> <StatsSkeleton />
            </div>
          </div>
          <div className="lg:col-span-8 space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <Skeleton className="h-10 w-56 rounded-xl" />
              </div>
              <Skeleton className="h-10 w-32 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-32 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const coursesCount = savedCourses?.length || 0;
  const totalXP = user?.gamification?.xp || coursesCount * 10;
  const currentLevel = Math.floor(totalXP / 100) + 1;

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-500 pb-16">
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          {activeTab === 'overview' ? (
            <Breadcrumb currentPage="Dashboard" currentIcon={LayoutDashboard} />
          ) : (
            <Breadcrumb currentPage="AI Resume Builder" currentIcon={Sparkles} homeLabel="Dashboard" homeIcon={LayoutDashboard} onHomeClick={() => setActiveTab('overview')} />
          )}

            <div className="flex bg-[var(--site-text)]/5 p-1.5 rounded-2xl border border-[var(--card-border)] w-fit self-center md:self-auto items-center gap-4">
              <button onClick={() => { setActiveTab('overview'); router.push('/dashboard', { scroll: false }); }} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'overview' ? 'bg-white dark:bg-slate-800 text-[var(--accent-primary)] shadow-lg scale-105' : 'text-[var(--site-text-muted)] hover:text-[var(--site-text)]'}`}>
                <LayoutDashboard size={16} /> OVERVIEW
              </button>
              <button onClick={() => { setActiveTab('portfolio'); router.push('/dashboard?tab=portfolio', { scroll: false }); }} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'portfolio' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-lg scale-105' : 'text-[var(--site-text-muted)] hover:text-[var(--site-text)]'}`}>
                <Sparkles size={16} /> AI RESUME BUILDER
              </button>
            </div>

        </div>

        {activeTab === 'portfolio' ? (
          <div className="animate-in fade-in slide-in-from-bottom duration-700">
            <ResumeBuilder token={token} initialData={{
              targetRole: learnerProfileData?.profile?.goals?.targetRole,
              portfolio: learnerProfileData?.profile?.portfolio,
              masteredSkills: learnerProfileData?.profile?.masteredSkills
            }} />
          </div>
        ) : (
          <>
            <div className="relative p-8 sm:p-12 lg:p-16 rounded-[2.5rem] sm:rounded-[3.5rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white border-none mb-16 overflow-hidden shadow-[var(--shadow-elite)] group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
              <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[80px]" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-10">
                  <div className="relative group/avatar">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 backdrop-blur-xl flex items-center justify-center text-5xl font-black border-4 border-white/20 shadow-2xl transition-all duration-500 group-hover/avatar:rotate-[10deg] group-hover/avatar:scale-110 overflow-hidden">
                      {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : (user?.name?.charAt(0)?.toUpperCase() || 'U')}
                    </div>
                    <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white font-black text-sm flex items-center justify-center shadow-2xl border-2 border-white/40">
                      L{currentLevel}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-5xl lg:text-6xl font-black tracking-tighter mb-3 leading-tight">{user?.name || user?.email?.split("@")[0] || 'User'}</h1>
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                      <span className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border border-white/10 flex items-center gap-2"><Sparkles size={14} /> Elite Learner</span>
                      <span className="px-5 py-2 rounded-xl bg-indigo-500/30 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.3em] border border-white/10">{totalXP} XP</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">
                  <Link href="/settings/profile" className="px-8 py-5 bg-white/10 hover:bg-white text-white hover:text-indigo-800 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 border border-white/20 hover:scale-105 shadow-xl">
                    <Settings size={18} strokeWidth={2.5} /> Settings
                  </Link>
                  <button onClick={() => { setActiveTab('portfolio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-8 py-5 bg-gradient-to-r from-emerald-400 to-teal-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl hover:scale-105">
                    <Globe size={18} strokeWidth={2.5} /> View Portfolio
                  </button>
                  <button onClick={logout} className="px-8 py-5 bg-white/10 hover:bg-rose-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 border border-white/20 hover:scale-105 shadow-xl">
                    <LogOut size={18} strokeWidth={2.5} /> Sign Out
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-16 animate-in fade-in duration-1000">
              <HiringReadinessWidget onBoost={(skill) => {
                setValidationSkill(skill || "Core Competency");
                setShowValidation(true);
              }} />
            </div>

            {user?.onboardingComplete && (
              <div className="mb-16 animate-in fade-in duration-1000">
                <TodayActionsWidget actions={dailyActions?.data} isLoading={actionsLoading} />
              </div>
            )}

            {!user?.onboardingComplete && showOnboarding && (
              <OnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                onComplete={async () => {
                  setOnboardingSettling(true);
                  await refreshUser();
                  await Promise.all([
                    queryClient.refetchQueries({ queryKey: ["hiring-readiness"] }),
                    queryClient.refetchQueries({ queryKey: ["career-timeline"] }),
                    queryClient.refetchQueries({ queryKey: ["daily-actions", user?.id] }),
                    queryClient.refetchQueries({ queryKey: ["learner-profile", user?.id] }),
                  ]);
                  setShowOnboarding(false);
                  setOnboardingSettling(false);
                }}
              />
            )}

            <div className="mb-16 animate-in fade-in duration-1000">
              <LearningBrainWidget suppressOnboarding={!user?.onboardingComplete || showOnboarding || onboardingSettling} />
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><TrendingUp size={24} className="text-blue-500" /></div>
                  <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Your Stats</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Courses', val: coursesCount, icon: BookMarked, col: 'bg-blue-600' },
                    { label: 'Total XP', val: totalXP, icon: Target, col: 'bg-amber-500' },
                    { label: 'Mastery', val: `L${currentLevel}`, icon: Award, col: 'bg-purple-600' },
                    { label: 'Rank', val: '#42', icon: Globe, col: 'bg-emerald-500' }
                  ].map((stat, i) => (
                    <div key={i} className="p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm hover:shadow-[var(--shadow-elite)] transition-all group cursor-pointer hover:-translate-y-2">
                      <div className={`w-12 h-12 rounded-2xl ${stat.col} flex items-center justify-center mb-6 shadow-xl transition-transform group-hover:scale-110 text-white`}><stat.icon size={22} /></div>
                      <p className="text-3xl font-black text-[var(--site-text)] mb-1 tracking-tight">{stat.val}</p>
                      <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm space-y-4">
                  <Link href="/ai-intelligence" className="w-full group p-5 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.03] shadow-xl text-white">
                    <div className="flex items-center gap-4"><Brain size={22} strokeWidth={2.5} /><span className="font-black text-xs uppercase tracking-widest">AI Search</span></div>
                    <ArrowRight size={18} />
                  </Link>
                  <Link href="/wellbeing" className="w-full group p-5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.03] shadow-sm text-emerald-600 dark:text-emerald-400 hover:text-white">
                    <div className="flex items-center gap-4"><Heart size={22} strokeWidth={2.5} /><span className="font-black text-xs uppercase tracking-widest">Wellbeing</span></div>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><BookMarked size={24} className="text-indigo-500" /></div>
                    <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Saved Courses</h2>
                  </div>
                  <div className="px-5 py-2.5 bg-indigo-500/10 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">{coursesCount} Items</div>
                </div>
                <div className="grid gap-4 sm:gap-6">
                  {savedCourses && savedCourses.length > 0 ? savedCourses.map((course, i) => (
                    <div key={course.courseId || i} className="group card-elite p-5 sm:p-8 transition-all hover:-translate-y-1 relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 items-start">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-xl transition-transform group-hover:rotate-12 group-hover:scale-110 flex-shrink-0 mb-2 sm:mb-0">{i + 1}</div>
                      <div className="flex-1 min-w-0 w-full mb-4 sm:mb-0">
                        <h3 className="text-xl sm:text-2xl font-black text-[var(--site-text)] tracking-tight group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1 truncate">{course.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                          <span className="px-3 py-1 rounded-lg bg-[var(--site-text)]/5 border border-[var(--card-border)] text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)]">{course.platform}</span>
                          <span className={`px-3 py-1 rounded-lg bg-[var(--site-text)]/5 border border-[var(--card-border)] text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${course.type === "Free" ? "text-emerald-500" : "text-blue-500"}`}>{course.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 ml-auto sm:ml-0 mt-auto sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--card-border)] w-full sm:w-auto justify-end">
                        <a href={course.link} target="_blank" rel="noopener noreferrer" className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-[var(--site-text)]/5 hover:bg-[var(--accent-primary)] text-[var(--site-text-muted)] hover:text-white flex items-center justify-center transition-all border border-[var(--card-border)] shadow-sm"><ArrowUpRight size={18} strokeWidth={2.5} /></a>
                        <button onClick={() => handleRemoveCourse(course)} disabled={deletingId === course.courseId} className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-[var(--site-text)]/5 hover:bg-red-500 text-[var(--site-text-muted)] cursor-pointer hover:text-white flex items-center justify-center transition-all border border-[var(--card-border)] shadow-sm disabled:opacity-50"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  )) : (
                    <div className="py-32 text-center rounded-[3rem] bg-[var(--site-text)]/5 border-2 border-dashed border-[var(--card-border)] opacity-60">
                      <BookMarked size={40} className="mx-auto mb-4 opacity-30" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">No courses saved yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-24 animate-in fade-in duration-1000">
              <CareerTimelineVisual />
            </div>


            {savedAnalyses?.analyses && savedAnalyses.analyses.length > 0 && (
              <div className="mt-24 space-y-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20"><Brain size={24} className="text-purple-500" /></div>
                  <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Skill Analyses</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {savedAnalyses.analyses.map((analysis, i) => (
                    <div key={i} className="group card-elite p-8 transition-all hover:-translate-y-2 relative overflow-hidden">
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveAnalysis(analysis); }} className="absolute top-6 right-6 w-10 h-10 cursor-pointer rounded-xl bg-[var(--site-text)]/5 hover:bg-red-500 text-[var(--site-text-muted)] hover:text-white flex items-center justify-center transition-all"><X size={18} /></button>
                      <h3 className="text-2xl font-black text-[var(--site-text)] group-hover:text-purple-600 transition-colors tracking-tight line-clamp-1 mb-6 pr-14">{analysis.role}</h3>
                      <button onClick={() => router.push(`/skill-analysis?role=${encodeURIComponent(analysis.role)}`)} className="w-full py-5 bg-[var(--site-text)] cursor-pointer text-[var(--card-bg)] font-black rounded-3xl text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">View Details <Target size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {savedTools.length > 0 && (
              <div className="mt-24 space-y-12 text-center lg:text-left">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><Wrench size={24} className="text-emerald-500" /></div>
                  <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Saved Tools</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {savedTools.map((tool, i) => (
                    <div key={i} className="group card-elite p-8 transition-all hover:-translate-y-2 relative overflow-hidden">
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveTool(tool); }} className="absolute top-6 right-6 w-10 h-10 cursor-pointer rounded-xl bg-[var(--site-text)]/5 hover:bg-red-500 text-[var(--site-text-muted)] hover:text-white flex items-center justify-center transition-all"><X size={18} /></button>
                      <h3 className="text-2xl font-black text-[var(--site-text)] group-hover:text-emerald-600 transition-colors tracking-tight line-clamp-1 mb-6 pr-14">{tool.name}</h3>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer" className="w-full py-5 bg-[var(--site-text)] text-[var(--card-bg)] font-black rounded-3xl text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border border-[var(--card-border)]">Open Tool <ArrowUpRight size={18} /></a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {savedOpportunities.length > 0 && (
              <div className="mt-24 space-y-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><Globe size={24} className="text-indigo-500" /></div>
                  <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Saved Opportunities</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {savedOpportunities.map((match, i) => (
                    <div key={i} className="group card-elite p-8 transition-all hover:-translate-y-2 relative overflow-hidden">
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveOpportunity(match); }} className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-[var(--site-text)]/5 hover:bg-red-500 text-[var(--site-text-muted)] cursor-pointer hover:text-white flex items-center justify-center transition-all"><X size={18} /></button>
                      <h3 className="text-xl font-black text-[var(--site-text)] group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-1 mb-4 pr-14">{match.signal?.title}</h3>
                      <div className="flex items-center gap-2 mb-8"><span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">{Math.round((match.matchScore || 0) * 100)}% Match</span></div>
                      <a 
                        href={match.signal?.url || `https://www.google.com/search?q=${encodeURIComponent(match.signal?.title || 'career opportunity')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full py-4 bg-[var(--site-text)] text-[var(--card-bg)] font-black rounded-2xl text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                      >
                        Explore <ArrowUpRight size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <ConfirmModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={confirmRemove} title="Remove Course?" message="Are you sure you want to remove this course?" type="danger" />
        <ConfirmModal isOpen={showAnalysisConfirm} onClose={() => setShowAnalysisConfirm(false)} onConfirm={confirmRemoveAnalysis} title="Delete Analysis?" message="Are you sure you want to delete this analysis?" type="danger" />
        <ConfirmModal isOpen={showToolConfirm} onClose={() => setShowToolConfirm(false)} onConfirm={confirmRemoveTool} title="Remove Tool?" message="Are you sure you want to remove this AI tool?" type="danger" />
        <ConfirmModal isOpen={showOppConfirm} onClose={() => setShowOppConfirm(false)} onConfirm={confirmRemoveOpportunity} title="Unsave Opportunity?" message="Are you sure you want to remove this opportunity?" type="danger" />
        
        <SkillValidationModal 
          isOpen={showValidation} 
          onClose={() => setShowValidation(false)} 
          skill={validationSkill} 
          onValidated={() => {
            queryClient.invalidateQueries({ queryKey: ["hiring-readiness"] });
            queryClient.invalidateQueries({ queryKey: ["career-timeline"] });
          }}
        />
      </div>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
