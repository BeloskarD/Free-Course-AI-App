import IBaseRepository from './BaseRepository.js';

/**
 * LEARNER PROFILE REPOSITORY INTERFACE
 * ====================================
 */
class ILearnerProfileRepository extends IBaseRepository {
    async findByUserId(userId) { throw new Error("Method 'findByUserId' not implemented."); }
}

export default ILearnerProfileRepository;
