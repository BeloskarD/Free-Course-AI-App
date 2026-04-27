const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'pkgService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace 1: handleChallengeCompleted
content = content.replace(
    /skillData\.lastPracticed = new Date\(\);[\s\S]*?pkg\.skills\.set\(normalizedSkill, skillData\);/,
`skillData.lastPracticed = new Date();
    
    // Sync mastery metrics to prevent fading and 0% graph bugs
    skillData.masteryScore = skillData.level / 100;
    skillData.entropyRate = Math.max(0.1, (skillData.entropyRate || 1) - 0.3);

    pkg.skills.set(normalizedSkill, skillData);`
);

// Replace 2: handleMissionCompleted
content = content.replace(
    /if \(pkg\.skills\.has\(normalizedSkill\)\) {[\s\S]*?const skillData = pkg\.skills\.get\(normalizedSkill\);/,
`// Initialize if it doesn't exist
        if (!pkg.skills.has(normalizedSkill)) {
            pkg.skills.set(normalizedSkill, {
                level: 0,
                health: 100,
                lastPracticed: new Date(),
                decayRate: 0.03,
                subTopics: new Map(),
                challengeHistory: []
            });
            changes.push(\`skills.\${normalizedSkill} initialized\`);
        }
        
        const skillData = pkg.skills.get(normalizedSkill);`
);

content = content.replace(
    /skillData\.lastPracticed = new Date\(\);[\s\n]*?pkg\.skills\.set\(normalizedSkill, skillData\);[\s\n]*?changes\.push\(\`skills\.\$\{normalizedSkill\} boosted by \$\{skillBoost\}\`\);[\s\n]*?\}/,
`skillData.lastPracticed = new Date();
        
        // Sync mastery metrics to prevent fading and 0% graph bugs
        skillData.masteryScore = skillData.level / 100;
        skillData.entropyRate = Math.max(0.1, (skillData.entropyRate || 1) - 0.3);
        
        pkg.skills.set(normalizedSkill, skillData);
        changes.push(\`skills.\${normalizedSkill} boosted by \${skillBoost}\`);
    }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched pkgService.js');
