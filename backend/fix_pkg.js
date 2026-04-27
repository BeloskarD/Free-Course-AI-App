import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PKG from './src/models/PKG.js';
import LearnerProfile from './src/models/LearnerProfile.js';
import UserProgress from './src/models/UserProgress.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const userId = '69592228360edd6481193864';
    
    // 1. Remove "coursera" from PKG
    const pkg = await PKG.findOne({ userId });
    if(pkg && pkg.skills) {
        if(pkg.skills.has('coursera')) pkg.skills.delete('coursera');
        await pkg.save();
    }
    
    // 2. Remove "coursera" from LearnerProfile
    const profile = await LearnerProfile.findOne({ userId });
    if(profile && profile.masteredSkills) {
        profile.masteredSkills = profile.masteredSkills.filter(s => s.name.toLowerCase() !== 'coursera');
        await profile.save();
    }
    
    // 3. Remove "coursera" from UserProgress
    const progress = await UserProgress.findOne({ userId });
    if(progress && progress.skills) {
        progress.skills = progress.skills.filter(s => s.name.toLowerCase() !== 'coursera');
        await progress.save();
    }

    console.log("Cleanup done!");
    process.exit(0);
}
run();
