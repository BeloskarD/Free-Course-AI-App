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

const MONGO_URI = process.env.MONGO_URI;

async function debug() {
    await mongoose.connect(MONGO_URI);
    console.log('--- USER AUDIT ---');
    const users = await User.find({});
    for (const user of users) {
        const activityCount = await ActivityLog.countDocuments({ userId: user._id });
        const progress = await UserProgress.findOne({ userId: user._id });
        const momentumLogs = progress?.activityLog?.length || 0;
        console.log(`User: ${user.email} (${user._id})`);
        console.log(`  - ActivityLogs: ${activityCount}`);
        console.log(`  - MomentumLogs: ${momentumLogs}`);
    }
    process.exit(0);
}

debug();
