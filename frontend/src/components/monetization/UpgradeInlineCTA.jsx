import { useCheckout } from '../../hooks/useCheckout';
import { Lock, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { analytics } from '../../lib/analytics';

export const UpgradeInlineCTA = ({ 
  tier = 'pro', 
  title, 
  subtitle, 
  progress = 0, 
  stepsLeft = 0, 
  source = 'inline_cta',
  isCompact = false
}) => {
  const { handleUpgrade, isProcessing } = useCheckout();

  const onUpgradeClick = () => {
    analytics.ctaClickedInline(source, tier);
    handleUpgrade(tier, source);
  };

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 ${isCompact ? 'p-5' : 'p-6 md:p-8'} shadow-2xl backdrop-blur-sm`}>
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
      
      <div className={`relative z-10 flex flex-col ${isCompact ? '' : 'xl:flex-row xl:items-center'} justify-between gap-6 md:gap-8`}>
        
        {/* Left: Progress & Messaging */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
              <Lock size={18} className="text-indigo-500" />
            </div>
            <div className="flex-1">
              <h3 className={`${isCompact ? 'text-base' : 'text-lg'} font-black text-[var(--site-text)] tracking-tight leading-tight`}>{title || "Your Next Breakthrough Is Hidden"}</h3>
              <p className="text-[11px] font-semibold text-[var(--site-text-muted)] leading-relaxed mt-1">{subtitle || "Reveal the insights blocking your fastest path to job readiness."}</p>
            </div>
          </div>

          {progress > 0 && (
             <div className="space-y-2 mt-4">
               <div className="flex justify-between items-end">
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Readiness</span>
                 <span className="text-xs font-black text-[var(--site-text)]">{progress}%</span>
               </div>
               <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--site-text)]/5">
                 <div 
                   className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                   style={{ width: `${progress}%` }}
                 />
               </div>
               {stepsLeft > 0 && (
                  <p className="text-[10px] font-bold text-[var(--site-text-muted)] flex items-center gap-1.5 pt-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {stepsLeft} skills away from market-ready.
                  </p>
               )}
             </div>
          )}
        </div>

        {/* Right: Action */}
        <div className={`shrink-0 flex flex-col items-center ${isCompact ? '' : 'xl:items-end'} gap-3 w-full ${isCompact ? '' : 'xl:w-auto'}`}>
           <button
             onClick={onUpgradeClick}
             disabled={isProcessing}
             className={`w-full ${isCompact ? '' : 'xl:w-auto'} group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--site-text)] px-8 py-4 font-black text-[var(--site-bg)] transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 cursor-pointer`}
           >
             <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100" />
             <Zap size={18} className="relative z-10" />
             <span className="relative z-10 uppercase tracking-widest text-xs whitespace-nowrap">
               {isProcessing ? 'Opening Checkout...' : (tier === 'career_plus' ? 'Unlock Intelligence' : 'Reveal Full Path')}
             </span>
             <ArrowRight size={16} className="relative z-10 ml-1 transition-transform group-hover:translate-x-1" />
           </button>
           <p className={`text-[9px] font-bold text-[var(--site-text-muted)] uppercase tracking-widest text-center ${isCompact ? '' : 'xl:text-right'}`}>
             Secure checkout · Cancel anytime
           </p>
        </div>

      </div>
    </div>
  );
};

export default UpgradeInlineCTA;
