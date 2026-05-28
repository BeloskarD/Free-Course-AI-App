/**
 * RESPONSE SHAPER FOR MONETIZED FEATURES
 * ======================================
 * Production-ready API contract for gated content.
 */

const CURIOSITY_HINTS = {
  interviewPrep: [
    "We detected a hidden weakness recruiters will likely test.",
    "One question pattern could catch you off guard — Pro reveals it.",
    "Your strongest skill has a surprising interview blind spot."
  ],
  intelligence: [
    "Hiring signals matched your profile this week.",
    "One company's requirements align unusually well with your skills.",
    "A recruiter pattern suggests you're closer than you think."
  ],
  graphEngine: [
    "Your skill graph reveals an unexpected connection.",
    "One skill gap is silently blocking 3 career paths.",
    "We found a pattern most candidates miss entirely."
  ],
  readiness: [
    "One missing skill is blocking multiple career opportunities.",
    "Your readiness trajectory suggests a breakthrough is near.",
    "A hidden gap is reducing your interview chances."
  ],
  radar: [
    "We found opportunities you haven't considered yet.",
    "One hidden match has a 90%+ skill overlap with your profile.",
    "A trending role fits your exact skill combination."
  ],
  resume: [
    "Your resume has optimization opportunities AI detected.",
    "One section change could increase recruiter response rates.",
    "AI found a positioning gap most candidates overlook."
  ],
  networkInsight: [
    "Warm paths to hiring managers were detected.",
    "Your network has untapped connections to target companies.",
    "Strategic outreach could accelerate your timeline significantly."
  ],
  general: [
    "There's more depth to uncover here.",
    "Your data reveals patterns worth exploring.",
    "The full picture could change your entire strategy."
  ]
};

export const getCuriosityHint = (featureArea = 'general') => {
  const hints = CURIOSITY_HINTS[featureArea] || CURIOSITY_HINTS.general;
  return hints[Math.floor(Math.random() * hints.length)];
};

export const shapeGatedResponse = (data, entitlements = {}, options = {}) => {
  const { tier = 'free', insightDetail = 'partial' } = entitlements;
  
  const isPartial = insightDetail === 'partial' || options.forcePartial;
  let locked = false;
  let message = options.message || "Full insights unlocked.";
  const partialCount = options.partialCount || 3;

  /**
   * Recursive Masking Helper
   */
  const maskData = (input, currentKey = null, isBranchLocked = false) => {
    // Determine if this specific branch is locked
    const currentlyLocked = isBranchLocked || (currentKey && options.keysToLock?.includes(currentKey));

    if (!input) return input;





    // Handle Arrays
    if (Array.isArray(input)) {
      const sliced = input.slice(0, partialCount);
      return sliced.map(item => maskData(item, currentKey, currentlyLocked));
    }

    // Handle Objects
    if (typeof input === 'object' && input !== null) {
      const masked = { ...input };
      
      Object.keys(masked).forEach(key => {
        const isChildLocked = currentlyLocked || options.keysToLock?.includes(key);
        
        if (typeof masked[key] === 'object' && masked[key] !== null) {
          masked[key] = maskData(masked[key], key, isChildLocked);
        } else if (isChildLocked) {
          // Mask primitive values if the branch or the key itself is locked
          masked[key] = options.maskValue || "[LOCKED]";
        }
      });
      return masked;
    }

    return input;
  };

  let finalData = data;
  if (isPartial && data) {
    locked = true;
    message = options.lockedMessage || "Upgrade to unlock full industry insights and roadmap depth.";
    finalData = maskData(data);
  }

  const response = {
    success: true,
    locked,
    tier,
    message,
    curiosityHint: locked ? getCuriosityHint(options.featureArea || 'general') : null,
    upgradeHint: options.upgradeHint || "Unlock 100% of your career potential with Pro.",
    remainingLockedItems: Array.isArray(data) ? Math.max(0, data.length - partialCount) : 0,
    progressPercent: options.progressPercent || 100
  };

  // 🔄 Flattening for backward compatibility: 
  // Spreads data keys (nodes, links, etc.) into the root of the response.
  if (typeof finalData === 'object' && finalData !== null && !Array.isArray(finalData)) {
    return { ...response, ...finalData };
  }

  return {
    ...response,
    data: finalData
  };
};
