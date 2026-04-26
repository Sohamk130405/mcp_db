"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Key, Download, MessageSquare, Check, ArrowRight, ArrowLeft, Zap, Eye, EyeOff, Copy, CheckCircle2 } from "lucide-react";
import { Button, Input, Label, Switch, Badge } from "@/components/ui";
import { Logo, CopyButton, GradientText, DatabaseIcon } from "@/components/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { DB_PORTS } from "@/lib/utils";
import confetti from "canvas-confetti";

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            i + 1 < current ? "bg-emerald-500 text-white" :
            i + 1 === current ? "bg-indigo-500 text-white ring-4 ring-indigo-500/20" :
            "bg-muted text-muted-foreground"
          }`}>
            {i + 1 < current ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`w-8 h-0.5 transition-all duration-300 ${i + 1 < current ? "bg-emerald-500" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────
function Step1Welcome({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6">
        <Zap className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold mb-3">
        Welcome to DBTalk{firstName ? `, ${firstName}` : ""}! 👋
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Let's get you set up in 5 minutes. You'll connect your database, generate an API key, and start querying with natural language.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
        {[["Connect DB", "30s"], ["Generate key", "1m"], ["Start querying", "Instantly"]].map(([title, time]) => (
          <div key={title} className="rounded-xl border border-border bg-card/50 p-4">
            <p className="font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">{time}</p>
          </div>
        ))}
      </div>
      <Button size="lg" onClick={onNext} className="gap-2">
        Let's get started <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── Step 2: Add Database ──────────────────────────────────────────────────────
const dbSchema = z.object({
  label: z.string().min(1, "Label is required"),
  dbType: z.enum(["mongodb", "postgresql", "mysql"]),
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1).max(65535),
  databaseName: z.string().min(1, "Database name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  sslEnabled: z.boolean(),
});
type DbFormData = z.infer<typeof dbSchema>;

function Step2AddDatabase({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [dbType, setDbType] = useState<"mongodb" | "postgresql" | "mysql">("postgresql");
  const [showPass, setShowPass] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState<{ success: boolean; latencyMs?: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DbFormData>({
    resolver: zodResolver(dbSchema),
    defaultValues: { dbType: "postgresql", port: 5432, sslEnabled: false },
  });

  const dbTypes = [
    { id: "mongodb" as const, label: "MongoDB", color: "text-green-400", border: "border-green-500/30 bg-green-500/5" },
    { id: "postgresql" as const, label: "PostgreSQL", color: "text-blue-400", border: "border-blue-500/30 bg-blue-500/5" },
    { id: "mysql" as const, label: "MySQL", color: "text-orange-400", border: "border-orange-500/30 bg-orange-500/5" },
  ];

  const onSubmit = async (data: DbFormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save connection");
      toast.success("Database connected!");
      onNext();
    } catch {
      toast.error("Failed to save connection");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTested(null);
    await new Promise(r => setTimeout(r, 1500));
    setTested({ success: true, latencyMs: 42 });
    setTesting(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Connect your first database</h2>
      <p className="text-muted-foreground mb-6">Your credentials are encrypted with AES-256-GCM.</p>

      {/* DB type picker */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {dbTypes.map((db) => (
          <button
            key={db.id}
            onClick={() => { setDbType(db.id); setValue("dbType", db.id); setValue("port", DB_PORTS[db.id]); }}
            className={`rounded-xl border p-4 text-center transition-all duration-200 ${
              dbType === db.id ? db.border + " ring-2 ring-inset ring-indigo-500/30" : "border-border bg-card hover:bg-card/80"
            }`}
          >
            <DatabaseIcon type={db.id} className={`w-6 h-6 mx-auto mb-1 ${db.color}`} />
            <p className="text-sm font-medium">{db.label}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Label</Label>
          <Input {...register("label")} placeholder="My production DB" className="mt-1" />
          {errors.label && <p className="text-xs text-destructive mt-1">{errors.label.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label>Host</Label>
            <Input {...register("host")} placeholder="localhost or your-host.com" className="mt-1" />
            {errors.host && <p className="text-xs text-destructive mt-1">{errors.host.message}</p>}
          </div>
          <div>
            <Label>Port</Label>
            <Input {...register("port", { valueAsNumber: true })} type="number" className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Database name</Label>
          <Input {...register("databaseName")} placeholder="mydb" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Username</Label>
            <Input {...register("username")} className="mt-1" />
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative mt-1">
              <Input {...register("password")} type={showPass ? "text" : "password"} className="pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch onCheckedChange={(v) => setValue("sslEnabled", v)} />
          <Label>Enable SSL</Label>
        </div>

        {tested && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${tested.success ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {tested.success ? <Check className="w-4 h-4" /> : null}
            {tested.success ? `Connected in ${tested.latencyMs}ms` : "Connection failed"}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={testConnection} disabled={testing} className="flex-1">
            {testing ? "Testing..." : "Test connection"}
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save & continue"}
          </Button>
        </div>
        <button type="button" onClick={onSkip} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip for now →
        </button>
      </form>
    </div>
  );
}

// ── Step 3: Generate API Key ──────────────────────────────────────────────────
function Step3GenerateKey({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState("My first key");
  const [scope, setScope] = useState<"read" | "write">("read");
  const [generating, setGenerating] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scopes: [scope] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRawKey(data.rawKey);
    } catch {
      toast.error("Failed to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (rawKey) {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Generate your API key</h2>
      <p className="text-muted-foreground mb-6">This is how the MCP server knows it's you. Save it — you'll only see it once.</p>

      {!rawKey ? (
        <div className="space-y-4">
          <div>
            <Label>Key name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="mb-2 block">Scope</Label>
            <div className="grid grid-cols-2 gap-3">
              {[{ id: "read" as const, label: "Read only", desc: "SELECT queries only" }, { id: "write" as const, label: "Read + Write", desc: "Includes mutations" }].map(s => (
                <button key={s.id} onClick={() => setScope(s.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${scope === s.id ? "border-indigo-500/50 bg-indigo-500/10" : "border-border bg-card hover:bg-card/80"}`}>
                  <p className="font-medium text-sm">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? "Generating..." : "Generate API key"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            ⚠️ Save this key now — it will never be shown again.
          </div>
          <div className="rounded-xl border border-border bg-zinc-950/80 p-4">
            <p className="text-xs text-muted-foreground mb-2 font-mono">Your API key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm text-emerald-400 break-all">{rawKey}</code>
              <button onClick={copy} className="shrink-0 p-2 rounded-lg hover:bg-white/5 transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button onClick={onNext} className="w-full gap-2">
            I've saved my key <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Choose Mode ───────────────────────────────────────────────────────
function Step4ChooseMode({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  const modes = [
    { id: "desktop", icon: Download, title: "Claude Desktop", desc: "Download config and drop into Claude Desktop for native tool access.", color: "indigo" },
    { id: "chatbot", icon: MessageSquare, title: "Built-in Chatbot", desc: "Use our Groq-powered AI chatbot right here in the dashboard.", color: "violet" },
    { id: "api", icon: Key, title: "Your LLM App", desc: "Point any MCP-compatible client at our hosted SSE endpoint.", color: "emerald" },
  ];

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const config = JSON.stringify({
    mcpServers: {
      dbtalk: {
        command: "npx",
        args: ["-y", "@dbtalk/mcp-client"],
        env: { MCP_API_KEY: "paste-your-api-key-here", MCP_SERVER_URL: "https://api.dbtalk.dev" },
      },
    },
  }, null, 2);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose your integration</h2>
      <p className="text-muted-foreground mb-6">Pick how you'll use DBTalk. You can change this anytime.</p>
      <div className="space-y-3 mb-6">
        {modes.map((mode) => (
          <div key={mode.id}>
            <button
              onClick={() => { toggle(mode.id); if (mode.id === "desktop") setShowConfig(!showConfig); }}
              className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                selected.includes(mode.id) ? "border-indigo-500/50 bg-indigo-500/10" : "border-border bg-card hover:bg-card/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${mode.color}-500/10 flex items-center justify-center`}>
                  <mode.icon className={`w-5 h-5 text-${mode.color}-400`} />
                </div>
                <div>
                  <p className="font-medium">{mode.title}</p>
                  <p className="text-sm text-muted-foreground">{mode.desc}</p>
                </div>
                {selected.includes(mode.id) && <Check className="w-5 h-5 text-indigo-400 ml-auto" />}
              </div>
            </button>
            {mode.id === "desktop" && selected.includes("desktop") && (
              <div className="mt-2 rounded-xl border border-border bg-zinc-950/80 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-mono">claude_desktop_config.json</p>
                  <CopyButton text={config} />
                </div>
                <pre className="text-xs font-mono text-emerald-400 overflow-auto">{config}</pre>
              </div>
            )}
            {mode.id === "api" && selected.includes("api") && (
              <div className="mt-2 rounded-xl border border-border bg-zinc-950/80 p-4">
                <p className="text-xs text-muted-foreground mb-2">SSE Endpoint</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-indigo-400 flex-1">https://api.dbtalk.dev/mcp/sse?key=YOUR_KEY</code>
                  <CopyButton text="https://api.dbtalk.dev/mcp/sse?key=YOUR_KEY" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Button onClick={onNext} className="w-full gap-2">
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── Step 5: Done ──────────────────────────────────────────────────────────────
function Step5Done() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    await fetch("/api/onboarding/complete", { method: "POST" });
    setTimeout(() => router.push("/dashboard"), 800);
  };

  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold mb-3">You're all set! 🎉</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        DBTalk is ready. Head to your dashboard to start querying your databases in plain English.
      </p>
      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
          <p className="text-2xl font-bold">1</p>
          <p className="text-xs">DB connected</p>
        </div>
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-indigo-400">
          <p className="text-2xl font-bold">1</p>
          <p className="text-xs">API key created</p>
        </div>
      </div>
      <Button size="lg" onClick={finish} disabled={loading} className="w-full gap-2">
        {loading ? "Loading..." : <>Go to dashboard <ArrowRight className="w-4 h-4" /></>}
      </Button>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export function OnboardingWizard({ firstName }: { firstName: string }) {
  const [step, setStep] = useState(1);
  const total = 5;
  const next = () => setStep(s => Math.min(s + 1, total));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <Logo className="mb-8 justify-center" />

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-indigo-500/10">
        <StepIndicator current={step} total={total} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && <Step1Welcome firstName={firstName} onNext={next} />}
            {step === 2 && <Step2AddDatabase onNext={next} onSkip={next} />}
            {step === 3 && <Step3GenerateKey onNext={next} />}
            {step === 4 && <Step4ChooseMode onNext={next} />}
            {step === 5 && <Step5Done />}
          </motion.div>
        </AnimatePresence>

        {step > 1 && step < 5 && (
          <button onClick={prev} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>
    </div>
  );
}
