import { Router } from "express";
import { z } from "zod";
import { appendAuditLog } from "../db/repositories/auditRepo.js";
import { createRecommendationRun } from "../db/repositories/recommendationsRepo.js";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { recordDriftMetric } from "../ml/driftMonitor.js";
import { recommendRemote } from "../ml/serviceClients.js";
import { rankHybrid } from "../recommender/hybrid.js";

const RequestSchema = z.object({
  projectId: z.string().min(1),
  mode: z.enum(["local", "remote"]).default("remote"),
  signals: z
    .array(
      z.object({
        category: z.enum(["people", "process", "performance"]),
        severity: z.enum(["low", "medium", "high"]),
        title: z.string().min(3)
      })
    )
    .min(1)
});

export const recommendationsRouter = Router();

recommendationsRouter.post("/generate", authenticate, requirePermission("recommendations:generate"), async (req, res) => {
  const payload = RequestSchema.parse(req.body);

  const computed =
    payload.mode === "remote"
      ? await recommendRemote(payload.signals)
      : (() => { const local = rankHybrid(payload.signals); return { recommendations: local, modelVersion: local[0]?.modelVersion ?? "heuristic-v1" }; })();

  const runId = await createRecommendationRun(
    payload.projectId,
    req.user?.email ?? "unknown@local",
    payload.signals,
    computed.modelVersion
  );

  const topConfidence = computed.recommendations[0]?.confidence ?? 0;
  await recordDriftMetric("recommender", "top_confidence_inverse", 1 - topConfidence, 0.4);

  await appendAuditLog(req.user?.email ?? "unknown@local", "recommendations.generate", payload.projectId, {
    runId,
    modelVersion: computed.modelVersion,
    mode: payload.mode
  });

  res.json({
    runId,
    projectId: payload.projectId,
    modelVersion: computed.modelVersion,
    recommendations: computed.recommendations
  });
});
