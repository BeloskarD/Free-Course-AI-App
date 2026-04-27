"use client";
import { motion } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  CheckCircle, 
  Circle,
  Clock,
  ChevronRight,
  TrendingUp,
  Target,
  Zap
} from "lucide-react";
import Surface from "../ui/Surface";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";

const CareerTimelineVisual = () => {
  const { token } = useAuth();

  const { data: timeline, isLoading } = useQuery({
    queryKey: ["career-timeline"],
    queryFn: () => api.getCareerTimeline(token),
    enabled: !!token,
  });

  if (isLoading) return <div className="h-96 animate-pulse bg-indigo-500/5 rounded-[2.5rem]" />;

  const data = timeline?.data;
  if (!data) return null;

  const isInitializing = Boolean(data.message) && (!data.scenarios || !data.milestones?.length);

  if (isInitializing) {
    return (
      <Surface className="p-8 sm:p-12 rounded-[3rem] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[90px] -mr-24 -mt-24" />
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Calendar size={24} className="text-indigo-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Your Career Path</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
                  Projection Engine Warming Up
                </p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs font-black text-indigo-600 uppercase tracking-widest">
              Initializing
            </div>
          </div>

          <p className="text-sm text-[var(--site-text-muted)] max-w-2xl leading-relaxed">
            {data.message} We are syncing your role, current readiness, and skill graph before generating a realistic timeline with milestones and weekly focus.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Optimistic", "Realistic", "Pessimistic"].map((label) => (
              <div key={label} className="p-6 rounded-[2rem] bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--site-text-muted)]">{label} Path</p>
                <div className="h-8 w-24 rounded-xl bg-[var(--site-text)]/5 animate-pulse" />
                <div className="h-1.5 w-full rounded-full bg-[var(--site-text)]/5 overflow-hidden">
                  <div className="h-full w-1/2 rounded-full bg-indigo-500/20 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <div key={index} className="p-6 rounded-[2rem] bg-[var(--site-text)]/[0.02] border border-[var(--card-border)] space-y-4">
                <div className="h-6 w-2/3 rounded-lg bg-[var(--site-text)]/5 animate-pulse" />
                <div className="h-4 w-1/3 rounded-lg bg-[var(--site-text)]/5 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-7 w-20 rounded-lg bg-indigo-500/10 animate-pulse" />
                  <div className="h-7 w-16 rounded-lg bg-indigo-500/10 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Calendar size={24} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Your Career Path</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Data-Driven Projection for {data.targetRole}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-sm">
            <Zap size={16} className="text-emerald-500" />
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{data.hiringProbability}% Chance of success</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl transition-all hover:bg-indigo-500/20">
            <Clock size={16} className="text-indigo-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-600 uppercase leading-none mb-1">Target Scenario</span>
              <span className="text-xs font-black text-indigo-700 uppercase">~{data.scenarios?.realistic || data.estimatedMonthsToReady} Months</span>
            </div>
          </div>
        </div>
      </div>

      {/* Realistic Path Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        {['optimistic', 'realistic', 'pessimistic'].map((type) => (
          <div key={type} className={`p-6 rounded-[2rem] border transition-all ${
            type === 'realistic' ? 'bg-indigo-500/5 border-indigo-500/20 scale-105 shadow-lg' : 'bg-[var(--card-bg)] border-[var(--card-border)] opacity-60'
          }`}>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-4 text-[var(--site-text-muted)]">{type} Path</p>
            <h4 className="text-2xl font-black text-[var(--site-text)]">{data.scenarios?.[type] || '...'} <span className="text-xs opacity-40 font-bold uppercase">Months</span></h4>
            <div className="mt-4 w-full h-1 bg-[var(--site-text)]/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${type === 'optimistic' ? 'bg-emerald-500' : type === 'realistic' ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: type === 'optimistic' ? '30%' : type === 'realistic' ? '60%' : '100%' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Milestone Vertical Path */}
        <div className="lg:col-span-12">
          <Surface className="p-8 sm:p-12 rounded-[3.5rem] relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-indigo-500/10 via-indigo-500 to-indigo-500/10" />

              {data.milestones?.map((milestone, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className="relative space-y-6 flex flex-col items-center text-center"
                >
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 ${
                    milestone.isCompleted 
                      ? 'bg-indigo-600 text-white shadow-indigo-600/20' 
                      : 'bg-white dark:bg-slate-800 text-indigo-500 border border-indigo-500/20'
                  }`}>
                    {milestone.isCompleted ? <CheckCircle size={32} /> : <Target size={32} />}
                    {idx === 0 && !milestone.isCompleted && (
                      <span className="absolute -top-2 -right-2 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white"></span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-[var(--site-text)] tracking-tight mb-1">{milestone.title}</h3>
                    <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest">
                      {new Date(milestone.targetDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {milestone.requiredSkills?.map((skill, sIdx) => (
                      <span key={sIdx} className="px-3 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] font-bold text-indigo-600 font-mono">
                        #{skill.toLowerCase().replace(/\s+/g, '')}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </Surface>
        </div>

        {/* Weekly Focus - Quick Cards */}
        <div className="lg:col-span-12">
          <div className="flex items-center gap-3 mb-8 px-2">
            <TrendingUp size={20} className="text-emerald-500" />
            <h3 className="text-xl font-black uppercase tracking-widest text-[var(--site-text)]">Active Learning Plan</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.weeklyPlan?.map((week, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm hover:shadow-[var(--shadow-elite)] transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="px-4 py-1 bg-indigo-500 text-white rounded-lg text-[10px] font-black tracking-[0.2em] uppercase">
                    Week {week.week}
                  </span>
                  <ChevronRight size={16} className="text-[var(--site-text-muted)] opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-lg font-black text-[var(--site-text)] mb-6 leading-tight min-h-[3rem]">{week.focus}</h4>
                <div className="space-y-3">
                  {week.tasks?.map((task, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-3 h-3 rounded-full border-2 border-indigo-500/30 group-hover:border-indigo-500 transition-colors" />
                      <span className="text-xs text-[var(--site-text-muted)] leading-relaxed group-hover:text-[var(--site-text)] transition-colors line-clamp-2">
                        {task}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerTimelineVisual;
