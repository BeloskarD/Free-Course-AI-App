import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { config } from './src/config/env.js';
import User from './src/models/User.js';
import LearnerProfile from './src/models/LearnerProfile.js';
import PKG from './src/models/PKG.js';
import missionService from './src/services/mission.service.js';

dotenv.config();

async function run() {
    await mongoose.connect(config.mongoUri);
    console.log('✅ [Phase 4 Test] Connected to DB');

    // 1. Setup Test User
    const email = 'phase4_tester@example.com';
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({ email, name: 'Phase 4 Tester', password: 'password123' });
    }
    const userId = user._id;

    // 2. Setup PKG
    let pkg = await PKG.findOne({ userId });
    if (!pkg) { pkg = await PKG.create({ userId }); }
    
    // Reset React skill to low level for testing
    pkg.skills.set('React', { level: 10, history: [] });
    pkg.achievements = [];
    await pkg.save();
    console.log('✅ [Phase 4 Test] PKG Reset (React Level: 10)');

    // 3. Create Mission from Mock Course (Dashboard Action)
    const mockCourse = {
        title: 'Advanced React Patterns',
        skill: 'React',
        link: 'https://example.com/react-course',
        platform: 'TestPlatform',
        duration: 45
    };

    console.log('--- 🚀 Triggering createFromSavedCourse (Phase 4 Initiation) ---');
    const mission = await missionService.createFromSavedCourse(mockCourse, userId);
    console.log(`✅ [Phase 4 Test] Mission Created: ${mission.title} (ID: ${mission._id})`);

    // 4. Start Mission
    console.log('--- 🚀 Starting Mission ---');
    let progress = await missionService.startMission(mission._id, userId);
    console.log(`✅ [Phase 4 Test] Mission Status: ${progress.status}`);

    // 5. Complete ALL Stages
    console.log(`--- 🚀 Completing all ${mission.stages.length} stages ---`);
    for (const stage of mission.stages) {
        console.log(`  -> Completing Stage ${stage.stageId}: ${stage.title}`);
        const result = await missionService.updateStageProgress(mission._id, userId, stage.stageId, {
            passed: true,
            score: 90 + stage.stageId,
            timeSpent: 15
        });
        console.log(`     Progress: ${Math.round(result.progress.progress * 100)}%`);
    }

    // 6. Complete Mission & Trigger PKG Sync
    console.log('--- 🏆 Completing Mission (Triggering Phase 4 Achievement Sync) ---');
    const finalResult = await missionService.completeMission(mission._id, userId);
    console.log(`✅ [Phase 4 Test] Mission Final Status: ${finalResult.status}`);

    // 7. Verify PKG Achievements & Skill Gain
    const updatedPkg = await PKG.findOne({ userId });
    const reactLevel = updatedPkg.skills.get('React').level;
    const achievements = updatedPkg.achievements || [];
    
    console.log('\n--- 📊 VERIFICATION RESULTS ---');
    console.log(`React Mastery Gain: 10 -> ${reactLevel}`);
    console.log(`Achievements Earned: ${achievements.length}`);
    achievements.forEach(a => console.log(`  - 🏅 ${a.title}: ${a.description}`));

    if (reactLevel > 10 && achievements.length > 0) {
        console.log('\n🎉 PHASE 4 VERIFICATION SUCCESSFUL!');
    } else {
        console.log('\n❌ PHASE 4 VERIFICATION FAILED: Mastery or Achievement not synced.');
    }

    process.exit(0);
}

run().catch(err => {
    console.error('❌ Phase 4 Test Error:', err);
    process.exit(1);
});
