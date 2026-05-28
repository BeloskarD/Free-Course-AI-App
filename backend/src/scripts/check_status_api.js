import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI;

async function checkStatus() {
    await mongoose.connect(mongoUri);
    const collection = mongoose.connection.db.collection('agendaJobs');
    const jobId = '69fb8ed2f6ac252e657b59f7';
    const job = await collection.findOne({ _id: new mongoose.Types.ObjectId(jobId) });
    
    // We can't get the raw accessKey from the hash, but we can look at the enqueue logs 
    // or just assume we need to fix the logic if it's failing for the user.
    // Wait! I'll try to find a job that DOES have a result but is returning 403.
    
    console.log('Job found:', !!job);
    console.log('Job Meta:', job?.data?.__jobMeta);

    const url = `http://127.0.0.1:5000/api/ai/job-status/${jobId}`;
    
    try {
        const res = await axios.get(url, { headers: { 'X-Job-Access-Key': 'some-dummy' } }); // Key will still fail but let's see
        console.log('Status Code:', res.status);
        console.log('Response Body:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log('Error Data:', e.response?.data);
        // If we get 403, it means the accessKey is required.
        // I'll try to BYPASS the check in a local test by modifying the controller temporarily? 
        // No, I'll just check the code again.
    }
    await mongoose.disconnect();
}

checkStatus();
