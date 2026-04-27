import { userProgressRepository, achievementRepository, userRepository } from '../repositories/index.js';
import {
  calculateVelocity,
  calculateStreak,
  generateActivityHeatmap,
  generateWeeklyProgress,
  calculateSkillProgress,
  checkAchievements,
} from '../utils/momentumCalculator.js';
import unifiedSkillSyncService from './unifiedSkillSync.service.js';

/**
 * MOMENTUM SERVICE
 * ================
 * Business logic for productivity and gamification momentum.
 */
class MomentumService {
    /**
     * Get consolidated momentum data for a user
     * @param {string} userId 
     * @returns {Promise<Object>}
     */
    async getMomentumData(userId) {
        const user = await userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        // ==== LEGACY DATA (Kept intact to preserve other page functionalities) ====
        let userProgress = await userProgressRepository.findByUserId(userId);
        if (!userProgress) {
            userProgress = await userProgressRepository.create({
                userId,
                coursesCompleted: [],
                activityLog: [],
                skills: [],
            });
        }
        
        const legacyActivityData = generateActivityHeatmap(userProgress);
        const legacyWeeklyProgress = generateWeeklyProgress(userProgress);
        
        // ==== NEW DYNAMIC STATS (Phase 4 Models) ====
        // 1. Fetch real Mission Progress
        const { UserMissionProgress } = await import('../models/Mission.js');
        const userMissions = await UserMissionProgress.find({ userId }).populate('missionId');
        
        const legacySkills = calculateSkillProgress(userProgress, user, userMissions);
        
        const allAchievements = await achievementRepository.findAll();
        const userAchievements = await checkAchievements(userId, userProgress, allAchievements);
        
        // Count completed missions (Courses Completed)
        const completedMissions = userMissions.filter(m => m.status === 'completed');
        const totalCourses = completedMissions.length;
        
        // Sum total hours from stage progress
        let totalMinutes = 0;
        userMissions.forEach(mission => {
            (mission.stageProgress || []).forEach(stage => {
                totalMinutes += (stage.timeSpent || 0);
            });
        });
        const totalHours = Math.round(totalMinutes / 60);

        // Calculate Velocity (Completed in last 7 days vs previous 7 days)
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        let completedThisWeek = 0;
        let completedPrevWeek = 0;

        completedMissions.forEach(m => {
            const date = new Date(m.completedAt || m.updatedAt);
            if (date >= oneWeekAgo) completedThisWeek++;
            else if (date >= twoWeeksAgo && date < oneWeekAgo) completedPrevWeek++;
        });

        let velocityTrend = 0;
        if (completedPrevWeek > 0) {
            velocityTrend = Math.round(((completedThisWeek - completedPrevWeek) / completedPrevWeek) * 100);
        }

        // Fetch Streak from LearnerProfile
        const { learnerProfileRepository } = await import('../repositories/index.js');
        const profile = await learnerProfileRepository.findByUserId(userId);
        let currentStreak = 0;
        let maxStreak = 0;
        
        if (profile?.wellbeing) {
            currentStreak = profile.wellbeing.wellnessStreak || 0;
            maxStreak = profile.wellbeing.wellnessStreak || 0; // Using current as max for now if max not tracked separately
        } else if (profile?.recentSessions && profile.recentSessions.length > 0) {
            // Basic fallback calculation for active days
            currentStreak = 1; 
            maxStreak = 1;
        }

        return {
            velocity: completedThisWeek,
            velocityTrend,
            currentStreak,
            maxStreak,
            totalCourses,
            totalHours,
            
            // Keep existing logic exactly as-is for the rest
            activityData: legacyActivityData,
            weeklyProgress: legacyWeeklyProgress,
            skills: legacySkills,
            achievements: userAchievements,
        };
    }

