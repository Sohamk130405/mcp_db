import crypto from "node:crypto";
import { Router } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { authMiddleware } from "@/middleware/auth.js";
import { rateLimiter } from "@/middleware/rateLimiter.js";
import { createMcpServer } from "@/mcp/server.js";
import { sseSessions } from "@/mcp/transport/sse.js";
import { toolContextStorage } from "@/types/mcp.js";

export const restRouter = Router();

restRouter.post("/", authMiddleware, rateLimiter, async (req, res, next) => {
  try {
    if (!req.userId || !req.apiKeyId || !req.userConnections) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
    const sseSession = sessionId ? sseSessions.get(sessionId) : undefined;

    if (sseSession) {
      await toolContextStorage.run(sseSession.context, async () => {
        await sseSession.transport.handlePostMessage(req, res, req.body);
      });
      return;
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    const server = createMcpServer();
    const sessionIdForContext = crypto.randomUUID();

    await toolContextStorage.run(
      {
        userId: req.userId,
        apiKeyId: req.apiKeyId,
        apiKeyScopes: req.apiKeyScopes ?? ["read"],
        sessionId: sessionIdForContext,
        userConnections: req.userConnections,
      },
      async () => {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      },
    );
  } catch (error) {
    next(error);
  }
});
