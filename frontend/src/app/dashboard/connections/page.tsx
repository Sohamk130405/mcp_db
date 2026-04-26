import { getDbUser } from "@/lib/getDbUser";
import { db } from "@/lib/db";
import { dbConnections } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ConnectionsList } from "@/components/connections/ConnectionsList";

export default async function ConnectionsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const connections = await db
    .select({
      id: dbConnections.id,
      label: dbConnections.label,
      dbType: dbConnections.dbType,
      host: dbConnections.host,
      port: dbConnections.port,
      databaseName: dbConnections.databaseName,
      sslEnabled: dbConnections.sslEnabled,
      createdAt: dbConnections.createdAt,
    })
    .from(dbConnections)
    .where(eq(dbConnections.userId, user.id));

  return (
    <ConnectionsList
      initialConnections={connections.map(c => ({ ...c, createdAt: c.createdAt.toISOString() }))}
    />
  );
}
