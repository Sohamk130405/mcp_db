import { Router } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

import { authMiddleware } from "@/middleware/auth.js";
import { rateLimiter } from "@/middleware/rateLimiter.js";
import { createMcpServer } from "@/mcp/server.js";
import type { ToolContext } from "@/types/mcp.js";

export const sseSessions = new Map<
  string,
  { transport: SSEServerTransport; context: ToolContext; server: McpServer }
>();

export const sseRouter = Router();

sseRouter.get("/", authMiddleware, rateLimiter, async (req, res, next) => {
  try {
    if (!req.userId || !req.apiKeyId || !req.userConnections) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const server = createMcpServer();
    const transport = new SSEServerTransport("/mcp/message", res);
    sseSessions.set(transport.sessionId, {
      transport,
      server,
      context: {
        userId: req.userId,
        apiKeyId: req.apiKeyId,
        apiKeyScopes: req.apiKeyScopes ?? ["read"],
        sessionId: transport.sessionId,
        userConnections: req.userConnections,
      },
    });

    res.on("close", () => {
      const session = sseSessions.get(transport.sessionId);
      sseSessions.delete(transport.sessionId);
      void session?.server.close();
      void transport.close();
    });

    await server.connect(transport);
  } catch (error) {
    next(error);
  }
});
