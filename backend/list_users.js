import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
dotenv.config({ path: 'd:/backup/FreeCourseApp/ai-learning-platform/backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://beloskardinesh_db_user:cg5AyS4ELvfzcijN@freecourseappcluster.odkhwt0.mongodb.net/test';

async function main() {
    try {
        console.log("Connecting to MongoDB...", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully!");

        console.log("Retrieving registered users...");
        const users = await User.find({}).select('email name subscriptionTier gamification.level');

        if (users.length === 0) {
            console.log("No users found in database.");
        } else {
            console.log("\nRegistered Users:");
            console.log("=================");
            users.forEach(u => {
                console.log(`- Email: ${u.email}`);
                console.log(`  Name: ${u.name || 'N/A'}`);
                console.log(`  Tier: ${u.subscriptionTier || 'free'}`);
                console.log(`  Level: ${u.gamification?.level || 1}`);
                console.log("-----------------");
            });
        }
    } catch (err) {
        console.error("Execution failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

main();
