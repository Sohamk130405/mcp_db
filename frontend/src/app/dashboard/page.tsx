import { getDbUser } from "@/lib/getDbUser";
import { db } from "@/lib/db";
import { dbConnections, apiKeys, auditLogs } from "@/lib/schema";
import { eq, desc, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/shared";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import {
  RecentActivity,
  QuickActions,
} from "@/components/dashboard/RecentActivity";

export default async function DashboardPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const [connections, keys, recentLogs, totalQueries] = await Promise.all([
    db.select().from(dbConnections).where(eq(dbConnections.userId, user.id)),
    db.select().from(apiKeys).where(eq(apiKeys.userId, user.id)),
    db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, user.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10),
    db
      .select({ count: count() })
      .from(auditLogs)
      .where(eq(auditLogs.userId, user.id)),
  ]);

  const activeKeys = keys.filter((k) => !k.revokedAt);
  const successRate = recentLogs.length
    ? Math.round(
        (recentLogs.filter((l) => l.success).length / recentLogs.length) * 100,
      )
    : 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Queries"
          value={totalQueries[0]?.count ?? 0}
          icon="activity"
          color="indigo"
          trend={12}
          trendLabel="vs last week"
        />
        <StatCard
          title="Connections"
          value={connections.length}
          icon="database"
          color="emerald"
        />
        <StatCard
          title="Active Keys"
          value={activeKeys.length}
          icon="key"
          color="amber"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon="trendingUp"
          color="rose"
        />
      </div>

      <DashboardCharts userId={user.id} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentActivity
            logs={recentLogs.map((l) => ({
              id: l.id,
              toolName: l.toolName,
              success: l.success,
              durationMs: l.durationMs ?? 0,
              createdAt: l.createdAt.toISOString(),
            }))}
          />
        </div>
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
