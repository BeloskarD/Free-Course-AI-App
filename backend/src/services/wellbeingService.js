import { learnerProfileRepository } from '../repositories/index.js';
import notificationService from './notificationService.js';

/**
 * WELLBEING SERVICE
 * =================
 * Handles wellness tracking, burnout risk, and rest day management.
 */
class WellbeingService {
    async _getProfile(userId) {
        let profile = await learnerProfileRepository.findByUserId(userId);
        if (!profile) {
            profile = await learnerProfileRepository.create({ userId, goals: { isOnboarded: false } });
        }
        return profile;
    }

    /**
     * Get wellbeing status and burnout risk
     */
    async getStatus(userId) {
        let profile = await this._getProfile(userId);

        const burnoutAnalysis = this.calculateBurnoutRisk(profile);

        const wellbeingUpdates = {
            'wellbeing.burnoutRisk': burnoutAnalysis.risk,
            'wellbeing.lastAssessed': new Date(),
        };

        if (!profile.wellbeing) {
            wellbeingUpdates.wellbeing = { burnoutRisk: burnoutAnalysis.risk, lastAssessed: new Date() };
        }

        profile = await learnerProfileRepository.update(profile.id, wellbeingUpdates);

        const now = new Date();
        const currentMonth = now.getMonth();
        const pausesThisMonth = (profile.wellbeing?.streakPauses || []).filter(p =>
            new Date(p.date).getMonth() === currentMonth
        ).length;

        const intervention = this.generateIntervention(burnoutAnalysis.risk, burnoutAnalysis.factors);

        // If high risk, notify user in-app
        if (burnoutAnalysis.risk > 70) {
            await notificationService.notify(userId, 'skill_decay', {
                title: 'Guardian Alert: Burnout Risk',
                message: intervention.message.body,
                priority: 'high',
                actionLink: '/momentum#skill-evolution-hub'
            });
        }

        return {
            burnoutRisk: burnoutAnalysis.risk,
            riskLevel: burnoutAnalysis.level,
            factors: burnoutAnalysis.factors,
            recommendations: burnoutAnalysis.recommendations,
            intervention,
            restDayEnabled: profile.wellbeing?.restDayEnabled ?? true,
            restDayOfWeek: profile.wellbeing?.restDayOfWeek ?? 0,
            streakPausesUsed: pausesThisMonth,
            streakPausesRemaining: (profile.wellbeing?.streakPausesLimit || 2) - pausesThisMonth,
            upcomingPauses: (profile.wellbeing?.streakPauses || []).filter(p => new Date(p.date) > now),
            breaksTaken: profile.wellbeing?.breaksTaken || 0,
            wellnessStreak: profile.wellbeing?.wellnessStreak || 0,
            averageSessionLength: profile.wellbeing?.averageSessionLength || 30,
            recentMoods: (profile.wellbeing?.moodHistory || []).slice(0, 30),
            lastCheckIn: profile.wellbeing?.lastCheckIn
        };
    }

    generateIntervention(risk, factors) {
        let priority = 1;
        let message = { emoji: '💡', body: 'Keep up the consistent learning pace!' };

        if (risk > 75) {
            priority = 3;
            message = { emoji: '🚨', body: 'High burnout risk detected. We strongly recommend taking a rest day.' };
        } else if (risk > 40) {
            priority = 2;
            message = { emoji: '⚠️', body: 'Your pace is increasing. Remember to take short breaks.' };
        }

        return { priority, message, showModal: false };
    }

    /**
     * Log a break
     */
    async logBreak(userId, duration = 5) {
        const profile = await this._getProfile(userId);

        const updates = {
            'wellbeing.breaksTaken': (profile.wellbeing?.breaksTaken || 0) + 1,
            'wellbeing.lastBreakReminder': new Date(),
            'wellbeing.dismissedBreakReminders': 0,
            'wellbeing.wellnessStreak': (profile.wellbeing?.wellnessStreak || 0) + 1,
        };

        if (!profile.wellbeing) {
            updates.wellbeing = { breaksTaken: 1, lastBreakReminder: new Date(), wellnessStreak: 1 };
        }

        return await learnerProfileRepository.update(profile.id, updates);
    }

