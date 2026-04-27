"use client";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "../../components/ui/Breadcrumb";
import { useAuth } from "../../context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import Surface from "../../components/ui/Surface";
import CourseCard from "../../components/CourseCard";
import Modal from "../../components/ui/Modal";
import {
  Brain,
  Sparkles,
  BookMarked,
  Search,
  Loader2,
  Target,
  Map,
  BookOpen,
  Zap,
  TrendingUp,
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle2,
  Award,
  Cpu,
  ArrowRight,
  Info,
  ChevronDown,
  RefreshCw,
  Youtube,
  Play,
  ExternalLink,
  FileText,
  Code,
  Book,
  Github,
  Wrench,
  FolderGit2, Globe, ShieldCheck,
  GitCompareArrows, X, Lightbulb, Star, DollarSign, ThumbsUp, ThumbsDown, BrainCircuit, Check,
  ZapIcon,
  TargetIcon
} from "lucide-react";
import YouTubeVideoCard from "../../components/YouTubeVideoCard";
import ResourceCard from "../../components/ResourceCard";
import ProjectCard from "../../components/ProjectCard";
import ToolActionModal from "../../components/momentum/ToolActionModal";
import Skeleton from "../../components/ui/Skeleton";
import PageTransition from "../../components/ui/PageTransition";
import { motion, AnimatePresence } from "framer-motion";

// import { Youtube, BookMarked, FolderGit2 } from "lucide-react";

const COURSES_PER_PAGE = 8;
const CACHE_KEY = "ai-intelligence-cache-v3";

/**
 * ROBUST DATA EXTRACTION
 * Handles variation between Direct Cache Hits (nested .data) and Job Poller results (flattened)
 */
const extractAIIntelData = (payload) => {
  if (!payload) return null;
  
  // Case 1: Nested .data (Standard API or Cache wrapper)
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    // Check if it's double-nested payload.data.data
    if (payload.data.data && payload.data.skillBreakdown === undefined) {
      return payload.data.data;
    }
    return payload.data;
  }

  // Case 2: Flattened (Job Poller spread or already processed)
  if (payload.skillBreakdown || payload.roadmap || payload.courses) {
    return payload;
  }

  return null;
};

const hasUsableAIIntelData = (payload) => {
  const extracted = extractAIIntelData(payload);
  if (!extracted) return false;

  return Boolean(
    Array.isArray(extracted.skillBreakdown) && extracted.skillBreakdown.length >= 1 &&
    Array.isArray(extracted.roadmap) && extracted.roadmap.length >= 1 &&
    Array.isArray(extracted.courses) && extracted.courses.length >= 1
  );
};

