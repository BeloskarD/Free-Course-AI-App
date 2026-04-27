import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import PKG from '../models/PKG.js';
import User from '../models/User.js';
import LearnerProfile from '../models/LearnerProfile.js';
import UserProgress from '../models/UserProgress.js';
import Mission from '../models/Mission.js';

async function repairState() {
    console.log('🚀 Starting System State Repair...');
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find orphaned progress records (missions that don't exist anymore)
        const allMissions = await Mission.find({}, '_id');
        const validMissionIds = allMissions.map(m => m._id.toString());
        
        console.log(`📊 Found ${validMissionIds.length} valid missions`);
        
        const allProgress = await UserProgress.find({});
        let orphanedProgressCount = 0;
        
        for (const progress of allProgress) {
            if (!validMissionIds.includes(progress.missionId?.toString())) {
                await UserProgress.deleteOne({ _id: progress._id });
                orphanedProgressCount++;
            }
        }
        
        console.log(`🧹 Cleaned up ${orphanedProgressCount} orphaned mission progress records.`);

        // 2. Ensure all users have PKG and LearnerProfile
        const users = await User.find({});
        console.log(`👥 Auditing ${users.length} users...`);
        
        let missingPkgCount = 0;
        let missingProfileCount = 0;
        let cleanedPkgMissionsCount = 0;

        for (const user of users) {
            // Check PKG
            let pkg = await PKG.findOne({ userId: user._id });
            if (!pkg) {
                pkg = new PKG({
                    userId: user._id,
                    version: '1.0.0',
                    isInitialized: true,
                    identity: { learningStyle: 'mixed', preferredDifficulty: 'adaptive' },
                    skills: [],
                    behavior: { searchPatterns: [], sessionHistory: [], abandonmentPatterns: [], confusionLoops: [] },
                    wellbeing: { currentBurnoutRisk: 0, burnoutHistory: [], moodTrend: [] },
                    momentum: { currentStreak: 0, longestStreak: 0, weeklyActiveMinutes: 0 },
                    missions: { active: [], completed: [], abandoned: [] },
                    career: { targetRole: '', readinessScore: 0, gapSkills: [] }
                });
                await pkg.save();
                missingPkgCount++;
            } else {
                // Clean orphaned missions in PKG
                const activeCount = pkg.missions.active.length;
                const completedCount = pkg.missions.completed.length;
                
                pkg.missions.active = pkg.missions.active.filter(id => validMissionIds.includes(id.toString()));
                pkg.missions.completed = pkg.missions.completed.filter(id => validMissionIds.includes(id.toString()));
                
                if (pkg.missions.active.length !== activeCount || pkg.missions.completed.length !== completedCount) {
                    await pkg.save();
                    cleanedPkgMissionsCount++;
                }
            }

            // Check LearnerProfile
            let profile = await LearnerProfile.findOne({ userId: user._id });
            if (!profile) {
                profile = new LearnerProfile({
                    userId: user._id,
                    skills: { current: [], missing: [], target: [] },
                    goals: { targetRole: '', careerPath: '', isOnboarded: false },
                    preferences: { learningStyle: 'hands-on', sessionLength: 30, difficultyComfort: 'medium' },
                    wellbeing: { burnoutRisk: 0, lastCheckIn: new Date() }
                });
                await profile.save();
                missingProfileCount++;
            }
        }

        console.log(`✨ Created ${missingPkgCount} missing PKG records.`);
        console.log(`✨ Created ${missingProfileCount} missing LearnerProfiles.`);
        console.log(`🧹 Cleaned orphaned missions from ${cleanedPkgMissionsCount} PKGs.`);
        
        console.log('✅ State Repair Complete!');
    } catch (error) {
        console.error('❌ Error during repair:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

repairState();
