import crypto from "crypto";

export function generateKey(): string {
  const prefix = process.env.API_KEY_PREFIX ?? "mcp_live_";
  return prefix + crypto.randomBytes(32).toString("hex");
}

export function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function getKeyPrefix(rawKey: string): string {
  return rawKey.substring(0, 16);
}
