import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const JOB_ID = '69c57d59959f05a0317829e4';

async function checkSpecificJob() {
    try {
        console.log('Connecting to Mongo...');
        await mongoose.connect(MONGO_URI);
        const collection = mongoose.connection.db.collection('agendaJobs');
        
        console.log(`Searching for Job ID: ${JOB_ID}`);
        
        // Try by ObjectId
        let job = await collection.findOne({ _id: new mongoose.Types.ObjectId(JOB_ID) });
        
        if (!job) {
            // Try by string
            job = await collection.findOne({ _id: JOB_ID });
        }

        if (job) {
            console.log('✅ Job Found:');
            console.log(JSON.stringify(job, null, 2));
        } else {
            console.log('❌ Job NOT FOUND in agendaJobs collection.');
            
            // Check for any jobs with similar ID prefix
            const similarJobs = await collection.find({ _id: { $regex: '^69c57' } }).toArray();
            console.log(`Found ${similarJobs.length} jobs with prefix 69c57:`);
            similarJobs.forEach(j => console.log(`- ${j._id} | ${j.name} | ${j.lastFinishedAt}`));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSpecificJob();
