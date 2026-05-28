/**
 * ROLE TAXONOMY REPOSITORY CONTRACT
 * =================================
 * Domain-oriented database-agnostic interface for role taxonomy data.
 */
class IRoleTaxonomyRepository {
    async findById(id) {
        throw new Error('Method not implemented.');
    }

    async findByRoleId(roleId) {
        throw new Error('Method not implemented.');
    }

    async findAll() {
        throw new Error('Method not implemented.');
    }

    async create(data) {
        throw new Error('Method not implemented.');
    }

    async update(id, updateData) {
        throw new Error('Method not implemented.');
    }

    async delete(id) {
        throw new Error('Method not implemented.');
    }
}

export default IRoleTaxonomyRepository;
