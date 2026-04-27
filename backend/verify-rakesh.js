import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-learning-platform';

async function verifyRakesh() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to:', mongoose.connection.name);

        const collection = mongoose.connection.db.collection('users');
        const user = await collection.findOne({ email: 'rakesh@test.com' });

        if (user) {
            console.log(`✅ Found Rakesh: ${user.email} | Password Hash: ${user.password ? 'YES' : 'NO'}`);
        } else {
            console.error('❌ Rakesh NOT found!');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

verifyRakesh();
