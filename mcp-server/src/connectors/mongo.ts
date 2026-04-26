import { MongoClient } from "mongodb";

import type { DbConnection } from "@/types/mcp.js";

const mongoClients = new Map<string, MongoClient>();

export async function getMongoClient(conn: DbConnection): Promise<MongoClient> {
  try {
    const cached = mongoClients.get(conn.id);
    if (cached) {
      return cached;
    }

    const protocol = conn.sslEnabled ? "mongodb+srv" : "mongodb";
    const hasCredentials = conn.credentials.username.length > 0 || conn.credentials.password.length > 0;
    const auth = hasCredentials
      ? `${encodeURIComponent(conn.credentials.username)}:${encodeURIComponent(conn.credentials.password)}@`
      : "";
    const uri =
      protocol === "mongodb+srv"
        ? `${protocol}://${auth}${conn.host}/${conn.databaseName}?retryWrites=true&w=majority`
        : `${protocol}://${auth}${conn.host}:${conn.port}/${conn.databaseName}`;

    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      tls: conn.sslEnabled,
    });

    await client.connect();
    await client.db(conn.databaseName).command({ ping: 1 });
    mongoClients.set(conn.id, client);
    return client;
  } catch (error) {
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function closeAll(): Promise<void> {
  await Promise.all(
    Array.from(mongoClients.values()).map(async (client) => {
      try {
        await client.close();
      } catch {
        // Ignore shutdown errors.
      }
    }),
  );
  mongoClients.clear();
}
