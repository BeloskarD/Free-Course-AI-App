import Bytez from "bytez.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testBytez() {
    const key = process.env.OPENAI_API_KEY;
    console.log("Using Key:", key ? `${key.substring(0, 4)}...` : "MISSING");

    try {
        const bytez = new Bytez(key);
        const model = bytez.model("openai/gpt-4.1-mini");
        console.log("Model instance created. Running test prompt...");

        const { error, output } = await model.run([
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Hello, confirm you are working." }
        ]);

        if (error) {
            console.error("❌ Bytez Error:", error);
        } else {
            console.log("✅ Bytez Success:", output);
        }
    } catch (err) {
        console.error("❌ Exception:", err.message);
    }
}

testBytez();
