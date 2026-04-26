"use client";
import Link from "next/link";
import {
  Database,
  Key,
  MessageSquare,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export function RecentActivity({
  logs,
}: {
  logs: {
    id: string;
    toolName: string;
    success: boolean;
    durationMs: number;
    createdAt: string;
  }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-full">
      <h3 className="font-semibold mb-4">Recent activity</h3>
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No queries yet. Start chatting!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              {log.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-mono truncate">
                  {log.toolName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {log.durationMs}ms · {formatRelativeTime(log.createdAt)}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-medium ${log.success ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
              >
                {log.success ? "OK" : "Error"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuickActions() {
  const actions = [
    {
      iconName: "database",
      icon: Database,
      label: "Add database",
      href: "/dashboard/connections",
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      iconName: "key",
      icon: Key,
      label: "Generate API key",
      href: "/dashboard/api-keys",
      color: "text-indigo-400 bg-indigo-500/10",
    },
    {
      iconName: "messageSquare",
      icon: MessageSquare,
      label: "Open chat",
      href: "/dashboard/chat",
      color: "text-violet-400 bg-violet-500/10",
    },
    {
      iconName: "download",
      icon: Download,
      label: "Download Claude config",
      href: "/api/config/download",
      color: "text-amber-400 bg-amber-500/10",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-full">
      <h3 className="font-semibold mb-4">Quick actions</h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <Link key={action.label} href={action.href}>
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.color}`}
              >
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium group-hover:text-indigo-400 transition-colors">
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
