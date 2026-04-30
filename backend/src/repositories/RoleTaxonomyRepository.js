import BaseRepository from './BaseRepository.js';

/**
 * ROLE TAXONOMY REPOSITORY INTERFACE
 * ==================================
 */
class IRoleTaxonomyRepository extends BaseRepository {
    async findByRoleId(roleId) {
        throw new Error('Method not implemented.');
    }

    async findAll() {
        throw new Error('Method not implemented.');
    }
}

export default IRoleTaxonomyRepository;
