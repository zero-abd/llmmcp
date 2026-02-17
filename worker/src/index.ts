import { Hono } from "hono";
import { cors } from "hono/cors";


// ── Types ──────────────────────────────────────────────

type Bindings = {
  PINECONE_API_KEY: string;
  PINECONE_HOST: string; // e.g. https://llmmcp-j4jywpd.svc.aped-4627-b74a.pinecone.io
  CACHE: KVNamespace;
  ENVIRONMENT: string;
};

type QueryRequest = {
  query: string;
  provider?: string;
  topK?: number;
};

type DocChunk = {
  id: string;
  content: string;
  metadata: {
    provider: string;
    source: string;
    title: string;
  };
  score: number;
};

// ── Pinecone search helper ─────────────────────────────

async function searchPinecone(
  host: string,
  apiKey: string,
  query: string,
  topK: number,
  filter?: Record<string, any>
): Promise<DocChunk[]> {
  const body: Record<string, any> = {
    query: {
      inputs: { text: query },
      top_k: topK,
    },
    fields: ["content", "provider", "source", "title"],
  };

  if (filter) {
    body.query.filter = filter;
  }

  const response = await fetch(`${host}/records/namespaces/docs/search`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2025-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Pinecone search failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    result: {
      hits: {
        _id: string;
        _score: number;
        fields: {
          content?: string;
          provider?: string;
          source?: string;
          title?: string;
        };
      }[];
    };
  };

  return data.result.hits.map((hit) => ({
    id: hit._id,
    content: hit.fields.content ?? "",
    metadata: {
      provider: hit.fields.provider ?? "unknown",
      source: hit.fields.source ?? "",
      title: hit.fields.title ?? "",
    },
    score: hit._score,
  }));
}

// ── App ────────────────────────────────────────────────

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors());

// Health check
app.get("/", (c) => {
  return c.json({
    service: "llmmcp-api",
    status: "ok",
    version: "0.3.0",
    backend: "pinecone",
  });
});

// ── POST /query — main search endpoint ─────────────────

app.post("/query", async (c) => {
  const body = await c.req.json<QueryRequest>();
  const { query, provider, topK = 3 } = body;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return c.json({ error: "Missing or empty 'query' field" }, 400);
  }

  if (topK < 1 || topK > 10) {
    return c.json({ error: "'topK' must be between 1 and 10" }, 400);
  }

  // ── 1. Check KV cache ──
  const cacheKey = await createHash(
    `${query.trim().toLowerCase()}:${provider ?? "all"}:${topK}`
  );

  const cached = await c.env.CACHE.get(cacheKey, "json");
  if (cached) {
    return c.json({ results: cached, cached: true });
  }

  // ── 2. Query Pinecone directly (uses integrated embeddings) ──
  // Map CLI provider names → Pinecone stored provider names
  const providerMap: Record<string, string> = {
    claude: "anthropic",
    anthropic: "anthropic",
    gemini: "google",
    google: "google",
    openai: "openai",
  };
  const mappedProvider = provider ? (providerMap[provider] ?? provider) : undefined;
  const filter = mappedProvider ? { provider: { $eq: mappedProvider } } : undefined;

  const results = await searchPinecone(
    c.env.PINECONE_HOST,
    c.env.PINECONE_API_KEY,
    query.trim(),
    topK,
    filter
  );

  // ── 3. Cache results in KV (TTL: 1 hour) ──
  try {
    await c.env.CACHE.put(cacheKey, JSON.stringify(results), {
      expirationTtl: 3600,
    });
  } catch {
    // KV write failures are non-critical — log and continue
    console.warn("KV cache write failed for key:", cacheKey);
  }

  return c.json({ results, cached: false });
});

// ── GET /providers — dynamic provider + model discovery ──

interface ProviderInfo {
  name: string;
  key: string;
  models: string[];
  source: string;
}

const PROVIDER_QUERIES: { name: string; key: string; filter: string; query: string }[] = [
  { name: "OpenAI", key: "openai", filter: "openai", query: "latest available models GPT" },
  { name: "Anthropic", key: "anthropic", filter: "anthropic", query: "latest available models Claude" },
  { name: "Google Gemini", key: "gemini", filter: "google", query: "latest available models Gemini" },
];

