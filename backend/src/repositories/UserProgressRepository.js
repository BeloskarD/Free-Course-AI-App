import IBaseRepository from './BaseRepository.js';

/**
 * USER PROGRESS REPOSITORY INTERFACE
 * =================================
 */
class IUserProgressRepository extends IBaseRepository {
    async findByUserId(userId) { throw new Error("Method 'findByUserId' not implemented."); }
}

export default IUserProgressRepository;
