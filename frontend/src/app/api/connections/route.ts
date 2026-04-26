import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/getDbUser";
import { db } from "@/lib/db";
import { dbConnections } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

const schema = z.object({
  label: z.string().min(1),
  dbType: z.enum(["mongodb", "postgresql", "mysql"]),
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  databaseName: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  sslEnabled: z.boolean().default(false),
});

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  return NextResponse.json(connections);
}

export async function POST(req: Request) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { username, password, ...rest } = parsed.data;
  const credentialsEncrypted = encrypt(JSON.stringify({ username, password }));

  const [conn] = await db
    .insert(dbConnections)
    .values({ ...rest, userId: user.id, credentialsEncrypted })
    .returning();

  const { credentialsEncrypted: _, ...safe } = conn;
  return NextResponse.json(safe);
}
