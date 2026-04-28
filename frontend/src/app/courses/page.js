"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import OpportunityStudio from "../../components/OpportunityStudio";
import CourseCard from "../../components/CourseCard";
import Breadcrumb from "../../components/ui/Breadcrumb";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Plus,
  Loader2,
  Search,
  X,
  Filter,
  Sparkles,
  SearchCode,
  Zap,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { CourseSkeleton } from "../../components/ui/Skeleton";

const INITIAL_COURSES_COUNT = 8;
const LOAD_MORE_COUNT = 6;

function CoursesContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loadMoreCount, setLoadMoreCount] = useState(0);
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get query from URL
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q");

  // Persistence Keys
  const DEFAULT_CACHE_KEY = "courses-library-default-v6";
  const SEARCH_CACHE_KEY = "courses-library-search-v6";
  const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

  // Client-safe localStorage reader (never called during SSR)
  const readCache = (key) => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed;
      localStorage.removeItem(key);
      return null;
    } catch (e) {
      return null;
    }
  };

  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("q") || localStorage.getItem("coursesSearchQuery") || "";
    }
    return "";
  });

  const [activeSearch, setActiveSearch] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("q") || localStorage.getItem("coursesSearchQuery") || "";
    }
    return "";
  });

  const [showSearchBar, setShowSearchBar] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return !!urlParams.get("q") || localStorage.getItem("coursesShowSearchBar") === "true";
    }
    return false;
  });

  // Restore search state from localStorage on mount if URL is empty
  useEffect(() => {
    if (typeof window === "undefined" || !isMounted) return;

    if (!urlQuery) {
      const savedQuery = localStorage.getItem("coursesSearchQuery");
      const savedShow = localStorage.getItem("coursesShowSearchBar");

      if (savedQuery) {
        setSearchQuery(savedQuery);
        setActiveSearch(savedQuery);
        setShowSearchBar(true);
      } else if (savedShow === "true") {
        setShowSearchBar(true);
      }
    }
  }, [isMounted, urlQuery]);

  // Sync URL query to search state when navigated from other pages (gap analyzer, missions, etc.)
  useEffect(() => {
    if (!isMounted || !urlQuery) return;
    // Only update if urlQuery differs from current activeSearch to avoid infinite loops
    if (urlQuery !== activeSearch) {
      setSearchQuery(urlQuery);
      setActiveSearch(urlQuery);
      setShowSearchBar(true);
      setLoadMoreCount(0);
      localStorage.setItem("coursesSearchQuery", urlQuery);
      localStorage.setItem("coursesShowSearchBar", "true");
    }
  }, [isMounted, urlQuery, activeSearch]);

  // Fetch user profile to get skills/goals for personalized default search
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["learner-profile", token],
    queryFn: () => api.getLearnerProfile(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 60,
  });

  const profileSkills = profileData?.profile?.skills?.map(s => s.name || s.skill).join(', ');
  const targetRole = profileData?.profile?.goals?.targetRole;

  // Wait for profile to settle before computing final query (prevents queryKey flip)
  const profileReady = !token || !profileLoading;

  // Determine what to search for
  const getFinalQuery = () => {
    if (activeSearch) return activeSearch;
    if (targetRole && profileSkills) return `${targetRole} and ${profileSkills}`;
    if (targetRole) return targetRole;
    if (profileSkills) return profileSkills;
    return `AI Cloud and Software Engineering`;
  };

  const finalSearchQuery = getFinalQuery();

  // Stable queryKey — strictly binds to the exact generated query to flawlessly isolate User Targets from Guest States
  const stableQueryKey = ["courses-search", finalSearchQuery];

  // Fetch courses with persistence and graceful transitions
  const {
    data: trendingData,
    isLoading,
    isError,
    refetch,
    isFetching,
    isPlaceholderData,
  } = useQuery({
    queryKey: stableQueryKey,
    queryFn: () => api.aiSearch(finalSearchQuery, token, "courses"),
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: 1000 * 60 * 60 * 24,
    enabled: isMounted && profileReady,
    placeholderData: (previousData) => previousData,
  });

  // CLIENT-SIDE ONLY: Seed React Query cache from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined" || !isMounted) return;

    const cachedKey = activeSearch ? SEARCH_CACHE_KEY : DEFAULT_CACHE_KEY;
    const cached = readCache(cachedKey);

    if (cached?.data && !trendingData) {
      if (cached.query === finalSearchQuery) {
        console.log("💾 [Courses] Seeding React Query from localStorage");
        queryClient.setQueryData(stableQueryKey, cached.data);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, activeSearch]);

  // Fetch additional courses
  const {
    data: additionalData,
    isLoading: loadingMore,
    refetch: refetchMore,
  } = useQuery({
    queryKey: ["additional-courses", loadMoreCount, activeSearch || "default"],
    queryFn: () => {
      const getMoreQuery = () => {
        if (activeSearch) return `${activeSearch} Advanced`;
        if (targetRole && profileSkills) return `${targetRole} and ${profileSkills} Advanced`;
        if (targetRole) return `${targetRole} Advanced`;
        if (profileSkills) return `${profileSkills} Advanced`;
        return `Web Development AI Cloud Advanced`;
      };
      return api.aiSearch(getMoreQuery(), token, "courses");
    },
    enabled: loadMoreCount > 0,
    staleTime: 1000 * 60 * 60,
  });

  // Save to persistence
  useEffect(() => {
    if (trendingData && !isFetching && !isPlaceholderData && trendingData.source !== "persistence") {
      const cachePayload = JSON.stringify({
        data: trendingData,
        query: finalSearchQuery,
        timestamp: Date.now()
      });

      if (activeSearch) {
        localStorage.setItem(SEARCH_CACHE_KEY, cachePayload);
      } else {
        localStorage.setItem(DEFAULT_CACHE_KEY, cachePayload);
      }
    }
  }, [trendingData, activeSearch, isFetching, isPlaceholderData]);

  // Fetch saved courses
  const { data: savedCourses, refetch: refetchSaved } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api.getFavorites(token),
    enabled: !!token,
  });

    // ROBUST DATA EXTRACTION
    const extractCourses = (data) => {
      if (!data) return [];
      
      // Log data structure for debugging
      console.log("🔍 [Courses] Extracting from:", data);

      // 1. If it's already an array, return it
      if (Array.isArray(data)) return data;
      
      // 2. Handle data.data being an array or object
      if (data.data) {
        if (Array.isArray(data.data)) return data.data;
        if (data.data.courses && Array.isArray(data.data.courses)) return data.data.courses;
        if (data.data.data && Array.isArray(data.data.data)) return data.data.data;
      }

      // 3. Direct matches
      if (data.courses && Array.isArray(data.courses)) return data.courses;
      if (data.results && Array.isArray(data.results)) return data.results;
      
      // 4. Recursive search (Safety net)
      const findArray = (obj, depth = 0) => {
        if (!obj || typeof obj !== 'object' || depth > 3) return null;
        for (const key in obj) {
          if (Array.isArray(obj[key]) && obj[key].length > 0) return obj[key];
          const deep = findArray(obj[key], depth + 1);
          if (deep) return deep;
        }
        return null;
      };
      
      return findArray(data) || [];
    };

  const initialCourses = extractCourses(trendingData);
  const moreCourses = extractCourses(additionalData);
  const allCourses = [...initialCourses, ...moreCourses];

  const isFallback = trendingData?.source === "fallback-engine";

  const isCourseAlreadySaved = useCallback(
    (courseTitle) => {
      if (!savedCourses || !Array.isArray(savedCourses)) return false;
      return savedCourses.some(
        (saved) => saved.title?.toLowerCase() === courseTitle?.toLowerCase()
      );
    },
    [savedCourses]
  );

  const handleSaveSuccess = useCallback(() => {
    refetchSaved();
  }, [refetchSaved]);

  const handleManualSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      const trimmedQuery = searchQuery.trim();
      setActiveSearch(trimmedQuery);
      setLoadMoreCount(0);
      localStorage.setItem("coursesSearchQuery", trimmedQuery);
      localStorage.setItem("coursesShowSearchBar", "true");
      router.push(`/courses?q=${encodeURIComponent(trimmedQuery)}`, { scroll: false });
      setTimeout(() => refetch(), 0);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    setLoadMoreCount(0);
    setShowSearchBar(false);
    localStorage.removeItem("coursesSearchQuery");
    localStorage.removeItem("coursesShowSearchBar");

    const defaultCached = readCache(DEFAULT_CACHE_KEY);
    if (defaultCached?.data) {
      queryClient.setQueryData(["courses-search", "default"], defaultCached.data);
    }

    router.push("/courses", { scroll: false });
    setTimeout(() => refetch(), 100);
  };

  const handleShowSearchBar = () => {
    setShowSearchBar(true);
    localStorage.setItem("coursesShowSearchBar", "true");
  };

  const handleLoadMore = () => {
    setLoadMoreCount((prev) => prev + 1);
    if (loadMoreCount === 0) refetchMore();
  };

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-500 pb-16 overflow-hidden relative">
      <AnimatePresence mode="wait">
        {isMounted && (isLoading || isFetching || loadingMore) && (
          <motion.div
            key="progress-bar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 lg:top-[60px] left-0 right-0 h-[3px] z-[9900] overflow-hidden pointer-events-none"
          >
            <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10" />
            <motion.div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
              initial={{ width: "0%" }}
              animate={{ width: ["0%", "45%", "75%", "90%", "98%"] }}
              transition={{ duration: 15, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-6 py-16 max-w-7xl relative z-10">
        {!isMounted ? (
          <div className="space-y-16 animate-in fade-in duration-700">
            <div className="py-20 text-center relative overflow-hidden rounded-[3rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-elite)]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent-primary)]/5 to-transparent animate-pulse" />
              <div className="relative z-10 space-y-6">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
                  <BookOpen size={48} className="text-[var(--accent-primary)] animate-bounce" />
                </div>
                <h3 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Initializing Library</h3>
              </div>
            </div>
            <div className={!!user ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
              {[1, 2, 3, 4].map(i => <CourseSkeleton key={i} />)}
            </div>
          </div>
        ) : (
          <>
            <Breadcrumb currentPage="Course Library" currentIcon={BookOpen} />

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--site-text)]/5 border border-[var(--card-border)] mb-8">
                  <Sparkles size={14} className="text-[var(--accent-primary)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--site-text-muted)]">Course Library</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                  {activeSearch ? <>Courses for <span className="text-[var(--accent-primary)]">{activeSearch}</span></> : <>Academic <span className="text-[var(--accent-primary)]">Pulse.</span></>}
                </h1>
                <p className="text-[var(--site-text-muted)] font-bold text-xl lg:text-2xl max-w-2xl opacity-70">
                  {activeSearch ? `Synthesizing top-tier courses for ${activeSearch}.` : `Personalized course roadmap synchronized with your target profile.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {!showSearchBar && !activeSearch && (
                  <button onClick={handleShowSearchBar} className="px-8 py-4 bg-[var(--site-text)] cursor-pointer text-[var(--card-bg)] rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-3">
                    <Search size={18} strokeWidth={2.5} /> Search Courses
                  </button>
                )}
                <div className="px-8 py-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[1.5rem] text-[var(--site-text)] text-[10px] font-black tracking-[0.2em] uppercase shadow-lg flex items-center gap-3">
                  <Globe size={16} className="text-[var(--accent-primary)]" /> {allCourses.length} Courses Found
                </div>
              </div>
            </div>

            {showSearchBar && (
              <div className="mb-20 animate-in fade-in slide-in-from-top-6 duration-500">
                <form onSubmit={handleManualSearch} className="relative max-w-5xl mx-auto">
                  <div className="relative flex items-center group">
                    <div className="absolute left-8 pointer-events-none">
                      <SearchCode className="w-8 h-8 text-[var(--site-text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Query professional certification or domain..."
                      className="w-full pl-20 pr-40 py-8 text-2xl font-black bg-[var(--card-bg)] border-[3px] border-[var(--card-border)] rounded-[2.5rem] focus:border-[var(--accent-primary)]/50 focus:outline-none placeholder:text-[var(--site-text-muted)]/30 text-[var(--site-text)] shadow-2xl"
                    />
                    <div className="absolute right-4 flex items-center gap-3">
                      {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery("")} className="p-3 text-[var(--site-text-muted)] cursor-pointer hover:text-[var(--site-text)]"><X size={24} /></button>
                      )}
                      <button type="submit" disabled={!searchQuery.trim() || isLoading || isFetching} className={`px-10 py-5 bg-[var(--accent-primary)]  text-white font-black rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl ${!searchQuery.trim() || isLoading || isFetching ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        {isLoading || isFetching ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Zap size={20} fill="currentColor" /><span className="hidden sm:inline text-xs uppercase tracking-widest">Search</span></>}
                      </button>
                    </div>
                  </div>

                  {activeSearch && (
                    <div className="mt-8 flex items-center justify-center gap-4 animate-in fade-in zoom-in duration-300">
                      <div className="px-6 py-3 bg-[var(--accent-primary)]/10 border-2 border-[var(--accent-primary)]/20 rounded-2xl flex items-center gap-4">
                        <Filter size={18} className="text-[var(--accent-primary)]" />
                        <span className="text-sm font-black text-[var(--site-text)]">Active Filter: <span className="text-[var(--accent-primary)]">&quot;{activeSearch}&quot;</span></span>
                        <button onClick={handleClearSearch} className="w-6 h-6 rounded-lg bg-[var(--accent-primary)] cursor-pointer text-white flex items-center justify-center hover:rotate-90 transition-all"><X size={14} strokeWidth={3} /></button>
                      </div>
                    </div>
                  )}

                  {!activeSearch && (
                    <div className="mt-6 text-center">
                      <button type="button" onClick={() => setShowSearchBar(false)} className="text-xs font-black uppercase  cursor-pointer  tracking-[0.2em] text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] opacity-50 hover:opacity-100 transition-all">Close Search</button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* COURSES ENGINE - Resilient loading state */}
            {(isLoading || !profileReady || (isFetching && allCourses.length === 0) || (!trendingData && !isError)) ? (
              <div className={!!user ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"}>
                {[...Array(8)].map((_, i) => <CourseSkeleton key={i} />)}
              </div>
            ) : (
              <div className="space-y-20">
                {allCourses.length > 0 ? (
                  <>
                    <div className={!!user ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"}>
                      {allCourses.map((course, i) => (
                        <CourseCard
                          key={`${course.title}-${i}`}
                          course={course}
                          onClick={() => setSelectedCourse(course)}
                          isSaved={isCourseAlreadySaved(course.title)}
                          onSaveSuccess={handleSaveSuccess}
                          onRemoveSuccess={handleSaveSuccess}
                        />
                      ))}
                    </div>

                    <div className="flex justify-center mt-20">
                      <button onClick={handleLoadMore} disabled={loadingMore} className="px-12 py-6 bg-[var(--card-bg)] cursor-pointer border-2 border-[var(--card-border)] text-[var(--site-text)] font-black rounded-3xl text-sm uppercase tracking-[0.3em] transition-all hover:border-[var(--accent-primary)]/50 hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-6">
                        {loadingMore ? <><Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" /> Loading...</> : <><Plus size={24} className="text-[var(--accent-primary)]" /> Load {LOAD_MORE_COUNT} More <ArrowRight size={20} /></>}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-32 animate-in fade-in zoom-in duration-1000">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-[var(--site-text)]/5 flex items-center justify-center mx-auto mb-10 border-2 border-dashed border-[var(--card-border)]">
                      <Search size={50} className="text-[var(--site-text-muted)] opacity-20" />
                    </div>
                    <h3 className="text-3xl font-black text-[var(--site-text)] tracking-tighter mb-4">No Courses Found</h3>
                    <p className="text-[var(--site-text-muted)] font-bold text-lg mb-10 max-w-md mx-auto opacity-60">We couldn't find any courses matching your search. Try a different term or browse all courses.</p>
                    {activeSearch && <button onClick={handleClearSearch} className="px-10 py-5 bg-[var(--accent-primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">View All Courses</button>}
                  </div>
                )}
              </div>
            )}

            {isError && !isLoading && !isFetching && (
              <div className="text-center py-32">
                <Globe size={48} className="text-red-500 animate-pulse mx-auto mb-8" />
                <p className="text-3xl font-black mb-4">Sync Failure</p>
                <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--site-text)] text-[var(--card-bg)] rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Try Again</button>
              </div>
            )}
            {selectedCourse && <OpportunityStudio course={selectedCourse} onClose={() => setSelectedCourse(null)} />}
          </>
        )}
      </div>
    </div>
  );
}

function CoursesPageContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={48} className="animate-spin text-[var(--accent-primary)]" /></div>}>
      <CoursesContent />
    </Suspense>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={null}>
      <CoursesPageContent />
    </Suspense>
  );
}
