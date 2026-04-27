/**
 * ROBUST AI UTILITIES
 * Centralized helpers for AI interactions and response processing.
 */

/**
 * Robust JSON extraction helper
 * Handles markdown code blocks (```json ... ```) and leading/trailing noise.
 * Useful for AI models that often wrap JSON in markdown or add chatter.
 */
export function extractJSON(content) {
    if (!content) return null;

    let clean = content.toString().trim();

    // 1. Remove markdown code blocks if present
    if (clean.includes("```")) {
        const jsonBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
            clean = jsonBlockMatch[1].trim();
        } else {
            clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        }
    }

    try {
        return JSON.parse(clean);
    } catch (e) {
        const firstBrace = clean.indexOf("{");
        const lastBrace = clean.lastIndexOf("}");

        const firstBracket = clean.indexOf("[");
        const lastBracket = clean.lastIndexOf("]");

        let candidates = [];
        
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            candidates.push(clean.substring(firstBrace, lastBrace + 1));
        }
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            candidates.push(clean.substring(firstBracket, lastBracket + 1));
        }

        candidates.sort((a, b) => b.length - a.length);

        for (const candidate of candidates) {
            try {
                return JSON.parse(candidate);
            } catch (regexError) {}
        }

        console.error("❌ AI Utils: All JSON parsing attempts failed.");
        return null;
    }
}

/**
 * Validates that an object has the required fields and types.
 * @param {Object} data - The data to validate
 * @param {Object} schema - A simple schema definition { field: type }
 * @returns {Boolean} - True if valid, false otherwise
 */
export function validateSchema(data, schema) {
    if (!data || typeof data !== 'object') return false;

    for (const [key, type] of Object.entries(schema)) {
        if (!(key in data)) return false;

        if (type === 'array') {
            if (!Array.isArray(data[key])) return false;
        } else if (typeof data[key] !== type) {
            return false;
        }
    }

    return true;
}

/**
 * Normalizes dynamic AI response structures into a consistent format.
 * Useful for 'courses' and 'tools' search modes where AI generates dynamic keys.
 */
export function normalizeAIResponse(data, mode) {
    if (!data || typeof data !== 'object') return data;

    // 1. Recursive list detection - find arrays nested within larger AI responses (like intelligence)
    let targetKey = mode === 'tools' ? 'tools' : 'courses';
    let results = data[targetKey];
    let originalKey = targetKey;

    if (!results || !Array.isArray(results)) {
        // Find any key that looks like it contains the list (courses, tools, youtubeVideos, etc.)
        const potentialKey = Object.keys(data).find(key => 
            Array.isArray(data[key]) && 
            (key.toLowerCase().includes(mode.substring(0, mode.length - 1)) || 
             key.toLowerCase().includes('result') || 
             (mode === 'intelligence' && (key === 'courses' || key === 'tools' || key === 'youtubeVideos')))
        );

        if (potentialKey) {
            results = data[potentialKey];
            originalKey = potentialKey;
            targetKey = potentialKey; // Keep the original key if it makes sense
        } else {
            // Fallback: Check if we are in intelligence mode and need to normalize multiple arrays
            if (mode === 'intelligence') {
                const normalizedModeResult = { ...data };
                const arraysToNormalize = ['courses', 'tools', 'youtubeVideos', 'resources', 'practiceProjects'];
                
                arraysToNormalize.forEach(arrKey => {
                    if (data[arrKey] && Array.isArray(data[arrKey])) {
                        normalizedModeResult[arrKey] = data[arrKey].map(item => normalizeItem(item, arrKey));
                    }
                });
                return normalizedModeResult;
            }

            // Global Fallback: If there is exactly one array, use it
            const arrays = Object.keys(data).filter(key => Array.isArray(data[key]));
            if (arrays.length === 1) {
                results = data[arrays[0]];
                originalKey = arrays[0];
            }
        }
    }

    if (mode === 'resume') return data;

    if (!results || !Array.isArray(results)) return data;

    // 2. Normalize each item in the results array using a unified sub-function
    const normalizedResults = results.map(item => normalizeItem(item, mode));

    return {
        ...data,
        [originalKey]: normalizedResults,
        // Also provide under targetKey if different
        ...(originalKey !== targetKey ? { [targetKey]: normalizedResults } : {})
    };
}

/**
 * Unified item normalizer with deep alias mapping
 */
