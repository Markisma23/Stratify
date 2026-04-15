import { randomUUID } from "node:crypto";
import { query } from "../client.js";
import { enqueueOutboxEvent } from "./outboxRepo.js";
import { withTransaction } from "../transaction.js";

type ActionInput = {
  interventionId: string;
  owner: string;
  milestone: string;
  targetKpi: string;
  priority: "high" | "medium" | "low";
};

export const createFramework = async (projectId: string, ownerEmail: string, actions: ActionInput[]) => {
  const frameworkId = randomUUID();

  await withTransaction(async (client) => {
    await client.query(
      "INSERT INTO frameworks (id, project_id, owner_email, status) VALUES ($1, $2, $3, $4)",
      [frameworkId, projectId, ownerEmail, "DRAFT"]
    );

    for (const action of actions) {
      await client.query(
        `INSERT INTO framework_actions (id, framework_id, intervention_id, action_owner, milestone, target_kpi, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [randomUUID(), frameworkId, action.interventionId, action.owner, action.milestone, action.targetKpi, action.priority]
      );
    }

    await enqueueOutboxEvent(client, "framework.created", frameworkId, {
      projectId,
      ownerEmail,
      actionsCount: actions.length
    });
  });

  return frameworkId;
};

type FrameworkRow = {
  id: string;
  project_id: string;
  owner_email: string;
  status: string;
};

type ActionRow = {
  intervention_id: string;
  action_owner: string;
  milestone: string;
  target_kpi: string;
  priority: "high" | "medium" | "low";
};

export const getFrameworkById = async (id: string) => {
  const frameworkResult = await query<FrameworkRow>(
    "SELECT id, project_id, owner_email, status FROM frameworks WHERE id = $1 LIMIT 1",
    [id]
  );

  const framework = frameworkResult.rows[0];
  if (!framework) {
    return null;
  }

  const actionsResult = await query<ActionRow>(
    "SELECT intervention_id, action_owner, milestone, target_kpi, priority FROM framework_actions WHERE framework_id = $1",
    [id]
  );

  return {
    id: framework.id,
    projectId: framework.project_id,
    ownerEmail: framework.owner_email,
    status: framework.status,
    actions: actionsResult.rows.map((action) => ({
      interventionId: action.intervention_id,
      owner: action.action_owner,
      milestone: action.milestone,
      targetKpi: action.target_kpi,
      priority: action.priority
    }))
  };
};
