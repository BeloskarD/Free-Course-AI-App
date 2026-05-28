import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';

async function checkJobs() {
    console.log('Connecting to Mongo...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const collection = mongoose.connection.db.collection('agendaJobs');
    const jobs = await collection.find({}).sort({$natural: -1}).limit(5).toArray();

    console.log(`Total jobs in collection: ${await collection.countDocuments({})}`);
    
    jobs.forEach(job => {
        console.log('---');
        console.log(`ID: ${job._id}`);
        console.log(`Name: ${job.name}`);
        console.log(`Next Run: ${job.nextRunAt}`);
        console.log(`Locked At: ${job.lockedAt}`);
        console.log(`Last Finished: ${job.lastFinishedAt}`);
        console.log(`Failed At: ${job.failedAt}`);
        console.log(`Result: ${job.result ? 'PRESENT' : 'MISSING'}`);
    });

    await mongoose.disconnect();
}

checkJobs();
