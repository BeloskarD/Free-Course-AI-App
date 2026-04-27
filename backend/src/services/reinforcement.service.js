import pkgService from './pkgService.js';
import AchievementProof from '../models/AchievementProof.js';

/**
 * REINFORCEMENT ENGINE SERVICE
 * ============================
 * Momentum scoring, burnout detection, overlearning detection,
 * learning velocity analysis, and intelligent intervention triggers.
 */

// ========================================
// MOMENTUM SCORE
// ========================================

/**
 * M(t) = w₁·StreakHealth + w₂·WeeklyOutput + w₃·CAR + w₄·VelocityTrend
 */
function calculateMomentumScore(pkg) {
    const m = pkg.momentum || {};
    const streakHealth = m.streakHealth || 0;
    const weeklyOutput = m.weeklyOutputScore || 0;
    const car = Math.min(1, m.consumptionToApplicationRatio || 0);

    // Derive velocity trend
    let velocityBonus = 0;
    const sessions = pkg.behavior?.sessionHistory || [];
    if (sessions.length >= 3) {
        const recent = sessions.slice(-3);
        const older = sessions.slice(-6, -3);
        const recentAvg = recent.reduce((s, r) => s + (r.duration || 0), 0) / recent.length;
        const olderAvg = older.length > 0
            ? older.reduce((s, r) => s + (r.duration || 0), 0) / older.length
            : recentAvg;
        if (recentAvg > olderAvg * 1.15) velocityBonus = 0.2;
        else if (recentAvg < olderAvg * 0.85) velocityBonus = -0.2;
    }

    const score = 0.3 * streakHealth + 0.3 * weeklyOutput + 0.2 * car + 0.2 * (velocityBonus + 0.5);
    return Math.min(1, Math.max(0, Math.round(score * 100) / 100));
}

// ========================================
// BURNOUT DETECTION
// ========================================

/**
 * BurnoutRisk = Σ(wᵢ × Fᵢ)
 */
function calculateBurnoutRisk(pkg) {
    const factors = {};

    // F1: Session length excess (avg > 120min = 1.0)
    const sessions = pkg.behavior?.sessionHistory || [];
    if (sessions.length > 0) {
        const avgDuration = sessions.slice(-7).reduce((s, r) => s + (r.duration || 0), 0) / Math.min(sessions.length, 7);
        factors.sessionLengthExcess = Math.min(1, Math.max(0, (avgDuration - 60) / 60));
    } else {
        factors.sessionLengthExcess = 0;
    }

    // F2: Streak pressure (long streak + dropping performance)
    const streak = pkg.momentum?.currentStreak || 0;
    const streakHealth = pkg.momentum?.streakHealth || 1;
    factors.streakPressure = streak > 14 && streakHealth < 0.5 ? 0.8 : streak > 7 && streakHealth < 0.7 ? 0.4 : 0;

    // F3: Mood decline (3+ days of mood ≤ 2/5)
    const moods = pkg.wellbeing?.moodTrend || [];
    const recentBadMoods = moods.slice(-5).filter(m => {
        const e = m.energy || 0.5;
        return e < 0.3 || m.mood === 'frustrated' || m.mood === 'overwhelmed';
    });
    factors.moodDecline = recentBadMoods.length >= 3 ? 1.0 : recentBadMoods.length >= 2 ? 0.5 : 0;

    // F4: Abandonment spike (2+ in 7 days)
    const abandons = pkg.missions?.abandoned || [];
    const recentAbandons = abandons.filter(a =>
        a.abandonedAt && (Date.now() - new Date(a.abandonedAt).getTime()) < 7 * 24 * 3600000
    );
    factors.abandonmentSpike = recentAbandons.length >= 2 ? 0.9 : recentAbandons.length >= 1 ? 0.3 : 0;

    // F5: Performance drop
    const challenges = [];
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    for (const skill of skillsArr) {
        if (skill.challengeHistory) {
            challenges.push(...skill.challengeHistory.slice(-5));
        }
    }
    challenges.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (challenges.length >= 6) {
        const recentScores = challenges.slice(0, 3).map(c => c.score);
        const olderScores = challenges.slice(3, 6).map(c => c.score);
        const recentAvg = recentScores.reduce((s, v) => s + v, 0) / 3;
        const olderAvg = olderScores.reduce((s, v) => s + v, 0) / 3;
        factors.performanceDrop = recentAvg < olderAvg * 0.8 ? 0.7 : 0;
    } else {
        factors.performanceDrop = 0;
    }

    const risk = 0.2 * factors.sessionLengthExcess +
        0.2 * factors.streakPressure +
        0.25 * factors.moodDecline +
        0.15 * factors.abandonmentSpike +
        0.2 * factors.performanceDrop;

    return {
        score: Math.min(1, Math.max(0, Math.round(risk * 100) / 100)),
        factors,
        level: risk > 0.85 ? 'critical' : risk > 0.7 ? 'high' : risk > 0.5 ? 'moderate' : 'low'
    };
}

