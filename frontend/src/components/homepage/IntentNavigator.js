'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Zap,
  TrendingUp,
  Wrench,
  Flame,
  BookOpen,
  ArrowRight,
  Brain,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../ui/Skeleton';

export default function IntentNavigator() {
  const router = useRouter();
  const { isMounted } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [userInput, setUserInput] = useState('');

  const intents = [
    {
      id: 'job-ready',
      icon: Target,
      label: 'Get Job Ready',
      description: 'Analyze skill gaps for your target role',
      color: 'from-blue-600/20 to-indigo-600/20',
      iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-600',
      action: 'modal',
      modalTitle: 'Career Gap Analysis',
      modalDescription: 'Tell us your target role and we\'ll analyze what skills you need to master.',
      modalPlaceholder: 'e.g., Full Stack Developer, Data Scientist',
      route: '/skill-analysis',
      paramKey: 'role'
    },
    {
      id: 'learn-skill',
      icon: Zap,
      label: 'Learn New Skill',
      description: 'Get AI-powered roadmap and courses',
      color: 'from-emerald-600/20 to-teal-600/20',
      iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-600',
      action: 'modal',
      modalTitle: 'Skill Learning Path',
      modalDescription: 'What skill do you want to master? We\'ll create a personalized roadmap.',
      modalPlaceholder: 'e.g., React, Machine Learning, Docker',
      route: '/ai-intelligence',
      paramKey: 'q'
    },
    {
      id: 'career-switch',
      icon: TrendingUp,
      label: 'Career Switch',
      description: 'Plan your transition to a new field',
      color: 'from-purple-600/20 to-pink-600/20',
      iconBg: 'bg-gradient-to-br from-purple-600 to-pink-600',
      action: 'modal',
      modalTitle: 'Transition Planner',
      modalDescription: 'Which career field are you transitioning to? We\'ll map out your journey.',
      modalPlaceholder: 'e.g., Web Development, Cloud Architecture',
      route: '/skill-analysis',
      paramKey: 'role'
    },
    {
      id: 'ai-tools',
      icon: Wrench,
      label: 'Explore AI Tools',
      description: 'Discover professional tools by domain',
      color: 'from-orange-600/20 to-amber-600/20',
      iconBg: 'bg-gradient-to-br from-orange-600 to-amber-600',
      action: 'direct',
      route: '/ai-tools'
    },
    {
      id: 'trends',
      icon: Flame,
      label: 'Follow Trends',
      description: "See what's hot in tech right now",
      color: 'from-rose-600/20 to-red-600/20',
      iconBg: 'bg-gradient-to-br from-rose-600 to-red-600',
      action: 'direct',
      route: '/courses'
    },
    {
      id: 'browse',
      icon: BookOpen,
      label: 'Browse Courses',
      description: 'Explore curated learning resources',
      color: 'from-indigo-600/20 to-blue-600/20',
      iconBg: 'bg-gradient-to-br from-indigo-600 to-blue-600',
      action: 'direct',
      route: '/courses'
    }
  ];

  const handleIntentClick = (intent) => {
    if (intent.action === 'direct') {
      router.push(intent.route);
    } else if (intent.action === 'modal') {
      setSelectedIntent(intent);
      setShowModal(true);
    }
  };

  const handleModalSubmit = () => {
    if (!userInput.trim()) return;
    const encodedQuery = encodeURIComponent(userInput.trim());
    let url = selectedIntent.id === 'learn-skill'
      ? `${selectedIntent.route}?q=${encodedQuery}&autoSearch=true`
      : `${selectedIntent.route}?${selectedIntent.paramKey}=${encodedQuery}`;

    router.push(url);
    handleModalClose();
  };

  const handleModalClose = () => {
    setShowModal(false);
    setUserInput('');
    setSelectedIntent(null);
  };

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64 rounded-[3rem]" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {intents.map((intent, i) => {
          const Icon = intent.icon;
          return (
            <motion.div
              key={intent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handleIntentClick(intent)}
              className="group relative h-full card-elite p-10 flex flex-col justify-between btn-tactile overflow-hidden cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${intent.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

              <div className="relative z-10">
                <div className={`w-20 h-20 rounded-[2rem] ${intent.iconBg} flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:rotate-[8deg] transition-all duration-500`}>
                  <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>

                <h3 className="text-base md:text-xl font-black text-[var(--site-text)] mb-3 tracking-tight transition-colors duration-500">
                  {intent.label}
                </h3>

                <p className="text-xs md:text-sm font-medium text-[var(--site-text-muted)] leading-relaxed mb-6">
                  {intent.description}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-2 text-[var(--site-text)] font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all duration-500">
                {intent.action === 'modal' ? 'Get Started' : 'Explore'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showModal && selectedIntent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--site-bg)]/80 backdrop-blur-md" 
              onClick={handleModalClose} 
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg card-elite p-8 sm:p-10 z-10"
            >
              {/* Close */}
              <button
                onClick={handleModalClose}
                className="absolute top-6 cursor-pointer right-6 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--site-text)]/5 hover:bg-[var(--site-text)]/10 transition-all active:scale-95 z-20"
              >
                <X className="w-5 h-5 text-[var(--site-text-muted)]" />
              </button>

              <div className="space-y-8">
                {/* Header */}
                <div className="pr-16 sm:pr-20">
                  <h3 className="text-xl md:text-3xl font-black text-[var(--site-text)] mb-2 tracking-tight">
                    {selectedIntent.modalTitle}
                  </h3>
                  <div className="flex items-start gap-4 p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
                    <Brain className="w-6 h-6 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-bold text-[var(--site-text-muted)] leading-relaxed">
                      {selectedIntent.modalDescription}
                    </p>
                  </div>
                </div>

                {/* Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={selectedIntent.modalPlaceholder}
                    className="w-full px-8 py-5 text-base md:text-lg font-bold bg-[var(--site-text)]/5 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] focus:outline-none transition-all placeholder:text-[var(--site-text-muted)]/40"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleModalSubmit()}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={handleModalClose}
                    className="flex-1 cursor-pointer py-5 bg-[var(--site-text)]/5 hover:bg-[var(--site-text)]/10 text-[var(--site-text)] font-black rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModalSubmit}
                    disabled={!userInput.trim()}
                    className="flex-[1.5] cursor-pointer py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
                  >
                    <Zap size={18} />
                    Search Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
