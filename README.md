# llmmcp

[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-1.1-blue)](https://registry.modelcontextprotocol.io/?q=llmmcp)<br>
🌐 **Website:** https://llmmcp.vercel.app

**Stop LLM hallucinations and outdated code patterns.**

`llmmcp` is a Model Context Protocol (MCP) server that provides real-time, up-to-date documentation for major LLM providers (OpenAI, Anthropic, and Google Gemini). It ensures your AI agents—like Cursor, Claude Desktop, or Windsurf—base their work on current official documentation instead of stale training data or deprecated library patterns.

## Why use llmmcp?
LLMs frequently hallucinate about their own latest versions, feature availability (e.g., tool use in certain models), and pricing. `llmmcp` fixes this by providing:
- ✅ **Up-to-Date Model Info**: Always know the latest available models (e.g., Gemini 2.0 Flash, Claude 3.5 Sonnet).
- ✅ **Detailed API Params**: Verified tool use syntax, context window sizes, and rate limits.
- ✅ **Latest Implementation Patterns**: Force your AI agent to follow current best practices instead of using legacy or deprecated library versions.
- ✅ **Real-Time Search**: Queries an indexed vector database of official provider documentation.
- ✅ **Dynamic Listings**: Get the current state of providers without hardcoded lists.

---

## 🚀 Quick Start

You can use `llmmcp` immediately in your favorite AI tools without local installation.

### Cursor
Add a new MCP server in **Settings > Models > MCP Servers**:
- **Name**: `llmmcp`
- **Type**: `command`
- **Command**: `npx -y llmmcp@latest`

### Claude Desktop
Add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp@latest"]
    }
  }
}
```

---

## 🛠 Features

### `search_docs`
Search the latest official documentation for specific technical details. 
*Example: "What are the tool use parameters for Gemini 1.5 Pro?"*

### `list_providers`
Get a dynamically updated list of available providers (OpenAI, Anthropic, Google) and their currently promoted models.

---

## 🏗 How it Works

`llmmcp` is designed for speed and reliability:
1.  **Indexer**: A weekly scraper fetches raw markdown/text from official documentation.
2.  **Vector DB**: Chunks are embedded and stored in **Pinecone** with integrated embedding support.
3.  **Backend**: A **Cloudflare Worker** handles query embedding and retrieval, caching frequent results in **Workers KV**.
4.  **MCP Client**: A thin CLI translates MCP requests into API calls for the Worker.

---

## 🤝 Contributing & Self-Hosting

This project is open-source. If you'd like to run your own instance of the backend:
1.  See [Architecture & Deployment](docs/DEPLOYMENT.md) (coming soon, see current setup in logs).
2.  Fork the repo and submit a PR for new documentation sources.

---

---

Developed by [Abdullah Al Mahmud](https://abdullahalmahmud.me)

## License
MIT
