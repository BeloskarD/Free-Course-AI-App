import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const client = ModelClient(endpoint, new AzureKeyCredential(token));

async function run(model) {
  try {
    console.log("Testing model:", model);
    const start = Date.now();
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [{ role: "user", content: "Say hi" }],
        model: model,
      }
    });
    console.log("Response time:", Date.now() - start, "ms");
    if (response.status === "200") {
      console.log("Success!");
    } else {
      console.log("Failed:", response.status, response.body);
    }
  } catch(e) {
    console.log("Error:", e.message);
  }
}

async function main() {
  await run("gpt-4o");
  await run("gpt-4.1");
  await run("gpt-4.1-mini");
  await run("gpt-4o-mini");
}
main();
