import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "../db/client.js";
import { processIngestionBatch } from "../ingestion/worker.js";
import { processOutboxBatch } from "../jobs/outboxProcessor.js";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { deployCanary, registerModelApproval, triggerRetrainJob, validateFeatures } from "../ml/lifecycle.js";
import { buildRollbackPlan } from "../release/rollback.js";

export const adminRouter = Router();

adminRouter.post("/outbox/process", authenticate, requirePermission("admin:outbox"), async (req, res) => {
  const limit = z.coerce.number().int().min(1).max(100).default(20).parse(req.query.limit);
  const result = await processOutboxBatch(limit);
  res.json({ ok: true, ...result });
});

adminRouter.post("/jobs/enqueue", authenticate, requirePermission("admin:jobs"), async (req, res) => {
  const body = z
    .object({ jobType: z.enum(["ocr", "parse_document", "parse_bpmn"]), payload: z.record(z.any()) })
    .parse(req.body);

  const id = randomUUID();
  await query("INSERT INTO ingestion_jobs (id, job_type, payload, status) VALUES ($1, $2, $3, 'queued')", [
    id,
    body.jobType,
    JSON.stringify(body.payload)
  ]);

  res.status(201).json({ id, queued: true });
});

adminRouter.post("/jobs/process", authenticate, requirePermission("admin:jobs"), async (req, res) => {
  const limit = z.coerce.number().int().min(1).max(100).default(20).parse(req.query.limit);
  const processed = await processIngestionBatch(limit);
  res.json({ processed });
});

adminRouter.post("/release/rollback-plan", authenticate, requirePermission("admin:jobs"), (req, res) => {
  const body = z.object({ currentVersion: z.string(), previousStableVersion: z.string() }).parse(req.body);
  res.json(buildRollbackPlan(body.currentVersion, body.previousStableVersion));
});

adminRouter.post("/ml/approvals", authenticate, requirePermission("admin:jobs"), async (req, res) => {
  const body = z
    .object({ modelName: z.string(), modelVersion: z.string(), status: z.enum(["approved", "rejected"]), notes: z.string().optional() })
    .parse(req.body);
  const approvedBy = req.user?.email ?? "unknown@local";
  const id = await registerModelApproval(body.modelName, body.modelVersion, approvedBy, body.status, body.notes);
  res.status(201).json({ id });
});

adminRouter.post("/ml/feature-validation", authenticate, requirePermission("admin:jobs"), async (req, res) => {
  const body = z.object({ modelName: z.string(), modelVersion: z.string(), report: z.record(z.any()) }).parse(req.body);
  const result = await validateFeatures(body.modelName, body.modelVersion, body.report);
  res.json(result);
});

adminRouter.post("/ml/canary", authenticate, requirePermission("admin:jobs"), async (req, res) => {
  const body = z.object({ modelName: z.string(), modelVersion: z.string(), trafficPercent: z.number().int().min(1).max(50) }).parse(req.body);
  const id = await deployCanary(body.modelName, body.modelVersion, body.trafficPercent);
  res.status(201).json({ id, status: "running" });
});

adminRouter.post("/ml/retrain", authenticate, requirePermission("admin:jobs"), async (req, res) => {
  const body = z.object({ modelName: z.string(), reason: z.string().min(5) }).parse(req.body);
  const id = await triggerRetrainJob(body.modelName, body.reason);
  res.status(201).json({ id, status: "queued" });
});

adminRouter.post("/incidents", authenticate, requirePermission("admin:jobs"), async (req, res) => {
  const body = z.object({ severity: z.enum(["sev1", "sev2", "sev3"]), component: z.string(), summary: z.string(), details: z.record(z.any()) }).parse(req.body);
  const id = randomUUID();
  await query(
    "INSERT INTO incident_events (id, severity, component, summary, details, status) VALUES ($1, $2, $3, $4, $5, 'open')",
    [id, body.severity, body.component, body.summary, JSON.stringify(body.details)]
  );
  res.status(201).json({ id, status: "open" });
});
