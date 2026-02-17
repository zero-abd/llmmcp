import { env } from "process";

const PINECONE_API_KEY = env.PINECONE_API_KEY;
const PINECONE_HOST = env.PINECONE_HOST;
const NAMESPACE = "docs";

if (!PINECONE_API_KEY || !PINECONE_HOST) {
  console.error("Missing credentials");
  process.exit(1);
}

async function testUpsert() {
  console.log("Testing upsert formats...");
  const url = `${PINECONE_HOST}/records/namespaces/${NAMESPACE}/upsert`;

/*
  // Test 1: Wrapped in object
  const record1 = { _id: "test-obj", content: "This is test from object payload" };
  console.log("Test 1: { records: [ ... ] }");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": PINECONE_API_KEY!,
        "Content-Type": "application/json",
        "X-Pinecone-API-Version": "2025-01",
      },
      body: JSON.stringify({ records: [record1] }),
    });
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${await res.text()}`);
  } catch (e) {
    console.error(e);
  }
*/

/*
  // Test 2: Raw array
  const record2 = { _id: "test-arr", content: "This is test from array payload" };
  console.log("\nTest 2: [ ... ]");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": PINECONE_API_KEY!,
        "Content-Type": "application/json",
        "X-Pinecone-API-Version": "2025-01",
      },
      body: JSON.stringify([record2]),
    });
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${await res.text()}`);
  } catch (e) {
    console.error(e);
  }
*/

  // Test 3: id instead of _id
  console.log("\nTest 3: { records: [ { id: '...', content: '...' } ] }");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": PINECONE_API_KEY!,
        "Content-Type": "application/json",
        "X-Pinecone-API-Version": "2025-01",
      },
      body: JSON.stringify({ records: [{ id: "test-id", content: "test" }] }),
    });
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${await res.text()}`);
  } catch (e) {
    console.error(e);
  }

  // Test 4: Both id and _id
  console.log("\nTest 4: { records: [ { id: '...', _id: '...', content: '...' } ] }");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": PINECONE_API_KEY!,
        "Content-Type": "application/json",
        "X-Pinecone-API-Version": "2025-01",
      },
      body: JSON.stringify({ records: [{ id: "test-both", _id: "test-both", content: "test" }] }),
    });
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${await res.text()}`);
  } catch (e) {
    console.error(e);
  }
}

testUpsert().catch(console.error);
