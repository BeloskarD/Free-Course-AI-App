import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

dotenv.config();

async function testGemini() {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    log("🧪 Testing Gemini API Key: " + process.env.GEMINI_API_KEY?.substring(0, 15) + "...");
    log("");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try gemini-2.0-flash-exp which worked before (got 429 not 404)
    const modelsToTry = ["gemini-2.0-flash-exp"];

    for (const modelName of modelsToTry) {
        try {
            log(`📡 Testing: ${modelName}`);

            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello in JSON format: {\"message\": \"hello\"}");
            const text = result.response.text();

            log(`✅ SUCCESS: ${modelName}`);
            log(`   Response: ${text}`);

        } catch (error) {
            log(`❌ FAILED: ${modelName}`);
            log(`   Status: ${error.status || 'N/A'}`);
            log(`   Error: ${error.message?.substring(0, 150)}`);

            if (error.status === 429) {
                log("");
                log("⚠️ Key is VALID but QUOTA EXCEEDED");
                log("   This means your free tier daily limit is reached.");
                log("   Try again tomorrow or enable billing.");
            }
        }
    }

    fs.writeFileSync('gemini-test-result.txt', logs.join('\n'));
    console.log("\n📝 Results saved");
}

testGemini();
