import RoleTaxonomy from '../../models/RoleTaxonomy.js';
import IRoleTaxonomyRepository from '../RoleTaxonomyRepository.js';
import RoleTaxonomyMapper from '../../mappers/RoleTaxonomyMapper.js';

/**
 * MONGO ROLE TAXONOMY REPOSITORY
 * ==============================
 * Mongoose implementation of the RoleTaxonomy Repository.
 * Cleanly maps Mongoose active documents into frozen database-agnostic POJOs.
 */
class MongoRoleTaxonomyRepository extends IRoleTaxonomyRepository {
    async findById(id) {
        const taxonomy = await RoleTaxonomy.findById(id);
        return RoleTaxonomyMapper.toDomain(taxonomy);
    }

    async findByRoleId(roleId) {
        if (!roleId) return null;
        const normalizedRoleId = roleId.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Flexibly find by normalized roleId or by case-insensitive name RegExp
        let taxonomy = await RoleTaxonomy.findOne({ roleId: normalizedRoleId });
        if (!taxonomy) {
            taxonomy = await RoleTaxonomy.findOne({ roleName: new RegExp(roleId, 'i') });
        }
        return RoleTaxonomyMapper.toDomain(taxonomy);
    }

    async findAll() {
        const taxonomies = await RoleTaxonomy.find({});
        return RoleTaxonomyMapper.toDomain(taxonomies);
    }

    async create(data) {
        const taxonomy = new RoleTaxonomy(data);
        await taxonomy.save();
        return RoleTaxonomyMapper.toDomain(taxonomy);
    }

    async update(id, updateData) {
        const taxonomy = await RoleTaxonomy.findByIdAndUpdate(id, updateData, { new: true });
        return RoleTaxonomyMapper.toDomain(taxonomy);
    }

    async delete(id) {
        const taxonomy = await RoleTaxonomy.findByIdAndDelete(id);
        return RoleTaxonomyMapper.toDomain(taxonomy);
    }
}

export default new MongoRoleTaxonomyRepository();
