/**
 * Pinecone Ingestion Pipeline
 *
 * Fetches docs from OpenAI, Anthropic, and Google, chunks them,
 * and upserts directly to Pinecone (with integrated embeddings).
 *
 * No Cloudflare Worker needed for ingestion — talks to Pinecone directly.
 *
 * Usage:
 *   PINECONE_API_KEY=xxx npm run ingest:pinecone
 *   PINECONE_API_KEY=xxx npm run ingest:pinecone -- --debug   # saves raw docs to debug/
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs"; // Add appendFileSync
import { join } from "node:path";


// ── Config ─────────────────────────────────────────────

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_HOST =
  process.env.PINECONE_HOST ??
  "https://llmmcp-j4jywpd.svc.aped-4627-b74a.pinecone.io";

if (!PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set");
}

const CHUNK_SIZE_CHARS = 3200; // ~800 tokens
const BATCH_SIZE = 10;
const NAMESPACE = "docs";

// ── Debug Mode ─────────────────────────────────────────

const DEBUG_MODE = process.argv.includes("--debug");
const CLEAN_MODE = process.argv.includes("--clear");
const DEBUG_DIR = join(process.cwd(), "debug");

if (DEBUG_MODE) {
  mkdirSync(DEBUG_DIR, { recursive: true });
  console.log(`🐛 Debug mode ON — raw docs will be saved to ${DEBUG_DIR}/\n`);
}

function debugSave(provider: string, url: string, content: string): void {
  if (!DEBUG_MODE) return;

  // Turn URL into a safe filename slug
  const slug = new URL(url).pathname
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .slice(0, 80) || "index";

  const filename = `${provider}-${slug}.txt`;
  const filepath = join(DEBUG_DIR, filename);

  writeFileSync(filepath, content, "utf-8");
  console.log(`  [debug] saved → ${filename} (${content.length} chars)`);
}

// ── Sources ────────────────────────────────────────────

interface DocSource {
  provider: string;
  urls: string[];
}

const SOURCES: DocSource[] = [
  {
    provider: "openai",
    urls: ["https://cdn.openai.com/API/docs/txt/llms-full.txt"],
  },
  {
    provider: "anthropic",
    urls: [
      // Concept & Guide Docs
      "https://platform.claude.com/docs/en/about-claude/models/overview.md",
      "https://platform.claude.com/docs/en/about-claude/models/choosing-a-model.md",
      "https://platform.claude.com/docs/en/about-claude/pricing.md",
      "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview.md",
      "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/system-prompts.md",
      "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought.md",
      "https://platform.claude.com/docs/en/build-with-claude/prompt-caching.md",
      "https://platform.claude.com/docs/en/build-with-claude/vision.md",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview.md",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use.md",
      "https://platform.claude.com/docs/en/build-with-claude/embeddings.md",
      "https://platform.claude.com/docs/en/build-with-claude/structured-outputs.md",
      "https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool.md",
      "https://platform.claude.com/docs/en/build-with-claude/extended-thinking.md",
      "https://platform.claude.com/docs/en/build-with-claude/streaming.md",

      // API Reference
      "https://platform.claude.com/docs/en/api/overview.md",
      "https://platform.claude.com/docs/en/api/messages.md",
      "https://platform.claude.com/docs/en/api/messages/create.md",
      "https://platform.claude.com/docs/en/api/messages/batches.md",
      "https://platform.claude.com/docs/en/api/rate-limits.md",
      "https://platform.claude.com/docs/en/api/errors.md",
    ],
  },
  {
    provider: "google",

    urls: [
      // Docs
      "https://ai.google.dev/gemini-api/docs/models.md.txt",
      "https://ai.google.dev/gemini-api/docs/pricing.md.txt",
      "https://ai.google.dev/gemini-api/docs/text-generation.md.txt",
      "https://ai.google.dev/gemini-api/docs/quickstart.md.txt",
      "https://ai.google.dev/gemini-api/docs/caching.md.txt",
      "https://ai.google.dev/gemini-api/docs/tokens.md.txt",
      "https://ai.google.dev/gemini-api/docs/embeddings.md.txt",
      // API Reference
      "https://ai.google.dev/api.md.txt",
      "https://ai.google.dev/api/all-methods.md.txt",
      "https://ai.google.dev/api/batch-api.md.txt",
      "https://ai.google.dev/api/caching.md.txt",
      "https://ai.google.dev/api/files.md.txt",
      "https://ai.google.dev/api/generate-content.md.txt",
      "https://ai.google.dev/api/tokens.md.txt",
      "https://ai.google.dev/api/embeddings.md.txt",
      "https://ai.google.dev/api/live.md.txt",
      "https://ai.google.dev/api/models.md.txt",
      "https://ai.google.dev/api/tuning.md.txt",
    ],
  },
];

// ── Types ──────────────────────────────────────────────

interface DocChunk {
  id: string;
  text: string;
  metadata: Record<string, string>;
}

interface PineconeRecord {
  id: string;
  content: string; // This field is mapped by Pinecone's integrated embedding model
  provider: string;
  source: string;
  title: string;
}

// ── Main ───────────────────────────────────────────────

// ── Pinecone List Helper ──────────────────────────────

async function listAllIds(namespace: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let paginationToken: string | undefined;

  console.log("  Fetching existing IDs from Pinecone...");

  do {
    const url = new URL(`${PINECONE_HOST}/vectors/list`);
    url.searchParams.set("namespace", namespace);
    if (paginationToken) url.searchParams.set("paginationToken", paginationToken); // Try camelCase first, standard for some Pinecone APIs
    url.searchParams.set("limit", "100");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Api-Key": PINECONE_API_KEY!,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`  [warn] Failed to list IDs: ${res.status} ${body}`);
      break; 
    }

    const data = (await res.json()) as {
      vectors: { id: string }[];
      pagination?: { next: string };
    };

    if (data.vectors) {
      for (const vec of data.vectors) {
        ids.add(vec.id);
      }
    }

    paginationToken = data.pagination?.next;
  } while (paginationToken);

  console.log(`  Found ${ids.size} existing records.`);
  return ids;
}


async function upsertToPinecone(records: PineconeRecord[]): Promise<number> {
  let upserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    let attempts = 0;
    const maxAttempts = 5;
    let success = false;

    while (attempts < maxAttempts && !success) {
      try {
        attempts++;
        const res = await fetch(`${PINECONE_HOST}/records/namespaces/${NAMESPACE}/upsert`, {
          method: "POST",
          headers: {
            "Api-Key": PINECONE_API_KEY!,
            "Content-Type": "application/x-ndjson",
          },
          body: batch.map((r) => JSON.stringify(r)).join("\n"),
        });

        if (!res.ok) {
          if (res.status === 429) {
            console.warn(`    [warn] Batch ${Math.floor(i / BATCH_SIZE) + 1} rate limited (429). Retrying in ${attempts * 2}s...`);
            await new Promise((resolve) => setTimeout(resolve, attempts * 2000));
            continue;
          }

          const body = await res.text();
          // Log payload for debugging
          if (i === 0) {
            console.log(`Payload (first batch, first line): ${JSON.stringify(batch[0])}`);
          }
          const errorMsg = `Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${res.status} ${body}\n`;
          console.error(errorMsg);
          // Write error to file for inspection
          appendFileSync("debug_error.log", errorMsg + "\nPayload (ndjson): " + batch.map((r) => JSON.stringify(r)).join("\n") + "\n\n");
          break; // Don't retry non-429 errors
        }

        success = true;
        upserted += batch.length;
        // console.log(
        //   `    Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(records.length / BATCH_SIZE)} ✓`
        // );
      } catch (err) {
        console.error(`    [error] Network error on batch ${Math.floor(i / BATCH_SIZE) + 1}:`, err);
        // Wait and retry on network errors too
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
  
  if (upserted > 0) {
      console.log(`    Upserted ${upserted} records.`);
  }

  return upserted;
}

// ... 

// In Main Function:
// 1. Get all *potential* chunks first.
// 2. Fetch existing IDs.
// 3. Filter.
// 4. Upsert.

// We need to refactor main() slightly to do this efficiently across sources.
// Or do per-source? No, we need global view to delete stale records if we want true sync.
// For now, let's just do incremental add per source to save costs. Deletion is implicit by re-running clean occasionally? 
// No, user wants "run indefinitely". We should implement creating the diff.

async function main() {
  console.log("=== llmmcp Pinecone ingestion ===");
  console.log(`Host: ${PINECONE_HOST}`);
  console.log(`Debug: ${DEBUG_MODE ? "ON" : "OFF"}`);
  console.log(`Clean: ${CLEAN_MODE ? "ON" : "OFF"}\n`);

  if (CLEAN_MODE) {
    await deleteAll();
  }

  // 1. Fetch existing IDs first (to skip existing)
  let existingIds = new Set<string>();
  if (!CLEAN_MODE) { // Allow listing in debug mode too
      try {
          existingIds = await listAllIds(NAMESPACE);
      } catch (e) {
          console.warn("  [warn] Could not list existing IDs, defaulting to full upsert.", e);
      }
  }

  let totalUpserted = 0;
  let totalSkipped = 0;

  for (const source of SOURCES) {
    console.log(`\n--- ${source.provider.toUpperCase()} ---`);

    const newChunks: DocChunk[] = [];

    for (const url of source.urls) {
      try {
        const content = await fetchDoc(url);
        if (!content || content.trim().length < 100) {
          console.log(`  [skip] ${url} — empty or too short`);
          continue;
        }

        // Save raw content in debug mode
        debugSave(source.provider, url, content);

        const title = extractTitle(content, url);
        const chunks = chunkText(content, source.provider, url, title);
        newChunks.push(...chunks);
        console.log(`  [ok]   ${url} — ${chunks.length} chunks`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [fail] ${url} — ${msg}`);
      }
    }

    if (newChunks.length === 0) {
      console.log(`  No chunks fetched for ${source.provider}, skipping.`);
      continue;
    }

    // In debug mode, skip Pinecone upserts — just fetch & save
    if (DEBUG_MODE) {
      console.log(`  [debug] Skipping Pinecone upsert (${newChunks.length} chunks)`);
      continue;
    }

    // Filter out chunks that already exist
    const recordsToUpsert: PineconeRecord[] = [];
    for (const chunk of newChunks) {
        if (!existingIds.has(chunk.id)) {
            recordsToUpsert.push({
                id: chunk.id,
                content: chunk.text,
                provider: chunk.metadata.provider,
                source: chunk.metadata.source,
                title: chunk.metadata.title,
            });
        }
    }
    
    totalSkipped += (newChunks.length - recordsToUpsert.length);

    if (recordsToUpsert.length === 0) {
        console.log(`  All ${newChunks.length} chunks already exist. Skipping upsert.`);
        continue;
    }

    console.log(`  Upserting ${recordsToUpsert.length} new/changed records (skipped ${newChunks.length - recordsToUpsert.length} existing)...`);

    const upserted = await upsertToPinecone(recordsToUpsert);
    totalUpserted += upserted;
  }

  console.log(`\n=== Done! Total upserted: ${totalUpserted}, Skipped (already existed): ${totalSkipped} ===`);

  if (DEBUG_MODE) {
    console.log(`\n🐛 Debug files saved to: ${DEBUG_DIR}/`);
      console.log(`\n🐛 Debug files saved to: ${DEBUG_DIR}/`);
  }
}

/*
 * ── 4. Trigger Worker Refresh ───────────────────────
 * Tell the Worker to query Pinecone and cache the latest model lists.
 */
