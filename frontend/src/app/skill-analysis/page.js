"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import Surface from "../../components/ui/Surface";
import Modal from "../../components/ui/Modal";
import Breadcrumb from "../../components/ui/Breadcrumb";
import {
  Brain,
  Target,
  TrendingUp,
  Zap,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  Loader2,
  Award,
  X,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const CACHE_KEY = "skillAnalysis_cache";
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

function SkillAnalysisContent() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role");
  const queryClient = useQueryClient();
  const router = useRouter();

  // State management
  const [targetRole, setTargetRole] = useState(urlRole || "");
  const [lastSearchedRole, setLastSearchedRole] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info",
  });
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Cache indicators
  const [isFromCache, setIsFromCache] = useState(false);
  const [displayData, setDisplayData] = useState(null);

  // Fetch Learning Velocity (requires login)
  const { data: velocityData } = useQuery({
    queryKey: ["learning-velocity"],
    queryFn: () => api.getLearningVelocity(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Skill Proficiency (requires login)
  const { data: proficiencyData } = useQuery({
    queryKey: ["skill-proficiency"],
    queryFn: () => api.getSkillProficiency(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Career Paths (requires login)
  const { data: careerPathsData } = useQuery({
    queryKey: ["career-paths"],
    queryFn: () => api.getCareerPaths(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 10,
  });

  // Main skill analysis query (manual trigger only)
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["skill-analysis", lastSearchedRole],
    queryFn: async () => {
      if (!lastSearchedRole || !lastSearchedRole.trim()) {
        throw new Error("Role is required");
      }
      console.log("🎯 Fetching skill analysis for:", lastSearchedRole);
      return api.analyzeSkillGap(lastSearchedRole, token);
    },
    enabled: !!lastSearchedRole && hasAutoSearched,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });

  const isLoadingOrFetching = isLoading || isFetching;

  // Set mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // CACHE MANAGEMENT: Load from cache on mount
  useEffect(() => {
    if (!isMounted) return;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const { data: cachedData, timestamp, role } = parsed;
        const age = Date.now() - timestamp;

        if (age < CACHE_EXPIRY) {
          console.log("📦 Loading from cache:", role);
          setDisplayData(parsed.data);
          setAnalysisResult({
            data: parsed.data,
            provider: parsed.provider,
            model: parsed.model,
            success: true
          });
          setLastSearchedRole(role);
          setTargetRole(role);
          setIsFromCache(true);
        } else {
          console.log("🗑️ Cache expired, clearing...");
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error("❌ Cache load error:", error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, [isMounted]);

  // CACHE MANAGEMENT: Save new data to cache and update local state immediately
  useEffect(() => {
    if (!isMounted) return;
    if (!data?.data || isLoading || isFetching) return;

    try {
      console.log("%c🤖 AI Model Visibility Log (Skill Analysis)", "color: #4f46e5; font-weight: bold; font-size: 1.2em;");
      console.log(`%cProvider: %c${data.provider || 'default'}`, "font-weight: bold;", "color: #16a34a;");
      if (data.model) {
        console.log(`%cModel: %c${data.model}`, "font-weight: bold;", "color: #2563eb;");
      }

      if (data.isCached) {
        console.log(`%c🚀 [Double-Shield] Backend Cache Hit!`, "color: #f59e0b; font-weight: bold; font-size: 1.1em;");
      }

      const cacheData = {
        data: data.data,
        provider: data.provider,
        model: data.model,
        timestamp: Date.now(),
        role: lastSearchedRole,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log("💾 Saved to localStorage:", lastSearchedRole);

      // CRITICAL: Update both displayData and analysisResult consistently
      setDisplayData(data.data);
      setAnalysisResult({
        data: data.data,
        provider: data.provider,
        model: data.model,
        success: true
      });
      setIsFromCache(!!data.isCached);
    } catch (error) {
      console.error("❌ Cache save error:", error);
    }
  }, [data, isLoading, isFetching, lastSearchedRole, isMounted]);

  // AUTO-SEARCH when URL has role parameter
  useEffect(() => {
    if (!isMounted) return;
    if (urlRole && urlRole.trim() && !hasAutoSearched) {
      console.log("🎯 Auto-analyzing for role:", urlRole);

      // Check if cached role matches URL role
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { role: cachedRole, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (cachedRole.toLowerCase() === urlRole.toLowerCase() && age < CACHE_EXPIRY) {
            console.log("✅ Using valid cached data for URL role without refetching API");
            setTargetRole(urlRole);
            setLastSearchedRole(urlRole);
            setHasAutoSearched(true);
            return;
          }
        }
      } catch (error) {
        console.error("Cache check error:", error);
      }

      setTargetRole(urlRole);
      setLastSearchedRole(urlRole);
      setHasAutoSearched(true);
      // Trigger analysis automatically if it's the same role we already searched
      if (lastSearchedRole === urlRole) {
        setTimeout(() => refetch(), 0);
      }
    }
  }, [urlRole, hasAutoSearched, isMounted, refetch]);

  // SCROLL MANAGEMENT: Auto-scroll to results when data appears
  useEffect(() => {
    if (!isLoadingOrFetching && displayData) {
      const resultsElement = document.getElementById("analysis-results");
      if (resultsElement) {
        // Small delay to ensure render layout is stable
        setTimeout(() => {
          const headerOffset = 100;
          const elementPosition = resultsElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }, 300);
      }
    }
  }, [isLoadingOrFetching, displayData]);

  // Handle manual search
  // Main analysis trigger
  const handleAnalyze = (e) => {
    if (e) e.preventDefault();
    if (!targetRole.trim()) {
      setModalConfig({
        title: "Input Required",
        message: "Please specify a target role for deep analysis.",
        type: "warning",
      });
      setShowModal(true);
      return;
    }

    console.log("🚀 Executing primary analysis protocol for:", targetRole);
    setLastSearchedRole(targetRole);
    setHasAutoSearched(true);
    if (targetRole === lastSearchedRole) {
      setTimeout(() => refetch(), 0);
    }
  };

  // Immediate trigger for suggestions
  const triggerImmediateAnalysis = (role) => {
    console.log("⚡ Triggering immediate analysis for suggestion:", role);
    setTargetRole(role);
    setLastSearchedRole(role);
    setHasAutoSearched(true);
    if (role === lastSearchedRole) {
      setTimeout(() => refetch(), 0);
    }
  };



  const priorityColors = {
    Critical: "from-red-500 to-rose-600",
    High: "from-orange-500 to-amber-600",
    Medium: "from-blue-500 to-blue-600",
    Low: "from-neutral-500 to-neutral-600",
  };

  const demandColors = {
    High: "text-emerald-500",
    Medium: "text-amber-500",
    Low: "text-neutral-500",
  };

  // ✅ UPDATE THIS FUNCTION
  const handleSaveAnalysis = async () => {
    if (!displayData || !lastSearchedRole || !token) {
      setModalConfig({
        title: 'Cannot Save',
        message: 'No analysis data to save. Please run an analysis first.',
        type: 'warning'
      });
      setShowModal(true);
      return;
    }

    setIsSaving(true);

    try {
      console.log('💾 Saving analysis to dashboard...');

      const analysisData = {
        role: lastSearchedRole,
        careerReadiness: displayData.careerReadiness,
        timeToJobReady: displayData.timeToJobReady,
        salaryPotential: displayData.salaryPotential,
        currentSkills: displayData.currentSkills || [],
        skillGaps: displayData.skillGaps || [],
        nextSteps: displayData.nextSteps || [],
        marketOutlook: displayData.marketOutlook || '',
        analyzedAt: new Date().toISOString(),
      };

      const response = await api.saveSkillAnalysis(analysisData, token);

      if (response.success) {
        // ✅ INVALIDATE CACHE - This forces refetch on dashboard
        await queryClient.invalidateQueries({ queryKey: ['saved-analyses'] });
        console.log('✅ Cache invalidated, dashboard will show updated data');

        setModalConfig({
          title: 'Analysis Saved! 🎉',
          message: 'Your skill analysis has been saved to your dashboard. You can view it anytime.',
          type: 'success'
        });
        setShowModal(true);

        console.log('✅ Analysis saved successfully');
      } else {
        throw new Error(response.error || 'Failed to save analysis');
      }
    } catch (error) {
      console.error('❌ Save analysis error:', error);
      setModalConfig({
        title: 'Save Failed',
        message: error.message || 'Could not save analysis. Please try again.',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (!token && isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20 animate-in fade-in zoom-in duration-700 overflow-hidden relative">
        <div className="relative p-8 sm:p-12 md:p-16 rounded-[2rem] sm:rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-elite)] text-center max-w-2xl w-full overflow-hidden group">

          {/* Ambient Background Accents */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 mb-10 group-hover:rotate-12 transition-transform duration-500">
              <Brain size={48} strokeWidth={2.5} className="animate-pulse" />
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-[var(--site-text)] tracking-tighter mb-6 leading-tight">
              Unlock Your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Career Intelligence</span>
            </h2>

            <p className="text-lg md:text-xl font-bold text-[var(--site-text-muted)] mb-10 leading-relaxed opacity-80 max-w-lg mx-auto">
              Sign in to access deep-tier skill gap analysis, personalized roadmaps, and AI-powered career synchronization.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/auth/login")}
                className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 btn-tactile cursor-pointer"
              >
                Sign In Now
                <ArrowRight size={18} strokeWidth={3} />
              </button>

              <button
                onClick={() => (window.location.href = "/mission-home")}
                className="px-10 py-5 bg-[var(--site-text)]/5 text-[var(--site-text-muted)] hover:text-[var(--site-text)] border border-[var(--card-border)] font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-[var(--site-text)]/[0.08] cursor-pointer"
              >
                Explore More
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-6 opacity-40">
              <div className="flex items-center gap-2">
                <Target size={14} />
                <span className="text-[8px] font-black uppercase tracking-widest">Precision Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span className="text-[8px] font-black uppercase tracking-widest">AI Roadmaps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-500 pb-16 overflow-hidden relative">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-6 py-16 max-w-7xl relative z-10 animate-in fade-in duration-700">
        {/* BREADCRUMB NAVIGATION */}
        <Breadcrumb currentPage="Skill Analysis" currentIcon={Brain} />


        {!isMounted ? (
          <div className="space-y-16 animate-in fade-in duration-700">
            <div className="py-20 text-center relative overflow-hidden rounded-[3.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-elite)]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-600/5 to-transparent animate-pulse" />
              <div className="relative z-10 space-y-6">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-indigo-600/10 flex items-center justify-center">
                  <Brain size={48} className="text-indigo-600 animate-bounce" />
                </div>
                <h3 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Initializing Neural Core</h3>
                <p className="text-[var(--site-text-muted)] font-bold opacity-60">Synchronizing talent intelligence...</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {isLoadingOrFetching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed top-16 lg:top-[60px] left-0 right-0 h-[3px] z-[9900] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10" />
                  <motion.div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                    initial={{ width: "0%" }}
                    animate={{ width: ["0%", "45%", "75%", "90%", "98%"] }}
                    transition={{ duration: 15, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute top-0 bottom-0 w-64 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    initial={{ x: "-100vw" }}
                    animate={{ x: "100vw" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Elite Hero Header */}
            <div className="relative mb-20 overflow-hidden rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-12 md:p-20 shadow-[var(--shadow-elite)] group">
              {/* Ambient Glow System */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="absolute -right-32 -top-32 w-96 h-96 bg-[var(--accent-primary)]/5 rounded-full blur-[100px] animate-pulse-elite" />
              <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px]" />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 ring-4 ring-white/10">
                    <Brain size={40} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--site-text)] leading-[1.1]">
                      AI Skill Intelligence
                    </h1>
                    <p className="text-[var(--accent-primary)] font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3 mt-4">
                      <Sparkles size={16} className="animate-pulse" />
                      Powered by GPT-4 Elite Analysis
                    </p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl text-[var(--site-text-muted)] max-w-3xl font-bold leading-relaxed opacity-80">
                  Get personalized career insights, skill gap analysis, and
                  AI-powered recommendations{" "}
                  {token ? "based on your learning journey" : "for any role"}.
                </p>
              </div>
            </div>

            {/* Skill Gap Analyzer Engine */}
            <div className="mb-20 max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-10 justify-center md:justify-start">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-sm">
                  <Target size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tight">
                  Skill Gap Analyzer
                </h2>
              </div>

              <div className="p-10 md:p-14 rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-elite)] transition-all duration-500 hover:shadow-[var(--shadow-elite-hover)]">
                <p className="text-lg text-[var(--site-text-muted)] mb-8 font-bold opacity-70 text-center md:text-left">
                  Enter your target role and let AI analyze the skills you need.
                </p>

                <form
                  onSubmit={handleAnalyze}
                  className="flex flex-col md:flex-row gap-6"
                >
                  <div className="flex-1 relative group/input">
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g., AI Engineering Lead, Full Stack Architect, DevOps Strategist"
                      className="w-full px-8 py-6 rounded-2xl bg-[var(--site-text)]/5 border-2 border-transparent focus:border-[var(--accent-primary)]/30 focus:bg-[var(--site-text)]/[0.08] outline-none text-[var(--site-text)] font-black text-lg transition-all placeholder:text-[var(--site-text-muted)] placeholder:opacity-40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoadingOrFetching || !targetRole.trim()}
                    className="px-12 py-6 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-black rounded-2xl text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-4 btn-tactile whitespace-nowrap cursor-pointer"
                  >
                    {isLoadingOrFetching ? (
                      <>
                        <Loader2 size={24} className="animate-spin" strokeWidth={3} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Search size={24} strokeWidth={3} />
                        Analyze
                      </>
                    )}
                  </button>
                </form>

                {/* Current Analysis Indicator */}
                {lastSearchedRole && !isLoadingOrFetching && (
                  <div className="mt-8 flex items-center justify-center">
                    <div className="px-6 py-3 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 rounded-2xl flex items-center gap-4 transition-all animate-in fade-in zoom-in-95">
                      <Target size={18} className="text-[var(--accent-primary)]" strokeWidth={2.5} />
                      <span className="text-sm font-black text-[var(--site-text-muted)] uppercase tracking-widest">
                        Analyzing:{" "}
                        <span className="text-[var(--site-text)] underline decoration-[var(--accent-primary)]/30 decoration-4 underline-offset-4">
                          {lastSearchedRole}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Elite Cache Indicator - Re-designed for high visibility in Light Mode */}
                {isMounted &&
                  isFromCache &&
                  displayData &&
                  !isLoadingOrFetching && (
                    <div className="mt-10 p-1 bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
                      <div className="px-8 py-5 bg-[var(--card-bg)] rounded-[0.9rem] flex flex-col md:flex-row items-center justify-between gap-4 border border-[var(--card-border)]/50 shadow-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">Results Cached</p>
                            <p className="text-sm font-bold text-[var(--site-text)]">
                              Showing cached results for <span className="text-[var(--accent-primary)]">"{lastSearchedRole}"</span>.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => { localStorage.removeItem(CACHE_KEY); refetch(); }}
                          className="px-5 py-2.5 bg-[var(--site-text)]/5 hover:bg-[var(--accent-primary)] hover:text-white border border-[var(--card-border)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all btn-tactile cursor-pointer"
                        >
                          Refresh Results
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* ELITE EMPTY STATE - ANALYSIS INITIALIZATION */}
            {isMounted && !displayData && !isLoadingOrFetching && (
              <div className="py-12 text-center animate-in fade-in zoom-in duration-1000">
                <div className="relative w-40 h-40 mx-auto mb-10 group">
                  <div className="absolute inset-0 bg-[var(--accent-primary)]/10 rounded-[2.5rem] blur-2xl group-hover:bg-[var(--accent-primary)]/20 transition-colors duration-1000" />
                  <div className="relative w-full h-full rounded-[2rem] bg-gradient-to-br from-[var(--card-bg)] to-[var(--site-bg)] border border-[var(--card-border)] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-700">
                    <Brain size={60} className="text-[var(--accent-primary)] opacity-20 group-hover:opacity-40 transition-opacity" strokeWidth={1} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target size={28} className="text-[var(--accent-primary)] animate-pulse" />
                    </div>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-[var(--site-text)] tracking-tighter mb-4">
                  Ready to <span className="text-[var(--accent-primary)]">Analyze</span>
                </h2>
                <p className="text-lg font-bold text-[var(--site-text-muted)] max-w-xl mx-auto opacity-70 mb-8 leading-relaxed">
                  Enter your target role above to get personalized skill insights. <br />
                  <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">AI-Powered Career Analysis</span>
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['AI Researcher', 'Product Engineer', 'Data Architect'].map((role) => (
                    <button
                      key={role}
                      onClick={() => triggerImmediateAnalysis(role)}
                      className="px-5 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all btn-tactile shadow-sm cursor-pointer"
                    >
                      Try "{role}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ELITE LOGIN CTA - UNLOCK PERSISTENCE */}
            {!token && displayData && !isLoadingOrFetching && (
              <div className="mt-12 mb-20 p-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl overflow-hidden relative group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                      <Award size={36} className="text-white animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black tracking-tight mb-2">Want to Save Your Results?</h4>
                      <p className="text-sm font-bold opacity-80 max-w-lg leading-relaxed">
                        Sign in to save your analyses, track progress, and get personalized recommendations.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => (window.location.href = "/auth/login")}
                    className="px-10 py-5 bg-white text-indigo-700 font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-xl btn-tactile cursor-pointer"
                  >
                    Sign In Now
                  </button>
                </div>
              </div>
            )}
            {/* LOADING STATE - MOVED INSIDE CONTAINER */}
            {isLoadingOrFetching && (
              <div className="py-12 relative flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-3xl animate-pulse rounded-full" />
                  <div className="relative z-10 w-full h-full rounded-[2rem] bg-gradient-to-br from-[var(--card-bg)] to-[var(--site-bg)] border border-[var(--card-border)] flex items-center justify-center shadow-2xl">
                    <Brain size={56} className="text-[var(--accent-primary)] animate-bounce" strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="text-3xl font-black text-[var(--site-text)] mb-3 tracking-tighter">
                  Synthesizing Career Path...
                </h3>

                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] px-6 py-3 rounded-2xl shadow-sm">
                  <p className="text-[var(--site-text-muted)] font-bold text-sm flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-[var(--accent-primary)]" />
                    Evaluating ecosystem for <span className="text-[var(--site-text)]">"{lastSearchedRole}"</span>
                  </p>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {isMounted && displayData && !isLoadingOrFetching && (
              <div id="analysis-results" className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
                  {/* Career Readiness */}
                  <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white min-h-[160px] flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.4)] transition-all duration-500">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg group-hover:rotate-12 transition-transform shrink-0">
                          <CheckCircle size={24} />
                        </div>
                        <span className="text-4xl sm:text-5xl font-black tracking-tighter ml-4">
                          {displayData.careerReadiness}%
                        </span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                        Career Readiness
                      </p>
                    </div>
                  </div>

                  {/* Time to Job Ready */}
                  <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-blue-600 text-white min-h-[160px] flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)] transition-all duration-500">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg group-hover:rotate-12 transition-transform shrink-0">
                          <Clock size={24} />
                        </div>
                        <span className="text-2xl sm:text-3xl font-black tracking-tighter text-right ml-4 leading-tight">
                          {displayData.timeToJobReady}
                        </span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                        Time to Job Ready
                      </p>
                    </div>
                  </div>

                  {/* Salary Potential */}
                  <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-500 to-orange-600 text-white min-h-[160px] flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(245,158,11,0.4)] transition-all duration-500 md:col-span-2 lg:col-span-1">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg group-hover:rotate-12 transition-transform shrink-0">
                          <Briefcase size={24} />
                        </div>
                        <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-right leading-tight break-words">
                          {displayData.salaryPotential}
                        </span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                        Salary Potential
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Skills */}
                {displayData.currentSkills &&
                  displayData.currentSkills.length > 0 && (
                    <div className="p-10 rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] mb-8 shadow-[var(--shadow-elite)]">
                      <h3 className="text-3xl font-black text-[var(--site-text)] mb-8 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle size={28} className="text-emerald-500" />
                        </div>
                        Current Skills
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {displayData.currentSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-6 py-3 bg-[var(--card-bg-hover)] text-[var(--site-text)] rounded-[1.25rem] font-bold text-sm border border-[var(--card-border)] hover:border-[var(--accent-primary)]/30 transition-all animate-in fade-in slide-in-from-left-4"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Skill Gaps */}
                {displayData.skillGaps && displayData.skillGaps.length > 0 && (
                  <div className="p-10 rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] mb-8 shadow-[var(--shadow-elite)]">
                    <h3 className="text-3xl font-black text-[var(--site-text)] mb-8 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <AlertCircle size={28} className="text-red-500" />
                      </div>
                      Skills to Learn
                    </h3>
                    <div className="grid gap-6">
                      {displayData.skillGaps.map((gap, i) => (
                        <div
                          key={i}
                          className="relative p-8 rounded-[2.5rem] bg-[var(--site-text)]/5 border border-[var(--card-border)] hover:border-[var(--accent-primary)]/40 transition-all group overflow-hidden cursor-pointer hover:-translate-y-2 hover:shadow-lg"
                        >
                          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-[80px]" />

                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-4">
                                <span
                                  className={`px-4 py-1.5 rounded-xl bg-gradient-to-r ${priorityColors[gap.priority] || priorityColors.Medium
                                    } text-white text-[10px] font-black uppercase tracking-widest shadow-xl`}
                                >
                                  {gap.priority} PRIORITY
                                </span>
                                <span
                                  className={`font-black text-[10px] uppercase tracking-widest ${demandColors[gap.marketDemand] || 'text-[var(--site-text-muted)]'
                                    }`}
                                >
                                  {gap.marketDemand} MARKET DEMAND
                                </span>
                              </div>
                              <h4 className="text-2xl font-black text-[var(--site-text)] mb-3 group-hover:text-[var(--accent-primary)] transition-colors">
                                {gap.skill}
                              </h4>
                              <p className="text-lg text-[var(--site-text-muted)] font-bold opacity-80 leading-relaxed max-w-4xl">
                                {gap.reasoning}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                              router.push(`/courses?q=${encodeURIComponent(
                                gap.skill
                              )}`)
                              }
                              className="lg:w-64 py-6 bg-[var(--site-text)] text-[var(--card-bg)] font-black rounded-3xl text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap btn-tactile group/btn cursor-pointer"
                            >
                              Find Courses
                              <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                {/* Next Steps */}
                {displayData.nextSteps && displayData.nextSteps.length > 0 && (
                  <div className="p-6 sm:p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] bg-[var(--card-bg)] border-2 border-[var(--card-border)] mb-8 shadow-2xl relative overflow-hidden group hover:-translate-y-2 hover:shadow-[var(--shadow-elite-hover)] transition-all duration-500">
                    <div className="absolute -right-32 -top-32 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000" />

                    <div className="relative z-10">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--site-text)] mb-6 md:mb-10 flex items-center gap-3 md:gap-5 tracking-tighter">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-[var(--site-text)]/5 border border-[var(--card-border)] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Zap className="w-6 h-6 md:w-8 md:h-8 text-[var(--accent-primary)]" />
                        </div>
                        Recommended Next Steps
                      </h3>
                      <ol className="grid gap-4 md:gap-6">
                        {displayData.nextSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-4 md:gap-6 group/item hover:bg-[var(--site-text)]/5 p-3 md:p-4 rounded-2xl transition-colors">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-black flex items-center justify-center text-xs md:text-sm flex-shrink-0 shadow-lg group-hover/item:scale-110 transition-transform">
                              {i + 1}
                            </div>
                            <p className="text-sm sm:text-base md:text-xl font-bold text-[var(--site-text)] leading-relaxed pt-1 opacity-90">
                              {step}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* Market Outlook */}
                {displayData.marketOutlook && (
                  <div className="p-12 rounded-[3.5rem] bg-[var(--card-bg)] border-2 border-[var(--card-border)] mb-12 shadow-[var(--shadow-elite)] relative overflow-hidden group cursor-pointer hover:-translate-y-2 hover:shadow-[var(--shadow-elite-hover)] transition-all duration-500">
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="relative z-10">
                      <h3 className="text-3xl font-black text-[var(--site-text)] mb-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <TrendingUp size={28} className="text-emerald-500" />
                        </div>
                        2026 Market Intelligence
                      </h3>
                      <p className="text-xl text-[var(--site-text)] leading-relaxed font-bold opacity-80 max-w-5xl">
                        {displayData.marketOutlook}
                      </p>
                    </div>
                  </div>
                )}

                {/* Save Analysis Button (for logged-in users) */}
                {token && displayData && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleSaveAnalysis}
                      disabled={isSaving}
                      className="px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl text-sm uppercase tracking-widest transition-all shadow-2xl hover:shadow-emerald-600/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Award size={20} />
                          Save Analysis to Dashboard
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Learning Velocity - PREMIUM TELEMETRY */}
            {velocityData?.success && (
              <div className="mb-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                  <h2 className="text-2xl sm:text-3xl font-black text-[var(--site-text)] flex items-center gap-3 sm:gap-4 tracking-tight">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)] flex-shrink-0">
                      <Zap size={20} className="sm:hidden animate-pulse" strokeWidth={2.5} />
                      <Zap size={24} className="hidden sm:block animate-pulse" strokeWidth={2.5} />
                    </div>
                    Learning Velocity
                  </h2>
                  <span className="w-fit px-4 sm:px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg shadow-amber-500/20 border border-white/10 flex items-center gap-2 cursor-default hover:scale-105 transition-transform flex-shrink-0">
                    <Sparkles size={12} className="text-white/90" />
                    Premium Feature
                  </span>
                </div>

                <Surface className="p-10 md:p-12 rounded-[3.5rem] bg-[var(--card-bg)]/40 backdrop-blur-3xl border border-[var(--card-border)] shadow-[var(--shadow-elite)] group/velocity overflow-hidden relative">
                  {/* Subtle Background Glow */}
                  <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none group-hover/velocity:bg-amber-500/10 transition-colors duration-1000" />

                  <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Current Pace', val: velocityData.data.velocity, unit: 'courses/week', icon: <TrendingUp size={20} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
                      { label: 'Beginner Track', val: velocityData.data.predictions.beginnerTrack, unit: 'Projected', icon: <Target size={20} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
                      { label: 'Intermediate', val: velocityData.data.predictions.intermediateTrack, unit: 'Projected', icon: <Award size={20} />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
                      { label: 'Advanced Mastery', val: velocityData.data.predictions.advancedTrack, unit: 'Projected', icon: <Sparkles size={20} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' }
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="group/stat relative p-8 rounded-[2.5rem] bg-[var(--site-bg)]/50 border border-[var(--card-border)] hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-2 cursor-pointer shadow-lg hover:shadow-amber-500/5"
                      >
                        <div className="flex flex-col gap-5">
                          <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white/5 group-hover/stat:scale-110 transition-all duration-500 shadow-sm`}>
                            {stat.icon}
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1 mb-1">
                              <span className="text-4xl font-black text-[var(--site-text)] tracking-tighter">
                                {stat.val}
                              </span>
                            </div>
                            <div className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em] opacity-60 group-hover/stat:opacity-100 transition-opacity">
                              {stat.label}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Sparkle on Hover */}
                        <div className="absolute top-6 right-6 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI INSIGHT FOOTER */}
                  <div className="mt-10 pt-8 border-t border-[var(--card-border)] flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                      <Zap size={16} className="text-amber-600 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700 dark:text-amber-400">Neural Insight Active</span>
                    </div>
                    <p className="text-lg font-bold text-[var(--site-text-muted)] leading-relaxed italic opacity-80">
                      &quot;{velocityData.data.insight}&quot;
                    </p>
                  </div>
                </Surface>
              </div>
            )}

            {/* Career Insights Section - FIXED POSITION */}
            {displayData && !isLoadingOrFetching && (
              <div className="mb-12">
                <h2 className="text-4xl font-black text-[var(--site-text)] mb-10 flex items-center gap-4 tracking-tighter transition-colors">
                  <Brain size={32} className="text-blue-600" />
                  Career Analysis Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="group p-10 rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-premium)] hover:shadow-[var(--shadow-hover)] transition-all duration-300 hover:-translate-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                      <Target size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-black text-[var(--site-text)] mb-2">Analysis Type</h3>
                    <p className="text-[var(--site-text-muted)] font-bold uppercase tracking-widest text-xs">Based on {urlRole ? 'Market Data' : 'Personal Goals'}</p>
                  </div>

                  <div className="group p-10 rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-premium)] hover:shadow-[var(--shadow-hover)] transition-all duration-300 hover:-translate-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Sparkles size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-black text-[var(--site-text)] mb-2">Target Skills</h3>
                    <p className="text-[var(--site-text-muted)] font-bold uppercase tracking-widest text-xs">{displayData.skillGaps?.length || 0} Gap(s) Identified</p>
                  </div>

                  <div className="group p-10 rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-premium)] hover:shadow-[var(--shadow-hover)] transition-all duration-300 hover:-translate-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20 group-hover:scale-110 transition-transform">
                      <TrendingUp size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-black text-[var(--site-text)] mb-2">Career Outlook</h3>
                    <p className="text-[var(--site-text-muted)] font-bold uppercase tracking-widest text-xs">Analyzing 2026 Trends</p>
                  </div>
                </div>
              </div>
            )}

            {/* Skill Proficiency - PREMIUM FEATURE (Logged-in only) */}
            {proficiencyData?.success && proficiencyData.data.skills.length > 0 && (
              <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--site-text)] flex items-center gap-3 sm:gap-4 tracking-tighter transition-colors">
                    <TrendingUp size={24} className="text-emerald-500 sm:hidden flex-shrink-0" />
                    <TrendingUp size={32} className="text-emerald-500 hidden sm:block flex-shrink-0" />
                    Skill Proficiency
                  </h2>
                  <span className="w-fit px-4 sm:px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg shadow-amber-500/20 border border-white/10 flex items-center gap-2 cursor-default hover:scale-105 transition-transform flex-shrink-0">
                    <Sparkles size={12} className="text-white/90" />
                    Premium Feature
                  </span>
                </div>

                <Surface className="p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-premium)]">
                  <div className="grid gap-6">
                    {proficiencyData.data.skills.map((skill, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-[var(--site-text)]">
                              {skill.skill}
                            </span>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                              {skill.status}
                            </span>
                          </div>
                          <span className="text-2xl font-black text-[var(--site-text)]">
                            {skill.level}%
                          </span>
                        </div>
                        <div className="h-3 bg-[var(--card-bg-hover)] rounded-full overflow-hidden border border-[var(--card-border)]">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-1000"
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--site-text-muted)] font-black uppercase tracking-widest opacity-60">
                          Based on {skill.courses}{" "}
                          {skill.courses === 1 ? "course" : "courses"} • Analysis Synced
                        </p>
                      </div>
                    ))}
                  </div>
                </Surface>
              </div>
            )}

            {/* Career Path Suggestions - PREMIUM FEATURE (Logged-in only) */}
            {careerPathsData?.success && (
              <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--site-text)] flex items-center gap-3 sm:gap-4 tracking-tighter transition-colors">
                    <Briefcase size={24} className="text-purple-600 sm:hidden flex-shrink-0" />
                    <Briefcase size={32} className="text-purple-600 hidden sm:block flex-shrink-0" />
                    Recommended Career Paths
                  </h2>
                  <span className="w-fit px-4 sm:px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg shadow-amber-500/20 border border-white/10 flex items-center gap-2 cursor-default hover:scale-105 transition-transform flex-shrink-0">
                    <Sparkles size={12} className="text-white/90" />
                    Premium Feature
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {careerPathsData.data.careerPaths.map((path, i) => (
                    <Surface
                      key={i}
                      className="p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-purple-500/50 transition-all group hover:-translate-y-1 hover:shadow-xl shadow-[var(--shadow-premium)]"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-2xl font-black text-[var(--site-text)] group-hover:text-purple-600 transition-colors">
                          {path.role}
                        </h3>
                        <div className="px-4 py-2 bg-purple-500/10 text-purple-500 rounded-xl font-black text-lg border border-purple-500/20">
                          {path.matchScore}%
                        </div>
                      </div>

                      <p className="text-[var(--site-text-muted)] mb-4 leading-relaxed font-medium">
                        {path.reasoning}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--site-text-muted)] mb-1 opacity-60">
                            Salary Range
                          </p>
                          <p className="text-xl font-black text-[var(--site-text)]">
                            {path.avgSalary}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--site-text-muted)] mb-1 opacity-60">
                            Time to Ready
                          </p>
                          <p className="text-xl font-black text-[var(--site-text)]">
                            {path.timeToReady}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {path.requiredSkills.map((skill, j) => (
                          <span
                            key={j}
                            className="px-3 py-1 bg-[var(--card-bg-hover)] text-[var(--site-text-muted)] rounded-lg text-[10px] font-black uppercase tracking-widest border border-[var(--card-border)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${path.demandLevel === "High"
                            ? "bg-emerald-500"
                            : path.demandLevel === "Medium"
                              ? "bg-amber-500"
                              : "bg-slate-500"
                            }`}
                        />
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--site-text-muted)] opacity-70">
                          {path.demandLevel} Market Demand
                        </span>
                      </div>
                    </Surface>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
}

function SkillAnalysisPageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--site-bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="animate-spin text-[var(--accent-primary)] mx-auto" />
          <p className="text-[var(--site-text-muted)] font-black uppercase tracking-[0.2em]">Initiating Neural Analysis...</p>
        </div>
      </div>
    }>
      <SkillAnalysisContent />
    </Suspense>
  );
}

export default function SkillAnalysisPage() {
  return (
    <Suspense fallback={null}>
      <SkillAnalysisPageContent />
    </Suspense>
  );
}
