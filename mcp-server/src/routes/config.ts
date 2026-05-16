import { Router } from "express";

import { env } from "@/config/env.js";
import { authMiddleware } from "@/middleware/auth.js";
import { rateLimiter } from "@/middleware/rateLimiter.js";

export const configRouter = Router();

configRouter.use(authMiddleware, rateLimiter);

configRouter.get("/download", async (req, res, next) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="claude_desktop_config.json"');
    res.json({
      mcpServers: {
        "my-databases": {
          command: "cmd",
          args: [
            "/c",
            "npx",
            "-y",
            "mcp-remote",
            `${env.MCP_SERVER_URL}/mcp/sse?key=paste-your-api-key-here`,
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
