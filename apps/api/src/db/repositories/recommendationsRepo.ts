import { randomUUID } from "node:crypto";
import { withTransaction } from "../transaction.js";
import { enqueueOutboxEvent } from "./outboxRepo.js";
import type { GapSignal } from "../../services/recommender.js";

export const createRecommendationRun = async (
  projectId: string,
  requesterEmail: string,
  signals: GapSignal[],
  modelVersion: string
) => {
  const id = randomUUID();

  await withTransaction(async (client) => {
    await client.query(
      "INSERT INTO recommendations_runs (id, project_id, requester_email, payload, model_version) VALUES ($1, $2, $3, $4, $5)",
      [id, projectId, requesterEmail, JSON.stringify({ signals }), modelVersion]
    );

    await enqueueOutboxEvent(client, "recommendations.generated", id, {
      projectId,
      requesterEmail,
      signalsCount: signals.length,
      modelVersion
    });
  });

  return id;
};
