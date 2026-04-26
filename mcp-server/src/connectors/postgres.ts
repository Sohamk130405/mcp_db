import crypto from "node:crypto";
import { Pool, type PoolClient, type QueryResult } from "pg";

import type { DbConnection } from "@/types/mcp.js";
import { isWriteQuery } from "@/services/checkpoint.service.js";

const pgPools = new Map<string, Pool>();
const pgTransactions = new Map<
  string,
  { client: PoolClient; sessionId: string; userId: string; connectionId: string; createdAt: Date }
>();

export async function getPgPool(conn: DbConnection): Promise<Pool> {
  try {
    const cached = pgPools.get(conn.id);
    if (cached) {
      return cached;
    }

    const pool = new Pool({
      host: conn.host,
      port: conn.port,
      database: conn.databaseName,
      user: conn.credentials.username,
      password: conn.credentials.password,
      ssl: conn.sslEnabled ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });

    await pool.query("SELECT 1");
    pgPools.set(conn.id, pool);
    return pool;
  } catch (error) {
    throw new Error(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function assertSelectOnly(sql: string, scopes: string[] = ["read"]): void {
  const normalized = sql.trim().toUpperCase();
  const isSelect = normalized.startsWith("SELECT");
  const hasWriteScope = scopes.includes("write");

  if (!isSelect && !hasWriteScope) {
    throw new Error("Only SELECT queries are allowed for this connection");
  }

  if (!isSelect && !isWriteQuery(sql)) {
    throw new Error("Only SELECT, INSERT, UPDATE, and DELETE queries are supported");
  }
}

export async function runPgQuery(
  conn: DbConnection,
  sql: string,
  params: unknown[] = [],
  scopes: string[] = ["read"],
): Promise<QueryResult> {
  try {
    assertSelectOnly(sql, scopes);
    const pool = await getPgPool(conn);
    return await pool.query(sql, params);
  } catch (error) {
    throw new Error(`Failed to run PostgreSQL query: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function beginPgTransaction(
  conn: DbConnection,
  sessionId: string,
  userId: string,
): Promise<string> {
  try {
    const pool = await getPgPool(conn);
    const client = await pool.connect();
    await client.query("BEGIN");
    const transactionId = crypto.randomUUID();
    pgTransactions.set(transactionId, {
      client,
      sessionId,
      userId,
      connectionId: conn.id,
      createdAt: new Date(),
    });
    return transactionId;
  } catch (error) {
    throw new Error(`Failed to begin PostgreSQL transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function getPgTransaction(
  transactionId: string,
  sessionId: string,
  userId: string,
  connectionId: string,
): PoolClient {
  const transaction = pgTransactions.get(transactionId);
  if (!transaction) {
    throw new Error("PostgreSQL transaction not found");
  }

  if (
    transaction.sessionId !== sessionId ||
    transaction.userId !== userId ||
    transaction.connectionId !== connectionId
  ) {
    throw new Error("PostgreSQL transaction does not belong to this session");
  }

  return transaction.client;
}

export async function runPgTransactionQuery(
  transactionId: string,
  sessionId: string,
  userId: string,
  connectionId: string,
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult> {
  try {
    const client = getPgTransaction(transactionId, sessionId, userId, connectionId);
    return await client.query(sql, params);
  } catch (error) {
    throw new Error(`Failed to run PostgreSQL transaction query: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function commitPgTransaction(
  transactionId: string,
  sessionId: string,
  userId: string,
  connectionId: string,
): Promise<void> {
  const transaction = pgTransactions.get(transactionId);
  const client = getPgTransaction(transactionId, sessionId, userId, connectionId);

  try {
    await client.query("COMMIT");
  } catch (error) {
    throw new Error(`Failed to commit PostgreSQL transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
    client.release();
    if (transaction) {
      pgTransactions.delete(transactionId);
    }
  }
}

export async function rollbackPgTransaction(
  transactionId: string,
  sessionId: string,
  userId: string,
  connectionId: string,
): Promise<void> {
  const transaction = pgTransactions.get(transactionId);
  const client = getPgTransaction(transactionId, sessionId, userId, connectionId);

  try {
    await client.query("ROLLBACK");
  } catch (error) {
    throw new Error(`Failed to roll back PostgreSQL transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
    client.release();
    if (transaction) {
      pgTransactions.delete(transactionId);
    }
  }
}

export function listPgTransactions(sessionId: string, userId: string, connectionId?: string) {
  return Array.from(pgTransactions.entries())
    .filter(([, tx]) => tx.sessionId === sessionId && tx.userId === userId && (!connectionId || tx.connectionId === connectionId))
    .map(([id, tx]) => ({
      id,
      connectionId: tx.connectionId,
      createdAt: tx.createdAt,
    }));
}

export async function closeAllPgPools(): Promise<void> {
  await Promise.all(
    Array.from(pgTransactions.values()).map(async (transaction) => {
      try {
        await transaction.client.query("ROLLBACK");
      } catch {
        // Ignore shutdown errors.
      } finally {
        transaction.client.release();
      }
    }),
  );
  pgTransactions.clear();

  await Promise.all(
    Array.from(pgPools.values()).map(async (pool) => {
      try {
        await pool.end();
      } catch {
        // Ignore shutdown errors.
      }
    }),
  );
  pgPools.clear();
}
