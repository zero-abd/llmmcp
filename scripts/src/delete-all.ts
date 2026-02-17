import { env } from "process";

const PINECONE_API_KEY = env.PINECONE_API_KEY;
const PINECONE_HOST = env.PINECONE_HOST;
const NAMESPACE = "docs";

if (!PINECONE_API_KEY || !PINECONE_HOST) {
  console.error("Missing PINECONE_API_KEY or PINECONE_HOST");
  process.exit(1);
}

async function deleteAll() {
  console.log(`Deleting all records in namespace '${NAMESPACE}' via legacy endpoint...`);
  
  const url = `${PINECONE_HOST}/vectors/delete`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Api-Key": PINECONE_API_KEY!,
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2024-07", // Trying older version or standard
    },
    body: JSON.stringify({ deleteAll: true, namespace: NAMESPACE }),
  });

  const text = await response.text();
  console.log(`Response status: ${response.status}`);
  console.log(`Response body: ${text}`);

  if (response.ok) {
    console.log("✅ Successfully deleted records.");
  } else {
    // Fallback: try without version header?
    console.error("❌ Failed to delete records.");
  }
}

deleteAll().catch(console.error);
