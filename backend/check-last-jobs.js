import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-learning-platform';

async function checkJobs() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to:', mongoose.connection.name);

        const collection = mongoose.connection.db.collection('agendaJobs');
        const jobs = await collection.find({}).sort({ nextRunAt: -1, lastRunAt: -1 }).limit(10).toArray();

        console.log(`Found ${jobs.length} recent jobs:`);
        jobs.forEach(job => {
            console.log(`- ID: ${job._id.toString()} | Name: ${job.name} | Status: ${job.lastFinishedAt ? 'finished' : (job.lockedAt ? 'running' : 'queued')} | Result: ${job.data?.result ? 'YES' : 'NO'}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkJobs();
