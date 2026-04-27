import mongoose from 'mongoose';

/**
 * PERSONAL KNOWLEDGE GENOME (PKG) MODEL
 * =====================================
 * The single source of truth for user intelligence data.
 * All features must read from and write to PKG through the PKG Update Service.
 * 
 * Based on: Zeeklect v2 Evolution Architecture
 * Version: 1.0.0
 */

// ========================================
// SUB-SCHEMAS
// ========================================

/**
 * ⚠️ IMPORTANT ARCHITECTURAL RULE
 * --------------------------------
 * PKG must NEVER be mutated directly outside pkgService.
 * Controllers must ONLY call pkgService.processEvent().
 */

const subTopicSchema = new mongoose.Schema({
    mastery: { type: Number, min: 0, max: 100, default: 0 },
    confusionCount: { type: Number, default: 0 },
    lastPracticed: { type: Date }
}, { _id: false });

const challengeHistorySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    topic: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    timeSpent: { type: Number, default: 0 }, // seconds
    isAIGenerated: { type: Boolean, default: true }
}, { _id: false });

const skillSchema = new mongoose.Schema({
    level: { type: Number, min: 0, max: 100, default: 0 },
    health: { type: Number, min: 0, max: 100, default: 100 },
    lastPracticed: { type: Date },
        decayRate: { type: Number, default: 0.03 },
        displayName: { type: String },
        subTopics: { type: Map, of: subTopicSchema, default: {} },
        challengeHistory: [challengeHistorySchema],

    // ── COGNITIVE GRAPH EXTENSIONS (v2.0.0) ──
    masteryScore: { type: Number, min: 0, max: 1, default: 0 },       // Normalized 0-1
    entropyRate: { type: Number, min: 0, max: 1, default: 1 },         // 1 = max uncertainty
    confidenceWeight: { type: Number, min: 0, max: 1, default: 0 },    // Statistical confidence
    learningVelocity: { type: Number, default: 0 },                     // Δmastery / Δtime
    adjacencySkills: [{ type: String }],                                 // Related skill keys
    lastUsedTimestamp: { type: Date },                                   // Last applied (projects/missions)
    applicationCount: { type: Number, default: 0 },                     // Times used in projects
    velocityHistory: [{
        date: { type: Date, default: Date.now },
        delta: { type: Number }
    }]
}, { _id: false });

const searchPatternSchema = new mongoose.Schema({
    query: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    followed: { type: Boolean, default: false },
    dwellTime: { type: Number, default: 0 } // seconds
}, { _id: false });

const sessionHistorySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 }, // minutes
    focusScore: { type: Number, min: 0, max: 1, default: 0.5 },
    pagesVisited: { type: Number, default: 0 }
}, { _id: false });

const abandonmentPatternSchema = new mongoose.Schema({
    missionId: { type: mongoose.Schema.Types.ObjectId },
    stage: { type: Number, default: 1 },
    reason: {
        type: String,
        default: 'unknown'
    },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const confusionLoopSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    occurrences: { type: Number, default: 1 },
    lastOccurrence: { type: Date, default: Date.now }
}, { _id: false });

const moodEntrySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    mood: {
        type: String,
        enum: ['energized', 'focused', 'neutral', 'tired', 'frustrated', 'overwhelmed'],
        default: 'neutral'
    },
    energy: { type: Number, min: 0, max: 1, default: 0.5 }
}, { _id: false });

const burnoutHistorySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    level: { type: Number, min: 0, max: 1, required: true },
    intervention: { type: String }
}, { _id: false });

const activeMissionSchema = new mongoose.Schema({
    missionId: { type: mongoose.Schema.Types.ObjectId },
    startedAt: { type: Date, default: Date.now },
    progress: { type: Number, min: 0, max: 1, default: 0 },
    currentStage: { type: Number, default: 1 }
}, { _id: false });