    /**
     * Request a streak pause
     */
    async requestStreakPause(userId, date, reason) {
        const profile = await this._getProfile(userId);

        const pauseDate = new Date(date);
        const currentMonth = pauseDate.getMonth();
        const pauses = profile.wellbeing?.streakPauses || [];
        const pausesThisMonth = pauses.filter(p => new Date(p.date).getMonth() === currentMonth).length;

        const limit = profile.wellbeing?.streakPausesLimit || 2;
        if (pausesThisMonth >= limit) throw new Error(`Used all ${limit} streak pauses this month.`);
        if (pauseDate < new Date()) throw new Error('Rest day must be in the future');

        const updatedPauses = [...pauses, { date: pauseDate, reason, createdAt: new Date() }];
        return await learnerProfileRepository.update(profile.id, { 'wellbeing.streakPauses': updatedPauses });
    }

    /**
     * Log mood
     */
    async logMood(userId, { score, notes, emotion }) {
        const profile = await this._getProfile(userId);

        const moodHistory = [
            { date: new Date(), score, notes, emotion },
            ...(profile.wellbeing?.moodHistory || [])
        ].slice(0, 30);

        return await learnerProfileRepository.update(profile.id, {
            'wellbeing.moodHistory': moodHistory,
            'wellbeing.lastCheckIn': new Date()
        });
    }

    /**
     * Update wellbeing settings
     */
    async updateSettings(userId, settings) {
        const profile = await this._getProfile(userId);

        const updates = {};
        if (settings.restDayEnabled !== undefined) updates['wellbeing.restDayEnabled'] = settings.restDayEnabled;
        if (settings.restDayOfWeek !== undefined) updates['wellbeing.restDayOfWeek'] = settings.restDayOfWeek;
        if (settings.streakPausesLimit !== undefined) updates['wellbeing.streakPausesLimit'] = settings.streakPausesLimit;

        return await learnerProfileRepository.update(profile.id, updates);
    }

    // INTERNAL HELPERS
    calculateBurnoutRisk(profile) {
        let risk = 0;
        const factors = [];
        const recentSessions = profile.recentSessions?.slice(0, 14) || [];
        const avgSessionLength = recentSessions.length > 0
            ? recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / recentSessions.length
            : 30;

        if (avgSessionLength > 60) { risk += 20; factors.push('Long sessions without breaks'); }
        
        const lastBreak = profile.wellbeing?.lastBreakReminder;
        const daysSinceBreak = lastBreak ? Math.floor((Date.now() - new Date(lastBreak).getTime()) / 86400000) : 7;
        if (daysSinceBreak > 5) { risk += 25; factors.push('No rest days recently'); }
        
        if ((profile.wellbeing?.dismissedBreakReminders || 0) > 3) { risk += 15; factors.push('Multiple break reminders dismissed'); }
        if (profile.adaptiveVelocity?.trend === 'slowing') { risk += 15; factors.push('Learning velocity declining'); }

        const recentMoods = profile.wellbeing?.moodHistory?.slice(0, 5) || [];
        if (recentMoods.length > 0) {
            const avgMood = recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length;
            if (avgMood < 2.5) { risk += 25; factors.push('Recent low mood scores'); }
        }

        risk = Math.min(risk, 100);
        return {
            risk,
            level: risk < 30 ? 'low' : risk < 60 ? 'moderate' : 'high',
            factors,
            recommendations: this.generateRecommendations(risk, factors)
        };
    }

    generateRecommendations(risk, factors) {
        const recommendations = [];
        if (risk >= 60) recommendations.push({ type: 'urgent', icon: '🚨', text: 'Consider taking a full rest day tomorrow', action: 'schedule_rest' });
        if (factors.includes('Long sessions without breaks')) recommendations.push({ type: 'habit', icon: '⏰', text: 'Try using the 50/10 rule', action: 'enable_break_reminders' });
        if (factors.includes('No rest days recently')) recommendations.push({ type: 'rest', icon: '🧘', text: 'Schedule a "guilt-free" rest day', action: 'schedule_rest' });
        return recommendations;
    }
}

export default new WellbeingService();
