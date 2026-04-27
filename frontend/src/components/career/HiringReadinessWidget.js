"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Zap, 
  AlertCircle,
  TrendingUp,
  Info
} from "lucide-react";
import Surface from "../ui/Surface";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";

const HiringReadinessWidget = ({ onBoost }) => {
  const { token } = useAuth();

  const [showDetails, setShowDetails] = useState(false);

  const { data: readiness, isLoading } = useQuery({
    queryKey: ["hiring-readiness"],
    queryFn: () => api.getHiringReadiness(token),
    enabled: !!token,
  });

  if (isLoading) return <div className="h-64 animate-pulse bg-indigo-500/5 rounded-[2.5rem]" />;

  const data = readiness?.data;
  if (!data) return null;

  const score = Math.min(100, Math.round(data.score || 0));
  const weights = data.weights || {};
  const breakdown = data.breakdown || {};
  const missingItems = data.missingComponents || [];
  const breakdownCards = [
    { key: "Skills", contribution: Math.min(weights.skills || 0, (breakdown.skillStrength * (weights.skills || 0)) / 100), weight: weights.skills || 0 },
    { key: "Projects", contribution: Math.min(weights.projects || 0, (breakdown.projectProof * (weights.projects || 0)) / 100), weight: weights.projects || 0 },
    { key: "Validations", contribution: Math.min(weights.validations || 0, (breakdown.verifiedExpertise * (weights.validations || 0)) / 100), weight: weights.validations || 0 },
    { key: "Market", contribution: Math.min(weights.market || 0, (breakdown.engagementHealth * (weights.market || 0)) / 100), weight: weights.market || 0 },
  ];

  return (
    <Surface className="p-8 sm:p-10 rounded-[2.5rem] overflow-hidden relative group">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-all duration-700 group-hover:bg-indigo-500/10" />

      <div className="relative z-10">
        {/* Status & Benchmarking Badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
            data.confidence === 'High' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            data.confidence === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            Confidence: {data.confidence || 'Calculating...'}
          </div>
          {data.benchmarking?.status && (
            <div className="px-4 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 animate-in fade-in zoom-in duration-500">
              {data.benchmarking.status}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10">

          {/* Progress Circle Visual */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-indigo-500/10"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={440}
                initial={{ strokeDashoffset: 440 }}
                animate={{ strokeDashoffset: 440 - (440 * score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-indigo-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-[var(--site-text)] tracking-tighter">{score}%</span>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">READY</span>
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Target className="text-indigo-500" size={20} />
              </div>
              <h2 className="text-2xl font-black text-[var(--site-text)] tracking-tight">Hiring Readiness</h2>
            </div>
            
            <div className="space-y-4 mb-8">
              <p className="text-[var(--site-text-muted)] text-sm leading-relaxed max-w-lg">
                Our real-time engine analyzes your skills, projects, and verified badges 
                to predict your market readiness for <strong>{data.targetRole || 'Elite Roles'}</strong>.
              </p>

              {data.message && (
                <p className="text-xs text-[var(--site-text-muted)]">{data.message}</p>
              )}

              {data.biggestImpactFactor && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Growth Priority:</span>
                  <span className="text-[10px] font-bold text-amber-700 underline decoration-amber-500/30 underline-offset-4">{data.biggestImpactFactor}</span>
                </div>
              )}
            </div>


            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="px-6 py-3 bg-indigo-500/10 text-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"
              >
                <TrendingUp size={14} /> {showDetails ? 'Hide Analysis' : 'Show Breakdown'}
              </button>
              <button 
                onClick={() => onBoost(missingItems?.[0]?.item)}
                className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Zap size={14} /> Boost Score
              </button>
            </div>

          </div>
        </div>

        {/* Expandable Breakdown */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-12 pt-10 border-t border-indigo-500/10 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {breakdownCards.map(({ key, contribution, weight }) => (
                  <div key={key} className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{key}</span>
                      <Info size={12} className="opacity-30" />
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-[var(--site-text)]">{Math.round(contribution)}%</span>
                      <span className="text-[10px] font-bold text-[var(--site-text-muted)] mb-1">/{Math.round(weight)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-indigo-500/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, weight > 0 ? (contribution / weight) * 100 : contribution)}%` }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Actionable Missing Items */}
              {missingItems.length > 0 && (
                <div className="mt-10 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
                  <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertCircle size={14} /> Priority Improvements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {missingItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <PlusCircle size={12} className="text-amber-600" />
                        </div>
                        <span className="text-xs font-medium text-[var(--site-text)]">{item.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Surface>
  );
};

// Simple PlusCircle icon since I didn't import it
const PlusCircle = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

export default HiringReadinessWidget;
