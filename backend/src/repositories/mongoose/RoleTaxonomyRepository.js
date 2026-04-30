import RoleTaxonomy from '../../models/RoleTaxonomy.js';
import IRoleTaxonomyRepository from '../RoleTaxonomyRepository.js';

class MongoRoleTaxonomyRepository extends IRoleTaxonomyRepository {
    async findById(id) {
        const taxonomy = await RoleTaxonomy.findById(id);
        return this.toPOJO(taxonomy);
    }

    async findByRoleId(roleId) {
        if (!roleId) return null;
        const normalizedRoleId = roleId.toLowerCase().replace(/[^a-z0-9]/g, '');
        // We'll also do a regex match to be more flexible if the exact roleId isn't found
        let taxonomy = await RoleTaxonomy.findOne({ roleId: normalizedRoleId });
        if (!taxonomy) {
            taxonomy = await RoleTaxonomy.findOne({ roleName: new RegExp(roleId, 'i') });
        }
        return this.toPOJO(taxonomy);
    }

    async findAll() {
        const taxonomies = await RoleTaxonomy.find({});
        return this.toPOJO(taxonomies);
    }

    async create(data) {
        const taxonomy = new RoleTaxonomy(data);
        await taxonomy.save();
        return this.toPOJO(taxonomy);
    }

    async update(id, updateData) {
        const taxonomy = await RoleTaxonomy.findByIdAndUpdate(id, updateData, { new: true });
        return this.toPOJO(taxonomy);
    }

    async delete(id) {
        return await RoleTaxonomy.findByIdAndDelete(id);
    }
}

export default new MongoRoleTaxonomyRepository();
