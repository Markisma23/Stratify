import { randomUUID } from "node:crypto";
import { query } from "../client.js";
import { env } from "../../config/env.js";

export const createSession = async (userId: string, userAgent: string, ipAddress: string) => {
  const existing = await query<{ id: string }>(
    "SELECT id FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC",
    [userId]
  );

  const overflow = existing.rows.slice(env.SESSION_MAX_CONCURRENT - 1);
  for (const row of overflow) {
    await query("UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1", [row.id]);
  }

  const id = randomUUID();
  await query(
    "INSERT INTO user_sessions (id, user_id, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, NOW() + interval '8 hours')",
    [id, userId, userAgent, ipAddress]
  );
  return id;
};

export const revokeSession = async (sessionId: string) => {
  await query("UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1", [sessionId]);
};
