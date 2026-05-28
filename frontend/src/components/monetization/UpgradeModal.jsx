import { useUpgradeModal } from '../../hooks/useUpgradeModal';
import { useCheckout } from '../../hooks/useCheckout';
import { Zap, X, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { analytics } from '../../lib/analytics';

export const UpgradeModal = () => {
  const { isOpen, featureName, upgradeHint, limitReached, targetTier, closeModal } = useUpgradeModal();
  const { handleUpgrade, isProcessing } = useCheckout();

  if (!isOpen) return null;

  const onUpgradeClick = () => {
    analytics.upgradeClick(`modal_${featureName}`, targetTier, { limit_reached: limitReached });
    closeModal();
    // FIXED: Direct Stripe checkout instead of routing to /pricing
    handleUpgrade(targetTier, `modal_${featureName}`);
  };

  const isCareerPlus = targetTier === 'career_plus';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-20 sm:pt-24 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl transition-opacity"
        onClick={closeModal}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 scrollbar-hide">
        
        {/* Header Graphic */}
        <div className={`relative h-32 w-full flex items-center justify-center overflow-hidden ${
          isCareerPlus 
            ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-amber-500' 
            : 'bg-gradient-to-br from-indigo-500 to-blue-600'
        }`}>
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl transform -rotate-6">
            {limitReached ? <AlertTriangle size={32} className="text-white" /> : <Zap size={32} className="text-white fill-white/20" />}
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={closeModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-sm"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="p-5 md:p-8 text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-[var(--site-text)]">
              {limitReached ? "You've Hit Today's Limit" : "There's More to Discover"}
            </h3>
            <p className="text-xs md:text-sm font-medium leading-relaxed text-[var(--site-text-muted)]">
              {upgradeHint || (isCareerPlus 
                ? `Career+ reveals the strategic intelligence behind ${featureName}.`
                : `Pro unlocks the full depth of ${featureName}.`
              )}
            </p>
          </div>

          <div className="space-y-3 text-left bg-[var(--site-text)]/[0.03] rounded-2xl p-4 border border-[var(--card-border)]">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">What you unlock</h4>
            <ul className="space-y-2">
               {isCareerPlus ? (
                 <>
                   <li className="flex items-start gap-2 text-xs font-semibold text-[var(--site-text)]"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Predictive hiring probability scores</li>
                   <li className="flex items-start gap-2 text-xs font-semibold text-[var(--site-text)]"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Strategic career scenarios & weakness maps</li>
                   <li className="flex items-start gap-2 text-xs font-semibold text-[var(--site-text)]"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Recruiter-style intelligence & outreach</li>
                 </>
               ) : (
                 <>
                   <li className="flex items-start gap-2 text-xs font-semibold text-[var(--site-text)]"><CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" /> Full skill gap analysis with exact roadmaps</li>
                   <li className="flex items-start gap-2 text-xs font-semibold text-[var(--site-text)]"><CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" /> Interview prep with recruiter reasoning</li>
                   <li className="flex items-start gap-2 text-xs font-semibold text-[var(--site-text)]"><CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" /> 10x higher AI usage limits</li>
                 </>
               )}
            </ul>
          </div>

          <button
            onClick={onUpgradeClick}
            disabled={isProcessing}
            className={`w-full group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3.5 md:px-6 md:py-4 font-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer ${
              isCareerPlus
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 text-white shadow-xl shadow-purple-500/20'
                : 'bg-[var(--site-text)] text-[var(--site-bg)]'
            }`}
          >
            {isCareerPlus && <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay" />}
            <span className="relative z-10 uppercase tracking-widest text-[10px] md:text-sm">
              {isProcessing ? 'Opening Checkout...' : (isCareerPlus ? 'Unlock Strategic Intelligence' : 'Reveal Full Insights')}
            </span>
            <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-1" />
          </button>

          <p className="text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-widest">
            Secure checkout · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
