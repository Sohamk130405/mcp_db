"use client";
import { useState } from "react";
import { Plus, Copy, Check, Trash2, Key as KeyIcon, AlertTriangle, Eye } from "lucide-react";
import { Button, Input, Label, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger, Slider } from "@/components/ui";
import { EmptyState, LoadingSpinner } from "@/components/shared";
import { toast } from "sonner";
import { formatDate, formatRelativeTime } from "@/lib/utils";

type ApiKey = {
  id: string; name: string; keyPrefix: string; scopes: string[];
  rateLimit: number; lastUsedAt: string | null; revokedAt: string | null; createdAt: string;
};

function KeyRevealModal({ rawKey, onClose }: { rawKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([`MCP_API_KEY=${rawKey}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = ".env.dbtalk"; a.click();
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-400" /> Your API key
          </DialogTitle>
        </DialogHeader>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-400">This key will not be shown again. Save it somewhere secure now.</p>
        </div>
        <div className="rounded-xl bg-zinc-950/80 border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2 font-mono">API Key</p>
          <code className="text-sm font-mono text-emerald-400 break-all">{rawKey}</code>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={download} className="flex-1">Download .env</Button>
          <Button onClick={copy} className="flex-1 gap-2">
            {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy key</>}
          </Button>
        </div>
        <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">I've saved my key</Button>
      </DialogContent>
    </Dialog>
  );
}

function CreateKeyDialog({ onCreated }: { onCreated: (key: ApiKey) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState(["read"]);
  const [rateLimit, setRateLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scopes, rateLimit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRawKey(data.rawKey);
      onCreated({
        id: data.id, name, keyPrefix: data.keyPrefix, scopes, rateLimit,
        lastUsedAt: null, revokedAt: null, createdAt: new Date().toISOString(),
      });
    } catch (e: unknown) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  const toggleScope = (s: string) => setScopes(sc => sc.includes(s) ? sc.filter(x => x !== s) : [...sc, s]);

  if (rawKey) return <KeyRevealModal rawKey={rawKey} onClose={() => { setRawKey(null); setOpen(false); setName(""); setScopes(["read"]); }} />;

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" />Create key</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create API key</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Key name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Claude Desktop, My app..." className="mt-1" /></div>
            <div>
              <Label className="mb-2 block">Scopes</Label>
              <div className="grid grid-cols-2 gap-3">
                {[{ id: "read", label: "Read", desc: "SELECT only" }, { id: "write", label: "Write", desc: "Mutations allowed" }].map(s => (
                  <button key={s.id} onClick={() => toggleScope(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${scopes.includes(s.id) ? "border-indigo-500/50 bg-indigo-500/10" : "border-border bg-card hover:bg-muted/50"}`}>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </button>
                ))}
              </div>
              {scopes.includes("write") && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Write scope allows data mutations.</p>
              )}
            </div>
            <div>
              <Label className="mb-2 block">Rate limit: {rateLimit} req/min</Label>
              <Slider value={[rateLimit]} onValueChange={([v]) => setRateLimit(v)} min={10} max={1000} step={10} />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={create} disabled={loading} className="flex-1 gap-2">
              {loading ? <LoadingSpinner /> : null}{loading ? "Creating..." : "Create key"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ApiKeysList({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys.filter(k => !k.revokedAt));
  const [revoking, setRevoking] = useState<string | null>(null);

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      await fetch(`/api/keys/${id}`, { method: "DELETE" });
      setKeys(ks => ks.filter(k => k.id !== id));
      toast.success("Key revoked");
    } catch { toast.error("Failed to revoke"); }
    finally { setRevoking(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">API Keys</h2>
          <p className="text-sm text-muted-foreground">{keys.length} active key{keys.length !== 1 ? "s" : ""}</p>
        </div>
        <CreateKeyDialog onCreated={k => setKeys(ks => [k, ...ks])} />
      </div>

      <div className="rounded-xl border border-border bg-amber-500/5 border-amber-500/20 p-4 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-400/90">API keys are shown once at creation. Keep them secret — treat them like passwords.</p>
      </div>

      {keys.length === 0 ? (
        <EmptyState icon={KeyIcon} title="No API keys" description="Create an API key to authenticate with the MCP server."
          action={<CreateKeyDialog onCreated={k => setKeys(ks => [k, ...ks])} />} />
      ) : (
        <div className="space-y-3">
          {keys.map(key => (
            <div key={key.id} className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4 card-hover group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <KeyIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{key.name}</p>
                    <code className="text-xs font-mono text-muted-foreground">{key.keyPrefix}••••••••</code>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke "{key.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This will immediately invalidate the key. Any integrations using it will stop working.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => revoke(key.id)} className="bg-destructive hover:bg-destructive/90">
                          {revoking === key.id ? "Revoking..." : "Revoke key"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {key.scopes.map(s => (
                    <Badge key={s} variant={s === "write" ? "warning" : "success"}>{s}</Badge>
                  ))}
                  <span className="text-xs text-muted-foreground">{key.rateLimit} req/min</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">Last used: {formatRelativeTime(key.lastUsedAt)}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">Created {formatDate(key.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
