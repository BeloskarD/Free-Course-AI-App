import axios from 'axios';

async function test() {
    try {
        console.log("🚀 Starting Skill Analysis Test...");
        const res = await axios.post('http://127.0.0.1:5000/api/skill-analysis/analyze-gap', {
            targetRole: 'Product Engineer'
        });
        
        const data = res.data;
        console.log("📦 Response:", JSON.stringify(data, null, 2));
        
        if (data.success && data.data?.jobId) {
            const jobId = data.data.jobId;
            console.log(`⏳ Enqueued! Job ID: ${jobId}. Waiting 3s...`);
            await new Promise(r => setTimeout(r, 3000));
            
            console.log(`🔍 Polling status for ${jobId}...`);
            try {
                const statusRes = await axios.get(`http://127.0.0.1:5000/api/jobs/${jobId}`);
                console.log("📊 Status Response:", JSON.stringify(statusRes.data, null, 2));
            } catch (statusError) {
                console.error("📊 Status Poll Error:", statusError.response?.data || statusError.message);
            }
        }
    } catch (err) {
        console.error("❌ Test Failed:", err.response?.data || err.message);
    }
}

test();