// HELPER: Load cache outside component (no setState in effect)
const loadCacheFromStorage = () => {
  if (typeof window === "undefined") return null;

  const savedCache = localStorage.getItem(CACHE_KEY);
  if (!savedCache) return null;

  try {
    const parsed = JSON.parse(savedCache);
    if (!hasUsableAIIntelData(parsed)) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    const cacheAge = Date.now() - parsed.timestamp;
    const CACHE_DURATION = 24 * 60 * 60 * 1000;

    if (cacheAge < CACHE_DURATION) {
      console.log("✅ Restored from cache:", parsed.query);
      return parsed;
    } else {
      localStorage.removeItem(CACHE_KEY);
      console.log("🗑️ Cache expired, cleared");
      return null;
    }
  } catch (e) {
    console.error("❌ Cache parse error:", e);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

function AIIntelligenceContent() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q");

  const [initialCache] = useState(() => {
    const cache = loadCacheFromStorage();
    if (urlQuery && cache?.query !== urlQuery) {
      return null; 
    }
    return cache;
  });

  const [query, setQuery] = useState(urlQuery || initialCache?.query || "");
  const [lastSearchedQuery, setLastSearchedQuery] = useState(
    urlQuery || initialCache?.query || ""
  );
  const [activeRequestQuery, setActiveRequestQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [displayedCoursesCount, setDisplayedCoursesCount] = useState(COURSES_PER_PAGE);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info",
  });
  const [selectedTool, setSelectedTool] = useState(null);
  const [savingTool, setSavingTool] = useState(null);

  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const toggleCompare = useCallback((toolName) => {
    setSelectedForComparison(prev => {
      if (prev.includes(toolName)) {
        return prev.filter(name => name !== toolName);
      }
      if (prev.length >= 3) return prev;
      return [...prev, toolName];
    });
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const runComparison = async () => {
    if (selectedForComparison.length < 2) return;

    const cacheKey = `compare_${selectedForComparison.slice().sort().join('_')}`;
    const cachedResult = localStorage.getItem(cacheKey);

    if (cachedResult) {
      try {
        setComparisonResult(JSON.parse(cachedResult));
        return;
      } catch (err) {
        localStorage.removeItem(cacheKey);
      }
    }

    setIsComparing(true);
    try {
      const comparisonPrompt = `You are comparing AI tools: ${selectedForComparison.join(' vs ')}.

For EACH tool, provide a detailed comparison in this EXACT JSON format:
{
"toolsComparison": [
    {
      "name": "Tool Name",
      "category": "AI Development Tool",
      "pricing": "Free / Paid",
      "url": "Official website URL",
      "keyFeatures": ["Feature 1", "Feature 2"],
      "bestFor": "Target audience",
      "pros": ["Pro 1"],
      "cons": ["Con 1"],
      "rating": 4.5,
      "popularityRank": "High"
    }
],
"recommendation": "Recommendation text",
"quickTakeaway": "Summary text"
}

Return ONLY valid JSON.`;

      const response = await api.aiSearch(comparisonPrompt, token);
      const responseText = response?.data?.summary || response?.summary || JSON.stringify(response?.data) || '';

      let parsedComparison = null;
      try {
        if (response?.data?.toolsComparison) {
          parsedComparison = response.data;
        } else {
          const jsonMatch = responseText.match(/\{[\s\S]*"toolsComparison"[\s\S]*\}/);
          if (jsonMatch) parsedComparison = JSON.parse(jsonMatch[0]);
        }
      } catch (e) { }

      let finalResult = null;
      if (parsedComparison?.toolsComparison) {
        finalResult = { type: 'structured', data: parsedComparison };
      } else {
        const toolsData = (data?.tools || []).filter(t => selectedForComparison.includes(t.name));
        finalResult = {
          type: 'structured',
          data: {
            toolsComparison: toolsData.map(tool => ({
              name: tool.name,
              category: 'AI Intelligence Result',
              pricing: 'Visit Website',
              url: tool.official_link || tool.link || '#',
              keyFeatures: [tool.description?.split('.')[0] || 'AI Tool'],
              bestFor: 'AI Professionals',
              pros: ['Integrated in Intelligence Hub'],
              cons: ['Check official documentation'],
              rating: 4.5,
              popularityRank: 'High'
            })),
            recommendation: `Both ${selectedForComparison.join(' and ')} are top-tier recommendations for your query.`,
            quickTakeaway: `Compare ${selectedForComparison.join(' vs ')} to optimize your AI stack.`
          }
        };
      }

      if (finalResult) {
        setComparisonResult(finalResult);
        localStorage.setItem(cacheKey, JSON.stringify(finalResult));
      }
    } catch (error) {
      console.error('Comparison error:', error);
    }
    setIsComparing(false);
  };

  const {
    data: aiData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["ai-intelligence", lastSearchedQuery],
    queryFn: async () => {
      if (!lastSearchedQuery || !lastSearchedQuery.trim()) {
        console.error("❌ Empty query detected, skipping API call");
        throw new Error("Empty query");
      }

      console.log("🔍 Fetching from standard API:", lastSearchedQuery);
      setActiveRequestQuery(lastSearchedQuery);
      return api.aiSearch(lastSearchedQuery, token);
    },
    enabled: false,
    staleTime: Infinity,
    cacheTime: Infinity,
    retry: 1,
  });

  useEffect(() => {
    const autoSearch = searchParams.get("autoSearch");

    // Force search if query exists in URL and we haven't auto-searched THIS SESSION yet
    if (
      urlQuery &&
      urlQuery.trim() &&
      !hasAutoSearched &&
      autoSearch === "true"
    ) {
      // Check if we already have matching data (to avoid double-fetching if cache is perfect)
      const currentQueryInData = aiData?.query || (typeof aiData?.data === 'string' ? JSON.parse(aiData?.data)?.query : null);
      if (currentQueryInData === urlQuery && !isFetching) {
        console.log("✅ [AutoSearch] Data already matches URL query, skipping redundant fetch.");
        setHasAutoSearched(true);
        return;
      }

      console.log("🎯 [AutoSearch] Triggering search from URL parameter:", urlQuery);

      // Reset UI state for new query
      setQuery(urlQuery);
      setLastSearchedQuery(urlQuery);
      setHasAutoSearched(true);

      // Trigger search with a slight delay to ensure React state has flushed
      setTimeout(() => {
        console.log("🚀 [AutoSearch] Executing refetch now...");
        refetch();
      }, 500);
    }
  }, [urlQuery, hasAutoSearched, searchParams, refetch, isFetching, aiData]);

  useEffect(() => {
    if (!aiData || isFetching) return;

    setActiveRequestQuery("");
    
    const normalizedData = (aiData.data && aiData.data.learningGoal) ? { ...aiData, ...aiData.data } : aiData;
    
    if (aiData.isCached) {
      console.log(`%c🚀 [Double-Shield] Backend Cache Hit!`, "color: #f59e0b; font-weight: bold; font-size: 1.1em;");
    }

    console.log("📥 New data received from API");
    console.log("%c🤖 AI Model Visibility Log", "color: #4f46e5; font-weight: bold; font-size: 1.2em;");
    console.log(`%cProvider: %c${aiData.provider || 'default'}`, "font-weight: bold;", "color: #16a34a;");
      if (aiData.model) {
        console.log(`%cModel: %c${aiData.model}`, "font-weight: bold;", "color: #2563eb;");
      }

      if (typeof window !== "undefined") {
        const cacheData = {
          data: normalizedData,
          query: lastSearchedQuery,
          timestamp: Date.now(),
        };
        try {
          if (hasUsableAIIntelData(cacheData)) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            console.log("💾 Saved to localStorage:", lastSearchedQuery);
          } else {
            localStorage.removeItem(CACHE_KEY);
          }
        } catch (e) {
        console.error("❌ Failed to save to localStorage:", e);
      }
    }
  }, [aiData, isFetching, lastSearchedQuery]);

  const shouldHideInitialCache = activeRequestQuery && activeRequestQuery !== initialCache?.query;
  const displayData = aiData || (shouldHideInitialCache ? null : initialCache?.data);
  const isFromCache = !aiData && !!initialCache;
  const data = extractAIIntelData(displayData);
  const isFallback = data?.source === "fallback-engine" || displayData?.source === "fallback-engine";
  const isLoadingOrFetching = isLoading || isFetching;

  // Learning Velocity - Real-time updates
  const { data: velocityData, refetch: refetchVelocity } = useQuery({
    queryKey: ["learning-velocity"],
    queryFn: () => {
      console.log("📊 Fetching learning velocity...");
      return api.getLearningVelocity(token);
    },
    enabled: !!token && !!displayData,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Fetch saved courses
  const { data: savedCoursesData, refetch: refetchSavedCourses } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      console.log("🔍 Fetching saved courses...");
      const result = await api.getFavorites(token);
      return result;
    },
    enabled: !!token,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
  });

  // Fetch saved tools (V25 Sync)
  const { data: savedToolsData, refetch: refetchSavedTools } = useQuery({
    queryKey: ['tool-favorites', token],
    queryFn: () => api.getToolFavorites(token),
    enabled: !!token,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
  });

  const isToolAlreadySaved = useCallback((toolName) => {
    return savedToolsData?.tools?.some(t => t.name === toolName) || false;
  }, [savedToolsData]);

  const handleSaveSuccess = useCallback(() => {
    console.log("✅ Data sync triggered - updating all library states");
    refetchSavedCourses();
    refetchSavedTools();
    refetchVelocity();
    queryClient.invalidateQueries(["favorites"]);
    queryClient.invalidateQueries(["tool-favorites"]);
    queryClient.invalidateQueries(["learning-velocity"]);
  }, [refetchSavedCourses, refetchSavedTools, refetchVelocity, queryClient]);

  const toggleFavoriteTool = useCallback(async (tool) => {
    if (!token) {
      setModalConfig({
        title: "Login Required",
        message: "Please login to save tools to your library",
        type: "warning",
      });
      setShowModal(true);
      return;
    }

    setSavingTool(tool.name);
    const isFavorite = isToolAlreadySaved(tool.name);

    try {
      let result;
      if (isFavorite) {
        result = await api.removeToolFavorite(tool.name, token);
      } else {
        result = await api.saveToolFavorite({
          name: tool.name,
          description: tool.description,
          url: tool.official_link || tool.link,
          domain: lastSearchedQuery || 'AI Search'
        }, token);
      }

      if (result?.success) {
        handleSaveSuccess();
        setModalConfig({
          title: "Success",
          message: isFavorite ? "Tool removed from your library" : "Tool saved to your library! 🎉",
          type: "success",
        });
        setShowModal(true);
      } else if (result?.error) {
        setModalConfig({
          title: "Error",
          message: result.error,
          type: "error",
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to toggle tool favorite:', error);
    }
    setSavingTool(null);
  }, [token, isToolAlreadySaved, handleSaveSuccess, lastSearchedQuery]);

  const isCourseAlreadySaved = useCallback(
    (courseTitle) => {
      if (!savedCoursesData?.length) return false;
      return savedCoursesData.some(
        (saved) => saved.title?.toLowerCase() === courseTitle?.toLowerCase()
      );
    },
    [savedCoursesData]
  );

  // Handle search with proper state update timing
  const handleSearch = useCallback(
    (e) => {
      if (e) e.preventDefault();

      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setModalConfig({
          title: "Missing Input",
          message: "Please describe your learning goal to get started.",
          type: "warning",
        });
        setShowModal(true);
        return;
      }

      console.log(
        "🎯 New search initiated via",
        e?.type === "submit" ? "ENTER KEY" : "BUTTON CLICK",
        ":",
        trimmedQuery
      );

      // Update state and trigger refetch
      setActiveRequestQuery(trimmedQuery);
      setLastSearchedQuery(trimmedQuery);
      setDisplayedCoursesCount(COURSES_PER_PAGE);
      setSelectedSkill(null);

      // Use setTimeout to ensure state update completes before refetch
      setTimeout(() => {
        refetch();
      }, 0);
    },
    [query, refetch]
  );

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!data?.courses) return [];
    if (!selectedSkill) return data.courses;

    return data.courses.filter((course) =>
      course.coversSkills?.some((s) =>
        s.toLowerCase().includes(selectedSkill.skill.toLowerCase())
      )
    );
  }, [data, selectedSkill]);

  const visibleCourses = useMemo(
    () => filteredCourses.slice(0, displayedCoursesCount),
    [filteredCourses, displayedCoursesCount]
  );

  const hasMoreCourses = displayedCoursesCount < filteredCourses.length;

  const handleLoadMore = useCallback(() => {
    setDisplayedCoursesCount((prev) => prev + COURSES_PER_PAGE);
  }, []);

  const handleSkillCourseSearch = useCallback((skill) => {
    setSelectedSkill(skill);
    setDisplayedCoursesCount(COURSES_PER_PAGE);

    setTimeout(() => {
      const element = document.getElementById("courses-section");
      if (element) {
        const headerOffset = 120;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        console.log("📍 Scrolled to courses section");
      }
    }, 150);
  }, []);

  const handleResetFilter = useCallback(() => {
    setSelectedSkill(null);
    setDisplayedCoursesCount(COURSES_PER_PAGE);
  }, []);

  const priorityColors = {
    Critical: "from-red-500 to-rose-600",
    High: "from-orange-500 to-amber-600",
    Medium: "from-blue-500 to-blue-600",
    Low: "from-neutral-500 to-neutral-600",
  };

  const demandIcons = {
    High: <TrendingUp className="text-emerald-500" size={16} />,
    Medium: <Zap className="text-amber-500" size={16} />,
    Low: <Clock className="text-neutral-500" size={16} />,
  };

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-500 pb-16">
      <AnimatePresence>
        {(isLoadingOrFetching || isComparing) && (
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
      <div className="container mx-auto px-6 py-16 max-w-7xl">

        {/* BREADCRUMB NAVIGATION */}
        <Breadcrumb currentPage="AI Intelligence Hub" currentIcon={Cpu} />

        {/* ELITE HERO HEADER - MATCHED WITH SKILLS PAGE */}
        <div className="relative mb-20 overflow-hidden rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-12 md:p-20 shadow-[var(--shadow-elite)] group">
          {/* Ambient Glow System */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute -right-32 -top-32 w-96 h-96 bg-[var(--accent-primary)]/5 rounded-full blur-[100px] animate-pulse pointer-events-none" />
          <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-10 mb-12">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 group-hover:rotate-[8deg] group-hover:scale-110 transition-all duration-700 ring-4 ring-white/10">
                <Cpu size={48} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-[var(--site-text)] leading-[1.1]">
                  AI Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Hub</span>
                </h1>
                <p className="text-[var(--accent-primary)] font-black text-[10px] uppercase tracking-[0.5em] flex items-center gap-3 mt-6">
                  <Sparkles size={16} className="animate-pulse" />
                  Neural Evolution Protocol v14.2
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3 ">
                  {isMounted && isFallback && (
                    <div className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl animate-pulse flex items-center gap-2">
                      <ShieldCheck size={14} />
                      AI Fallback Protocol Active
                    </div>
                  )}
                  <div className="px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl text-[var(--site-text)] text-[10px] font-black tracking-[0.2em] uppercase shadow-lg flex items-center gap-3">
                    <Globe size={16} className="text-blue-500" />
                    {isMounted && lastSearchedQuery ? `Trajectory: ${lastSearchedQuery}` : "Global Grid Active"}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xl md:text-2xl text-[var(--site-text-muted)] max-w-4xl font-bold leading-relaxed opacity-80">
              Architecting your professional future through dynamic global synchronization.
              Cross-referencing real-time career telemetry to build your <span className="text-[var(--site-text)]">mastery trajectory.</span>
            </p>
          </div>
        </div>

        {/* INTELLIGENCE ANALYZER ENGINE - MATCHED WITH SKILLS PAGE */}
        <div className="mb-24 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-10 justify-center md:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-sm">
              <Target size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tight">
              Intelligence Analyzer
            </h2>
          </div>

          <div className="p-10 md:p-14 rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-elite)] transition-all duration-700 hover:shadow-[var(--shadow-elite-hover)]">
            <p className="text-lg text-[var(--site-text-muted)] mb-10 font-bold opacity-70 text-center md:text-left">
              Enter your learning goal and let AI find the best courses, skills, and roadmap for you.
            </p>

            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row gap-6 relative group/form"
            >
              <div className="flex-1 relative group/input">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-700" />
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--site-text-muted)] opacity-30 group-focus-within/input:opacity-100 group-focus-within/input:text-[var(--accent-primary)] transition-all" size={24} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What do you want to learn? (e.g. 'React Developer')"
                    className="w-full pl-16 pr-8 py-6 rounded-2xl bg-[var(--site-text)]/5 border-2 border-transparent focus:border-[var(--accent-primary)]/30 focus:bg-[var(--site-text)]/[0.08] outline-none text-[var(--site-text)] font-black text-xl transition-all placeholder:text-[var(--site-text-muted)] placeholder:opacity-40"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoadingOrFetching}
                className="px-12 py-6 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-black rounded-2xl text-xs uppercase tracking-[0.4em] transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 btn-tactile whitespace-nowrap border border-white/10"
              >
                {isLoadingOrFetching ? (
                  <Loader2 size={24} className="animate-spin" strokeWidth={3} />
                ) : (
                  <>
                    <Zap size={24} strokeWidth={3} className="text-blue-300" />
                    Search
                  </>
                )}
              </button>
            </form>

            {/* PROTOCOL STATUS INDICATOR */}
            {isMounted && lastSearchedQuery && !isLoadingOrFetching && (
              <div className="mt-10 flex items-center justify-center">
                <div className="px-6 py-3 bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/10 rounded-2xl flex items-center gap-4 transition-all animate-in fade-in zoom-in-95">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em]">
                    Active Search:{" "}
                    <span className="text-[var(--site-text)] underline decoration-blue-500/30 decoration-4 underline-offset-4">
                      {lastSearchedQuery}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* ELITE EMPTY STATE - PROTOCOL INITIALIZATION */}
        {isMounted && (!data && !isLoadingOrFetching) && (
          <div className="py-32 text-center animate-in fade-in zoom-in duration-1000">
            <div className="relative w-48 h-48 mx-auto mb-12 group">
              <div className="absolute inset-0 bg-[var(--accent-primary)]/10 rounded-[3rem] blur-3xl group-hover:bg-[var(--accent-primary)]/20 transition-colors duration-1000" />
              <div className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-[var(--card-bg)] to-[var(--site-bg)] border border-[var(--card-border)] flex items-center justify-center shadow-2xl group-hover:-rotate-6 transition-transform duration-700">
                <div className="relative">
                  <Cpu size={80} className="text-[var(--accent-primary)] opacity-20 group-hover:opacity-40 transition-opacity" strokeWidth={1} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search size={32} className="text-[var(--accent-primary)] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            <h2 className="text-5xl font-black text-[var(--site-text)] tracking-tighter mb-4">
              Ready to <span className="text-[var(--accent-primary)]">Learn</span>
            </h2>
            <p className="text-xl font-bold text-[var(--site-text-muted)] max-w-2xl mx-auto opacity-70 mb-10 leading-relaxed">
              Start by entering what you want to learn above. <br />
              <span className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Enter a topic to get started</span>
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['AI Engineering', 'Full Stack Deep Dive', 'Cloud Architecture'].map((topic) => (
                <button
                  key={topic}
                  onClick={() => { setQuery(topic); setLastSearchedQuery(topic); setTimeout(() => refetch(), 100); }}
                  className="px-6 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs font-black uppercase tracking-widest text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all btn-tactile shadow-sm"
                >
                  Try &quot;{topic}&quot;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CACHE STATUS INDICATOR */}
        {isMounted && isFromCache && !isLoadingOrFetching && (
          <div className="mb-8 flex justify-center animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-amber-500/5 backdrop-blur-md border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 blur-md opacity-20 animate-pulse" />
                <RefreshCw size={14} className="text-amber-600 dark:text-amber-400 relative z-10 animate-spin" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400/90 flex items-center gap-2">
                Cache Sync Active
                <span className="w-1 h-1 rounded-full bg-amber-500/50" />
                <span className="opacity-60 font-bold">Establishing Live Protocol Link</span>
              </span>
            </div>
          </div>
        )}

        {/* LOADING STATE - ELITE ANALYZER SKELETONS */}
        {(isLoadingOrFetching || !isMounted) && (
          <div className="space-y-16 animate-in fade-in duration-700">
            {/* Header Loading */}
            <div className="py-20 text-center relative overflow-hidden rounded-[3rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-elite)]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent-primary)]/5 to-transparent animate-pulse" />
              <div className="relative z-10 space-y-6">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
                  <Brain size={48} className="text-[var(--accent-primary)] animate-bounce" />
                </div>
                <h3 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Synthesizing Professional Path</h3>
                <p className="text-[var(--site-text-muted)] font-bold opacity-60">Cross-referencing global career trajectories...</p>
              </div>
            </div>

            {/* Content Skeletons */}
            <div className={!!user ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
            </div>
            <div className="space-y-8">
              <Skeleton className="h-16 w-1/3 rounded-xl" />
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-[3rem]" />)}
            </div>
          </div>
        )}

        {/* RESULTS ENGINE */}
        {isMounted && data && !isLoadingOrFetching && (
          <div className="space-y-24 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* 1. CAREER IMPACT TELEMETRY */}
            {data.careerInsights && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Target Roles', value: data.careerInsights.targetRoles?.slice(0, 1).join(''), sub: data.careerInsights.targetRoles?.slice(1, 2).join(''), icon: Briefcase, color: 'from-blue-600 to-indigo-700' },
                  { label: 'Market Yield', value: data.careerInsights.salaryRange, sub: 'EST. ANNUAL RADIUS', icon: Award, color: 'from-emerald-600 to-teal-700' },
                  { label: 'Time to Sync', value: data.careerInsights.readinessTime, sub: 'MASTERY WINDOW', icon: Clock, color: 'from-amber-500 to-orange-600' },
                  { label: 'Sync Demand', value: data.careerInsights.demandLevel, sub: 'GLOBAL ACQUISITION', icon: TrendingUp, color: 'from-purple-600 to-indigo-600' }
                ].map((item, i) => (
                  <div key={i} className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${item.color} text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group relative overflow-hidden border border-white/5`}>
                    <div className="absolute top-0 right-0 p-6 opacity-20 transition-transform group-hover:scale-125 group-hover:rotate-12 pointer-events-none">
                      <item.icon size={48} strokeWidth={1} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">{item.label}</p>
                    <p className="text-2xl font-black tracking-tight mb-1">{item.value}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{item.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 2. CORE SKILL ARCHITECTURE */}
            {data.skillBreakdown && data.skillBreakdown.length > 0 && (
              <div>
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                  <div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--site-text)] tracking-tighter mb-4">
                      Skill Architecture
                    </h2>
                    <p className="text-base md:text-lg font-bold text-[var(--site-text-muted)] opacity-70">The structural sequence required for 2026 platform mastery.</p>
                  </div>
                  <div className="w-24 h-1 bg-[var(--accent-primary)] rounded-full mb-2 hidden md:block" />
                </div>

                <div className="grid gap-8">
                  {data.skillBreakdown.map((skill, i) => (
                    <div
                      key={i}
                      className="p-10 rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-elite)] transition-all group relative overflow-hidden"
                    >
                      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-[80px]" />

                      <div className="flex flex-col lg:flex-row lg:items-center gap-10 relative z-10">
                        <div className="flex-1 space-y-6">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className={`px-5 py-2 rounded-xl bg-gradient-to-r ${priorityColors[skill.priority]} text-white text-[10px] font-black uppercase tracking-widest shadow-xl`}>
                              {skill.priority} Priority
                            </span>
                            <span className="flex items-center gap-2 px-4 py-2 bg-[var(--site-text)]/5 rounded-xl text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-wider border border-[var(--card-border)]">
                              {demandIcons[skill.marketDemand]} {skill.marketDemand} Demand
                            </span>
                            <span className="flex items-center gap-2 px-4 py-2 bg-[var(--site-text)]/5 rounded-xl text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-wider border border-[var(--card-border)]">
                              <Clock size={14} className="text-indigo-500" /> {skill.estimatedTime}
                            </span>
                          </div>

                          <h3 className="text-4xl font-black text-[var(--site-text)] tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">
                            {skill.skill}
                          </h3>

                          <p className="text-lg leading-relaxed text-[var(--site-text-muted)] font-bold opacity-80 max-w-4xl">
                            {skill.explanation}
                          </p>

                          {skill.prerequisites?.length > 0 && (
                            <div className="pt-4 flex flex-wrap gap-3">
                              {skill.prerequisites.map((prereq, j) => (
                                <span key={j} className="px-3 py-1.5 bg-[var(--accent-primary)]/5 text-[var(--accent-primary)] rounded-lg text-xs font-black uppercase tracking-widest border border-[var(--accent-primary)]/10">
                                  {prereq}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleSkillCourseSearch(skill)}
                          className="lg:w-64 py-6 bg-[var(--site-text)] text-[var(--card-bg)] font-black rounded-3xl text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap btn-tactile group/btn"
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

            {/* 3. EVOLUTION ROADMAP */}
            {data.roadmap && data.roadmap.length > 0 && (
              <div>
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                  <div>
                    <h2 className="text-5xl lg:text-6xl font-black text-[var(--site-text)] tracking-tighter mb-4">
                      Evolution Path
                    </h2>
                    <p className="text-lg font-bold text-[var(--site-text-muted)] opacity-60">The sequential evolution logic for deep domain mastery.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {data.roadmap.map((phase, i) => (
                    <div
                      key={i}
                      className="relative p-10 rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-purple-500/30 transition-all hover:-translate-y-4 hover:shadow-[var(--shadow-elite)] group cursor-pointer"
                    >
                      <div className="absolute -top-6 -left-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-black text-xl flex items-center justify-center shadow-xl z-20 border-4 border-[var(--site-bg)] group-hover:scale-110 transition-transform">
                        {i + 1}
                      </div>

                      <div className="mt-6 space-y-6">
                        <div>
                          <h3 className="text-2xl font-black text-[var(--site-text)] mb-2 group-hover:text-purple-600 transition-colors tracking-tight">
                            {phase.phase}
                          </h3>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                            <Clock size={12} strokeWidth={2.5} />
                            {phase.duration} System Sync
                          </div>
                        </div>

                        <div className="space-y-3">
                          {phase.skills?.map((skill, j) => (
                            <div key={j} className="flex items-center gap-3 text-sm text-[var(--site-text-muted)] font-bold">
                              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                              {skill}
                            </div>
                          ))}
                        </div>

                        <div className="pt-6 border-t border-[var(--card-border)]">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--site-text-muted)] opacity-60 mb-3">Target Milestone</p>
                          <p className="text-sm font-black text-[var(--site-text)] leading-relaxed opacity-90">
                            {phase.milestone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Recommendations */}
            {data.courses && data.courses.length > 0 && (
              <div id="courses-section" className="scroll-mt-32">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <h2 className="text-3xl md:text-4xl font-black text-[var(--site-text)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-500/20">
                      <BookOpen size={24} className="text-emerald-600" />
                    </div>
                    Global Resources
                  </h2>

                  {selectedSkill ? (
                    <div className="flex items-center p-1.5 pr-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-sm">
                      <div className="px-5 py-2.5 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 text-blue-600 dark:text-blue-400 rounded-[1.5rem] border border-blue-500/20 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                          <Target size={12} strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">
                          Filtered: <span className="text-[var(--site-text)] ml-1">{selectedSkill.skill}</span>
                        </span>
                      </div>

                      <div className="w-px h-6 bg-[var(--card-border)] mx-2" />

                      <button
                        onClick={handleResetFilter}
                        className="px-4 py-2 hover:bg-[var(--site-text)]/5 rounded-xl text-[var(--site-text-muted)] hover:text-[var(--site-text)] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer group"
                      >
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        Show All
                      </button>
                    </div>
                  ) : (
                    <div className="px-6 py-3 bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-400/20 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">
                        Sequence Sync: <span className="text-emerald-600 dark:text-emerald-300">{visibleCourses.length}</span> / {filteredCourses.length} LOADED
                      </span>
                    </div>
                  )}
                </div>

                <div className={!!user ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8"}>
                  {visibleCourses.map((course, i) => (
                    <CourseCard
                      key={`${course.title}-${i}`}
                      course={course}
                      onClick={() => window.open(course.link, "_blank")}
                      isSaved={isCourseAlreadySaved(course.title)}
                      onSaveSuccess={handleSaveSuccess}
                      onRemoveSuccess={handleSaveSuccess}
                    />
                  ))}
                </div>

                {hasMoreCourses && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
                    >
                      <ChevronDown size={20} className="animate-bounce" />
                      Load More Courses
                      <span className="px-3 py-1 bg-white/20 rounded-lg text-xs">
                        +
                        {Math.min(
                          COURSES_PER_PAGE,
                          filteredCourses.length - displayedCoursesCount
                        )}
                      </span>
                    </button>
                  </div>
                )}

                {!hasMoreCourses && filteredCourses.length > COURSES_PER_PAGE && (
                  <div className="text-center py-10">
                    <span className="text-[var(--site-text-muted)] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 opacity-40">
                      <span className="w-12 h-px bg-[var(--card-border)] inline-block" />
                      Protocol Sequence Terminated
                      <span className="w-12 h-px bg-[var(--card-border)] inline-block" />
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* YouTube Video Tutorials - NEW SECTION */}
            {data.youtubeVideos && data.youtubeVideos.length > 0 && (
              <div id="youtube-section">
                <h2 className="text-3xl md:text-4xl font-black text-[var(--site-text)] mb-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center border border-rose-500/20">
                    <Youtube size={24} className="text-rose-600" />
                  </div>
                  Video Intelligence
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {data.youtubeVideos.map((video, i) => (
                    <YouTubeVideoCard
                      key={i}
                      video={video}
                      onClick={() => window.open(video.link, "_blank")}
                      isSaved={isCourseAlreadySaved(video.title)}
                      onSaveSuccess={handleSaveSuccess}
                      onRemoveSuccess={handleSaveSuccess}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Learning Resources - NEW SECTION */}
            {data.resources && data.resources.length > 0 && (
              <div id="resources-section">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                  <div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--site-text)] tracking-tighter mb-4">
                      Technical Blueprints
                    </h2>
                    <p className="text-base md:text-lg font-bold text-[var(--site-text-muted)] opacity-70">Architectural documentation and primary source material.</p>
                  </div>
                  <div className="w-24 h-1 bg-indigo-500/30 rounded-full mb-2 hidden md:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {data.resources.map((resource, i) => (
                    <ResourceCard
                      key={i}
                      resource={resource}
                      onClick={() => window.open(resource.link, "_blank")}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Practice Projects - NEW SECTION */}
            {data.practiceProjects && data.practiceProjects.length > 0 && (
              <div id="projects-section">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                  <div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--site-text)] tracking-tighter mb-4">
                      Engineering Projects
                    </h2>
                    <p className="text-base md:text-lg font-bold text-[var(--site-text-muted)] opacity-70">Practical application of intelligence in real-world logic.</p>
                  </div>
                  <div className="w-24 h-1 bg-neutral-500/30 rounded-full mb-2 hidden md:block" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {data.practiceProjects.map((project, i) => (
                    <ProjectCard
                      key={i}
                      project={project}
                      onClick={() => window.open(project.link, "_blank")}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI Tools */}
            {data.tools && data.tools.length > 0 && (
              <div id="tools-section">
                <h2 className="text-3xl md:text-4xl font-black text-[var(--site-text)] mb-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
                    <Cpu size={24} className="text-blue-600" />
                  </div>
                  Essential AI Tools
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {data.tools.map((tool, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedTool(tool)}
                      className="group relative p-10 rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-elite)] hover:shadow-[var(--shadow-elite-hover)] transition-all duration-500 hover:-translate-y-3 overflow-hidden flex flex-col cursor-pointer btn-tactile"
                    >
                      {/* Elite Ambient Glow */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                      <div className="absolute -right-12 -top-12 p-8 text-blue-500 opacity-0 group-hover:opacity-10 group-hover:scale-150 transition-all duration-1000">
                        <Sparkles size={160} />
                      </div>

                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-4 mb-8 sm:mb-10">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {/* Comparison Selection Checkbox (Moved to left to prevent right-side overflow) */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleCompare(tool.name); }}
                              className={`
                                w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center border-2 transition-all cursor-pointer shadow-md shrink-0 btn-tactile
                                ${selectedForComparison.includes(tool.name)
                                  ? "bg-amber-500 border-amber-500 text-white scale-110"
                                  : "bg-[var(--card-bg)] border-[var(--card-border)] hover:border-amber-500 hover:bg-amber-500/5 text-amber-600/70"
                                }
                              `}
                              title={selectedForComparison.includes(tool.name) ? 'Click to remove from comparison' : 'Click to select for comparison'}
                            >
                              {selectedForComparison.includes(tool.name) ? (
                                <Check size={16} strokeWidth={3} />
                              ) : (
                                <span className="text-xl font-black mb-1">+</span>
                              )}
                            </button>
                            
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-500 border border-blue-500/20 shadow-xl shadow-blue-600/5 shrink-0">
                              <Zap className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2.5} />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Save to Library Button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavoriteTool(tool); }}
                              disabled={savingTool === tool.name}
                              className={`
                                w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 border btn-tactile shrink-0
                                ${isToolAlreadySaved(tool.name)
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xl shadow-indigo-600/30 ring-4 ring-indigo-500/10"
                                  : "bg-[var(--card-bg)] text-[var(--site-text-muted)] border-[var(--card-border)] hover:text-indigo-600 hover:border-indigo-600/50 hover:bg-[var(--site-text)]/5 shadow-md"
                                }
                                ${savingTool === tool.name ? "animate-pulse" : ""}
                              `}
                              title={isToolAlreadySaved(tool.name) ? 'Saved to Library' : 'Save to Library'}
                            >
                              {savingTool === tool.name ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : isToolAlreadySaved(tool.name) ? (
                                <BookMarked className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" strokeWidth={2.5} />
                              ) : (
                                <BookMarked className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 opacity-60" strokeWidth={2.5} />
                              )}
                            </button>

                            {(tool.official_link || tool.link) && (
                              <a
                                href={tool.official_link || tool.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-[var(--site-text)]/5 text-[var(--site-text-muted)] hover:bg-blue-600/10 hover:text-blue-600 transition-all flex items-center justify-center border border-[var(--card-border)] group/link shadow-md shrink-0"
                                title="Official Website"
                              >
                                <Globe className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover/link:rotate-12 transition-transform" strokeWidth={2.5} />
                              </a>
                            )}
                          </div>
                        </div>

                        <h3 className="text-2xl font-black text-[var(--site-text)] mb-4 tracking-tight leading-tight group-hover:text-blue-600 transition-colors duration-500">
                          {tool.name}
                        </h3>
                        <p className="text-[var(--site-text-muted)] font-bold leading-relaxed mb-8 opacity-70 group-hover:opacity-100 transition-opacity">
                          {tool.description}
                        </p>

                        <div className="mt-auto pt-8 border-t border-[var(--card-border)]/50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
                          <button
                            onClick={() => setSelectedTool(tool)}
                            className="flex items-center gap-3 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] group/btn transition-all duration-500 hover:gap-5 bg-transparent outline-none cursor-pointer"
                          >
                            Protocol Details <ArrowRight size={16} strokeWidth={3} className="transition-transform group-hover/btn:translate-x-1" />
                          </button>

                          {(tool.official_link || tool.link) && (
                            <a
                              href={tool.official_link || tool.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer border border-white/10"
                            >
                              <Globe size={14} /> Try Now
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEARNING VELOCITY - ELITE TELEMETRY PANEL */}
            {velocityData?.success && (
              <div className="mb-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="flex items-center gap-4 mb-10 justify-center md:justify-start">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                    <Zap size={24} strokeWidth={2.5} className="animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tight">
                    Learning Telemetry
                  </h2>
                  <span className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 border border-white/10 flex items-center gap-2 cursor-default hover:scale-105 transition-transform absolute right-0 top-0 md:relative md:top-auto md:right-auto">
                    <Sparkles size={12} className="text-white/90" />
                    Premium Feature
                  </span>
                </div>

                <Surface className="p-10 md:p-12 rounded-[3.5rem] bg-[var(--card-bg)]/40 backdrop-blur-3xl border border-[var(--card-border)] shadow-[var(--shadow-elite)] group/velocity overflow-hidden relative">
                  {/* Subtle Background Glow */}
                  <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none group-hover/velocity:bg-amber-500/10 transition-colors duration-1000" />

                  <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Current Pace', val: velocityData.data.velocity, unit: '/week', icon: <TrendingUp size={20} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
                      { label: 'Courses Done', val: velocityData.data.coursesCompleted, unit: 'Total', icon: <CheckCircle2 size={20} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
                      { label: 'Account Age', val: velocityData.data.accountAgeWeeks, unit: 'wks', icon: <Clock size={20} />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
                      { label: 'Insight Status', val: 'Active', isInsight: true, icon: <Sparkles size={20} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' }
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
                              {stat.unit && (
                                <span className="text-xs font-black uppercase tracking-widest text-[var(--site-text-muted)] opacity-40">
                                  {stat.unit}
                                </span>
                              )}
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

            {/* Market Outlook */}
            {data.careerInsights?.marketOutlook && (
              <div className="relative p-12 rounded-[3.5rem] bg-gradient-to-br from-indigo-500 to-blue-700 text-white overflow-hidden shadow-2xl group">
                {/* Elite Background Detail */}
                <div className="absolute -right-32 -top-32 w-96 h-96 bg-white/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px]" />

                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl">
                      <TrendingUp size={40} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter mb-1">
                        2026 Market Outlook
                      </h2>
                      <p className="text-sm font-black uppercase tracking-[0.3em] opacity-60">Predictive Career Intelligence</p>
                    </div>
                  </div>

                  <p className="text-2xl font-bold leading-relaxed text-white/90 max-w-5xl">
                    &quot;{data.careerInsights.marketOutlook}&quot;
                  </p>

                  <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-8">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">REAL-TIME TELEMETRY ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Cpu size={14} className="text-white/50" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">LLM PERSPECTIVE SYNCED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      {/* Tool Action Modal Integration */}
      {selectedTool && (
        <ToolActionModal
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
        />
      )}

      {/* Comparison Result Panel - Ported from AI Tools for exact look & feel */}
      <AnimatePresence>
      {comparisonResult && comparisonResult.type === 'structured' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[10001] flex p-3 sm:p-4 md:p-6 overflow-hidden"
          onClick={() => { setComparisonResult(null); setSelectedForComparison([]); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-xl" />

          {/* Layout Wrapper to center relative to sidebar */}
          <div className="relative w-full h-full flex items-start justify-center max-lg:pl-0 lg:pl-[var(--sidebar-offset,0px)] pt-20 pb-4 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500">
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl my-auto bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl sm:rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex justify-between items-center p-3 sm:p-4 md:p-5 border-b border-[var(--card-border)] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <GitCompareArrows size={18} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base md:text-lg font-black text-[var(--site-text)] tracking-tight">AI Tools Comparison</h4>
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">{selectedForComparison.length} Tools Analyzed</p>
                </div>
              </div>
              <button
                onClick={() => { setComparisonResult(null); setSelectedForComparison([]); }}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-[var(--site-text)]/5 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer group btn-tactile border border-[var(--card-border)]"
              >
                <X size={16} className="text-[var(--site-text-muted)] group-hover:text-rose-500 transition-colors" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 md:p-5 overflow-y-auto max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] custom-comparison-scroll">
              {/* Quick Takeaway Banner */}
              {comparisonResult.data.quickTakeaway && (
                <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base font-bold text-[var(--site-text)] leading-relaxed">
                      {comparisonResult.data.quickTakeaway}
                    </p>
                  </div>
                </div>
              )}

              {/* Tool Comparison Cards Grid */}
              <div className={`grid gap-4 sm:gap-6 mb-6 ${comparisonResult.data.toolsComparison?.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                {comparisonResult.data.toolsComparison?.map((tool, index) => (
                  <div
                    key={tool.name || index}
                    className="p-5 sm:p-6 rounded-2xl sm:rounded-[1.5rem] bg-[var(--site-bg)] border border-[var(--card-border)] hover:border-[var(--accent-primary)]/30 transition-all hover:shadow-lg group"
                  >
                    {/* Tool Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h5 className="text-lg sm:text-xl font-black text-[var(--site-text)] tracking-tight mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
                          {tool.name}
                        </h5>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] sm:text-xs font-black uppercase tracking-wider">
                          {tool.category || 'AI Tool'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">{tool.rating || '4.0'}</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <DollarSign size={16} className="text-emerald-500" />
                      <span className="text-xs sm:text-sm font-bold text-[var(--site-text)]">{tool.pricing || 'Check website'}</span>
                      {tool.popularityRank && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[var(--site-text-muted)] uppercase">
                          <TrendingUp size={12} className="text-blue-500" />
                          {tool.popularityRank}
                        </span>
                      )}
                    </div>

                    {/* Key Features */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ZapIcon size={14} className="text-indigo-500" />
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--site-text-muted)]">Key Features</span>
                      </div>
                      <ul className="space-y-1.5">
                        {(tool.keyFeatures || []).slice(0, 4).map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start gap-2 text-xs sm:text-sm text-[var(--site-text-muted)] font-medium">
                            <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Best For */}
                    {tool.bestFor && (
                      <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <div className="flex items-center gap-2 mb-1">
                          <TargetIcon size={14} className="text-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Best For</span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-[var(--site-text)]">{tool.bestFor}</p>
                      </div>
                    )}

                    {/* Pros & Cons */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ThumbsUp size={12} className="text-emerald-500" />
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Pros</span>
                        </div>
                        <ul className="space-y-1">
                          {(tool.pros || []).slice(0, 3).map((pro, pIndex) => (
                            <li key={pIndex} className="text-[10px] sm:text-xs text-[var(--site-text-muted)] font-medium leading-snug">• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ThumbsDown size={12} className="text-rose-500" />
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Cons</span>
                        </div>
                        <ul className="space-y-1">
                          {(tool.cons || []).slice(0, 2).map((con, cIndex) => (
                            <li key={cIndex} className="text-[10px] sm:text-xs text-[var(--site-text-muted)] font-medium leading-snug">• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Visit Website Link */}
                    {(tool.url || tool.official_link || tool.link) && (
                      <div className="mt-6 pt-6 border-t border-[var(--card-border)]/50">
                        <a
                          href={tool.url || tool.official_link || tool.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group/link"
                        >
                          <Globe size={14} className="group-hover/link:rotate-12 transition-transform" />
                          Try {tool.name} Now
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              {comparisonResult.data.recommendation && (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                      <BrainCircuit size={20} />
                    </div>
                    <div>
                      <h6 className="text-sm sm:text-base font-black text-[var(--site-text)] uppercase tracking-wider mb-2">AI Recommendation</h6>
                      <p className="text-sm sm:text-base font-medium text-[var(--site-text-muted)] leading-relaxed">
                        {comparisonResult.data.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Floating Compare Button - Positioned to clear sidebar and AI Companion */}
      {selectedForComparison.length >= 2 && !comparisonResult && (
        <button
          onClick={runComparison}
          disabled={isComparing}
          className="fixed bottom-10 left-8 lg:left-[calc(18rem+3rem)] px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center gap-4 font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 active:scale-95 transition-all z-[10001] cursor-pointer disabled:opacity-50 border-2 border-white/20 backdrop-blur-md max-w-[90vw]"
        >
          {isComparing ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Comparing...
            </>
          ) : (
            <>
              <GitCompareArrows size={18} /> Compare {selectedForComparison.length} Tools
            </>
          )}
        </button>
      )}

      {/* Scrollbar styles moved to globals.css to prevent hydration mismatch */}
    </div>
  );
}

function AIIntelligencePageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--site-bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="animate-spin text-[var(--accent-primary)] mx-auto" />
          <p className="text-[var(--site-text-muted)] font-black uppercase tracking-[0.2em]">Initializing Intelligence Protocol...</p>
        </div>
      </div>
    }>
      <AIIntelligenceContent />
    </Suspense>
  );
}

export default function AIIntelligencePage() {
  return (
    <Suspense fallback={null}>
      <AIIntelligencePageContent />
    </Suspense>
  );
}

