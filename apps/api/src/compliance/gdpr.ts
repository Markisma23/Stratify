import { randomUUID } from "node:crypto";
import { query } from "../db/client.js";

export const createGdprRequest = async (email: string, requestType: "export" | "delete", reason?: string) => {
  const id = randomUUID();
  await query(
    "INSERT INTO gdpr_requests (id, subject_email, request_type, status, reason) VALUES ($1, $2, $3, 'pending', $4)",
    [id, email, requestType, reason ?? null]
  );
  return id;
};

export const listGdprRequests = async () => {
  const result = await query<{ id: string; subject_email: string; request_type: string; status: string; created_at: string }>(
    "SELECT id, subject_email, request_type, status, created_at FROM gdpr_requests ORDER BY created_at DESC"
  );
  return result.rows;
};

export const fulfillGdprRequest = async (requestId: string, action: "export-complete" | "delete-complete", completedBy: string, evidence: object) => {
  await query("UPDATE gdpr_requests SET status = 'completed' WHERE id = $1", [requestId]);
  const fulfillmentId = randomUUID();
  await query(
    "INSERT INTO gdpr_fulfillments (id, request_id, action, evidence, completed_by) VALUES ($1, $2, $3, $4, $5)",
    [fulfillmentId, requestId, action, JSON.stringify(evidence), completedBy]
  );
  return fulfillmentId;
};
