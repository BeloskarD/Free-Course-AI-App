import { useEffect } from 'react';
import { analytics } from '../../lib/analytics';
import { UpgradeInlineCTA } from './UpgradeInlineCTA';

export const LockedOverlay = ({ 
  featureName, 
  tier = 'pro', 
  title = "Insight Locked",
  message, 
  progress, 
  stepsLeft,
  children,
  className = ""
}) => {

  useEffect(() => {
    analytics.lockedView(featureName, { tier_required: tier });
  }, [featureName, tier]);

  return (
    <div className={`relative group/locked overflow-hidden rounded-[2.5rem] ${className}`}>
      {/* Blurred Content Behind */}
      <div className="select-none blur-[6px] opacity-40 transition-all duration-700 group-hover/locked:blur-[8px] group-hover/locked:opacity-20 pointer-events-none">
        {children}
      </div>

      {/* Overlay Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 md:p-12 bg-gradient-to-t from-[var(--card-bg)] via-[var(--card-bg)]/80 to-transparent">
         <div className="w-full max-w-2xl mt-auto">
            <UpgradeInlineCTA 
              tier={tier}
              title={title}
              subtitle={message}
              progress={progress}
              stepsLeft={stepsLeft}
              source={`locked_overlay_${featureName}`}
            />
         </div>
      </div>
    </div>
  );
};

export default LockedOverlay;
