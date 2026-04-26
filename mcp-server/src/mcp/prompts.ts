import { z } from "zod";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "write_safety_confirmation",
    "Safety guidance for any write, update, delete, or rollback database action",
    {
      operation: z.string().describe("The operation the model is considering"),
      target: z.string().describe("The table or database resource being modified"),
    },
    ({ operation, target }) => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `Before executing ${operation} on ${target}, explicitly reconfirm with the user. Summarize the intended change, mention that a checkpoint can be used for rollback, and do not proceed until the user clearly confirms the write action.`,
          },
        },
      ],
    }),
  );
}
