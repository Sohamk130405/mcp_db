import crypto from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { env } from "@/config/env.js";
import { db } from "@/db/client.js";
import { apiKeys, type ApiKey } from "@/db/schema.js";

export interface CreateApiKeyResult {
  id: string;
  keyPrefix: string;
  rawKey: string;
  scopes: string[];
  rateLimit: number;
  createdAt: Date;
}

export function generateKey(): string {
  return `${env.API_KEY_PREFIX}${crypto.randomBytes(32).toString("hex")}`;
}

export function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export async function createApiKey(
  userId: string,
  name: string,
  scopes: string[] = ["read"],
  rateLimit = 100,
): Promise<CreateApiKeyResult> {
  try {
    const rawKey = generateKey();
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    const [created] = await db
      .insert(apiKeys)
      .values({
        userId,
        name,
        scopes,
        rateLimit,
        keyHash,
        keyPrefix,
      })
      .returning({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        rateLimit: apiKeys.rateLimit,
        createdAt: apiKeys.createdAt,
      });

    return {
      ...created,
      rawKey,
    };
  } catch (error) {
    throw new Error(`Failed to create API key: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function validateKey(rawKey: string): Promise<ApiKey | null> {
  try {
    const keyHash = hashKey(rawKey);
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
      .limit(1);

    return key ?? null;
  } catch (error) {
    throw new Error(`Failed to validate API key: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function revokeKey(keyId: string, userId: string): Promise<boolean> {
  try {
    const [revoked] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
      .returning({ id: apiKeys.id });

    return Boolean(revoked);
  } catch (error) {
    throw new Error(`Failed to revoke API key: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function touchApiKeyLastUsed(keyId: string): Promise<void> {
  try {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyId));
  } catch {
    // Intentionally ignored to keep auth path non-blocking.
  }
}
