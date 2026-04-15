import { randomUUID } from "node:crypto";
import { query } from "../client.js";
import { buildAuditHash } from "../../compliance/audit.js";

export const appendAuditLog = async (actor: string, action: string, resource: string, payload: Record<string, unknown>) => {
  const prev = await query<{ hash: string }>("SELECT hash FROM audit_logs ORDER BY created_at DESC LIMIT 1");
  const prevHash = prev.rows[0]?.hash ?? "GENESIS";
  const timestamp = new Date().toISOString();
  const hash = buildAuditHash({ actor, action, resource, payload, timestamp, prevHash });

  await query(
    "INSERT INTO audit_logs (id, actor, action, resource, payload, prev_hash, hash) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [randomUUID(), actor, action, resource, JSON.stringify(payload), prevHash, hash]
  );

  return hash;
};
