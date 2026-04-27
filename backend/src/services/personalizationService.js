import { learnerProfileRepository, userRepository, pkgRepository, userProgressRepository } from '../repositories/index.js';
import Groq from 'groq-sdk';
import { extractJSON } from '../utils/aiUtils.js';
import unifiedSkillSyncService from './unifiedSkillSync.service.js';

// Initialize Groq client
const getGroqClient = () => new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * PERSONALIZATION SERVICE
 * =======================
 * Handles AI-driven learning paths and profile management.
 */
class PersonalizationService {
    /**
     * Get learner profile
     */
    async getProfile(userId) {
        let profile = await learnerProfileRepository.findByUserId(userId);
        
        if (!profile) {
            profile = await learnerProfileRepository.create({
                userId,
                goals: { isOnboarded: false },
            });
        }
        
        // Ensure PKG exists
        await pkgRepository.getOrCreate(userId);
        
        return profile;
    }

    /**
     * Update learner profile
     */
    async updateProfile(userId, { goals, preferences, masteredSkills }) {
        let profile = await learnerProfileRepository.findByUserId(userId);
        if (!profile) {
            profile = await learnerProfileRepository.create({ userId });
        }

        const updates = {};

        if (goals) {
            updates.goals = {
                ...(profile.goals || {}),
                ...goals,
                isOnboarded: true,
            };
        }

        if (preferences) {
            updates.preferences = {
                ...(profile.preferences || {}),
                ...preferences,
            };
        }

        if (masteredSkills && masteredSkills.length > 0) {
            const existingSkillMap = new Map(
                (profile.masteredSkills || []).map(s => [s.name, s])
            );

            masteredSkills.forEach(newSkill => {
                const existing = existingSkillMap.get(newSkill.name);
                if (existing) {
                    if (newSkill.level > (existing.level || 0)) {
                        existingSkillMap.set(newSkill.name, {
                            ...existing,
                            level: newSkill.level,
                            confidence: newSkill.confidence || existing.confidence,
                            lastPracticed: new Date(),
                        });
                    }
                } else {
                    existingSkillMap.set(newSkill.name, {
                        name: newSkill.name,
                        level: newSkill.level,
                        confidence: newSkill.confidence || 'low',
                        sources: newSkill.sources || ['self-assessment'],
                        lastPracticed: new Date(),
                        health: { score: 100, lastAssessed: new Date(), status: 'healthy' }
                    });
                }
            });

            updates.masteredSkills = Array.from(existingSkillMap.values());
            
            // Sync new skills in parallel across other silos (Progress, PKG)
            try {
                await Promise.all(
                    masteredSkills.map(skill => 
                        unifiedSkillSyncService.syncSkill(userId, skill.name, skill.level, { skipProfile: true })
                    )
                );
            } catch (syncError) {
                console.error('[PersonalizationService] Background skill sync partially failed:', syncError.message);
            }
        }

        const nextProfile = await learnerProfileRepository.update(profile.id, updates);

        const resolvedGoals = nextProfile?.goals || updates.goals || profile.goals || {};
        const resolvedSkills = nextProfile?.masteredSkills || updates.masteredSkills || profile.masteredSkills || [];
        const targetRole = resolvedGoals.targetRole || 'Software Engineer';

        // Update User Onboarding Status
        await userRepository.updateProfile(userId, {
            onboardingStatus: {
                roleDefined: Boolean(resolvedGoals.targetRole),
                skillsDefined: resolvedSkills.length > 0,
                isOnboarded: true
            },
        });

        // Update Progress Tracker
        const existingProgress = await userProgressRepository.findByUserId(userId);
        if (existingProgress?.id) {
            await userProgressRepository.update(existingProgress.id, { targetRole });
        } else {
            await userProgressRepository.create({ userId, targetRole });
        }

        // Update Career PKG
        const pkg = await pkgRepository.getOrCreate(userId);
        if (pkg?.id) {
            await pkgRepository.update(pkg.id, {
                career: {
                    ...(pkg.career || {}),
                    targetRole,
                },
            });
        }

        return nextProfile;
    }

