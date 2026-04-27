import mongoose from 'mongoose';

/**
 * LEARNING MISSION MODEL
 * ======================
 * Outcome-based, skill-building learning experiences.
 * Replaces "saved courses" with structured learning paths.
 * 
 * Based on: Zeeklect v2 Evolution Architecture - Phase 4
 */

// ========================================
// STAGE TYPES
// ========================================
export const STAGE_TYPES = {
    LEARN: 'learn',         // Consume resources (videos, articles)
    BUILD: 'build',         // Create something practical
    CHALLENGE: 'challenge', // Take a quiz/test
    REFLECT: 'reflect'      // Self-assessment, journal
};

// ========================================
// MISSION SOURCES
// ========================================
export const MISSION_SOURCES = {
    ROADMAP: 'roadmap',                    // Generated from AI roadmap
    SAVED_COURSE: 'saved_course',          // Converted from saved course
    GUARDIAN_RECOMMENDATION: 'guardian',    // Recommended by Guardian
    USER_CREATED: 'user',                  // Manually created
    SKILL_GAP: 'skill_gap'                 // Generated from career gap analysis
};

// ========================================
// SUB-SCHEMAS
// ========================================

const resourceSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['video', 'article', 'course', 'tutorial', 'documentation', 'project'],
        required: true
    },
    title: { type: String, required: true },
    url: { type: String, required: true },
    duration: { type: Number }, // minutes (for video/course)
    readTime: { type: Number }, // minutes (for article)
    platform: { type: String }, // YouTube, Coursera, etc.
    isRequired: { type: Boolean, default: true }
}, { _id: false });

const challengeSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['quiz', 'build', 'code', 'essay', 'presentation'],
        required: true
    },
    prompt: { type: String, required: true },
    evaluationCriteria: [{ type: String }],
    passThreshold: { type: Number, min: 0, max: 1, default: 0.7 },
    timeLimit: { type: Number }, // seconds
    points: { type: Number, default: 10 }
}, { _id: false });

const stageSchema = new mongoose.Schema({
    stageId: { type: Number, required: true },
    title: { type: String, required: true },
    type: {
        type: String,
        enum: Object.values(STAGE_TYPES),
        required: true
    },
    description: { type: String },
    estimatedMinutes: { type: Number, default: 30 },
    objectives: [{ type: String }],
    resources: [resourceSchema],
    challenge: challengeSchema,
    passThreshold: { type: Number, min: 0, max: 1, default: 0.7 },
    order: { type: Number, required: true }
}, { _id: false });

const adaptiveRulesSchema = new mongoose.Schema({
    skipIfMastery: { type: Number, default: 0.8 },     // Skip stage if user has 80%+ mastery
    repeatIfScore: { type: Number, default: 0.5 },     // Repeat if score below 50%
    addReinforcementAfter: { type: Number, default: 2 } // Add reinforcement after 2 failures
}, { _id: false });

// ========================================
// MAIN MISSION SCHEMA
// ========================================
const missionSchema = new mongoose.Schema({
    // Basic Info
    title: { type: String, required: true },
    description: { type: String },

    // Skill Targeting
    skill: { type: String, required: true },           // e.g., "javascript"
    subSkill: { type: String },                        // e.g., "async-await"

    // Difficulty
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'adaptive'],
        default: 'adaptive'
    },
    baseDifficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },

    // Source
    source: {
        type: String,
        enum: Object.values(MISSION_SOURCES),
        default: MISSION_SOURCES.USER_CREATED
    },
    sourceId: { type: String }, // Reference to source identifier (ObjectId or slug)

    // Stages
    stages: [stageSchema],

    // Adaptive Rules
    adaptiveRules: {
        type: adaptiveRulesSchema,
        default: () => ({})
    },

    // Metadata
    estimatedTotalMinutes: { type: Number, default: 0 },
    stageCount: { type: Number, default: 0 },

    // Completion Stats (aggregate across all users)
    stats: {
        completionRate: { type: Number, default: 0 },
        averageTimeToComplete: { type: Number, default: 0 }, // minutes
        timesStarted: { type: Number, default: 0 },
        timesCompleted: { type: Number, default: 0 },
        timesAbandoned: { type: Number, default: 0 }
    },

    // Visibility
    isPublic: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Points & Rewards
    totalPoints: { type: Number, default: 0 },
    skillBoostOnCompletion: { type: Number, default: 10 }, // PKG skill level boost

    // Tags
    tags: [{ type: String }],
    prerequisites: [{ type: String }] // Required skills/missions

}, { timestamps: true });

