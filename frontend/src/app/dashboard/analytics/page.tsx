import { getDbUser } from "@/lib/getDbUser";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";
import { eq, desc, count, and, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [logs, totalCount] = await Promise.all([
    db.select().from(auditLogs)
      .where(eq(auditLogs.userId, user.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100),
    db.select({ count: count() }).from(auditLogs).where(eq(auditLogs.userId, user.id)),
  ]);

  const successCount = logs.filter(l => l.success).length;
  const avgDuration = logs.length
    ? Math.round(logs.reduce((sum, l) => sum + (l.durationMs ?? 0), 0) / logs.length)
    : 0;

  const toolCounts: Record<string, number> = {};
  logs.forEach(l => { toolCounts[l.toolName] = (toolCounts[l.toolName] ?? 0) + 1; });
  const toolBreakdown = Object.entries(toolCounts).map(([name, value]) => ({ name, value }));

  return (
    <AnalyticsDashboard
      logs={logs.map(l => ({
        id: l.id,
        toolName: l.toolName,
        success: l.success,
        durationMs: l.durationMs ?? 0,
        errorMessage: l.errorMessage ?? null,
        createdAt: l.createdAt.toISOString(),
      }))}
      stats={{
        total: totalCount[0]?.count ?? 0,
        successRate: logs.length ? Math.round((successCount / logs.length) * 100) : 100,
        avgDuration,
        uniqueTools: Object.keys(toolCounts).length,
      }}
      toolBreakdown={toolBreakdown}
    />
  );
}
