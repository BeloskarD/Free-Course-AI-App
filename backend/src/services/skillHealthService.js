import { learnerProfileRepository } from '../repositories/index.js';
import Groq from 'groq-sdk';
import { extractJSON } from '../utils/aiUtils.js';

const DAY_IN_MS = 86400000;

const getGroqClient = () => new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

class SkillHealthService {
    async getDashboard(userId) {
        const profile = await learnerProfileRepository.findByUserId(userId);
        const skills = this._normalizeSkills(profile?.masteredSkills || []);
        const stats = this._calculateAggregateHealth(skills);

        return {
            overallHealth: stats.average,
            healthyCount: stats.healthyCount,
            dormantCount: stats.dormantCount,
            warningCount: stats.warningCount,
            criticalCount: stats.criticalCount,
            totalSkills: stats.totalSkills,
            isDecayed: stats.warningCount + stats.criticalCount + stats.dormantCount > 0,
            criticalSkills: skills.filter((skill) => skill.health.status === 'critical').map((skill) => skill.name),
            skills,
            skillBreakdown: skills.map((skill) => ({
                name: skill.name,
                health: skill.health.score,
                lastPracticed: skill.lastPracticed,
                level: skill.level,
                trend: skill.trend,
                status: skill.health.status,
            })),
        };
    }

    async recalculateHealth(userId) {
        let profile = await learnerProfileRepository.findByUserId(userId);
        if (!profile) {
            return { success: true, updated: 0 };
        }

        // --- NEW: Self-Healing Sync from PKG (Source of Truth) ---
        // This ensures that if syncSkill failed in the past, we can recover missing skills.
        const pkg = await (await import('./pkgService.js')).default.getPKG(userId);
        const pkgSkills = Array.isArray(pkg.skills) ? pkg.skills : [];
        
        const existingSkills = [...(profile.masteredSkills || [])];
        const existingNames = new Set(existingSkills.map(s => s.name.toLowerCase().trim()));
        
        let addedCount = 0;
        for (const pkgSkill of pkgSkills) {
            const displayName = pkgSkill.displayName || pkgSkill.skillId;
            if (displayName && !existingNames.has(displayName.toLowerCase().trim())) {
                existingSkills.push({
                    name: displayName,
                    level: pkgSkill.level || 10,
                    health: { score: 100, lastAssessed: new Date(), status: 'healthy' },
                    lastPracticed: new Date(),
                    confidence: 'medium'
                });
                addedCount++;
                console.log(`[SkillHealth] Restored missing skill from PKG during recalculate: ${displayName}`);
            }
        }

        const normalizedSkills = this._normalizeSkills(existingSkills);
        const now = new Date();

        const updatedSkills = normalizedSkills.map((skill) => {
            const decay = this._calculateDecay(skill);
            const nextScore = this._clamp(skill.health.score - decay);
            const status = this._determineStatus(nextScore, skill.health.daysSinceLastPractice);
            const sustainedDays = nextScore >= 80 ? (skill.proof?.sustainedDays || 0) + 1 : 0;

            return {
                ...skill,
                health: {
                    ...skill.health,
                    score: nextScore,
                    status,
                    streak: nextScore >= 80 ? (skill.health.streak || 0) + 1 : 0,
                    lastAssessed: now,
                },
                proof: {
                    ...skill.proof,
                    sustainedDays,
                    badgeLevel: this._resolveBadgeLevel(sustainedDays),
                },
            };
        });

        await learnerProfileRepository.update(profile.id || profile._id, { masteredSkills: updatedSkills });
        return { success: true, updated: updatedSkills.length, restored: addedCount };
    }

    async getChallenges(userId, skillName) {
        const profile = await learnerProfileRepository.findByUserId(userId);
        const skills = this._normalizeSkills(profile?.masteredSkills || []);
        const skill = skills.find((item) => item.name.toLowerCase() === skillName.toLowerCase());

        const fallbackChallenge = this._getFallbackChallenge(skill || { name: skillName, level: 25 }, false);

        if (!skill || !process.env.GROQ_API_KEY) {
            return fallbackChallenge;
        }

        try {
            const groqClient = getGroqClient();
            const prompt = [
                `Create one short, practical micro-challenge for the skill "${skill.name}".`,
                `User level: ${skill.level}/100.`,
                `Current health: ${skill.health.score}/100 (${skill.health.status}).`,
                `Ensure this question is entirely unique and covers a different angle or scenario than standard textbook examples. Random generation seed: ${Date.now()}_${Math.random()}`,
                'Return valid JSON only with this shape:',
                '{"challenge":{"id":"string","question":"string","options":["string"],"correctAnswer":"string","difficulty":"easy|medium|hard","type":"quiz|explain","timeLimit":180,"points":10,"topic":"string","explanation":"string"}}'
            ].join(' ');

            const completion = await groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 500,
            });

