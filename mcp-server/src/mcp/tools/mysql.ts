import { z } from "zod";

import {
  assertMysqlSelectOnly,
  beginMysqlTransaction,
  commitMysqlTransaction,
  getMysqlPool,
  listMysqlTransactions,
  rollbackMysqlTransaction,
  runMysqlTransactionQuery,
} from "@/connectors/mysql.js";
import { createJsonToolResult } from "@/mcp/tools/result.js";
import { logToolCall } from "@/services/audit.service.js";
import { isWriteQuery } from "@/services/checkpoint.service.js";
import { getToolContext } from "@/types/mcp.js";

type McpServerLike = {
  tool: (
    name: string,
    description: string,
    schema: Record<string, z.ZodTypeAny>,
    handler: (args: unknown) => Promise<unknown>,
  ) => void;
};

function getMysqlConnection(connectionId: string) {
  const context = getToolContext();
  const connection = context.userConnections.find(
    (item) => item.id === connectionId && item.dbType === "mysql",
  );

  if (!connection) {
    throw new Error("MySQL connection not found");
  }

  return { context, connection };
}

export function registerMysqlTools(server: McpServerLike): void {
  server.tool(
    "mysql_begin_transaction",
    "Starts a MySQL transaction for safe write operations within the current chat session.",
    {
      connectionId: z.string().uuid(),
      reason: z.string().optional(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z.object({ connectionId: z.string().uuid(), reason: z.string().optional() }).parse(args);
      const { context, connection } = getMysqlConnection(parsed.connectionId);

      try {
        if (!context.apiKeyScopes.includes("write")) {
          throw new Error("This API key does not have write scope");
        }

        const transactionId = await beginMysqlTransaction(connection, context.sessionId, context.userId);
        await logToolCall(context.userId, "mysql_begin_transaction", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({
          transactionId,
          connectionId: connection.id,
          reason: parsed.reason ?? null,
          guidance: "Use this transactionId for write queries, then commit or rollback in the same chat session.",
        });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mysql_begin_transaction",
          false,
          Date.now() - startedAt,
          context.apiKeyId,
          error instanceof Error ? error.message : "Unknown error",
        );
        throw error;
      }
    },
  );

  server.tool(
    "mysql_list_transactions",
    "Lists active MySQL transactions for the current chat session.",
    {
      connectionId: z.string().uuid().optional(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z.object({ connectionId: z.string().uuid().optional() }).parse(args);
      const context = getToolContext();

      try {
        const transactions = listMysqlTransactions(context.sessionId, context.userId, parsed.connectionId);
        await logToolCall(context.userId, "mysql_list_transactions", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ transactions });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mysql_list_transactions",
          false,
          Date.now() - startedAt,
          context.apiKeyId,
          error instanceof Error ? error.message : "Unknown error",
        );
        throw error;
      }
    },
  );

  server.tool(
    "mysql_list_connections",
    "Lists MySQL connections available to the current user",
    {},
    async () => {
      const startedAt = Date.now();
      const context = getToolContext();

      try {
        const connections = context.userConnections
          .filter((item) => item.dbType === "mysql")
          .map((item) => ({
            id: item.id,
            label: item.label,
            databaseName: item.databaseName,
          }));

        await logToolCall(context.userId, "mysql_list_connections", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ connections });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mysql_list_connections",
          false,
          Date.now() - startedAt,
          context.apiKeyId,
          error instanceof Error ? error.message : "Unknown error",
        );
        throw error;
      }
    },
  );

  server.tool(
    "mysql_tables",
    "Lists MySQL tables",
    {
      connectionId: z.string().uuid(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z.object({ connectionId: z.string().uuid() }).parse(args);
      const { context, connection } = getMysqlConnection(parsed.connectionId);

      try {
        const pool = await getMysqlPool(connection);
        const [rows] = await pool.query("SHOW TABLES");

        await logToolCall(context.userId, "mysql_tables", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ tables: Array.isArray(rows) ? rows : [] });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mysql_tables",
          false,
          Date.now() - startedAt,
          context.apiKeyId,
          error instanceof Error ? error.message : "Unknown error",
        );
        throw error;
      }
    },
  );

  server.tool(
    "mysql_describe_table",
    "Describes a MySQL table",
    {
      connectionId: z.string().uuid(),
      tableName: z.string().min(1),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z
        .object({
          connectionId: z.string().uuid(),
          tableName: z.string().min(1),
        })
        .parse(args);
      const { context, connection } = getMysqlConnection(parsed.connectionId);

      try {
        const pool = await getMysqlPool(connection);
        const [rows] = await pool.query("DESCRIBE ??", [parsed.tableName]);

        await logToolCall(context.userId, "mysql_describe_table", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ columns: Array.isArray(rows) ? rows : [] });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mysql_describe_table",
          false,
          Date.now() - startedAt,
          context.apiKeyId,
          error instanceof Error ? error.message : "Unknown error",
        );
        throw error;
      }
    },
  );

  server.tool(
    "mysql_query",
    "Runs a MySQL query. Write queries require write scope, explicit confirmation, and an active transaction.",
    {
      connectionId: z.string().uuid(),
      sql: z.string().min(1),
      params: z.array(z.unknown()).optional(),
      confirmWrite: z.boolean().optional(),
      confirmationNote: z.string().optional(),
      transactionId: z.string().uuid().optional(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z
        .object({
          connectionId: z.string().uuid(),
          sql: z.string().min(1),
          params: z.array(z.unknown()).optional(),
          confirmWrite: z.boolean().optional(),
          confirmationNote: z.string().optional(),
          transactionId: z.string().uuid().optional(),
        })
        .parse(args);
      const { context, connection } = getMysqlConnection(parsed.connectionId);

      try {
        assertMysqlSelectOnly(parsed.sql);
        const isWrite = isWriteQuery(parsed.sql);
        const pool = await getMysqlPool(connection);

        if (isWrite) {
          if (!context.apiKeyScopes.includes("write")) {
            throw new Error("This API key does not have write scope");
          }

          if (!parsed.confirmWrite) {
            throw new Error("Write queries require explicit user confirmation via confirmWrite=true");
          }

          if (!parsed.transactionId) {
            throw new Error("Write queries require an active transactionId from mysql_begin_transaction");
          }
        }

        const [rows] = isWrite && parsed.transactionId
          ? await runMysqlTransactionQuery(
              parsed.transactionId,
              context.sessionId,
              context.userId,
              connection.id,
              parsed.sql,
              parsed.params ?? [],
            )
          : await pool.execute(parsed.sql, parsed.params ?? []);

        await logToolCall(context.userId, "mysql_query", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({
          rows: Array.isArray(rows) ? rows : [],
          transactionId: parsed.transactionId ?? null,
          confirmationNote: parsed.confirmationNote ?? null,
        });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mysql_query",
          false,
          Date.now() - startedAt,
          context.apiKeyId,
          error instanceof Error ? error.message : "Unknown error",
        );
        throw error;
      }
    },
  );

  server.tool(
    "mysql_commit_transaction",
    "Commits an active MySQL transaction from the current chat session.",
    {
      connectionId: z.string().uuid(),
      transactionId: z.string().uuid(),
      confirmCommit: z.boolean(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z.object({
        connectionId: z.string().uuid(),
        transactionId: z.string().uuid(),
        confirmCommit: z.boolean(),
      }).parse(args);
      const { context, connection } = getMysqlConnection(parsed.connectionId);

      try {
        if (!parsed.confirmCommit) {
          throw new Error("Commit requires explicit user confirmation via confirmCommit=true");
        }

        await commitMysqlTransaction(parsed.transactionId, context.sessionId, context.userId, connection.id);
        await logToolCall(context.userId, "mysql_commit_transaction", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ committed: true, transactionId: parsed.transactionId });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mysql_commit_transaction",
          false,
          Date.now() - startedAt,
          context.apiKeyId,
          error instanceof Error ? error.message : "Unknown error",
        );
        throw error;
      }
    },
  );

  server.tool(
    "mysql_rollback_transaction",
    "Rolls back an active MySQL transaction from the current chat session.",
    {
      connectionId: z.string().uuid(),
      transactionId: z.string().uuid(),
      confirmRollback: z.boolean(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z.object({
        connectionId: z.string().uuid(),
        transactionId: z.string().uuid(),
        confirmRollback: z.boolean(),
      }).parse(args);
      const { context, connection } = getMysqlConnection(parsed.connectionId);

      try {
        if (!parsed.confirmRollback) {
          throw new Error("Rollback requires explicit user confirmation via confirmRollback=true");
        }

        await rollbackMysqlTransaction(parsed.transactionId, context.sessionId, context.userId, connection.id);
        await logToolCall(context.userId, "mysql_rollback_transaction", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ rolledBack: true, transactionId: parsed.transactionId });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mysql_rollback_transaction",
          false,
          Date.now() - startedAt,
          context.apiKeyId,
          error instanceof Error ? error.message : "Unknown error",
        );
        throw error;
      }
    },
  );
}
