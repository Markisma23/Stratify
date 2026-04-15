import { Router } from "express";
import multer from "multer";
import { appendAuditLog } from "../db/repositories/auditRepo.js";
import { createUploadedFileRecord } from "../db/repositories/filesRepo.js";
import { authenticate, requirePermission } from "../middleware/auth.js";

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

export const filesRouter = Router();

filesRouter.post("/upload", authenticate, requirePermission("files:upload"), upload.array("files", 10), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const uploaderEmail = req.user?.email ?? "unknown@local";

  const uploaded = await Promise.all(
    files.map(async (file) =>
      createUploadedFileRecord({
        uploaderEmail,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        ingestionStatus: "QUEUED"
      })
    )
  );

  await appendAuditLog(uploaderEmail, "files.upload", "uploaded_files", { count: uploaded.length });
  res.json({ uploaded });
});
