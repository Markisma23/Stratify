import { createHash } from "node:crypto";

type AuditEntry = {
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
  payload: Record<string, unknown>;
  prevHash: string;
};

export const buildAuditHash = (entry: AuditEntry) => {
  const body = JSON.stringify(entry);
  return createHash("sha256").update(body).digest("hex");
};
