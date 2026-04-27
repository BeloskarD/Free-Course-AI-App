import pkgService from './pkgService.js';
import OpportunitySignal from '../models/OpportunitySignal.js';
import { extractJSON } from '../utils/aiUtils.js';
import axios from 'axios';

/**
 * INTERVIEW PREP SERVICE
 * =======================
 * Generates personalized interview prep kits based on 
 * the user's PKG (actual skills) and the Opportunity (required skills).
 */

async function generatePrepKit(userId, signalId) {
    const pkg = await pkgService.getPKG(userId);
    const signal = await OpportunitySignal.findOne({ signalId });

    if (!signal) throw new Error('Opportunity signal not found');

    // Build context - Handle Mongoose Map correctly
    const skills = Array.from(pkg.skills?.entries() || []).map(([name, data]) => {
        const mastery = data.masteryScore || (data.level / 100) || 0;
        return `${data.displayName || name} (${Math.round(mastery * 100)}% mastery)`;
    }).join(', ');

    const prompt = `
        You are an elite Technical Interview Coach. Create a high-impact, personalized interview prep kit.
        
        CANDIDATE PROFILE (Current Skills):
        ${skills}
        
        JOB OPPORTUNITY:
        Title: ${signal.title}
        Source: ${signal.source}
        Requirements: ${signal.skillTags.join(', ')}
        Description: ${signal.description}
        
        Generate a JSON object with the following structure:
        {
            "strategy": "Overall approach for this specific interview",
            "keyStrengths": ["3 strengths from their skills that match the job"],
            "potentialQuestions": [
                {
                    "question": "Personalized technical or behavioral question",
                    "reasoning": "Why this will likely be asked",
                    "tips": "How to answer using their specific experience"
                }
            ],
            "starMethodPoints": [
                {
                    "skill": "Skill name",
                    "context": "Context from their profile to use in a STAR answer"
                }
            ]
        }
    `;

    // ── Call AI (Using Gemini as primary for speed/reasoning) ──
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
    };

    try {
        const res = await axios.post(url, body);
        const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const kit = extractJSON(text);
        return kit;
    } catch (error) {
        console.error('[InterviewPrep] AI error:', error.message);
        // Fallback static kit if AI fails
        return {
            strategy: "Focus on your core strengths in " + (signal.skillTags[0] || 'technology') + ".",
            keyStrengths: ["Fast learner", "Adaptability"],
            potentialQuestions: [
                { 
                    question: "Tell us about a time you solved a complex problem.", 
                    reasoning: "Common behavioral question", 
                    tips: "Use a specific project from your missions." 
                }
            ],
            starMethodPoints: []
        };
    }
}

export default {
    generatePrepKit
};
