import { and, desc, eq, isNull } from "drizzle-orm";
import type { Pool } from "pg";
import type mysql from "mysql2/promise";

import { db } from "@/db/client.js";
import { dbCheckpoints } from "@/db/schema.js";
import type { DbCheckpoint, DbConnection, DbType } from "@/types/mcp.js";

export type SqlOperation = "insert" | "update" | "delete" | "unknown";

function quotePostgresIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

function quoteMysqlIdentifier(identifier: string): string {
  return `\`${identifier.replace(/`/g, "``")}\``;
}

function inferWriteOperation(sql: string): SqlOperation {
  const normalized = sql.trim().toUpperCase();

  if (normalized.startsWith("INSERT")) {
    return "insert";
  }

  if (normalized.startsWith("UPDATE")) {
    return "update";
  }

  if (normalized.startsWith("DELETE")) {
    return "delete";
  }

  return "unknown";
}

export function isWriteQuery(sql: string): boolean {
  return inferWriteOperation(sql) !== "unknown";
}

export function extractTargetTable(sql: string): string | null {
  const normalized = sql.trim();
  const patterns = [
    /^\s*INSERT\s+INTO\s+("?[\w.]+"?)/i,
    /^\s*UPDATE\s+("?[\w.]+"?)/i,
    /^\s*DELETE\s+FROM\s+("?[\w.]+"?)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/^"|"$/g, "").split(".").pop() ?? null;
    }
  }

  return null;
}

export async function createCheckpoint(params: {
  userId: string;
  connectionId: string;
  dbType: DbType;
  tableName: string;
  operation: SqlOperation;
  rows: unknown[];
  note?: string;
}): Promise<DbCheckpoint> {
  const [created] = await db
    .insert(dbCheckpoints)
    .values({
      userId: params.userId,
      connectionId: params.connectionId,
      dbType: params.dbType,
      tableName: params.tableName,
      operation: params.operation,
      snapshot: params.rows,
      note: params.note,
    })
    .returning();

  return created;
}

export async function listCheckpoints(userId: string, connectionId?: string): Promise<DbCheckpoint[]> {
  if (connectionId) {
    return db
      .select()
      .from(dbCheckpoints)
      .where(and(eq(dbCheckpoints.userId, userId), eq(dbCheckpoints.connectionId, connectionId)))
      .orderBy(desc(dbCheckpoints.createdAt));
  }

  return db
    .select()
    .from(dbCheckpoints)
    .where(eq(dbCheckpoints.userId, userId))
    .orderBy(desc(dbCheckpoints.createdAt));
}

export async function getActiveCheckpoint(checkpointId: string, userId: string): Promise<DbCheckpoint | null> {
  const [checkpoint] = await db
    .select()
    .from(dbCheckpoints)
    .where(
      and(
        eq(dbCheckpoints.id, checkpointId),
        eq(dbCheckpoints.userId, userId),
        isNull(dbCheckpoints.restoredAt),
      ),
    )
    .limit(1);

  return checkpoint ?? null;
}

export async function markCheckpointRestored(checkpointId: string): Promise<void> {
  await db.update(dbCheckpoints).set({ restoredAt: new Date() }).where(eq(dbCheckpoints.id, checkpointId));
}

export async function snapshotPostgresTable(pool: Pool, tableName: string): Promise<Record<string, unknown>[]> {
  const result = await pool.query(`SELECT * FROM ${quotePostgresIdentifier(tableName)}`);
  return result.rows;
}

export async function snapshotMysqlTable(pool: mysql.Pool, tableName: string): Promise<Record<string, unknown>[]> {
  const [rows] = await pool.query(`SELECT * FROM ${quoteMysqlIdentifier(tableName)}`);
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

export async function restorePostgresCheckpoint(pool: Pool, checkpoint: DbCheckpoint): Promise<void> {
  const rows = Array.isArray(checkpoint.snapshot) ? (checkpoint.snapshot as Record<string, unknown>[]) : [];
  const table = quotePostgresIdentifier(checkpoint.tableName);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${table}`);

    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      const columnSql = columns.map(quotePostgresIdentifier).join(", ");

      for (const row of rows) {
        const values = columns.map((column) => row[column]);
        const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
        await client.query(
          `INSERT INTO ${table} (${columnSql}) VALUES (${placeholders})`,
          values,
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function restoreMysqlCheckpoint(pool: mysql.Pool, checkpoint: DbCheckpoint): Promise<void> {
  const rows = Array.isArray(checkpoint.snapshot) ? (checkpoint.snapshot as Record<string, unknown>[]) : [];
  const table = quoteMysqlIdentifier(checkpoint.tableName);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(`DELETE FROM ${table}`);

    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      const columnSql = columns.map(quoteMysqlIdentifier).join(", ");

      for (const row of rows) {
        const values = columns.map((column) => row[column]);
        const placeholders = values.map(() => "?").join(", ");
        await connection.query(
          `INSERT INTO ${table} (${columnSql}) VALUES (${placeholders})`,
          values,
        );
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
