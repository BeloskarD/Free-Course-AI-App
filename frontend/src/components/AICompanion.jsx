'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, X, Send, Trash2, Loader2, MessageCircle, GraduationCap, HelpCircle, Baby, Copy, Check, BookOpen, Target, Trophy, Briefcase, BarChart3, Wrench, ArrowRight, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

// Generate unique session ID for guests
const getSessionId = () => {
    if (typeof window === 'undefined') return null;
    let sessionId = localStorage.getItem('companion-session-id');
    if (!sessionId) {
        sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('companion-session-id', sessionId);
    }
    return sessionId;
};

// Mode configurations
const MODES = [
    { id: 'chat', label: 'Chat', icon: MessageCircle, description: 'General conversation' },
    { id: 'tutor', label: 'Tutor', icon: GraduationCap, description: 'Step-by-step learning' },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Test your knowledge' },
    { id: 'eli5', label: 'ELI5', icon: Baby, description: 'Simple explanations' },
];

// Interactive category chips for quick navigation
const CATEGORY_CHIPS = [
    { id: 'learning-path', label: 'My Learning Path', icon: Target, prompt: 'Show me my current learning path and what I should focus on next' },
    { id: 'courses', label: 'Course Help', icon: BookOpen, prompt: 'Help me find the right course for my learning goals' },
    { id: 'skills', label: 'Skill Analysis', icon: BarChart3, prompt: 'Analyze my current skills and suggest areas for improvement' },
    { id: 'career', label: 'Career Guidance', icon: Briefcase, prompt: 'Give me career advice based on my learning progress' },
    { id: 'achievements', label: 'My Progress', icon: Trophy, prompt: 'Tell me about my learning achievements and progress so far' },
    { id: 'tech-help', label: 'Tech Support', icon: Wrench, prompt: 'I need help with a technical issue on the platform' },
];

// Default quick actions (fallback)
const DEFAULT_QUICK_ACTIONS = [
    { text: "What should I learn next?", icon: "🎯" },
    { text: "Explain a concept simply", icon: "💡" },
    { text: "Quiz me on a topic", icon: "📝" },
    { text: "I'm feeling stuck today", icon: "🤔" }, // 🧠 EQ-AI: Wellbeing check-in
];

// Context-aware quick actions based on current page
const CONTEXTUAL_ACTIONS = {
    '/courses': [
        { text: "Find a React course", icon: "⚛️" },
        { text: "Show free courses only", icon: "💰" },
        { text: "Compare Python vs JavaScript courses", icon: "⚖️" },
        { text: "What's trending in cloud computing?", icon: "☁️" },
    ],
    '/momentum': [
        { text: "Explain my learning stats", icon: "📊" },
        { text: "What should I practice today?", icon: "🎯" },
        { text: "How can I improve my streak?", icon: "🔥" },
        { text: "Analyze my skill gaps", icon: "📈" },
    ],
    '/skill-analysis': [
        { text: "What skills am I missing?", icon: "🔍" },
        { text: "Suggest a learning path for me", icon: "🛤️" },
        { text: "How do I become job-ready?", icon: "💼" },
        { text: "What certifications should I get?", icon: "🏆" },
    ],
    '/ai-intelligence': [
        { text: "Refine my search results", icon: "🔄" },
        { text: "Explain this roadmap step", icon: "🗺️" },
        { text: "Show me alternative courses", icon: "📚" },
        { text: "What prerequisites do I need?", icon: "📋" },
    ],
    '/ai-tools': [
        { text: "Recommend AI tools for coding", icon: "🤖" },
        { text: "Compare ChatGPT vs Claude", icon: "⚔️" },
        { text: "Best tools for productivity", icon: "⚡" },
        { text: "Free AI tools for students", icon: "🎓" },
    ],
    '/youtube': [
        { text: "Best YouTube channels for Python", icon: "🐍" },
        { text: "Find React tutorial videos", icon: "📺" },
        { text: "Short tutorials under 20 min", icon: "⏱️" },
        { text: "Project-based learning videos", icon: "🛠️" },
    ],
    '/dashboard': [
        { text: "What's in my weekly learning plan?", icon: "📅" },
        { text: "Help me complete today's tasks", icon: "✅" },
        { text: "Explain my skill focus areas", icon: "🎯" },
        { text: "How can I improve my learning streak?", icon: "🔥" },
    ],
    // Mission pages - NEW
    '/mission-home': [
        { text: "What's my current mission about?", icon: "🎯" },
        { text: "Help me with this stage", icon: "💡" },
        { text: "I'm stuck on my mission", icon: "🤔" },
        { text: "What should I learn next?", icon: "🚀" },
    ],
    '/missions': [
        { text: "Recommend a new mission for me", icon: "🎯" },
        { text: "What skills can I build with missions?", icon: "📈" },
        { text: "How do missions help my growth?", icon: "🌱" },
        { text: "Show my completed achievements", icon: "🏆" },
    ],
    '/growth': [
        { text: "Explain my learning progress", icon: "📊" },
        { text: "What should I focus on next?", icon: "🎯" },
        { text: "How am I doing this week?", icon: "📈" },
        { text: "Suggest ways to improve", icon: "💡" },
    ],
    // Career pages - NEW
    '/career-acceleration': [
        { text: "View my career roadmap", icon: "🛤️" },
        { text: "Analyze my career gaps", icon: "🔍" },
        { text: "How do I reach my target role?", icon: "💼" },
        { text: "Show my hiring path", icon: "🤝" },
    ],
    '/opportunity-radar': [
        { text: "Explain these hiring signals", icon: "📡" },
        { text: "Find trending skill clusters", icon: "🔥" },
        { text: "How do I qualify for these roles?", icon: "✅" },
        { text: "Save interesting opportunities", icon: "🔖" },
    ],
};

