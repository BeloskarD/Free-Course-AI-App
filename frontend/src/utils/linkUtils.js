/**
 * URL Validator: Ensures links lead directly to courses, not search results.
 * This is part of the "Zero-Confusion" mission.
 */
export function isDirectCourseLink(url) {
  if (!url) return false;
  const u = url.toLowerCase();

  // 1. Platform-specific REQUIRED direct link patterns
  const strictPatterns = {
    udemy: /(\/course\/|\/c\/)[^\/]+/, // Allow /course/ or /c/
    coursera: /(\/learn\/|\/professional-certificate\/|\/specializations\/|\/degrees\/|\/guided-project\/)[^\/]+/, // Expanded Coursera patterns
    edx: /\/course\/[^\/]+/,
    pluralsight: /\/courses\/[^\/]+/,
    simplilearn: /\.com\/.*-training-/,
    youtube: /(watch\?v=[^&]+|youtu\.be\/[^\?\/]+|playlist\?list=[^&]+|youtube\.com\/@[^\/]+\/videos)/,
    github: /\/github\.com\/[^\/]+\/[^\/]+(\/blob\/|\/tree\/|#)?$/ // No search results
  };

  // 2. Global Anti-Patterns: These instantly invalidate a link
  const antiPatterns = [
    '/search?',
    '/search/',
    '/catalog',
    '/category',
    '/browse',
    '/topic/', // Often a category page
    '/directory',
    '/course-directory',
    'query=',
    'google.com/search',
    '/roadmap',
    '/signup',
    '/login',
    '#search',
    '?q=',
    '&q='
  ];

  if (antiPatterns.some(ap => u.includes(ap))) return false;

  // 3. Check platform-specific strict rules
  for (const platform in strictPatterns) {
    if (u.includes(platform)) {
      return strictPatterns[platform].test(u);
    }
  }

  // 4. Depth Guard: Real courses usually have path depth
  const pathParts = u.split('/').filter(p => p.length > 0 && !p.includes('://'));
  if (pathParts.length < 2) return false;

  return true;
}