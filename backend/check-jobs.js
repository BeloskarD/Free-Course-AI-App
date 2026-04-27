import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkJobs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ Connected to Mongo: ${process.env.MONGO_URI}`);
        
        const jobs = await mongoose.connection.db.collection('agendaJobs').find({}).toArray();
        console.log(`Found ${jobs.length} jobs in agendaJobs collection:`);
        
        jobs.slice(-5).forEach(job => {
            console.log(`- ID: ${job._id}, Name: ${job.name}, Status: ${job.lastFinishedAt ? 'finished' : 'pending'}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

checkJobs();
