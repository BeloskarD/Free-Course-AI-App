import IBaseRepository from './BaseRepository.js';

/**
 * ACHIEVEMENT REPOSITORY INTERFACE
 * ================================
 */
class IAchievementRepository extends IBaseRepository {
    async findAll() { throw new Error("Method 'findAll' not implemented."); }
}

export default IAchievementRepository;
