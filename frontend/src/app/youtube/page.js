"use client";
import { Suspense, useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import YouTubeVideoCard from "../../components/YouTubeVideoCard";
import Breadcrumb from "../../components/ui/Breadcrumb";
import {
  Search,
  Youtube,
  Loader2,
  Sparkles,
  Zap,
  Plus,
  ArrowRight,
  Filter,
  X,
} from "lucide-react";

import { useSearchParams } from "next/navigation";
import { YouTubeSkeleton } from "../../components/ui/Skeleton";

const INITIAL_LIMIT = 6;
const LOAD_MORE_INCREMENT = 6;

function YoutubePageContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q");

  const [searchQuery, setSearchQuery] = useState(urlQuery || "");
  const [triggerSearch, setTriggerSearch] = useState(urlQuery || "full web development course");
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initializing from URL
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
      setTriggerSearch(urlQuery);
    }
  }, [urlQuery]);

  // Fetch YouTube results
  const { data: videos, isLoading, isFetching } = useQuery({
    queryKey: ["youtube", triggerSearch],
    queryFn: () => api.youtubeSearch(triggerSearch),
    enabled: !!triggerSearch,
    staleTime: 1000 * 60 * 60, // 1 hour persistent cache
    gcTime: 1000 * 60 * 60 * 24,
  });

  // Fetch saved items to check saved status
  const { data: savedItems, refetch: refetchSaved } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api.getFavorites(token),
    enabled: !!token,
    staleTime: 0, // Always consider stale for real-time updates
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const isVideoSaved = useCallback(
    (videoTitle) => {
      if (!savedItems) return false;
      return savedItems.some((item) => item.title === videoTitle);
    },
    [savedItems]
  );

  const handleSaveSuccess = () => {
    refetchSaved();
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setTriggerSearch(searchQuery);
      setVisibleCount(INITIAL_LIMIT); // Reset visibility count on new search
      // Update URL without reload
      window.history.pushState({}, '', `/youtube?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_INCREMENT);
  };

  const displayedVideos = useMemo(() => {
    if (!videos) return [];
    return videos.slice(0, visibleCount);
  }, [videos, visibleCount]);

  const hasMore = videos && videos.length > visibleCount;

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-500 pb-16 overflow-hidden relative">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-rose-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-6 pt-6 pb-16 max-w-7xl relative z-10 animate-in fade-in duration-700">
        {!isMounted ? (
          <div className="space-y-16 animate-in fade-in duration-700">
            <div className="py-20 text-center relative overflow-hidden rounded-[3rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-elite)]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-600/5 to-transparent animate-pulse" />
              <div className="relative z-10 space-y-6">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-rose-600/10 flex items-center justify-center">
                  <Youtube size={48} className="text-rose-600 animate-bounce" />
                </div>
                <h3 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Initializing Video Grid</h3>
                <p className="text-[var(--site-text-muted)] font-bold opacity-60">Synchronizing mentor telemetry...</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[1, 2, 3].map(i => <YouTubeSkeleton key={i} />)}
            </div>
          </div>
        ) : (
          <>
            {/* BREADCRUMB NAVIGATION */}
            <Breadcrumb currentPage="YouTube Videos" currentIcon={Youtube} />

        {/* ELITE HEADER SECTION */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm text-rose-500 text-[10px] font-black tracking-[0.4em] uppercase mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Youtube size={18} className="animate-pulse" strokeWidth={2.5} /> Free Video Tutorials
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[7.5rem] xl:text-[8rem] 2xl:text-[9rem] font-black text-[var(--site-text)] tracking-tighter mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-700">
            Master Skills for <span className="text-rose-600">Free.</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-[var(--site-text-muted)] opacity-70 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100">
            Access the world&apos;s best programming tutorials and courses on YouTube. Free and high-quality learning content.
          </p>

          {/* ELITE SEARCH INTERFACE */}
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-1000 delay-200">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-rose-600/20 to-amber-600/20 rounded-[3rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center">
                <div className="absolute left-6 sm:left-8 pointer-events-none transition-transform group-focus-within:scale-110">
                  <Search className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--site-text-muted)] group-focus-within:text-rose-600 transition-colors" strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for tutorials (e.g., React for Beginners)..."
                  className="w-full pl-16 sm:pl-20 pr-32 sm:pr-40 py-5 sm:py-6 text-lg sm:text-xl md:text-2xl font-black bg-[var(--card-bg)] border-2 sm:border-[3px] border-[var(--card-border)] rounded-full focus:border-rose-600/50 focus:outline-none transition-all placeholder:text-[var(--site-text-muted)]/30 text-[var(--site-text)] shadow-2xl backdrop-blur-md"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isLoading || isFetching}
                  className="absolute right-2 sm:right-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white font-black rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 sm:gap-3 shadow-xl btn-tactile"
                >
                  {isLoading || isFetching ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    <>
                      <Zap size={20} fill="currentColor" />
                      <span className="hidden sm:inline text-xs uppercase tracking-widest">Search</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
              {['System Design', 'AI Engineering', 'Fullstack Mastery'].map((topic) => (
                <button
                  key={topic}
                  onClick={() => { setSearchQuery(topic); setTriggerSearch(topic); setVisibleCount(INITIAL_LIMIT); }}
                  className="px-5 py-2.5 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest text-[var(--site-text-muted)] hover:text-rose-600 hover:border-rose-500/30 transition-all btn-tactile"
                >
                  Try "{topic}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS ENGINE */}
        {(isLoading && !videos) || (isFetching && !videos) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            {[...Array(6)].map((_, i) => (
              <YouTubeSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-20">
            {displayedVideos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                  {displayedVideos.map((item, i) => {
                    const videoObj = {
                      title: item.snippet?.title,
                      creator: item.snippet?.channelTitle,
                      thumbnail: item.snippet?.thumbnails?.high?.url,
                      link: `https://www.youtube.com/playlist?list=${item.id?.playlistId}`,
                      type: 'Tutorial',
                      difficulty: 'All Levels',
                      duration: 'Playlist',
                    };

                    return (
                      <YouTubeVideoCard
                        key={`${item.id?.playlistId}-${i}`}
                        video={videoObj}
                        onClick={() => window.open(videoObj.link, "_blank")}
                        isSaved={isVideoSaved(videoObj.title)}
                        onSaveSuccess={handleSaveSuccess}
                        onRemoveSuccess={handleSaveSuccess}
                      />
                    );
                  })}
                </div>

                {/* LOAD MORE CTA */}
                {hasMore && (
                  <div className="flex justify-center mt-20">
                    <button
                      onClick={handleLoadMore}
                      className="group px-12 py-6 bg-[var(--card-bg)] border-2 border-[var(--card-border)] text-[var(--site-text)] font-black rounded-3xl text-sm uppercase tracking-[0.3em] transition-all shadow-xl hover:border-rose-600/50 hover:scale-105 active:scale-95 flex items-center gap-6 btn-tactile"
                    >
                      <Plus size={24} className="group-hover:rotate-180 transition-transform duration-500 text-rose-600" />
                      Load More Videos
                      <ArrowRight size={20} className="opacity-40 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                )}

                {!hasMore && displayedVideos.length > 0 && (
                  <div className="text-center py-10">
                    <div className="text-[var(--site-text-muted)] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 opacity-40">
                      <div className="w-12 h-px bg-[var(--card-border)]" />
                      End of Results
                      <div className="w-12 h-px bg-[var(--card-border)]" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* EMPTY STATE */
              <div className="py-32 text-center animate-in fade-in zoom-in duration-1000">
                <div className="relative w-48 h-48 mx-auto mb-12 group">
                  <div className="absolute inset-0 bg-rose-500/10 rounded-[3rem] blur-3xl" />
                  <div className="relative w-full h-full rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center shadow-2xl group-hover:-rotate-6 transition-transform">
                    <Youtube size={80} className="text-rose-600 opacity-20" />
                  </div>
                </div>
                <h2 className="text-4xl font-black text-[var(--site-text)] tracking-tighter mb-4">
                  No Videos Found
                </h2>
                <p className="text-lg font-bold text-[var(--site-text-muted)] opacity-60 mb-10 max-w-md mx-auto">
                  We couldn't find any videos matching your search. Try a different term.
                </p>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default function YoutubePage() {
  return (
    <Suspense fallback={null}>
      <YoutubePageContent />
    </Suspense>
  );
}
