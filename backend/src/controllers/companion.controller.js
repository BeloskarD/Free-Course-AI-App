import Bytez from 'bytez.js';
import Groq from 'groq-sdk';
import Conversation from '../models/Conversation.js';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { analyzeUserEmotion, buildEmotionalContext } from '../utils/emotionAnalyzer.js';

// Initialize Groq client (fallback provider)
const getGroqClient = () => {
    return new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
};

// Initialize Bytez client (primary provider for GPT-4.1)
const getBytezModel = (modelName = "openai/gpt-4.1-mini") => {
    const sdk = new Bytez(process.env.OPENAI_API_KEY);
    return sdk.model(modelName);
};

/**
 * Robust GitHub Model Caller
 */
async function callGitHubModel(messages, modelName = "gpt-4.1") {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.warn("⚠️ GITHUB_TOKEN is missing. Skipping GitHub Model.");
        return null;
    }

    try {
        const client = ModelClient("https://models.github.ai/inference", new AzureKeyCredential(token));
        const response = await client.path("/chat/completions").post({
            body: {
                messages: messages,
                model: modelName,
                temperature: 0.7,
                max_tokens: 1024
            }
        });

        if (isUnexpected(response)) {
            console.error(`❌ GitHub Model (${modelName}) unexpected response:`, response.body?.error || response.status);
            return null;
        }

        if (!response.body?.choices?.[0]?.message?.content) {
            console.error(`❌ GitHub Model (${modelName}) returned empty content:`, JSON.stringify(response.body));
            return null;
        }

        return {
            content: response.body.choices[0].message.content,
            model: modelName
        };
    } catch (error) {
        console.error(`❌ GitHub Model (${modelName}) error:`, error.message);
        return null;
    }
}

// Platform context - THIS IS A LEARNING PLATFORM, NOT A PHYSICS APP
const PLATFORM_CONTEXT = `
IMPORTANT: You are an AI assistant on "Zeeklect" - an AI-powered LEARNING PLATFORM for technology, programming, and career development.
This platform helps users learn skills like: Web Development, React, Python, Data Science, Machine Learning, DevOps, Cloud Computing, etc.

CRITICAL RULES:
1. "Momentum" on this platform means "Learning Momentum" (tracking learning progress/streaks), NOT physics momentum
2. "Track Progress" means tracking learning progress in courses and skills
3. Always assume topics are related to tech/programming unless the user explicitly mentions something else
4. If you're unsure what the user wants to learn, ASK them politely - don't guess random topics
5. Use the user's ACTUAL saved courses, skills, and favorites to give personalized advice
6. If user has no saved data, ask what they're interested in learning (e.g., "What technology or skill would you like to learn?")

UI RENDERING RULES (MANDATORY):
7. If the user asks about their progress, stats, achievements, streak, or clicks "My Progress", you MUST UNCONDITIONALLY start your response with the exact marker "[STATS_CARD]".
8. The marker "[STATS_CARD]" is MANDATORY even if they are a GUEST or have NO DATA. It visualizes their starting dashboard.
9. Always follow the marker with a supportive text response (e.g., "Here is your progress dashboard! Since you're new, let's start learning!") or explain how they can earn points.

NAVIGATION RULES:
10. SMART NAVIGATION: Append "[NAVIGATE:/path]" based on what your ANSWER suggests the user should do, NOT just where they ask to go.

CRITICAL NAVIGATION LOGIC - Match navigation to your ANSWER content:

A) If your answer suggests LEARNING A SKILL or TOPIC (e.g., "You should learn Python basics"):
   - Navigate to AI Search: "[NAVIGATE:/ai-intelligence?q=<skill_name> tutorial&autoSearch=true]"
   - Example: Answer suggests learning JavaScript → [NAVIGATE:/ai-intelligence?q=JavaScript beginner tutorial&autoSearch=true]

B) If your answer recommends FINDING COURSES:
   - Navigate to Course Library: "[NAVIGATE:/courses?q=<topic>]"
   - Example: "Check out React courses" → [NAVIGATE:/courses?q=React]

C) If your answer recommends YOUTUBE VIDEOS:
   - Navigate to YouTube: "[NAVIGATE:/youtube?q=<topic>]"
   - Example: "Watch Python tutorials" → [NAVIGATE:/youtube?q=Python tutorials]

D) If your answer is about CHECKING PROGRESS, STATS, ACHIEVEMENTS:
   - Navigate to Track Progress: "[NAVIGATE:/momentum]"
   - Example: "Here's your learning streak" → [NAVIGATE:/momentum]

E) If your answer is about AI TOOLS:
   - Navigate to: "[NAVIGATE:/ai-tools]"

F) If your answer is about SKILL ANALYSIS:
   - Navigate to: "[NAVIGATE:/skill-analysis]"

G) If your answer is about OPPORTUNITY RADAR, HIRING SIGNALS, or FINDING TRENDS:
   - Navigate to: "[NAVIGATE:/opportunity-radar]"

H) If your answer is about CAREER PLANNING, ROADMAPS, or CAREER HUB:
   - Navigate to: "[NAVIGATE:/career-acceleration]"

I) If your answer is about LEARNING PLAN or DASHBOARD overview:
   - Navigate to: "[NAVIGATE:/dashboard]"

J) If you're just explaining a concept without suggesting action, DO NOT append navigation.

NAVIGATION PRIORITY:
1. Learning a skill/topic → /ai-intelligence?q=<topic>&autoSearch=true
2. Career Opportunity/Signals → /opportunity-radar
3. Finding courses → /courses?q=<topic>
4. Watching videos → /youtube?q=<topic>
5. Career Planning → /career-acceleration
6. Viewing progress → /momentum
7. No action suggested → No navigation

EXAMPLES:
- "Help me complete today's tasks" + Answer mentions learning React
  → End with: [NAVIGATE:/ai-intelligence?q=React basics tutorial&autoSearch=true]
  
- "What should I learn today?" + Answer suggests Python functions
  → End with: [NAVIGATE:/ai-intelligence?q=Python functions tutorial&autoSearch=true]
  
- "How is my streak?"
  → End with: [NAVIGATE:/momentum]

IMPORTANT: Navigate users to WHERE THEY CAN TAKE ACTION on your suggestion. If you suggest learning Python, navigate to learning resources, NOT progress tracking.
    Example: "I found some great React tutorials for you. [NAVIGATE:/youtube?q=React]"
`;

