import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "@/db/client.js";
import { apiKeys } from "@/db/schema.js";
import { getConnections } from "@/services/connection.service.js";
import { touchApiKeyLastUsed, validateKey } from "@/services/apiKey.service.js";

function extractRawKey(req: Request): string | null {
  const authHeader = req.header("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const queryKey = req.query.key;
  if (typeof queryKey === "string" && queryKey.length > 0) {
    return queryKey;
  }

  return null;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawKey = extractRawKey(req);

    if (!rawKey) {
      res.status(401).json({ error: "Missing API key" });
      return;
    }

    const apiKey = await validateKey(rawKey);

    if (!apiKey) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    const ownedConnections = await getConnections(apiKey.userId);
    req.userId = apiKey.userId;
    req.apiKeyId = apiKey.id;
    req.apiKeyRateLimit = apiKey.rateLimit;
    req.apiKeyScopes = apiKey.scopes;
    req.userConnections = ownedConnections;

    void touchApiKeyLastUsed(apiKey.id);
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireUserKeyOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.userId || !req.apiKeyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [key] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.userId, req.userId))
      .limit(1);

    if (!key) {
      res.status(403).json({ error: "No API keys available for user" });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
