#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { LRUCache } from "./cache.js";
import { queryDocs, fetchProviders, type DocResult } from "./client.js";

// ── Config ─────────────────────────────────────────────

const API_URL = process.env.LLMMCP_API_URL || "https://llmmcp-api.almahmud-zero.workers.dev";

const CACHE_MAX = 200;
const PROVIDERS = ["gemini", "claude", "openai"] as const;

// ── Local LRU Cache ────────────────────────────────────

const cache = new LRUCache<DocResult[]>(CACHE_MAX);

// ── MCP Server ─────────────────────────────────────────

const server = new McpServer({
  name: "llmmcp",
  version: "1.1.0",
});

// ── Tool: search_docs ──────────────────────────────────

server.tool(
  "search_docs",
  "Search real-time LLM API documentation to get accurate, up-to-date information. Use this to verify API parameters, model names, pricing, and capabilities for Gemini, Claude, and OpenAI instead of relying on training data.",
  {
    query: z
      .string()
      .min(3)
      .describe(
        "The documentation search query, e.g. 'Claude Opus 4.6 tool_use parameters'"
      ),
    provider: z
      .enum(PROVIDERS)
      .optional()
      .describe(
        "Filter to a specific provider: 'gemini', 'claude', or 'openai'"
      ),
  },
  async ({ query, provider }) => {
    const cacheKey = `${query.trim().toLowerCase()}:${provider ?? "all"}`;

    // Check local LRU cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return formatResponse(cached, true);
    }

    // Query the Worker backend
    try {
      const results = await queryDocs(API_URL, {
        query: query.trim(),
        provider,
        topK: 3,
      });

      // Store in local cache
      cache.set(cacheKey, results);

      return formatResponse(results, false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      return {
        content: [
          {
            type: "text" as const,
            text: `Error searching docs: ${message}. The llmmcp service may be temporarily unavailable.`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ── Tool: list_providers ───────────────────────────────

server.tool(
  "list_providers",
  "List available LLM documentation providers and their latest known model versions. Data is fetched dynamically from indexed documentation — no hardcoded model names.",
  {},
  async () => {
    try {
      const providers = await fetchProviders(API_URL);

      // providers is now a simple map: { openai: "...", anthropic: "..." }
      // We'll format it as a markdown list of sections.

      if (Object.keys(providers).length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No providers found. The service may be initializing.",
            },
          ],
        };
      }

      const sections = Object.entries(providers)
        .map(([provider, content]) => {
          const name = provider.charAt(0).toUpperCase() + provider.slice(1);
          return `### ${name} Models\n\n${content}\n`;
        })
        .join("\n---\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: sections || "No models data available.",
          },
        ],
      };
    } catch (err) {
      // Graceful fallback — still list providers without model details
      const message =
        err instanceof Error ? err.message : "Unknown error";

      const fallback = [
        "### OpenAI (`openai`)",
        "### Anthropic (`claude`)",
        "### Google Gemini (`gemini`)",
        "",
        `_Could not fetch dynamic model data: ${message}_`,
        "_Use `search_docs` with a provider filter to find the latest models._",
      ].join("\n");

      return {
        content: [{ type: "text" as const, text: fallback }],
      };
    }
  }
);

// ── Helpers ────────────────────────────────────────────

function formatResponse(results: DocResult[], fromCache: boolean) {
  if (results.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No documentation found for this query. Try rephrasing or specifying a provider.",
        },
      ],
    };
  }

  const chunks = results.map((r, i) => {
    const header = `## [${i + 1}] ${r.metadata.title} (${r.metadata.provider})`;
    const source = `_Source: ${r.metadata.source}_`;
    const score = `_Relevance: ${(r.score * 100).toFixed(1)}%_`;
    return `${header}\n${source} | ${score}\n\n${r.content}`;
  });

  const footer = fromCache ? "\n\n---\n_Served from local cache_" : "";
  const text = chunks.join("\n\n---\n\n") + footer;

  return {
    content: [{ type: "text" as const, text }],
  };
}

// ── Start ──────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("llmmcp MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
