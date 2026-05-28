import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
dotenv.config({ path: 'd:/backup/FreeCourseApp/ai-learning-platform/backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://beloskardinesh_db_user:cg5AyS4ELvfzcijN@freecourseappcluster.odkhwt0.mongodb.net/test';

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("❌ Error: Missing parameters.");
        console.log("Usage: node toggle_tier.js <email> <free|pro|career_plus>");
        console.log("Example: node toggle_tier.js test@example.com pro");
        process.exit(1);
    }

    const email = args[0].trim().toLowerCase();
    const tier = args[1].trim().toLowerCase();

    if (!['free', 'pro', 'career_plus'].includes(tier)) {
        console.log(`❌ Error: Invalid tier '${tier}'. Choose one of: free, pro, career_plus`);
        process.exit(1);
    }

    try {
        console.log("🔌 Connecting to MongoDB...", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected successfully!");

        console.log(`🔎 Searching for user with email: ${email}...`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ Error: User with email '${email}' not found.`);
            process.exit(1);
        }

        console.log(`👤 Found User: ${user.name || 'No Name'} (${user._id})`);
        console.log(`📊 Current Tier: ${user.subscriptionTier || 'free'}`);

        user.subscriptionTier = tier;
        await user.save();

        console.log(`✨ Success! subscriptionTier updated to: ${tier}`);
    } catch (err) {
        console.error("❌ Execution failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB.");
    }
}

main();
