/**
 * MISSION SERVICE
 * ================
 * Core service for Learning Missions system.
 * Handles mission creation, progress tracking, and PKG updates.
 * 
 * CRITICAL: All mission events MUST update PKG through pkgService.
 * 
 * Based on: Zeeklect v2 Evolution Architecture - Phase 4
 */

import { Mission, UserMissionProgress, MISSION_SOURCES, STAGE_TYPES } from '../models/Mission.js';
import pkgService, { PKG_EVENTS } from './pkgService.js';
import { missionRepository } from '../repositories/index.js';
import config from '../config/env.js';

function compareMissionProgressPriority(a, b) {
    const statusRank = {
        completed: 4,
        in_progress: 3,
        paused: 2,
        abandoned: 1,
        not_started: 0,
    };

    const rankDiff = (statusRank[b?.status] || 0) - (statusRank[a?.status] || 0);
    if (rankDiff !== 0) {
        return rankDiff;
    }

    const completedDiff = new Date(b?.completedAt || 0).getTime() - new Date(a?.completedAt || 0).getTime();
    if (completedDiff !== 0) {
        return completedDiff;
    }

    return new Date(b?.updatedAt || 0).getTime() - new Date(a?.updatedAt || 0).getTime();
}

async function normalizeCompletedProgress(progress, mission) {
    if (!progress || progress.status === 'completed') {
        return progress;
    }

    const totalStages = mission?.stages?.length || 0;
    const completedOrSkipped = progress.stageProgress?.filter(
        (stage) => stage.status === 'completed' || stage.status === 'skipped'
    ).length || 0;
    const isActuallyComplete = totalStages > 0 && completedOrSkipped >= totalStages;

    if (!isActuallyComplete && progress.progress < 1) {
        return progress;
    }

    progress.status = 'completed';
    progress.progress = 1;
    progress.completedAt = progress.completedAt || progress.updatedAt || new Date();
    await progress.save();

    return progress;
}

async function getCanonicalMissionProgress(missionId, userId, mission = null) {
    const progressRecords = await UserMissionProgress.find({ missionId, userId }).sort({
        completedAt: -1,
        updatedAt: -1,
        createdAt: -1,
    });

    if (!progressRecords.length) {
        return null;
    }

    const selected = [...progressRecords].sort(compareMissionProgressPriority)[0];
    return normalizeCompletedProgress(selected, mission);
}

function dedupeMissionProgress(progressRecords) {
    const byMissionId = new Map();

    for (const item of progressRecords) {
        const missionKey = item.missionId?._id?.toString?.() || item.missionId?.toString?.() || item._id?.toString?.();
        if (!missionKey) {
            continue;
        }

        const existing = byMissionId.get(missionKey);
        if (!existing || compareMissionProgressPriority(item, existing) < 0) {
            byMissionId.set(missionKey, item);
        }
    }

    return Array.from(byMissionId.values());
}

// ========================================
// MISSION CREATION
// ========================================

/**
 * Create a new mission from scratch
 * @param {Object} missionData - Mission data
 * @param {string} userId - Creator's user ID
 * @returns {Promise<Mission>}
 */
export async function createMission(missionData, userId) {
    const mission = new Mission({
        ...missionData,
        createdBy: userId,
        source: missionData.source || MISSION_SOURCES.USER_CREATED
    });

    mission.calculateTotalTime();
    await mission.save();

    console.log(`[Mission] Created mission: ${mission.title} (${mission._id})`);
    return mission;
}

/**
 * Create mission from a saved course
 * @param {Object} course - Saved course object
 * @param {string} userId - User ID
 * @returns {Promise<Mission>}
 */
export async function createFromSavedCourse(course, userId) {
    console.log(`[MissionService] Creating from course for user: ${userId}`);
    const mission = await Mission.fromSavedCourse(course, userId);
    console.log(`[MissionService] Mission created: ${mission.title} (${mission._id})`);
    return mission;
}

/**
 * Create missions from an AI roadmap
 * @param {Object} roadmap - AI-generated roadmap
 * @param {string} userId - User ID
 * @returns {Promise<Mission[]>}
 */
