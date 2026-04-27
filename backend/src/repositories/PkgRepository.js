import IBaseRepository from './BaseRepository.js';

/**
 * PKG REPOSITORY INTERFACE
 * ========================
 */
class IPkgRepository extends IBaseRepository {
    async findByUserId(userId) { throw new Error("Method 'findByUserId' not implemented."); }
    async updateSkills(userId, skills) { throw new Error("Method 'updateSkills' not implemented."); }
    async getOrCreate(userId) { throw new Error("Method 'getOrCreate' not implemented."); }
    async save(pkgData) { throw new Error("Method 'save' not implemented."); }
}

export default IPkgRepository;
