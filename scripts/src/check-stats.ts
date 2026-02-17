import { env } from "process";

const PINECONE_API_KEY = env.PINECONE_API_KEY;
const PINECONE_HOST = env.PINECONE_HOST;

if (!PINECONE_API_KEY || !PINECONE_HOST) {
  console.error("Missing PINECONE_API_KEY or PINECONE_HOST");
  process.exit(1);
}

async function checkStats() {
  console.log(`Checking stats for host: ${PINECONE_HOST}`);
  
  const url = `${PINECONE_HOST}/describe_index_stats`;
  const response = await fetch(url, {
    method: "POST", // describe_index_stats is POST in standard API? Or GET? usage varies. Serverless is usually POST for some endpoints, GET for others.
    // Actually, describe_index_stats is usually POST /describe_index_stats.
    headers: {
      "Api-Key": PINECONE_API_KEY!,
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2025-01",
    },
    body: JSON.stringify({}), // Empty body
  });

  const text = await response.text();
  console.log(`Response status: ${response.status}`);
  try {
    const json = JSON.parse(text);
    console.log("Stats:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.log(`Response body: ${text}`);
  }
}

checkStats().catch(console.error);