export async function createFromRoadmap(roadmap, userId) {
    const missions = await Mission.fromRoadmap(roadmap, userId);
    console.log(`[Mission] Created ${missions.length} missions from roadmap`);
    return missions;
}

/**
 * Create a mission from Guardian recommendation
 * @param {Object} recommendation - Guardian recommendation data
 * @param {string} userId - User ID
 * @returns {Promise<Mission>}
 */
export async function createFromGuardianRecommendation(recommendation, userId) {
    const mission = await Mission.fromGuardianRecommendation(recommendation, userId);
    console.log(`[Mission] Created from Guardian: ${mission.title}`);
    return mission;
}


/**
 * Recommend missions based on PKG skill gaps
 * @param {string} userId - User ID
 * @returns {Promise<Mission[]>}
 */
export async function recommendMissionsFromPKG(userId) {
    const pkg = await pkgService.getPKG(userId);
    const recommendations = [];

    // Get gap skills from career
    const gapSkills = pkg.career?.gapSkills || [];

    // Get decaying skills
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    const decayingSkills = skillsArr.filter(s => (s.health || 100) < 50);

    // Find existing missions targeting these skills
    const targetSkills = [
        ...gapSkills.map(g => g.skill),
        ...decayingSkills.map(s => s.skillId || s.displayName || 'unknown')
    ];

    const existingMissions = await Mission.find({
        skill: { $in: targetSkills },
        isPublic: true
    }).limit(5);

    // If no existing missions, create recommendations
    if (existingMissions.length === 0 && targetSkills.length > 0) {
        for (const skill of targetSkills.slice(0, 3)) {
            const mission = await createFromGuardianRecommendation({
                skill,
                subSkill: null,
                reason: 'Skill gap detected',
                detectionType: 'skill_gap'
            }, userId);
            recommendations.push(mission);
        }
    } else {
        recommendations.push(...existingMissions);
    }

    return recommendations;
}

// ========================================
// MISSION PROGRESS
// ========================================

/**
 * Start a mission for a user
 * @param {string} missionId - Mission ID
 * @param {string} userId - User ID
 * @returns {Promise<UserMissionProgress>}
 */
export async function startMission(missionId, userId) {
    console.log(`[MissionService] Starting mission ${missionId} for user ${userId}`);
    // Check if already started
    let progress = await getCanonicalMissionProgress(missionId, userId);

    if (progress && progress.status !== 'not_started') {
        console.log(`[MissionService] Mission already started, status: ${progress.status}`);
        // Return existing progress
        return progress;
    }

    const mission = await Mission.findById(missionId);
    if (!mission) {
        console.error(`[MissionService] Mission not found: ${missionId}`);
        throw new Error('Mission not found');
    }

    // Create progress record
    progress = new UserMissionProgress({
        userId,
        missionId,
        status: 'in_progress',
        currentStage: 1,
        progress: 0,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        stageProgress: mission.stages.map(stage => ({
            stageId: stage.stageId,
            status: stage.stageId === 1 ? 'in_progress' : 'not_started',
            attempts: 0,
            timeSpent: 0
        }))
    });

    await progress.save();

    // Update mission stats
    mission.stats.timesStarted = (mission.stats.timesStarted || 0) + 1;
    await mission.save();

    // Update PKG - Add to active missions
    await pkgService.processEvent(userId, PKG_EVENTS.MISSION_STARTED, {
        missionId,
        skill: mission.skill,
        subSkill: mission.subSkill
    });

    console.log(`[Mission] User ${userId} started mission: ${mission.title}`);
    return progress;
}

/**
 * Update stage progress
 * @param {string} missionId - Mission ID
 * @param {string} userId - User ID
 * @param {number} stageId - Stage ID
 * @param {Object} result - Stage result { score, timeSpent, passed }
 * @returns {Promise<Object>}
 */
