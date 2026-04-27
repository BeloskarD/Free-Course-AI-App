import IBaseRepository from './BaseRepository.js';

/**
 * MISSION REPOSITORY INTERFACE
 * ===========================
 */
class IMissionRepository extends IBaseRepository {
    async findByUserId(userId, status) { throw new Error("Method 'findByUserId' not implemented."); }
    async getActiveMissions(userId) { throw new Error("Method 'getActiveMissions' not implemented."); }
}

export default IMissionRepository;
