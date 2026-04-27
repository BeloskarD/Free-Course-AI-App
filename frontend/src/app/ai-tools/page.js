'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Surface from '../../components/ui/Surface';
import Modal from '../../components/ui/Modal';
import ToolActionModal from '../../components/momentum/ToolActionModal';
import { ToolSkeleton } from '../../components/ui/Skeleton';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { Sparkles, BrainCircuit, Loader2, ArrowRight, Code, Palette, Megaphone, Scale, HeartPulse, ShieldCheck, Globe, Search, X, BookmarkPlus, BookmarkCheck, Check, GitCompareArrows, User, Star, ThumbsUp, ThumbsDown, Zap, TrendingUp, DollarSign, Target, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_CACHE_KEY = "ai-tools-default-v6";
const SEARCH_CACHE_KEY = "ai-tools-search-v6";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Client-safe localStorage reader
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

// ROBUST DATA EXTRACTION
const extractTools = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data?.tools && Array.isArray(data.data.tools)) return data.data.tools;
  if (data.tools && Array.isArray(data.tools)) return data.tools;
  if (data.data && Array.isArray(data.data)) return data.data;
  
  const findArray = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    for (const key in obj) {
      if (Array.isArray(obj[key])) return obj[key];
      const deep = findArray(obj[key]);
      if (deep) return deep;
    }
    return null;
  };
  return findArray(data) || [];
};

