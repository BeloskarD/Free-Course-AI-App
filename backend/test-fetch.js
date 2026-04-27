import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference/chat/completions";
const model = "openai/gpt-5";

async function main() {
  console.log("🚀 Testing GitHub Model (Direct Fetch):", model);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello" }
        ],
        model: model
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Response Status:", response.status);
      console.error("Error Detail:", JSON.stringify(data, null, 2));
    } else {
      console.log("✅ Success!");
      console.log("Content:", data.choices[0].message.content);
    }
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
  }
}

main();
