import { AsyncLocalStorage } from "node:async_hooks";

import type { DbConnectionRecord } from "@/db/schema.js";

export type DbType = "mongodb" | "postgresql" | "mysql";

export interface DecryptedCredentials {
  username: string;
  password: string;
}

export interface DbConnection extends Omit<DbConnectionRecord, "dbType"> {
  dbType: DbType;
  credentials: DecryptedCredentials;
}

export interface ToolContext {
  userId: string;
  apiKeyId: string;
  apiKeyScopes: string[];
  sessionId: string;
  userConnections: DbConnection[];
}

export const toolContextStorage = new AsyncLocalStorage<ToolContext>();

export function getToolContext(): ToolContext {
  const context = toolContextStorage.getStore();

  if (!context) {
    throw new Error("Tool context is unavailable for this request");
  }

  return context;
}
