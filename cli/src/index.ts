#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { LRUCache } from "./cache.js";
import { queryDocs, type DocResult } from "./client.js";

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

// ── Tool: list_llms ────────────────────────────────────

server.tool(
  "list_llms",
  "List available LLM documentation providers and their latest known model versions. Contains data for OpenAI, Anthropic, and Google Gemini.",
  {},
  async () => {
    // Hardcoded latest model data for OpenAI and Anthropic
    const staticSections = [
      "### OpenAI Models",
      "- **o3-mini** (2025-01-31): High intelligence, cost-effective reasoning model.",
      "- **o1** (2024-12-17): Reasoning model for complex tasks.",
      "- **GPT-4o** (2024-11-20): High-intelligence flagship model.",
      
      "### Anthropic Models",
      "- **Claude 3.7 Sonnet** (2025-10): Intelligent, fast, and cost-effective.",
      "- **Claude 3.5 Haiku** (2024-11): Fastest and most cost-effective model.",
      "- **Claude 3.5 Sonnet** (2024-10): Balance of intelligence and speed.",
    ];

    let geminiSection = "### Google Gemini Models\n\n_Failed to fetch latest models._";

    try {
      const response = await fetch("https://ai.google.dev/gemini-api/docs/models.md.txt");
      if (response.ok) {
        const text = await response.text();
        // Extract content up to "## Previous Gemini models"
        const splitText = text.split("## Previous Gemini models")[0];
        if (splitText) {
          geminiSection = `### Google Gemini Models (Fetched dynamically)\n\n${splitText.trim()}`;
        }
      }
    } catch (error) {
      console.error("Failed to fetch Gemini models:", error);
    }

    const allSections = [
      ...staticSections,
      geminiSection,
      "---",
      "**Disclaimer**: This tool currently only supports OpenAI, Anthropic, and Google Gemini.",
    ].join("\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: allSections,
        },
      ],
    };
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
