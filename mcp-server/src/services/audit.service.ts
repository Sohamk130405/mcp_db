import { db } from "@/db/client.js";
import { auditLogs } from "@/db/schema.js";

export async function logToolCall(
  userId: string,
  toolName: string,
  success: boolean,
  durationMs: number,
  keyId?: string,
  errorMessage?: string,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      keyId,
      toolName,
      success,
      durationMs,
      errorMessage,
    });
  } catch {
    // Audit logging should not break the request lifecycle.
  }
}
