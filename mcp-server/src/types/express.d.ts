import type { DbConnection } from "@/types/mcp.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      apiKeyId?: string;
      apiKeyRateLimit?: number;
      apiKeyScopes?: string[];
      userConnections?: DbConnection[];
    }
  }
}

export {};
