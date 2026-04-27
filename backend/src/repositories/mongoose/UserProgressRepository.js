import UserProgress from '../../models/UserProgress.js';
import IUserProgressRepository from '../UserProgressRepository.js';

/**
 * MONGO USER PROGRESS REPOSITORY
 * ==============================
 */
class MongoUserProgressRepository extends IUserProgressRepository {
    async findByUserId(userId) {
        const progress = await UserProgress.findOne({ userId });
        return this.toPOJO(progress);
    }

    async create(data) {
        const progress = new UserProgress(data);
        await progress.save();
        return this.toPOJO(progress);
    }

    async update(id, data) {
        const progress = await UserProgress.findByIdAndUpdate(id, data, { new: true });
        return this.toPOJO(progress);
    }

    async findById(id) {
        const progress = await UserProgress.findById(id);
        return this.toPOJO(progress);
    }

    async find(query) {
        const progress = await UserProgress.find(query);
        return this.toPOJO(progress);
    }
}

export default new MongoUserProgressRepository();
