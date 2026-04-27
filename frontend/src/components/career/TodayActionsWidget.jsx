"use client";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, ArrowRight, Zap, Target, BookOpen, Rocket } from "lucide-react";
import Surface from "../ui/Surface";
import Link from "next/link";

export default function TodayActionsWidget({ actions, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 rounded-[2.5rem] bg-[var(--card-bg)] animate-pulse border border-[var(--card-border)]" />
        ))}
      </div>
    );
  }

  if (!actions || actions.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'skill': return <BookOpen className="text-amber-500" size={20} />;
      case 'validation': return <Target className="text-rose-500" size={20} />;
      case 'project': return <Rocket className="text-emerald-500" size={20} />;
      default: return <Zap className="text-indigo-500" size={20} />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'skill': return 'bg-amber-500/10 border-amber-500/20';
      case 'validation': return 'bg-rose-500/10 border-rose-500/20';
      case 'project': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-indigo-500/10 border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Zap size={24} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[var(--site-text)] tracking-tighter">Today's Actions</h2>
            <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60">Prioritized for maximum hiring impact</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
          <Sparkles size={14} /> AI Enhanced
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {actions.map((action, idx) => (
          <motion.div
            key={action.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`group relative p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:shadow-[var(--shadow-elite)] transition-all flex flex-col h-full overflow-hidden`}
          >
            {/* Impact Badge */}
            <div className={`absolute top-0 right-0 px-6 py-3 rounded-bl-[1.5rem] font-black text-[9px] uppercase tracking-widest ${getBg(action.type)} text-[var(--site-text)] border-l border-b border-[var(--card-border)]`}>
              {action.estimatedImpact}
            </div>

            <div className={`w-12 h-12 rounded-2xl ${getBg(action.type)} flex items-center justify-center mb-6 shadow-sm`}>
              {getIcon(action.type)}
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-black text-[var(--site-text)] mb-3 leading-tight tracking-tight group-hover:text-indigo-500 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-[var(--site-text-muted)] leading-relaxed mb-8">
                {action.description}
              </p>
            </div>

            <Link 
              href={action.link}
              className="mt-auto px-6 py-4 bg-[var(--site-text)] text-[var(--card-bg)] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-95 group-hover:bg-indigo-600 group-hover:text-white"
            >
              {action.cta} <ArrowRight size={16} />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