// Get page-friendly name for context indicator
const getPageName = (pathname) => {
    const names = {
        '/': 'Home',
        '/courses': 'Course Library',
        '/momentum': 'Growth Momentum',
        '/skill-analysis': 'Skill Analysis',
        '/ai-intelligence': 'AI Search',
        '/ai-tools': 'AI Tools',
        '/youtube': 'Expert Mentorship',
        '/dashboard': 'Learning Brain',
        '/mission-home': 'Mission Home',
        '/missions': 'My Missions',
        '/growth': 'Growth Story',
        '/wellbeing': 'Wellbeing',
        '/career-acceleration': 'Career Hub',
        '/opportunity-radar': 'Opportunity Radar',
    };
    // Handle dynamic routes like /missions/[id]
    if (pathname?.startsWith('/missions/')) {
        return 'Mission Details';
    }
    return names[pathname] || 'Zeeklect';
};

// Format timestamp for messages
const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Visual Progress Card Component for Chat
const ProgressCard = ({ momentum, favorites, activeMissions, onNavigate }) => {
    const stats = [
        { label: 'Total XP', value: momentum?.totalExp || 0, icon: '✨', color: 'text-amber-500' },
        { label: 'Active Missions', value: activeMissions?.length || 0, icon: '🎯', color: 'text-rose-500' },
        { label: 'Current Streak', value: `${momentum?.currentStreak || 0} days`, icon: '🔥', color: 'text-orange-500' },
        { label: 'Courses Completed', value: momentum?.totalCourses || 0, icon: '🎓', color: 'text-indigo-500' },
    ];

    return (
        <div className="my-3 overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-600/10 shadow-lg shadow-indigo-500/5">
            <div className="bg-indigo-500/10 px-4 py-3 border-b border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <BarChart3 size={18} className="text-white" />
                    </div>
                    <span className="font-black text-sm uppercase tracking-wider text-[var(--site-text)]">Learning Stats</span>
                </div>
                <Trophy size={16} className="text-amber-500" />
            </div>

            <div className="p-4 grid grid-cols-2 gap-3">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-[var(--site-bg)]/50 backdrop-blur-sm p-3 rounded-2xl border border-[var(--site-text)]/5 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm">{stat.icon}</span>
                            <span className="text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-tight">{stat.label}</span>
                        </div>
                        <div className={`text-sm font-black ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => onNavigate('/momentum')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
                View Full Dashboard <ArrowRight size={12} />
            </button>
        </div>
    );
};

export default function AICompanion() {
    const { user, token } = useAuth();
    const pathname = usePathname(); // Get current page path
    const router = useRouter(); // Use Next.js router
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentMode, setCurrentMode] = useState('chat');
    const [messagesRemaining, setMessagesRemaining] = useState(null);
    const [error, setError] = useState(null);
    const [showModeSelector, setShowModeSelector] = useState(false);
    const [copiedMsgId, setCopiedMsgId] = useState(null); // For copy feedback
    const [showCategories, setShowCategories] = useState(true); // Show category chips
    const [isListening, setIsListening] = useState(false); // Voice input state
    const [emotionalSupport, setEmotionalSupport] = useState(null); // 🧠 EQ-AI: Emotional support data
    const [isReturningUser, setIsReturningUser] = useState(false); // 🤗 Proactive AI Check-in
    const [daysSinceLastVisit, setDaysSinceLastVisit] = useState(0);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const speechRecognitionRef = useRef(null); // Web Speech API ref
    const voiceTimeoutRef = useRef(null); // Ref for watchdog timer
    const sessionId = getSessionId();

    // Navigation handler for ProgressCard
    const handleNavigate = (path) => {
        router.push(path);
        setIsOpen(false); // Close AI companion after navigation
    };

    // Get context-aware quick actions based on current page
    const contextualActions = CONTEXTUAL_ACTIONS[pathname] || DEFAULT_QUICK_ACTIONS;
    const currentPageName = getPageName(pathname);

    // Fetch user's favorites for context (only if logged in)
    const { data: userFavorites } = useQuery({
        queryKey: ['favorites'],
        queryFn: () => api.getFavorites(token),
        enabled: !!user && !!token,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Fetch user's momentum data for skills context
    const { data: momentumData } = useQuery({
        queryKey: ['momentum', user?.id],
        queryFn: () => api.getMomentumData(token),
        enabled: !!user && !!token,
        staleTime: 1000 * 60 * 5,
    });

    // 🧠 Fetch learner profile for Learning Brain context (weekly plan, goals, skills)
    const { data: learnerProfileData } = useQuery({
        queryKey: ['learner-profile'],
        queryFn: () => api.getLearnerProfile(token),
        enabled: !!user && !!token,
        staleTime: 1000 * 60 * 5,
    });

    // 🚀 Fetch Career Data (Radar matches + saved signals)
    const { data: savedOpps } = useQuery({
        queryKey: ['saved-opportunities'],
        queryFn: () => api.getSavedOpportunities(token),
        enabled: !!user && !!token,
        staleTime: 1000 * 60 * 5,
    });

    const { data: careerRadar } = useQuery({
        queryKey: ['opportunity-radar', user?.id],
        queryFn: () => api.getOpportunityRadar(token, 10),
        enabled: !!user && !!token,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch active missions for context
    const { data: activeMissionsResponse } = useQuery({
        queryKey: ['active-missions'],
        queryFn: () => api.getActiveMissions(token),
        enabled: !!user && !!token,
        staleTime: 1000 * 60 * 5,
    });

    const activeMissions = activeMissionsResponse?.data || [];

    // 🤗 Proactive AI Check-in: Detect returning learners (3+ days away)
    useEffect(() => {
        if (!user || !isOpen) return;

        // Check localStorage for last companion visit
        const LAST_VISIT_KEY = 'companion-last-visit';
        const WELCOME_SHOWN_KEY = 'companion-welcome-shown-today';
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        const welcomeShownToday = localStorage.getItem(WELCOME_SHOWN_KEY);
        const today = new Date().toDateString();

        // Don't show if already shown today
        if (welcomeShownToday === today) {
            setIsReturningUser(false);
            return;
        }

        if (lastVisit) {
            const lastDate = new Date(lastVisit);
            const now = new Date();
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays >= 3) {
                setIsReturningUser(true);
                setDaysSinceLastVisit(diffDays);
                console.log(`🤗 Welcome back! User was away for ${diffDays} days.`);
            }
        }

        // Update last visit timestamp
        localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
    }, [user, isOpen]);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position and body styles
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';
        } else {
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }

        // Cleanup on unmount
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Load history on mount
    useEffect(() => {
        if (isOpen && sessionId) {
            loadHistory();
        }
    }, [isOpen, sessionId]);

    const loadHistory = async () => {
        try {
            const response = await api.getCompanionHistory(sessionId, token);
            if (response.success) {
                setMessages(response.messages || []);
                setCurrentMode(response.currentMode || 'chat');
                setMessagesRemaining(response.messagesRemaining);
            }
        } catch (err) {
            console.log('📭 No previous history');
        }
    };

    // Voice Input Toggle - "Wise" Robust Implementation
    const toggleVoiceInput = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Voice input not supported in this browser.');
            return;
        }

        // Helper to clear watchdog timer
        const clearVoiceTimeout = () => {
            if (voiceTimeoutRef.current) {
                clearTimeout(voiceTimeoutRef.current);
                voiceTimeoutRef.current = null;
            }
        };

        if (isListening) {
            // Stop listening
            if (speechRecognitionRef.current) {
                speechRecognitionRef.current.stop();
            }
            clearVoiceTimeout();
            setIsListening(false);
            return;
        }

        // Start listening
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        speechRecognitionRef.current = recognition;

        // Implementation of 10s Watchdog Timer
        const startWatchdog = () => {
            clearVoiceTimeout();
            voiceTimeoutRef.current = setTimeout(() => {
                if (isListening || speechRecognitionRef.current) {
                    console.warn('Voice input timeout: No speech detected in 10s');
                    recognition.stop();
                    setError('Still listening? I didn\'t hear anything. Let\'s try typing or check your mic!');
                    setIsListening(false);
                }
            }, 10000);
        };

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            setInputValue('');
            startWatchdog(); // Start the timer
        };

        recognition.onresult = (event) => {
            clearVoiceTimeout(); // Reset timer on every result
            startWatchdog();

            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setInputValue(transcript);
        };

        recognition.onerror = (event) => {
            clearVoiceTimeout();

            // "Wise" Error Mapping to prevent user irritation
            const errorMap = {
                'network': 'My speech service is temporarily unreachable. Please check your connection or try typing your message!',
                'not-allowed': 'Microphone access is blocked. Please enable it in your browser settings to use voice!',
                'no-speech': 'I didn\'t catch that. Could you try again or type it out?',
                'service-not-allowed': 'The speech service is currently limited. Try again in a moment or use text input!',
                'audio-capture': 'I couldn\'t find a microphone. Please make sure one is connected and working!',
                'aborted': null // Handle 'aborted' silently as it's often a manual stop
            };

            const errorMessage = errorMap[event.error];

            // Only log and show error if it's not a silent one (like aborted)
            if (errorMessage) {
                // Use console.warn instead of console.error to prevent Next.js error overlay in dev mode
                console.warn('Speech recognition error:', event.error);
                setError(errorMessage);
            } else if (event.error !== 'aborted') {
                // For unmapped errors, provide a generic fallback but don't crash
                console.warn('Unhandled speech recognition error:', event.error);
                setError(`Voice input is taking a break (${event.error}). Please type your message!`);
            }

            setIsListening(false);
        };

        recognition.onend = () => {
            clearVoiceTimeout();
            setIsListening(false);
        };

        try {
            recognition.start();
        } catch (err) {
            clearVoiceTimeout();
            console.warn('Failed to start speech recognition:', err);
            setError('Voice input is taking a break. Please type your message!');
            setIsListening(false);
        }
    }, [isListening]);

    const sendMessage = async (messageText = inputValue) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: messageText.trim(),
            mode: currentMode,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            // Extract course titles from favorites for AI context
            const favoriteCourseTitles = (userFavorites || [])
                .slice(0, 5)
                .map(course => course.title || course.name)
                .filter(Boolean);

            // Extract skills from momentum data
            const userSkills = (momentumData?.data?.skills || [])
                .slice(0, 5)
                .map(skill => skill.name || skill)
                .filter(Boolean);

            // 🧠 Extract Learning Brain data (weekly plan, goals, skills to learn)
            const learnerProfile = learnerProfileData?.profile;
            const weeklyPlan = learnerProfile?.currentPlan;
            const learningGoals = learnerProfile?.goals;
            const skillsProgress = learnerProfile?.skills || [];

            // Build weekly plan tasks summary
            const weeklyTasks = (weeklyPlan?.tasks || []).map(task => ({
                title: task.title,
                type: task.type,
                status: task.status,
                estimatedMinutes: task.estimatedMinutes,
                skill: task.skill
            }));

            // Build rich context for AI
            const context = {
                favorites: favoriteCourseTitles,
                skills: userSkills,
                recentSearches: [],
                // 🚀 Career Context
                career: {
                    targetRole: learnerProfile?.goals?.targetRole || 'Not set',
                    careerGaps: learnerProfile?.career?.gapSkills || [],
                    savedOpportunities: (savedOpps?.data || []).slice(0, 3).map(o => ({
                        title: o.signal?.title,
                        source: o.signal?.source,
                    })),
                    radarMatches: (careerRadar?.data || []).slice(0, 3).map(o => ({
                        title: o.signal?.title,
                        matchScore: o.matchScore,
                    }))
                },
                // 🧠 Learning Brain Context
                learningBrain: {
                    hasWeeklyPlan: !!weeklyPlan,
                    weeklyTasks: weeklyTasks.slice(0, 10), // Top 10 tasks
                    completedTasks: weeklyTasks.filter(t => t.status === 'completed').length,
                    pendingTasks: weeklyTasks.filter(t => t.status === 'pending').length,
                    inProgressTasks: weeklyTasks.filter(t => t.status === 'in_progress').length,
                    goals: learningGoals ? {
                        primaryGoal: learningGoals.primaryGoal,
                        targetRole: learningGoals.targetRole,
                        weeklyHours: learningGoals.weeklyHours,
                        preferredStyle: learningGoals.preferredStyle,
                        experience: learningGoals.experience,
                        isOnboarded: learningGoals.isOnboarded
                    } : null,
                    topSkillsToLearn: skillsProgress.slice(0, 5).map(s => ({
                        name: s.name,
                        level: s.level,
                        progress: s.progress
                    }))
                }
            };

            const response = await api.sendCompanionMessage(
                messageText.trim(),
                currentMode,
                context,
                sessionId,
                token
            );

            if (response.success) {
                const aiMessage = {
                    role: 'assistant',
                    content: response.response,
                    mode: response.mode,
                    timestamp: new Date().toISOString(),
                    emotionalSupport: response.emotionalSupport, // 🧠 EQ-AI: Attach emotional data to message
                };
                setMessages(prev => [...prev, aiMessage]);
                setMessagesRemaining(response.messagesRemaining);

                // 🧠 EQ-AI: Store emotional support for quick actions
                if (response.emotionalSupport) {
                    setEmotionalSupport(response.emotionalSupport);
                } else {
                    setEmotionalSupport(null);
                }

                if (response.newBadges && response.newBadges.length > 0) {
                    const badge = response.newBadges[0]; // Show first new badge
                    // You might want to implement a proper toast/notification system here
                    // For now, let's inject a special "celebration" message from the system
                    const celebrationMsg = {
                        role: 'assistant',
                        content: `🎉 **ACHIEVEMENT UNLOCKED!** 🎉\n\nYou've earned the **${badge.name}** badge!\n\n*${badge.description}*`,
                        mode: 'chat',
                        timestamp: new Date().toISOString()
                    };
                    setMessages(prev => [...prev, celebrationMsg]);
                }
            } else if (response.limitReached) {
                setError('Daily limit reached! Sign in for unlimited access.');
            } else {
                setError(response.error || 'Failed to get response');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
            console.error('Companion error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeChange = async (newMode) => {
        setCurrentMode(newMode);
        setShowModeSelector(false);

        try {
            await api.setCompanionMode(newMode, sessionId, token);
        } catch (err) {
            console.error('Mode change error:', err);
        }
    };

    const clearChat = async () => {
        try {
            await api.clearCompanionHistory(sessionId, token);
            setMessages([]);
            setError(null);
            setShowCategories(true); // Reset to show categories
            setEmotionalSupport(null); // 🧠 Reset emotional state when chat is cleared
        } catch (err) {
            console.error('Clear error:', err);
        }
    };

    // Copy message to clipboard
    const copyMessage = async (content, msgId) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMsgId(msgId);
            setTimeout(() => setCopiedMsgId(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    // Handle category chip click
    const handleCategoryClick = (chip) => {
        setShowCategories(false);
        sendMessage(chip.prompt);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const currentModeConfig = MODES.find(m => m.id === currentMode);

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-[9998] w-14 h-14 md:w-16 md:h-16 rounded-full 
          bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 
          text-white shadow-2xl shadow-indigo-500/30 
          flex items-center justify-center cursor-pointer
          hover:scale-110 hover:shadow-indigo-500/50 
          active:scale-95 transition-all duration-300 ease-out
          ${isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'}`}
                aria-label="Open AI Companion"
            >
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 animate-pulse" />
                {/* Pulse ring effect */}
                <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping opacity-75" />
            </button>

            {/* Chat Modal */}
            <div className={`fixed inset-0 z-[9999] transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />

                {/* Chat Container - Floating modal style with margins on all devices */}
                <div className={`absolute 
                  inset-3 top-24
                  sm:inset-auto sm:right-6 sm:bottom-6 sm:top-auto sm:left-auto
                  w-auto sm:w-[420px] md:w-[440px]
                  max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-120px)]
                  bg-[var(--card-bg)] backdrop-blur-2xl border border-[var(--card-border)]
                  rounded-3xl
                  shadow-[0_32px_128px_-16px_rgba(0,0,0,0.4)]
                  flex flex-col overflow-hidden
                  transition-all duration-500 ease-out
                  ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
                >
                    {/* Header - Elite Glassmorphism */}
                    <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--card-border)]/50 bg-gradient-to-r from-indigo-500/[0.03] to-purple-500/[0.03] backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            {/* 🧠 EQ-AI: Dynamic avatar with emotional state indicator */}
                            <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-white/10 transition-all duration-300
                                ${emotionalSupport?.emotion === 'frustration' ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20' : ''}
                                ${emotionalSupport?.emotion === 'confusion' ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/20' : ''}
                                ${emotionalSupport?.emotion === 'overwhelm' ? 'bg-gradient-to-br from-teal-500 to-green-600 shadow-teal-500/20' : ''}
                                ${emotionalSupport?.emotion === 'celebration' ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-yellow-500/20' : ''}
                                ${emotionalSupport?.emotion === 'loneliness' ? 'bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/20' : ''}
                                ${emotionalSupport?.emotion === 'encouragement_needed' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20' : ''}
                                ${!emotionalSupport ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20' : ''}
                            `}>
                                <Sparkles className="w-5 h-5 text-white" />
                                {/* Emotional state emoji indicator */}
                                {emotionalSupport && (
                                    <span className="absolute -top-1 -right-1 text-xs animate-bounce" style={{ animationDuration: '2s' }}>
                                        {emotionalSupport.emotion === 'frustration' && '💪'}
                                        {emotionalSupport.emotion === 'confusion' && '💡'}
                                        {emotionalSupport.emotion === 'overwhelm' && '🧘'}
                                        {emotionalSupport.emotion === 'celebration' && '🎉'}
                                        {emotionalSupport.emotion === 'loneliness' && '🤝'}
                                        {emotionalSupport.emotion === 'encouragement_needed' && '✨'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-black text-[var(--site-text)] text-sm tracking-tight">
                                    {emotionalSupport ? (
                                        <>
                                            {emotionalSupport.emotion === 'frustration' && 'Here to Help 💪'}
                                            {emotionalSupport.emotion === 'confusion' && 'Let me Clarify 💡'}
                                            {emotionalSupport.emotion === 'overwhelm' && 'Take it Easy 🧘'}
                                            {emotionalSupport.emotion === 'celebration' && 'Celebrating You! 🎉'}
                                            {emotionalSupport.emotion === 'loneliness' && "I'm Here 🤝"}
                                            {emotionalSupport.emotion === 'encouragement_needed' && 'Welcome Back! ✨'}
                                        </>
                                    ) : 'AI Companion'}
                                </h3>
                                <button
                                    onClick={() => setShowModeSelector(!showModeSelector)}
                                    className="text-[10px] text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5 cursor-pointer font-bold uppercase tracking-wider"
                                >
                                    {currentModeConfig?.icon && <currentModeConfig.icon className="w-3 h-3" />}
                                    {currentModeConfig?.label} Mode
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={clearChat}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--site-text-muted)] active:scale-75 transition-transform duration-150 cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
                                title="Clear conversation"
                                aria-label="Clear chat history"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--site-text-muted)] hover:text-[var(--site-text)] hover:bg-[var(--site-text)]/5 active:scale-90 transition-all cursor-pointer"
                                aria-label="Close AI Companion"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Mode Selector Dropdown */}
                    {showModeSelector && (
                        <div className="absolute top-20 left-6 right-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl z-10 overflow-hidden">
                            {MODES.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => handleModeChange(mode.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent-primary)]/10 transition-colors cursor-pointer
                    ${currentMode === mode.id ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--site-text)]'}`}
                                >
                                    <mode.icon className="w-5 h-5" />
                                    <div className="text-left">
                                        <div className="font-semibold text-sm">{mode.label}</div>
                                        <div className="text-xs text-[var(--site-text-muted)]">{mode.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 premium-scroll">


                        {/* Welcome message */}
                        {messages.length === 0 && (
                            <div className="text-center py-6">
                                {/* 🤗 Proactive AI Check-in: Welcome Back Message */}
                                {isReturningUser && user ? (
                                    <div className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 animate-in fade-in slide-in-from-top duration-500">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                                            <span className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🎉</span>
                                        </div>
                                        <h4 className="font-black text-[var(--site-text)] mb-2 text-lg">
                                            Welcome back, {user.name?.split(' ')[0] || 'friend'}! 🌟
                                        </h4>
                                        <p className="text-sm text-[var(--site-text-muted)] mb-4 max-w-[280px] mx-auto">
                                            {daysSinceLastVisit >= 7
                                                ? `It's been ${daysSinceLastVisit} days! I missed you. Ready to ease back in?`
                                                : `I noticed you took a ${daysSinceLastVisit}-day break. Smart move! Ready to continue?`
                                            }
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsReturningUser(false);
                                                    localStorage.setItem('companion-welcome-shown-today', new Date().toDateString());
                                                    sendMessage('I want to ease back in with a lighter workload today');
                                                }}
                                                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                                            >
                                                🎯 Ease me back in
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsReturningUser(false);
                                                    localStorage.setItem('companion-welcome-shown-today', new Date().toDateString());
                                                    sendMessage('Show me where I left off and what I should focus on next');
                                                }}
                                                className="px-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--site-text-muted)] text-xs font-bold hover:text-[var(--site-text)] hover:border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                                            >
                                                📍 Pick up where I left off
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsReturningUser(false);
                                                localStorage.setItem('companion-welcome-shown-today', new Date().toDateString());
                                            }}
                                            className="mt-3 text-xs text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all cursor-pointer"
                                        >
                                            Skip for now
                                        </button>
                                    </div>
                                ) : (
                                    /* Normal Welcome */
                                    <>
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-3">
                                            <Sparkles className="w-7 h-7 text-[var(--accent-primary)]" />
                                        </div>

                                        {/* Personalized Welcome */}
                                        <h4 className="font-bold text-[var(--site-text)] mb-1 text-lg">
                                            {user ? `Hey ${user.name?.split(' ')[0] || 'there'}! 👋` : 'Hi there! 👋'}
                                        </h4>
                                        <p className="text-sm text-[var(--site-text-muted)] mb-5 max-w-[280px] mx-auto">
                                            {user
                                                ? "Ready to continue your learning journey? I'm here to help!"
                                                : "I'm your AI learning companion. Ask me anything!"
                                            }
                                        </p>
                                    </>
                                )}

                                {/* Category Chips */}
                                {showCategories && (
                                    <div className="mb-5">
                                        <p className="text-xs text-[var(--site-text-muted)] mb-3 uppercase tracking-wide font-semibold">
                                            Quick Categories
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {CATEGORY_CHIPS.slice(0, 6).map((chip) => (
                                                <button
                                                    key={chip.id}
                                                    onClick={() => handleCategoryClick(chip)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                                                        bg-[var(--card-border)]/50 hover:bg-[var(--accent-primary)]/10 
                                                        text-xs text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] 
                                                        transition-all cursor-pointer border border-transparent hover:border-[var(--accent-primary)]/20"
                                                >
                                                    <chip.icon className="w-3.5 h-3.5" />
                                                    {chip.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Context-Aware Quick Actions */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <p className="text-xs text-[var(--site-text-muted)] uppercase tracking-wide font-semibold">
                                            {CONTEXTUAL_ACTIONS[pathname] ? `${currentPageName} Suggestions` : 'Try these'}
                                        </p>
                                        {CONTEXTUAL_ACTIONS[pathname] && (
                                            <span className="px-2 py-0.5 text-[9px] font-bold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full">
                                                Context
                                            </span>
                                        )}
                                    </div>
                                    {contextualActions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setShowCategories(false); sendMessage(action.text); }}
                                            className="block w-full text-left px-4 py-2.5 rounded-xl bg-[var(--card-border)]/50 hover:bg-[var(--accent-primary)]/10 text-sm text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                                        >
                                            <span className="mr-2">{action.icon}</span>
                                            {action.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Message bubbles */}
                        {messages.map((msg, idx) => {
                            const statsMarker = '[STATS_CARD]';
                            const hasStatsCard = msg.content.toUpperCase().includes(statsMarker);
                            // Create clean content by removing markers (case-insensitive)
                            let cleanContent = msg.content.replace(new RegExp('\\' + statsMarker, 'gi'), '');
                            cleanContent = cleanContent.replace(/\[NAVIGATE:(.*?)\]/gi, '').trim();

                            return (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                                >
                                    <div className="flex flex-col max-w-[85%]">
                                        <div
                                            className={`px-4 py-3 text-sm leading-relaxed relative
                                                ${msg.role === 'user'
                                                    ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-[1.5rem] rounded-br-lg shadow-xl shadow-indigo-500/15'
                                                    : 'bg-[var(--card-bg)] text-[var(--site-text)] border border-[var(--card-border)] rounded-[1.5rem] rounded-bl-lg shadow-lg shadow-black/5'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap">{cleanContent || (hasStatsCard ? "Here are your learning stats:" : "")}</p>

                                            {/* Render Progress Card if marker present */}
                                            {hasStatsCard && (
                                                <ProgressCard
                                                    momentum={momentumData?.data}
                                                    favorites={userFavorites}
                                                    activeMissions={activeMissions}
                                                    onNavigate={handleNavigate}
                                                />
                                            )}

                                            {/* Render Navigation Button if marker present */}
                                            {(() => {
                                                const navMatch = msg.content.match(/\[NAVIGATE:(.*?)\]/);
                                                if (navMatch) {
                                                    const path = navMatch[1];
                                                    return (
                                                        <button
                                                            onClick={() => handleNavigate(path)}
                                                            className="mt-3 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 
                                                                text-white text-xs font-bold uppercase tracking-widest rounded-xl
                                                                transition-all flex items-center justify-center gap-2 cursor-pointer
                                                                shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                                                        >
                                                            Take me there <ArrowRight size={14} />
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            {/* Copy button for AI messages */}
                                            {msg.role === 'assistant' && (
                                                <button
                                                    onClick={() => copyMessage(msg.content, idx)}
                                                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] 
                                                        opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
                                                        hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)]"
                                                    title="Copy message"
                                                >
                                                    {copiedMsgId === idx ? (
                                                        <Check className="w-3 h-3 text-green-500" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-[var(--site-text-muted)]" />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <span className={`text-[10px] text-[var(--site-text-muted)]/60 mt-1 
                                        ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing indicator with animated dots */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-[var(--card-border)]/50 border border-[var(--card-border)] rounded-[1.25rem] rounded-bl-md px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="flex justify-center">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-sm text-red-500">
                                    {error}
                                </div>
                            </div>
                        )}

                        {/* 🧠 EQ-AI: Emotional Support Quick Actions */}
                        {emotionalSupport && emotionalSupport.suggestedActions && emotionalSupport.suggestedActions.length > 0 && !isLoading && (
                            <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)]/5 to-purple-500/5 border border-[var(--accent-primary)]/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">
                                        {emotionalSupport.emotion === 'frustration' && '💪'}
                                        {emotionalSupport.emotion === 'confusion' && '💡'}
                                        {emotionalSupport.emotion === 'overwhelm' && '🧘'}
                                        {emotionalSupport.emotion === 'celebration' && '🎉'}
                                        {emotionalSupport.emotion === 'loneliness' && '🤝'}
                                        {emotionalSupport.emotion === 'encouragement_needed' && '✨'}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                                        {emotionalSupport.emotion === 'frustration' && 'I\'m here to help'}
                                        {emotionalSupport.emotion === 'confusion' && 'Let me clarify'}
                                        {emotionalSupport.emotion === 'overwhelm' && 'Let\'s take it slow'}
                                        {emotionalSupport.emotion === 'celebration' && 'Great work!'}
                                        {emotionalSupport.emotion === 'loneliness' && 'You\'re not alone'}
                                        {emotionalSupport.emotion === 'encouragement_needed' && 'Welcome back!'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {emotionalSupport.suggestedActions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setEmotionalSupport(null); sendMessage(action.text); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 
                                                bg-[var(--card-bg)] hover:bg-[var(--accent-primary)]/10
                                                border border-[var(--card-border)] hover:border-[var(--accent-primary)]/30
                                                rounded-full text-xs text-[var(--site-text-muted)] hover:text-[var(--accent-primary)]
                                                transition-all duration-200 cursor-pointer"
                                        >
                                            <span>{action.icon}</span>
                                            <span>{action.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - Fixed at bottom with safe padding */}
                    <div className="p-4 sm:p-5 border-t border-[var(--card-border)] bg-[var(--card-bg)] pb-[max(1.5rem,env(safe-area-inset-bottom,24px))]">
                        {/* Guest limit indicator */}
                        {!user && messagesRemaining !== null && (
                            <div className="text-xs text-[var(--site-text-muted)] text-center mb-2">
                                {messagesRemaining > 0
                                    ? `${messagesRemaining} free messages remaining today`
                                    : 'Sign in for unlimited messages'
                                }
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything..."
                                    rows={1}
                                    className="w-full px-4 py-3 rounded-2xl bg-[var(--card-border)]/30 border border-[var(--card-border)] 
                    text-[var(--site-text)] placeholder:text-[var(--site-text-muted)]
                    focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)]
                    resize-none text-sm transition-all
                    scrollbar-thin scrollbar-thumb-[var(--accent-primary)]/20 scrollbar-track-transparent hover:scrollbar-thumb-[var(--accent-primary)]/40"
                                    style={{ minHeight: '48px', maxHeight: '120px', overflowY: 'auto' }}
                                />
                            </div>
                            {/* Microphone Button - Modern Adaptive */}
                            <button
                                onClick={toggleVoiceInput}
                                disabled={isLoading}
                                className={`relative w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer
                                    transition-all active:scale-95 shadow-lg
                                    ${isListening
                                        ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/30'
                                        : 'bg-[var(--card-border)]/50 text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--card-border)]'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={isListening ? 'Stop listening' : 'Voice input'}
                            >
                                {isListening ? (
                                    <>
                                        <MicOff className="w-5 h-5 animate-pulse" />
                                        {/* Pulsing ring effect */}
                                        <span className="absolute inset-0 rounded-xl bg-rose-500/30 animate-ping opacity-75" />
                                    </>
                                ) : (
                                    <Mic className="w-5 h-5" />
                                )}
                            </button>
                            <button
                                onClick={() => sendMessage()}
                                disabled={!inputValue.trim() || isLoading}
                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 
                  text-white flex items-center justify-center cursor-pointer
                  hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
