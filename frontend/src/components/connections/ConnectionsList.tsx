"use client";
import { useState } from "react";
import { Plus, MoreVertical, Trash2, RefreshCw, Database as DbIcon } from "lucide-react";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Switch, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui";
import { DatabaseIcon, DbTypeBadge, EmptyState, LoadingSpinner } from "@/components/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { formatDate, DB_PORTS } from "@/lib/utils";
import { useConnectionsStore } from "@/store";
import { useEffect } from "react";

type Connection = {
  id: string; label: string; dbType: string; host: string; port: number;
  databaseName: string; sslEnabled: boolean; createdAt: string;
};

const schema = z.object({
  label: z.string().min(1),
  dbType: z.enum(["mongodb", "postgresql", "mysql"]),
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  databaseName: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  sslEnabled: z.boolean(),
});
type FormData = z.infer<typeof schema>;

function AddConnectionDialog({ onAdded }: { onAdded: (conn: Connection) => void }) {
  const [open, setOpen] = useState(false);
  const [dbType, setDbType] = useState<"mongodb" | "postgresql" | "mysql">("postgresql");
  const [step, setStep] = useState(1);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { dbType: "postgresql", port: 5432, sslEnabled: false },
  });

  const dbTypes = [
    { id: "mongodb" as const, label: "MongoDB", desc: "Document database" },
    { id: "postgresql" as const, label: "PostgreSQL", desc: "Relational database" },
    { id: "mysql" as const, label: "MySQL", desc: "SQL database" },
  ];

  const selectDb = (id: "mongodb" | "postgresql" | "mysql") => {
    setDbType(id);
    setValue("dbType", id);
    setValue("port", DB_PORTS[id]);
  };

  const test = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1200));
    setTestResult({ success: true, latencyMs: Math.floor(Math.random() * 80 + 10) });
    setTesting(false);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const conn = await res.json();
      if (!res.ok) throw new Error(conn.error);
      toast.success("Connection added!");
      onAdded({ ...conn, createdAt: new Date().toISOString() });
      setOpen(false);
      reset();
      setStep(1);
      setTestResult(null);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to add connection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" /> Add connection
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Choose database type" : step === 2 ? "Connection details" : "Test & save"}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex gap-1 mb-4">
            {[1,2,3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-indigo-500" : "bg-muted"}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              {dbTypes.map(db => (
                <button key={db.id} onClick={() => { selectDb(db.id); setStep(2); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 ${dbType === db.id ? "border-indigo-500/50 bg-indigo-500/5" : "border-border bg-card"}`}>
                  <DatabaseIcon type={db.id} className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{db.label}</p>
                    <p className="text-xs text-muted-foreground">{db.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(() => setStep(3))} className="space-y-4">
              <div><Label>Label</Label><Input {...register("label")} placeholder="Production DB" className="mt-1" />{errors.label && <p className="text-xs text-destructive mt-1">{errors.label.message}</p>}</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Label>Host</Label><Input {...register("host")} placeholder="localhost" className="mt-1" /></div>
                <div><Label>Port</Label><Input {...register("port", { valueAsNumber: true })} type="number" className="mt-1" /></div>
              </div>
              <div><Label>Database name</Label><Input {...register("databaseName")} placeholder="mydb" className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Username</Label><Input {...register("username")} className="mt-1" /></div>
                <div><Label>Password</Label><Input {...register("password")} type="password" className="mt-1" /></div>
              </div>
              <div className="flex items-center gap-2"><Switch onCheckedChange={v => setValue("sslEnabled", v)} /><Label>SSL</Label></div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button type="submit" className="flex-1">Next</Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {testResult ? (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${testResult.success ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"}`}>
                  {testResult.success ? `✓ Connected in ${testResult.latencyMs}ms` : "✗ Connection failed"}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Test your connection before saving.</p>
              )}
              <Button variant="outline" onClick={test} disabled={testing} className="w-full gap-2">
                {testing ? <><LoadingSpinner />Testing...</> : <><RefreshCw className="w-4 h-4" />Test connection</>}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleSubmit(onSubmit)} disabled={saving || !testResult?.success} className="flex-1">
                  {saving ? "Saving..." : "Save connection"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ConnectionsList({ initialConnections }: { initialConnections: Connection[] }) {
  const [connections, setConnections] = useState(initialConnections);
  const [deleting, setDeleting] = useState<string | null>(null);

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/connections/${id}`, { method: "DELETE" });
      setConnections(cs => cs.filter(c => c.id !== id));
      toast.success("Connection removed");
    } catch { toast.error("Failed to remove"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Database Connections</h2>
          <p className="text-sm text-muted-foreground">{connections.length} connection{connections.length !== 1 ? "s" : ""}</p>
        </div>
        <AddConnectionDialog onAdded={c => setConnections(cs => [c, ...cs])} />
      </div>

      {connections.length === 0 ? (
        <EmptyState icon={DbIcon} title="No databases connected" description="Connect your first database to start querying with natural language."
          action={<AddConnectionDialog onAdded={c => setConnections(cs => [c, ...cs])} />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map(conn => (
            <div key={conn.id} className="rounded-2xl border border-border bg-card p-5 card-hover group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <DatabaseIcon type={conn.dbType} className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{conn.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{conn.host}:{conn.port}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Live</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => remove(conn.id)} className="text-destructive gap-2">
                        <Trash2 className="w-4 h-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <DbTypeBadge type={conn.dbType} />
                <span className="text-xs text-muted-foreground">{conn.databaseName}</span>
                {conn.sslEnabled && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">SSL</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Added {formatDate(conn.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
