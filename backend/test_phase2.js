import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { config } from './src/config/env.js';
import User from './src/models/User.js';
import LearnerProfile from './src/models/LearnerProfile.js';
import OpportunitySignal from './src/models/OpportunitySignal.js';
import PKG from './src/models/PKG.js';
import opportunityRadarService from './src/services/opportunityRadar.service.js';
import missionService from './src/services/mission.service.js';
import { getSkillGraph } from './src/controllers/personalization.controller.js';

dotenv.config();

async function run() {
    await mongoose.connect(config.mongoUri);

    console.log('--- Connected to DB ---');

    // Find a test user or create one
    let user = await User.findOne({ email: 'test_gap_integration@example.com' });
    if (!user) {
        user = await User.create({ email: 'test_gap_integration@example.com', name: 'Gap Test User', password: 'password123' });
    }
    const userId = user._id;

    // Give user a profile
    let profile = await LearnerProfile.findOne({ userId });
    if (!profile) {
        profile = await LearnerProfile.create({ userId, goals: { targetRole: 'Frontend Developer', isOnboarded: true } });
    } else {
        profile.goals.targetRole = 'Frontend Developer';
        await profile.save();
    }

    // Give user some mocked PKG skills
    let pkg = await PKG.findOne({ userId });
    if (!pkg) {
        pkg = await PKG.create({ userId });
    }
    pkg.skills.set('React', { level: 40, history: [] });
    pkg.skills.set('JavaScript', { level: 60, history: [] });
    await pkg.save();

    console.log('--- 1. Set up User with basic PKG skills (React, JavaScript) ---');
    console.log('Target Role:', profile.goals.targetRole);

    // Give the system some OpportunitySignals to match
    await OpportunitySignal.deleteMany({ title: 'Frontend Developer Test Signal' });
    await OpportunitySignal.create({
        signalId: 'sig-' + Date.now(),
        title: 'Frontend Developer Test Signal',
        category: 'Job Posting',
        source: 'hiring_signal',
        skillTags: ['React', 'JavaScript', 'TypeScript', 'Next.js', 'Tailwind CSS'],
        opportunityScore: 0.9,
        isActive: true
    });

    console.log('--- 2. Fetching Radar to trigger gap calculations ---');
    // Important: we need to clear the local match cache so it recalculates
    // Actually the cache is local to opportunityRadarService
    
    const radarResults = await opportunityRadarService.getRadar(userId, 5);
    console.log(`Radar generated ${radarResults.length} matches.`);
    if (radarResults.length > 0) {
        console.log(`Top match gapAnalysis:`, radarResults[0].gapAnalysis);
    }

    // Verify PKG
    pkg = await PKG.findOne({ userId });
    console.log('pkg.career.gapSkills:', pkg.career?.gapSkills);

    console.log('--- 3. Fetching Dashboard Skill Graph to see Focus ---');
    let skillGraphResData = null;
    const req = { userId };
    const res = {
        json: (data) => { skillGraphResData = data; },
        status: (code) => res
    };
    await getSkillGraph(req, res);
    console.log('Dashboard FocusThisWeek (topToLearn):', skillGraphResData?.topToLearn);

    console.log('--- 4. Fetching Recommended Missions via MissionService ---');
    const recommendedMissions = await missionService.recommendMissionsFromPKG(userId);
    console.log(`Recommended Missions (${recommendedMissions.length}):`);
    recommendedMissions.forEach(m => console.log(`  - [${m.difficulty}] ${m.title} (Skill: ${m.targetSkill})`));

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