const abandonedMissionSchema = new mongoose.Schema({
    missionId: { type: mongoose.Schema.Types.ObjectId },
    reason: { type: String },
    stageReached: { type: Number, default: 1 },
    abandonedAt: { type: Date, default: Date.now }
}, { _id: false });

const gapSkillSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    marketDemand: { type: String }
}, { _id: false });

const interventionHistorySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['force_break', 'suggest_break', 'confusion_help', 'stagnation_nudge',
            'overconsumption_alert', 'decay_warning', 'welcome_back'],
        required: true
    },
    date: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }
}, { _id: false });

// ========================================
// MAIN PKG SCHEMA
// ========================================

const pkgSchema = new mongoose.Schema({
    // Reference to User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    version: { type: String, default: '1.0.0' },
    schemaVersion: {
        type: String,
        default: '1.0.0',
        index: true
    },
    isInitialized: { type: Boolean, default: false, index: true },

    // ========================================
    // IDENTITY - Learning preferences and patterns
    // ========================================
    identity: {
        learningStyle: {
            type: String,
            enum: ['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'],
            default: 'mixed'
        },
        peakHours: [{ type: Number, min: 0, max: 23 }], // e.g., [9, 10, 11, 14, 15]
        attentionSpan: {
            average: { type: Number, default: 45 }, // minutes
            trend: {
                type: String,
                enum: ['increasing', 'stable', 'decreasing'],
                default: 'stable'
            }
        },
        preferredDifficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard', 'adaptive'],
            default: 'adaptive'
        },
        contentPreferences: {
            video: { type: Number, min: 0, max: 1, default: 0.4 },
            text: { type: Number, min: 0, max: 1, default: 0.4 },
            interactive: { type: Number, min: 0, max: 1, default: 0.2 }
        }
    },

    // ========================================
    // SKILLS - Per-skill tracking with health decay
    // Normalized to Array but keeps Mixed for Zero-Downtime Migration
    skills: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },

    // ========================================
    // BEHAVIOR - Patterns and history
    // ========================================
    behavior: {
        searchPatterns: {
            type: [searchPatternSchema],
            default: [],
            validate: [arr => arr.length <= 100, 'Search patterns limited to 100 entries']
        },
        sessionHistory: {
            type: [sessionHistorySchema],
            default: [],
            validate: [arr => arr.length <= 90, 'Session history limited to 90 entries'] // 90 days
        },
        abandonmentPatterns: {
            type: [abandonmentPatternSchema],
            default: []
        },
        confusionLoops: {
            type: [confusionLoopSchema],
            default: []
        }
    },

    // ========================================
    // WELLBEING - Health and burnout prevention
    // ========================================
    wellbeing: {
        currentBurnoutRisk: { type: Number, min: 0, max: 1, default: 0 },
        burnoutHistory: {
            type: [burnoutHistorySchema],
            default: [],
            validate: [arr => arr.length <= 30, 'Burnout history limited to 30 entries']
        },
        moodTrend: {
            type: [moodEntrySchema],
            default: [],
            validate: [arr => arr.length <= 30, 'Mood trend limited to 30 entries']
        },
        restDaysUsed: { type: Number, default: 0, min: 0 },
        restDaysTotal: { type: Number, default: 2 },
        lastBreakTaken: { type: Date },
        averageSessionBeforeBreak: { type: Number, default: 45 } // minutes
    },

    // ========================================
    // MOMENTUM - Velocity and consistency
    // ========================================
    momentum: {
        currentStreak: { type: Number, default: 0, min: 0 },
        longestStreak: { type: Number, default: 0, min: 0 },
        streakHealth: { type: Number, min: 0, max: 1, default: 1 },
        weeklyActiveMinutes: { type: Number, default: 0, min: 0 },
        weeklyOutputScore: { type: Number, min: 0, max: 1, default: 0 },
        consumptionToApplicationRatio: { type: Number, default: 0, min: 0 }
    },

    // ========================================
    // MISSIONS - Active and historical
    // ========================================
    missions: {
        active: [activeMissionSchema],
        completed: [{ type: mongoose.Schema.Types.ObjectId }],
        abandoned: [abandonedMissionSchema]
    },

    // ========================================
    // CAREER - Role tracking and gap analysis
    // ========================================
    career: {
        targetRole: { type: String, default: '' },
        readinessScore: { type: Number, min: 0, max: 1, default: 0 },
        gapSkills: [gapSkillSchema],
        salaryPotential: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 0 }
        },
        lastAnalysisDate: { type: Date }
    },

    // ========================================
    // GUARDIAN STATE - AI intervention tracking
    // ========================================
    guardianState: {
        lastIntervention: { type: Date },
        interventionHistory: {
            type: [interventionHistorySchema],
            default: [],
            validate: [arr => arr.length <= 50, 'Intervention history limited to 50 entries']
        },
        silentModeSince: { type: Date, default: null },
        shadowMode: {
            active: { type: Boolean, default: false },
            activatedAt: { type: Date },
            autoExitThreshold: { type: Number, default: 0.6 },
            interventionsSuppressed: { type: Number, default: 0 }
        },
        pendingAlerts: [{ type: String }]
    },
    auditTrail: {
        type: [{
            eventType: { type: String },
            source: { type: String }, // controller / ai / system
            timestamp: { type: Date, default: Date.now }
        }],
        default: [],
        validate: [arr => arr.length <= 200, 'Audit trail limited to 200 entries']
    },

    // ========================================
    // COGNITIVE GRAPH METADATA (v2.0.0)
    // ========================================
    graphMeta: {
        lastGraphUpdate: { type: Date },
        totalNodes: { type: Number, default: 0 },
        totalEdges: { type: Number, default: 0 },
        graphDensity: { type: Number, default: 0 },
        dominantCluster: { type: String, default: '' },
        skillClusters: [{
            name: { type: String },
            skills: [{ type: String }],
            avgMastery: { type: Number, default: 0 }
        }]
    },

}, {
    timestamps: true,
    minimize: false, // Keep empty objects in output
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========================================
// INDEXES
// ========================================
pkgSchema.index({ userId: 1 });
pkgSchema.index({ 'wellbeing.currentBurnoutRisk': 1 });
pkgSchema.index({ 'momentum.currentStreak': -1 });

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Get skill by name (case-insensitive)
 * Compatible with both Map and Array formats
 */
pkgSchema.methods.getSkill = function (skillName) {
    const normalized = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Handle Array format (New)
    if (Array.isArray(this.skills)) {
        return this.skills.find(s => 
            s.skillId === normalized || 
            (s.displayName && s.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized)
        );
    }
    
    // Handle Map/Object format (Legacy)
    if (this.skills instanceof Map) {
        return this.skills.get(normalized);
    }
    
    if (typeof this.skills === 'object' && this.skills !== null) {
        return this.skills[normalized];
    }
    
    return null;
};

/**
 * Check if user is at burnout risk
 */
pkgSchema.methods.isAtRisk = function () {
    return this.wellbeing.currentBurnoutRisk > 0.7;
};

/**
 * Get days since last practice for a skill
 */
pkgSchema.methods.getDaysSinceLastPractice = function (skillName) {
    const skill = this.getSkill(skillName);
    if (!skill?.lastPracticed) return Infinity;
    const now = new Date();
    return Math.floor((now - skill.lastPracticed) / (1000 * 60 * 60 * 24));
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Initialize PKG for a new user with sensible defaults
 */
pkgSchema.statics.initializeForUser = async function (userId) {
    const pkg = new this({
        userId,
        version: '1.0.0',
        identity: {
            learningStyle: 'mixed',
            peakHours: [9, 10, 14, 15], // Default productive hours
            attentionSpan: { average: 45, trend: 'stable' },
            preferredDifficulty: 'adaptive',
            contentPreferences: { video: 0.4, text: 0.4, interactive: 0.2 }
        },
        skills: new Map(),
        behavior: {
            searchPatterns: [],
            sessionHistory: [],
            abandonmentPatterns: [],
            confusionLoops: []
        },
        wellbeing: {
            currentBurnoutRisk: 0,
            burnoutHistory: [],
            moodTrend: [],
            restDaysUsed: 0,
            restDaysTotal: 2,
            lastBreakTaken: null,
            averageSessionBeforeBreak: 45
        },
        momentum: {
            currentStreak: 0,
            longestStreak: 0,
            streakHealth: 1,
            weeklyActiveMinutes: 0,
            weeklyOutputScore: 0,
            consumptionToApplicationRatio: 0
        },
        missions: {
            active: [],
            completed: [],
            abandoned: []
        },
        career: {
            targetRole: '',
            readinessScore: 0,
            gapSkills: [],
            salaryPotential: { min: 0, max: 0 },
            lastAnalysisDate: null
        },
        guardianState: {
            lastIntervention: null,
            interventionHistory: [],
            silentModeSince: null,
            shadowMode: {
                active: false,
                activatedAt: null,
                autoExitThreshold: 0.6,
                interventionsSuppressed: 0
            },
            pendingAlerts: []
        }
    });

    await pkg.save();
    return pkg;
};

/**
 * Atomic Get or Create (Concurrency Safe)
 */
pkgSchema.statics.getOrCreate = async function (userId) {
    try {
        let pkg = await this.findOneAndUpdate(
            { userId },
            { 
                $setOnInsert: { 
                    userId, 
                    skills: [], 
                    isInitialized: false,
                    career: { targetRole: '', readinessScore: 0, gapSkills: [] }
                } 
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Normalize if needed Without triggering save hooks
        if (!Array.isArray(pkg.skills)) {
            const normalizedSkills = this.normalizeSkills(pkg.skills);
            await this.updateOne(
                { userId }, 
                { $set: { skills: normalizedSkills, isInitialized: true } }
            );
            pkg.skills = normalizedSkills;
            pkg.isInitialized = true;
        }

        return pkg;
    } catch (error) {
        console.error(`[PKG Model] Atomic getOrCreate failed for ${userId}:`, error.message);
        throw error;
    }
};

/**
 * Pure helper to normalize skills from Map/Object to Array format
 * Side-effect free (No database writes)
 */
pkgSchema.statics.normalizeSkills = function (skills) {
    if (Array.isArray(skills)) return skills;
    if (!skills) return [];

    const normalized = [];
    
    // Handle Map
    if (skills instanceof Map) {
        for (const [key, value] of skills.entries()) {
            normalized.push({ ...value, skillId: key });
        }
        return normalized;
    }

    // Handle Plain Object
    if (typeof skills === 'object') {
        Object.entries(skills).forEach(([key, value]) => {
            if (key !== '$init') { // Skip internal mongoose flags
                normalized.push({ ...value, skillId: key });
            }
        });
        return normalized;
    }

    return [];
};

// ========================================
// PRE-SAVE HOOK (The Final Safeguard)
// ========================================
pkgSchema.pre('save', async function () {
    if (process.env.NODE_ENV === "development") {
        console.log("[DEBUG] PKG hook executed");
    }

    // 1. Critical userId Check
    if (!this.userId) {
        throw new Error('Critical: PKG missing userId');
    }

    // 2. Forced Normalization (Write-Safe)
    if (!Array.isArray(this.skills)) {
        this.skills = mongoose.model('PKG').normalizeSkills(this.skills);
    }
});

/**
 * Migrate PKG if schemaVersion changes
 */
pkgSchema.statics.migrateIfNeeded = async function (pkg) {
    if (pkg.schemaVersion === '1.0.0') {
        // No migration needed yet
        return pkg;
    }

    // Future migrations go here
    return pkg;
};


export default mongoose.model('PKG', pkgSchema);
