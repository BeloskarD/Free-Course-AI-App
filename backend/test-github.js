import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from 'dotenv';
dotenv.config();

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "gpt-4.1";

async function main() {
  console.log("🚀 Testing GitHub Model:", model);
  console.log("Token starts with:", token.substring(0, 10));

  const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token),
  );

  try {
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role:"system", content: "You are a helpful assistant." },
          { role:"user", content: "Hello" }
        ],
        model: model
      }
    });

    if (isUnexpected(response)) {
      console.error("❌ Unexpected response status:", response.status);
      console.error("Body:", JSON.stringify(response.body, null, 2));
      return;
    }

    console.log("✅ Response received!");
    console.log("Body Structure keys:", Object.keys(response.body || {}));
    if (response.body.choices) {
        console.log("Choices length:", response.body.choices.length);
        console.log("Choice 0 message:", response.body.choices[0].message);
    } else {
        console.log("No choices in body");
    }
  } catch (err) {
    console.error("❌ Error encountered:", err.message);
  }
}

main();