// ========================================
// OVERLEARNING DETECTION
// ========================================

function detectOverlearning(pkg) {
    const sessions = pkg.behavior?.sessionHistory || [];
    if (sessions.length < 5) return { detected: false, skill: null, score: 0 };

    // Estimate skill focus from challenges
    const skillFocus = {};
    let totalChallenges = 0;
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    for (const skill of skillsArr) {
        const name = skill.skillId || skill.displayName || 'unknown';
        const recent = (skill.challengeHistory || []).filter(c =>
            c.date && (Date.now() - new Date(c.date).getTime()) < 7 * 24 * 3600000
        );
        skillFocus[name] = recent.length;
        totalChallenges += recent.length;
    }

    if (totalChallenges < 3) return { detected: false, skill: null, score: 0 };

    // Find the most focused skill
    let maxSkill = null;
    let maxCount = 0;
    for (const [name, count] of Object.entries(skillFocus)) {
        if (count > maxCount) { maxCount = count; maxSkill = name; }
    }

    const focusRatio = maxCount / totalChallenges;
    const skill = skillsArr.find(s => s.skillId === maxSkill);
    const entropy = skill ? (skill.entropyRate ?? 0.5) : 0.5;
    const overlearningScore = focusRatio * (1 - entropy);

    return {
        detected: overlearningScore > 0.7,
        skill: maxSkill,
        score: Math.round(overlearningScore * 100) / 100,
        focusRatio: Math.round(focusRatio * 100) / 100
    };
}

// ========================================
// INTERVENTION TRIGGERS
// ========================================

function getInterventions(pkg) {
    const interventions = [];
    const burnout = calculateBurnoutRisk(pkg);
    const overlearning = detectOverlearning(pkg);
    const momentumScore = calculateMomentumScore(pkg);

    // P0: Critical burnout
    if (burnout.score > 0.85) {
        interventions.push({
            id: 'burnout_p0',
            priority: 0,
            type: 'force_break',
            title: 'Take a Break',
            message: 'Your body needs rest. Take today off — your streak is safe.',
            severity: 'critical'
        });
    } else if (burnout.score > 0.6) {
        interventions.push({
            id: 'burnout_p1',
            priority: 1,
            type: 'suggest_break',
            title: 'Consider a Break',
            message: 'Your burnout indicators are elevated. A short break would help you perform better.',
            severity: 'warning'
        });
    }

    // Overlearning nudge
    if (overlearning.detected) {
        interventions.push({
            id: 'overlearning',
            priority: 2,
            type: 'suggest_diversify',
            title: 'Diversify Your Learning',
            message: `You've been deep-diving into ${overlearning.skill}. Try exploring adjacent skills to build a stronger foundation.`,
            severity: 'info',
            data: { skill: overlearning.skill, focusRatio: overlearning.focusRatio }
        });
    }

    // Entropy spike warning
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    if (skillsArr.length > 0) {
        const highEntropy = skillsArr
            .filter(s => (s.entropyRate ?? 0.5) > 0.8);
        if (highEntropy.length >= 3) {
            interventions.push({
                id: 'entropy_spike',
                priority: 1,
                type: 'decay_warning',
                title: 'Skills Fading',
                message: `${highEntropy.length} skills have high entropy. A quick 15-minute refresher can make a huge difference.`,
                severity: 'warning',
                data: { skills: highEntropy.map(s => s.skillId || s.displayName || 'unknown') }
            });
        }
    }

    // Stagnation detection
    if (momentumScore < 0.2 && (pkg.momentum?.weeklyActiveMinutes || 0) > 60) {
        interventions.push({
            id: 'stagnation',
            priority: 2,
            type: 'stagnation_nudge',
            title: 'Growth Has Stalled',
            message: "You're putting in the time, but growth has slowed. Try a harder challenge or a different approach.",
            severity: 'info'
        });
    }

    return interventions.sort((a, b) => a.priority - b.priority);
}

