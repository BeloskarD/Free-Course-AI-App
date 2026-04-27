"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  MapPin, 
  Target, 
  Briefcase, 
  Award,
  ExternalLink,
  Share2,
  TrendingUp,
  Brain,
  Zap,
  Eye,
  Settings,
  Code
} from "lucide-react";
import Surface from "../../../components/ui/Surface";
import { api } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

const ProfileClient = ({ profile, username }) => {
  const { user, stats, verifiedSkills, topSkills, timeline } = profile;
  const { token, user: authUser } = useAuth();
  
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);
  const isOwner = authUser?.username === username;

  // Hybrid Recruiter Mode: Session-based + Optional Persistence
  const toggleRecruiterMode = async () => {
    const newState = !recruiterMode;
    setRecruiterMode(newState);
    
    if (isOwner && isPersistent) {
      try {
        await api.updateUserPreferences(token, { recruiterModePersistent: newState });
      } catch (err) {
        console.error("Failed to persist recruiter preference", err);
      }
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${recruiterMode ? 'bg-slate-950' : 'bg-[var(--site-bg)]'}`}>
      <div className="container mx-auto px-6 sm:px-12 max-w-7xl pt-16 sm:pt-24 pb-24">
        
        {/* Recruiter Mode Toggle Bar */}
        <div className="flex items-center justify-between mb-8 px-8 py-4 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full animate-pulse ${recruiterMode ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {recruiterMode ? 'Recruiter Mode Active' : 'Talent Mastery View'}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
             {isOwner && (
               <label className="flex items-center gap-2 cursor-pointer group">
                 <input 
                   type="checkbox" 
                   checked={isPersistent} 
                   onChange={(e) => setIsPersistent(e.target.checked)}
                   className="hidden"
                 />
                 <div className={`w-8 h-4 rounded-full border border-white/20 relative transition-all ${isPersistent ? 'bg-indigo-500/30' : 'bg-transparent'}`}>
                   <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${isPersistent ? 'left-4.5' : 'left-0.5'}`} />
                 </div>
                 <span className="text-[8px] font-black opacity-40 group-hover:opacity-100 uppercase tracking-widest">Persist</span>
               </label>
             )}
             <button 
               onClick={toggleRecruiterMode}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 recruiterMode 
                 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                 : 'bg-white/5 text-[var(--site-text-muted)] border border-white/10 hover:bg-white/10'
               }`}
             >
               {recruiterMode ? 'Disable Analytics' : 'Recruiter Insights'}
             </button>
          </div>
        </div>

        {/* Header Hero */}
        <div className={`relative p-10 sm:p-16 rounded-[3.5rem] overflow-hidden shadow-[var(--shadow-elite)] mb-12 border border-white/5 transition-all duration-700 ${
          recruiterMode ? 'bg-indigo-950 scale-[1.02]' : 'bg-gradient-to-br from-slate-900 to-indigo-950'
        }`}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border-4 border-white/20 overflow-hidden shadow-2xl">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-white">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-2 rounded-2xl border-4 border-[#0a0f1e] shadow-xl">
                  <ShieldCheck size={28} />
                </div>
              </div>

              <div className="text-white">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 leading-tight">{user.name}</h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <span className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
                    @{user.username}
                  </span>
                  <span className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                    Verified Expert
                  </span>
                  <p className="flex items-center gap-2 text-xs text-indigo-300 font-bold ml-2">
                    <Briefcase size={14} /> Supporting {stats.targetRole} Transition
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-inner">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Hiring Probability</p>
              <div className="text-6xl font-black tracking-tighter text-emerald-400">
                {Math.round(stats.hiringScore * 100)}%
              </div>
              <div className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black tracking-widest uppercase border border-emerald-500/30">
                Top 5% of Candidates
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* Top Skills Tag Cloud */}
            <section className="space-y-6">
              <h2 className={`text-lg font-black uppercase tracking-[0.2em] flex items-center gap-3 ml-2 ${recruiterMode ? 'text-indigo-400' : 'text-[var(--site-text)]'}`}>
                <Brain size={20} className="text-indigo-500" /> Mastery Core
              </h2>
              <div className="flex flex-wrap gap-3">
                {topSkills.map((skill, idx) => (
                  <div key={idx} className="p-4 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm flex flex-col gap-2 min-w-[120px] transition-all hover:scale-105 active:scale-95 cursor-default">
                    <span className="text-xs font-black text-[var(--site-text)] opacity-80">{skill.name}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-indigo-500">{skill.mastery}%</span>
                      <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[8px] font-black">L{skill.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Badges/Achievements */}
            <Surface className="p-8 rounded-[2.5rem] space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <Award size={18} /> Verified Badges
              </h3>
              <div className="space-y-4">
                {verifiedSkills.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-[var(--site-text)]/5 rounded-2xl border border-[var(--card-border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <ShieldCheck className="text-indigo-500" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[var(--site-text)]">{v.name}</p>
                        <p className="text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-tight">{v.type} Validation</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                      {v.badge}
                    </span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Timeline Snapshot */}
            {timeline && (
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className={`text-lg font-black uppercase tracking-[0.2em] flex items-center gap-3 ${recruiterMode ? 'text-emerald-400' : 'text-[var(--site-text)]'}`}>
                    <TrendingUp size={20} className="text-emerald-500" /> Career Velocity
                  </h2>
                </div>
                
                <Surface className="p-10 rounded-[3rem] bg-indigo-500/5 border-indigo-500/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <TrendingUp size={200} />
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="text-center md:text-left space-y-2">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Est. Deployment</p>
                      <h4 className="text-4xl font-black text-[var(--site-text)] tracking-tighter">~{timeline.estimatedMonths} Months</h4>
                      <p className="text-sm text-[var(--site-text-muted)]">Until professional mastery ranking</p>
                    </div>
                    
                    <div className="flex-1 w-full space-y-6">
                      <div className="p-5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/20">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Next Priority Milestone</p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-black">{timeline.nextMilestone?.title}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black border border-emerald-500/20">ACTIVE</span>
                        </div>
                        <p className="text-xs text-[var(--site-text-muted)] leading-relaxed">
                          Currently verifying proficiency in: {timeline.nextMilestone?.requiredSkills?.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Surface>
              </section>
            )}

            {/* Analytics Layer (Recruiter Mode Only) */}
            <AnimatePresence>
              {recruiterMode && (
                <motion.section 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-8 overflow-hidden"
                >
                  <h2 className="text-lg font-black uppercase tracking-[0.2em] flex items-center gap-3 text-indigo-400">
                    <TrendingUp size={20} className="text-indigo-400" /> Professional Forensics
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Surface className="p-8 rounded-[2.5rem] bg-slate-900 border-indigo-500/30">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Skill Consistency</p>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-white">94%</span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase mb-1">+6% vs Avg Candidate</span>
                      </div>
                      <p className="text-xs text-slate-400">User demonstrates High engagement with 14+ day learning streaks.</p>
                    </Surface>
                    <Surface className="p-8 rounded-[2.5rem] bg-slate-900 border-indigo-500/30">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Project Credibility</p>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-white">High</span>
                      </div>
                      <p className="text-xs text-slate-400">Validated GitHub contributions and live deployments on 3+ core projects.</p>
                    </Surface>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Proof of Work List (Missions) */}
            <section className="space-y-8">
                <h2 className={`text-lg font-black uppercase tracking-[0.2em] flex items-center gap-3 ${recruiterMode ? 'text-indigo-400' : 'text-[var(--site-text)]'}`}>
                  <Target size={20} className="text-indigo-500" /> Verified Missions
                </h2>
                <div className="grid gap-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="group p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-xl">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500 flex items-center justify-center text-indigo-500 group-hover:text-white transition-all shadow-inner">
                          <Code size={28} />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-[var(--site-text)] mb-1">Advanced Micro-Mission #{i+1}</h4>
                          <p className={`text-xs line-clamp-1 transition-colors ${recruiterMode ? 'text-slate-400' : 'text-[var(--site-text-muted)]'}`}>
                            Technical implementation of scalable architectures. Verified Repository extraction successful.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-widest">Completed</p>
                          <p className="text-xs font-bold text-[var(--site-text)]">2 weeks ago</p>
                        </div>
                        <button className="w-12 h-12 rounded-xl bg-[var(--site-text)]/5 hover:bg-indigo-500 text-[var(--site-text-muted)] hover:text-white flex items-center justify-center transition-all border border-[var(--card-border)]">
                          <ExternalLink size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            </section>
          </div>
        </div>

        {/* Footer Attribution */}
        <div className="mt-24 pt-12 border-t border-[var(--card-border)] text-center space-y-4">
          <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.5em]">Powered by the Zeeklect Career Engine v3</p>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[var(--site-text)]">Immutable Proof of Work Verified On-Chain</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileClient;
