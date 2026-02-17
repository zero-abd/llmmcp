"use client";

import { useState } from "react";

// ── Data ────────────────────────────────────────────────

const models = [
  {
    provider: "Gemini",
    color: "#4285f4",
    models: [
      { name: "Gemini 2.5 Pro", id: "gemini-2.5-pro", context: "1M" },
      { name: "Gemini 2.5 Flash", id: "gemini-2.5-flash", context: "1M" },
      { name: "Gemini 2.0 Flash", id: "gemini-2.0-flash", context: "1M" },
    ],
  },
  {
    provider: "Claude",
    color: "#d97706",
    models: [
      { name: "Claude Sonnet 4", id: "claude-sonnet-4-20250514", context: "200K" },
      { name: "Claude Opus 4", id: "claude-opus-4-20250514", context: "200K" },
      { name: "Claude 3.5 Haiku", id: "claude-3-5-haiku-20241022", context: "200K" },
    ],
  },
  {
    provider: "OpenAI",
    color: "#10b981",
    models: [
      { name: "GPT-4.1", id: "gpt-4.1", context: "1M" },
      { name: "o3", id: "o3", context: "200K" },
      { name: "o4-mini", id: "o4-mini", context: "200K" },
    ],
  },
];

type Client = {
  id: string;
  name: string;
  icon: string;
  description: string;
  filePath: string;
  config: string;
  color: string;
  docsUrl: string;
};

const clients: Client[] = [
  {
    id: "cursor",
    name: "Cursor",
    icon: "⌨️",
    description: "AI-powered code editor",
    filePath: ".cursor/mcp.json",
    config: `{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp"]
    }
  }
}`,
    color: "#00b4d8",
    docsUrl: "https://docs.cursor.com/context/model-context-protocol",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    icon: "🟠",
    description: "Anthropic's agentic CLI",
    filePath: "Run in terminal",
    config: `claude mcp add llmmcp -- npx -y llmmcp`,
    color: "#d97706",
    docsUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp",
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    icon: "💬",
    description: "Claude desktop app",
    filePath: "claude_desktop_config.json",
    config: `{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp"]
    }
  }
}`,
    color: "#c2410c",
    docsUrl: "https://modelcontextprotocol.io/quickstart/user",
  },
  {
    id: "vscode",
    name: "VS Code (Copilot)",
    icon: "💎",
    description: "GitHub Copilot Agent Mode",
    filePath: ".vscode/mcp.json",
    config: `{
  "servers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp"]
    }
  }
}`,
    color: "#007acc",
    docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    icon: "🏄",
    description: "Codeium's AI IDE",
    filePath: "~/.codeium/windsurf/mcp_config.json",
    config: `{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp"]
    }
  }
}`,
    color: "#06d6a0",
    docsUrl: "https://docs.codeium.com/windsurf/mcp",
  },
  {
    id: "codex",
    name: "Codex CLI",
    icon: "🤖",
    description: "OpenAI's agentic CLI",
    filePath: "~/.codex/config.json",
    config: `{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp"]
    }
  }
}`,
    color: "#10b981",
    docsUrl: "https://github.com/openai/codex",
  },
  {
    id: "antigravity",
    name: "Antigravity",
    icon: "🚀",
    description: "Google's agentic IDE",
    filePath: ".gemini/settings.json",
    config: `{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp"]
    }
  }
}`,
    color: "#8b5cf6",
    docsUrl: "https://cloud.google.com/gemini/docs/codeassist/use-mcp-servers",
  },
  {
    id: "zed",
    name: "Zed",
    icon: "⚡",
    description: "High-performance editor",
    filePath: "~/.config/zed/settings.json",
    config: `{
  "context_servers": {
    "llmmcp": {
      "command": {
        "path": "npx",
        "args": ["-y", "llmmcp"]
      }
    }
  }
}`,
    color: "#f59e0b",
    docsUrl: "https://zed.dev/docs/assistant/model-context-protocol",
  },
];

// ── Components ──────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-xs font-medium text-[var(--muted)] transition-all hover:border-[var(--muted)] hover:text-[var(--fg)]"
      title="Copy to clipboard"
    >
      {copied ? (
        <span className="flex items-center gap-1 text-emerald-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </span>
      )}
    </button>
  );
}

