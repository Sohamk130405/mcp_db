import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client.js";
import { apiKeys } from "@/db/schema.js";
import { authMiddleware } from "@/middleware/auth.js";
import { rateLimiter } from "@/middleware/rateLimiter.js";
import { createApiKey, revokeKey } from "@/services/apiKey.service.js";

const createKeySchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()).optional(),
  rateLimit: z.number().int().positive().optional(),
});

export const keysRouter = Router();

keysRouter.use(authMiddleware, rateLimiter);

keysRouter.post("/", async (req, res, next) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const payload = createKeySchema.parse(req.body);
    const result = await createApiKey(req.userId, payload.name, payload.scopes ?? ["read"], payload.rateLimit ?? 100);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

keysRouter.get("/", async (req, res, next) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        name: apiKeys.name,
        scopes: apiKeys.scopes,
        rateLimit: apiKeys.rateLimit,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, req.userId));

    res.json({ keys });
  } catch (error) {
    next(error);
  }
});

keysRouter.delete("/:id", async (req, res, next) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const revoked = await revokeKey(req.params.id, req.userId);

    if (!revoked) {
      res.status(404).json({ error: "API key not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
