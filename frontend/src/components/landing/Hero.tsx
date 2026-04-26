"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { GradientText } from "@/components/shared";
import { motion } from "framer-motion";

const DEMO_LINES = [
  { role: "user", text: "Show me all users who signed up last week" },
  { role: "ai", text: "Found 247 users. Here's the breakdown by day:" },
  { role: "table", data: [["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],["38","41","35","52","44","21","16"]] },
  { role: "user", text: "Which users have never logged in?" },
  { role: "ai", text: "Running query on your users table... Found 12 inactive accounts since signup." },
];

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVisibleLines((v) => (v < DEMO_LINES.length ? v + 1 : v));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-zinc-950/80 overflow-hidden shadow-2xl shadow-indigo-500/10">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-zinc-900/50">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs text-muted-foreground font-mono">DBTalk Chat</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-mono">Connected · PostgreSQL</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="p-4 space-y-3 min-h-[220px] font-mono text-sm">
        {DEMO_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`flex ${line.role === "user" ? "justify-end" : "justify-start"}`}>
            {line.role === "table" ? (
              <div className="w-full overflow-auto rounded-lg border border-border bg-zinc-900/50 text-xs">
                <table className="w-full">
                  <thead>
                    <tr>
                      {(line.data as string[][])[0].map((h, j) => (
                        <th key={j} className="px-3 py-1.5 text-left text-indigo-400 border-b border-border font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {(line.data as string[][])[1].map((v, j) => (
                        <td key={j} className="px-3 py-1.5 text-zinc-300">{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : line.role === "user" ? (
              <div className="max-w-[80%] px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs">
                {line.text}
              </div>
            ) : (
              <div className="max-w-[80%] px-3 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs">
                <span className="text-indigo-400 font-medium">DBTalk · </span>
                {line.text}
              </div>
            )}
          </div>
        ))}
        {visibleLines > 0 && visibleLines < DEMO_LINES.length && (
          <div className="flex gap-1 pl-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Animated mesh background */}
      <div className="absolute inset-0 mesh-bg" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Powered by MCP Protocol + Groq AI
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6"
        >
          Talk to your
          <br />
          <GradientText>databases.</GradientText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Connect MongoDB, PostgreSQL, or MySQL. Ask questions in plain English. Get answers
          in milliseconds — powered by AI and the Model Context Protocol.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
        >
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 px-8 shadow-lg shadow-indigo-500/25">
              Start for free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="gap-2">
            <Play className="w-4 h-4" />
            View demo
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xs text-muted-foreground mb-16"
        >
          No credit card required · 5 minutes to connect · 3 databases supported
        </motion.p>

        {/* Demo terminal */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <TerminalDemo />
        </motion.div>
      </div>
    </section>
  );
}
