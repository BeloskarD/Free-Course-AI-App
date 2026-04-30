"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Zap, 
  AlertCircle,
  TrendingUp,
  Info,
  ChevronRight
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

  const { data: radarResponse } = useQuery({
    queryKey: ["hiring-radar"],
    queryFn: () => api.getRadarBreakdown(token),
    enabled: !!token,
  });

  if (isLoading) return <div className="h-64 animate-pulse bg-indigo-500/5 rounded-[2.5rem]" />;

  const data = readiness?.data;
  if (!data) return null;

  const radarData = radarResponse?.data;
  const score = Math.min(100, Math.round(data.score || 0));
  const missingItems = data.missingComponents || [];

  return (
    <Surface className="p-8 sm:p-12 rounded-[3.5rem] overflow-hidden relative group border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]">
      {/* Immersive Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-indigo-500/20 group-hover:scale-110" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

      <div className="relative z-10">
        {/* Intelligence Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
          <div className="flex flex-wrap gap-2">
            <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border transition-all shadow-sm ${
              data.confidence === 'High' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
              data.confidence === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {data.confidence || 'Calculating...'} Confidence
            </div>
            {data.benchmarking?.status && (
              <div className="px-5 py-2 bg-indigo-500/10 text-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-500/20 shadow-sm animate-in fade-in zoom-in duration-700">
                {data.benchmarking.status}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--site-text)]/5 rounded-2xl border border-[var(--card-border)] text-[var(--site-text-muted)]">
             <Info size={14} className="opacity-50" />
             <span className="text-[10px] font-black uppercase tracking-widest">Real-time Engine Active</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* High-Fidelity Progress Visual */}
          <div className="relative w-56 h-56 flex-shrink-0 group/circle">
            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-2xl">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <circle
                cx="112"
                cy="112"
                r="100"
                stroke="currentColor"
                strokeWidth="14"
                fill="transparent"
                className="text-indigo-500/5 dark:text-indigo-500/10"
              />
              <motion.circle
                cx="112"
                cy="112"
                r="100"
                stroke="url(#scoreGradient)"
                strokeWidth="14"
                fill="transparent"
                strokeDasharray={628}
                initial={{ strokeDashoffset: 628 }}
                animate={{ strokeDashoffset: 628 - (628 * score) / 100 }}
                transition={{ duration: 2, ease: "circOut" }}
                strokeLinecap="round"
                className="shadow-glow-lg"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-6xl font-black text-[var(--site-text)] tracking-tighter"
              >
                {score}
              </motion.span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1">READINESS</span>
                <div className="h-1 w-8 bg-emerald-500/30 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-full animate-pulse" />
                </div>
              </div>
            </div>
            {/* Outer Glow Rings */}
            <div className="absolute inset-0 border-2 border-indigo-500/5 rounded-full scale-110 animate-pulse-slow" />
            <div className="absolute inset-0 border border-emerald-500/5 rounded-full scale-125" />
          </div>

          {/* Strategic Info */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg">
                  <Target className="text-indigo-500" size={24} />
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-[var(--site-text)] tracking-tighter leading-none">
                  Hiring Radar
                </h2>
              </div>
              
              <p className="text-[var(--site-text-muted)] text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                Our intelligence engine predicts your market readiness for <strong className="text-[var(--site-text)]">{data.targetRole || 'Elite Roles'}</strong> by auditing your skill graph and proof-of-work signals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {data.biggestImpactFactor && (
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl shadow-sm group/priority">
                  <AlertCircle size={18} className="text-amber-500 group-hover/priority:rotate-12 transition-transform" />
                  <div className="text-left">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">High Impact Growth</p>
                    <p className="text-sm font-black text-amber-700 tracking-tight">{data.biggestImpactFactor}</p>
                  </div>
                </div>
              )}
              
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl shadow-sm">
                 <Zap size={18} className="text-indigo-500" />
                 <div className="text-left">
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Live Intelligence</p>
                    <p className="text-sm font-black text-indigo-700 tracking-tight">Signal Sync Active</p>
                 </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="px-10 py-5 bg-[var(--site-text)]/5 hover:bg-[var(--site-text)]/10 text-[var(--site-text)] rounded-3xl text-xs font-black uppercase tracking-[0.2em] border border-[var(--card-border)] transition-all flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              >
                <TrendingUp size={16} /> {showDetails ? 'Compress Intel' : 'Expand Insights'}
              </button>
              <button 
                onClick={() => onBoost(missingItems?.[0]?.item)}
                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-110 active:scale-90 transition-all flex items-center gap-3 cursor-pointer group/btn"
              >
                <Zap size={16} className="group-hover/btn:rotate-12 transition-transform" /> Boost Scoring
              </button>
            </div>

          </div>
        </div>

        {/* Intelligence Breakdown Panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-16 pt-16 border-t border-[var(--card-border)] overflow-hidden"
            >
              {radarData ? (
                <div className="flex flex-col lg:flex-row items-center gap-12">
                  <div className="w-full lg:w-1/2 flex justify-center">
                    <RadarChart axes={radarData.axes} />
                  </div>
                  <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {radarData.axes.map((axis, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-[var(--site-text)]/[0.02] border border-[var(--card-border)] flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest">{axis.label}</span>
                           <span className="text-xs font-black text-[var(--site-text)]">{axis.score}%</span>
                        </div>
                        <div className="w-full h-1 bg-[var(--site-text)]/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(axis.score / axis.maxScore) * 100}%` }}
                            className="h-full bg-indigo-500 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center p-12 text-[var(--site-text-muted)] text-sm font-medium animate-pulse">
                  Calibrating radar coordinates...
                </div>
              )}

              {/* Hiring Blockers / Missing Elements */}
              {missingItems.length > 0 && (
                <div className="mt-12 p-8 sm:p-10 rounded-[3rem] bg-amber-500/5 border border-amber-500/10 relative overflow-hidden group/blockers">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/blockers:scale-150 transition-transform" />
                  <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                    <AlertCircle size={18} /> Strategic Optimization Required
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {missingItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-5 rounded-[1.75rem] bg-[var(--card-bg)] shadow-sm border border-amber-500/5 hover:border-amber-500/20 transition-all cursor-default">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-inner shrink-0">
                          <PlusCircle size={16} className="text-amber-600" />
                        </div>
                        <span className="text-xs font-black text-[var(--site-text)] tracking-tight">{item.item}</span>
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

// Custom High-Fidelity Plus Icon
const PlusCircle = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const RadarChart = ({ axes }) => {
  if (!axes || axes.length === 0) return null;

  const size = 300;
  const center = size / 2;
  const radius = size / 2.5;

  const getPoint = (score, maxScore, angle) => {
    const r = radius * (score / maxScore);
    return {
      x: center + r * Math.cos(angle - Math.PI / 2),
      y: center + r * Math.sin(angle - Math.PI / 2),
    };
  };

  const points = axes.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / axes.length;
    return getPoint(axis.score, axis.maxScore, angle);
  });

  const polygonData = points.map((p) => `${p.x},${p.y}`).join(" ");

  const bgPolygons = [1, 0.75, 0.5, 0.25].map((scale, level) => {
    return axes.map((_, i) => {
      const angle = (Math.PI * 2 * i) / axes.length;
      return getPoint(100 * scale, 100, angle);
    }).map(p => `${p.x},${p.y}`).join(" ");
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible filter drop-shadow-2xl">
      {/* Background Web */}
      {bgPolygons.map((poly, i) => (
        <polygon key={`bg-${i}`} points={poly} fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--site-text)] opacity-10" />
      ))}
      {axes.map((_, i) => {
        const angle = (Math.PI * 2 * i) / axes.length;
        const outer = getPoint(100, 100, angle);
        return (
          <line key={`spoke-${i}`} x1={center} y1={center} x2={outer.x} y2={outer.y} stroke="currentColor" strokeWidth="1" className="text-[var(--site-text)] opacity-10" />
        );
      })}

      {/* Dynamic Data Polygon */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
        points={polygonData}
        fill="url(#radarGradient)"
        stroke="#6366f1"
        strokeWidth="3"
        style={{ transformOrigin: "center" }}
        className="opacity-70"
      />
      
      {/* Data Points */}
      {points.map((p, i) => (
        <motion.circle
          key={`point-${i}`}
          initial={{ r: 0 }}
          animate={{ r: 5 }}
          transition={{ delay: 1 + i * 0.1 }}
          cx={p.x}
          cy={p.y}
          fill="#10b981"
          stroke="#fff"
          strokeWidth="2"
        />
      ))}

      {/* Axis Labels */}
      {axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / axes.length;
        // Push labels out slightly further than the max radius
        const p = getPoint(115, 100, angle);
        return (
          <text
            key={`label-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="currentColor"
            className="text-[9px] font-bold uppercase tracking-widest fill-[var(--site-text-muted)]"
          >
            {axis.label}
          </text>
        );
      })}

      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default HiringReadinessWidget;
