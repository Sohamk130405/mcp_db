import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/getDbUser";
import { db } from "@/lib/db";
import { dbConnections } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [conn] = await db
    .select()
    .from(dbConnections)
    .where(and(eq(dbConnections.id, id), eq(dbConnections.userId, user.id)));

  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const start = Date.now();
  try {
    // In a real implementation, attempt actual connection here
    // For safety in this frontend-only build, simulate a test
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
    const latencyMs = Date.now() - start;
    return NextResponse.json({ success: true, latencyMs });
  } catch (err) {
    return NextResponse.json({
      success: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Connection failed",
    });
  }
}
