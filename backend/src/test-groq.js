import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";

dotenv.config();

async function testGroqAPI() {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    log("🧪 Testing Groq API...");
    log(`🔑 Groq Key present: ${process.env.GROQ_API_KEY ? 'Yes (' + process.env.GROQ_API_KEY.substring(0, 15) + '...)' : 'NOT FOUND'}`);

    try {
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "You are a helpful assistant. Respond with JSON only." },
                { role: "user", content: "Return a simple JSON with one field 'status' set to 'working' and 'model' set to 'Llama 3.3 70B'" }
            ],
            response_format: { type: "json_object" },
            max_tokens: 100,
        });

        const response = completion.choices[0].message.content;
        log("✅ Groq API SUCCESS!");
        log(`   Response: ${response}`);
        log(`   Model used: ${completion.model}`);
        log(`   Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);
    } catch (error) {
        log("❌ Groq API FAILED!");
        log(`   Error type: ${error.constructor.name}`);
        log(`   Error code: ${error.code || 'N/A'}`);
        log(`   Status: ${error.status || 'N/A'}`);
        log(`   Message: ${error.message}`);
    }

    // Write to file
    fs.writeFileSync('groq-test-result.txt', logs.join('\n'));
    console.log("📝 Results written to groq-test-result.txt");
}

testGroqAPI();