            const parsed = extractJSON(completion.choices?.[0]?.message?.content || '');
            const challenge = this._normalizeChallenge(parsed?.challenge || parsed, skill, false);

            return challenge || fallbackChallenge;
        } catch (error) {
            return fallbackChallenge;
        }
    }

    async generateAIChallenge(userId, skillName, difficulty = 'medium') {
        const profile = await learnerProfileRepository.findByUserId(userId);
        const skills = this._normalizeSkills(profile?.masteredSkills || []);
        const skill = skills.find((item) => item.name.toLowerCase() === skillName.toLowerCase());

        if (!skill) {
            return this._getFallbackChallenge({ name: skillName, level: 25 }, true, difficulty);
        }

        try {
            if (!process.env.GROQ_API_KEY) {
                return this._getFallbackChallenge(skill, true, difficulty);
            }

            const groqClient = getGroqClient();
            const prompt = [
                `Create one personalized AI micro-challenge for the skill "${skill.name}".`,
                `Difficulty: ${difficulty}.`,
                `User level: ${skill.level}/100.`,
                `Current health: ${skill.health.score}/100 (${skill.health.status}).`,
                'Use either multiple choice or a short explain prompt.',
                `Ensure this question explores a completely unique, fresh scenario and avoids repeating past questions. Random generation seed: ${Date.now()}_${Math.random()}`,
                'Return valid JSON only with this shape:',
                '{"challenge":{"id":"string","question":"string","options":["string"],"correctAnswer":"string","difficulty":"easy|medium|hard","type":"quiz|explain","timeLimit":180,"points":10,"topic":"string","explanation":"string"}}'
            ].join(' ');

            const completion = await groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 600,
            });

            const parsed = extractJSON(completion.choices?.[0]?.message?.content || '');
            return this._normalizeChallenge(parsed?.challenge || parsed, skill, true, difficulty)
                || this._getFallbackChallenge(skill, true, difficulty);
        } catch (error) {
            return this._getFallbackChallenge(skill, true, difficulty);
        }
    }

    async submitAnswer(userId, payload) {
        const profile = await learnerProfileRepository.findByUserId(userId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        const normalizedSkills = this._normalizeSkills(profile.masteredSkills || []);
        const skillIndex = normalizedSkills.findIndex((skill) => skill.name.toLowerCase() === payload.skillName.toLowerCase());

        if (skillIndex === -1) {
            throw new Error('Skill not found');
        }

        const skill = normalizedSkills[skillIndex];
        const isCorrect = Boolean(payload.isCorrect);
        const healthBoost = isCorrect ? 15 : -5;
        const nextScore = this._clamp(skill.health.score + healthBoost);
        const nextStreak = isCorrect ? (skill.health.streak || 0) + 1 : 0;
        const now = new Date();
        const status = this._determineStatus(nextScore, 0);
        const sustainedDays = nextScore >= 80 ? Math.max(skill.proof?.sustainedDays || 0, nextStreak) : 0;

        normalizedSkills[skillIndex] = {
            ...skill,
            level: isCorrect ? this._clamp(skill.level + 3) : skill.level,
            lastPracticed: now,
            challenges: [
                {
                    date: now,
                    type: payload.challengeType || 'quiz',
                    score: isCorrect ? 100 : 40,
                    timeSpent: Number(payload.timeSpent) || 0,
                },
                ...(skill.challenges || []),
            ].slice(0, 20),
            health: {
                ...skill.health,
                score: nextScore,
                status,
                streak: nextStreak,
                lastAssessed: now,
                daysSinceLastPractice: 0,
            },
            proof: {
                ...skill.proof,
                sustainedDays,
                badgeLevel: this._resolveBadgeLevel(sustainedDays),
            },
            trend: this._calculateTrend(nextScore),
        };

        await learnerProfileRepository.update(profile.id, { masteredSkills: normalizedSkills });

        return {
            healthBoost,
            newHealth: nextScore,
            newStatus: status,
            streak: nextStreak,
        };
    }

    async getNotifications(userId) {
        const profile = await learnerProfileRepository.findByUserId(userId);
        const skills = this._normalizeSkills(profile?.masteredSkills || []);

        return skills
            .filter((skill) => skill.health.status !== 'healthy')
            .sort((a, b) => this._notificationPriority(a.health.status) - this._notificationPriority(b.health.status))
            .map((skill) => ({
                title: 'Skill Health Warning',
                skillName: skill.name,
                message: this._buildNotificationMessage(skill),
                type: skill.health.status === 'dormant' ? 'warning' : skill.health.status,
                priority: this._notificationPriority(skill.health.status),
            }));
    }

    _normalizeSkills(skills) {
        return (skills || [])
            .map((rawSkill) => this._normalizeSkill(rawSkill))
            .filter(Boolean)
            .sort((a, b) => {
                const healthDiff = a.health.score - b.health.score;
                if (healthDiff !== 0) {
                    return healthDiff;
                }
                return a.name.localeCompare(b.name);
            });
    }

    _normalizeSkill(rawSkill) {
        if (!rawSkill?.name) {
            return null;
        }

        const lastPracticed = this._toDate(rawSkill.lastPracticed);
        const daysSinceLastPractice = this._daysSince(lastPracticed);
        const level = this._clamp(rawSkill.level ?? 0);
        const rawHealthScore = typeof rawSkill.health === 'number'
            ? rawSkill.health
            : rawSkill.health?.score;

        const healthScore = this._clamp(
            Number.isFinite(Number(rawHealthScore))
                ? Number(rawHealthScore)
                : this._deriveHealthScore(level, daysSinceLastPractice)
        );

        const status = rawSkill.health?.status || this._determineStatus(healthScore, daysSinceLastPractice);
        const lastAssessed = this._toDate(rawSkill.health?.lastAssessed) || lastPracticed || new Date();
        const streak = Number(rawSkill.health?.streak) || 0;
        const sustainedDays = Number(rawSkill.proof?.sustainedDays) || 0;

        return {
            ...rawSkill,
            name: String(rawSkill.name).trim(),
            level,
            lastPracticed,
            health: {
                score: healthScore,
                status,
                streak,
                lastAssessed,
                daysSinceLastPractice,
            },
            proof: {
                ...rawSkill.proof,
                sustainedDays,
                badgeLevel: rawSkill.proof?.badgeLevel || this._resolveBadgeLevel(sustainedDays),
            },
            challenges: Array.isArray(rawSkill.challenges) ? rawSkill.challenges : [],
            trend: this._calculateTrend(healthScore),
        };
    }

    _normalizeChallenge(rawChallenge, skill, isAIGenerated, requestedDifficulty = 'medium') {
        if (!rawChallenge?.question) {
            return null;
        }

        const options = Array.isArray(rawChallenge.options)
            ? rawChallenge.options.filter(Boolean).map((option) => String(option))
            : [];

        const correctAnswer = typeof rawChallenge.correctAnswer === 'string'
            ? rawChallenge.correctAnswer
            : Number.isInteger(rawChallenge.correctOption) && options[rawChallenge.correctOption]
                ? options[rawChallenge.correctOption]
                : options[0] || 'Practice core concepts and try again.';

        return {
            id: String(rawChallenge.id || `challenge-${Date.now()}`),
            question: String(rawChallenge.question),
            options,
            correctAnswer,
            difficulty: rawChallenge.difficulty || requestedDifficulty,
            type: rawChallenge.type || (options.length > 0 ? 'quiz' : 'explain'),
            timeLimit: Number(rawChallenge.timeLimit) || 180,
            points: Number(rawChallenge.points) || 10,
            topic: rawChallenge.topic || skill.name,
            explanation: rawChallenge.explanation || `Review ${skill.name} fundamentals and practice the core workflow once more.`,
            isAIGenerated,
        };
    }

    _getFallbackChallenge(skill, isAIGenerated, difficulty = 'medium') {
        const templates = {
            beginner: {
                question: `Which statement best describes the main purpose of ${skill.name}?`,
                options: [
                    `${skill.name} helps solve a real technical task or workflow.`,
                    `${skill.name} is only useful for design mockups.`,
                    `${skill.name} is unrelated to software delivery.`,
                    `${skill.name} cannot be practiced hands-on.`
                ],
                correctAnswer: `${skill.name} helps solve a real technical task or workflow.`,
            },
            advanced: {
                question: `Explain one practical scenario where strong ${skill.name} skills improve delivery quality or speed.`,
                options: [],
                correctAnswer: `A strong answer connects ${skill.name} to a concrete workflow, decision, or measurable outcome.`,
            },
        };

        const template = skill.level >= 60 ? templates.advanced : templates.beginner;

        return {
            id: `fallback-${skill.name.toLowerCase().replace(/\s+/g, '-')}`,
            question: template.question,
            options: template.options,
            correctAnswer: template.correctAnswer,
            difficulty,
            type: template.options.length > 0 ? 'quiz' : 'explain',
            timeLimit: 180,
            points: 10,
            topic: skill.name,
            explanation: `Practice a focused ${skill.name} task to reinforce this skill.`,
            isAIGenerated,
        };
    }

    _calculateDecay(skill) {
        // BUG FIX: Decay must be calculated based on days since LAST ASSESSED, not last practiced.
        // Otherwise, repeatedly clicking "Sync" subtracts the total historical penalty from the already decayed score.
        const lastAssessed = skill.health?.lastAssessed || skill.lastPracticed || new Date();
        const daysSinceLastAssessed = this._daysSince(lastAssessed);

        if (daysSinceLastAssessed < 1) {
            return 0; // Already assessed today, no further decay penalty
        }

        let decayRate = 1.5;
        if (skill.level >= 80) {
            decayRate = 0.75;
        } else if (skill.level <= 30) {
            decayRate = 2.5;
        }

        return Math.round(daysSinceLastAssessed * decayRate);
    }

    _deriveHealthScore(level, daysSinceLastPractice) {
        const startingScore = Math.max(55, Math.min(100, Number(level) || 0));
        return this._clamp(startingScore - Math.max(0, daysSinceLastPractice - 1) * 2);
    }

    _determineStatus(score, daysSinceLastPractice) {
        if (daysSinceLastPractice >= 21 || score < 40) {
            return 'critical';
        }
        if (daysSinceLastPractice >= 10 || score < 60) {
            return 'warning';
        }
        if (daysSinceLastPractice >= 4 || score < 80) {
            return 'dormant';
        }
        return 'healthy';
    }

    _calculateAggregateHealth(skills) {
        if (!skills.length) {
            return {
                average: 0,
                totalSkills: 0,
                healthyCount: 0,
                dormantCount: 0,
                warningCount: 0,
                criticalCount: 0,
            };
        }

        const stats = skills.reduce((acc, skill) => {
            acc.totalScore += skill.health.score;
            acc.totalSkills += 1;
            acc[`${skill.health.status}Count`] += 1;
            return acc;
        }, {
            totalScore: 0,
            totalSkills: 0,
            healthyCount: 0,
            dormantCount: 0,
            warningCount: 0,
            criticalCount: 0,
        });

        return {
            average: Math.round(stats.totalScore / stats.totalSkills),
            totalSkills: stats.totalSkills,
            healthyCount: stats.healthyCount,
            dormantCount: stats.dormantCount,
            warningCount: stats.warningCount,
            criticalCount: stats.criticalCount,
        };
    }

    _calculateTrend(score) {
        if (score >= 85) {
            return 'stable';
        }
        if (score >= 60) {
            return 'warning';
        }
        return 'declining';
    }

    _buildNotificationMessage(skill) {
        const daysSince = skill.health.daysSinceLastPractice;
        if (skill.health.status === 'critical') {
            return `Your ${skill.name} skill needs attention. It has not been practiced for ${daysSince} days and is down to ${skill.health.score}% health.`;
        }
        if (skill.health.status === 'warning') {
            return `Your ${skill.name} skill is fading. A quick refresh now will help prevent further decay.`;
        }
        return `${skill.name} is resting. A short practice session will keep the momentum alive.`;
    }

    _notificationPriority(status) {
        if (status === 'critical') {
            return 1;
        }
        if (status === 'warning') {
            return 2;
        }
        return 3;
    }

    _resolveBadgeLevel(sustainedDays) {
        if (sustainedDays >= 180) {
            return 'platinum';
        }
        if (sustainedDays >= 90) {
            return 'gold';
        }
        if (sustainedDays >= 60) {
            return 'silver';
        }
        if (sustainedDays >= 30) {
            return 'bronze';
        }
        return null;
    }

    _daysSince(dateValue) {
        if (!dateValue) {
            return 999;
        }

        return Math.max(0, Math.floor((Date.now() - dateValue.getTime()) / DAY_IN_MS));
    }

    _toDate(value) {
        if (!value) {
            return null;
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    _clamp(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
            return 0;
        }

        return Math.max(0, Math.min(100, Math.round(numeric)));
    }
}

export default new SkillHealthService();