if (process.env.LLMMCP_API_URL && process.env.LLMMCP_API_SECRET) {
  console.log("\nTriggering Worker cache refresh...");
  await triggerRefresh(process.env.LLMMCP_API_URL, process.env.LLMMCP_API_SECRET);
} else {
  console.log("\nSkipping Worker refresh (LLMMCP_API_URL or LLMMCP_API_SECRET not set)");
}

console.log("\nDone!");


async function deleteAll() {
  console.log(`\nDeleting all records in namespace '${NAMESPACE}'...`);

  // Use legacy endpoint for reliable deletion on all index types
  const url = `${PINECONE_HOST}/vectors/delete`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Api-Key": PINECONE_API_KEY!,
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2024-07",
    },
    body: JSON.stringify({ deleteAll: true, namespace: NAMESPACE }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`  [fail] Delete failed: ${res.status} ${body}`);
    // Don't exit, might be empty
    return;
  }

  console.log("  [ok] Successfully deleted all records.\n");
}

// ── Fetch ──────────────────────────────────────────────

async function fetchDoc(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "llmmcp-scraper/0.1 (documentation indexer; +https://llmmcp.net)",
    },
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  return res.text();
}

// ── HTML Content Extraction ────────────────────────────



// ── Chunking ───────────────────────────────────────────

