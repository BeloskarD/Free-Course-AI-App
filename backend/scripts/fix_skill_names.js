import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OpportunitySignal from '../src/models/OpportunitySignal.js';
import UserOpportunityMatch from '../src/models/UserOpportunityMatch.js';

dotenv.config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zeeklect';

const SKILL_MAP = {
    'advanceddeeplearninggenerativemodels': 'advanced deep learning generative models',
    'machinelearning': 'machine learning',
    'datascience': 'data science',
    'dataanalysis': 'data analysis',
    'frontenddevelopment': 'frontend development',
    'backenddevelopment': 'backend development',
    'fullstack': 'full stack',
    'cloudcomputing': 'cloud computing',
    'devops': 'dev ops',
    'cybersecurity': 'cyber security'
};

async function cleanup() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');

        // 1. Process OpportunitySignal
        console.log('📦 Processing OpportunitySignals...');
        const signals = await OpportunitySignal.find({});
        let signalCount = 0;

        for (const signal of signals) {
            let modified = false;
            if (signal.skillTags) {
                const newTags = signal.skillTags.map(tag => {
                    const mapped = SKILL_MAP[tag.toLowerCase()];
                    if (mapped) {
                        modified = true;
                        return mapped;
                    }
                    return tag;
                });
                if (modified) signal.skillTags = newTags;
            }
            if (modified) {
                await signal.save();
                signalCount++;
            }
        }
        console.log(`✅ Updated ${signalCount} signals.`);

        // 2. Process UserOpportunityMatch (Gap Analysis)
        console.log('📦 Processing UserOpportunityMatches...');
        const matches = await UserOpportunityMatch.find({});
        let matchCount = 0;

        for (const match of matches) {
            let modified = false;
            if (match.gapAnalysis) {
                match.gapAnalysis = match.gapAnalysis.map(gap => {
                    const mapped = SKILL_MAP[gap.skill?.toLowerCase()];
                    if (mapped) {
                        modified = true;
                        return { ...gap, skill: mapped };
                    }
                    return gap;
                });
            }
            if (modified) {
                await match.save();
                matchCount++;
            }
        }
        console.log(`✅ Updated ${matchCount} matches.`);

        console.log('🎉 Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

cleanup();
