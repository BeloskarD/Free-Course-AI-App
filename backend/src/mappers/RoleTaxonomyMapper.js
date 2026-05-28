/**
 * ROLE TAXONOMY DOMAIN DATA MAPPER
 * ================================
 * Converts raw database structures into structured, immutable,
 * database-agnostic role taxonomy entities.
 */
export class RoleTaxonomyMapper {
    /**
     * Map database role taxonomy payload to clean domain POJO.
     * Enforces complete property isolation and Object immutability.
     * @param {Object|Array} dbRecord 
     * @returns {Object|Array|null} Immutable clean role taxonomy record(s)
     */
    static toDomain(dbRecord) {
        if (!dbRecord) return null;
        if (Array.isArray(dbRecord)) {
            return dbRecord.map(d => this.toDomain(d));
        }

        // Extract native JS object, stripping Mongoose active document hooks
        const data = dbRecord.toObject ? dbRecord.toObject({ getters: true, virtuals: true }) : dbRecord;

        const domainRole = {
            id: data._id ? data._id.toString() : (data.id ? data.id.toString() : ''),
            roleId: data.roleId || '',
            roleName: data.roleName || '',
            category: data.category || '',
            skillMap: Array.isArray(data.skillMap) ? data.skillMap.map(s => ({
                skill: s.skill || '',
                weight: Number(s.weight) || 0,
                category: s.category || ''
            })) : [],
            radarAxes: Array.isArray(data.radarAxes) ? data.radarAxes.map(a => ({
                label: a.label || '',
                weight: Number(a.weight) || 0
            })) : [],
            description: data.description || '',
            createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt instanceof Date ? data.updatedAt.toISOString() : (data.updatedAt || new Date().toISOString())
        };

        // Deep freeze nested structures to prevent mutation of taxonomy metadata
        Object.freeze(domainRole.skillMap);
        Object.freeze(domainRole.radarAxes);
        
        return Object.freeze(domainRole);
    }
}

export default RoleTaxonomyMapper;
