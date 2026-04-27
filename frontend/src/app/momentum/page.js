"use client";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import Surface from "../../components/ui/Surface.jsx";
import StatsCards from "../../components/momentum/StatsCards.js";
import ActivityHeatmap from "../../components/momentum/ActivityHeatmap";
import SkillProgressBars from "../../components/momentum/SkillProgressBars";
import AchievementBadges from "../../components/momentum/AchievementBadges";
import ProgressChart from "../../components/momentum/ProgressChart";
import SkillHealthDashboard from "../../components/skillHealth/SkillHealthDashboard";
import Breadcrumb from "../../components/ui/Breadcrumb";
import {
  TrendingUp,
  Flame,
  Target,
  Sparkles,
  Award,
  BarChart3,
  Calendar,
} from "lucide-react";
import Skeleton, { StatsSkeleton } from "../../components/ui/Skeleton";

export default function MomentumTrackerPage() {
  const { token, user } = useAuth();

  // Fetch momentum data
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["momentum", user?.id],
    queryFn: async () => {
      const result = await api.getMomentumData(token);
      console.log("Momentum API Response:", result); // Debug log
      return result;
    },
    enabled: !!token && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Extract data from response
  const momentumData = response?.data;

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-7xl animate-in fade-in duration-700">
        <Breadcrumb currentPage="Growth Momentum" currentIcon={Flame} />
        
        {/* Hero Skeleton */}
        <div className="mt-8 mb-16">
          <Skeleton className="h-[400px] w-full rounded-[3.5rem]" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="space-y-12">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
           </div>

           {/* Large Chart Skeleton */}
           <Skeleton className="h-[500px] w-full rounded-[3rem]" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Flame size={48} className="text-red-600" />
          </div>
          <h3 className="text-2xl font-black text-red-600 mb-2">
            Failed to load momentum data
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {error.message || "Something went wrong"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No Token or No Data State - ELITE INITIALIZATION
  if (!token || !momentumData) {
    return (
      <div className="min-h-screen bg-[var(--site-bg)] pb-16">
        {/* Container with Breadcrumb */}
        <div className="container mx-auto px-6 py-16 max-w-7xl">
          <Breadcrumb currentPage="Momentum Tracker" currentIcon={Flame} />
        </div>

        {/* Centered Content */}
        <div className="flex items-center justify-center px-6">
          <div className="max-w-4xl w-full text-center animate-in fade-in zoom-in duration-1000">
            <div className="relative w-48 h-48 mx-auto mb-12 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/20 dark:from-orange-500/30 dark:to-red-500/30 rounded-[3rem] blur-3xl group-hover:from-orange-600/30 group-hover:to-red-600/30 transition-colors duration-1000" />
              <div className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-orange-600/10 to-red-600/10 dark:from-orange-500/20 dark:to-red-500/20 border border-orange-500/20 dark:border-orange-500/30 flex items-center justify-center shadow-2xl group-hover:-rotate-12 transition-transform duration-700">
                <TrendingUp size={80} className="text-orange-600/40 dark:text-orange-500/50 group-hover:text-orange-600/60 dark:group-hover:text-orange-500/70 transition-opacity" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Flame size={40} className="text-orange-600 dark:text-orange-500 animate-pulse drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
                </div>
              </div>
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-[var(--site-text)] tracking-tighter mb-6 leading-[0.9]">
              Sign In <span className="text-orange-600">Required</span>
            </h2>

            <p className="text-lg md:text-xl font-bold text-[var(--site-text-muted)] max-w-2xl mx-auto opacity-70 mb-12 leading-relaxed">
              Please sign in to view your learning progress, streaks, and activity history.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => (window.location.href = "/auth/login")}
                className="w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.4em] transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-orange-600/20 btn-tactile"
              >
                Sign In
              </button>
              <button
                onClick={() => (window.location.href = "/ai-intelligence")}
                className="w-full sm:w-auto px-12 py-6 bg-[var(--card-bg)] border-2 border-[var(--card-border)] text-[var(--site-text)] font-black rounded-2xl text-[10px] uppercase tracking-[0.4em] transition-all hover:bg-[var(--site-text)]/5 btn-tactile"
              >
                Start Learning
              </button>
            </div>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 opacity-40">
              {[
                { icon: Flame, label: 'Streaks' },
                { icon: Target, label: 'Focus Areas' },
                { icon: Award, label: 'Milestones' },
                { icon: BarChart3, label: 'Progress' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <stat.icon size={20} />
                  <span className="text-[8px] font-black uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300 pb-16 overflow-x-hidden">
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        {/* BREADCRUMB NAVIGATION */}
        <Breadcrumb currentPage="Growth Momentum" currentIcon={Flame} />

        {/* Hero Section */}
        <div className="relative mb-12 sm:mb-16 overflow-hidden rounded-3xl sm:rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-6 sm:p-12 md:p-16 shadow-[var(--shadow-elite)] group">
          {/* Elite Background Physics */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-transparent to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute -right-32 -top-32 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] animate-pulse-elite" />
          <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-red-600/5 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white shadow-2xl shadow-orange-600/20 group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 ring-4 ring-white/10">
                <Flame size={40} strokeWidth={2.5} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--site-text)] leading-[1.1]">
                  Your <span className="text-gradient-elite">Growth Journey</span>
                </h1>
                <p className="text-orange-600 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3 mt-4">
                  <Sparkles size={16} className="animate-pulse" /> Every Step Counts
                </p>
              </div>
            </div>
            <p className="text-xl text-[var(--site-text-muted)] max-w-4xl font-bold leading-relaxed opacity-80">
              Welcome to your personal growth dashboard! Here, you can see your learning streaks,
              skill progress, and celebrate your achievements. Keep pushing forward! 🚀
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Stats Cards */}
          {/* Stats Cards */}
          <StatsCards data={momentumData} />

          {/* 🏥 Skill Health Center - NEW */}
          <SkillHealthDashboard />

          {/* Activity Heatmap */}
          <ActivityHeatmap activityData={momentumData.activityData} />

          {/* Progress Chart */}
          <ProgressChart data={momentumData.weeklyProgress} />

          {/* Skill Progress */}
          <SkillProgressBars skills={momentumData.skills} />

          {/* Achievements */}
          <AchievementBadges achievements={momentumData.achievements} />
        </div>
      </div>
    </div>
  );
}
