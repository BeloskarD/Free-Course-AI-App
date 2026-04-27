import 'dotenv/config';
import mongoose from 'mongoose';
import PKG from './src/models/PKG.js';

const KNOWN_LABELS = {
    'machinelearning': 'Machine Learning',
    'datascience': 'Data Science',
    'deeplearning': 'Deep Learning',
    'computervision': 'Computer Vision',
    'reactnative': 'React Native',
    'dataengineering': 'Data Engineering',
    'frontend': 'Frontend',
    'backend': 'Backend',
    'cybersecurity': 'Cyber Security',
    'uxdesign': 'UX Design',
    'productmanagement': 'Product Management',
    'webdevelopment': 'Web Development',
    'nodejs': 'Node.js',
    'nextjs': 'Next.js',
    'advanceddeeplearninggenerativemodels': 'Advanced Deep Learning Generative Models',
    'ai': 'AI',
    'awscloud': 'AWS Cloud',
    'mongodb': 'MongoDB',
    'udemy': 'Udemy',
    'coursera': 'Coursera',
    'git': 'Git'
};

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zeeklect_db';

async function run() {
    try {
        console.log(`Connecting to ${MONGO_URI}`);
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const pkgs = await PKG.find({});
        console.log(`Found ${pkgs.length} PKG records.`);
        
        let totalFixed = 0;
        let totalSkillsFixed = 0;

        for (const pkg of pkgs) {
            if (!pkg.skills) continue;
            
            let pkgChanged = false;
            
            for (const [key, skillData] of pkg.skills.entries()) {
                if (!skillData.displayName) {
                    if (KNOWN_LABELS[key]) {
                        skillData.displayName = KNOWN_LABELS[key];
                        pkgChanged = true;
                        totalSkillsFixed++;
                    } else {
                        // Fallback formatting: capitalize first letter
                        skillData.displayName = key.charAt(0).toUpperCase() + key.slice(1);
                        pkgChanged = true;
                        totalSkillsFixed++;
                    }
                }
            }
            
            if (pkgChanged) {
                pkg.markModified('skills');
                await pkg.save();
                totalFixed++;
            }
        }

        console.log(`Successfully fixed ${totalSkillsFixed} skills across ${totalFixed} users.`);
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