export async function updateStageProgress(missionId, userId, stageId, result) {
    const progress = await getCanonicalMissionProgress(missionId, userId);
    if (!progress) {
        throw new Error('Mission progress not found. Start the mission first.');
    }

    const mission = await Mission.findById(missionId);
    if (!mission) {
        throw new Error('Mission not found');
    }

    const stage = mission.getStage(stageId);
    if (!stage) {
        throw new Error('Stage not found');
    }

    // Find stage progress
    const stageProgress = progress.stageProgress.find(sp => sp.stageId === stageId);
    if (!stageProgress) {
        throw new Error('Stage progress not found');
    }

    // Update stage
    stageProgress.attempts = (stageProgress.attempts || 0) + 1;
    stageProgress.timeSpent = (stageProgress.timeSpent || 0) + (result.timeSpent || 0);
    stageProgress.score = result.score;

    const passed = result.passed !== undefined
        ? result.passed
        : (result.score / 100) >= (stage.passThreshold || 0.7);

    if (passed) {
        stageProgress.status = 'completed';
        stageProgress.completedAt = new Date();

        // Award points
        progress.pointsEarned = (progress.pointsEarned || 0) + (stage.challenge?.points || 10);

        // Check if we should advance to next stage
        const nextStage = mission.stages.find(s => s.stageId === stageId + 1);
        if (nextStage) {
            progress.currentStage = nextStage.stageId;
            const nextStageProgress = progress.stageProgress.find(sp => sp.stageId === nextStage.stageId);
            if (nextStageProgress) {
                nextStageProgress.status = 'in_progress';
            }
        }
    } else {
        stageProgress.status = 'failed';

        // Check for adaptive adjustments
        if (stageProgress.attempts >= (mission.adaptiveRules?.addReinforcementAfter || 2)) {
            progress.difficultyAdjustments.push({
                stageId,
                adjustment: 'easier',
                reason: 'Multiple failures',
                appliedAt: new Date()
            });
        }
    }

    // Calculate overall progress
    const completedStages = progress.stageProgress.filter(sp => sp.status === 'completed').length;
    progress.progress = completedStages / mission.stages.length;
    progress.lastActivityAt = new Date();

    await progress.save();

    // Update PKG - Challenge completed
    if (stage.type === STAGE_TYPES.CHALLENGE) {
        await pkgService.processEvent(userId, PKG_EVENTS.CHALLENGE_COMPLETED, {
            skill: mission.skill,
            topic: mission.subSkill || stage.title,
            score: result.score,
            timeSpent: result.timeSpent || 0,
            isAIGenerated: false
        });
    }

    console.log(`[Mission] Stage ${stageId} ${passed ? 'passed' : 'failed'} for mission ${missionId}`);

    return {
        progress,
        stagePassed: passed,
        isLastStage: !mission.stages.find(s => s.stageId === stageId + 1),
        nextStage: progress.currentStage
    };
}

/**
 * Skip a stage (if allowed by adaptive rules)
 * @param {string} missionId - Mission ID
 * @param {string} userId - User ID
 * @param {number} stageId - Stage ID
 * @param {string} reason - Skip reason
 * @returns {Promise<Object>}
 */
export async function skipStage(missionId, userId, stageId, reason) {
    const progress = await getCanonicalMissionProgress(missionId, userId);
    if (!progress) {
        throw new Error('Mission progress not found');
    }

    const mission = await Mission.findById(missionId);
    const pkg = await pkgService.getPKG(userId);

    // Check if user has mastery to skip
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    const normalizedSkillName = mission.skill.toLowerCase().replace(/[^a-z0-9]/g, '');
    const skill = skillsArr.find(s => s.skillId === normalizedSkillName);
    const canSkip = skill && skill.level >= (mission.adaptiveRules?.skipIfMastery || 0.8) * 100;

    if (!canSkip) {
        throw new Error('Not eligible to skip this stage');
    }

    const stageProgress = progress.stageProgress.find(sp => sp.stageId === stageId);
    stageProgress.status = 'skipped';
    stageProgress.skippedReason = reason || 'Mastery demonstrated';

    // Advance to next stage
    const nextStage = mission.stages.find(s => s.stageId === stageId + 1);
    if (nextStage) {
        progress.currentStage = nextStage.stageId;
    }

    // Recalculate progress
    const completedOrSkipped = progress.stageProgress.filter(
        sp => sp.status === 'completed' || sp.status === 'skipped'
    ).length;
    progress.progress = completedOrSkipped / mission.stages.length;
    progress.lastActivityAt = new Date();

    await progress.save();

    return { progress, skipped: true };
}

