import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/getDbUser";

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? "http://localhost:3001";

  const config = {
    mcpServers: {
      dbtalk: {
        command: "npx",
        args: ["-y", "@dbtalk/mcp-client"],
        env: {
          MCP_API_KEY: "paste-your-api-key-here",
          MCP_SERVER_URL,
        },
      },
    },
  };

  return new NextResponse(JSON.stringify(config, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="claude_desktop_config.json"',
    },
  });
}
