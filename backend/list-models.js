import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference/catalog/models";

async function main() {
  console.log("🚀 Listing Available GitHub Models...");

  try {
    const response = await axios.get(endpoint, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("✅ Success!");
    const models = response.data;
    console.log("Found", models.length, "models.");
    
    // Filter for OpenAI models or GPT models
    const gptModels = models.filter(m => m.name.toLowerCase().includes('gpt') || m.friendly_name.toLowerCase().includes('gpt'));
    console.log("GPT Models:", JSON.stringify(gptModels.map(m => m.name), null, 2));
    
    // Log first few models to see structure
    console.log("First 5 models:", JSON.stringify(models.slice(0, 5).map(m => m.name), null, 2));

  } catch (err) {
    console.error("❌ Axios Error Status:", err.response?.status);
    console.error("Error Detail:", JSON.stringify(err.response?.data, null, 2));
  }
}

main();