/**
 * Complete a mission
 * @param {string} missionId - Mission ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function completeMission(missionId, userId) {
    const progress = await getCanonicalMissionProgress(missionId, userId);
    if (!progress) {
        throw new Error('Mission progress not found');
    }

    const mission = await Mission.findById(missionId);

    // Verify all stages completed
    const allCompleted = progress.stageProgress.every(
        sp => sp.status === 'completed' || sp.status === 'skipped'
    );

    if (!allCompleted) {
        throw new Error('Not all stages completed');
    }

    // Update progress
    progress.status = 'completed';
    progress.progress = 1;
    progress.completedAt = new Date();

    await progress.save();

    // Update mission stats
    mission.stats.timesCompleted = (mission.stats.timesCompleted || 0) + 1;
    mission.stats.completionRate = mission.stats.timesCompleted / mission.stats.timesStarted;

    // Calculate average time
    const totalTime = progress.stageProgress.reduce((sum, sp) => sum + (sp.timeSpent || 0), 0);
    const currentAvg = mission.stats.averageTimeToComplete || 0;
    const completions = mission.stats.timesCompleted;
    mission.stats.averageTimeToComplete = ((currentAvg * (completions - 1)) + totalTime) / completions;

    await mission.save();

    // Update PKG - Mission completed
    await pkgService.processEvent(userId, PKG_EVENTS.MISSION_COMPLETED, {
        missionId,
        skill: mission.skill,
        skillBoost: mission.skillBoostOnCompletion,
        pointsEarned: progress.pointsEarned
    });

    // --- NEW: Sync PKG Mastery back to LearnerProfile (Dashboard) ---
    if (mission.skill) {
        try {
            const pkg = await pkgService.getPKG(userId);
            const normalizedSkill = mission.skill.toLowerCase().replace(/[^a-z0-9]/g, '');
            const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
            const updatedSkillData = skillsArr.find(s => s.skillId === normalizedSkill);
            const newLevel = updatedSkillData ? updatedSkillData.level : (mission.skillBoostOnCompletion || 10);
            
            // Dynamically import unifiedSkillSync to prevent circular dependencies
            const unifiedSync = await import('./unifiedSkillSync.service.js');
            // Check for direct export or default object wrapping
            const syncFunc = unifiedSync.syncSkill || unifiedSync.default?.syncSkill;
            if (syncFunc) {
                await syncFunc(userId, mission.skill, newLevel, { skipPKG: true });
            }
        } catch (syncErr) {
            console.error('[MissionService] Error syncing completed mission skill to LearnerProfile:', syncErr);
        }
    }

    console.log(`[Mission] User ${userId} completed mission: ${mission.title}`);

    return {
        progress,
        pointsEarned: progress.pointsEarned,
        skillBoost: mission.skillBoostOnCompletion,
        completionTime: totalTime
    };
}

/**
 * Abandon a mission
 * @param {string} missionId - Mission ID
 * @param {string} userId - User ID
 * @param {string} reason - Abandonment reason
 * @returns {Promise<Object>}
 */
export async function abandonMission(missionId, userId, reason = 'other') {
    const progress = await getCanonicalMissionProgress(missionId, userId);
    if (!progress) {
        throw new Error('Mission progress not found');
    }

    const mission = await Mission.findById(missionId);

    // Update progress
    progress.status = 'abandoned';
    progress.abandonedAt = new Date();
    progress.abandonmentReason = reason;
    progress.abandonmentStage = progress.currentStage;

    await progress.save();

    // Update mission stats
    mission.stats.timesAbandoned = (mission.stats.timesAbandoned || 0) + 1;
    await mission.save();

    await pkgService.processEvent(userId, PKG_EVENTS.MISSION_ABANDONED, {
        missionId,
        reason,
        stageReached: progress.currentStage,
    });

    console.log(`[Mission] User ${userId} abandoned mission: ${mission.title} at stage ${progress.currentStage}`);

    return { progress, abandoned: true };
}

