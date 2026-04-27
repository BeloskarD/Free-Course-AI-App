import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-learning-platform';

async function compareDbs() {
    try {
        console.log('Connecting to Atlas Cluster...');
        await mongoose.connect(MONGO_URI);
        
        const client = mongoose.connection.client;
        
        const dbNames = ['ai-learning-platform', 'test'];
        for (const name of dbNames) {
            console.log(`\n--- Database: ${name} ---`);
            const db = client.db(name);
            const collections = await db.listCollections().toArray();
            for (const coll of collections) {
                const count = await db.collection(coll.name).countDocuments();
                console.log(`  - ${coll.name}: ${count} records`);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

compareDbs();