// ========================================
// PUBLIC API
// ========================================

async function getStatus(userId) {
    const pkg = await pkgService.getPKG(userId);
    const momentumScore = calculateMomentumScore(pkg);
    const burnout = calculateBurnoutRisk(pkg);
    const overlearning = detectOverlearning(pkg);

    // Learning velocity across all skills
    let avgVelocity = 0;
    let skillCount = 0;
    const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    for (const skill of skillsArr) {
        if (skill.learningVelocity) {
            avgVelocity += skill.learningVelocity;
            skillCount++;
        }
    }
    avgVelocity = skillCount > 0 ? Math.round((avgVelocity / skillCount) * 1000) / 1000 : 0;

    // High entropy skills count
    let highEntropyCount = 0;
    for (const skill of skillsArr) {
        if ((skill.entropyRate ?? 0.5) > 0.7) highEntropyCount++;
    }

    return {
        momentum: {
            score: momentumScore,
            streak: pkg.momentum?.currentStreak || 0,
            longestStreak: pkg.momentum?.longestStreak || 0,
            weeklyMinutes: pkg.momentum?.weeklyActiveMinutes || 0
        },
        burnout: {
            risk: burnout.score,
            level: burnout.level,
            factors: burnout.factors
        },
        overlearning: {
            detected: overlearning.detected,
            skill: overlearning.skill,
            score: overlearning.score
        },
        velocity: {
            average: avgVelocity,
            trend: avgVelocity > 0.05 ? 'accelerating' : avgVelocity < -0.02 ? 'slowing' : 'stable'
        },
        entropy: {
            highEntropyCount,
            totalSkills: skillsArr.length
        }
    };
}

async function getActiveInterventions(userId) {
    const pkg = await pkgService.getPKG(userId);
    return getInterventions(pkg);
}

async function getAnalytics(userId) {
    const pkg = await pkgService.getPKG(userId);
    const status = await getStatus(userId);

    // Build velocity chart data from all skills
    const velocityData = [];
    const analyticsSkillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];
    for (const skill of analyticsSkillsArr) {
        const name = skill.skillId || skill.displayName || 'unknown';
        if (skill.velocityHistory?.length) {
            velocityData.push({
                skill: name,
                history: skill.velocityHistory.slice(-30).map(v => ({
                    date: v.date,
                    delta: v.delta
                }))
            });
        }
    }

    // Build momentum timeline from session history
    const momentumTimeline = (pkg.behavior?.sessionHistory || []).slice(-30).map(s => ({
        date: s.date,
        duration: s.duration,
        focusScore: s.focusScore
    }));

    return {
        ...status,
        velocityData,
        momentumTimeline,
        burnoutHistory: (pkg.wellbeing?.burnoutHistory || []).slice(-30),
        moodTrend: (pkg.wellbeing?.moodTrend || []).slice(-30)
    };
}

export default {
    getStatus,
    getActiveInterventions,
    getAnalytics,
    calculateMomentumScore,
    calculateBurnoutRisk,
    detectOverlearning,
    getInterventions
};
