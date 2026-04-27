import IBaseRepository from './BaseRepository.js';

/**
 * USER REPOSITORY INTERFACE
 * =========================
 */
class IUserRepository extends IBaseRepository {
    async findByEmail(email) { throw new Error("Method 'findByEmail' not implemented."); }
    async updateProfile(userId, profileData) { throw new Error("Method 'updateProfile' not implemented."); }
}

export default IUserRepository;
