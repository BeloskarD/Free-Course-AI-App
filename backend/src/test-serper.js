import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

async function testSerper() {
    console.log("🧪 Testing Serper API...");
    console.log(`🔑 Serper Key: ${process.env.SERPER_API_KEY ? process.env.SERPER_API_KEY.substring(0, 10) + '...' : 'NOT FOUND'}`);

    try {
        const response = await axios.post(
            "https://google.serper.dev/search",
            {
                q: "Python programming course",
                gl: "in",
                hl: "en",
                num: 5
            },
            {
                headers: {
                    "X-API-KEY": process.env.SERPER_API_KEY,
                    "Content-Type": "application/json"
                },
            }
        );
        console.log("✅ Serper API SUCCESS!");
        console.log(`   Results: ${response.data?.organic?.length || 0}`);
        console.log(`   First result: ${response.data?.organic?.[0]?.title || 'N/A'}`);
    } catch (error) {
        console.log("❌ Serper API FAILED!");
        console.log(`   Status: ${error.response?.status || 'No status'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
}

testSerper();
