// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Github, 
  Terminal, 
  Search, 
  Zap, 
  Database, 
  Code2, 
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Cpu,
  Globe,
  Monitor,
  ShieldCheck,
  Sparkles,
  Command
} from "lucide-react";

// ── Types ───────────────────────────────────────────────

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

// ── Data ────────────────────────────────────────────────

const clients: Client[] = [
  {
    id: "antigravity",
    name: "Antigravity",
    icon: "🪐",
    description: "Google's AI-powered IDE",
    filePath: ".antigravity/mcp.json",
    config: `{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp@latest"]
    }
  }
}`,
    color: "#4285F4",
    docsUrl: "https://antigravity.google/",
  },
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
      "args": ["-y", "llmmcp@latest"]
    }
  }
}`,
    color: "#00b4d8",
    docsUrl: "https://docs.cursor.com/context/model-context-protocol",
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
      "args": ["-y", "llmmcp@latest"]
    }
  }
}`,
    color: "#c2410c",
    docsUrl: "https://modelcontextprotocol.io/quickstart/user",
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
      "args": ["-y", "llmmcp@latest"]
    }
  }
}`,
    color: "#06d6a0",
    docsUrl: "https://docs.codeium.com/windsurf/mcp",
  },
  {
    id: "vscode",
    name: "VS Code",
    icon: "💎",
    description: "GitHub Copilot Agent Mode",
    filePath: ".vscode/mcp.json",
    config: `{
  "servers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp@latest"]
    }
  }
}`,
    color: "#007acc",
    docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
  },
];

const bubbleIcons = [Terminal, Search, Cpu, Code2, Globe, Monitor, ShieldCheck, Sparkles, Command, Zap, Database];

// ── Components ──────────────────────────────────────────

function RandomBubbles() {
  const [bubbles, setBubbles] = useState<{ id: number; iconIndex: number; top: string; left: string }[]>([]);

  const getPeripheralPos = () => {
    // Avoid center 60% of vertical and horizontal space
    // Safe zones: top 20%, bottom 20%, left 20%, right 20%
    const isHorizontalEdge = Math.random() > 0.5;
    let top, left;

    if (isHorizontalEdge) {
      // Near top or bottom edge (can be anywhere horizontally)
      top = Math.random() > 0.5 ? `${5 + Math.random() * 15}%` : `${80 + Math.random() * 10}%`;
      left = `${5 + Math.random() * 90}%`;
    } else {
      // Near left or right edge (can be anywhere vertically)
      left = Math.random() > 0.5 ? `${5 + Math.random() * 15}%` : `${80 + Math.random() * 10}%`;
      top = `${5 + Math.random() * 90}%`;
    }
    return { top, left };
  };

  useEffect(() => {
    // Initial bubbles with staggered entry
    const initial = [0, 1].map((_, i) => {
      const pos = getPeripheralPos();
      return {
        id: Math.random() + i,
        iconIndex: Math.floor(Math.random() * bubbleIcons.length),
        ...pos,
      };
    });
    setBubbles(initial);

    const interval = setInterval(() => {
      setBubbles(prev => {
        const pos = getPeripheralPos();
        const next = [...prev];
        next.shift();
        next.push({
          id: Math.random(),
          iconIndex: Math.floor(Math.random() * bubbleIcons.length),
          ...pos,
        });
        return next;
      });
    }, 3000); // Faster cycle: 3s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
      <AnimatePresence>
        {bubbles.map((b) => {
          const Icon = bubbleIcons[b.iconIndex];
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.2, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 1.5, ease: "backOut" }}
              style={{ top: b.top, left: b.left }}
              className="p-4 glass rounded-[2rem] text-blue-400/60 absolute border border-white/5"
            >
              <Icon className="w-6 h-6" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

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
      className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 border ${
        copied 
          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
          : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
      }`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

// ── Main Page ───────────────────────────────────────────

