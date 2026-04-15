import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { query } from "../client.js";

export type OutboxEventType = "framework.created" | "recommendations.generated";

type OutboxRow = {
  id: string;
  event_type: OutboxEventType;
  aggregate_id: string;
  payload: Record<string, unknown>;
  attempts: number;
};

export const enqueueOutboxEvent = async (
  client: PoolClient,
  eventType: OutboxEventType,
  aggregateId: string,
  payload: Record<string, unknown>
) => {
  await client.query(
    `INSERT INTO outbox_events (id, event_type, aggregate_id, payload, status, attempts)
     VALUES ($1, $2, $3, $4::jsonb, 'pending', 0)`,
    [randomUUID(), eventType, aggregateId, JSON.stringify(payload)]
  );
};

export const claimPendingOutboxEvents = async (limit = 20) => {
  const result = await query<OutboxRow>(
    `UPDATE outbox_events
       SET status = 'processing', locked_at = NOW()
     WHERE id IN (
      SELECT id
      FROM outbox_events
      WHERE status = 'pending'
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT $1
    )
    RETURNING id, event_type, aggregate_id, payload, attempts`,
    [limit]
  );

  return result.rows;
};

export const markOutboxProcessed = async (id: string) => {
  await query("UPDATE outbox_events SET status = 'processed', processed_at = NOW() WHERE id = $1", [id]);
};

export const markOutboxFailed = async (id: string) => {
  await query(
    `UPDATE outbox_events
      SET status = CASE WHEN attempts + 1 >= 5 THEN 'dead_letter' ELSE 'pending' END,
          attempts = attempts + 1,
          locked_at = NULL
      WHERE id = $1`,
    [id]
  );
};
