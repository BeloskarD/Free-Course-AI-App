import { Lock } from 'lucide-react';
import { analytics } from '../../lib/analytics';
import { upgradeModalActions } from '../../hooks/useUpgradeModal';

const CURIOSITY_COPY = {
  'Skill Graph': 'One skill connection could accelerate your progress 2x.',
  'Mastery Score': 'Your strongest skill has a surprising blind spot.',
  'Career Radar': 'A hidden opportunity matches your exact profile.',
  'Readiness Score': 'One gap is blocking multiple career paths.',
  'Interview Prep': 'We detected a weakness recruiters will likely test.',
  'Network Intelligence': 'Warm paths to hiring managers were detected.',
  'Evolution Timeline': 'Your skill trajectory suggests a breakthrough is near.',
};

export const BlurCard = ({ 
  title = "Advanced Metric", 
  tier = "pro", 
  featureName = "unknown",
  isLocked = true,
  children,
  className = ""
}) => {
  const onClick = () => {
    if (!isLocked) return;
    analytics.ctaClickedInline(`blur_card_${featureName}`, tier);
    upgradeModalActions.open({
      featureName: title,
      targetTier: tier,
      upgradeHint: CURIOSITY_COPY[title] || `See what's hidden behind ${title} — unlock with ${tier === 'career_plus' ? 'Career+' : 'Pro'}.`
    });
  };

  if (!isLocked) return <>{children}</>;

  return (
    <div 
      onClick={onClick}
      className={`relative rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden group cursor-pointer transition-all duration-300 hover:border-indigo-500/50 hover:shadow-xl min-h-[130px] flex items-center justify-center ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Blurred content or children */}
      <div className="w-full select-none blur-[6px] opacity-40 transition-all duration-700 group-hover:blur-[8px] group-hover:opacity-20 pointer-events-none">
        {children ? children : (
          <div className="p-8 space-y-4">
            <div className="h-4 w-1/3 rounded-full bg-[var(--site-text)]" />
            <div className="h-10 w-2/3 rounded-xl bg-[var(--site-text)]" />
            <div className="h-2 w-full rounded-full bg-[var(--site-text)]" />
          </div>
        )}
      </div>

      {/* Lock overlay with curiosity copy */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 p-4">
         <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
            <Lock size={16} className="text-indigo-500" />
         </div>
         <span className="mt-2 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider md:tracking-widest text-[var(--site-text)] transition-all duration-300 group-hover:text-indigo-500 text-center px-2 max-w-[280px] leading-tight">
           {CURIOSITY_COPY[title] || `Reveal ${title}`}
         </span>
      </div>
    </div>
  );
};

export default BlurCard;
