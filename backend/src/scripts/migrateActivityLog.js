import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';
import UserProgress from '../models/UserProgress.js';
import { ActivityLog } from '../models/Analytics.js';
import { UserMissionProgress } from '../models/Mission.js';

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
    try {
        console.log('🚀 Starting Full Momentum Data Migration...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({});
        console.log(`📊 Processing ${users.length} users`);

        for (const user of users) {
            const userId = user._id;
            console.log(`\n🔄 Processing user: ${user.email} (${userId})`);
            
            // 1. Backfill ActivityLog
            const logs = await ActivityLog.find({ userId }).sort({ createdAt: 1 });
            const grouped = {};
            logs.forEach(log => {
                const date = new Date(log.createdAt || log.updatedAt);
                const dateKey = date.toISOString().split('T')[0];
                grouped[dateKey] = (grouped[dateKey] || 0) + 1;
            });

            const activityLogArray = Object.keys(grouped).map(date => ({
                date: new Date(date),
                count: grouped[date],
                type: 'activity'
            }));

            // 2. Backfill Courses Completed from Missions
            const missions = await UserMissionProgress.find({ userId, status: 'completed' }).populate('missionId');
            const coursesCompletedArray = missions.map(m => ({
                courseId: m.missionId?._id || new mongoose.Types.ObjectId(),
                courseName: m.missionId?.title || 'Unknown Mission',
                completedAt: m.completedAt || m.updatedAt || new Date(),
                score: 100
            }));

            // 3. Backfill Skills from Missions (Improved Extraction)
            const skillsMap = new Map();
            
            // PRESERVE EXISTING SKILLS if they are not "General"
            const existingProgress = await UserProgress.findOne({ userId });
            if (existingProgress?.skills) {
                existingProgress.skills.forEach(s => {
                    if (s.name !== 'General') {
                        skillsMap.set(s.name, s.progress);
                    }
                });
            }

            const allMissions = await UserMissionProgress.find({ userId }).populate('missionId');
            allMissions.forEach(m => {
                if (!m.missionId) return;
                
                let skillName = m.missionId.category;
                
                // If category is missing or generic, extract from title
                if (!skillName || skillName === 'General' || skillName === 'Others') {
                    const title = m.missionId.title || '';
                    // Extract after "Master:" and before "Complete Path" or other suffixes
                    const match = title.match(/Master:\s*([^,:-]+)/i);
                    if (match) {
                        skillName = match[1].trim();
                        // Clean up common suffixes
                        skillName = skillName.replace(/Specialization|Nanodegree|Bootcamp/i, '').trim();
                    }
                }
                
                if (!skillName) skillName = 'General';

                const progress = m.status === 'completed' ? 100 : (m.progress || 0);
                
                if (!skillsMap.has(skillName) || skillsMap.get(skillName) < progress) {
                    skillsMap.set(skillName, progress);
                }
            });

            const skillsArray = Array.from(skillsMap.entries()).map(([name, progress]) => ({
                name,
                progress
            }));

            // 4. Update UserProgress
            await UserProgress.findOneAndUpdate(
                { userId },
                { 
                    $set: { 
                        activityLog: activityLogArray,
                        coursesCompleted: coursesCompletedArray,
                        skills: skillsArray
                    },
                    $setOnInsert: { userId } 
                },
                { upsert: true, new: true }
            );

            console.log(`  ✅ Updated: ${activityLogArray.length} days of activity`);
            console.log(`  ✅ Updated: ${coursesCompletedArray.length} completed courses`);
            console.log(`  ✅ Updated: ${skillsArray.length} skills (${skillsArray.map(s => s.name).join(', ')})`);
        }

        console.log('\n✨ Full Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
