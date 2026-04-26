import cors from "cors";
import express from "express";
import http from "node:http";

import { env } from "@/config/env.js";
import { closeAll as closeMongoClients } from "@/connectors/mongo.js";
import { closeAllMysqlPools } from "@/connectors/mysql.js";
import { closeAllPgPools } from "@/connectors/postgres.js";
import { closePlatformDatabase } from "@/db/client.js";
import { errorHandler } from "@/middleware/errorHandler.js";
import { closeRateLimiterRedis } from "@/middleware/rateLimiter.js";
import { restRouter } from "@/mcp/transport/rest.js";
import { sseRouter } from "@/mcp/transport/sse.js";
import { apiRouter } from "@/routes/index.js";

const app = express();

app.use(
  cors({
    origin:
      env.CORS_ORIGIN === "*"
        ? true
        : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  }),
);
app.use(express.json({ limit: "1mb" }));

app.use("/api", apiRouter);
app.use("/mcp/sse", sseRouter);
app.use("/mcp/message", restRouter);

app.use(errorHandler);

const httpServer = http.createServer(app);

async function shutdown(signal: string): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    await Promise.allSettled([
      closeMongoClients(),
      closeAllPgPools(),
      closeAllMysqlPools(),
      closePlatformDatabase(),
      closeRateLimiterRedis(),
    ]);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

httpServer.listen(env.PORT, () => {
  console.log(
    `MCP server listening on port ${env.PORT} in ${env.NODE_ENV} mode`,
  );
});