app.get("/providers", async (c) => {
  // ── 1. Check KV cache ──
  const cacheKey = "providers:dynamic:v1";
  const cached = await c.env.CACHE.get(cacheKey, "json");
  if (cached) {
    return c.json({ providers: cached, cached: true });
  }

  // ── 2. Query Pinecone for each provider's model info ──
  const providers: ProviderInfo[] = [];

  for (const pq of PROVIDER_QUERIES) {
    try {
      const hits = await searchPinecone(
        c.env.PINECONE_HOST,
        c.env.PINECONE_API_KEY,
        pq.query,
        3,
        { provider: { $eq: pq.filter } }
      );

      // Extract model names from content using patterns
      const models = extractModelNames(hits, pq.key);

      providers.push({
        name: pq.name,
        key: pq.key,
        models,
        source: hits.length > 0 ? hits[0].metadata.source : "unknown",
      });
    } catch (err) {
      // If search fails for one provider, still return others
      providers.push({
        name: pq.name,
        key: pq.key,
        models: [],
        source: "error",
      });
    }
  }

  // ── 3. Cache for 1 hour ──
  try {
    await c.env.CACHE.put(cacheKey, JSON.stringify(providers), {
      expirationTtl: 3600,
    });
  } catch {
    // Non-critical
  }

  return c.json({ providers, cached: false });
});

// ── Model name extraction ──────────────────────────────

function extractModelNames(hits: DocChunk[], providerKey: string): string[] {
  const allContent = hits.map((h) => h.content).join("\n");
  const modelSet = new Set<string>();

  // Provider-specific patterns
  const patterns: Record<string, RegExp[]> = {
    openai: [
      /\b(gpt-5(?:-mini|-nano)?(?:-\d{4}-\d{2}-\d{2})?)\b/gi,
      /\b(gpt-4\.1(?:-mini|-nano)?(?:-\d{4}-\d{2}-\d{2})?)\b/gi,
      /\b(gpt-4o(?:-mini)?(?:-\d{4}-\d{2}-\d{2})?)\b/gi,
      /\b(o[1-4](?:-mini|-pro)?(?:-deep-research)?(?:-\d{4}-\d{2}-\d{2})?)\b/gi,
      /\b(codex-mini-latest)\b/gi,
    ],
    anthropic: [
      /\b(claude\s+(?:opus|sonnet|haiku)\s+\d+(?:\.\d+)?)\b/gi,
      /\b(claude-(?:opus|sonnet|haiku)-\d+(?:\.\d+)?(?:-\d+)?)\b/gi,
      /\b(claude-\d+(?:\.\d+)?-(?:opus|sonnet|haiku)(?:-\d+)?)\b/gi,
    ],
    gemini: [
      /\b(gemini-\d+(?:\.\d+)?-(?:pro|flash|flash-lite)(?:-preview|-image-preview)?)\b/gi,
      /\bGemini\s+(\d+(?:\.\d+)?\s+(?:Pro|Flash|Flash-Lite|Deep Think))\b/gi,
    ],
  };

  const providerPatterns = patterns[providerKey] ?? [];

  for (const pattern of providerPatterns) {
    const matches = allContent.matchAll(pattern);
    for (const m of matches) {
      // Normalize: lowercase, trim trailing date snapshots for dedup
      let name = m[0].trim();
      // Skip dated snapshots — only keep base model names
      if (/\d{4}-\d{2}-\d{2}/.test(name)) continue;
      // Skip batch variants
      if (/\(batch\)/i.test(name)) continue;
      modelSet.add(name);
    }
  }

  // Sort and return top unique models (max 8)
  return [...modelSet].slice(0, 8);
}


// ── Utilities ──────────────────────────────────────────

/**
 * Create a SHA-256 hash of a string, returned as a hex string.
 * Uses the Web Crypto API available in Workers.
 */
async function createHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default app;