// AI Mode System Prompts - Enhanced with platform awareness
const MODE_PROMPTS = {
    chat: `${PLATFORM_CONTEXT}

You are a friendly AI learning companion on Zeeklect. Be helpful, concise, and encouraging.
Focus on: Technology, Programming, Web Development, Data Science, AI/ML, Cloud, DevOps, and Career Development.

BEHAVIOR:
- If user asks "What should I learn next?" and you have their skill data, recommend based on that
- If user asks "What should I learn next?" and you DON'T have their data, ask: "What area interests you most? (e.g., Web Development, Data Science, Mobile Apps, Cloud Computing)"
- Keep responses under 200 words unless the user asks for more detail
- Be encouraging and practical`,

    tutor: `${PLATFORM_CONTEXT}

You are a patient AI tutor on Zeeklect. Your teaching approach:
1. Explain concepts step-by-step with clear examples
2. Use analogies and real-world coding/tech examples
3. Ask guiding questions to check understanding
4. Encourage the learner and celebrate progress
5. Break complex topics into digestible parts

BEHAVIOR:
- If user's question is vague, ask for clarification: "Which specific topic would you like me to explain?"
- If user says "explain this topic", ask: "Which topic would you like me to explain? (e.g., React hooks, Python functions, APIs)"
- Always end with a follow-up question to ensure understanding
- Focus on practical, applicable knowledge`,

    quiz: `${PLATFORM_CONTEXT}

You are a quiz master on Zeeklect. 

BEHAVIOR:
- If user says "quiz me" without a topic, ask: "Great! What topic would you like to be quizzed on? (e.g., JavaScript, Python, React, SQL, Git)"
- When the user provides a topic, generate 3-5 questions of varying difficulty
- Wait for their answers before providing feedback
- Give a final score and encouragement
- Format questions clearly with numbers
- Keep it engaging and fun!`,

    eli5: `${PLATFORM_CONTEXT}

You are an expert at explaining complex TECH topics to beginners on Zeeklect.

BEHAVIOR:
- If user's question is vague, ask: "What tech topic would you like me to explain simply?"
- Use simple words (no jargon)
- Use fun analogies (everyday objects, simple comparisons)
- Keep explanations under 100 words
- Use emojis to make it engaging 🎉
- Compare technical concepts to everyday things
- Focus on programming, tech, and career concepts`
};

