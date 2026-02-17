import { Hono } from "hono";
import { cors } from "hono/cors";


// ── Types ──────────────────────────────────────────────

type Bindings = {
  PINECONE_API_KEY: string;
  PINECONE_HOST: string; // e.g. https://llmmcp-j4jywpd.svc.aped-4627-b74a.pinecone.io
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  LLMMCP_API_SECRET: string;
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
    console.error(`Pinecone URL: ${host}/records/namespaces/docs/search`);
    console.error(`Pinecone Error Body: ${errText}`);
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

// ── GET /providers — fast KV lookup ────────────────────

app.get("/providers", async (c) => {
  const cached = await c.env.CACHE.get("models:all", "json");
  if (cached) {
    return c.json({ providers: cached });
  }

  // Fallback text if cache is empty
  return c.json({
    providers: {
      openai: "No model data cached. Please run ingestion.",
      anthropic: "No model data cached. Please run ingestion.",
      google: "No model data cached. Please run ingestion.",
    },
  });
});

// ── POST /refresh-models — update cache from Pinecone ──

app.post("/refresh-models", async (c) => {
  // 1. Auth check
  const authHeader = c.req.header("Authorization");
  if (!authHeader || authHeader !== `Bearer ${c.env.LLMMCP_API_SECRET}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const providers = [
    { key: "openai", query: "latest available models GPT" },
    { key: "anthropic", query: "latest available models Claude" },
    { key: "google", query: "latest available models Gemini" },
  ];

  const result: Record<string, string> = {};

  for (const p of providers) {
    try {
      // Fetch top 1 chunk for "latest models"
      const hits = await searchPinecone(
        c.env.PINECONE_HOST,
        c.env.PINECONE_API_KEY,
        p.query,
        1,
        { provider: { $eq: p.key } }
      );

      result[p.key] =
        hits.length > 0 ? hits[0].content : "_No models found in documentation_";
    } catch (e) {
      console.error(`Failed to refresh ${p.key}:`, e);
      result[p.key] = `_Error: ${e instanceof Error ? e.message : String(e)}_`;
    }
  }

  // Save to KV (long TTL, we refresh on ingestion)
  await c.env.CACHE.put("models:all", JSON.stringify(result));

  return c.json({ success: true, cached: result });
});




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
