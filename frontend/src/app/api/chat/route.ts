import { createMCPClient } from "@ai-sdk/mcp";
import { groq } from "@ai-sdk/groq";
import { streamText, stepCountIs } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { apiKeys } from "@/lib/schema";
import { generateKey, getKeyPrefix, hashKey } from "@/lib/apiKeys";
import { getDbUser } from "@/lib/getDbUser";
import { buildSystemPrompt } from "@/lib/groq";

export const maxDuration = 60;

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  conversationId: z.string().uuid(),
  connectionId: z.string().uuid(),
  dbType: z.string().default("postgresql"),
  dbName: z.string().default("database"),
  host: z.string().default("localhost"),
  mode: z.enum(["read", "write"]).default("read"),
});

type ChatStreamEvent =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; input: unknown }
  | {
      type: "tool-result";
      toolCallId: string;
      toolName: string;
      output: unknown;
    }
  | { type: "error"; message: string };

type ChatSession = {
  apiKeyId: string;
  client: Awaited<ReturnType<typeof createMCPClient>>;
  lastUsedAt: number;
  mode: "write";
  userId: string;
};

const writeChatSessions = new Map<string, ChatSession>();
const WRITE_CHAT_SESSION_TTL_MS = 30 * 60 * 1000;

async function pruneExpiredWriteChatSessions() {
  const expiresBefore = Date.now() - WRITE_CHAT_SESSION_TTL_MS;
  const expiredConversationIds = Array.from(writeChatSessions.entries())
    .filter(([, session]) => session.lastUsedAt < expiresBefore)
    .map(([conversationId]) => conversationId);

  await Promise.all(expiredConversationIds.map(closeWriteChatSession));
}

async function createEphemeralMcpKey(userId: string, mode: "read" | "write") {
  const rawKey = generateKey();
  const scopes = mode === "write" ? ["read", "write"] : ["read"];
  const [key] = await db
    .insert(apiKeys)
    .values({
      userId,
      name: "Built-in Chat MCP Session",
      keyHash: hashKey(rawKey),
      keyPrefix: getKeyPrefix(rawKey),
      scopes,
      rateLimit: 300,
    })
    .returning({ id: apiKeys.id });

  return { id: key.id, rawKey };
}

async function closeWriteChatSession(conversationId: string) {
  const session = writeChatSessions.get(conversationId);
  if (!session) return;

  writeChatSessions.delete(conversationId);
  await session.client.close();
  await revokeEphemeralMcpKey(session.apiKeyId);
}

async function revokeEphemeralMcpKey(keyId: string) {
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}

function writeEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: ChatStreamEvent,
) {
  controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}

function hasTransactionId(input: unknown): boolean {
  return (
    typeof input === "object" &&
    input !== null &&
    "transactionId" in input &&
    typeof (input as { transactionId?: unknown }).transactionId === "string"
  );
}

