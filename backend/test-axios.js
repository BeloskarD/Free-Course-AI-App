import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference/chat/completions";
const model = "openai/gpt-5";

async function main() {
  console.log("🚀 Testing GitHub Model (Axios):", model);

  try {
    const response = await axios.post(endpoint, {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello" }
      ],
      model: model
    }, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Success!");
    console.log("Content:", response.data.choices[0].message.content);
  } catch (err) {
    console.error("❌ Axios Error Status:", err.response?.status);
    console.error("Error Detail:", JSON.stringify(err.response?.data, null, 2));
  }
}

main();
