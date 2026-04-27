import User from '../../models/User.js';
import IUserRepository from '../UserRepository.js';

/**
 * MONGO USER REPOSITORY
 * =====================
 * Mongoose-specific implementation of the User Repository.
 */
class MongoUserRepository extends IUserRepository {
    async findById(id) {
        const user = await User.findById(id);
        return this.toPOJO(user);
    }

    async findByEmail(email) {
        // Case-insensitive email lookup
        const user = await User.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        return this.toPOJO(user);
    }

    async create(userData) {
        const user = new User(userData);
        await user.save();
        return this.toPOJO(user);
    }

    async update(id, updateData) {
        const user = await User.findByIdAndUpdate(id, updateData, { new: true });
        return this.toPOJO(user);
    }

    async updateProfile(userId, profileData) {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: profileData },
            { new: true }
        );
        return this.toPOJO(user);
    }

    async delete(id) {
        return await User.findByIdAndDelete(id);
    }

    async find(query) {
        const users = await User.find(query);
        return this.toPOJO(users);
    }
}

export default new MongoUserRepository();
