import { Router } from "express";
import { z } from "zod";
import { createGdprRequest, fulfillGdprRequest, listGdprRequests } from "../compliance/gdpr.js";
import { appendAuditLog } from "../db/repositories/auditRepo.js";
import { authenticate, requirePermission } from "../middleware/auth.js";

export const complianceRouter = Router();

complianceRouter.post("/gdpr/request", authenticate, async (req, res) => {
  const body = z.object({ type: z.enum(["export", "delete"]), reason: z.string().optional() }).parse(req.body);
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: "Unauthorized" });

  const id = await createGdprRequest(email, body.type, body.reason);
  await appendAuditLog(email, "compliance.gdpr.request", id, body);
  res.status(201).json({ id, status: "pending" });
});

complianceRouter.get("/gdpr/requests", authenticate, requirePermission("admin:jobs"), async (_req, res) => {
  const requests = await listGdprRequests();
  res.json({ requests });
});

complianceRouter.post("/gdpr/requests/:id/fulfill", authenticate, requirePermission("admin:jobs"), async (req, res) => {
  const body = z.object({ action: z.enum(["export-complete", "delete-complete"]), evidence: z.record(z.any()) }).parse(req.body);
  const completedBy = req.user?.email ?? "unknown@local";
  const fulfillmentId = await fulfillGdprRequest(req.params.id, body.action, completedBy, body.evidence);
  await appendAuditLog(completedBy, "compliance.gdpr.fulfill", req.params.id, { fulfillmentId, ...body });
  res.json({ fulfillmentId, status: "completed" });
});
