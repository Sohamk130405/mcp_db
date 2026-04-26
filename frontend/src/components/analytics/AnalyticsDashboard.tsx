"use client";
import { useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Activity,
  TrendingUp,
  Zap,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { StatCard } from "@/components/shared";
import { formatRelativeTime } from "@/lib/utils";

type Log = {
  id: string;
  toolName: string;
  success: boolean;
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
};

const PIE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

function generateDailyData(logs: Log[]) {
  const days: Record<
    string,
    { date: string; success: number; failed: number }
  > = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    days[key] = { date: key, success: 0, failed: 0 };
  }
  logs.forEach((l) => {
    const key = new Date(l.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (days[key]) {
      if (l.success) days[key].success++;
      else days[key].failed++;
    }
  });
  return Object.values(days);
}

export function AnalyticsDashboard({
  logs,
  stats,
  toolBreakdown,
}: {
  logs: Log[];
  stats: {
    total: number;
    successRate: number;
    avgDuration: number;
    uniqueTools: number;
  };
  toolBreakdown: { name: string; value: number }[];
}) {
  const [range] = useState("30d");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const dailyData = generateDailyData(logs);
  const filtered = logs.filter((l) =>
    l.toolName.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportCSV = () => {
    const header = "id,toolName,success,durationMs,errorMessage,createdAt\n";
    const rows = logs
      .map(
        (l) =>
          `${l.id},${l.toolName},${l.success},${l.durationMs},"${l.errorMessage ?? ""}",${l.createdAt}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dbtalk-audit.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Query usage and audit logs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Queries"
          value={stats.total}
          icon="activity"
          color="indigo"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon="trendingUp"
          color="emerald"
        />
        <StatCard
          title="Avg Duration"
          value={`${stats.avgDuration}ms`}
          icon="clock"
          color="amber"
        />
        <StatCard
          title="Unique Tools"
          value={stats.uniqueTools}
          icon="zap"
          color="rose"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-6">Queries over time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="success"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Success"
              />
              <Line
                type="monotone"
                dataKey="failed"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Failed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-6">Tool breakdown</h3>
          {toolBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={toolBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {toolBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1.5 mt-2">
            {toolBreakdown.slice(0, 4).map((t, i) => (
              <div key={t.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="flex-1 truncate text-muted-foreground font-mono">
                  {t.name}
                </span>
                <span className="font-medium">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit log table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold">Audit log</h3>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search tools..."
              className="h-8 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-40"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="gap-2"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tool
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Error
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground text-sm"
                  >
                    No audit logs yet. Start chatting to generate activity.
                  </td>
                </tr>
              ) : (
                paginated.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-indigo-400">
                        {log.toolName}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.durationMs}ms
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${
                          log.success
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {log.success ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Error
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {log.errorMessage ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * PAGE_SIZE >= filtered.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
