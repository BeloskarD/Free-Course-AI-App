import LearnerProfile from '../models/LearnerProfile.js';
import UserProgress from '../models/UserProgress.js';
import pkgService from './pkgService.js';

/**
 * UNIFIED SKILL SYNCHRONIZATION SERVICE
 * =======================================
 * Ensures that whenever a skill is added, updated, or improved (via Dashboard or Momentum),
 * the change is reflected across all three data silos:
 * 1. LearnerProfile (Dashboard)
 * 2. UserProgress (Momentum)
 * 3. PKG (Career / Graph Engine)
 */

/**
 * Title Case normalization for consistent skill display names.
 * "machine learning" → "Machine Learning", "REACT" → "React"
 */
function toTitleCase(str) {
    if (!str) return '';
    return str.trim()
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * @param {string} userId
 * @param {string} skillName
 * @param {number} levelOrProgress - 0-100 scale
 * @param {Object} [options] - { skipPKG: boolean }
 *   skipPKG: When true, skips the PKG write. Use this when the caller has
 *   already written to PKG (e.g., mission completion) to prevent double-counting.
 */
export const syncSkill = async (userId, skillName, levelOrProgress, options = {}) => {
    try {
        const displayName = toTitleCase(skillName);
        const score = Number(levelOrProgress) || 0; // 0-100 scale

        // 1. Update LearnerProfile (Dashboard)
        let profile = await LearnerProfile.findOne({ userId });
        if (!profile) {
            profile = new LearnerProfile({ userId, masteredSkills: [] });
        }
        
        // Find if skill already exists in profile
        const profileSkillIndex = profile.masteredSkills.findIndex(
            s => s.name.toLowerCase() === skillName.trim().toLowerCase()
        );

        if (profileSkillIndex > -1) {
            // Update existing
            profile.masteredSkills[profileSkillIndex].name = displayName;
            profile.masteredSkills[profileSkillIndex].level = score;
            profile.masteredSkills[profileSkillIndex].lastPracticed = new Date();
            
            // BUG FIX: Regenerate skill health to 100 on sync to prevent massive decay
            if (!profile.masteredSkills[profileSkillIndex].health) {
                profile.masteredSkills[profileSkillIndex].health = { score: 100, lastAssessed: new Date(), status: 'healthy' };
            } else {
                profile.masteredSkills[profileSkillIndex].health.score = 100;
                profile.masteredSkills[profileSkillIndex].health.lastAssessed = new Date();
                profile.masteredSkills[profileSkillIndex].health.status = 'healthy';
            }
        } else {
            // Add new
            profile.masteredSkills.push({
                name: displayName,
                level: score,
                health: { score: 100, lastAssessed: new Date() },
                lastPracticed: new Date(),
                confidence: 'medium'
            });
        }
        if (!options.skipProfile) {
            await profile.save();
        }

        // 2. Update UserProgress (Momentum)
        let progress = await UserProgress.findOne({ userId });
        if (!progress) {
            progress = new UserProgress({ userId, skills: [] });
        }
        
        const progressSkillIndex = progress.skills.findIndex(
            s => s.name.toLowerCase() === skillName.trim().toLowerCase()
        );

        if (progressSkillIndex > -1) {
            progress.skills[progressSkillIndex].name = displayName;
            progress.skills[progressSkillIndex].progress = score;
        } else {
            progress.skills.push({ name: displayName, progress: score });
        }
        await progress.save();

        // 3. Update PKG (Career Graph Engine)
        // Skip if the caller already wrote to PKG (e.g., mission completion → MISSION_COMPLETED event)
        if (!options.skipPKG) {
            await pkgService.processEvent(userId, pkgService.PKG_EVENTS.CHALLENGE_COMPLETED, {
                skill: skillName.trim(),
                topic: `${skillName.trim()} General Practice`,
                score: score,
                timeSpent: 300,
                isAIGenerated: false
            });
        }

        console.log(`[UnifiedSkillSync] Successfully synced '${displayName}' at level ${score} for user ${userId}${options.skipPKG ? ' (PKG skipped — already updated)' : ' across all silos'}.`);
        return true;
    } catch (error) {
        console.error(`[UnifiedSkillSync] Failed to sync skill '${skillName}':`, error);
        return false;
    }
};

/**
 * DOMAIN EXPANSION: Unified Session Logger
 * Consolidates session logging across PKG, Profile, and Progress.
 */
export const logUnifiedSession = async (userId, duration, type, performance = 80) => {
    try {
        const sessionData = {
            date: new Date(),
            duration: duration,
            type: type,
            performance: performance
        };

        // 1. PKG (Canonical)
        await pkgService.processEvent(userId, pkgService.PKG_EVENTS.SESSION_COMPLETED, sessionData);

        // 2. Dashboards (Projections)
        await LearnerProfile.updateOne(
            { userId },
            { $push: { recentSessions: { $each: [sessionData], $slice: -10 } } }
        );

        await UserProgress.updateOne(
            { userId },
            { $push: { activityLog: { $each: [{ date: new Date(), type: 'skill_practiced', count: 1 }], $slice: -50 } } }
        );
        return true;
    } catch (err) {
        console.error('[UnifiedSync] Session log failed', err);
        return false;
    }
};

/**
 * DOMAIN EXPANSION: Unified Streak Updater
 */
export const logUnifiedStreak = async (userId) => {
    try {
        const pkg = await pkgService.getPKG(userId);
        const streak = pkg?.momentum?.currentStreak || 1; // Trust PKG calculation

        // Project to legacy models
        await LearnerProfile.updateOne(
            { userId },
            { $set: { 'wellbeing.wellnessStreak': streak } }
        );

        await UserProgress.updateOne(
            { userId },
            { $set: { currentStreak: streak } }
        );
        return streak;
    } catch (err) {
        console.error('[UnifiedSync] Streak sync failed', err);
        return null;
    }
};

export default {
    syncSkill,
    logUnifiedSession,
    logUnifiedStreak
};
