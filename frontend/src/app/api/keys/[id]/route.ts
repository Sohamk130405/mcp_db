import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/getDbUser";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)));

  return NextResponse.json({ success: true });
}