// Get or create conversation for user/session
async function getOrCreateConversation(userId, sessionId) {
    let conversation;

    if (userId) {
        conversation = await Conversation.findOne({ userId });
    } else {
        conversation = await Conversation.findOne({ sessionId, userId: null });
    }

    if (!conversation) {
        conversation = new Conversation({
            userId: userId || undefined,
            sessionId,
            messages: [],
            currentMode: 'chat'
        });
        await conversation.save();
    }

    return conversation;
}

// Build context message for AI - Enhanced with Learning Brain data
function buildContextMessage(conversation, userContext, isLoggedIn) {
    let contextInfo = '';
    let hasUserData = false;

    // User's saved courses/favorites (actual learning interests)
    if (userContext?.favorites?.length > 0) {
        hasUserData = true;
        contextInfo += `User's saved courses: ${userContext.favorites.slice(0, 5).join(', ')}. `;
    }

    // User's skills they're learning
    if (userContext?.skills?.length > 0) {
        hasUserData = true;
        contextInfo += `Skills user is learning: ${userContext.skills.slice(0, 5).join(', ')}. `;
    }

    // Recent search queries (what they're interested in)
    if (userContext?.recentSearches?.length > 0) {
        hasUserData = true;
        contextInfo += `Recent learning interests: ${userContext.recentSearches.slice(0, 3).join(', ')}. `;
    }

    // 🧠 Learning Brain Data - Weekly Plan, Goals, Skills
    const learningBrain = userContext?.learningBrain;
    if (learningBrain) {
        hasUserData = true;

        // Weekly Plan Summary - ENHANCED
        if (learningBrain.hasWeeklyPlan && learningBrain.weeklyTasks?.length > 0) {
            const taskSummary = learningBrain.weeklyTasks.slice(0, 5).map(t =>
                `${t.title} (${t.type}, ${t.status}${t.isRollover ? ', rollover' : ''})`
            ).join('; ');
            contextInfo += `\nWEEKLY LEARNING PLAN: User has ${learningBrain.weeklyTasks.length} tasks this week. `;
            contextInfo += `Completed: ${learningBrain.completedTasks}, Pending: ${learningBrain.pendingTasks}, In Progress: ${learningBrain.inProgressTasks}. `;
            if (learningBrain.weeklyFocus) {
                contextInfo += `This week's focus: "${learningBrain.weeklyFocus}". `;
            }
            if (learningBrain.adaptedDifficulty) {
                contextInfo += `Difficulty is set to ${learningBrain.adaptedDifficulty} (auto-adapted based on performance). `;
            }
            contextInfo += `Tasks include: ${taskSummary}. `;
        }

        // Goals - ENHANCED with motivation
        if (learningBrain.goals) {
            const goals = learningBrain.goals;
            contextInfo += `\nLEARNING GOALS: Primary goal is "${goals.primaryGoal || 'Not set'}". `;
            if (goals.targetRole) contextInfo += `Target role: ${goals.targetRole}. `;
            if (goals.targetTimeline) contextInfo += `Target timeline: ${goals.targetTimeline}. `;
            if (goals.motivation) {
                const motivationMap = {
                    'career-switch': 'making a career switch to tech',
                    'promotion': 'getting promoted in their current role',
                    'passion': 'personal interest and passion for learning',
                    'startup': 'building their own startup/product'
                };
                contextInfo += `Motivation: ${motivationMap[goals.motivation] || goals.motivation}. `;
            }
            if (goals.weeklyHours) contextInfo += `Available ${goals.weeklyHours} hours/week. `;
            if (goals.preferredStyle) contextInfo += `Prefers ${goals.preferredStyle} learning style. `;
            if (goals.experience) contextInfo += `Experience level: ${goals.experience}. `;
        }

        // Skills to focus on - ENHANCED with levels
        if (learningBrain.topSkillsToLearn?.length > 0) {
            const skillsList = learningBrain.topSkillsToLearn.map(s =>
                `${s.name} (level: ${s.level || 0}%${s.priority ? `, ${s.priority} priority` : ''})`
            ).join(', ');
            contextInfo += `\nFOCUS SKILLS: ${skillsList}. `;
        }

        // Current mastered skills - NEW
        if (learningBrain.masteredSkills?.length > 0) {
            const masteredList = learningBrain.masteredSkills
                .filter(s => s.level >= 50)
                .slice(0, 5)
                .map(s => `${s.name} (${s.level}%)`)
                .join(', ');
            if (masteredList) {
                contextInfo += `\nSTRONG SKILLS: ${masteredList}. `;
            }
        }
    }

    // 🚀 Career Data - target role, radar, gaps
    const career = userContext?.career;
    if (career) {
        hasUserData = true;
        if (career.targetRole && career.targetRole !== 'Not set') {
            contextInfo += `\nCAREER GOAL: User wants to become a ${career.targetRole}. `;
        }
        if (career.careerGaps?.length > 0) {
            contextInfo += `CAREER GAPS (Skills to bridge): ${career.careerGaps.map(g => g.skill).join(', ')}. `;
        }
        if (career.savedOpportunities?.length > 0) {
            const saved = career.savedOpportunities.map(o => `${o.title} (${o.source})`).join('; ');
            contextInfo += `SAVED OPPORTUNITIES: ${saved}. `;
        }
        if (career.radarMatches?.length > 0) {
            const matches = career.radarMatches.map(o => `${o.title} (${o.matchScore}% match)`).join('; ');
            contextInfo += `OPPORTUNITY RADAR: Top matches include: ${matches}. `;
        }
    }

    // Build the context string
    if (hasUserData) {
        return `[USER DATA AVAILABLE - Use this for personalized recommendations: ${contextInfo}]`;
    } else if (isLoggedIn) {
        return `[User is logged in but has no saved courses, skills, or learning plan yet. Ask what they want to learn and suggest setting up their Learning Brain with goals!]`;
    } else {
        return `[Guest user with no data. If they ask about their learning progress, stats, or achievements, YOU MUST include the marker "[STATS_CARD]" to show them their starting dashboard. Otherwise, ask what topics interest them.]`;
    }
}