// ========================================
// USER MISSION PROGRESS SCHEMA
// ========================================
const userMissionProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    missionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mission',
        required: true,
        index: true
    },

    // Progress
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'abandoned', 'paused'],
        default: 'not_started'
    },
    currentStage: { type: Number, default: 1 },
    progress: { type: Number, min: 0, max: 1, default: 0 }, // 0-1

    // Stage Completion
    stageProgress: [{
        stageId: { type: Number, required: true },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'completed', 'skipped', 'failed'],
            default: 'not_started'
        },
        score: { type: Number, min: 0, max: 100 },
        attempts: { type: Number, default: 0 },
        timeSpent: { type: Number, default: 0 }, // minutes
        completedAt: { type: Date },
        skippedReason: { type: String }
    }],

    // Timestamps
    startedAt: { type: Date },
    lastActivityAt: { type: Date },
    completedAt: { type: Date },
    abandonedAt: { type: Date },

    // Abandonment Tracking
    abandonmentReason: {
        type: String,
        default: null
    },
    abandonmentStage: { type: Number },

    // Points Earned
    pointsEarned: { type: Number, default: 0 },

    // Adaptive Adjustments
    difficultyAdjustments: [{
        stageId: { type: Number },
        adjustment: { type: String, enum: ['easier', 'harder', 'reinforcement'] },
        reason: { type: String },
        appliedAt: { type: Date, default: Date.now }
    }]

}, { timestamps: true });

// Compound index for unique user-mission pair
userMissionProgressSchema.index({ userId: 1, missionId: 1 }, { unique: true });

// ========================================
// INDEXES
// ========================================
missionSchema.index({ skill: 1 });
missionSchema.index({ source: 1 });
missionSchema.index({ difficulty: 1 });
missionSchema.index({ createdBy: 1 });
missionSchema.index({ isPublic: 1 });

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Calculate total estimated time from stages
 */
missionSchema.methods.calculateTotalTime = function () {
    this.estimatedTotalMinutes = this.stages.reduce(
        (sum, stage) => sum + (stage.estimatedMinutes || 0), 0
    );
    this.stageCount = this.stages.length;
    this.totalPoints = this.stages.reduce(
        (sum, stage) => sum + (stage.challenge?.points || 10), 0
    );
    return this;
};

/**
 * Get stage by ID
 */
