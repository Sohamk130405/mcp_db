import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/getDbUser";

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const MCP_SERVER_URL = (process.env.MCP_SERVER_URL ?? "http://localhost:3001").replace(/\/$/, "");

  const config = {
    mcpServers: {
      dbtalk: {
        command: "cmd",
        args: [
          "/c",
          "npx",
          "-y",
          "mcp-remote",
          `${MCP_SERVER_URL}/mcp/sse?key=paste-your-api-key-here`,
        ],
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
