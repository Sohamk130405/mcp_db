import { z } from "zod";

import {
  beginPgTransaction,
  commitPgTransaction,
  listPgTransactions,
  rollbackPgTransaction,
  runPgQuery,
  runPgTransactionQuery,
} from "@/connectors/postgres.js";
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

type PendingHumanDecision = {
  earliestResolutionAt: number;
};

const pgPendingHumanDecisions = new Map<string, PendingHumanDecision>();
const HUMAN_DECISION_PAUSE_MS = 1500;

function getPgConnection(connectionId: string) {
  const context = getToolContext();
  const connection = context.userConnections.find(
    (item) => item.id === connectionId && item.dbType === "postgresql",
  );

  if (!connection) {
    throw new Error("PostgreSQL connection not found");
  }

  return { context, connection };
}

function markPgPendingHumanDecision(transactionId: string) {
  pgPendingHumanDecisions.set(transactionId, {
    earliestResolutionAt: Date.now() + HUMAN_DECISION_PAUSE_MS,
  });
}

function assertPgHumanDecisionReady(transactionId: string, action: "commit" | "rollback") {
  const pending = pgPendingHumanDecisions.get(transactionId);

  if (!pending) {
    throw new Error(
      `Cannot ${action}: this transaction has no pending reviewed write. Run the write in a transaction, show the result to the user, then ask them to reply commit or rollback.`,
    );
  }

  if (Date.now() < pending.earliestResolutionAt) {
    throw new Error(
      `Cannot ${action} yet. Wait for the user's explicit next-message approval before resolving this transaction.`,
    );
  }
}

