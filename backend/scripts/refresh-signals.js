import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[RefreshSignals] Connected to MongoDB');

    const col = mongoose.connection.db.collection('opportunitysignals');
    const newExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const result = await col.updateMany(
        {},
        { $set: { expiresAt: newExpiry, isActive: true } }
    );

    console.log('[RefreshSignals] Updated:', result.modifiedCount, 'New expiry:', newExpiry.toISOString());

    const active = await col.countDocuments({ isActive: true });
    console.log('[RefreshSignals] Active signals:', active);

    // Also ensure all users have PKGs
    const users = mongoose.connection.db.collection('users');
    const pkgs = mongoose.connection.db.collection('pkgs');
    
    const allUsers = await users.find({}, { projection: { _id: 1, name: 1, email: 1 } }).toArray();
    console.log('[PKGInit] Total users:', allUsers.length);

    let created = 0;
    for (const user of allUsers) {
        const existing = await pkgs.findOne({ userId: user._id });
        if (!existing) {
            await pkgs.insertOne({
                userId: user._id,
                skills: {},
                identity: {
                    learnerType: 'explorer',
                    attentionSpan: { average: 30, trend: 'stable' },
                    preferredDifficulty: 'medium'
                },
                career: {
                    targetRole: '',
                    readinessScore: 0,
                    gapSkills: [],
                    salaryPotential: {}
                },
                missions: { active: [], completed: [], abandoned: [] },
                behavior: {
                    searchPatterns: [],
                    sessionHistory: [],
                    confusionLoops: [],
                    abandonmentPatterns: []
                },
                wellbeing: {
                    currentBurnoutRisk: 0,
                    moodTrend: [],
                    restDaysUsed: 0,
                    restDaysTotal: 4,
                    lastBreakTaken: null,
                    averageSessionBeforeBreak: 45
                },
                momentum: {
                    currentStreak: 0,
                    longestStreak: 0,
                    streakHealth: 0,
                    weeklyOutputScore: 0
                },
                guardianState: {
                    lastIntervention: null,
                    interventionHistory: []
                },
                auditTrail: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            created++;
            console.log(`  [PKGInit] Created PKG for user: ${user.email || user._id}`);
        }
    }
    console.log(`[PKGInit] Created ${created} new PKGs. Total PKGs now: ${await pkgs.countDocuments()}`);

    await mongoose.disconnect();
    console.log('[Done] All maintenance tasks completed.');
}

main().catch(err => { console.error(err); process.exit(1); });
