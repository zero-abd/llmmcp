# Latest Fetched Data from All 3 Providers
> Fetched: 2026-02-16

---

## 🔴 CRITICAL BUG FOUND

**Anthropic's `llms-full.txt` URL is DEAD (404).**
- Old URL: `https://docs.anthropic.com/en/llms-full.txt` → **404 Not Found**
- Working URL: `https://docs.anthropic.com/en/docs/about-claude/models` → ✅ Works

This means **all Claude/Anthropic data in Pinecone is stale** from whenever it was last ingested.

---

## 1. OpenAI (from `cdn.openai.com/API/docs/txt/llms-full.txt`) ✅ WORKING

### Latest Models Found:

| Model | Type | Input ($/1M) | Output ($/1M) |
|-------|------|-------------|---------------|
| **GPT-5** | Flagship | $1.25 | $10 |
| **GPT-5 mini** | Fast | $0.25 | $2 |
| **GPT-5 nano** | Cheapest | — | — |
| **GPT-4.1** | Previous gen | $2 | $8 |
| **GPT-4.1 mini** | — | $0.4 | $1.6 |
| **GPT-4.1 nano** | — | $0.1 | $0.4 |
| **o4-mini** | Reasoning | $1.1 | $4.4 |
| **o3-pro** | Reasoning | $20 | $80 |
| **o3** | Reasoning | $2 | $8 |
| **o3-deep-research** | Research | $10 | $40 |
| **o1-pro** | Reasoning | $150 | $600 |
| **codex-mini-latest** | Code | $1.5 | $6 |
| GPT-4o | Legacy | $2.5 | $10 |
| GPT-4o mini | Legacy | $0.15 | $0.6 |

**Key info:** GPT-5 is described as "our flagship model for coding, reasoning, and agentic tasks." Snapshot: `gpt-5-2025-08-07`.

---

## 2. Google Gemini (from `ai.google.dev/gemini-api/docs/models`) ✅ WORKING

### Latest Models Found:

| Model | API Name | Description |
|-------|----------|-------------|
| **Gemini 3 Pro** | `gemini-3-pro-preview` | "The best model in the world for multimodal understanding, most powerful agentic and vibe-coding model" |
| **Gemini 3 Pro Image** | `gemini-3-pro-image-preview` | Image gen + text, 65K input tokens |
| **Gemini 3 Flash** | `gemini-3-flash-preview` | "Our most balanced model built for speed, scale, and frontier intelligence" |
| **Gemini 2.5 Flash** | `gemini-2.5-flash` | "Best model in price-performance, large scale processing, agentic use cases" |
| **Gemini 2.5 Flash-Lite** | `gemini-2.5-flash-lite` | Cost-effective |
| **Gemini 2.5 Pro** | `gemini-2.5-pro` | Pro tier |
| Gemini 2.0 Flash | `gemini-2.0-flash` | Previous gen |
| Gemini 2.0 Flash-Lite | — | Previous gen |

**Key info:**
- Gemini 3 Pro: 1M input tokens, 65K output tokens, supports thinking, function calling, code execution, search grounding
- Gemini 3 Flash: 1M input tokens, 65K output tokens, same capabilities

---

## 3. Anthropic Claude (from `docs.anthropic.com/en/docs/about-claude/models`) ✅ WORKING

### Latest Models Found:

| Model | Notes |
|-------|-------|
| **Claude Opus 4.6** | "Our latest generation model with exceptional performance in coding and reasoning" (recommended) |
| **Claude Sonnet 4.5** | Supports 1M token context window (beta) |
| **Claude 4** | "Top-tier results in reasoning, coding, multilingual tasks, long-context handling" |

**Key info:**
- Migration guide: "Migrating to Claude 4.6"
- 1M token context via `context-1m-2025-08-07` beta header
- Supports extended thinking + adaptive thinking

---

## What's Wrong in the Codebase

### `cli/src/index.ts` — `list_providers` tool
**Problem:** Hardcoded model names are outdated. Currently lists:
- OpenAI: `GPT-4o, GPT-4o Mini, o1` — **WRONG**, should be GPT-5, o4-mini, o3
- Gemini: `Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash` — **OUTDATED**, missing Gemini 3
- Claude: `Claude 3.5 Sonnet, Claude 3 Opus` — **WRONG**, should be Claude Opus 4.6, Sonnet 4.5

**Fix needed:** Either remove hardcoded model names entirely (have `list_providers` just list provider names, and let `search_docs` handle model discovery), or make `list_providers` query Pinecone for "latest models" dynamically.

### `scripts/src/ingest-pinecone.ts` — Anthropic source URL
**Problem:** `https://docs.anthropic.com/en/llms-full.txt` returns **404**
**Fix needed:** Change to `https://docs.anthropic.com/en/docs/about-claude/models` (type: `html`)

### Ingestion hasn't been re-run
Even though Google and OpenAI URLs work, the data in Pinecone is from the last ingestion run and may be stale.
