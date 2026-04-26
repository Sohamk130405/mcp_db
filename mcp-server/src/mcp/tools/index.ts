import { registerMongoTools } from "@/mcp/tools/mongodb.js";
import { registerMysqlTools } from "@/mcp/tools/mysql.js";
import { registerPostgresTools } from "@/mcp/tools/postgres.js";

type ToolRegisteringServer = {
  tool: (
    name: string,
    description: string,
    schema: unknown,
    handler: (args: unknown) => Promise<unknown>,
  ) => void;
};

export function registerAllTools(server: ToolRegisteringServer): void {
  registerMongoTools(server);
  registerPostgresTools(server);
  registerMysqlTools(server);
}