// Main message handler
export async function sendMessage(req, res) {
    try {
        const { message, mode, context, sessionId } = req.body;
        const userId = req.userId || null;

        if (!message || !sessionId) {
            return res.status(400).json({ error: 'Message and sessionId are required' });
        }

        // Get or create conversation
        const conversation = await getOrCreateConversation(userId, sessionId);

        // Check guest rate limit
        if (!userId) {
            if (!conversation.checkGuestLimit()) {
                return res.status(429).json({
                    error: 'Daily message limit reached. Sign in for unlimited access!',
                    limitReached: true
                });
            }
            conversation.guestMessageCount += 1;
        }

        // Update mode if specified
        if (mode && ['chat', 'tutor', 'quiz', 'eli5'].includes(mode)) {
            conversation.currentMode = mode;
        }

        // Update context if provided
        if (context) {
            conversation.context = {
                currentPage: context.currentPage || conversation.context?.currentPage,
                favorites: context.favorites || conversation.context?.favorites || [],
                recentSearches: context.recentSearches || conversation.context?.recentSearches || [],
                learningBrain: context.learningBrain || conversation.context?.learningBrain || null
            };
        }

        // Add user message to conversation
        const userMessage = {
            role: 'user',
            content: message,
            mode: conversation.currentMode,
            timestamp: new Date()
        };

        // Build message history for AI (last 10 messages for context)
        const recentMessages = conversation.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Add context information - pass isLoggedIn for smarter responses
        const isLoggedIn = !!userId;
        const contextMessage = buildContextMessage(conversation, context, isLoggedIn);

        // 🧠 EQ-AI: Analyze user's emotional state
        const emotionalContext = {
            sessionDuration: context?.sessionDuration || 0,
            errorsThisSession: context?.errorsThisSession || 0,
            consecutiveErrors: context?.consecutiveErrors || 0,
            daysSinceLastLogin: context?.daysSinceLastLogin || 0,
            velocityTrend: context?.learningBrain?.velocityTrend || 'stable',
            recentSuccess: context?.recentSuccess || false,
        };

        const emotionAnalysis = analyzeUserEmotion(message, emotionalContext);
        const emotionalPromptAddition = buildEmotionalContext(emotionAnalysis);

        // Log emotional detection for debugging
        if (emotionAnalysis.shouldShowEmotionalSupport) {
            console.log(`🧠 EQ-AI: Detected emotion: ${emotionAnalysis.emotion} (${Math.round(emotionAnalysis.confidence * 100)}% confidence)`);
        }

        // Build final system prompt with emotional awareness
        const systemPrompt = MODE_PROMPTS[conversation.currentMode] +
            (contextMessage ? `\n\n${contextMessage}` : '') +
            (emotionalPromptAddition ? `\n\n${emotionalPromptAddition}` : '');

        // Prepare messages array
        const aiMessages = [
            { role: 'system', content: systemPrompt },
            ...recentMessages,
            { role: 'user', content: message }
        ];

        let aiResponse = null;
        let usedProvider = 'unknown';

        // 1. Try GitHub GPT-4.1 (Primary)
        try {
            console.log('🤖 Attempting GitHub GPT-4.1 for companion...');
            const result = await callGitHubModel(aiMessages, "gpt-4.1");
            if (result) {
                aiResponse = result.content;
                usedProvider = 'github-gpt-4.1';
                console.log('✅ GitHub GPT-4.1 success');
            }
        } catch (e) { console.warn('⚠️ GitHub GPT-4.1 failed:', e.message); }

        // 2. Try GitHub GPT-4.1-mini (Secondary)
        if (!aiResponse) {
            try {
                console.log('🤖 Attempting GitHub GPT-4.1-mini for companion...');
                const result = await callGitHubModel(aiMessages, "gpt-4.1-mini");
                if (result) {
                    aiResponse = result.content;
                    usedProvider = 'github-gpt-4.1-mini';
                    console.log('✅ GitHub GPT-4.1-mini success');
                }
            } catch (e) { console.warn('⚠️ GitHub GPT-4.1-mini failed:', e.message); }
        }

        // 3. Try Bytez GPT-4.1-mini (Existing Fallback)
        if (!aiResponse) {
            try {
                console.log('🤖 Attempting Bytez GPT-4.1-mini for companion...');
                const model = getBytezModel("openai/gpt-4.1-mini");
                const { error, output } = await model.run(aiMessages);
                if (!error && output) {
                    aiResponse = output?.content || JSON.stringify(output);
                    usedProvider = 'bytez-gpt-4.1-mini';
                    console.log('✅ Bytez GPT-4.1-mini response received');
                }
            } catch (bytezError) { console.warn('⚠️ Bytez failed:', bytezError.message); }
        }

        // 4. Try Groq (Tertiary Fallback)
        if (!aiResponse) {
            try {
                console.log('🤖 Falling back to Groq...');
                const groq = getGroqClient();
                const completion = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: aiMessages,
                    temperature: emotionAnalysis.emotion === 'frustration' ? 0.6 : 0.7,
                    max_tokens: 500
                });

                aiResponse = completion.choices[0]?.message?.content;
                usedProvider = 'groq-llama-3.3-70b';
                console.log('✅ Groq Llama response received (fallback)');
            } catch (groqError) {
                console.error('❌ Groq also failed:', groqError.message);
                throw groqError;
            }
        }

        if (!aiResponse) {
            aiResponse = "I'm sorry, I couldn't generate a response. Please try again.";
        }

        console.log(`📡 AI Provider used: ${usedProvider}`);

        // Update stats
        if (!conversation.stats) {
            console.log('📊 Initializing stats for conversation');
            conversation.stats = { totalMessages: 0, quizCorrectAnswers: 0, actionsTaken: 0 };
        }
        conversation.stats.totalMessages += 1;
        conversation.markModified('stats'); // FORCE SAVE
        console.log(`📈 Stats Updated: Total Messages = ${conversation.stats.totalMessages}`);

        // Evaluate Badges
        const newBadges = evaluateBadges(conversation);
        console.log(`🏅 New Badges Earned: ${JSON.stringify(newBadges)}`);

        if (newBadges.length > 0) {
            conversation.badges.push(...newBadges);
            conversation.markModified('badges'); // FORCE SAVE
        }

        // Add messages to conversation
        await conversation.addMessage(userMessage);
        await conversation.addMessage({
            role: 'assistant',
            content: aiResponse,
            mode: conversation.currentMode,
            timestamp: new Date()
        });

        res.json({
            success: true,
            response: aiResponse,
            mode: conversation.currentMode,
            messagesRemaining: userId ? null : (5 - conversation.guestMessageCount),
            newBadges: newBadges, // Return new badges to frontend
            // 🧠 EQ-AI: Return emotional analysis to frontend
            emotionalSupport: emotionAnalysis.shouldShowEmotionalSupport ? {
                emotion: emotionAnalysis.emotion,
                confidence: emotionAnalysis.confidence,
                suggestedActions: emotionAnalysis.responseConfig.suggestedActions,
                tone: emotionAnalysis.responseConfig.tone,
            } : null,
        });

    } catch (error) {
        console.error('❌ Companion Error:', error.message);
        res.status(500).json({
            error: 'Failed to process message',
            details: error.message
        });
    }
}