missionSchema.methods.getStage = function (stageId) {
    return this.stages.find(s => s.stageId === stageId);
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Create a mission from a saved course
 */
missionSchema.statics.fromSavedCourse = async function (course, userId) {
    const mission = new this({
        title: `Master: ${course.title}`,
        description: `Complete learning path for ${course.title}`,
        skill: course.skill || 'general',
        subSkill: course.subSkill || null,
        difficulty: 'adaptive',
        source: MISSION_SOURCES.SAVED_COURSE,
        sourceId: course._id || course.courseId,
        createdBy: userId,
        stages: [
            {
                stageId: 1,
                title: 'Learn the Fundamentals',
                type: STAGE_TYPES.LEARN,
                description: 'Complete the course content',
                estimatedMinutes: course.duration || 120,
                objectives: ['Complete the course', 'Take notes on key concepts'],
                resources: [{
                    type: 'course',
                    title: course.title,
                    url: course.link || course.url,
                    platform: course.platform,
                    isRequired: true
                }],
                order: 1
            },
            {
                stageId: 2,
                title: 'Apply Your Knowledge',
                type: STAGE_TYPES.BUILD,
                description: 'Build a small project using what you learned',
                estimatedMinutes: 60,
                objectives: ['Create a working project', 'Use at least 3 concepts from the course'],
                challenge: {
                    type: 'build',
                    prompt: `Build a mini-project that demonstrates your understanding of ${course.title}`,
                    evaluationCriteria: ['Working code', 'Clean structure', 'Documented'],
                    passThreshold: 0.7
                },
                order: 2
            },
            {
                stageId: 3,
                title: 'Test Your Mastery',
                type: STAGE_TYPES.CHALLENGE,
                description: 'Take a challenge to verify your understanding',
                estimatedMinutes: 15,
                objectives: ['Score at least 70% on the challenge'],
                challenge: {
                    type: 'quiz',
                    prompt: `Answer questions about ${course.title}`,
                    passThreshold: 0.7,
                    timeLimit: 600,
                    points: 25
                },
                order: 3
            }
        ],
        tags: [course.platform, course.level].filter(Boolean)
    });

    mission.calculateTotalTime();
    return mission.save();
};

/**
 * Create missions from an AI roadmap
 */
missionSchema.statics.fromRoadmap = async function (roadmap, userId) {
    const missions = [];

    for (const milestone of roadmap.milestones || []) {
        const mission = new this({
            title: milestone.title,
            description: milestone.description || `Master ${milestone.title}`,
            skill: milestone.skill || roadmap.skill,
            subSkill: milestone.subTopic,
            difficulty: 'adaptive',
            source: MISSION_SOURCES.ROADMAP,
            sourceId: roadmap._id,
            createdBy: userId,
            stages: (milestone.steps || []).map((step, index) => ({
                stageId: index + 1,
                title: step.title || `Step ${index + 1}`,
                type: step.type || STAGE_TYPES.LEARN,
                description: step.description,
                estimatedMinutes: step.duration || 30,
                objectives: step.objectives || [],
                resources: step.resources || [],
                order: index + 1
            })),
            tags: roadmap.tags || []
        });

        mission.calculateTotalTime();
        missions.push(await mission.save());
    }

    return missions;
};

/**
 * Create a mission from Guardian recommendation
 */
missionSchema.statics.fromGuardianRecommendation = async function (recommendation, userId) {
    const { skill, subSkill, reason, detectionType } = recommendation;

    const mission = new this({
        title: `Strengthen: ${skill}`,
        description: `Targeted practice to address: ${reason}`,
        skill,
        subSkill,
        difficulty: 'adaptive',
        source: MISSION_SOURCES.GUARDIAN_RECOMMENDATION,
        createdBy: userId,
        stages: [
            {
                stageId: 1,
                title: 'Quick Review',
                type: STAGE_TYPES.LEARN,
                description: 'Refresh your knowledge',
                estimatedMinutes: 15,
                objectives: ['Review key concepts'],
                order: 1
            },
            {
                stageId: 2,
                title: 'Practice Challenge',
                type: STAGE_TYPES.CHALLENGE,
                description: 'Test your understanding',
                estimatedMinutes: 10,
                objectives: ['Score at least 70%'],
                challenge: {
                    type: 'quiz',
                    prompt: `Answer questions about ${subSkill || skill}`,
                    passThreshold: 0.7,
                    points: 15
                },
                order: 2
            }
        ],
        tags: ['guardian', detectionType].filter(Boolean)
    });

    mission.calculateTotalTime();
    return mission.save();
};

// ========================================
// EXPORTS
// ========================================
export const Mission = mongoose.model('Mission', missionSchema);
export const UserMissionProgress = mongoose.model('UserMissionProgress', userMissionProgressSchema);

export default Mission;
