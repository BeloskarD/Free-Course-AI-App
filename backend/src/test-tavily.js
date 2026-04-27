import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";

dotenv.config();

async function testTavilyAPI() {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    log("🧪 Testing Tavily API...");
    log(`🔑 Tavily Key: ${process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.substring(0, 15) + '...' : 'NOT FOUND'}`);
    log(`🔑 OpenAI Key: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) + '...' : 'NOT FOUND'}`);

    try {
        const response = await axios.post(
            "https://api.tavily.com/search",
            {
                query: "Python programming learning path",
                search_depth: "basic",
                max_results: 3
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
                    "Content-Type": "application/json"
                },
            }
        );
        log("✅ Tavily API SUCCESS!");
        log(`   Results: ${response.data?.results?.length || 0}`);
        log(`   First result: ${response.data?.results?.[0]?.title || 'N/A'}`);
    } catch (error) {
        log("❌ Tavily API FAILED!");
        log(`   Status: ${error.response?.status || 'No status'}`);
        log(`   Message: ${error.response?.data?.message || error.message}`);
        log(`   Full error data: ${JSON.stringify(error.response?.data || {})}`);
    }

    // Write to file
    fs.writeFileSync('tavily-test-result.txt', logs.join('\n'));
    console.log("📝 Results written to tavily-test-result.txt");
}

testTavilyAPI();
