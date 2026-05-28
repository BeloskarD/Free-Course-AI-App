import User from '../../models/User.js';
import IUserRepository from '../UserRepository.js';
import UserMapper from '../../mappers/UserMapper.js';

/**
 * MONGO USER REPOSITORY
 * =====================
 * Mongoose implementation of the User Repository.
 * Cleanly maps active db records into clean POJOs using UserMapper.
 * Note: Object freezing is deferred in Phase 2A to ensure service layer compatibility.
 */
class MongoUserRepository extends IUserRepository {
    async findById(id) {
        const user = await User.findById(id);
        return UserMapper.toDomain(user, { freeze: false });
    }

    async findByEmail(email) {
        if (!email) return null;
        // Case-insensitive email lookup
        const user = await User.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        return UserMapper.toDomain(user, { freeze: false });
    }

    async create(userData) {
        const user = new User(userData);
        await user.save();
        return UserMapper.toDomain(user, { freeze: false });
    }

    async update(id, updateData) {
        const user = await User.findByIdAndUpdate(id, updateData, { new: true });
        return UserMapper.toDomain(user, { freeze: false });
    }

    async updateProfile(userId, profileData) {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: profileData },
            { new: true }
        );
        return UserMapper.toDomain(user, { freeze: false });
    }

    async delete(id) {
        const user = await User.findByIdAndDelete(id);
        return UserMapper.toDomain(user, { freeze: false });
    }

    async find(query) {
        const users = await User.find(query);
        if (!users) return [];
        return users.map(u => UserMapper.toDomain(u, { freeze: false }));
    }
}

export default new MongoUserRepository();
