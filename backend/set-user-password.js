import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-learning-platform';
const TARGET_EMAIL = 'beloskardinesh@gmail.com';
const TEMP_PASSWORD = 'password123'; // The password we want to set

async function setPassword() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to:', mongoose.connection.name);

        const collection = mongoose.connection.db.collection('users');
        const user = await collection.findOne({ email: TARGET_EMAIL });

        if (!user) {
            console.error(`User ${TARGET_EMAIL} not found!`);
            await mongoose.disconnect();
            return;
        }

        const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 10);
        await collection.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword, authProvider: 'local' } }
        );

        console.log(`Successfully set password for ${TARGET_EMAIL}. You can now login with "${TEMP_PASSWORD}".`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

setPassword();