// Badge Evaluation Logic
function evaluateBadges(conversation) {
    const newBadges = [];
    const existingBadgeIds = new Set(conversation.badges.map(b => b.id));
    const stats = conversation.stats;

    // Badge 1: First Hello (First message sent)
    if (stats.totalMessages >= 1 && !existingBadgeIds.has('first-hello')) {
        newBadges.push({
            id: 'first-hello',
            name: 'First Hello 👋',
            icon: '👋',
            description: 'Started your first conversation with AI Companion.'
        });
    }

    // Badge 2: Curious Mind (10 messages sent)
    if (stats.totalMessages >= 10 && !existingBadgeIds.has('curious-mind')) {
        newBadges.push({
            id: 'curious-mind',
            name: 'Curious Mind 🧠',
            icon: '🧠',
            description: 'Sent 10 messages to explore new topics.'
        });
    }

    // Badge 3: Night Owl (Chatting after 10 PM)
    const currentHour = new Date().getHours();
    if (currentHour >= 22 && !existingBadgeIds.has('night-owl')) {
        newBadges.push({
            id: 'night-owl',
            name: 'Night Owl 🦉',
            icon: '🦉',
            description: 'Learning late at night!'
        });
    }

    return newBadges;
}

// Get conversation history
export async function getHistory(req, res) {
    try {
        const { sessionId } = req.query;
        const userId = req.userId || null;

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        const conversation = await getOrCreateConversation(userId, sessionId);

        res.json({
            success: true,
            messages: conversation.messages,
            currentMode: conversation.currentMode,
            messagesRemaining: userId ? null : (5 - conversation.guestMessageCount)
        });

    } catch (error) {
        console.error('❌ Get History Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
}

// Clear conversation history
export async function clearHistory(req, res) {
    try {
        const { sessionId } = req.body;
        const userId = req.userId || null;

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        const query = userId ? { userId } : { sessionId, userId: null };
        await Conversation.findOneAndUpdate(query, {
            messages: [],
            guestMessageCount: 0
        });

        res.json({ success: true, message: 'Conversation cleared' });

    } catch (error) {
        console.error('❌ Clear History Error:', error.message);
        res.status(500).json({ error: 'Failed to clear history' });
    }
}

// Switch AI mode
export async function switchMode(req, res) {
    try {
        const { sessionId, mode } = req.body;
        const userId = req.userId || null;

        if (!sessionId || !mode) {
            return res.status(400).json({ error: 'sessionId and mode are required' });
        }

        if (!['chat', 'tutor', 'quiz', 'eli5'].includes(mode)) {
            return res.status(400).json({ error: 'Invalid mode' });
        }

        const conversation = await getOrCreateConversation(userId, sessionId);
        conversation.currentMode = mode;
        await conversation.save();

        // Add system message about mode change
        const modeNames = {
            chat: 'Chat Mode 💬',
            tutor: 'Tutor Mode 🎓',
            quiz: 'Quiz Mode 📝',
            eli5: 'ELI5 Mode 👶'
        };

        res.json({
            success: true,
            mode,
            message: `Switched to ${modeNames[mode]}`
        });

    } catch (error) {
        console.error('❌ Switch Mode Error:', error.message);
        res.status(500).json({ error: 'Failed to switch mode' });
    }
}
