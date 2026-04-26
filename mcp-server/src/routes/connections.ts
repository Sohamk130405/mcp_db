import { Router } from "express";
import { z } from "zod";

import { getMongoClient } from "@/connectors/mongo.js";
import { getMysqlPool } from "@/connectors/mysql.js";
import { getPgPool } from "@/connectors/postgres.js";
import { authMiddleware } from "@/middleware/auth.js";
import { rateLimiter } from "@/middleware/rateLimiter.js";
import {
  createConnection,
  deleteConnection,
  getConnections,
  type ConnectionInput,
} from "@/services/connection.service.js";
import type { DbConnection, DbType } from "@/types/mcp.js";

const connectionSchema = z.object({
  label: z.string().min(1),
  dbType: z.enum(["mongodb", "postgresql", "mysql"]),
  host: z.string().min(1),
  port: z.number().int().positive(),
  databaseName: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  sslEnabled: z.boolean().optional(),
});

function sanitizeConnection(connection: DbConnection) {
  const { credentialsEncrypted: _ignoredEncrypted, credentials: _ignoredCredentials, ...rest } = connection;
  return rest;
}

async function testConnection(connection: DbConnection): Promise<void> {
  switch (connection.dbType) {
    case "mongodb": {
      const client = await getMongoClient(connection);
      await client.db(connection.databaseName).command({ ping: 1 });
      return;
    }
    case "postgresql": {
      const pool = await getPgPool(connection);
      await pool.query("SELECT 1");
      return;
    }
    case "mysql": {
      const pool = await getMysqlPool(connection);
      await pool.query("SELECT 1");
      return;
    }
    default: {
      const unsupportedType: never = connection.dbType;
      throw new Error(`Unsupported database type: ${unsupportedType}`);
    }
  }
}

export const connectionsRouter = Router();

connectionsRouter.use(authMiddleware, rateLimiter);

connectionsRouter.post("/", async (req, res, next) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const payload: ConnectionInput = connectionSchema.parse(req.body);
    const created = await createConnection(req.userId, payload);

    res.status(201).json({ connection: sanitizeConnection(created) });
  } catch (error) {
    next(error);
  }
});

connectionsRouter.get("/", async (req, res, next) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const connections = await getConnections(req.userId);
    res.json({ connections: connections.map(sanitizeConnection) });
  } catch (error) {
    next(error);
  }
});

connectionsRouter.delete("/:id", async (req, res, next) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const deleted = await deleteConnection(req.params.id, req.userId);

    if (!deleted) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

connectionsRouter.post("/:id/test", async (req, res, next) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const connections = await getConnections(req.userId);
    const connection = connections.find((item) => item.id === req.params.id);

    if (!connection) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }

    const startedAt = Date.now();

    try {
      await testConnection(connection);
      res.json({ success: true, latencyMs: Date.now() - startedAt });
    } catch (error) {
      res.status(400).json({
        success: false,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    next(error);
  }
});
