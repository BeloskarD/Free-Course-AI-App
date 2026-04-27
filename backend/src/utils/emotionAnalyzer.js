/**
 * EMOTION ANALYZER - EQ-AI Companion Module
 * Detects user emotional states from messages and context
 * 
 * Emotions tracked:
 * - frustration: User is struggling and getting annoyed
 * - overwhelm: User feels there's too much to learn
 * - confusion: User doesn't understand the topic
 * - celebration: User just achieved something
 * - loneliness: User hasn't interacted in a while
 * - encouragement_needed: User needs a motivational boost
 */

// Frustration indicators in text
const FRUSTRATION_PATTERNS = [
    /i (don'?t|dont) (get|understand)/i,
    /this (is|makes) no sense/i,
    /what the (heck|hell|f)/i,
    /i'?m so (frustrated|stuck)/i,  // Note: 'confused' and 'lost' moved to CONFUSION_PATTERNS
    /nothing (is )?work(s|ing)?/i,
    /why (won'?t|doesn'?t|isn'?t)/i,
    /i (give up|quit|can'?t do this)/i,
    /this is (too )?hard/i,
    /i('?m| am) (so )?stuck/i,
    /ugh|argh|grrr/i,
    /hate this/i,
    /keeps? (breaking|failing|erroring)/i,
    /tried everything/i,
    /still (not|doesn'?t) work/i,
    // Enhanced patterns for better detection
    /so frustrat/i,                          // Matches "so frustrating", "so frustrated"
    /(this is|i'?m) frustrat/i,              // Matches "this is frustrating", "I'm frustrated"
    /(keep|keeps|kept) (getting|seeing|having) error/i,  // Matches "keep getting errors"
    /not working/i,                          // Matches "not working"
    /doesn'?t work/i,                        // Matches "doesn't work"
    /angry|furious|mad/i,                    // Anger expressions
    /can'?t (figure|work|get|do|make)/i,     // Matches "can't figure out"
    /what('?s| is) wrong/i,                  // Matches "what's wrong"
    /error(s)? (again|every)/i,              // Matches "errors again"
    /never (work|get|understand)/i,          // Matches "never works"
    /this (sucks|stinks)/i,                  // Informal frustration
    /impossible/i,                           // Expressing impossibility
    /wasted? (my |so much )?time/i,          // Time wasted frustration
];

// Confusion indicators
const CONFUSION_PATTERNS = [
    /what (does|is|are) .+ mean/i,
    /i (don'?t|dont) understand/i,
    /can you explain/i,
    /what'?s the difference/i,
    /i'?m (confused|lost)/i,
    /makes? no sense/i,
    /huh\??/i,
    /what\?+/i,
    /how (does|do|is) (this|that|it)/i,
    /not sure (what|how|why)/i,
    // Enhanced confusion patterns
    /confus(ed|ing)/i,                    // Matches "confused", "confusing"
    /(i am|i'm|so) (confused|lost)/i,     // Matches "I am confused", "I'm lost"
    /don'?t (get|understand) (it|this|that)/i,  // Matches "don't get it"
    /lost here/i,                         // Matches "I'm lost here"
    /unclear/i,                           // Matches "unclear"
    /what do you mean/i,                  // Request for clarification
    /help me understand/i,                // Request for help understanding
];

// Overwhelm indicators
const OVERWHELM_PATTERNS = [
    /too much/i,
    /so many (things?|topics?|concepts?)/i,
    /overwhelming/i,
    /where (do i|should i) (even )?start/i,
    /don'?t know where to begin/i,
    /feels? (like )?impossible/i,
    /never (going to|gonna) (learn|finish|get)/i,
    /so (much|many) to learn/i,
    /i'?ll never/i,
];

// Celebration/positive indicators
const CELEBRATION_PATTERNS = [
    /i (did|got) it/i,
    /it work(s|ed)/i,
    /finally/i,
    /yes!+/i,
    /yay/i,
    /awesome/i,
    /thank(s| you)/i,
    /that (helped|makes sense|worked)/i,
    /i understand now/i,
    /got it/i,
    /makes sense/i,
    /perfect/i,
    /great/i,
];

// Loneliness/need for connection patterns
const LONELINESS_PATTERNS = [
    /anyone (there|here)/i,
    /feeling alone/i,
    /no one to (ask|help|talk)/i,
    /wish (i|there) (had|was|were)/i,
    /learning (by|on) (my own|myself)/i,
    /lonely/i,
];

/**
 * Analyze message text for emotional indicators
 * @param {string} message - User's message
 * @returns {object} Emotional signals detected
 */
function analyzeTextSentiment(message) {
    if (!message || typeof message !== 'string') {
        return { frustration: 0, confusion: 0, overwhelm: 0, celebration: 0, loneliness: 0 };
    }

    const text = message.toLowerCase();

    // Count pattern matches
    const frustrationMatches = FRUSTRATION_PATTERNS.filter(p => p.test(text)).length;
    const confusionMatches = CONFUSION_PATTERNS.filter(p => p.test(text)).length;
    const overwhelmMatches = OVERWHELM_PATTERNS.filter(p => p.test(text)).length;
    const celebrationMatches = CELEBRATION_PATTERNS.filter(p => p.test(text)).length;
    const lonelinessMatches = LONELINESS_PATTERNS.filter(p => p.test(text)).length;

    // Check for excessive punctuation (sign of emotion)
    const excessivePunctuation = (text.match(/[!?]{2,}/g) || []).length;
    const allCaps = text === text.toUpperCase() && text.length > 5;

    // Calculate scores (0-1 scale)
    return {
        frustration: Math.min(1, (frustrationMatches * 0.3) + (excessivePunctuation * 0.1) + (allCaps ? 0.2 : 0)),
        confusion: Math.min(1, confusionMatches * 0.3),
        overwhelm: Math.min(1, overwhelmMatches * 0.35),
        celebration: Math.min(1, celebrationMatches * 0.3),
        loneliness: Math.min(1, lonelinessMatches * 0.4),
    };
}

/**
 * Analyze behavioral context for emotional signals
 * @param {object} context - User's behavioral context
 * @returns {object} Behavioral emotional signals
 */
function analyzeBehavioralContext(context) {
    const signals = {
        frustration: 0,
        overwhelm: 0,
        encouragement_needed: 0,
        celebration: 0,
    };

    if (!context) return signals;

    const {
        sessionDuration = 0,
        errorsThisSession = 0,
        consecutiveErrors = 0,
        daysSinceLastLogin = 0,
        velocityTrend = 'stable',
        recentSuccess = false,
        attemptsOnCurrentProblem = 0,
    } = context;

    // Long session without breaks → potential overwhelm/frustration
    if (sessionDuration > 60) { // More than 60 minutes
        signals.overwhelm += 0.3;
        signals.frustration += 0.2;
    }

    // Multiple errors → frustration
    if (errorsThisSession > 5) {
        signals.frustration += 0.3;
    }
    if (consecutiveErrors > 3) {
        signals.frustration += 0.4;
    }

    // Many attempts on same problem → frustration
    if (attemptsOnCurrentProblem > 5) {
        signals.frustration += 0.3;
    }

    // Days since login → might need encouragement
    if (daysSinceLastLogin > 3 && daysSinceLastLogin <= 7) {
        signals.encouragement_needed += 0.4;
    } else if (daysSinceLastLogin > 7) {
        signals.encouragement_needed += 0.7;
    }

    // Velocity declining → might be struggling
    if (velocityTrend === 'slowing') {
        signals.encouragement_needed += 0.3;
        signals.overwhelm += 0.2;
    }

    // Recent success → celebration time!
    if (recentSuccess) {
        signals.celebration += 0.5;
    }

    return signals;
}

/**
 * Determine the primary emotion and confidence
 * @param {object} textSignals - Signals from text analysis
 * @param {object} behaviorSignals - Signals from behavior analysis
 * @returns {object} Primary emotion and confidence
 */
function determinePrimaryEmotion(textSignals, behaviorSignals) {
    // Combine signals with text weighted slightly higher
    const combined = {
        frustration: (textSignals.frustration * 0.7) + (behaviorSignals.frustration * 0.3),
        confusion: textSignals.confusion * 0.9, // Confusion is mostly text-based
        overwhelm: (textSignals.overwhelm * 0.6) + (behaviorSignals.overwhelm * 0.4),
        celebration: (textSignals.celebration * 0.6) + (behaviorSignals.celebration * 0.4),
        loneliness: textSignals.loneliness * 0.9,
        encouragement_needed: behaviorSignals.encouragement_needed || 0,
    };

    // Find the highest scoring emotion
    let primaryEmotion = 'neutral';
    let highestScore = 0.25; // Threshold for detecting any emotion

    for (const [emotion, score] of Object.entries(combined)) {
        if (score > highestScore) {
            highestScore = score;
            primaryEmotion = emotion;
        }
    }

    return {
        primary: primaryEmotion,
        confidence: highestScore,
        all: combined,
    };
}

/**
 * Get emotional response configuration
 * @param {string} emotion - Detected primary emotion
 * @returns {object} Response configuration
 */
function getEmotionalResponseConfig(emotion) {
    const responses = {
        frustration: {
            tone: 'empathetic',
            systemPromptAddition: `
The user seems frustrated. Your response should:
1. Acknowledge their struggle empathetically
2. Offer to try a different approach
3. Break down the problem into smaller steps
4. Be encouraging without being dismissive
5. Maybe suggest taking a short break if they've been at it long

Use phrases like:
- "I can see this is challenging. Let's tackle it differently."
- "It's completely normal to feel stuck here - many learners do."
- "Let's break this down step by step."
- "Would it help if we approached this from another angle?"
`,
            suggestedActions: [
                { text: "Let's try a simpler approach", icon: "🎯" },
                { text: "Take a 5-minute break", icon: "☕" },
                { text: "Explain it differently", icon: "💡" },
            ],
        },
        confusion: {
            tone: 'patient',
            systemPromptAddition: `
The user is confused about something. Your response should:
1. Acknowledge that the concept can be tricky
2. Use simpler language and analogies
3. Ask clarifying questions to pinpoint the confusion
4. Provide a very clear, step-by-step explanation
5. Check understanding before moving forward

Use phrases like:
- "Let me explain this in a different way."
- "Think of it like this..."
- "Which part specifically is throwing you off?"
- "That's a common point of confusion - here's why..."
`,
            suggestedActions: [
                { text: "Explain like I'm 5", icon: "👶" },
                { text: "Give me an example", icon: "📝" },
                { text: "What should I know first?", icon: "📚" },
            ],
        },
        overwhelm: {
            tone: 'calming',
            systemPromptAddition: `
The user is feeling overwhelmed. Your response should:
1. Be reassuring and calming
2. Help them focus on just ONE thing
3. Suggest reducing scope or taking a break
4. Remind them of progress they've made
5. Validate that learning takes time

Use phrases like:
- "Let's take a breath and focus on just one thing."
- "You don't need to learn everything at once."
- "How about we break this into smaller pieces?"
- "What if we just tackle the most essential part first?"
- "Learning is a marathon, not a sprint. You're doing great."
`,
            suggestedActions: [
                { text: "Focus on one thing only", icon: "🎯" },
                { text: "What's the minimum I need?", icon: "✂️" },
                { text: "Take a break", icon: "🧘" },
            ],
        },
        celebration: {
            tone: 'excited',
            systemPromptAddition: `
The user just succeeded or understood something! Your response should:
1. Celebrate their achievement enthusiastically
2. Reinforce what they learned
3. Encourage them to keep the momentum
4. Suggest what to tackle next
5. Be genuinely happy for them

Use phrases like:
- "🎉 Awesome work! You nailed it!"
- "See? You've got this!"
- "That's a big win! Let's build on it."
- "You should be proud - that's not an easy concept!"
`,
            suggestedActions: [
                { text: "What's next to learn?", icon: "🚀" },
                { text: "Quiz me on this", icon: "📝" },
                { text: "Show my progress", icon: "📊" },
            ],
        },
        loneliness: {
            tone: 'friendly',
            systemPromptAddition: `
The user may be feeling isolated in their learning journey. Your response should:
1. Be extra warm and friendly
2. Remind them they're not alone - you're here to help
3. Suggest connecting with study buddies or community
4. Make the conversation feel like a genuine connection
5. Be encouraging about their learning journey

Use phrases like:
- "I'm right here with you! What do you need help with?"
- "Learning can feel solitary sometimes, but you've got a companion right here."
- "Have you considered finding a study buddy? It can really help!"
`,
            suggestedActions: [
                { text: "Find a study buddy", icon: "👥" },
                { text: "Tell me about your goals", icon: "💬" },
                { text: "Help me stay motivated", icon: "💪" },
            ],
        },
        encouragement_needed: {
            tone: 'motivational',
            systemPromptAddition: `
The user hasn't been active for a while and may need motivation. Your response should:
1. Welcome them back warmly without guilt-tripping
2. Acknowledge that life gets busy
3. Suggest a small, easy win to get back on track
4. Remind them of their goals and progress
5. Be encouraging and supportive

Use phrases like:
- "Welcome back! Ready to pick up where you left off?"
- "I've missed you! No pressure - let's ease back in."
- "Even 5 minutes of learning today counts as a win!"
- "Remember why you started - you've got this!"
`,
            suggestedActions: [
                { text: "Quick 5-min refresher", icon: "⚡" },
                { text: "Remind me of my goals", icon: "🎯" },
                { text: "What did I learn last?", icon: "🔄" },
            ],
        },
        neutral: {
            tone: 'helpful',
            systemPromptAddition: '',
            suggestedActions: [],
        },
    };

    return responses[emotion] || responses.neutral;
}

/**
 * Main emotion analysis function
 * @param {string} message - User's message
 * @param {object} context - Behavioral context
 * @returns {object} Complete emotion analysis
 */
export function analyzeUserEmotion(message, context = {}) {
    const textSignals = analyzeTextSentiment(message);
    const behaviorSignals = analyzeBehavioralContext(context);
    const primary = determinePrimaryEmotion(textSignals, behaviorSignals);
    const responseConfig = getEmotionalResponseConfig(primary.primary);

    return {
        emotion: primary.primary,
        confidence: primary.confidence,
        signals: primary.all,
        textSignals,
        behaviorSignals,
        responseConfig,
        shouldShowEmotionalSupport: primary.confidence > 0.3,
    };
}

/**
 * Build emotional context message for AI
 * @param {object} emotionAnalysis - Result from analyzeUserEmotion
 * @returns {string} Context string to add to AI prompt
 */
export function buildEmotionalContext(emotionAnalysis) {
    if (!emotionAnalysis.shouldShowEmotionalSupport) {
        return '';
    }

    const { emotion, confidence, responseConfig } = emotionAnalysis;

    return `
[EMOTIONAL STATE DETECTED: ${emotion.toUpperCase()} (confidence: ${Math.round(confidence * 100)}%)]
${responseConfig.systemPromptAddition}
[END EMOTIONAL CONTEXT]
`;
}

export default {
    analyzeUserEmotion,
    buildEmotionalContext,
    getEmotionalResponseConfig,
};
