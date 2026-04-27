import LearnerProfile from '../../models/LearnerProfile.js';
import ILearnerProfileRepository from '../LearnerProfileRepository.js';

/**
 * MONGO LEARNER PROFILE REPOSITORY
 * ===============================
 */
class MongoLearnerProfileRepository extends ILearnerProfileRepository {
    async findByUserId(userId) {
        const profile = await LearnerProfile.findOne({ userId });
        return this.toPOJO(profile);
    }

    async create(data) {
        const profile = new LearnerProfile(data);
        await profile.save();
        return this.toPOJO(profile);
    }

    async update(id, data) {
        const profile = await LearnerProfile.findByIdAndUpdate(id, data, { new: true });
        return this.toPOJO(profile);
    }

    async findById(id) {
        const profile = await LearnerProfile.findById(id);
        return this.toPOJO(profile);
    }

    async find(query) {
        const profiles = await LearnerProfile.find(query);
        return this.toPOJO(profiles);
    }
}

export default new MongoLearnerProfileRepository();
