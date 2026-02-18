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

type ClientCategory = 'cursor' | 'ide' | 'agent';

type Client = {
  id: string;
  name: string;
  icon: string | any; // string for image path, component for lucide/emoji
  description: string;
  category: ClientCategory;
  filePath?: string;
  config?: string; // JSON config for IDEs
  prompt?: string; // System prompt for Agents/IDEs
  color: string;
  docsUrl: string;
};

// ── Data ────────────────────────────────────────────────

const clients: Client[] = [
  // Cursor (Top Level)
  {
    id: "cursor",
    name: "Cursor",
    icon: "/logos/cursor.png",
    description: "AI-powered code editor",
    category: "cursor",
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
  
  // AI IDEs
  {
    id: "windsurf",
    name: "Windsurf",
    icon: "",
    description: "Codeium's AI IDE",
    category: "ide",
    filePath: "~/.codeium/windsurf/mcp_config.json",
    config: `{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp@latest"]
    }
  }
}`,
    prompt: `Configure the "llmmcp" MCP server by adding the following to your MCP settings file (~/.codeium/windsurf/mcp_config.json):

{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp@latest"]
    }
  }
}

Once configured, use the "llmmcp" tool to search for real-time API documentation before generating any code.`,
    color: "#06d6a0",
    docsUrl: "https://docs.codeium.com/windsurf/mcp",
  },
  {
    id: "antigravity",
    name: "Antigravity",
    icon: "",
    description: "Google's AI-powered IDE",
    category: "ide",
    filePath: ".antigravity/mcp.json",
    config: `{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp@latest"]
    }
  }
}`,
    prompt: `Configure the "llmmcp" MCP server by adding the following to your MCP settings file (.antigravity/mcp.json):

{
  "mcpServers": {
    "llmmcp": {
      "command": "npx",
      "args": ["-y", "llmmcp@latest"]
    }
  }
}

Once configured, use the "llmmcp" tool to search for real-time API documentation before generating any code.`,
    color: "#4285F4",
    docsUrl: "https://antigravity.google/",
  },

  // Coding Agents
  {
    id: "claude-code",
    name: "Claude Code",
    icon: "💬",
    description: "Anthropic's CLI Agent",
    category: "agent",
    prompt: `Configure the "llmmcp" MCP server by running this command in your terminal:

npx -y llmmcp@latest

Once installed and running, always use the "llmmcp" tool to verify library methods and parameters before writing code. This ensures you reference correct and up-to-date documentation.`,
    color: "#c2410c",
    docsUrl: "https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview",
  },
  {
    id: "openai-agent",
    name: "OpenAI Agent",
    icon: "🤖",
    description: "OpenAI Custom GPT / Agent",
    category: "agent",
    prompt: `Configure the "llmmcp" MCP server by providing this setup command to the environment (or running it locally):

npx -y llmmcp@latest

Once configured, verify library methods and parameters using the "llmmcp" tool before writing code. This avoids hallucinations by referencing real-time documentation.`,
    color: "#10a37f",
    docsUrl: "https://platform.openai.com/docs/assistants/tools/function-calling",
  },
];

const bubbleIcons = [Terminal, Search, Cpu, Code2, Globe, Monitor, ShieldCheck, Sparkles, Command, Zap, Database];

// ── Components ──────────────────────────────────────────

function RandomBubbles() {
  const [bubbles, setBubbles] = useState<{ id: number; iconIndex: number; top: string; left: string }[]>([]);

  const getPeripheralPos = () => {
    // Avoid center 60% of vertical and horizontal space
    const isHorizontalEdge = Math.random() > 0.5;
    let top, left;

    if (isHorizontalEdge) {
      top = Math.random() > 0.5 ? `${5 + Math.random() * 15}%` : `${80 + Math.random() * 10}%`;
      left = `${5 + Math.random() * 90}%`;
    } else {
      left = Math.random() > 0.5 ? `${5 + Math.random() * 15}%` : `${80 + Math.random() * 10}%`;
      top = `${5 + Math.random() * 90}%`;
    }
    return { top, left };
  };

  useEffect(() => {
    const initial = [0, 1].map((_, i) => ({
      id: Math.random() + i,
      iconIndex: Math.floor(Math.random() * bubbleIcons.length),
      ...getPeripheralPos(),
    }));
    setBubbles(initial);

    const interval = setInterval(() => {
      setBubbles(prev => {
        const next = [...prev];
        next.shift();
        next.push({
          id: Math.random(),
          iconIndex: Math.floor(Math.random() * bubbleIcons.length),
          ...getPeripheralPos(),
        });
        return next;
      });
    }, 3000);

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

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 border text-xs font-mono font-bold uppercase tracking-wider shadow-lg ${
        copied 
          ? "bg-emerald-500 text-black border-emerald-400 scale-105" 
          : "bg-white/10 border-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:border-white/30"
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? "Copied!" : label}</span>
    </button>
  );
}

// ── Main Page ───────────────────────────────────────────

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<ClientCategory>("cursor");
  const [subSelection, setSubSelection] = useState<string | null>(null);

  // Get clients for current category
  const categoryClients = clients.filter(c => c.category === activeCategory);
  
  // Determine active client:
  // For 'cursor', it's the only one.
  // For others, it's the subSelection or the first one in the category.
  const activeClient = activeCategory === 'cursor' 
    ? categoryClients[0] 
    : (clients.find(c => c.id === subSelection) || categoryClients[0]);

  // Update sub-selection when category changes
  useEffect(() => {
    if (activeCategory !== 'cursor' && categoryClients.length > 0) {
      setSubSelection(categoryClients[0].id);
    }
  }, [activeCategory]);

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
          className="max-w-6xl space-y-8 relative z-10"
        >
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass border border-white/10 text-base font-extrabold text-blue-400 tracking-wider uppercase shadow-lg shadow-blue-500/10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            LLMMCP
          </div>

          <h1 className="text-4xl md:text-7xl font-bold tracking-tighter leading-[1.1] py-2">
            Real-time API Docs<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500 drop-shadow-sm">
              Retrieval
            </span>
          </h1>

          <p className="max-w-full mx-auto text-sm md:text-lg text-text-muted leading-relaxed font-light md:whitespace-nowrap">
            Open source project building the standard for real-time AI documentation retrieval.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#install"
              className="group h-12 px-8 flex items-center justify-center gap-2 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all hover:scale-[1.05] active:scale-95 shadow-xl"
            >
              Add MCP
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
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-[30px] h-[50px] rounded-full border-2 border-white/20 flex justify-center p-2 opacity-60">
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
              className="w-1.5 h-1.5 rounded-full bg-white mb-1"
            />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Scroll</span>
        </div>
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

          <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
            {/* Sidebar Selectors (Categories) */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 h-fit">
              {/* Cursor Option */}
              <button
                onClick={() => setActiveCategory('cursor')}
                className={`flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 text-left group ${
                  activeCategory === 'cursor'
                    ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]" 
                    : "glass border-white/5 hover:border-white/20"
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
                  <img src="/logos/cursor.png" alt="Cursor" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className={`font-bold text-lg transition-colors ${activeCategory === 'cursor' ? "text-blue-400" : "text-white"}`}>Cursor</h4>
                  <p className="text-xs text-text-muted font-light">Direct Deep Link</p>
                </div>
                {activeCategory === 'cursor' && (
                  <motion.div layoutId="active-arrow">
                    <ChevronRight className="w-5 h-5 ml-auto text-blue-400" />
                  </motion.div>
                )}
              </button>

              {/* AI IDEs Option */}
              <button
                onClick={() => setActiveCategory('ide')}
                className={`flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 text-left group ${
                  activeCategory === 'ide'
                    ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]" 
                    : "glass border-white/5 hover:border-white/20"
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center bg-black/40 rounded-xl text-3xl">
                  💻
                </div>
                <div>
                  <h4 className={`font-bold text-lg transition-colors ${activeCategory === 'ide' ? "text-blue-400" : "text-white"}`}>AI IDEs</h4>
                  <p className="text-xs text-text-muted font-light">Windsurf, Antigravity</p>
                </div>
                {activeCategory === 'ide' && (
                  <motion.div layoutId="active-arrow">
                    <ChevronRight className="w-5 h-5 ml-auto text-blue-400" />
                  </motion.div>
                )}
              </button>

              {/* Coding Agents Option */}
              <button
                onClick={() => setActiveCategory('agent')}
                className={`flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 text-left group ${
                  activeCategory === 'agent'
                    ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]" 
                    : "glass border-white/5 hover:border-white/20"
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center bg-black/40 rounded-xl text-3xl">
                  🤖
                </div>
                <div>
                  <h4 className={`font-bold text-lg transition-colors ${activeCategory === 'agent' ? "text-blue-400" : "text-white"}`}>Coding Agents</h4>
                  <p className="text-xs text-text-muted font-light">Claude Code, OpenAI</p>
                </div>
                {activeCategory === 'agent' && (
                  <motion.div layoutId="active-arrow">
                    <ChevronRight className="w-5 h-5 ml-auto text-blue-400" />
                  </motion.div>
                )}
              </button>
            </div>

            {/* Config View */}
            <div className="flex flex-col gap-6">
              {/* Sub-selection Tabs (only for IDEs and Agents) */}
              {activeCategory !== 'cursor' && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categoryClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSubSelection(c.id)}
                      className={`px-6 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
                        activeClient.id === c.id
                          ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                          : "glass border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeClient?.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card rounded-[3rem] overflow-hidden flex flex-col border border-white/10 shadow-2xl h-full"
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-3xl shadow-inner overflow-hidden relative">
                         {activeClient.id === 'cursor' ? (
                           <img src={activeClient.icon} className="w-full h-full object-cover" />
                         ) : (
                           // Default icon if none provided or for agents
                           activeClient.icon || <Code2 className="w-8 h-8 opacity-50" />
                         )}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">{activeClient.name} Config</h3>
                        {activeClient.filePath && (
                          <p className="text-xs text-text-muted font-mono bg-white/5 px-2 py-1 rounded inline-block mt-1">{activeClient.filePath}</p>
                        )}
                      </div>
                    </div>
                    <a 
                      href={activeClient.docsUrl} 
                      target="_blank" 
                      className="p-3 glass border border-white/10 rounded-2xl hover:text-blue-400 transition-all hover:scale-110 shadow-lg"
                    >
                      <ExternalLink className="w-6 h-6" />
                    </a>
                  </div>

                  <div className="relative flex-1 bg-black/60 flex flex-col">
                    
                    {/* ── Direct Connect Buttons (Cursor Only) ── */}
                    {(activeClient.id === 'cursor' || activeClient.id === 'antigravity') && activeClient.config && (
                      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
                        {activeClient.id === 'cursor' && (() => {
                          try {
                            const configObj = JSON.parse(activeClient.config!);
                            const serverConfig = configObj.mcpServers?.llmmcp || configObj.mcpServers?.["io.github.zero-abd/llmmcp"];
                            if (serverConfig) {
                              const encoded = encodeURIComponent(btoa(JSON.stringify(serverConfig)));
                              const deepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=llmmcp&config=${encoded}`;
                              return (
                                <a 
                                  href={deepLink}
                                  className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20 group"
                                >
                                  <Zap className="w-4 h-4 fill-current" />
                                  <span>Add to Cursor Directly</span>
                                </a>
                              );
                            }
                          } catch (e) { return null; }
                        })()}

                        {activeClient.id === 'antigravity' && (
                           <button 
                             disabled
                             className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-white/10 text-white/40 font-bold rounded-xl cursor-not-allowed border border-white/5"
                             title="Automated install coming soon"
                           >
                             <Zap className="w-4 h-4" />
                             <span>Add to Antigravity (Coming Soon)</span>
                           </button>
                        )}
                      </div>
                    )}

                    {/* ── JSON Config Section ── */}
                    {activeClient.config && (
                      <div className="relative border-b border-white/5">
                        <div className="absolute top-0 left-0 z-10 p-2">
                           <span className="text-[10px] uppercase font-bold text-white/20 bg-black/40 px-2 py-1 rounded backdrop-blur-md">Config JSON</span>
                        </div>
                        <CopyButton text={activeClient.config} label="Copy JSON" />
                        <pre className="p-8 pt-12 overflow-x-auto text-sm leading-relaxed font-mono">
                          <code className="text-blue-300/90">{activeClient.config}</code>
                        </pre>
                      </div>
                    )}

                    {/* ── Agent Prompt Section ── */}
                    {(activeClient.prompt || activeClient.category === 'ide') && (
                       <div className="relative flex-1 bg-white/[0.02]">
                          <div className="absolute top-0 left-0 z-10 p-2">
                             <span className="text-[10px] uppercase font-bold text-emerald-500/40 bg-black/40 px-2 py-1 rounded backdrop-blur-md">Agent Prompt</span>
                          </div>
                          
                          {activeClient.prompt ? (
                             <>
                                <CopyButton text={activeClient.prompt} label="Copy Prompt" />
                                <div className="p-8 pt-12 font-mono text-sm text-emerald-200/80 leading-relaxed whitespace-pre-wrap">
                                   {activeClient.prompt}
                                </div>
                             </>
                          ) : (
                             // Fallback prompt
                             <>
                                <CopyButton text={`Config command: npx -y llmmcp@latest`} label="Copy Prompt" />
                                <div className="p-8 pt-12 font-mono text-sm text-emerald-200/80 leading-relaxed">
                                   // Please configure llmmcp using: npx -y llmmcp@latest
                                </div>
                             </>
                          )}
                       </div>
                    )}

                  </div>

                  <div className="p-4 bg-white/5 text-[10px] uppercase font-bold tracking-[0.2em] text-center text-white/30 flex flex-col gap-1">
                    {activeClient.category === 'agent' ? (
                       <span>Copy the prompt above & paste into your agent chat</span>
                    ) : (
                       <span>Paste JSON into {activeClient.filePath} &bull; Copy Prompt for best results</span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
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
