import { randomUUID } from "node:crypto";
import { query } from "../db/client.js";

export const registerModelApproval = async (modelName: string, modelVersion: string, approvedBy: string, status: string, notes?: string) => {
  const id = randomUUID();
  await query(
    `INSERT INTO model_approvals (id, model_name, model_version, approved_by, approval_status, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, modelName, modelVersion, approvedBy, status, notes ?? null]
  );
  return id;
};

export const deployCanary = async (modelName: string, modelVersion: string, trafficPercent: number) => {
  const id = randomUUID();
  await query(
    `INSERT INTO ml_canary_deployments (id, model_name, model_version, traffic_percent, status)
     VALUES ($1, $2, $3, $4, 'running')`,
    [id, modelName, modelVersion, trafficPercent]
  );
  return id;
};

export const validateFeatures = async (modelName: string, modelVersion: string, report: Record<string, unknown>) => {
  const id = randomUUID();
  const missing = Array.isArray(report.missing) ? report.missing.length : 0;
  const drifted = Array.isArray(report.drifted) ? report.drifted.length : 0;
  const isValid = missing === 0 && drifted < 3;

  await query(
    `INSERT INTO feature_validation_reports (id, model_name, model_version, report, is_valid)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, modelName, modelVersion, JSON.stringify(report), isValid]
  );

  return { id, isValid };
};

export const triggerRetrainJob = async (modelName: string, reason: string) => {
  const id = randomUUID();
  await query("INSERT INTO ml_retrain_jobs (id, model_name, reason, status) VALUES ($1, $2, $3, 'queued')", [id, modelName, reason]);
  return id;
};
