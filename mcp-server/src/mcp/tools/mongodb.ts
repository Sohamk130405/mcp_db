import { z } from "zod";

import { getMongoClient } from "@/connectors/mongo.js";
import { logToolCall } from "@/services/audit.service.js";
import { createJsonToolResult } from "@/mcp/tools/result.js";
import { getToolContext } from "@/types/mcp.js";

type McpServerLike = {
  tool: (
    name: string,
    description: string,
    schema: Record<string, z.ZodTypeAny>,
    handler: (args: unknown) => Promise<unknown>,
  ) => void;
};

function getMongoConnection(connectionId: string) {
  const context = getToolContext();
  const connection = context.userConnections.find(
    (item) => item.id === connectionId && item.dbType === "mongodb",
  );

  if (!connection) {
    throw new Error("MongoDB connection not found");
  }

  return { context, connection };
}

export function registerMongoTools(server: McpServerLike): void {
  server.tool(
    "mongo_list_connections",
    "Lists MongoDB connections available to the current user",
    {},
    async () => {
      const startedAt = Date.now();
      const context = getToolContext();

      try {
        const connections = context.userConnections
          .filter((item) => item.dbType === "mongodb")
          .map((item) => ({
            id: item.id,
            label: item.label,
            databaseName: item.databaseName,
          }));

        await logToolCall(context.userId, "mongo_list_connections", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ connections });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mongo_list_connections",
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
    "mongo_collections",
    "Lists collections in a MongoDB database",
    {
      connectionId: z.string().uuid(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z.object({ connectionId: z.string().uuid() }).parse(args);
      const { context, connection } = getMongoConnection(parsed.connectionId);

      try {
        const client = await getMongoClient(connection);
        const collections = await client.db(connection.databaseName).listCollections().toArray();

        await logToolCall(context.userId, "mongo_collections", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({
          collections: collections.map((item) => item.name),
        });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mongo_collections",
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
    "mongo_find",
    "Runs a MongoDB find query",
    {
      connectionId: z.string().uuid(),
      collection: z.string().min(1),
      filter: z.record(z.unknown()).optional(),
      projection: z.record(z.unknown()).optional(),
      limit: z.number().int().positive().max(100).default(20),
      sort: z.record(z.unknown()).optional(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z
        .object({
          connectionId: z.string().uuid(),
          collection: z.string().min(1),
          filter: z.record(z.unknown()).optional(),
          projection: z.record(z.unknown()).optional(),
          limit: z.number().int().positive().max(100).default(20),
          sort: z.record(z.unknown()).optional(),
        })
        .parse(args);
      const { context, connection } = getMongoConnection(parsed.connectionId);

      try {
        const client = await getMongoClient(connection);
        const rows = await client
          .db(connection.databaseName)
          .collection(parsed.collection)
          .find(parsed.filter ?? {}, {
            projection: parsed.projection,
            sort: parsed.sort,
            limit: parsed.limit,
          })
          .toArray();

        await logToolCall(context.userId, "mongo_find", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ rows, count: rows.length });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mongo_find",
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
    "mongo_count",
    "Counts documents in a MongoDB collection",
    {
      connectionId: z.string().uuid(),
      collection: z.string().min(1),
      filter: z.record(z.unknown()).optional(),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z
        .object({
          connectionId: z.string().uuid(),
          collection: z.string().min(1),
          filter: z.record(z.unknown()).optional(),
        })
        .parse(args);
      const { context, connection } = getMongoConnection(parsed.connectionId);

      try {
        const client = await getMongoClient(connection);
        const count = await client
          .db(connection.databaseName)
          .collection(parsed.collection)
          .countDocuments(parsed.filter ?? {});

        await logToolCall(context.userId, "mongo_count", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ count });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mongo_count",
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
    "mongo_aggregate",
    "Runs a MongoDB aggregation pipeline",
    {
      connectionId: z.string().uuid(),
      collection: z.string().min(1),
      pipeline: z.array(z.record(z.unknown())),
    },
    async (args) => {
      const startedAt = Date.now();
      const parsed = z
        .object({
          connectionId: z.string().uuid(),
          collection: z.string().min(1),
          pipeline: z.array(z.record(z.unknown())),
        })
        .parse(args);
      const { context, connection } = getMongoConnection(parsed.connectionId);

      try {
        const client = await getMongoClient(connection);
        const rows = await client
          .db(connection.databaseName)
          .collection(parsed.collection)
          .aggregate(parsed.pipeline)
          .toArray();

        await logToolCall(context.userId, "mongo_aggregate", true, Date.now() - startedAt, context.apiKeyId);
        return createJsonToolResult({ rows, count: rows.length });
      } catch (error) {
        await logToolCall(
          context.userId,
          "mongo_aggregate",
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
