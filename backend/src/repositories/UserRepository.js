/**
 * USER REPOSITORY CONTRACT
 * ========================
 * Domain-oriented database-agnostic interface for user accounts.
 */
class IUserRepository {
    async findById(id) {
        throw new Error('Method not implemented.');
    }

    async findByEmail(email) {
        throw new Error('Method not implemented.');
    }

    async create(userData) {
        throw new Error('Method not implemented.');
    }

    async update(id, updateData) {
        throw new Error('Method not implemented.');
    }

    async updateProfile(userId, profileData) {
        throw new Error('Method not implemented.');
    }

    async delete(id) {
        throw new Error('Method not implemented.');
    }

    async find(query) {
        throw new Error('Method not implemented.');
    }
}

export default IUserRepository;
