import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";

import { env } from "@/config/env.js";
import { db } from "@/db/client.js";
import { dbConnections } from "@/db/schema.js";
import type { DbConnection, DbType, DecryptedCredentials } from "@/types/mcp.js";

const ENCRYPTION_KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");

export interface ConnectionInput {
  label: string;
  dbType: DbType;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  sslEnabled?: boolean;
}

export function encrypt(plaintext: string): string {
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
  } catch (error) {
    throw new Error(`Failed to encrypt connection credentials: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function decrypt(ciphertext: string): string {
  try {
    const payload = Buffer.from(ciphertext, "base64");
    const iv = payload.subarray(0, 12);
    const authTag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch (error) {
    throw new Error(`Failed to decrypt connection credentials: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function parseCredentials(credentialsEncrypted: string): DecryptedCredentials {
  const decrypted = decrypt(credentialsEncrypted);
  const parsed = JSON.parse(decrypted) as Partial<DecryptedCredentials>;

  if (typeof parsed.username !== "string" || typeof parsed.password !== "string") {
    throw new Error("Stored connection credentials are invalid");
  }

  return {
    username: parsed.username,
    password: parsed.password,
  };
}

function hydrateConnection(record: {
  id: string;
  userId: string;
  label: string;
  dbType: string;
  host: string;
  port: number;
  databaseName: string;
  credentialsEncrypted: string;
  sslEnabled: boolean;
  createdAt: Date;
}): DbConnection {
  return {
    ...record,
    dbType: record.dbType as DbType,
    credentials: parseCredentials(record.credentialsEncrypted),
  };
}

export async function createConnection(userId: string, data: ConnectionInput): Promise<DbConnection> {
  try {
    const credentialsEncrypted = encrypt(
      JSON.stringify({
        username: data.username,
        password: data.password,
      }),
    );

    const [created] = await db
      .insert(dbConnections)
      .values({
        userId,
        label: data.label,
        dbType: data.dbType,
        host: data.host,
        port: data.port,
        databaseName: data.databaseName,
        credentialsEncrypted,
        sslEnabled: data.sslEnabled ?? false,
      })
      .returning();

    return hydrateConnection(created);
  } catch (error) {
    throw new Error(`Failed to create connection: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function getConnections(userId: string): Promise<DbConnection[]> {
  try {
    const records = await db.select().from(dbConnections).where(eq(dbConnections.userId, userId));
    return records.map(hydrateConnection);
  } catch (error) {
    throw new Error(`Failed to fetch connections: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function deleteConnection(id: string, userId: string): Promise<boolean> {
  try {
    const [deleted] = await db
      .delete(dbConnections)
      .where(and(eq(dbConnections.id, id), eq(dbConnections.userId, userId)))
      .returning({ id: dbConnections.id });

    return Boolean(deleted);
  } catch (error) {
    throw new Error(`Failed to delete connection: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
