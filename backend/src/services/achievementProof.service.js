import AchievementProof from '../models/AchievementProof.js';

/**
 * ACHIEVEMENT PROOF SERVICE
 * =========================
 * Auto-creates proof records when learning milestones are reached.
 * Manages portfolio/resume auto-update triggers.
 */

const PROOF_TRIGGERS = {
    MASTERY_THRESHOLD: 'mastery_threshold',
    MISSION_COMPLETED: 'mission_completed',
    STREAK_MILESTONE: 'streak_milestone',
    SKILL_BADGE: 'skill_badge'
};

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 200, 365];

// ========================================
// TRIGGER HANDLERS
// ========================================

async function checkMasteryThreshold(userId, skillName, oldMastery, newMastery) {
    if (newMastery >= 0.8 && oldMastery < 0.8) {
        const existing = await AchievementProof.findOne({
            userId,
            proofType: 'mastery_achieved',
            'artifact.data.skill': skillName
        });
        if (existing) return null;

        return AchievementProof.create({
            userId,
            proofType: 'mastery_achieved',
            title: `Mastered ${skillName.charAt(0).toUpperCase() + skillName.slice(1)}`,
            description: `Achieved ${Math.round(newMastery * 100)}% mastery in ${skillName}`,
            triggerSource: { type: 'skill_health', event: 'mastery_score_reached_0.8' },
            artifact: {
                type: 'badge',
                data: { skill: skillName, level: 'mastery', score: newMastery },
                isPublic: true
            },
            autoActions: { portfolioUpdated: true, socialShareReady: true },
            status: 'generated'
        });
    }
    return null;
}

async function checkMissionCompletion(userId, missionData) {
    if (missionData.status !== 'completed') return null;

    return AchievementProof.create({
        userId,
        proofType: 'mission_completion',
        title: missionData.title || 'Mission Completed',
        description: `Successfully completed the ${missionData.title} mission`,
        triggerSource: { type: 'mission', referenceId: missionData.missionId, event: 'completed' },
        artifact: {
            type: 'portfolio_project',
            data: {
                title: missionData.title,
                description: missionData.description,
                skills: missionData.skills || [],
                completedAt: new Date()
            },
            isPublic: false
        },
        autoActions: { portfolioUpdated: false, socialShareReady: true },
        status: 'generated'
    });
}

async function checkStreakMilestone(userId, streak) {
    if (!STREAK_MILESTONES.includes(streak)) return null;

    const existing = await AchievementProof.findOne({
        userId,
        proofType: 'streak_milestone',
        'artifact.data.streak': streak
    });
    if (existing) return null;

    return AchievementProof.create({
        userId,
        proofType: 'streak_milestone',
        title: `${streak}-Day Learning Streak 🔥`,
        description: `Maintained a ${streak}-day consecutive learning streak`,
        triggerSource: { type: 'momentum', event: `streak_${streak}` },
        artifact: {
            type: 'badge',
            data: { streak, achievedAt: new Date() },
            isPublic: true
        },
        autoActions: { socialShareReady: true },
        status: 'generated'
    });
}

// ========================================
// PUBLIC API
// ========================================

async function getProofs(userId, options = {}) {
    const filter = { userId };
    if (options.proofType) filter.proofType = options.proofType;
    if (options.status) filter.status = options.status;

    return AchievementProof.find(filter)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .lean();
}

async function publishProof(proofId) {
    return AchievementProof.findByIdAndUpdate(
        proofId,
        {
            status: 'published',
            'artifact.isPublic': true,
            'recruiterVisibility.isVisible': true,
            'recruiterVisibility.verifiedAt': new Date()
        },
        { new: true }
    );
}

async function toggleVisibility(proofId, isVisible) {
    return AchievementProof.findByIdAndUpdate(
        proofId,
        { 'recruiterVisibility.isVisible': isVisible },
        { new: true }
    );
}

async function getRecruiterFeed(options = {}) {
    return AchievementProof.find({
        'recruiterVisibility.isVisible': true,
        status: 'published'
    })
        .sort({ createdAt: -1 })
        .limit(options.limit || 25)
        .lean();
}

async function generateShareLink(proofId) {
    const proof = await AchievementProof.findById(proofId);
    if (!proof) return null;

    // Generate a simple share URL
    const shareUrl = `/proofs/${proofId}`;
    proof.artifact.publicUrl = shareUrl;
    proof.autoActions.socialShareReady = true;
    await proof.save();

    return shareUrl;
}

export default {
    checkMasteryThreshold,
    checkMissionCompletion,
    checkStreakMilestone,
    getProofs,
    publishProof,
    toggleVisibility,
    getRecruiterFeed,
    generateShareLink,
    PROOF_TRIGGERS
};
