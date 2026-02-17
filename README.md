# llmmcp

Real-time LLM API documentation via MCP. Stop hallucinations about model names, pricing, and parameters.

## Architecture

```
┌─────────────┐     text query      ┌──────────────────┐
│  MCP Client │ ──────────────────> │  Cloudflare       │
│  (Cursor,   │                     │  Worker           │
│   Claude    │ <────────────────── │  ┌─ Workers AI    │
│   Desktop)  │     markdown chunks │  │  (embedding)   │
│             │                     │  ├─ Vectorize     │
│  ┌────────┐ │                     │  │  (vector DB)   │
│  │ llmmcp │ │                     │  └─ KV            │
│  │  CLI   │ │                     │     (cache)       │
│  └────────┘ │                     └──────────────────┘
└─────────────┘
```

- **CLI** (`/cli`): Thin MCP stdio server. Sends text queries, receives markdown. Local LRU cache.
- **Worker** (`/worker`): Cloudflare Worker (Hono). Embeds queries via Workers AI, searches Vectorize, caches in KV.
- **Web** (`/web`): Landing page. Model status board + install guide.
- **Scripts** (`/scripts`): Automated doc scraper that fetches from OpenAI, Anthropic, and Google's public docs.

## Setup

### 1. Push to GitHub

Create a private repo and push this project.

### 2. Create Cloudflare account

Sign up at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) (free, no credit card).

### 3. One-time Cloudflare resource setup

```bash
npm install -g wrangler
wrangler login
wrangler vectorize create llmmcp-docs --dimensions=768 --metric=cosine
wrangler kv namespace create CACHE
```

Copy the KV namespace ID into `worker/wrangler.toml`.

### 4. Deploy the landing page

In Cloudflare dashboard: **Workers & Pages** > **Create** > **Pages** > **Connect to Git**

| Field | Value |
|---|---|
| Root directory | `web` |
| Build command | `npm install && npm run build` |
| Deploy command | `npx wrangler deploy` |

### 5. Deploy the Worker API

In GitHub repo: **Settings** > **Secrets** > **Actions** > add these secrets:

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Create at Cloudflare > My Profile > API Tokens > "Edit Cloudflare Workers" template |
| `LLMMCP_API_URL` | Your Worker URL after first deploy (e.g. `https://llmmcp-api.xxx.workers.dev`) |
| `LLMMCP_API_SECRET` | Any strong random string for ingestion auth |

Push to `main` — the GitHub Action auto-deploys the Worker.

### 6. Docs auto-update

A GitHub Action runs weekly to scrape the latest docs from OpenAI, Anthropic, and Google, then uploads them to Vectorize. You can also trigger it manually from the Actions tab.

## MCP Client Configuration

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp"]
    }
  }
}
```

## License

MIT
