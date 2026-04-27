import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testTavily() {
  console.log("--- Testing Tavily API ---");
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log("❌ TAVILY_API_KEY is not defined in .env");
    return;
  }
  console.log(`Key found: ${apiKey.substring(0, 8)}...`);

  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      { query: "top machine learning courses 2026", search_depth: 'advanced', max_results: 3 },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    console.log("✅ Tavily is working!");
    console.log(`Found ${response.data.results?.length || 0} results.`);
    if (response.data.results?.[0]) {
      console.log(`Sample Result: ${response.data.results[0].title} - ${response.data.results[0].url}`);
    }
  } catch (error) {
    console.log("❌ Tavily request failed:");
    console.log(`Status: ${error.response?.status || 'N/A'}`);
    console.log(`Message: ${error.response?.data?.error || error.message}`);
  }
}

async function testSerper() {
  console.log("\n--- Testing Serper API ---");
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.log("❌ SERPER_API_KEY is not defined in .env");
    return;
  }
  console.log(`Key found: ${apiKey.substring(0, 8)}...`);

  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      { q: "top machine learning courses 2026", num: 3 },
      { headers: { "X-API-KEY": apiKey }, timeout: 10000 }
    );
    console.log("✅ Serper is working!");
    console.log(`Found ${response.data.organic?.length || 0} results.`);
    if (response.data.organic?.[0]) {
      console.log(`Sample Result: ${response.data.organic[0].title} - ${response.data.organic[0].link}`);
    }
  } catch (error) {
    console.log("❌ Serper request failed:");
    console.log(`Status: ${error.response?.status || 'N/A'}`);
    console.log(`Message: ${error.response?.data?.message || error.message}`);
  }
}

(async () => {
  await testTavily();
  await testSerper();
})();
