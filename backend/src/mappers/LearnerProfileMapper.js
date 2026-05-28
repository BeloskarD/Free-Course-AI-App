/**
 * LEARNER PROFILE DOMAIN DATA MAPPER
 * ==================================
 * Maps dynamic LearnerProfiles containing nested portfolios, wellbeing metrics,
 * and ATS tracking into highly structured, immutable domain models.
 */
export class LearnerProfileMapper {
    /**
     * Map profile document to clean POJO domain entity.
     * @param {Object} dbRecord 
     * @returns {Object|null} Immutable profile record
     */
    static toDomain(dbRecord) {
        if (!dbRecord) return null;

        const data = dbRecord.toObject ? dbRecord.toObject({ getters: true, virtuals: true }) : dbRecord;

        const domainProfile = {
            id: data._id ? data._id.toString() : (data.id ? data.id.toString() : ''),
            userId: data.userId ? data.userId.toString() : '',
            
            goals: Array.isArray(data.goals) ? [...data.goals] : [],
            masteredSkills: Array.isArray(data.masteredSkills) ? [...data.masteredSkills] : [],
            
            careerReadiness: {
                readinessScore: Number(data.careerReadiness?.readinessScore) || 0,
                skillsGap: Array.isArray(data.careerReadiness?.skillsGap) ? [...data.careerReadiness.skillsGap] : [],
                recommendedRoles: Array.isArray(data.careerReadiness?.recommendedRoles) ? [...data.careerReadiness.recommendedRoles] : []
            },
            
            wellbeing: {
                mentalFitness: Number(data.wellbeing?.mentalFitness) || 100,
                stressLevel: Number(data.wellbeing?.stressLevel) || 0,
                streakDays: Number(data.wellbeing?.streakDays) || 0
            },
            
            portfolio: {
                headline: data.portfolio?.headline || '',
                summary: data.portfolio?.summary || '',
                skills: Array.isArray(data.portfolio?.skills) ? [...data.portfolio.skills] : [],
                customProjects: Array.isArray(data.portfolio?.customProjects) ? [...data.portfolio.customProjects] : [],
                atsScore: Number(data.portfolio?.atsScore) || 0,
                analytics: {
                    views: Number(data.portfolio?.analytics?.views) || 0,
                    downloads: Number(data.portfolio?.analytics?.downloads) || 0,
                    shares: Number(data.portfolio?.analytics?.shares) || 0
                }
            },

            createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt instanceof Date ? data.updatedAt.toISOString() : (data.updatedAt || new Date().toISOString())
        };

        // Deep freeze nested attributes for structural immutability
        Object.freeze(domainProfile.goals);
        Object.freeze(domainProfile.masteredSkills);
        Object.freeze(domainProfile.careerReadiness);
        Object.freeze(domainProfile.careerReadiness.skillsGap);
        Object.freeze(domainProfile.careerReadiness.recommendedRoles);
        Object.freeze(domainProfile.wellbeing);
        Object.freeze(domainProfile.portfolio);
        Object.freeze(domainProfile.portfolio.skills);
        Object.freeze(domainProfile.portfolio.customProjects);
        Object.freeze(domainProfile.portfolio.analytics);

        return Object.freeze(domainProfile);
    }
}

export default LearnerProfileMapper;