    /**
     * Get user progress stats
     */
    async getStats(userId) {
        // Fetch real Mission Progress
        const { UserMissionProgress } = await import('../models/Mission.js');
        const userMissions = await UserMissionProgress.find({ userId });
        
        // Count completed missions (Courses Completed)
        const completedMissions = userMissions.filter(m => m.status === 'completed');
        const totalCourses = completedMissions.length;
        
        // Sum total hours from stage progress
        let totalMinutes = 0;
        userMissions.forEach(mission => {
            (mission.stageProgress || []).forEach(stage => {
                totalMinutes += (stage.timeSpent || 0);
            });
        });
        const totalHours = Math.round(totalMinutes / 60);

        // Calculate Velocity (Completed in last 7 days vs previous 7 days)
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        let completedThisWeek = 0;
        let completedPrevWeek = 0;

        completedMissions.forEach(m => {
            const date = new Date(m.completedAt || m.updatedAt);
            if (date >= oneWeekAgo) completedThisWeek++;
            else if (date >= twoWeeksAgo && date < oneWeekAgo) completedPrevWeek++;
        });

        let velocityTrend = 0;
        if (completedPrevWeek > 0) {
            velocityTrend = Math.round(((completedThisWeek - completedPrevWeek) / completedPrevWeek) * 100);
        }

        // Fetch Streak from LearnerProfile
        const { learnerProfileRepository } = await import('../repositories/index.js');
        const profile = await learnerProfileRepository.findByUserId(userId);
        let currentStreak = 0;
        let maxStreak = 0;
        
        if (profile?.wellbeing) {
            currentStreak = profile.wellbeing.wellnessStreak || 0;
            maxStreak = profile.wellbeing.wellnessStreak || 0;
        } else if (profile?.recentSessions && profile.recentSessions.length > 0) {
            currentStreak = 1; 
            maxStreak = 1;
        }

        return {
            velocity: completedThisWeek,
            velocityTrend,
            currentStreak,
            maxStreak,
            totalCourses,
            totalHours,
        };
    }

    /**
     * Update skill progress and sync
     */
    async updateSkillProgress(userId, skillName, progress) {
        let userProgress = await userProgressRepository.findByUserId(userId);
        if (!userProgress) {
            userProgress = await userProgressRepository.create({ userId });
        }

        const skills = [...(userProgress.skills || [])];
        const skillIndex = skills.findIndex(s => s.name === skillName);
        
        if (skillIndex >= 0) {
            skills[skillIndex].progress = progress;
        } else {
            skills.push({ name: skillName, progress });
        }

        await userProgressRepository.update(userProgress.id, { skills });
        
        // Sync to other systems
        await unifiedSkillSyncService.syncSkill(userId, skillName, progress);
        
        return { success: true };
    }

    /**
     * Unlock an achievement
     */
    async unlockAchievement(userId, achievementId) {
        let userProgress = await userProgressRepository.findByUserId(userId);
        if (!userProgress) {
            userProgress = await userProgressRepository.create({ userId });
        }

        const unlocked = [...(userProgress.unlockedAchievements || [])];
        if (!unlocked.some(a => a.achievementId.toString() === achievementId)) {
            unlocked.push({
                achievementId,
                unlockedAt: new Date(),
            });
            await userProgressRepository.update(userProgress.id, { unlockedAchievements: unlocked });
        }

        return { success: true };
    }

    /**
     * Generate behavior-driving weekly goals based on skill gaps
     */
    async generateWeeklyGoals(userId) {
        const pkg = await (await import('./pkgService.js')).default.getPKG(userId);
        const gaps = pkg.career?.gapSkills || [];
        
        // Pick top 3 priority gaps
        const targetSkills = gaps.slice(0, 3).map(g => g.skill);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);

        const goals = {
            skills: targetSkills.length > 0 ? targetSkills : ['Core Fundamentals'],
            targetXP: 100,
            currentXP: 0,
            deadline,
            isCompleted: false
        };

        const { UserProgress } = await import('../models/UserProgress.js');
        await UserProgress.findOneAndUpdate({ userId }, { weeklyGoals: goals, lastGoalUpdate: new Date() });
        
        return goals;
    }

    /**
     * Advanced streak tracking with history preservation
     */
    async updateStreak(userId) {
        const { UserProgress } = await import('../models/UserProgress.js');
        const progress = await UserProgress.findOne({ userId });
        if (!progress) return;

        const now = new Date();
        const last = progress.lastActivityDate;
        
        if (last) {
            const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                progress.currentStreak += 1;
            } else if (diffDays > 1) {
                progress.currentStreak = 1;
            }
        } else {
            progress.currentStreak = 1;
        }

        if (progress.currentStreak > progress.maxStreak) {
            progress.maxStreak = progress.currentStreak;
        }

        progress.lastActivityDate = now;
        progress.streakHistory.push({ date: now, active: true });
        
        // Cooldown for history (keep last 60 days)
        if (progress.streakHistory.length > 60) progress.streakHistory.shift();
        
        await progress.save();
        return progress.currentStreak;
    }
}


export default new MomentumService();
