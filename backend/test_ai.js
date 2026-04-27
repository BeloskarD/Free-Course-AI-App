import Groq from "groq-sdk";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testGroq() {
  console.log("--- Testing Groq API ---");
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log("❌ GROQ_API_KEY is missing");
    return;
  }
  try {
    const groq = new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say hello" }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 10,
    });
    console.log("✅ Groq is working!");
    console.log("Response:", response.choices[0]?.message?.content);
  } catch (e) {
    console.log("❌ Groq failed:", e.message);
  }
}

testGroq();