function normalizeItem(item, mode) {
    if (!item || typeof item !== 'object') return item;
    
    const normalized = { ...item };

    // 1. Unified Title/Name Mapping
    if (!normalized.title) {
        normalized.title = normalized.course_title || normalized.course_name || normalized.courseName || normalized.name || normalized.tool_name || normalized.label || normalized.title_name;
    }
    if (!normalized.name) {
        normalized.name = normalized.tool_name || normalized.item_name || normalized.title || normalized.name_label;
    }

    // 2. Unified Platform/Provider Mapping
    if (!normalized.platform) {
        normalized.platform = normalized.provider || normalized.source || normalized.website || normalized.company || normalized.creator || normalized.platform_name;
    }
    if (!normalized.provider) {
        normalized.provider = normalized.platform || normalized.source || normalized.company;
    }

    // 3. Unified Link/URL Mapping
    if (!normalized.link) {
        normalized.link = normalized.url || normalized.website_link || normalized.official_link || normalized.href || normalized.course_link || normalized.tool_link;
    }
    if (!normalized.url) {
        normalized.url = normalized.link;
    }

    // 4. LEVEL & DIFFICULTY (The missing Bento Stat)
    if (!normalized.level) {
        normalized.level = normalized.difficulty || normalized.expertise_level || normalized.expertise || normalized.level_name || normalized.target_level || normalized.student_level || "All Levels";
    }

    // 5. LANGUAGE (The missing Bento Stat)
    if (!normalized.language) {
        normalized.language = normalized.course_language || normalized.lang || normalized.instruction_language || normalized.original_language || normalized.language_code || "English";
    }

    // 6. EXPERT ADVICE / WHY THIS COURSE (Zero-Confusion Mission)
    if (!normalized.whyThisCourse) {
        normalized.whyThisCourse = normalized.expert_reason || normalized.expert_advice || normalized.ai_insight || normalized.reasoning || normalized.why_choose || normalized.recommendation_reason || normalized.expert_notes || normalized.insight || normalized.description || normalized.snippet;
    }

    // 7. TYPE & PRICE (Safety badges)
    if (!normalized.type) {
        normalized.type = normalized.cost_type || normalized.pricing || normalized.access_type || normalized.enrollment_type || (normalized.price === 0 || normalized.price === '0' || normalized.price === 'Free' ? 'Free' : 'Paid');
    }
    if (!normalized.price && normalized.price !== 0) {
        normalized.price = normalized.cost || normalized.fee || normalized.enrollment_fee || normalized.price_tag || (normalized.type === 'Free' ? 0 : null);
    }

    // Truncate descriptions and advice to 1-2 lines (approx 160 chars) for UI consistency
    const MAX_DESC_LENGTH = 160;
    if (normalized.whyThisCourse && normalized.whyThisCourse.length > MAX_DESC_LENGTH) {
        normalized.whyThisCourse = normalized.whyThisCourse.substring(0, MAX_DESC_LENGTH - 3) + "...";
    }
    if (normalized.description && normalized.description.length > MAX_DESC_LENGTH) {
        normalized.description = normalized.description.substring(0, MAX_DESC_LENGTH - 3) + "...";
    }

    return normalized;

}

export function validateAIIntelligenceResult(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, issues: ['result is not an object'] };
    }

    const issues = [];

    if (typeof data.learningGoal !== 'string' || data.learningGoal.trim().length < 10) {
        issues.push('learningGoal is missing or too short');
    }

    const arrayChecks = [
        ['skillBreakdown', 1],
        ['roadmap', 3],
        ['courses', 1],
    ];

    for (const [key, min] of arrayChecks) {
        if (!Array.isArray(data[key]) || data[key].length < min) {
            issues.push(`${key} has fewer than ${min} items`);
        }
    }

    if (!data.careerInsights || typeof data.careerInsights !== 'object') {
        issues.push('careerInsights is missing');
    }

    const supportingSections = [
        'youtubeVideos',
        'resources',
        'practiceProjects',
        'tools',
    ];

    const populatedSupportingSections = supportingSections.filter(
        (key) => Array.isArray(data[key]) && data[key].length > 0
    ).length;

    if (populatedSupportingSections < 2) {
        issues.push('not enough supporting recommendation sections');
    }

    return {
        valid: issues.length === 0,
        issues,
    };
}