/**
 * Pause a mission
 * @param {string} missionId - Mission ID
 * @param {string} userId - User ID
 * @returns {Promise<UserMissionProgress>}
 */
export async function pauseMission(missionId, userId) {
    const progress = await getCanonicalMissionProgress(missionId, userId);
    if (!progress) {
        throw new Error('Mission progress not found');
    }

    progress.status = 'paused';
    progress.lastActivityAt = new Date();
    await progress.save();

    return progress;
}

/**
 * Resume a paused mission
 * @param {string} missionId - Mission ID
 * @param {string} userId - User ID
 * @returns {Promise<UserMissionProgress>}
 */
export async function resumeMission(missionId, userId) {
    const progress = await getCanonicalMissionProgress(missionId, userId);
    if (!progress) {
        throw new Error('Mission progress not found');
    }

    progress.status = 'in_progress';
    progress.lastActivityAt = new Date();
    await progress.save();

    return progress;
}

// ========================================
// MISSION QUERIES
// ========================================

/**
 * Get user's active missions
 * @param {string} userId - User ID
 * @returns {Promise<Object[]>}
 */
export async function getUserActiveMissions(userId) {
    const progress = await UserMissionProgress.find({
        userId,
        status: { $in: ['in_progress', 'paused'] }
    }).populate('missionId');

    const validProgress = progress.filter(p => p.missionId != null);
    return dedupeMissionProgress(validProgress);
}

/**
 * Get user's completed missions
 * @param {string} userId - User ID
 * @returns {Promise<Object[]>}
 */
export async function getUserCompletedMissions(userId) {
    const progress = await UserMissionProgress.find({
        userId,
        status: 'completed'
    }).populate('missionId').sort({ completedAt: -1 });

    const validProgress = progress.filter(p => p.missionId != null);
    return dedupeMissionProgress(validProgress);
}

/**
 * Get mission details with user progress
 * @param {string} missionId - Mission ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getMissionWithProgress(missionId, userId) {
    const mission = await Mission.findById(missionId);
    if (!mission) {
        return null;
    }

    const progress = await getCanonicalMissionProgress(missionId, userId, mission);

    return {
        mission,
        progress: progress || null,
        hasStarted: !!progress,
        isCompleted: progress?.status === 'completed'
    };
}

/**
 * Get recommended missions for user
 * @param {string} userId - User ID
 * @param {number} limit - Max results
 * @returns {Promise<Mission[]>}
 */
export async function getRecommendedMissions(userId, limit = 5) {
    const pkg = await pkgService.getPKG(userId);

    // 1. Collect target criteria
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    
    // Gap Skills (Highest priority)
    const gapSkills = (pkg.career?.gapSkills || []).map(g => g.skill.toLowerCase());
    
    // Weak Skills (< 70% health)
    const weakSkills = skillsArr
        .filter(s => (s.health || 100) < 70)
        .map(s => s.skillId || s.displayName || 'unknown');

    // Target Role (Dashboard priority)
    const targetRole = pkg.career?.targetRole;

    // Filter out already completed mission IDs
    const completedIds = pkg.missions?.completed?.map(id => id.toString()) || [];

    // 2. Fetch missions in priority order
    let recommendedMissions = [];

    // Priority 1: Missions matching Gap Skills
    if (gapSkills.length > 0) {
        const gapMissions = await Mission.find({
            skill: { $in: gapSkills },
            _id: { $nin: completedIds },
            isPublic: true
        }).limit(limit);
        recommendedMissions.push(...gapMissions);
    }

    // Priority 2: Missions matching Weak Skills (if we need more)
    if (recommendedMissions.length < limit && weakSkills.length > 0) {
        const weakMissions = await Mission.find({
            skill: { $in: weakSkills },
            _id: { $nin: [...completedIds, ...recommendedMissions.map(m => m._id)] },
            isPublic: true
        }).limit(limit - recommendedMissions.length);
        recommendedMissions.push(...weakMissions);
    }

    // Priority 3: Missions matching Target Role (Regex search on title/skill)
    if (recommendedMissions.length < limit && targetRole) {
        const roleMissions = await Mission.find({
            $or: [
                { title: { $regex: targetRole, $options: 'i' } },
                { skill: { $regex: targetRole, $options: 'i' } }
            ],
            _id: { $nin: [...completedIds, ...recommendedMissions.map(m => m._id)] },
            isPublic: true
        }).limit(limit - recommendedMissions.length);
        recommendedMissions.push(...roleMissions);
    }

    // Priority 4: General Public Missions (Fallback)
    if (recommendedMissions.length < limit) {
        const fallbackMissions = await Mission.find({
            isPublic: true,
            _id: { $nin: [...completedIds, ...recommendedMissions.map(m => m._id)] }
        }).limit(limit - recommendedMissions.length);
        recommendedMissions.push(...fallbackMissions);
    }

    return recommendedMissions.slice(0, limit);
}

