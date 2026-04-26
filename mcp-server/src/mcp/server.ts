import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerPrompts } from "@/mcp/prompts.js";
import { registerAllTools } from "@/mcp/tools/index.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "database-mcp-server",
    version: "1.0.0",
  });

  registerAllTools(server);
  registerPrompts(server);
  return server;
}
