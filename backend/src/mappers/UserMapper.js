/**
 * USER DOMAIN DATA MAPPER
 * =======================
 * Converts raw database structures (Mongoose Documents, Postgres Row Objects) 
 * into highly structured, immutable, database-agnostic domain entities.
 */
export class UserMapper {
    /**
     * Map database payload to clean domain POJO.
     * Enforces complete property isolation and Object immutability.
     * @param {Object} dbRecord 
     * @param {Object} options Options object to control mapping behavior
     * @param {boolean} options.freeze Whether to freeze the returned object (default: true)
     * @returns {Object|null} Clean user record
     */
    static toDomain(dbRecord, options = { freeze: true }) {
        if (!dbRecord) return null;

        // Extract native JS object, stripping Mongoose active document hooks
        const data = dbRecord.toObject ? dbRecord.toObject({ getters: true, virtuals: true }) : dbRecord;

        const domainUser = {
            id: data._id ? data._id.toString() : (data.id ? data.id.toString() : ''),
            email: data.email || '',
            password: data.password || '',
            authProvider: data.authProvider || 'local',
            providerId: data.providerId || null,
            name: data.name || 'Anonymous User',
            avatar: data.avatar || '',
            subscriptionTier: data.subscriptionTier || 'free',
            
            // Sub-document arrays
            savedCourses: Array.isArray(data.savedCourses) ? data.savedCourses.map(c => ({ ...c })) : [],
            savedTools: Array.isArray(data.savedTools) ? data.savedTools.map(t => ({ ...t })) : [],
            savedAnalyses: Array.isArray(data.savedAnalyses) ? data.savedAnalyses.map(a => ({ ...a })) : [],

            // Nested object protection & standardization
            gamification: {
                level: Number(data.gamification?.level) || 1,
                xp: Number(data.gamification?.xp) || 0,
                streak: Number(data.gamification?.streak) || 0,
                achievements: Array.isArray(data.gamification?.achievements) ? [...data.gamification.achievements] : []
            },
            
            billing: {
                provider: data.billing?.provider || null,
                stripeCustomerId: data.billing?.stripeCustomerId || null,
                stripeSubscriptionId: data.billing?.stripeSubscriptionId || null,
                subscriptionStatus: data.billing?.subscriptionStatus || 'inactive',
                subscriptionPlan: data.billing?.subscriptionPlan || 'free',
                currentPeriodEnd: data.billing?.currentPeriodEnd || null,
                cancelAtPeriodEnd: data.billing?.cancelAtPeriodEnd || false,
                lastPaymentAt: data.billing?.lastPaymentAt || null
            },

            usage: {
                dailyChatCount: Number(data.usage?.dailyChatCount) || 0,
                dailySearchCount: Number(data.usage?.dailySearchCount) || 0,
                weeklyValidationCount: Number(data.usage?.weeklyValidationCount) || 0,
                monthlyResumeCount: Number(data.usage?.monthlyResumeCount) || 0,
                lastResetDate: data.usage?.lastResetDate || new Date().toISOString()
            },

            onboardingStatus: {
                roleDefined: data.onboardingStatus?.roleDefined || false,
                skillsDefined: data.onboardingStatus?.skillsDefined || false
            },

            sessionCount: Number(data.sessionCount) || 0,

            aiProfile: {
                detectedSkills: Array.isArray(data.aiProfile?.detectedSkills) ? [...data.aiProfile.detectedSkills] : [],
                skillGaps: Array.isArray(data.aiProfile?.skillGaps) ? data.aiProfile.skillGaps.map(g => ({ ...g })) : [],
                learningVelocity: Number(data.aiProfile?.learningVelocity) || 0,
                lastAnalysis: data.aiProfile?.lastAnalysis || null
            },
            
            createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt instanceof Date ? data.updatedAt.toISOString() : (data.updatedAt || new Date().toISOString())
        };

        if (options?.freeze !== false) {
            // Deep freeze standard fields to prevent in-memory structural mutations
            Object.freeze(domainUser.gamification);
            Object.freeze(domainUser.gamification.achievements);
            Object.freeze(domainUser.billing);
            return Object.freeze(domainUser);
        }
        
        return domainUser;
    }
}

export default UserMapper;