export default function Home() {
  const [activeClient, setActiveClient] = useState("antigravity");
  const active = clients.find((c) => c.id === activeClient) ?? clients[0];

  return (
    <main className="min-h-screen relative selection:bg-blue-500/30 selection:text-white overflow-x-hidden">
      
      {/* ── Navbar ──────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex justify-center">
        <div className="glass px-6 py-2.5 rounded-full flex items-center gap-8 border border-white/10 shadow-lg">
          <a href="#" className="text-sm font-semibold hover:text-blue-400 transition-colors">Home</a>
          <a href="#install" className="text-sm font-semibold hover:text-blue-400 transition-colors">Install</a>
          <a href="#features" className="text-sm font-semibold hover:text-blue-400 transition-colors">Features</a>
          <div className="h-4 w-[1px] bg-white/10" />
          <a href="https://github.com/zero-abd/llmmcp" target="_blank" className="hover:text-white text-white/50 transition-colors">
            <Github className="w-5 h-5" />
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl aspect-square bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl space-y-8 relative z-10"
        >
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[10px] font-semibold text-blue-400 tracking-wide uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Real-Time API Docs Fix
          </div>

          <h1 className="text-4xl md:text-7xl font-bold tracking-tighter leading-[1.1] py-2">
            Stop LLM<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500 drop-shadow-sm">
              Hallucinations
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm md:text-lg text-text-muted leading-relaxed font-light">
            Providing real-time documentation retrieval for OpenAI, Anthropic, and Gemini.<br />
            Ensure technical accuracy through verified API reference synchronization.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#install"
              className="group h-12 px-8 flex items-center justify-center gap-2 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all hover:scale-[1.05] active:scale-95 shadow-xl"
            >
              Start Building
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://github.com/zero-abd/llmmcp"
              target="_blank"
              className="h-12 px-8 flex items-center justify-center gap-2 glass border border-white/10 font-semibold rounded-full hover:bg-white/5 transition-all"
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
          </div>
        </motion.div>

        {/* Decorative elements - Dynamic Randomized Bubbles */}
        <RandomBubbles />

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20"
        >
          <div className="w-6 h-10 border-2 border-white/10 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── Install Guide ────────────────────────────── */}
      <section id="install" className="py-24 px-6 relative bg-gradient-to-b from-transparent to-black/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Add to your workspace</h2>
            <p className="text-text-muted font-light max-w-xl mx-auto text-lg">
              Get official documentation for the latest <span className="text-white font-medium">OpenAI, Gemini, and Claude</span> models. Search for <span className="text-blue-400 font-bold">llmmcp</span> in the <span className="text-white font-medium">MCP Store</span>.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
            {/* Sidebar Selectors */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveClient(c.id)}
                  className={`flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 text-left group ${
                    activeClient === c.id 
                      ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]" 
                      : "glass border-white/5 hover:border-white/20"
                  }`}
                >
                  <span className={`text-4xl transition-all ${activeClient === c.id ? "scale-110" : "grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100"}`}>
                    {c.icon}
                  </span>
                  <div>
                    <h4 className={`font-bold text-lg transition-colors ${activeClient === c.id ? "text-blue-400" : "text-white"}`}>{c.name}</h4>
                    <p className="text-xs text-text-muted font-light">{c.description}</p>
                  </div>
                  {activeClient === c.id && (
                    <motion.div layoutId="active-arrow">
                      <ChevronRight className="w-5 h-5 ml-auto text-blue-400" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            {/* Config View */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="glass-card rounded-[3rem] overflow-hidden flex flex-col border border-white/10 shadow-2xl"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                      {active.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{active.name} Config</h3>
                      <p className="text-xs text-text-muted font-mono bg-white/5 px-2 py-1 rounded inline-block mt-1">{active.filePath}</p>
                    </div>
                  </div>
                  <a 
                    href={active.docsUrl} 
                    target="_blank" 
                    className="p-3 glass border border-white/10 rounded-2xl hover:text-blue-400 transition-all hover:scale-110 shadow-lg"
                  >
                    <ExternalLink className="w-6 h-6" />
                  </a>
                </div>

                <div className="relative flex-1 bg-black/60">
                  <CopyButton text={active.config} />
                  <pre className="p-10 overflow-x-auto text-base leading-relaxed font-mono">
                    <code className="text-blue-300/90">{active.config}</code>
                  </pre>
                </div>

                <div className="p-5 bg-white/5 text-[11px] uppercase font-bold tracking-[0.3em] text-center text-blue-400/60 flex items-center justify-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Paste into {active.filePath} &amp; restart
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" className="py-24 px-6 relative bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Up-to-Date Info",
                desc: "Always retrieve the latest model parameters and technical references directly from source documentation.",
                color: "text-amber-400",
                glow: "from-amber-400/20"
              },
              {
                icon: Database,
                title: "Deep Parameter Search",
                desc: "Verified tool use syntax, context window sizes, and rate limits matched against Pinecone index.",
                color: "text-blue-400",
                glow: "from-blue-400/20"
              },
              {
                icon: CheckCircle2,
                title: "Latest Patterns",
                desc: "Force agents to follow current best practices instead of using legacy or deprecated library versions.",
                color: "text-emerald-400",
                glow: "from-emerald-400/20"
              }
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-10 rounded-[2.5rem] border border-white/5 group relative overflow-hidden transition-all hover:shadow-[0_0_50px_rgba(59,130,246,0.1)]"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${f.glow} to-transparent blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 glass border border-white/10 ${f.color} shadow-lg`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-base text-text-muted leading-relaxed font-light">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="pt-32 pb-16 px-6 bg-black border-t border-white/5 relative overflow-hidden">
        {/* Decorative background for footer bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 bg-blue-500/10 blur-[100px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-12 text-center">
          <div className="flex items-center gap-3 scale-110">
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold tracking-tighter text-3xl">llmmcp</span>
          </div>
          
          <div className="flex flex-col gap-4">
            <p className="text-text-muted text-lg max-w-xl leading-relaxed font-light">
              Open source project building the standard for real-time AI documentation retrieval. <br />
              <span className="text-white/60 text-sm font-medium">Built for the future of agentic coding.</span>
            </p>
            <p className="text-xs text-white/30 tracking-widest uppercase mt-4">
              Cloudflare Workers &bull; Pinecone &bull; MCP SDK
            </p>
          </div>

          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            className="h-[1px] w-32 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" 
          />

          <div className="flex flex-col items-center gap-6">
            <div className="space-y-2">
              <p className="text-white/60 text-xs uppercase tracking-[0.2em] font-bold">Maintained by</p>
              <a 
                href="https://abdullahalmahmud.me" 
                target="_blank"
                className="text-2xl font-bold text-white hover:text-blue-400 transition-all block relative group"
              >
                Abdullah Al Mahmud
                <span className="absolute -bottom-2 left-0 w-full h-px bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            </div>
            
            <div className="flex items-center gap-6 mt-4">
              <a href="https://github.com/zero-abd/llmmcp" target="_blank" className="p-3 transition-all text-white/40 hover:text-white hover:scale-110 glass rounded-2xl border border-white/10 shadow-lg">
                <Github className="w-6 h-6" />
              </a>
            </div>
          </div>

          <p className="text-[11px] text-white/10 uppercase tracking-[0.4em] mt-12 font-medium">
            &copy; 2026 llmmcp &bull; All Rights Reserved
          </p>
        </div>
      </footer>
    </main>
  );
}
