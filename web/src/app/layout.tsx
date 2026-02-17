import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "llmmcp — Stop LLM Hallucinations",
  description:
    "Real-time API documentation for LLMs via MCP. Get accurate model versions, pricing, and parameters for Gemini, Claude, and OpenAI.",
  keywords: [
    "MCP",
    "LLM",
    "documentation",
    "hallucination",
    "Gemini",
    "Claude",
    "OpenAI",
    "AI",
    "API",
  ],
  openGraph: {
    title: "llmmcp — Stop LLM Hallucinations",
    description:
      "Real-time API documentation for LLMs via MCP. Accurate model info for Gemini, Claude, and OpenAI.",
    url: "https://llmmcp.net",
    siteName: "llmmcp",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