function chunkText(
  content: string,
  provider: string,
  source: string,
  title: string
): DocChunk[] {
  const chunks: DocChunk[] = [];

  const sections = content
    .split(/(?=^#{1,3}\s)/m)
    .filter((s) => s.trim().length > 20);

  if (sections.length === 0) {
    return chunkByParagraphs(content, provider, source, title);
  }

  let buffer = "";
  let sectionTitle = title;

  for (const section of sections) {
    const headingMatch = section.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      sectionTitle = headingMatch[1].trim().slice(0, 120);
    }

    if (buffer.length + section.length > CHUNK_SIZE_CHARS) {
      if (buffer.trim().length > 20) {
        chunks.push(makeChunk(buffer.trim(), provider, source, sectionTitle));
      }
      buffer = section;
    } else {
      buffer += "\n\n" + section;
    }
  }

  if (buffer.trim().length > 20) {
    chunks.push(makeChunk(buffer.trim(), provider, source, sectionTitle));
  }

  const final: DocChunk[] = [];
  for (const chunk of chunks) {
    if (chunk.text.length > CHUNK_SIZE_CHARS * 2) {
      final.push(
        ...chunkByParagraphs(
          chunk.text,
          provider,
          source,
          chunk.metadata.title
        )
      );
    } else {
      final.push(chunk);
    }
  }

  return final;
}

function chunkByParagraphs(
  text: string,
  provider: string,
  source: string,
  title: string
): DocChunk[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: DocChunk[] = [];
  let buffer = "";

  for (const para of paragraphs) {
    if (buffer.length + para.length > CHUNK_SIZE_CHARS) {
      if (buffer.trim().length > 20) {
        chunks.push(makeChunk(buffer.trim(), provider, source, title));
      }
      buffer = para;
    } else {
      buffer += "\n\n" + para;
    }
  }

  if (buffer.trim().length > 20) {
    chunks.push(makeChunk(buffer.trim(), provider, source, title));
  }

  return chunks;
}

// ── Helpers ────────────────────────────────────────────

function makeChunk(
  text: string,
  provider: string,
  source: string,
  title: string
): DocChunk {
  const hash = createHash("sha256")
    .update(text + source)
    .digest("hex")
    .slice(0, 16);

  return {
    id: `doc-${hash}`,
    text,
    metadata: { provider, source, title },
  };
}

function extractTitle(content: string, url: string): string {
  const match = content.match(/^#\s+(.+)/m);
  if (match) return match[1].trim().slice(0, 120);

  const path = new URL(url).pathname;
  const segments = path.split("/").filter(Boolean);
  return segments.length > 0
    ? segments[segments.length - 1].replace(/-/g, " ")
    : "Documentation";
}

async function triggerRefresh(apiUrl: string, apiKey: string) {
  try {
    const res = await fetch(`${apiUrl}/refresh-models`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.warn(`Worker refresh failed: ${res.status} ${await res.text()}`);
    } else {
      console.log("Worker cache refreshed successfully.");
    }
  } catch (err) {
    console.warn("Error triggering Worker refresh:", err);
  }
}

// ── Run ────────────────────────────────────────────────

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
