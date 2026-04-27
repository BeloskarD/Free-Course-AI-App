import Achievement from '../../models/Achievement.js';
import IAchievementRepository from '../AchievementRepository.js';

/**
 * MONGO ACHIEVEMENT REPOSITORY
 * ============================
 */
class MongoAchievementRepository extends IAchievementRepository {
    async findAll() {
        const achievements = await Achievement.find();
        return this.toPOJO(achievements);
    }

    async findById(id) {
        const achievement = await Achievement.findById(id);
        return this.toPOJO(achievement);
    }

    async find(query) {
        const achievements = await Achievement.find(query);
        return this.toPOJO(achievements);
    }

    async create(data) {
        const achievement = new Achievement(data);
        await achievement.save();
        return this.toPOJO(achievement);
    }

    async update(id, data) {
        const achievement = await Achievement.findByIdAndUpdate(id, data, { new: true });
        return this.toPOJO(achievement);
    }
}

export default new MongoAchievementRepository();