export default function AIToolsPage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDomain, setSelectedDomain] = useState('Development');
  const [selectedTool, setSelectedTool] = useState(null);
  const [showOpportunity, setShowOpportunity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [savingTool, setSavingTool] = useState(null); // Track which tool is being saved
  const [isMounted, setIsMounted] = useState(false);
  const currentYear = 2026; // Static to prevent hydration mismatch from Date.now()

  useEffect(() => {
    setIsMounted(true);
    
    // Restore state from localStorage on mount (Client-side only)
    if (typeof window !== "undefined") {
      const savedQuery = localStorage.getItem("aiToolsSearchQuery");
      const savedDomain = localStorage.getItem("aiToolsSelectedDomain");
      
      if (savedQuery) {
        setSearchQuery(savedQuery);
        setActiveSearch(savedQuery);
      }
      if (savedDomain && !savedQuery) {
        setSelectedDomain(savedDomain);
      }
    }
  }, []);

  // Fetch user's momentum data for skills context
  const { data: momentumData } = useQuery({
    queryKey: ['momentum', user?.id],
    queryFn: () => api.getMomentumData(token),
    enabled: !!user && !!token,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch saved tools from backend
  const { data: savedToolsData } = useQuery({
    queryKey: ['tool-favorites', user?.id],
    queryFn: () => api.getToolFavorites(token),
    enabled: !!user && !!token,
    staleTime: 1000 * 60 * 2,
  });

  const favoriteTools = savedToolsData?.tools || [];

  // Determine user's primary skills for recommendations
  const userSkills = useMemo(() => {
    if (!momentumData?.skills) return [];
    return momentumData.skills
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3)
      .map(s => s.name);
  }, [momentumData]);

  // Modal notification states (like CourseCard)
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'info' });

  const showNotification = (message, type = 'success') => {
    setModalConfig({
      title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Login Required' : 'Info',
      message,
      type,
    });
    setShowModal(true);
  };

  // Toggle favorite tool using backend API
  const toggleFavorite = useCallback(async (tool) => {
    if (!user || !token) {
      showNotification('Please login to save tools to your library', 'warning');
      return;
    }

    setSavingTool(tool.name);
    const isFavorite = favoriteTools.some(t => t.name === tool.name);

    try {
      let result;
      if (isFavorite) {
        result = await api.removeToolFavorite(tool.name, token);
        if (result?.success) {
          showNotification('Tool removed from your library', 'info');
        }
      } else {
        result = await api.saveToolFavorite({
          name: tool.name,
          description: tool.description,
          url: tool.url,
          domain: selectedDomain
        }, token);
        if (result?.success) {
          showNotification('Tool saved to your library! 🎉', 'success');
        }
      }

      // Check for errors in response
      if (result?.error) {
        showNotification(`Failed: ${result.error}`, 'error');
      } else {
        // Refresh favorites
        queryClient.invalidateQueries({ queryKey: ['tool-favorites'] });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showNotification('Failed to save tool. Please try again.', 'error');
    }
    setSavingTool(null);
  }, [user, token, favoriteTools, selectedDomain, queryClient]);

  const isToolFavorite = useCallback((toolName) => {
    return favoriteTools.some(t => t.name === toolName);
  }, [favoriteTools]);

  // Comparison Mode
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const toggleCompare = useCallback((toolName) => {
    setSelectedForComparison(prev => {
      if (prev.includes(toolName)) {
        return prev.filter(name => name !== toolName);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 tools
      }
      return [...prev, toolName];
    });
  }, []);

  const isSelectedForComparison = useCallback((toolName) => {
    return selectedForComparison.includes(toolName);
  }, [selectedForComparison]);

  const runComparison = async () => {
    if (selectedForComparison.length < 2) return;

    // 1. Check Cache First
    const cacheKey = `compare_${selectedForComparison.slice().sort().join('_')}`;
    const cachedResult = localStorage.getItem(cacheKey);

    if (cachedResult) {
      try {
        const parsedCache = JSON.parse(cachedResult);
        setComparisonResult(parsedCache);
        console.log('⚡ Using cached comparison result');
        return;
      } catch (err) {
        console.error('Failed to parse cached comparison:', err);
        localStorage.removeItem(cacheKey);
      }
    }

    setIsComparing(true);
    try {
      // Build a structured comparison prompt that returns tool-specific data
      const comparisonPrompt = `You are comparing AI tools: ${selectedForComparison.join(' vs ')}.

For EACH tool, provide a detailed comparison in this EXACT JSON format:
{
  "toolsComparison": [
    {
      "name": "Tool Name",
      "category": "e.g. AI Assistant, Code Editor, Design Tool",
      "pricing": "Free / Freemium / Paid ($X/month) / Enterprise",
      "url": "Official website URL",
      "keyFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
      "bestFor": "Who should use this tool and why",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "cons": ["Con 1", "Con 2"],
      "rating": 4.5,
      "popularityRank": "High / Medium / Emerging"
    }
  ],
  "recommendation": "Clear recommendation on which tool to choose based on use case",
  "quickTakeaway": "One sentence summary for quick decision making"
}

Be specific and accurate. Use real data about these actual tools. Return ONLY valid JSON.`;

      const response = await api.aiSearch(comparisonPrompt, token, "tools");
      console.log('📊 Comparison response:', response);

      // Try to extract structured comparison data
      let parsedComparison = null;

      // Look for JSON in the response
      const responseText = response?.data?.summary ||
        response?.summary ||
        JSON.stringify(response?.data) ||
        '';

      // Try to parse as JSON first
      try {
        // Check if toolsComparison is directly in the data
        if (response?.data?.toolsComparison) {
          parsedComparison = response.data;
        } else {
          // Try to find JSON in the response text
          const jsonMatch = responseText.match(/\{[\s\S]*"toolsComparison"[\s\S]*\}/);
          if (jsonMatch) {
            parsedComparison = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (parseError) {
        console.log('JSON parse failed, using fallback format');
      }

      let finalResult = null;

      // If we got structured data, use it
      if (parsedComparison?.toolsComparison) {
        finalResult = {
          type: 'structured',
          data: parsedComparison
        };
      } else {
        // Create a basic comparison structure from the tools we have
        const toolsData = tools.filter(t => selectedForComparison.includes(t.name));
        finalResult = {
          type: 'structured',
          data: {
            toolsComparison: toolsData.map(tool => ({
              name: tool.name,
              category: selectedDomain,
              pricing: 'Check official website',
              url: tool.url || '#',
              keyFeatures: [tool.description?.split('.')[0] || 'AI-powered tool'],
              bestFor: `${selectedDomain} professionals`,
              pros: ['Modern interface', 'Active development', 'Growing community'],
              cons: ['May have learning curve'],
              rating: 4.0,
              popularityRank: 'High'
            })),
            recommendation: `Both ${selectedForComparison.join(' and ')} are excellent choices. Visit their official websites using the "Try Now" buttons to explore features and find the best fit for your needs.`,
            quickTakeaway: `Compare ${selectedForComparison.join(' vs ')} based on your specific use case and budget.`
          }
        };
      }

      // 2. Save to Cache
      if (finalResult) {
        setComparisonResult(finalResult);
        localStorage.setItem(cacheKey, JSON.stringify(finalResult));
      }
    } catch (error) {
      console.error('❌ Comparison error:', error);
      // Fallback
      const toolsData = tools.filter(t => selectedForComparison.includes(t.name));
      const errorResult = {
        type: 'structured',
        data: {
          toolsComparison: toolsData.map(tool => ({
            name: tool.name,
            category: selectedDomain,
            pricing: 'Visit website',
            keyFeatures: [tool.description || 'Professional AI tool'],
            bestFor: 'Professionals seeking productivity',
            pros: ['Well-established', 'Feature-rich'],
            cons: ['Check pricing'],
            rating: 4.0,
            popularityRank: 'Popular'
          })),
          recommendation: 'Click "Try Now" on each tool to explore their features directly.',
          quickTakeaway: `Explore ${selectedForComparison.join(' and ')} to find your perfect match.`
        }
      };
      setComparisonResult(errorResult);
    }
    setIsComparing(false);
  };

  // The industry domains users can pick from
  const domains = [
    ...(user && userSkills.length > 0 ? [{ name: 'For You', icon: <User />, color: 'text-rose-600' }] : []),
    { name: 'Development', icon: <Code />, color: 'text-blue-600' },
    { name: 'Design', icon: <Palette />, color: 'text-purple-600' },
    { name: 'Marketing', icon: <Megaphone />, color: 'text-amber-600' },
    { name: 'Legal', icon: <Scale />, color: 'text-emerald-600' },
    { name: 'Health', icon: <HeartPulse />, color: 'text-red-600' },
    { name: 'Cybersecurity', icon: <ShieldCheck />, color: 'text-indigo-600' },
  ];

  // Build query based on domain or custom activeSearch
  const aiQuery = useMemo(() => {
    if (activeSearch) {
      return `List top 6 essential AI tools for ${activeSearch} in ${currentYear}. For each tool, provide: name, a brief description, and their official website URL. Format as JSON with a "tools" array containing "name", "description", and "url" fields.`;
    }
    if (selectedDomain === 'For You' && userSkills.length > 0) {
      return `Based on skills: ${userSkills.join(', ')}, list top 6 AI tools that would help someone with these skills. For each tool, provide: name, a brief description, and their official website URL. Format as JSON with a "tools" array containing "name", "description", and "url" fields.`;
    }
    return `List top 6 essential AI tools for ${selectedDomain} professionals in ${currentYear}. For each tool, provide: name, a brief description, and their official website URL. Format as JSON with a "tools" array containing "name", "description", and "url" fields.`;
  }, [selectedDomain, userSkills, currentYear, activeSearch]);

  const stableQueryKey = ['ai-tools', activeSearch || selectedDomain, userSkills.join(',')];

  // AI FETCH: Get top 6 tools with official links
  const { data: toolData, isLoading, isFetching, refetch } = useQuery({
    queryKey: stableQueryKey,
    queryFn: () => api.aiSearch(aiQuery, token, "tools"),
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    enabled: isMounted,
  });

  // CLIENT-SIDE ONLY: Seed React Query cache from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined" || !isMounted) return;
    
    const cachedKey = activeSearch ? SEARCH_CACHE_KEY : DEFAULT_CACHE_KEY;
    const cached = readCache(cachedKey);
    
    if (cached?.data && !toolData) {
      const shouldSeed = !activeSearch || cached.query === activeSearch;
      if (shouldSeed) {
        console.log("💾 [AI Tools] Seeding React Query from localStorage");
        queryClient.setQueryData(stableQueryKey, cached.data);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, activeSearch]);

  // Save to persistence
  useEffect(() => {
    if (toolData && !isFetching && toolData.source !== "persistence") {
      const cachePayload = JSON.stringify({
        data: toolData,
        query: activeSearch,
        domain: selectedDomain,
        timestamp: Date.now()
      });
      
      if (activeSearch) {
        localStorage.setItem(SEARCH_CACHE_KEY, cachePayload);
      } else {
        localStorage.setItem(DEFAULT_CACHE_KEY, cachePayload);
      }
    }
  }, [toolData, activeSearch, selectedDomain, isFetching]);

  const isFallback = toolData?.source === "fallback-engine";
  const tools = extractTools(toolData);

  // Filter tools based on search query
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;
    const query = searchQuery.toLowerCase();
    return tools.filter(tool =>
      tool.name?.toLowerCase().includes(query) ||
      tool.description?.toLowerCase().includes(query)
    );
  }, [tools, searchQuery]);

  const handleManualSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      const trimmedQuery = searchQuery.trim();
      setActiveSearch(trimmedQuery);
      setSelectedDomain(''); // clear domain selection
      localStorage.setItem("aiToolsSearchQuery", trimmedQuery);
      localStorage.removeItem("aiToolsSelectedDomain");
      setTimeout(() => refetch(), 0);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setSelectedDomain('Development');
    localStorage.removeItem("aiToolsSearchQuery");
    localStorage.setItem("aiToolsSelectedDomain", "Development");
    
    // Restore default cache if available
    const defaultCached = readCache(DEFAULT_CACHE_KEY);
    if (defaultCached?.data) {
      queryClient.setQueryData(['ai-tools', 'Development', userSkills.join(',')], defaultCached.data);
    }
    
    setTimeout(() => refetch(), 100);
  };

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-500 pb-16">
      <AnimatePresence>
        {(isMounted && (isLoading || isFetching || isComparing)) && (
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

      <div className="container mx-auto px-8 py-16 max-w-7xl animate-in fade-in duration-700">
        {/* BREADCRUMB NAVIGATION */}
        <Breadcrumb currentPage="AI Tools" currentIcon={BrainCircuit} />

        {!isMounted ? (
          <div className="space-y-16 animate-in fade-in duration-700">
            <div className="py-20 text-center relative overflow-hidden rounded-[3rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-elite)]">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent-primary)]/5 to-transparent animate-pulse" />
              <div className="relative z-10 space-y-6">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
                  <BrainCircuit size={48} className="text-[var(--accent-primary)] animate-bounce" />
                </div>
                <h3 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Connecting Neural Grid</h3>
                <p className="text-[var(--site-text-muted)] font-bold opacity-60">Synchronizing tool telemetry...</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[1, 2, 3].map(i => <ToolSkeleton key={i} />)}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-24">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm text-[var(--accent-primary)] text-[10px] font-black tracking-[0.4em] uppercase mb-10">
            <BrainCircuit size={18} className="animate-pulse" strokeWidth={2.5} /> Top AI Tools
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-[var(--site-text)] tracking-tighter mb-10 leading-[0.85]">
            Professional AI <br /> <span className="text-gradient-elite">Command Center.</span>
          </h1>

          {/* DOMAIN SELECTOR: The "Switchboard" */}
          <div className="flex flex-wrap gap-4 mt-16">
            {isFallback && (
              <div className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl animate-pulse flex items-center gap-2">
                <ShieldCheck size={14} />
                AI Fallback Mode Active
              </div>
            )}
            <div className="flex flex-wrap gap-5">
              {domains.map((domain) => (
                <button
                  key={domain.name}
                  onClick={() => {
                    setSelectedDomain(domain.name);
                    setActiveSearch('');
                    setSearchQuery('');
                    localStorage.setItem("aiToolsSelectedDomain", domain.name);
                    localStorage.removeItem("aiToolsSearchQuery");
                  }}
                  className={`flex items-center gap-4 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 border-2 btn-tactile ${selectedDomain === domain.name
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-2xl shadow-indigo-600/30 scale-105'
                    : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--site-text)] dark:text-[var(--site-text-muted)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--accent-primary)]/5 shadow-md active:scale-95 transition-all duration-300'
                    }`}
                >
                  <span className={`transition-all duration-500 ${selectedDomain === domain.name ? 'text-white scale-125' : domain.color}`}>
                    {domain.icon}
                  </span>
                  {domain.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ELITE SEARCH BAR */}
        <div className="mb-12 max-w-2xl">
          <form onSubmit={handleManualSearch} className="relative group flex items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-5 h-5 text-[var(--site-text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools by custom category or keyword..."
                className="w-full pl-14 pr-12 py-4 text-base font-bold bg-[var(--card-bg)] border-2 border-[var(--card-border)] rounded-2xl focus:border-[var(--accent-primary)]/50 focus:outline-none transition-all placeholder:text-[var(--site-text-muted)]/40 text-[var(--site-text)] shadow-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || isLoading || isFetching}
              className="px-8 py-4 bg-[var(--accent-primary)] text-white font-black rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 shadow-xl btn-tactile h-[58px]"
            >
              {isLoading || isFetching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-xs uppercase tracking-widest hidden sm:inline">Search</span>
              )}
              {!(isLoading || isFetching) && <Zap size={18} />}
            </button>
          </form>
          {activeSearch && (
            <p className="mt-3 text-sm text-[var(--site-text-muted)] font-bold">
              {isMounted ? filteredTools.length : 0} result{filteredTools.length !== 1 ? 's' : ''} for custom search "{activeSearch}"
            </p>
          )}
        </div>

        {/* TOOLS GRID: Dynamic AI results - Resilient loading state */}
        {(isLoading || (isFetching && tools.length === 0) || (!toolData && !isFallback)) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[...Array(6)].map((_, i) => (

<ToolSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredTools.map((tool, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedTool(tool);
                  setShowOpportunity(true);
                }}
                className="group relative p-12 rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-elite)] hover:shadow-[var(--shadow-elite-hover)] transition-all duration-500 hover:-translate-y-3 overflow-hidden flex flex-col cursor-pointer btn-tactile"
              >
                {/* Elite Ambient Glow */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="absolute -right-12 -top-12 p-8 text-[var(--accent-primary)] opacity-0 group-hover:opacity-10 group-hover:scale-150 transition-all duration-1000">
                  <Sparkles size={160} />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-4 mb-8 sm:mb-10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Comparison Checkbox */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCompare(tool.name); }}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center border-2 transition-all cursor-pointer shadow-md ${isSelectedForComparison(tool.name)
                          ? 'bg-indigo-600 border-indigo-600 text-white scale-110'
                          : 'bg-[var(--card-bg)] border-indigo-400/50 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                          }`}
                        title="Click to select for comparison (select 2-3 tools)"
                      >
                        {isSelectedForComparison(tool.name) ? (
                          <Check size={14} strokeWidth={3} />
                        ) : (
                          <span className="text-[10px] font-black text-indigo-400/70">+</span>
                        )}
                      </button>
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-[10deg] transition-all duration-500 border border-indigo-500/20 shadow-xl shadow-indigo-600/5">
                        <Sparkles size={20} className="sm:hidden" strokeWidth={2.5} />
                        <Sparkles size={28} className="hidden sm:block" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Save to Library Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(tool); }}
                        disabled={savingTool === tool.name}
                        className={`
                          w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 border btn-tactile
                          ${isToolFavorite(tool.name)
                            ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-2xl shadow-indigo-600/30 ring-4 ring-indigo-500/10"
                            : "bg-[var(--card-bg)] text-[var(--site-text-muted)] border-[var(--card-border)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--site-text)]/5 shadow-md"
                          }
                          ${savingTool === tool.name ? "animate-pulse" : ""}
                        `}
                        title={isToolFavorite(tool.name) ? 'Saved to Library' : 'Save to Library'}
                      >
                        {savingTool === tool.name ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : isToolFavorite(tool.name) ? (
                          <BookmarkCheck size={20} className="sm:hidden" strokeWidth={2.5} />
                        ) : (
                          <BookmarkPlus size={20} className="sm:hidden" strokeWidth={2.5} />
                        )}
                        {savingTool !== tool.name && isToolFavorite(tool.name) && <BookmarkCheck size={24} className="hidden sm:block" strokeWidth={2.5} />}
                        {savingTool !== tool.name && !isToolFavorite(tool.name) && <BookmarkPlus size={24} className="hidden sm:block" strokeWidth={2.5} />}
                      </button>
                      {tool.url && (
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 sm:w-auto sm:p-3 rounded-xl bg-[var(--site-text)]/5 text-[var(--site-text-muted)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-all flex items-center justify-center sm:gap-2 border border-[var(--card-border)] group/link"
                          title="Official Website"
                        >
                          <Globe size={18} strokeWidth={2.5} className="group-hover/link:rotate-12 transition-transform" />
                        </a>
                      )}
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-[var(--site-text)] mb-6 tracking-tight leading-tight group-hover:text-[var(--accent-primary)] transition-colors duration-500">
                    {tool.name}
                  </h3>
                  <p className="text-[var(--site-text-muted)] font-bold leading-relaxed mb-10 opacity-70 group-hover:opacity-100 transition-opacity">
                    {tool.description}
                  </p>

                  <div className="mt-auto pt-8 border-t border-[var(--card-border)]/50 flex items-center justify-between gap-4">
                    <button
                      onClick={() => setSelectedTool(tool)}
                      className="flex items-center gap-3 text-[var(--accent-primary)] font-black text-[10px] uppercase tracking-[0.2em] group/btn transition-all duration-500 hover:gap-5 bg-transparent outline-none cursor-pointer"
                    >
                      Learn More <ArrowRight size={16} strokeWidth={3} className="transition-transform group-hover/btn:translate-x-1" />
                    </button>

                    {tool.url && (
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
                      >
                        <Globe size={14} /> Try Now
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tool Action Modal Integration */}
        {selectedTool && (
          <ToolActionModal
            tool={selectedTool}
            onClose={() => setSelectedTool(null)}
          />
        )}

        {/* Comparison Result Panel - Professional Card-Based UI */}
        <AnimatePresence>
        {comparisonResult && comparisonResult.type === 'structured' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[10001] flex p-4 sm:px-6 md:px-8 overflow-hidden"
            onClick={() => { setComparisonResult(null); setSelectedForComparison([]); }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl" />

            {/* Layout Wrapper to center relative to sidebar */}
            <div className="relative w-full h-full flex items-start justify-center max-lg:pl-0 lg:pl-[var(--sidebar-offset,0px)] pt-24 pb-6 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500">
              {/* Modal Container - Centered relative to available content area */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-4xl h-full max-h-[85vh] flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto transition-all"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Header */}
              <div className="flex justify-between items-center p-3 sm:p-4 md:p-5 border-b border-[var(--card-border)] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <GitCompareArrows size={16} className="sm:hidden" />
                    <GitCompareArrows size={18} className="hidden sm:block" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base md:text-lg font-black text-[var(--site-text)] tracking-tight">AI Tools Comparison</h4>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-wider">{selectedForComparison.length} Tools Analyzed</p>
                  </div>
                </div>
                <button
                  onClick={() => { setComparisonResult(null); setSelectedForComparison([]); }}
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-[var(--site-text)]/5 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer group btn-tactile border border-[var(--card-border)]"
                  aria-label="Close comparison"
                >
                  <X size={14} className="sm:hidden text-[var(--site-text-muted)] group-hover:text-rose-500 transition-colors" />
                  <X size={16} className="hidden sm:block text-[var(--site-text-muted)] group-hover:text-rose-500 transition-colors" />
                </button>
              </div>

              {/* Content with elegant scrollbar */}
              <div className="p-3 sm:p-4 md:p-5 overflow-y-auto max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh] comparison-scroll">
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
                        {/* Rating */}
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
                          <Zap size={14} className="text-indigo-500" />
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
                            <Target size={14} className="text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Best For</span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-[var(--site-text)]">{tool.bestFor}</p>
                        </div>
                      )}

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Pros */}
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <div className="flex items-center gap-1.5 mb-2">
                            <ThumbsUp size={12} className="text-emerald-500" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Pros</span>
                          </div>
                          <ul className="space-y-1">
                            {(tool.pros || []).slice(0, 3).map((pro, pIndex) => (
                              <li key={pIndex} className="text-[10px] sm:text-xs text-[var(--site-text-muted)] font-medium leading-snug">
                                • {pro}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Cons */}
                        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                          <div className="flex items-center gap-1.5 mb-2">
                            <ThumbsDown size={12} className="text-rose-500" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Cons</span>
                          </div>
                          <ul className="space-y-1">
                            {(tool.cons || []).slice(0, 2).map((con, cIndex) => (
                              <li key={cIndex} className="text-[10px] sm:text-xs text-[var(--site-text-muted)] font-medium leading-snug">
                                • {con}
                              </li>
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

                {/* Recommendation Section */}
                {comparisonResult.data.recommendation && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
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
        {/* Scrollbar styles moved to globals.css to prevent hydration mismatch */}

        {/* Floating Compare Button - Positioned to clear sidebar and AI Companion */}
        {selectedForComparison.length >= 2 && !comparisonResult && (
          <button
            onClick={runComparison}
            disabled={isComparing}
            className="fixed bottom-10 left-8 lg:left-[calc(18rem+3rem)] px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center gap-4 font-black uppercase tracking-[0.2em] text-[11px] hover:scale-105 active:scale-95 transition-all z-[10001] cursor-pointer disabled:opacity-50 border-2 border-white/20 backdrop-blur-md"
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
          </>
        )}
      </div>

      {/* Notification Modal */}
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
