import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.GITHUB_TOKEN;
const client = ModelClient("https://models.github.ai/inference", new AzureKeyCredential(token));

async function main() {
  const content = "x".repeat(6000); // long prompt
  const start = Date.now();
  console.log("Testing gpt-4.1 heavy payload...");
  try {
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [{ role: "system", content: "You are a JSON generator. Return JSON." }, { role: "user", content: "Parse this into JSON and output at least 500 words: " + content }],
        model: "gpt-4.1",
        response_format: { type: "json_object" }
      }
    });
    console.log("Time:", Date.now()-start, "ms | Status:", response.status);
    if (!isUnexpected(response)) {
      console.log(response.body.choices[0].message.content.substring(0, 100));
    } else {
      console.log(response.body);
    }
  } catch(e) { console.log("Error:", e.message); }
}
main();
