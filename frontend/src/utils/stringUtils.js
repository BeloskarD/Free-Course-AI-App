/**
 * Humanizes technical skill names for professional display.
 * Example: "machinelearning" -> "Machine Learning"
 * Example: "react_js" -> "React Js"
 * Example: "fullStackDeveloper" -> "Full Stack Developer"
 * Example: "advanceddeeplearninggenerativemodels" -> "Advanced Deep Learning Generative Models"
 */
export const humanizeSkillName = (name) => {
    if (!name || typeof name !== 'string') return name;

    // 1. Common technical run-on words dictionary
    const dictionary = {
        'machinelearning': 'Machine Learning',
        'deeplearning': 'Deep Learning',
        'generativemodels': 'Generative Models',
        'fullstack': 'Full Stack',
        'frontend': 'Frontend',
        'backend': 'Backend',
        'datascience': 'Data Science',
        'computer-vision': 'Computer Vision',
        'cloudcomputing': 'Cloud Computing',
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'nextjs': 'Next.js',
        'nodejs': 'Node.js',
        'mongodb': 'MongoDB',
        'postgresql': 'PostgreSQL',
        'ai': 'AI'
    };

    const lowerName = name.toLowerCase();
    
    // Check dictionary first (perfect match)
    if (dictionary[lowerName]) return dictionary[lowerName];

    // Handle known keyword splitting within run-on strings
    // Only split if NOT already a dictionary match to prevent 'Mong oDB' type issues
    let result = lowerName;
    Object.keys(dictionary).forEach(key => {
        // Only split if it's a significant keyword, and we haven't already matched it
        if (key.length > 3 && result.includes(key) && result !== key && !dictionary[result.trim()]) {
            result = result.replace(key, ` ${key} `);
        }
    });

    // Handle Case Splitting (camelCase)
    result = result.replace(/([A-Z])/g, ' $1');

    // Handle Separators (snake_case, kebab-case)
    result = result.replace(/[_-]/g, ' ');

    // Split and Capitalize words
    return result
        .trim()
        .split(/\s+/)
        .map(word => {
            const lowerWord = word.toLowerCase();
            if (dictionary[lowerWord]) return dictionary[lowerWord];
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};