function ClientCard({ client, isActive, onClick }: { client: Client; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
        isActive
          ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]/50 hover:bg-[var(--card)]/80"
      }`}
    >
      <span className="text-2xl">{client.icon}</span>
      <div className="min-w-0">
        <p className={`font-semibold text-sm truncate ${isActive ? "text-indigo-300" : "text-[var(--fg)]"}`}>
          {client.name}
        </p>
        <p className="text-xs text-[var(--muted)] truncate">{client.description}</p>
      </div>
    </button>
  );
}

// ── Page ────────────────────────────────────────────────

export default function Home() {
  const [activeClient, setActiveClient] = useState("cursor");
  const active = clients.find((c) => c.id === activeClient) ?? clients[0];

  return (
    <main className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm text-[var(--muted)]">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            MCP Server &middot; Open Source
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Stop LLM{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Hallucinations
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)] leading-relaxed">
            LLMs make up API parameters, invent model names, and hallucinate
            pricing. <strong className="text-[var(--fg)]">llmmcp</strong> gives
            them real-time documentation for Gemini, Claude, and OpenAI via the
            Model Context Protocol.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#install"
              className="rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-white transition hover:bg-[var(--accent-light)]"
            >
              Get Started
            </a>
            <a
              href="https://github.com/zero-abd/llmmcp"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-3 font-medium transition hover:border-[var(--muted)]"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[var(--muted)]">
          Three steps. No API keys needed. Zero configuration.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "LLM calls search_docs",
              desc: "When your AI assistant needs accurate API info, it calls the llmmcp MCP tool automatically.",
            },
            {
              step: "2",
              title: "Semantic search",
              desc: "The query is embedded and matched against our curated documentation index powered by Pinecone.",
            },
            {
              step: "3",
              title: "Accurate answer",
              desc: "Real documentation chunks are returned to the LLM, replacing hallucinated info with facts.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-lg font-bold text-indigo-400">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Install Guide ────────────────────────────── */}
      <section id="install" className="border-y border-[var(--border)] bg-[var(--card)]/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold">
            Add to your editor
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--muted)]">
            Select your MCP client and copy the configuration. No API key required.
          </p>

          {/* Client selector grid */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                isActive={activeClient === client.id}
                onClick={() => setActiveClient(client.id)}
              />
            ))}
          </div>

          {/* Config display */}
          <div className="mt-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]" style={{ boxShadow: `0 0 40px -12px ${active.color}20` }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{active.icon}</span>
                <div>
                  <h3 className="font-semibold text-lg">{active.name}</h3>
                  <p className="text-xs text-[var(--muted)] font-mono">
                    {active.filePath}
                  </p>
                </div>
              </div>
              <a
                href={active.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--fg)] hover:border-[var(--muted)]"
              >
                Docs
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            {/* Code block */}
            <div className="relative">
              <CopyButton text={active.config} />
              <pre className="overflow-x-auto p-5 pr-24 text-sm leading-relaxed">
                <code className="text-indigo-300">{active.config}</code>
              </pre>
            </div>

            {/* Footer hint */}
            <div className="border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--muted)]">
              {active.id === "claude-code" ? (
                <>Run this command in your terminal — that&apos;s it!</>
              ) : (
                <>Paste this into <code className="text-indigo-400">{active.filePath}</code> and restart your editor.</>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            That&apos;s it. The next time your LLM needs API docs, it will
            automatically call <code className="text-indigo-400">search_docs</code>{" "}
            and get real data.
          </p>
        </div>
      </section>

      {/* ── Model Status Board ───────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">
          Latest Model Versions
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[var(--muted)]">
          The models llmmcp knows about. Updated regularly.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {models.map((group) => (
            <div
              key={group.provider}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              <div
                className="px-5 py-3 text-sm font-semibold uppercase tracking-wider"
                style={{ borderBottom: `2px solid ${group.color}` }}
              >
                {group.provider}
              </div>
              <div className="divide-y divide-[var(--border)]">
                {group.models.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      <p className="text-xs text-[var(--muted)] font-mono">
                        {m.id}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--muted)] tabular-nums">
                      {m.context}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto max-w-5xl px-6 flex flex-col items-center gap-2 text-sm text-[var(--muted)]">
          <p>
            <strong className="text-[var(--fg)]">llmmcp</strong> &middot; Open
            source &middot;{" "}
            <a
              href="https://github.com/zero-abd/llmmcp"
              className="underline hover:text-[var(--fg)]"
            >
              GitHub
            </a>
          </p>
          <p>Built on Cloudflare Workers + Pinecone + Model Context Protocol</p>
        </div>
      </footer>
    </main>
  );
}
