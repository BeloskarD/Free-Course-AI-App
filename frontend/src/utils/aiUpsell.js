/**
 * AI UPSELL INJECTION — Curiosity-driven, context-aware
 * Rules: Natural voice, specific to context, creates desire for depth.
 */
export const injectUpsellMessage = (response, tier, featureContext = 'general') => {
  if (!response || tier !== 'free') return response;

  const upsellMessages = {
    validation: "\n\n*(Your strongest missing skill surprised us. Pro reveals the exact bridge plan.)*",
    timeline: "\n\n*(We mapped a faster path — Pro unlocks the week-by-week predictive roadmap.)*",
    radar: "\n\n*(One hidden opportunity has a 90%+ match. Unlock the full radar with Pro.)*",
    intelligence: "\n\n*(A recruiter pattern suggests something unusual. Pro reveals the full signal.)*",
    interviewPrep: "\n\n*(We detected a weakness most candidates miss. Pro shows exactly how to fix it.)*",
    resume: "\n\n*(AI found 2 positioning gaps in your resume. Pro reveals the exact fixes.)*",
    general: "\n\n*(There's more depth here than what's shown. Pro unlocks the complete analysis.)*"
  };

  const message = upsellMessages[featureContext] || upsellMessages.general;
  
  // If response is a string (e.g. chat text)
  if (typeof response === 'string') {
    // Only append if it's long enough to warrant an upsell (don't spam small answers)
    if (response.length > 150 && !response.includes('*(')) {
      return response + message;
    }
    return response;
  }

  // If response is an object with a text/message field
  if (typeof response === 'object' && response !== null) {
    if (response.message && typeof response.message === 'string' && response.message.length > 150) {
       return {
         ...response,
         message: response.message + message
       };
    }
  }

  return response;
};
