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
  connectionId: z.string().uuid(),
  dbType: z.string().default("postgresql"),
  dbName: z.string().default("database"),
  host: z.string().default("localhost"),
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

async function createEphemeralMcpKey(userId: string) {
  const rawKey = generateKey();
  const [key] = await db
    .insert(apiKeys)
    .values({
      userId,
      name: "Built-in Chat MCP Session",
      keyHash: hashKey(rawKey),
      keyPrefix: getKeyPrefix(rawKey),
      scopes: ["read"],
      rateLimit: 300,
    })
    .returning({ id: apiKeys.id });

  return { id: key.id, rawKey };
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

export async function POST(req: Request) {
  const user = await getDbUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, connectionId, dbType, dbName, host } = parsed.data;
  const { id: apiKeyId, rawKey } = await createEphemeralMcpKey(user.id);
  const mcpServerUrl = process.env.MCP_SERVER_URL ?? "http://localhost:3001";

  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

  try {
    mcpClient = await createMCPClient({
      transport: {
        type: "sse",
        url: `${mcpServerUrl.replace(/\/$/, "")}/mcp/sse`,
        headers: {
          Authorization: `Bearer ${rawKey}`,
        },
      },
    });

    const tools = await mcpClient.tools();
    const system = `${buildSystemPrompt(dbType, dbName, host)}

Use the MCP tools directly for database work. Do not invent query results.
The selected connectionId is "${connectionId}". Pass it to database tools that require connectionId.
Prefer schema/table discovery tools before writing a query if the table structure is unclear.
Use read-only queries unless the user explicitly asks for a write operation.`;

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
                writeEvent(controller, encoder, {
                  type: "tool-call",
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  input: part.input,
                });
              }

              if (part.type === "tool-result") {
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
            await mcpClient?.close();
            await revokeEphemeralMcpKey(apiKeyId);
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
    await mcpClient?.close();
    await revokeEphemeralMcpKey(apiKeyId);
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
