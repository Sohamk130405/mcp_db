import { getDbUser } from "@/lib/getDbUser";
import { db } from "@/lib/db";
import { dbConnections } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function ChatPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  const connections = await db
    .select({
      id: dbConnections.id,
      label: dbConnections.label,
      dbType: dbConnections.dbType,
      host: dbConnections.host,
      databaseName: dbConnections.databaseName,
    })
    .from(dbConnections)
    .where(eq(dbConnections.userId, user.id));

  return <ChatInterface connections={connections} />;
}
