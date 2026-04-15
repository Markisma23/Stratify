import { Router } from "express";
import { z } from "zod";
import { detectChangePoints, pearson, upliftEstimate } from "../analytics/kpiAnalytics.js";
import { appendAuditLog } from "../db/repositories/auditRepo.js";
import { upsertKpiSeries } from "../db/repositories/kpisRepo.js";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { recordDriftMetric } from "../ml/driftMonitor.js";
import { analyticsRemote } from "../ml/serviceClients.js";

const KPIUploadSchema = z.object({
  kpiId: z.string().min(1),
  unit: z.string().min(1),
  points: z
    .array(
      z.object({
        timestamp: z.string().datetime(),
        value: z.number()
      })
    )
    .min(1)
});

const AnalyzeSchema = z.object({
  seriesA: z.array(z.number()).min(2),
  seriesB: z.array(z.number()).min(2),
  pre: z.array(z.number()).min(1),
  post: z.array(z.number()).min(1),
  mode: z.enum(["local", "remote"]).default("remote")
});

export const kpisRouter = Router();

kpisRouter.post("/upload", authenticate, requirePermission("kpis:upload"), async (req, res) => {
  const payload = KPIUploadSchema.parse(req.body);
  const persisted = await upsertKpiSeries(payload.kpiId, payload.unit, payload.points);
  const latest = payload.points[payload.points.length - 1];

  await appendAuditLog(req.user?.email ?? "unknown@local", "kpis.upload", payload.kpiId, { records: persisted.records });

  res.json({
    kpiId: payload.kpiId,
    records: persisted.records,
    latest,
    validation: "PASSED",
    changePoints: detectChangePoints(payload.points.map((p) => ({ t: p.timestamp, v: p.value })))
  });
});

kpisRouter.post("/analyze", authenticate, requirePermission("kpis:upload"), async (req, res) => {
  const payload = AnalyzeSchema.parse(req.body);

  const result =
    payload.mode === "remote"
      ? await analyticsRemote(payload)
      : {
          correlation: pearson(payload.seriesA, payload.seriesB),
          uplift: upliftEstimate(payload.pre, payload.post),
          changePoints: []
        };

  await recordDriftMetric("kpi-analytics", "correlation_abs", Math.abs(result.correlation), 0.95);

  res.json(result);
});
