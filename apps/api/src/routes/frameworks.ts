import { Router } from "express";
import { z } from "zod";
import { appendAuditLog } from "../db/repositories/auditRepo.js";
import { createFramework, getFrameworkById } from "../db/repositories/frameworksRepo.js";
import { exportDocx, exportPdf } from "../exports/frameworkExport.js";
import { signArtifact } from "../exports/signing.js";
import { persistImmutableArtifact } from "../exports/storage.js";
import { authenticate, requirePermission } from "../middleware/auth.js";

const FrameworkSchema = z.object({
  projectId: z.string().min(1),
  actions: z
    .array(
      z.object({
        interventionId: z.string(),
        owner: z.string(),
        milestone: z.string(),
        targetKpi: z.string(),
        priority: z.enum(["high", "medium", "low"])
      })
    )
    .min(1)
});

export const frameworksRouter = Router();

frameworksRouter.post("/", authenticate, requirePermission("frameworks:create"), async (req, res) => {
  const payload = FrameworkSchema.parse(req.body);
  const id = await createFramework(payload.projectId, req.user?.email ?? "unknown@local", payload.actions);
  await appendAuditLog(req.user?.email ?? "unknown@local", "frameworks.create", id, payload);
  res.status(201).json({ id, ...payload, status: "DRAFT" });
});

frameworksRouter.get("/:id/export", authenticate, requirePermission("frameworks:export"), async (req, res) => {
  const id = req.params.id;
  const format = z.enum(["docx", "pdf", "json"]).parse(req.query.format);
  const brandColor = z.string().default("4F46E5").parse(req.query.brandColor);
  const framework = await getFrameworkById(id);

  if (!framework) {
    return res.status(404).json({ message: "Framework not found" });
  }

  if (format === "json") {
    return res.json(framework);
  }

  const body = framework.actions
    .map((a, idx) => `${idx + 1}. ${a.interventionId} | Owner: ${a.owner} | Milestone: ${a.milestone}`)
    .join("; ");

  const path =
    format === "pdf" ? await exportPdf(`Framework ${id}`, body, `#${brandColor}`) : await exportDocx(`Framework ${id}`, body, brandColor);

  const immutablePath = await persistImmutableArtifact(path);
  const signature = await signArtifact(id, format, immutablePath);

  await appendAuditLog(req.user?.email ?? "unknown@local", "frameworks.export", id, { format, path, signature });

  return res.json({
    id,
    format,
    artifactPath: immutablePath,
    signature
  });
});
