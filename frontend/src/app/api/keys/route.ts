import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/getDbUser";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateKey, hashKey, getKeyPrefix } from "@/lib/apiKeys";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()).default(["read"]),
  rateLimit: z.number().min(10).max(10000).default(100),
});

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      rateLimit: apiKeys.rateLimit,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id));

  return NextResponse.json(keys);
}

export async function POST(req: Request) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, scopes, rateLimit } = parsed.data;
  const rawKey = generateKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = getKeyPrefix(rawKey);

  const [key] = await db
    .insert(apiKeys)
    .values({ userId: user.id, name, keyHash, keyPrefix, scopes, rateLimit })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      rateLimit: apiKeys.rateLimit,
      createdAt: apiKeys.createdAt,
    });

  // Return raw key ONCE — never stored
  return NextResponse.json({ ...key, rawKey });
}
