import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

async function testOpenAI() {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    log("🧪 Testing OpenAI API...");
    log(`🔑 OpenAI Key present: ${process.env.OPENAI_API_KEY ? 'Yes (' + process.env.OPENAI_API_KEY.substring(0, 20) + '...)' : 'NOT FOUND'}`);

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: [
                { role: "system", content: "You are a helpful assistant. Respond with JSON only." },
                { role: "user", content: "Return a simple JSON with one field 'status' set to 'working'" }
            ],
            response_format: { type: "json_object" },
            max_tokens: 50,
        });

        const response = completion.choices[0].message.content;
        log("✅ OpenAI API SUCCESS!");
        log(`   Response: ${response}`);
        log(`   Model used: ${completion.model}`);
        log(`   Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);
    } catch (error) {
        log("❌ OpenAI API FAILED!");
        log(`   Error type: ${error.constructor.name}`);
        log(`   Error code: ${error.code || 'N/A'}`);
        log(`   Status: ${error.status || 'N/A'}`);
        log(`   Message: ${error.message}`);

        if (error.message?.includes('quota') || error.code === 'insufficient_quota') {
            log("");
            log("⚠️  QUOTA EXCEEDED: Your OpenAI account has run out of credits!");
            log("    To fix this:");
            log("    1. Visit https://platform.openai.com/account/billing");
            log("    2. Add payment method and credits");
            log("    3. Or create a new API key with a fresh account");
        }
    }

    // Write to file
    fs.writeFileSync('openai-test-result.txt', logs.join('\n'));
    console.log("📝 Results written to openai-test-result.txt");
}

testOpenAI();
