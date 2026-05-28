"use client";

import { CheckCircle2, Zap, Target, Shield } from "lucide-react";
import { useCheckout } from "../../hooks/useCheckout";
import { analytics } from "../../lib/analytics";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function PricingPage() {
  const { handleUpgrade, isProcessing } = useCheckout();
  const { user } = useAuth();
  const currentTier = user?.subscriptionTier || 'free';

  useEffect(() => {
    analytics.track('pricing_page_viewed');
  }, []);

  const onCheckoutClick = (tier) => {
    analytics.upgradeClick('pricing_page', tier);
    handleUpgrade(tier, 'pricing_page');
  };

  return (
    <div className="min-h-screen bg-[var(--site-bg)] selection:bg-indigo-500/30">
      
      <main className="relative z-10 pt-8 sm:pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 sm:mb-4">
            <Zap size={14} className="fill-indigo-500" />
            Zeeklect Career OS
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--site-text)] tracking-tighter leading-tight">
            See what&apos;s hidden in your career data.
          </h1>
          <p className="text-lg md:text-xl text-[var(--site-text-muted)] font-medium leading-relaxed max-w-2xl mx-auto">
            Free shows you awareness. Pro gives you guidance. Career+ delivers strategic intelligence that changes outcomes.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-end">
          
          {/* Free Tier — Awareness */}
          <div className="p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} className="text-[var(--site-text-muted)]" />
              <h3 className="text-xl font-black text-[var(--site-text)] tracking-tight">Free</h3>
            </div>
            <p className="text-sm font-medium text-[var(--site-text-muted)] h-10">See where you stand.</p>
            <div className="my-8">
              <span className="text-5xl font-black text-[var(--site-text)]">$0</span>
              <span className="text-[var(--site-text-muted)] font-medium">/mo</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-sm font-medium text-[var(--site-text)]"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Skill awareness & basic tracking</li>
              <li className="flex gap-3 text-sm font-medium text-[var(--site-text)]"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> 5 AI chat messages/day</li>
              <li className="flex gap-3 text-sm font-medium text-[var(--site-text)]"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Partial skill gap results</li>
              <li className="flex gap-3 text-sm font-medium text-[var(--site-text)]"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> 2 interview prep questions</li>
            </ul>
            <button disabled className="w-full py-4 rounded-2xl bg-[var(--site-text)]/5 text-[var(--site-text)] font-black uppercase tracking-widest text-xs">
              {currentTier === 'free' ? 'Current Plan' : 'Free Tier'}
            </button>
          </div>

          {/* Career+ Tier (Dominant) — Strategic Intelligence */}
          <div className="relative p-10 rounded-[3rem] bg-gradient-to-b from-[var(--card-bg)] to-[var(--card-bg)] border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 transform md:-translate-y-4 z-10 overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl -mr-32 -mt-32 rounded-full pointer-events-none" />
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-widest">
              {currentTier === 'career_plus' ? '✓ Active' : 'Best Value'}
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2 mt-2">
                <Target size={24} className="text-indigo-500" />
                <h3 className="text-2xl font-black text-[var(--site-text)] tracking-tight">Career+</h3>
              </div>
              <p className="text-sm font-medium text-[var(--site-text-muted)] h-10">Strategic intelligence that changes outcomes.</p>
              
              <div className="my-8">
                <span className="text-6xl font-black text-[var(--site-text)] tracking-tighter">$49</span>
                <span className="text-[var(--site-text-muted)] font-medium">/mo</span>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex gap-3 text-sm font-bold text-[var(--site-text)]"><CheckCircle2 size={20} className="text-emerald-500 shrink-0" /> Predictive hiring probability scores</li>
                <li className="flex gap-3 text-sm font-bold text-[var(--site-text)]"><CheckCircle2 size={20} className="text-emerald-500 shrink-0" /> Recruiter-style intelligence & reasoning</li>
                <li className="flex gap-3 text-sm font-bold text-[var(--site-text)]"><CheckCircle2 size={20} className="text-emerald-500 shrink-0" /> Network intelligence & warm paths</li>
                <li className="flex gap-3 text-sm font-bold text-[var(--site-text)]"><CheckCircle2 size={20} className="text-emerald-500 shrink-0" /> AI-powered outreach generation</li>
                <li className="flex gap-3 text-sm font-bold text-[var(--site-text)]"><CheckCircle2 size={20} className="text-emerald-500 shrink-0" /> Everything in Pro, plus strategic scenarios</li>
              </ul>

              <button 
                onClick={() => onCheckoutClick('career_plus')}
                disabled={isProcessing || currentTier === 'career_plus'}
                className="w-full relative group/btn flex items-center justify-center overflow-hidden rounded-2xl bg-[var(--site-text)] px-8 py-5 font-black text-[var(--site-bg)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
                <span className="relative z-10 uppercase tracking-widest text-sm">
                  {currentTier === 'career_plus' ? 'Active Plan' : (isProcessing ? 'Opening Checkout...' : 'Unlock Strategic Intelligence')}
                </span>
              </button>
            </div>
          </div>

          {/* Pro Tier — Guidance */}
          <div className="p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} className="text-indigo-500" />
              <h3 className="text-xl font-black text-[var(--site-text)] tracking-tight">Pro</h3>
            </div>
            <p className="text-sm font-medium text-[var(--site-text-muted)] h-10">Full guidance to accelerate your path.</p>
            <div className="my-8">
              <span className="text-5xl font-black text-[var(--site-text)]">$19</span>
              <span className="text-[var(--site-text-muted)] font-medium">/mo</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3 text-sm font-medium text-[var(--site-text)]"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Full skill gap analysis & roadmaps</li>
              <li className="flex gap-3 text-sm font-medium text-[var(--site-text)]"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Interview prep with recruiter reasoning</li>
              <li className="flex gap-3 text-sm font-medium text-[var(--site-text)]"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> 50 AI chat messages/day</li>
              <li className="flex gap-3 text-sm font-medium text-[var(--site-text)]"><CheckCircle2 size={18} className="text-indigo-500 shrink-0" /> Full mastery scores & decay tracking</li>
            </ul>
            <button 
              onClick={() => onCheckoutClick('pro')}
              disabled={isProcessing || currentTier === 'pro' || currentTier === 'career_plus'}
              className="w-full py-4 rounded-2xl bg-[var(--site-text)]/10 text-[var(--site-text)] font-black uppercase tracking-widest text-xs hover:bg-[var(--site-text)]/20 transition-colors disabled:opacity-50"
            >
              {currentTier === 'pro' ? 'Active Plan' : (currentTier === 'career_plus' ? 'Included' : (isProcessing ? 'Opening Checkout...' : 'Reveal Full Insights'))}
            </button>
          </div>

        </div>

        {/* Trust Signals */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--site-text-muted)] opacity-60">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} /> Cancel Anytime</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} /> Secure Checkout</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={16} /> Instant Access</div>
        </div>

      </main>
    </div>
  );
}
