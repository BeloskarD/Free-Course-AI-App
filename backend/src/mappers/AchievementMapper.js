/**
 * ACHIEVEMENT DOMAIN DATA MAPPER
 * ==============================
 * Converts raw database structures into structured, immutable,
 * database-agnostic gamification achievement entities.
 */
export class AchievementMapper {
    /**
     * Map database achievement payload to clean domain POJO.
     * Enforces complete property isolation and Object immutability.
     * @param {Object|Array} dbRecord 
     * @returns {Object|Array|null} Immutable clean achievement record(s)
     */
    static toDomain(dbRecord) {
        if (!dbRecord) return null;
        if (Array.isArray(dbRecord)) {
            return dbRecord.map(d => this.toDomain(d));
        }

        // Extract native JS object, stripping Mongoose active document hooks
        const data = dbRecord.toObject ? dbRecord.toObject({ getters: true, virtuals: true }) : dbRecord;

        const domainAchievement = {
            id: data._id ? data._id.toString() : (data.id ? data.id.toString() : ''),
            _id: data._id ? data._id.toString() : (data.id ? data.id.toString() : ''),
            title: data.title || '',
            description: data.description || '',
            icon: data.icon || '',
            type: data.type || 'milestone',
            rarity: data.rarity || 'common',
            reward: data.reward || '',
            xpReward: Number(data.xpReward) || Number(data.reward?.match(/\d+/)?.[0]) || 0,
            criteria: data.criteria ? {
                type: data.criteria.type || data.requirementType || '',
                value: Number(data.criteria.value) || Number(data.requirementValue) || 0,
                skillName: data.criteria.skillName || ''
            } : {
                type: data.requirementType || '',
                value: Number(data.requirementValue) || 0,
                skillName: ''
            },
            requirementType: data.requirementType || data.criteria?.type || '',
            requirementValue: Number(data.requirementValue) || Number(data.criteria?.value) || 0,
            badgeId: data.badgeId || '',
            createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt instanceof Date ? data.updatedAt.toISOString() : (data.updatedAt || new Date().toISOString())
        };

        return Object.freeze(domainAchievement);
    }
}

export default AchievementMapper;
