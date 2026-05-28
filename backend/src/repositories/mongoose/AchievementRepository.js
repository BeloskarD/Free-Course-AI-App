import Achievement from '../../models/Achievement.js';
import IAchievementRepository from '../AchievementRepository.js';
import AchievementMapper from '../../mappers/AchievementMapper.js';

/**
 * MONGO ACHIEVEMENT REPOSITORY
 * ============================
 * Mongoose implementation of the Achievement Repository.
 * Cleanly maps active db records into frozen database-agnostic POJOs.
 */
class MongoAchievementRepository extends IAchievementRepository {
    async findAll() {
        const achievements = await Achievement.find();
        return AchievementMapper.toDomain(achievements);
    }

    async findById(id) {
        const achievement = await Achievement.findById(id);
        return AchievementMapper.toDomain(achievement);
    }

    async find(query) {
        const achievements = await Achievement.find(query);
        return AchievementMapper.toDomain(achievements);
    }

    async create(data) {
        const achievement = new Achievement(data);
        await achievement.save();
        return AchievementMapper.toDomain(achievement);
    }

    async update(id, data) {
        const achievement = await Achievement.findByIdAndUpdate(id, data, { new: true });
        return AchievementMapper.toDomain(achievement);
    }
}

export default new MongoAchievementRepository();