    /**
     * Get Hiring Readiness Score
     */
    async getReadiness(userId) {
        const profile = await learnerProfileRepository.findByUserId(userId);
        const pkg = await pkgRepository.findByUserId(userId);

        if (!profile) return { score: 0, breakdown: { skills: 0, projects: 0, experience: 0 } };

        const skills = profile.masteredSkills || [];
        const avgSkillLevel = skills.length > 0 
            ? skills.reduce((sum, s) => sum + (s.level || 0), 0) / skills.length 
            : 0;
        
        let skillScore = Math.min(100, avgSkillLevel * 1.2); 
        const projectsCount = pkg?.career?.projects?.length || 0;
        let projectScore = Math.min(100, projectsCount * 20);
        const experience = profile.portfolio?.experience || [];
        let expScore = Math.min(100, experience.length * 25);

        const overallScore = Math.round((skillScore * 0.5) + (projectScore * 0.3) + (expScore * 0.2));

        return {
            score: overallScore,
            breakdown: {
                skills: Math.round(skillScore),
                projects: Math.round(projectScore),
                experience: Math.round(expScore)
            },
            targetRole: profile.goals?.targetRole || 'Professional',
            lastUpdated: new Date()
        };
    }

    /**
     * Generate Weekly Plan (AI)
     */
    async generateWeeklyPlan(userId) {
        const profile = await learnerProfileRepository.findByUserId(userId);
        const user = await userRepository.findById(userId);

        if (!profile) throw new Error('Profile not found. Complete onboarding first.');

        const targetRole = profile.goals?.targetRole || 'Software Developer';
        const sessionLength = profile.preferences?.sessionLength || 30;
        const preferredDifficulty = profile.preferences?.difficultyComfort || 'medium';
        const format = profile.preferences?.format || 'mixed';

        const savedCourses = user?.savedCourses || [];
        const courseContext = savedCourses.slice(0, 5).map(c => ({
            title: c.title,
            platform: c.platform,
            type: c.type,
            level: c.level,
        }));

        const currentSkills = profile.masteredSkills || [];
        const skillContext = currentSkills.map(s => ({
            name: s.name,
            level: s.level,
            lastPracticed: s.lastPracticed,
        }));

        const previousPlan = profile.currentPlan;
        let rolloverTasks = [];
        let completionRate = 0;
        let adaptedDifficulty = preferredDifficulty;

        if (previousPlan?.tasks?.length > 0) {
            const totalTasks = previousPlan.tasks.length;
            const completedTasks = previousPlan.tasks.filter(t => t.status === 'completed').length;
            completionRate = Math.round((completedTasks / totalTasks) * 100);

            rolloverTasks = previousPlan.tasks
                .filter(t => t.status === 'pending' || t.status === 'in_progress')
                .slice(0, 2)
                .map(t => ({
                    ...t,
                    id: t.id.startsWith('rollover-') ? t.id : `rollover-${t.id}`,
                    isRollover: true,
                }));

            if (completionRate >= 90) {
                adaptedDifficulty = preferredDifficulty === 'easy' ? 'medium' : preferredDifficulty === 'medium' ? 'hard' : 'hard';
            } else if (completionRate < 50) {
                adaptedDifficulty = preferredDifficulty === 'hard' ? 'medium' : preferredDifficulty === 'medium' ? 'easy' : 'easy';
            }
        }

        const recentSessions = profile.recentSessions?.slice(0, 14) || [];
        const totalMinutes = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const avgMinutesPerDay = recentSessions.length > 0
            ? Math.round(totalMinutes / Math.min(14, recentSessions.length))
            : sessionLength;

        const experienceLevel = profile.goals?.experienceLevel || 'junior';
        const targetField = profile.goals?.targetField || 'General Tech';

        const groqClient = getGroqClient();
        const prompt = this._buildPlanPrompt({
            targetRole, targetField, experienceLevel, profile, format, 
            sessionLength, adaptedDifficulty, courseContext, skillContext, 
            completionRate, rolloverTasks, avgMinutesPerDay
        });

        const completion = await groqClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500,
        });

        let planData;
        try {
            planData = extractJSON(completion.choices[0].message.content);
            if (!planData) throw new Error("JSON extraction failed");
        } catch (parseError) {
            planData = this._generateEnhancedFallbackPlan(targetRole, sessionLength, adaptedDifficulty, courseContext);
        }

        const allTasks = [
            ...rolloverTasks,
            ...(planData.tasks || []).map((t, idx) => ({
                ...t,
                id: `task-${Date.now()}-${idx}`,
                status: 'pending',
                skill: this._sanitizeSkill(t.skill)
            })),
        ];

        const updatedPlan = {
            weekStartDate: new Date(),
            tasks: allTasks,
            etaToJobReady: typeof planData.etaToJobReady === 'string' ? planData.etaToJobReady : '12 weeks',
            weeklyFocus: typeof planData.weeklyFocus === 'string' ? planData.weeklyFocus : 'Weekly Focus',
            skillsTargeted: Array.isArray(planData.skillsTargeted) ? planData.skillsTargeted.map(s => this._sanitizeSkill(s)) : [],
            generatedAt: new Date(),
            previousCompletionRate: completionRate,
            adaptedDifficulty,
        };

        const velocityUpdates = {
            adaptiveVelocity: {
                ...(profile.adaptiveVelocity || {}),
                weeklyTarget: Math.round(avgMinutesPerDay * 5 / 60),
                lastCalculated: new Date(),
            },
            currentPlan: updatedPlan
        };

        await learnerProfileRepository.update(profile.id, velocityUpdates);
        return { 
            plan: updatedPlan, 
            weeklyFocus: updatedPlan.weeklyFocus, 
            motivationalNote: planData.motivationalNote 
        };
    }

    /**
     * Update task status
     */
    async updateTaskStatus(userId, taskId, status) {
        const profile = await learnerProfileRepository.findByUserId(userId);
        if (!profile || !profile.currentPlan?.tasks) throw new Error('No plan found');

        const tasks = [...profile.currentPlan.tasks];
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) throw new Error('Task not found');

        tasks[taskIndex].status = status;

        if (status === 'completed') {
            tasks[taskIndex].completedAt = new Date();
            try {
                const user = await userRepository.findById(userId);
                if (user) {
                    const currentXP = user.gamification?.xp || 0;
                    await userRepository.update(userId, { 
                        'gamification.xp': currentXP + 25,
                        'gamification.lastActive': new Date()
                    });
                }
            } catch (xpErr) {
                console.warn('⚠️ XP award failed:', xpErr.message);
            }
        }

        return await learnerProfileRepository.update(profile.id, { 'currentPlan.tasks': tasks });
    }

    /**
     * Log learning session
     */
    async logSession(userId, { duration, type, skillsPracticed, performance, feedback }) {
        let profile = await learnerProfileRepository.findByUserId(userId);
        if (!profile) throw new Error('Profile not found');

        const recentSessions = [...(profile.recentSessions || [])];
        recentSessions.unshift({
            date: new Date(),
            duration,
            type,
            skillsPracticed: skillsPracticed || [],
            performance,
            feedback,
        });

        const updates = {
            recentSessions: recentSessions.slice(0, 50),
            'adaptiveVelocity.actualThisWeek': (profile.adaptiveVelocity?.actualThisWeek || 0) + (duration / 60),
            'wellbeing.lastCheckIn': new Date()
        };

        if (skillsPracticed && performance >= 70) {
            const masteredSkills = [...(profile.masteredSkills || [])];
            skillsPracticed.forEach(skillName => {
                const existingSkill = masteredSkills.find(s => s.name === skillName);
                if (existingSkill) {
                    existingSkill.level = Math.min(existingSkill.level + 5, 100);
                    existingSkill.lastPracticed = new Date();
                } else {
                    masteredSkills.push({
                        name: skillName,
                        level: 10,
                        confidence: 'low',
                        lastPracticed: new Date(),
                        sources: [type],
                    });
                }
            });
            updates.masteredSkills = masteredSkills;
            
            // Sync skills to other modules
            for (const skillName of skillsPracticed) {
                const updatedSkill = masteredSkills.find(s => s.name === skillName);
                if (updatedSkill) {
                    unifiedSkillSyncService.syncSkill(userId, skillName, updatedSkill.level, { skipProfile: true }).catch(e => console.warn(e));
                }
            }
        }

        return await learnerProfileRepository.update(profile.id, updates);
    }

    /**
     * Get Skill Graph
     */
    async getSkillGraph(userId) {
        const profile = await learnerProfileRepository.findByUserId(userId);
        const user = await userRepository.findById(userId);
        const pkg = await pkgRepository.findByUserId(userId);

        const skillsMap = new Map();

        profile?.masteredSkills?.forEach(skill => {
            const cleanName = this._sanitizeSkill(skill.name);
            skillsMap.set(cleanName.toLowerCase(), {
                name: cleanName,
                level: skill.level,
                confidence: skill.confidence,
                lastPracticed: skill.lastPracticed,
                sources: skill.sources,
            });
        });

        const keywords = ['JavaScript', 'React', 'Node.js', 'Python', 'AI', 'Machine Learning', 'DevOps', 'AWS', 'TypeScript', 'MongoDB', 'NLP', 'SQL', 'Docker'];
        user?.savedCourses?.forEach(course => {
            keywords.forEach(skill => {
                if (course.title.toLowerCase().includes(skill.toLowerCase())) {
                    const lowerSkill = skill.toLowerCase();
                    if (!skillsMap.has(lowerSkill)) {
                        skillsMap.set(lowerSkill, {
                            name: skill,
                            level: 15,
                            confidence: 'low',
                            sources: ['course'],
                        });
                    }
                }
            });
        });

        const skills = Array.from(skillsMap.values()).map(skill => ({
            ...skill,
            category: this._categorizeSkill(skill.name),
        })).sort((a, b) => b.level - a.level);

        let topToLearn = [];
        if (pkg?.career?.gapSkills?.length > 0) {
            topToLearn = pkg.career.gapSkills.slice(0, 3).map(gap => ({
                name: this._sanitizeSkill(gap),
                reason: `Top gap for your career goals`,
                priority: 'high',
                source: 'career_radar',
            }));
        } else {
            topToLearn = this._getTopSkillsToLearn(skills, profile?.goals?.targetRole || '');
        }

        return {
            skills,
            topToLearn,
            overallProgress: skills.length > 0
                ? Math.round(skills.reduce((sum, s) => sum + s.level, 0) / skills.length)
                : 0,
        };
    }

    // INTERNAL HELPERS
    _sanitizeSkill(s) {
        if (!s) return '';
        if (typeof s === 'string') return s;
        if (Array.isArray(s)) return this._sanitizeSkill(s[0]);
        if (typeof s === 'object') return s.skill || s.name || '';
        return String(s);
    }

    _categorizeSkill(skillName) {
        const categories = {
            frontend: ['React', 'Vue', 'Angular', 'CSS', 'HTML', 'JavaScript', 'TypeScript', 'Next.js'],
            backend: ['Node.js', 'Python', 'Express', 'Django', 'FastAPI'],
            database: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis'],
            devops: ['Docker', 'Kubernetes', 'AWS', 'Cloud', 'CI/CD', 'Git'],
            ai: ['AI', 'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch'],
        };
        for (const [category, list] of Object.entries(categories)) {
            if (list.some(s => skillName.toLowerCase().includes(s.toLowerCase()))) return category;
        }
        return 'general';
    }

    _getTopSkillsToLearn(skills, targetRole) {
        const roleBasics = {
            'frontend developer': ['React', 'TypeScript', 'CSS/Next.js', 'Testing Library'],
            'backend developer': ['Node.js', 'PostgreSQL', 'Redis', 'Docker'],
            'full stack developer': ['React', 'Node.js', 'System Design', 'Deployment'],
            'ai specialist': ['Python', 'PyTorch', 'Large Language Models', 'Data Engineering'],
            'nlp specialist': ['Python', 'Transformers', 'Fine-tuning', 'Vector Databases'],
            'devops engineer': ['Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
            'data scientist': ['Python', 'Pandas', 'Statistics', 'Machine Learning']
        };

        const sanitizedRole = (targetRole || '').toLowerCase().trim();
        const targetBasics = roleBasics[sanitizedRole] || roleBasics['full stack developer'];
        const existingSkillNames = new Set(skills.map(s => s.name.toLowerCase()));
        
        const suggestions = targetBasics
            .filter(skill => !existingSkillNames.has(skill.toLowerCase()))
            .slice(0, 3)
            .map(skill => ({
                name: skill,
                reason: `Essential for ${targetRole || 'your career'}`,
                priority: 'high',
                source: 'role_roadmap'
            }));

        if (suggestions.length === 0) {
            const secondary = ['System Design', 'Cybersecurity', 'Cloud Architecture', 'Performance Optimization'];
            return secondary
                .filter(skill => !existingSkillNames.has(skill.toLowerCase()))
                .slice(0, 3)
                .map(skill => ({
                    name: skill,
                    reason: 'High-value skill for professional growth',
                    priority: 'medium',
                    source: 'discovery'
                }));
        }

        return suggestions;
    }

    _buildPlanPrompt(data) {
        const { targetRole, targetField, experienceLevel, format, sessionLength, adaptedDifficulty, courseContext, skillContext, completionRate, rolloverTasks, avgMinutesPerDay } = data;

        return `
            You are an Elite AI Learning Architect and Career Strategist.
            Your mission is to generate a hyper-personalized weekly learning plan for a user aiming to become a ${targetRole} in the field of ${targetField}.

            USER CONTEXT:
            - Experience Level: ${experienceLevel}
            - Daily Commitment: ${sessionLength} minutes
            - Current Difficulty: ${adaptedDifficulty}
            - Current Skills: ${skillContext.map(s => `${s.name} (${s.level}%)`).join(', ') || 'None'}
            - Saved Resources: ${courseContext.map(c => c.title).join(', ')}

            OUTPUT FORMAT:
            You MUST return ONLY a valid JSON object:
            {
                "weeklyFocus": "string",
                "etaToJobReady": "string",
                "tasks": [
                    { "title": "string", "type": "string", "skill": "string", "estimatedMinutes": number, "resourceUrl": "string" }
                ],
                "skillsTargeted": ["string"],
                "motivationalNote": "string"
            }
        `;
    }

    _generateEnhancedFallbackPlan(targetRole, sessionLength, difficulty, savedCourses) {
        const tasks = [
            { id: 'f1', title: `Complete module 1 of ${targetRole} basics`, type: 'course', skill: targetRole, estimatedMinutes: sessionLength, status: 'pending' },
            { id: 'f2', title: `Setup project for ${targetRole}`, type: 'practice', skill: 'DevOps', estimatedMinutes: 45, status: 'pending' },
            { id: 'f3', title: `Quiz: ${targetRole} Fundamentals`, type: 'quiz', skill: targetRole, estimatedMinutes: 15, status: 'pending' },
            { id: 'f4', title: `Small project: ${targetRole}`, type: 'project', skill: targetRole, estimatedMinutes: 60, status: 'pending' },
            { id: 'f5', title: `Read ${targetRole} Docs`, type: 'reading', skill: targetRole, estimatedMinutes: 30, status: 'pending' }
        ];

        return {
            weeklyFocus: `Foundations of ${targetRole}`,
            etaToJobReady: '12 weeks',
            tasks,
            skillsTargeted: [targetRole],
            motivationalNote: "Consistency is key!"
        };
    }
}

export default new PersonalizationService();
