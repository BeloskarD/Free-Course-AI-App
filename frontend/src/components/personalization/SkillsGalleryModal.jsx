'use client';
import { X, Target, Zap, TrendingUp, Award, BookOpen, Clock, ArrowRight } from 'lucide-react';
import Surface from '../ui/Surface';
import { humanizeSkillName } from '../../utils/stringUtils';

export default function SkillsGalleryModal({ isOpen, onClose, skills = [], topToLearn = [] }) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[10001] flex p-4 sm:px-6 md:px-8 overflow-hidden animate-in fade-in duration-500"
            onClick={onClose}
        >
            {/* Extreme Elite Backdrop */}
            <div className="absolute inset-0 bg-black/90 dark:bg-black/95 backdrop-blur-xl" />

            {/* Layout Wrapper to center relative to sidebar */}
            <div className="relative w-full h-full flex items-start justify-center max-lg:pl-0 lg:pl-[var(--sidebar-offset,0px)] pt-24 pb-6 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500 mx-auto">
                
                <Surface 
                    className="w-full h-full max-w-3xl max-h-[85vh] flex flex-col rounded-[2rem] sm:rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group animate-in zoom-in-95 duration-500 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Ambient Glows */}
                    <div className="absolute -right-40 -top-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute -left-40 -bottom-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

                    {/* Header */}
                    <div className="relative z-50 p-5 sm:p-8 flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl shrink-0">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Award size={20} className="text-white sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-2xl font-black text-[var(--site-text)] tracking-tighter truncate">
                                    Skill Intelligence
                                </h2>
                                <p className="text-[9px] sm:text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60 truncate">
                                    Mastery Overview
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 shrink-0 rounded-xl bg-[var(--site-text)]/5 hover:bg-rose-500/10 text-[var(--site-text-muted)] hover:text-rose-500 flex items-center justify-center transition-all btn-tactile border border-[var(--card-border)] cursor-pointer active:scale-90 ml-2"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto premium-scroll px-6 sm:px-10 py-8 space-y-10">
                        
                        {/* 📊 Mastered Skills Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-indigo-500/20 flex items-center gap-2">
                                    <Zap size={12} />
                                    Current Mastery
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-[var(--card-border)] to-transparent" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {skills.length > 0 ? (
                                    skills.map((skill, idx) => (
                                        <div key={idx} className="p-5 rounded-3xl bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] hover:border-indigo-500/30 transition-all group/skill">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-[var(--site-text)]">{humanizeSkillName(skill.name)}</span>
                                                <span className="text-xs font-black text-indigo-500">{skill.level}%</span>
                                            </div>
                                            <div className="h-2 bg-[var(--site-text)]/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${skill.level}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-3 opacity-0 group-hover/skill:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-bold text-[var(--site-text-muted)] flex items-center gap-1 uppercase tracking-tighter">
                                                    <Clock size={10} /> Last: {skill.lastPracticed ? new Date(skill.lastPracticed).toLocaleDateString() : 'Never'}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                    skill.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                    skill.confidence === 'medium' ? 'bg-amber-500/10 text-amber-500' : 
                                                    'bg-indigo-500/10 text-indigo-500'
                                                }`}>
                                                    {skill.confidence || 'low'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 text-center bg-[var(--site-text)]/[0.02] rounded-3xl border-2 border-dashed border-[var(--card-border)]">
                                        <p className="text-sm text-[var(--site-text-muted)] font-medium">No skills tracked yet. Start a session to build your profile.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 🎯 Career Gaps / Focus Areas */}
                        <section className="space-y-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-amber-500/20 flex items-center gap-2">
                                    <Target size={12} />
                                    Growth Gaps
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-[var(--card-border)] to-transparent" />
                            </div>

                            <div className="grid gap-3">
                                {topToLearn.length > 0 ? (
                                    topToLearn.map((skill, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20 group hover:border-amber-500 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                                    <BookOpen size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[var(--site-text)]">{humanizeSkillName(skill.name || skill)}</p>
                                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">{skill.priority || 'High'} Priority Gap</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="hidden sm:block text-[10px] font-black text-amber-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Find Resources</span>
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                    <ArrowRight size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-[var(--site-text-muted)] text-center py-6">All target skills are currently aligned with your goals.</p>
                                )}
                            </div>
                        </section>

                    </div>

                    {/* Footer / CTA */}
                    <div className="p-6 sm:p-8 border-t border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl shrink-0 flex items-center justify-center">
                        <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.4em] text-center opacity-40">
                            Zeeklect Intelligence Engine v4.2
                        </p>
                    </div>
                </Surface>
            </div>
        </div>
    );
}
