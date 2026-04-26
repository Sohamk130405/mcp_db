import { Router } from "express";

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
          command: "npx",
          args: ["-y", "@your-org/mcp-database-client"],
          env: {
            MCP_API_KEY: "<the user's raw key — prompt them to paste it>",
            MCP_SERVER_URL: "https://your-domain.com",
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
