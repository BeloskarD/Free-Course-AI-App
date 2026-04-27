import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-learning-platform';

async function listDbs() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to:', mongoose.connection.name);

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        
        console.log('Available Databases:');
        for (const dbInfo of dbs.databases) {
            console.log(`- ${dbInfo.name}`);
            const db = mongoose.connection.client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            const usersColl = collections.find(c => c.name === 'users');
            if (usersColl) {
                const count = await db.collection('users').countDocuments();
                console.log(`  -> has "users" collection with ${count} records.`);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

listDbs();