export async function POST(req: Request) {
  const user = await getDbUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, conversationId, connectionId, dbType, dbName, host, mode } = parsed.data;
  let apiKeyId: string | null = null;
  const mcpServerUrl = process.env.MCP_SERVER_URL ?? "http://localhost:3001";

  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
  let keepSessionOpen = false;
  let closeSessionAfterStream = false;
  let hasTransactionActivity = false;

  try {
    await pruneExpiredWriteChatSessions();

    if (mode === "write") {
      const cached = writeChatSessions.get(conversationId);
      if (cached && cached.userId === user.id) {
        mcpClient = cached.client;
        apiKeyId = cached.apiKeyId;
        cached.lastUsedAt = Date.now();
        keepSessionOpen = true;
      } else {
        await closeWriteChatSession(conversationId);
      }
    } else {
      await closeWriteChatSession(conversationId);
    }

    if (!mcpClient) {
      const key = await createEphemeralMcpKey(user.id, mode);
      apiKeyId = key.id;
      mcpClient = await createMCPClient({
        transport: {
          type: "sse",
          url: `${mcpServerUrl.replace(/\/$/, "")}/mcp/sse`,
          headers: {
            Authorization: `Bearer ${key.rawKey}`,
          },
        },
      });

      if (mode === "write") {
        keepSessionOpen = true;
        writeChatSessions.set(conversationId, {
          apiKeyId,
          client: mcpClient,
          lastUsedAt: Date.now(),
          mode,
          userId: user.id,
        });
      }
    }

    const tools = await mcpClient.tools();
    const system = `${buildSystemPrompt(dbType, dbName, host)}

Use the MCP tools directly for database work. Do not invent query results.
The selected connectionId is "${connectionId}". Pass it to database tools that require connectionId.
Prefer schema/table discovery tools before writing a query if the table structure is unclear.
${
  mode === "write"
    ? `The user selected Read + Write mode.
Human-in-the-loop transaction rule:
- If the user asks for a write, start a transaction, perform only the requested changes inside that transaction, then show the exact result/row counts and transactionId.
- After a successful write query, stop. Do not call commit or rollback in the same assistant turn.
- Ask the user to reply with either "commit" or "rollback".
- Only call a commit or rollback tool after the user's next message explicitly chooses that action.`
    : "The user selected Read only mode. Do not perform write, update, delete, insert, schema-changing, or transaction-starting operations."
}`;

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system,
      messages,
      tools,
      stopWhen: stepCountIs(6),
      temperature: 0.3,
    });

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const part of result.fullStream) {
              if (part.type === "text-delta") {
                writeEvent(controller, encoder, {
                  type: "text",
                  text: part.text,
                });
              }

              if (part.type === "tool-call") {
                if (
                  mode === "write" &&
                  (part.toolName.includes("_begin_transaction") ||
                    part.toolName.includes("_commit_transaction") ||
                    part.toolName.includes("_rollback_transaction") ||
                    ((part.toolName === "pg_query" ||
                      part.toolName === "mysql_query") &&
                      hasTransactionId(part.input)))
                ) {
                  hasTransactionActivity = true;
                }

                writeEvent(controller, encoder, {
                  type: "tool-call",
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  input: part.input,
                });
              }

              if (part.type === "tool-result") {
                if (
                  mode === "write" &&
                  (part.toolName.includes("_commit_transaction") ||
                    part.toolName.includes("_rollback_transaction"))
                ) {
                  closeSessionAfterStream = true;
                }

                writeEvent(controller, encoder, {
                  type: "tool-result",
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  output: part.output,
                });
              }

              if (part.type === "tool-error") {
                writeEvent(controller, encoder, {
                  type: "error",
                  message:
                    part.error instanceof Error
                      ? part.error.message
                      : "Tool execution failed",
                });
              }

              if (part.type === "error") {
                writeEvent(controller, encoder, {
                  type: "error",
                  message:
                    part.error instanceof Error
                      ? part.error.message
                      : "Chat stream failed",
                });
              }
            }
          } catch (error) {
            writeEvent(controller, encoder, {
              type: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Sorry, there was an error processing your request.",
            });
          } finally {
            if (closeSessionAfterStream) {
              await closeWriteChatSession(conversationId);
            } else if (keepSessionOpen && !hasTransactionActivity) {
              await closeWriteChatSession(conversationId);
            } else if (!keepSessionOpen) {
              await mcpClient?.close();
              if (apiKeyId) {
                await revokeEphemeralMcpKey(apiKeyId);
              }
            }
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      },
    );
  } catch (error) {
    if (mode === "write") {
      await closeWriteChatSession(conversationId);
    } else {
      await mcpClient?.close();
      if (apiKeyId) {
        await revokeEphemeralMcpKey(apiKeyId);
      }
    }
    console.error("Chat API error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Sorry, there was an error processing your request.",
      },
      { status: 500 },
    );
  }
}
