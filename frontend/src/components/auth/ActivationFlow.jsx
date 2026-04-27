"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, ArrowRight, Sparkles, Rocket, X, Loader2 } from "lucide-react";
import { api } from "../../services/api";
import Surface from "../ui/Surface";

export default function ActivationFlow({ token, onComplete, onClose }) {
  const [targetRole, setTargetRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Prevent body scroll when activation flow is active
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleSubmit = async () => {
    if (!targetRole) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.completeOnboarding({ targetRole }, token);
      onComplete();
    } catch (err) {
      console.error("Onboarding failed:", err);
      setError(err.message || "Activation failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    "Frontend Developer",
    "Fullstack Engineer",
    "Data Scientist",
    "Product Manager",
    "UI/UX Designer",
    "Backend Developer"
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex animate-in fade-in duration-500 overflow-hidden">
      {/* Extreme Elite Backdrop */}
      <div className="absolute inset-0 bg-black/90 dark:bg-black/95 backdrop-blur-3xl" />

      {/* Layout Wrapper to center relative to sidebar - Handles open/closed states */}
      <div className="relative w-full h-full flex items-start justify-center px-4 sm:px-6 lg:pr-8 lg:pl-[calc(2rem+var(--sidebar-offset,0px))] pt-24 pb-6 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500">
        
        {/* Modal Container: Guru Glassmorphism with Surface Component */}
        <Surface 
          className="w-full max-w-2xl h-full max-h-[85vh] flex flex-col rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group animate-in zoom-in-95 duration-500 pointer-events-auto"
        >
          {/* Visual Flair: Dynamic Gradients */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Sticky Header */}
          <div className="relative z-50 p-6 sm:px-10 flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Rocket size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--site-text)] tracking-tighter">
                  Activate Your Engine
                </h2>
                <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60">
                  Step 1: Career Architecture
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[var(--site-text)]/5 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer group/close"
            >
              <X size={18} className="transition-transform group-hover/close:rotate-90" />
            </button>
          </div>

          {/* Main Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto premium-scroll px-6 sm:px-10 py-8 lg:py-10">
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce">
                  ⚠️ {error}
                </div>
              )}

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-[var(--site-text)]">
                  Intelligence Base Target
                </h3>
                <p className="text-sm text-[var(--site-text-muted)]">
                  Which professional trajectory should the Brain prioritize?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map(role => (
                   <button
                   key={role}
                   onClick={() => { setTargetRole(role); setError(null); }}
                   className={`p-5 rounded-3xl text-left transition-all border-2 flex flex-col gap-3 group/btn cursor-pointer ${targetRole === role 
                     ? "bg-indigo-500/10 border-indigo-500/50 shadow-xl" 
                     : "bg-[var(--site-text)]/[0.02] border-[var(--card-border)] hover:border-indigo-500/20"
                   }`}
                 >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${targetRole === role ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-500'}`}>
                     <Target size={20} />
                   </div>
                   <p className={`text-xs font-black uppercase tracking-widest ${targetRole === role ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--site-text-muted)]'}`}>
                     {role}
                   </p>
                 </button>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t border-[var(--card-border)]">
                <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest text-center">Specific Target Designation</p>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Or type custom role..."
                    value={targetRole && !roles.includes(targetRole) ? targetRole : ''}
                    onChange={(e) => { setTargetRole(e.target.value); setError(null); }}
                    className="w-full px-6 py-4 bg-[var(--site-text)]/5 border-2 border-[var(--card-border)] rounded-2xl text-sm font-bold text-[var(--site-text)] focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 opacity-50">
                    <Sparkles size={20} />
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-[10px] text-center text-indigo-500 font-bold uppercase tracking-widest">
                  Personalized Roadmap Generation Ready
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Action Bar */}
          <div className="p-6 sm:px-10 border-t border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl flex items-center justify-center shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!targetRole || isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all btn-tactile disabled:opacity-30 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Launch Dashboard <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </Surface>
      </div>

      <style jsx>{`
        .premium-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .premium-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .premium-scroll::-webkit-scrollbar-thumb {
          background: rgba(var(--site-text-rgb), 0.1);
          border-radius: 10px;
        }
        .btn-tactile {
          box-shadow: 0 4px 0 0 rgba(0, 0, 0, 0.2);
        }
        .btn-tactile:active {
          box-shadow: 0 0 0 0 transparent;
          transform: translateY(2px);
        }
      `}</style>
    </div>
  );
}
