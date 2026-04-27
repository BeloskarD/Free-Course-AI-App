import { Mission, UserMissionProgress } from '../../models/Mission.js';
import IMissionRepository from '../MissionRepository.js';

/**
 * MONGO MISSION REPOSITORY
 * ========================
 * Mongoose-specific implementation of the Mission Repository.
 */
class MongoMissionRepository extends IMissionRepository {
    async findById(id) {
        const mission = await Mission.findById(id);
        return this.toPOJO(mission);
    }

    async findByUserId(userId, status) {
        const query = { userId };
        if (status) query.status = status;
        const progress = await UserMissionProgress.find(query).populate('missionId');
        return this.toPOJO(progress);
    }

    async getActiveMissions(userId) {
        const progress = await UserMissionProgress.find({ 
            userId, 
            status: 'in_progress' 
        }).populate('missionId');
        return this.toPOJO(progress);
    }

    async create(missionData) {
        const mission = new Mission(missionData);
        await mission.save();
        return this.toPOJO(mission);
    }

    async update(id, updateData) {
        const mission = await Mission.findByIdAndUpdate(id, updateData, { new: true });
        return this.toPOJO(mission);
    }

    async delete(id) {
        return await Mission.findByIdAndDelete(id);
    }

    async find(query) {
        const missions = await Mission.find(query);
        return this.toPOJO(missions);
    }
}

export default new MongoMissionRepository();
