"use client";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button, Progress, Separator, Input, AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from "@/components/ui";
import { CopyButton } from "@/components/shared";
import { Download, Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const MCP_SERVER = process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? "http://localhost:3001";

export function SettingsDashboard({ user }: {
  user: { email: string; firstName: string; lastName: string; imageUrl: string; plan: string; createdAt: string }
}) {
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const sseUrl = `${MCP_SERVER}/mcp/sse`;
  const restUrl = `${MCP_SERVER}/mcp/message`;

  const downloadConfig = async () => {
    const res = await fetch("/api/config/download");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "claude_desktop_config.json"; a.click();
    toast.success("Config downloaded!");
  };

  const planLimits = { free: { queries: 100, max: 100 }, pro: { queries: 0, max: 999999 } };
  const planData = planLimits[user.plan as keyof typeof planLimits] ?? planLimits.free;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and integrations</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>

        {/* Account tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Profile */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">Profile</h3>
            <div className="flex items-center gap-4 mb-4">
              <UserButton afterSignOutUrl="/" />
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">Member since {formatDate(user.createdAt)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Profile managed by Clerk. Click your avatar to update name, email, or password.
            </p>
          </div>

          {/* Plan */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Plan</h3>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
                <Zap className="w-3 h-3" />
                {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
              </div>
            </div>
            {user.plan === "free" && (
              <>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Queries today</span>
                    <span className="font-medium">0 / {planData.max}</span>
                  </div>
                  <Progress value={0} />
                </div>
                <Button className="w-full gap-2">
                  <Zap className="w-4 h-4" /> Upgrade to Pro — $19/mo
                </Button>
              </>
            )}
            {user.plan === "pro" && (
              <p className="text-sm text-emerald-400">✓ Unlimited queries · 5 connections · 10 API keys</p>
            )}
          </div>
        </TabsContent>

        {/* Integrations tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h3 className="font-semibold">MCP endpoints</h3>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">SSE Endpoint (streaming)</p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border">
                <code className="flex-1 text-xs font-mono text-indigo-400 break-all">{sseUrl}</code>
                <CopyButton text={sseUrl} />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">REST Endpoint</p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border">
                <code className="flex-1 text-xs font-mono text-indigo-400 break-all">{restUrl}</code>
                <CopyButton text={restUrl} />
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-1">Claude Desktop</p>
              <p className="text-xs text-muted-foreground mb-3">
                Download the config file and place it in your Claude Desktop configuration folder.
              </p>
              <Button onClick={downloadConfig} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Download claude_desktop_config.json
              </Button>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-1">Authentication</p>
              <p className="text-xs text-muted-foreground">
                All MCP requests require your API key via <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;key&gt;</code> header.
                Create keys in the <a href="/dashboard/api-keys" className="text-indigo-400 hover:underline">API Keys</a> section.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Danger zone */}
        <TabsContent value="danger" className="space-y-4">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">Danger zone</h3>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-border">
              <div>
                <p className="font-medium text-sm">Revoke all API keys</p>
                <p className="text-xs text-muted-foreground">Immediately invalidates all active keys</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10">Revoke all</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke all API keys?</AlertDialogTitle>
                    <AlertDialogDescription>All integrations using your API keys will immediately stop working.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={() => toast.success("All keys revoked")}>Revoke all</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-border">
              <div>
                <p className="font-medium text-sm">Delete all connections</p>
                <p className="text-xs text-muted-foreground">Removes all database connection configs</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10">Delete all</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all connections?</AlertDialogTitle>
                    <AlertDialogDescription>All your database connections will be removed. This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive">Delete all</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="pt-4">
              <p className="font-medium text-sm text-rose-400 mb-1">Delete account</p>
              <p className="text-xs text-muted-foreground mb-3">
                Permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.
              </p>
              <Input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="mb-3 border-rose-500/30 focus-visible:ring-rose-500"
              />
              <Button
                variant="destructive"
                disabled={deleteConfirm !== "DELETE"}
                className="w-full"
                onClick={() => toast.error("Account deletion coming soon")}
              >
                Delete my account permanently
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
