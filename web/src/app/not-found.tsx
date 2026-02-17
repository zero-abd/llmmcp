"use client";

import Link from "next/link";
import { MoveLeft, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl aspect-square bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center border border-white/10 mb-8">
        <Zap className="w-8 h-8 text-blue-400" />
      </div>

      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4">404</h1>
      <p className="text-xl text-text-muted font-light mb-12 max-w-md mx-auto">
        The documentation or page you are looking for has either moved or doesn&apos;t exist.
      </p>

      <Link
        href="/"
        className="group h-12 px-8 flex items-center justify-center gap-2 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-95"
      >
        <MoveLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Safety
      </Link>
      
      <p className="mt-12 text-[10px] text-white/20 uppercase tracking-[0.3em]">
        &copy; 2026 llmmcp
      </p>
    </main>
  );
}