/**
 * Auto-advance mission progress based on skill validation score
 * @param {string} userId 
 * @param {string} skill 
 * @param {number} score 
 */
export async function autoAdvanceFromValidation(userId, skill, score) {
    if (score < config.missionAutoAdvanceThreshold) return [];

    const activeMissions = await getUserActiveMissions(userId);
    let advancedMissions = [];

    for (const progress of activeMissions) {
        const mission = progress.missionId;
        if (!mission || !mission.skill) continue;

        const normalizedMissionSkill = mission.skill.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedValidatedSkill = skill.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (normalizedMissionSkill === normalizedValidatedSkill) {
            const currentStage = mission.stages.find(s => s.stageId === progress.currentStage);
            if (currentStage && currentStage.type === STAGE_TYPES.CHALLENGE) {
                await updateStageProgress(mission._id, userId, currentStage.stageId, {
                    score,
                    passed: true,
                    timeSpent: 15 // Equivalent
                });
                advancedMissions.push(mission.title);
                console.log(`[MissionService] Auto-advanced ${mission.title} stage ${currentStage.stageId} via validation`);
            }
        }
    }
    return advancedMissions;
}

// ========================================
// GUARDIAN INTEGRATION
// ========================================

/**
 * Create mission recommendation for Guardian intervention
 * Returns mission metadata to attach to intervention
 * @param {string} userId - User ID
 * @param {string} detectionType - Guardian detection type
 * @param {Object} detectionData - Detection data
 * @returns {Promise<Object>}
 */
export async function createGuardianMissionRecommendation(userId, detectionType, detectionData) {
    let skill = null;
    let reason = null;

    switch (detectionType) {
        case 'stagnation':
            skill = detectionData.stagnatingSkills?.[0]?.name;
            reason = 'Skill stagnation detected';
            break;
        case 'skillDecay':
            skill = detectionData.decayingSkills?.[0]?.name;
            reason = 'Skill decay detected';
            break;
        case 'confusionLoop':
            skill = detectionData.activeLoops?.[0]?.topic;
            reason = 'Confusion loop detected';
            break;
        default:
            return null;
    }

    if (!skill) return null;

    // Create a quick mission for the user
    const mission = await createFromGuardianRecommendation({
        skill,
        subSkill: null,
        reason,
        detectionType
    }, userId);

    return {
        missionId: mission._id,
        missionTitle: mission.title,
        skill,
        estimatedMinutes: mission.estimatedTotalMinutes,
        reason
    };
}

export default {
    // Creation
    createMission,
    createFromSavedCourse,
    createFromRoadmap,
    createFromGuardianRecommendation,
    recommendMissionsFromPKG,

    // Progress
    startMission,
    updateStageProgress,
    skipStage,
    completeMission,
    abandonMission,
    pauseMission,
    resumeMission,

    // Queries
    getUserActiveMissions,
    getUserCompletedMissions,
    getMissionWithProgress,
    getRecommendedMissions,

    // Guardian
    createGuardianMissionRecommendation,

    // Integration
    autoAdvanceFromValidation,

    // Constants
    MISSION_SOURCES,
    STAGE_TYPES
};
