import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-learning-platform';

async function checkUsers() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to:', mongoose.connection.name);

        const collection = mongoose.connection.db.collection('users');
        const users = await collection.find({}).limit(10).toArray();

        console.log(`Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`- Email: ${user.email} | Name: ${user.name} | Password Hash: ${user.password ? 'YES' : 'NO'}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
