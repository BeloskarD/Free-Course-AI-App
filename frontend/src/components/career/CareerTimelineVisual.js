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
  Zap,
  ArrowUpRight
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

  if (isLoading) return <div className="h-96 animate-pulse bg-indigo-500/5 rounded-[3.5rem]" />;

  const data = timeline?.data;
  if (!data) return null;

  const isInitializing = Boolean(data.message) && (!data.scenarios || !data.milestones?.length);

  if (isInitializing) {
    return (
      <Surface className="p-8 sm:p-12 rounded-[3.5rem] overflow-hidden relative border border-[var(--card-border)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -mr-32 -mt-32" />
        <div className="relative z-10 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-xl">
                <Calendar size={28} className="text-indigo-500" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-[var(--site-text)] tracking-tighter">Career Projection</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] leading-none mt-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  AI Engine Warming Up
                </p>
              </div>
            </div>
            <div className="px-6 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] shadow-sm">
              Initializing Engine
            </div>
          </div>

          <p className="text-base text-[var(--site-text-muted)] max-w-3xl leading-relaxed font-medium">
            {data.message} We are syncing your role, current readiness, and skill graph before generating a realistic timeline with milestones and weekly focus.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {["Optimistic", "Realistic", "Pessimistic"].map((label) => (
              <div key={label} className="p-8 rounded-[2.5rem] bg-[var(--site-text)]/[0.02] border border-[var(--card-border)] space-y-5">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--site-text-muted)] opacity-50">{label} Velocity</p>
                <div className="h-10 w-32 rounded-xl bg-[var(--site-text)]/5 animate-pulse" />
                <div className="h-2 w-full rounded-full bg-[var(--site-text)]/5 overflow-hidden">
                  <div className="h-full w-1/2 rounded-full bg-indigo-500/20 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-xl">
            <Calendar size={28} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-[var(--site-text)] tracking-tighter">Career Navigation</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] leading-none mt-1.5">
              Data-Driven Path for {data.targetRole}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-sm">
            <Zap size={18} className="text-emerald-500" />
            <span className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">{data.hiringProbability}% Success Probability</span>
          </div>
          <div className="flex items-center gap-4 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl transition-all hover:bg-indigo-500/20 cursor-default shadow-sm">
            <Clock size={18} className="text-indigo-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Estimated Time</span>
              <span className="text-sm font-black text-indigo-700 uppercase leading-none">~{data.scenarios?.realistic || data.estimatedMonthsToReady} Months</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trajectory Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {['optimistic', 'realistic', 'pessimistic'].map((type) => (
          <div key={type} className={`p-10 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group ${
            type === 'realistic' 
              ? 'bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/30 scale-105 shadow-[0_30px_70px_-20px_rgba(79,70,229,0.2)]' 
              : 'bg-[var(--card-bg)] border-[var(--card-border)] opacity-60 hover:opacity-100'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 text-[var(--site-text-muted)]">{type} Velocity</p>
            <div className="flex items-end gap-2 mb-6">
               <h4 className="text-5xl font-black text-[var(--site-text)] tracking-tighter leading-none">{data.scenarios?.[type] || '...'}</h4>
               <span className="text-xs font-black text-[var(--site-text-muted)] uppercase tracking-widest mb-1.5">Months</span>
            </div>
            <div className="w-full h-2 bg-[var(--site-text)]/5 rounded-full overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: type === 'optimistic' ? '30%' : type === 'realistic' ? '60%' : '100%' }}
                className={`h-full rounded-full shadow-lg ${
                  type === 'optimistic' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                  type === 'realistic' ? 'bg-gradient-to-r from-indigo-500 to-blue-600' : 
                  'bg-gradient-to-r from-amber-400 to-orange-600'
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Milestone Vertical Path */}
        <div className="lg:col-span-12 px-4">
          <Surface className="p-10 sm:p-16 rounded-[4rem] relative overflow-hidden border border-[var(--card-border)] shadow-[var(--shadow-elite)]">
            <div className="absolute top-0 left-0 w-full h-full bg-[var(--site-text)]/[0.01] pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

              {data.milestones?.map((milestone, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2, duration: 0.8 }}
                  className="relative space-y-8 flex flex-col items-center text-center group/milestone"
                >
                  <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10 transition-all duration-500 group-hover/milestone:scale-110 group-hover/milestone:rotate-3 ${
                    milestone.isCompleted 
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-indigo-600/30' 
                      : 'bg-white dark:bg-slate-800 text-indigo-500 border-2 border-indigo-500/20'
                  }`}>
                    {milestone.isCompleted ? <CheckCircle size={40} strokeWidth={2.5} /> : <Target size={40} strokeWidth={2} />}
                    {idx === 0 && !milestone.isCompleted && (
                      <span className="absolute -top-2 -right-2 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-indigo-500 border-4 border-white dark:border-slate-800"></span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-[var(--site-text)] tracking-tight leading-tight">{milestone.title}</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">
                      {new Date(milestone.targetDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {milestone.requiredSkills?.map((skill, sIdx) => (
                      <span key={sIdx} className="px-4 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </Surface>
        </div>

        {/* Weekly Focus - High Fidelity Cards */}
        <div className="lg:col-span-12 px-4">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <TrendingUp size={24} className="text-emerald-500" />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-[var(--site-text)]">Evolution Plan</h3>
            </div>
            <div className="px-5 py-2 bg-[var(--site-text)]/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--site-text-muted)]">
               Active Sprint: Week 01-04
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {data.weeklyPlan?.map((week, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                className="p-10 rounded-[3.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-elite)] hover:border-indigo-500/30 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.02] rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />
                <div className="flex items-center justify-between mb-8">
                  <span className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black tracking-[0.3em] uppercase shadow-lg shadow-indigo-600/20">
                    Week {week.week}
                  </span>
                  <ArrowUpRight size={20} className="text-[var(--site-text-muted)] opacity-20 group-hover:opacity-100 group-hover:text-indigo-500 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-xl font-black text-[var(--site-text)] mb-8 leading-tight tracking-tight min-h-[3.5rem] group-hover:text-indigo-600 transition-colors">{week.focus}</h4>
                <div className="space-y-4">
                  {week.tasks?.map((task, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-4">
                      <div className="mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full border-2 border-indigo-500/30 group-hover:border-indigo-500 group-hover:bg-indigo-500/20 transition-all duration-500" />
                      <span className="text-sm font-medium text-[var(--site-text-muted)] leading-relaxed group-hover:text-[var(--site-text)] transition-colors line-clamp-3">
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