export function registerPostgresTools(server: McpServerLike): void {
  server.tool(
    "pg_begin_transaction",
    "Starts a PostgreSQL transaction for safe write operations. After running writes, summarize the changes and wait for the user's next message before committing or rolling back.",
    {
      connectionId: z.string().uuid(),
      reason: z.string().nullable().optional(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z.object({ connectionId: z.string().uuid(), reason: z.string().nullable().optional() }).parse(args);
      const { context, connection } = getPgConnection(parsed.connectionId);

      try {
        if (!context.apiKeyScopes.includes("write")) {
          throw new Error("This API key does not have write scope");
        }

        const transactionId = await beginPgTransaction(connection, context.sessionId, context.userId);
        await logToolCall(context.userId, "pg_begin_transaction", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({
          transactionId,
          connectionId: connection.id,
          reason: parsed.reason ?? null,
          guidance:
            "Use this transactionId for the requested write queries only. After writes, show the result to the user and ask them to reply commit or rollback. Do not commit in the same assistant turn.",
        });
      } catch (error) {
        await logToolCall(
          context.userId,
          "pg_begin_transaction",
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
    "pg_list_transactions",
    "Lists active PostgreSQL transactions for the current chat session.",
    {
      connectionId: z.string().uuid().optional(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z.object({ connectionId: z.string().uuid().optional() }).parse(args);
      const context = getToolContext();

      try {
        const transactions = listPgTransactions(context.sessionId, context.userId, parsed.connectionId);
        await logToolCall(context.userId, "pg_list_transactions", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ transactions });
      } catch (error) {
        await logToolCall(
          context.userId,
          "pg_list_transactions",
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
    "pg_list_connections",
    "Lists PostgreSQL connections available to the current user",
    {},
    async () => {
      const startedAt = Date.now();
      const context = getToolContext();

      try {
        const connections = context.userConnections
          .filter((item) => item.dbType === "postgresql")
          .map((item) => ({
            id: item.id,
            label: item.label,
            databaseName: item.databaseName,
          }));

        await logToolCall(context.userId, "pg_list_connections", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ connections });
      } catch (error) {
        await logToolCall(
          context.userId,
          "pg_list_connections",
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
    "pg_tables",
    "Lists public PostgreSQL tables",
    {
      connectionId: z.string().uuid(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z.object({ connectionId: z.string().uuid() }).parse(args);
      const { context, connection } = getPgConnection(parsed.connectionId);

      try {
        const result = await runPgQuery(
          connection,
          "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name ASC",
          ["public"],
        );

        await logToolCall(context.userId, "pg_tables", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ tables: result.rows });
      } catch (error) {
        await logToolCall(
          context.userId,
          "pg_tables",
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
    "pg_describe_table",
    "Describes PostgreSQL table columns",
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
      const { context, connection } = getPgConnection(parsed.connectionId);

      try {
        const result = await runPgQuery(
          connection,
          `SELECT column_name, data_type, is_nullable
           FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2
           ORDER BY ordinal_position ASC`,
          ["public", parsed.tableName],
        );

        await logToolCall(context.userId, "pg_describe_table", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ columns: result.rows });
      } catch (error) {
        await logToolCall(
          context.userId,
          "pg_describe_table",
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
    "pg_query",
    "Runs a PostgreSQL query. Write queries require write scope, explicit user confirmation, and an active transaction. After a successful write, report the result and wait for the user's next message before commit or rollback.",
    {
      connectionId: z.string().uuid(),
      sql: z.string().min(1),
      params: z.array(z.unknown()).nullable().optional(),
      confirmWrite: z.boolean().nullable().optional(),
      confirmationNote: z.string().nullable().optional(),
      transactionId: z.string().uuid().nullable().optional(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z
        .object({
          connectionId: z.string().uuid(),
          sql: z.string().min(1),
          params: z.array(z.unknown()).nullable().optional(),
          confirmWrite: z.boolean().nullable().optional(),
          confirmationNote: z.string().nullable().optional(),
          transactionId: z.string().uuid().nullable().optional(),
        })
        .parse(args);
      const { context, connection } = getPgConnection(parsed.connectionId);

      try {
        const isWrite = isWriteQuery(parsed.sql);

        if (isWrite) {
          if (!context.apiKeyScopes.includes("write")) {
            throw new Error("This API key does not have write scope");
          }

          if (!parsed.confirmWrite) {
            throw new Error("Write queries require explicit user confirmation via confirmWrite=true");
          }

          if (!parsed.transactionId) {
            throw new Error("Write queries require an active transactionId from pg_begin_transaction");
          }
        }

        const result = isWrite && parsed.transactionId
          ? await runPgTransactionQuery(
              parsed.transactionId,
              context.sessionId,
              context.userId,
              connection.id,
              parsed.sql,
              parsed.params ?? [],
            )
          : await runPgQuery(connection, parsed.sql, parsed.params ?? [], context.apiKeyScopes);
        if (isWrite && parsed.transactionId) {
          markPgPendingHumanDecision(parsed.transactionId);
        }

        await logToolCall(context.userId, "pg_query", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({
          rows: result.rows,
          rowCount: result.rowCount,
          transactionId: parsed.transactionId ?? null,
          confirmationNote: parsed.confirmationNote ?? null,
          pendingHumanDecision:
            isWrite && parsed.transactionId
              ? {
                  required: true,
                  instruction:
                    "Stop now. Summarize these uncommitted changes and ask the user to reply commit or rollback. Do not call pg_commit_transaction or pg_rollback_transaction until the user answers.",
                }
              : null,
        });
      } catch (error) {
        await logToolCall(
          context.userId,
          "pg_query",
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
    "pg_commit_transaction",
    "Commits an active PostgreSQL transaction only after the user has reviewed the uncommitted write result and explicitly replied to commit in a later message.",
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
      const { context, connection } = getPgConnection(parsed.connectionId);

      try {
        if (!parsed.confirmCommit) {
          throw new Error("Commit requires explicit user confirmation via confirmCommit=true");
        }

        assertPgHumanDecisionReady(parsed.transactionId, "commit");
        await commitPgTransaction(parsed.transactionId, context.sessionId, context.userId, connection.id);
        pgPendingHumanDecisions.delete(parsed.transactionId);
        await logToolCall(context.userId, "pg_commit_transaction", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ committed: true, transactionId: parsed.transactionId });
      } catch (error) {
        await logToolCall(
          context.userId,
          "pg_commit_transaction",
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
    "pg_rollback_transaction",
    "Rolls back an active PostgreSQL transaction after the user reviews the uncommitted write result and explicitly chooses rollback.",
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
      const { context, connection } = getPgConnection(parsed.connectionId);

      try {
        if (!parsed.confirmRollback) {
          throw new Error("Rollback requires explicit user confirmation via confirmRollback=true");
        }

        assertPgHumanDecisionReady(parsed.transactionId, "rollback");
        await rollbackPgTransaction(parsed.transactionId, context.sessionId, context.userId, connection.id);
        pgPendingHumanDecisions.delete(parsed.transactionId);
        await logToolCall(context.userId, "pg_rollback_transaction", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ rolledBack: true, transactionId: parsed.transactionId });
      } catch (error) {
        await logToolCall(
          context.userId,
          "pg_rollback_transaction",
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
