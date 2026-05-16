import crypto from "node:crypto";
import mysql from "mysql2/promise";

import type { DbConnection } from "@/types/mcp.js";
import { isWriteQuery } from "@/services/checkpoint.service.js";

const mysqlPools = new Map<string, mysql.Pool>();
const mysqlTransactions = new Map<
  string,
  {
    connection: mysql.PoolConnection;
    sessionId: string;
    userId: string;
    connectionId: string;
    createdAt: Date;
  }
>();

export async function getMysqlPool(conn: DbConnection): Promise<mysql.Pool> {
  try {
    const cached = mysqlPools.get(conn.id);
    if (cached) {
      return cached;
    }

    const pool = mysql.createPool({
      host: conn.host,
      port: conn.port,
      database: conn.databaseName,
      user: conn.credentials.username,
      password: conn.credentials.password,
      ssl: conn.sslEnabled ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 20_000,
      queueLimit: 0,
    });

    await pool.query("SELECT 1");
    mysqlPools.set(conn.id, pool);
    return pool;
  } catch (error) {
    throw new Error(
      `Failed to connect to MySQL: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export function assertMysqlSelectOnly(sql: string): void {
  const normalized = sql.trim().toUpperCase();
  if (!normalized.startsWith("SELECT") && !isWriteQuery(sql)) {
    throw new Error(
      "Only SELECT, INSERT, UPDATE, and DELETE queries are supported",
    );
  }
}

export async function beginMysqlTransaction(
  conn: DbConnection,
  sessionId: string,
  userId: string,
): Promise<string> {
  try {
    const pool = await getMysqlPool(conn);
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    const transactionId = crypto.randomUUID();
    mysqlTransactions.set(transactionId, {
      connection,
      sessionId,
      userId,
      connectionId: conn.id,
      createdAt: new Date(),
    });
    return transactionId;
  } catch (error) {
    throw new Error(
      `Failed to begin MySQL transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export function getMysqlTransaction(
  transactionId: string,
  sessionId: string,
  userId: string,
  connectionId: string,
): mysql.PoolConnection {
  const transaction = mysqlTransactions.get(transactionId);
  if (!transaction) {
    throw new Error("MySQL transaction not found");
  }

  if (
    transaction.sessionId !== sessionId ||
    transaction.userId !== userId ||
    transaction.connectionId !== connectionId
  ) {
    throw new Error("MySQL transaction does not belong to this session");
  }

  return transaction.connection;
}

export async function runMysqlTransactionQuery(
  transactionId: string,
  sessionId: string,
  userId: string,
  connectionId: string,
  sql: string,
  params: unknown[] = [],
) {
  try {
    const connection = getMysqlTransaction(
      transactionId,
      sessionId,
      userId,
      connectionId,
    );
    return await connection.execute(sql, params);
  } catch (error) {
    throw new Error(
      `Failed to run MySQL transaction query: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function commitMysqlTransaction(
  transactionId: string,
  sessionId: string,
  userId: string,
  connectionId: string,
): Promise<void> {
  const transaction = mysqlTransactions.get(transactionId);
  const connection = getMysqlTransaction(
    transactionId,
    sessionId,
    userId,
    connectionId,
  );

  try {
    await connection.commit();
  } catch (error) {
    throw new Error(
      `Failed to commit MySQL transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    connection.release();
    if (transaction) {
      mysqlTransactions.delete(transactionId);
    }
  }
}

export async function rollbackMysqlTransaction(
  transactionId: string,
  sessionId: string,
  userId: string,
  connectionId: string,
): Promise<void> {
  const transaction = mysqlTransactions.get(transactionId);
  const connection = getMysqlTransaction(
    transactionId,
    sessionId,
    userId,
    connectionId,
  );

  try {
    await connection.rollback();
  } catch (error) {
    throw new Error(
      `Failed to roll back MySQL transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    connection.release();
    if (transaction) {
      mysqlTransactions.delete(transactionId);
    }
  }
}

export function listMysqlTransactions(
  sessionId: string,
  userId: string,
  connectionId?: string,
) {
  return Array.from(mysqlTransactions.entries())
    .filter(
      ([, tx]) =>
        tx.sessionId === sessionId &&
        tx.userId === userId &&
        (!connectionId || tx.connectionId === connectionId),
    )
    .map(([id, tx]) => ({
      id,
      connectionId: tx.connectionId,
      createdAt: tx.createdAt,
    }));
}

export async function closeAllMysqlPools(): Promise<void> {
  await Promise.all(
    Array.from(mysqlTransactions.values()).map(async (transaction) => {
      try {
        await transaction.connection.rollback();
      } catch {
        // Ignore shutdown errors.
      } finally {
        transaction.connection.release();
      }
    }),
  );
  mysqlTransactions.clear();

  await Promise.all(
    Array.from(mysqlPools.values()).map(async (pool) => {
      try {
        await pool.end();
      } catch {
        // Ignore shutdown errors.
      }
    }),
  );
  mysqlPools.clear();
}
