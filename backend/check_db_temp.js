import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://beloskardinesh_db_user:cg5AyS4ELvfzcijN@freecourseappcluster.odkhwt0.mongodb.net/test';

async function main() {
    try {
        console.log("Connecting to MongoDB...", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully!");

        // Define inline models
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const LearnerProfile = mongoose.model('LearnerProfile', new mongoose.Schema({}, { strict: false }));
        const UserMissionProgress = mongoose.model('UserMissionProgress', new mongoose.Schema({}, { strict: false }));

        const targetUserId = '696ea3e2597eb28b8af1c17f';
        console.log(`\n--- Fetching User Data for ID: ${targetUserId} ---`);
        
        const userObj = await User.findById(targetUserId);
        console.log("User Document:", JSON.stringify(userObj, null, 2));

        const profileObj = await LearnerProfile.findOne({ userId: new mongoose.Types.ObjectId(targetUserId) });
        if (profileObj) {
            console.log("\nLearner Profile Document Keys:", Object.keys(profileObj.toObject()));
            console.log("Goals:", JSON.stringify(profileObj.get('goals'), null, 2));
            console.log("Mastered Skills Count:", profileObj.get('masteredSkills')?.length || 0);
            console.log("Mastered Skills List:", JSON.stringify(profileObj.get('masteredSkills'), null, 2));
            console.log("Portfolio Section:", JSON.stringify(profileObj.get('portfolio'), null, 2));
        } else {
            console.log("No Learner Profile found for user ID!");
        }

        const missionsCount = await UserMissionProgress.countDocuments({ userId: new mongoose.Types.ObjectId(targetUserId) });
        console.log("\nCompleted/Active Missions Count:", missionsCount);

        const completedMissions = await UserMissionProgress.find({ userId: new mongoose.Types.ObjectId(targetUserId) });
        console.log("Missions:", JSON.stringify(completedMissions, null, 2));

    } catch (err) {
        console.error("Error in diagnostic script:", err);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB.");
    }
}

main();
