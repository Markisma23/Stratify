import { Router } from "express";
import { z } from "zod";
import { anonymizePii } from "../compliance/pii.js";
import { env } from "../config/env.js";
import { appendAuditLog } from "../db/repositories/auditRepo.js";
import { addHitlCorrection, listEntities, replaceEntitiesForDoc } from "../db/repositories/entitiesRepo.js";
import { authenticate } from "../middleware/auth.js";
import { nlpExtractRemote } from "../ml/serviceClients.js";
import { extractEntities, mapToOntology } from "../nlp/pipeline.js";

export const documentsRouter = Router();

documentsRouter.post("/:docId/extract", authenticate, async (req, res) => {
  const text = z.object({ text: z.string().min(20), mode: z.enum(["local", "remote"]).default("remote") }).parse(req.body);
  const docId = req.params.docId;

  const sanitized = anonymizePii(text.text);

  const extracted =
    text.mode === "remote"
      ? (await nlpExtractRemote(sanitized)).entities.map((e) => ({ type: e.type as "OBJECTIVE" | "INITIATIVE" | "KPI" | "ROLE", value: e.value, confidence: e.confidence }))
      : extractEntities(sanitized);

  const entities = extracted.map((entity) => ({
    ...entity,
    ontologyCode: mapToOntology(entity.value)
  }));

  await replaceEntitiesForDoc(docId, entities);
  await appendAuditLog(req.user?.email ?? "unknown@local", "documents.extract", docId, {
    entities: entities.length,
    mode: text.mode,
    mlService: env.ML_SERVICE_URL
  });

  res.json({ docId, entities });
});

documentsRouter.get("/:docId/entities", authenticate, async (req, res) => {
  const rows = await listEntities(req.params.docId);
  res.json({ docId: req.params.docId, entities: rows });
});

documentsRouter.post("/:docId/entities/:entityId/corrections", authenticate, async (req, res) => {
  const body = z.object({ correctedValue: z.string().min(2), reason: z.string().optional() }).parse(req.body);
  await addHitlCorrection(req.params.entityId, req.user?.email ?? "unknown@local", body.correctedValue, body.reason);
  await appendAuditLog(req.user?.email ?? "unknown@local", "documents.correction", req.params.docId, body);
  res.json({ ok: true });
});
