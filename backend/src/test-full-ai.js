import dotenv from "dotenv";
import axios from "axios";
import Groq from "groq-sdk";
import fs from "fs";

dotenv.config();

async function testFullAISearch() {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    const query = "Python programming basics";
    const currentYear = new Date().getFullYear();

    log("🧪 Testing Full AI Search Pipeline...");
    log(`🔑 Tavily Key: ${process.env.TAVILY_API_KEY ? 'Present' : 'MISSING'}`);
    log(`🔑 Groq Key: ${process.env.GROQ_API_KEY ? 'Present' : 'MISSING'}`);
    log(`📝 Query: "${query}"`);
    log("");

    try {
        // Step 1: Tavily Search
        log("STEP 1: Tavily Search...");
        const tavilyResponse = await axios.post(
            "https://api.tavily.com/search",
            {
                query: `${query} learning path courses`,
                search_depth: "basic",
                max_results: 5
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
                    "Content-Type": "application/json"
                },
            }
        );
        log(`✅ Tavily SUCCESS: ${tavilyResponse.data?.results?.length || 0} results`);
        log("");

        // Step 2: Groq Completion
        log("STEP 2: Groq AI Completion...");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `Return ONLY valid JSON with this structure:
                    {
                        "learningGoal": "string",
                        "skillBreakdown": [{"skill": "string", "priority": "High"}],
                        "roadmap": [{"phase": "string", "duration": "string"}],
                        "courses": [{"title": "string", "platform": "string", "type": "Free"}],
                        "tools": [{"name": "string", "description": "string", "official_link": "string"}],
                        "careerInsights": {"targetRoles": ["string"], "salaryRange": "string"}
                    }`
                },
                {
                    role: "user",
                    content: `Learning Goal: ${query}\n\nMarket Data: ${JSON.stringify(tavilyResponse.data.results.slice(0, 3))}`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 2000,
        });

        const data = JSON.parse(completion.choices[0].message.content);
        log(`✅ Groq SUCCESS!`);
        log(`   Model: ${completion.model}`);
        log(`   Tokens: ${completion.usage?.total_tokens}`);
        log(`   Learning Goal: ${data.learningGoal}`);
        log(`   Skills: ${data.skillBreakdown?.length || 0}`);
        log(`   Courses: ${data.courses?.length || 0}`);
        log(`   Tools: ${data.tools?.length || 0}`);
        log("");
        log("=== SAMPLE DATA ===");
        log(JSON.stringify(data, null, 2).substring(0, 2000));

    } catch (error) {
        log("❌ PIPELINE FAILED!");
        log(`   Error: ${error.message}`);
        log(`   Type: ${error.constructor.name}`);
        if (error.response) {
            log(`   Status: ${error.response.status}`);
            log(`   Data: ${JSON.stringify(error.response.data)}`);
        }
        if (error.error) {
            log(`   API Error: ${JSON.stringify(error.error)}`);
        }
    }

    fs.writeFileSync('full-ai-test-result.txt', logs.join('\n'));
    console.log("\n📝 Full results written to full-ai-test-result.txt");
}

testFullAISearch();
